# ReelSpot — Production Readiness Roadmap

A sequenced plan to take ReelSpot from "Lovable scaffold + working features" to "safe to launch and charge money." Phases are ordered so each one unblocks the next; **do not skip ahead**. Estimates assume one developer working part-time.

**Current state, verified on this build:**
- ✅ Production build succeeds
- ✅ TypeScript typecheck clean (0 errors)
- ⚠️ ESLint: 7 errors, 14 warnings
- ⚠️ `npm audit`: 11 vulnerabilities (4 moderate, 7 high) in prod deps
- ⚠️ Main bundle is 1.16 MB (337 KB gzipped) — needs code splitting
- 🔴 Multiple critical security & paywall issues (Phase 1)

---

## Phase 1 — Critical security & paywall (BLOCKER for public launch)

**Goal:** stop the bleeding. After Phase 1, free users can't make themselves Elite, anonymous users can't write to your DB, and your AI endpoint stops being a free-credits dispenser. **Estimated: 1–2 days.**

### 1.1 Fix the subscriptions UPDATE policy
**File:** `supabase/migrations/20260128040109_*.sql` (and the duplicate in `20260126_monetization_features.sql`)
**Problem:** `USING (auth.uid() = user_id)` with no `WITH CHECK` lets users set their own `tier` to `'elite'` from the browser.
**Fix:** create a new migration that drops the broad UPDATE policy and replaces it with one that forbids client-side changes to billing-controlled fields:
```sql
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
-- Don't add a replacement. Only the Stripe webhook (service role) should
-- ever write to this table. The webhook bypasses RLS by design.
```
Acceptance: a logged-in user calling `supabase.from('subscriptions').update({ tier: 'elite' })` from devtools gets a permission error.

### 1.2 Lock down every wide-open RLS policy
**Files:** all migrations in `supabase/migrations/`
**Problem:** dozens of policies use `WITH CHECK (true)` or `USING (true)` on write paths, including catch_logs, posts, comments, likes, spot_reviews, gear_listings, and the `catch-photos` / `gear-images` storage buckets. Anonymous users can spam, vandalize, or delete others' content.
**Fix:** create a corrective migration that, for every user-owned table:
- `INSERT`: `WITH CHECK (auth.uid() = user_id)`
- `UPDATE`: `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`
- `DELETE`: `USING (auth.uid() = user_id)`
- For storage buckets: `WITH CHECK (bucket_id = '...' AND auth.uid()::text = (storage.foldername(name))[1])` and upload to user-scoped paths like `userId/filename.jpg`.

Acceptance: anonymous Supabase requests to these tables return 401/permission denied.

### 1.3 Reconcile the duplicate `subscriptions` schema
**Files:** `20260126_monetization_features.sql` and `20260128040109_*.sql`
**Problem:** both define `public.subscriptions` with different PK defaults and column sets. On a fresh DB the second errors; on the existing one you have an indeterminate schema.
**Fix:** pick `20260128040109_*` as canonical (it matches `useSubscription.ts`), delete the subscriptions table block from `20260126_monetization_features.sql`. Verify with `supabase db reset` against a fresh local DB.

### 1.4 Add auth + tier check to `ai-chat` edge function
**File:** `supabase/functions/ai-chat/index.ts`
**Problem:** no JWT verification, no tier check. Anyone can hit the function URL and burn your Lovable AI credits.
**Fix:**
1. Read `Authorization: Bearer <jwt>` header, verify with `createClient(url, anonKey).auth.getUser(jwt)`.
2. If no user → 401.
3. Query `subscriptions` for that user (using the service role client so it sees the row regardless of RLS); if `tier` not in `('pro', 'elite')` → 403.
4. Add per-user rate limit (simple: insert into an `ai_chat_log` table with timestamp, count last 60s, reject if > N).
5. Restrict CORS from `*` to your production domain(s).

Acceptance: curl with no auth → 401. Free user → 403. Pro/Elite user → streams response.

### 1.5 Remove hardcoded Supabase fallback
**File:** `src/integrations/supabase/client.ts`
**Problem:** project ID and anon JWT baked into source as `FALLBACK_*` constants.
**Fix:**
```ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase env vars — check .env');
}
```
Acceptance: running with empty `.env` fails loudly at startup, not silently against your prod DB.

### 1.6 Protect authenticated-only routes
**File:** `src/App.tsx`
**Problem:** `/account`, `/catches`, `/community` are accessible without login (they break inside, but they shouldn't be reachable).
**Fix:** add a `<ProtectedRoute>` wrapper component that checks `useAuth().user` and redirects to `/auth?next=<path>` if null. Apply to `/account`, `/catches`, and any route that calls `supabase` for user-scoped data.

---

## Phase 2 — Make Stripe actually work

**Goal:** you can take real payments and tiers update automatically. **Estimated: 2–3 days.**

### 2.1 Install Stripe SDKs
```bash
npm install @stripe/stripe-js stripe
```
Uncomment the real `loadStripe` code in `src/lib/stripe.ts` and delete the stub.

### 2.2 Set up Stripe dashboard
Create real products and prices in the Stripe dashboard for Pro Monthly, Pro Yearly, Elite Monthly, Elite Yearly. Copy the four `price_xxx` IDs into `src/lib/stripe.ts` replacing `'price_pro_monthly'` etc. Use `import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY` so test/live keys can swap.

### 2.3 Build `create-checkout-session` edge function
New file: `supabase/functions/create-checkout-session/index.ts`. Verify JWT, accept `{ tier, interval }`, look up the matching price ID, create a Stripe Checkout session with `customer_email` from the JWT and `metadata: { user_id }`, return the session URL.

### 2.4 Build `stripe-webhook` edge function
New file: `supabase/functions/stripe-webhook/index.ts`. Handle:
- `checkout.session.completed` → upsert subscription row with `tier`, `stripe_customer_id`, `stripe_subscription_id`, `current_period_end`.
- `customer.subscription.updated` → update tier/status/period_end.
- `customer.subscription.deleted` → set tier=`'free'`, status=`'canceled'`.

Use the Supabase service role key here so writes bypass RLS (the policy from 1.1 blocks user-side writes).
**Critical:** verify the webhook signature with `stripe.webhooks.constructEvent` and the webhook secret — without this, anyone can POST fake events.

### 2.5 Wire the Pricing page
**File:** `src/pages/Pricing.tsx`
Replace the no-op `handleSubscribe`:
```ts
const handleSubscribe = async (tier: 'pro' | 'elite') => {
  if (!user) { navigate('/auth?next=/pricing'); return; }
  const { data } = await supabase.functions.invoke('create-checkout-session', {
    body: { tier, interval: isAnnual ? 'yearly' : 'monthly' }
  });
  window.location.href = data.url;
};
```

### 2.6 Build the customer portal link
Add a "Manage subscription" button in `Account.tsx` that calls a `create-portal-session` edge function returning Stripe's hosted billing portal URL. This handles cancellation, card updates, invoice downloads with zero UI work.

### 2.7 Remove the "14-day free trial" claim from Pricing.tsx FAQ
Either delete the FAQ entry or implement trials via `trial_period_days` on the Checkout session. Don't ship a promise you can't fulfill.

---

## Phase 3 — Code quality cleanup

**Goal:** clean lint, no dead code, no `any`. **Estimated: half a day.**

### 3.1 Auto-fix what's safe
```bash
npm run lint -- --fix
```
This fixes `prefer-const` in `stripe.ts:6` and `Spots.tsx:34`.

### 3.2 Eliminate the remaining 5 `any` / empty-interface errors
- `ErrorBoundary.tsx:37` — `errorInfo: any` → `errorInfo: React.ErrorInfo`
- `marketplace/CreateListingDialog.tsx:173` — type the actual data shape
- `stripe.ts:6` — `Promise<any>` → `Promise<Stripe | null>` after installing the SDK
- `ui/command.tsx:24` and `ui/textarea.tsx:5` — empty interfaces extending another type; either delete the interface (use the parent type directly) or add a marker property

### 3.3 Address the 14 warnings
- Most are `react-refresh/only-export-components` in shadcn files where utilities live alongside components — low priority, only affects HMR. You can disable the rule for the `ui/` folder via a flat-config override.
- `react-hooks/exhaustive-deps` in `useOnboarding.ts`, `useReviewVotes.ts`, `useSpotReviews.ts` — wrap the functions in `useCallback` and add them to the dep array. These are real bugs waiting to happen on re-renders.

### 3.4 Delete the 5 `.bak` files
```bash
rm src/components/AIRecommendations.tsx.bak \
   src/components/WaterConditionsDashboard.tsx.bak \
   src/lib/aiRecommendations.ts.bak \
   src/lib/pushNotifications.ts.bak \
   src/lib/waterConditions.ts.bak
```
None are imported anywhere. If you want the code back, that's what git history is for.

### 3.5 Add env-var validation
New file: `src/lib/env.ts` using `zod` (already a dependency):
```ts
import { z } from 'zod';
const Env = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  // ...
});
export const env = Env.parse(import.meta.env);
```
Import `env` everywhere instead of `import.meta.env`. Build fails immediately on missing config.

### 3.6 Clean up the README
Replace the Lovable boilerplate with real setup instructions, env-var docs, and a link to this roadmap. Replace `REPLACE_WITH_PROJECT_ID` everywhere.

---

## Phase 4 — Dependencies & build

**Goal:** no known CVEs in prod deps, faster initial load. **Estimated: half a day.**

### 4.1 Patch the 11 vulnerabilities
```bash
npm audit fix
```
Most are in transitive deps (`picomatch`, `postcss`, `ws`, `yaml`) — `audit fix` should resolve them without breaking changes. Re-run `npm run build` and `npm test` to confirm nothing broke. If `audit fix` wants to do a major version bump, evaluate manually before accepting.

### 4.2 Code-split the main bundle
Currently 1.16 MB → split routes with `React.lazy`:
```ts
const SpotDetail = lazy(() => import('./pages/SpotDetail'));
const MapView = lazy(() => import('./pages/MapView'));
// wrap <Routes> in <Suspense fallback={<Spinner />}>
```
Leaflet (already a separate chunk at 158 KB) is your biggest win. Target: initial JS < 300 KB gzipped.

### 4.3 Configure `manualChunks` in `vite.config.ts`
Group vendors:
```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        'ui-vendor': ['@radix-ui/react-dialog', /* etc */],
        'supabase': ['@supabase/supabase-js'],
      }
    }
  }
}
```

### 4.4 Update browserslist data
```bash
npx update-browserslist-db@latest
```

---

## Phase 5 — Testing

**Goal:** the things that can lose users money are covered by tests. **Estimated: 1–2 days.**

You currently have one test asserting `true === true`. That's worse than nothing because it gives false confidence.

### 5.1 Critical-path tests (write these first)
- `hasFeatureAccess()` — every tier × every feature, plus invalid tier handling.
- `useSubscription.hasReachedLimit()` — boundary cases (exactly at limit, one over, infinity).
- `getAnnualPrice()` / `getAnnualDiscount()` — discount math, including edge case of $0 free tier.
- `AuthContext` — sign-in, sign-up, sign-out, session restoration, profile fetch error handling.

### 5.2 Component smoke tests
- `<Pricing>` renders all three tiers, switches monthly↔annual, calls `handleSubscribe` on click.
- `<ProtectedRoute>` redirects unauthenticated users.
- `<FishingAssistant>` doesn't render for free users.

### 5.3 Edge function tests
Use Deno's built-in test runner. Mock the Stripe SDK and Lovable AI gateway. Verify:
- `ai-chat` rejects requests with no JWT.
- `ai-chat` rejects free-tier users.
- `stripe-webhook` rejects requests with invalid signatures.
- `stripe-webhook` correctly upserts subscriptions on `checkout.session.completed`.

### 5.4 Delete the placeholder test
`src/test/example.test.ts` — remove it once you have real tests.

---

## Phase 6 — Observability & ops

**Goal:** when something breaks in prod, you find out before the user emails you. **Estimated: half a day.**

### 6.1 Error tracking
Add Sentry (or PostHog, or LogRocket) to `main.tsx` and to all edge functions. Replace the 20 `console.error` calls scattered across the codebase with `Sentry.captureException`.

### 6.2 Analytics
Add a privacy-friendly analytics tool (Plausible, Umami, or PostHog). Critical events to track:
- Sign-up funnel completion
- Pricing page → checkout click → checkout success
- AI assistant usage (count + latency)
- 4xx/5xx response rates from edge functions

### 6.3 Uptime monitoring
Free tier of UptimeRobot or Better Stack pinging `/` and `/api/health` (build the latter — a simple edge function returning `{ status: 'ok' }`).

### 6.4 Logging cleanup
Replace remaining `console.log` calls in `useSubscription.ts:237,241` and elsewhere with proper logging. Console statements shipping in prod is a code smell.

---

## Phase 7 — Polish for launch

**Goal:** the things a user notices in the first 60 seconds. **Estimated: 1 day.**

### 7.1 Loading & empty states
Audit every page that fetches data. Make sure each has: a loading skeleton (not a spinner), an empty state with a clear CTA, and an error state with a retry button.

### 7.2 SEO basics
- `<title>` and `<meta description>` per page (use `react-helmet-async`)
- OpenGraph + Twitter card tags
- `public/robots.txt` allowing your prod domain
- A `sitemap.xml` generated at build time
- Schema.org markup for spots (LocalBusiness or TouristAttraction)

### 7.3 Legal pages
`Privacy.tsx`, `Terms.tsx`, `Cookies.tsx`, `Licenses.tsx` exist — read them through, replace any Lovable boilerplate, make sure they actually describe what ReelSpot does, mention Stripe/Supabase as sub-processors, and have a real "last updated" date.

### 7.4 Accessibility pass
Run Lighthouse and axe DevTools on the top 5 pages. Fix any contrast issues, missing alt text, missing form labels. Target Lighthouse a11y score ≥ 90.

### 7.5 Mobile responsive audit
Pricing cards, map view, and the AI assistant chat are the most likely to break on small screens. Test on actual devices, not just devtools resize.

---

## Phase 8 — Pre-launch checklist

Run through these the day before you flip the DNS:

- [ ] Stripe is in live mode (not test), webhook signing secret is the live one
- [ ] Supabase project is on a paid plan (free tier pauses after 1 week inactive)
- [ ] All env vars set in Vercel/Netlify/wherever you're hosting
- [ ] Custom domain SSL working
- [ ] Email deliverability verified (Supabase auth emails landing in inbox, not spam — usually needs a custom SMTP via Resend/Postmark)
- [ ] Database backups enabled in Supabase dashboard
- [ ] Stripe tax settings configured for your jurisdiction
- [ ] One end-to-end test: sign up → subscribe to Pro → use AI feature → cancel → verify tier downgrades on next period end

---
## Phase 9 — Affiliate marketing integration

**Goal:** monetize traffic through curated affiliate product placements without compromising user experience. **Estimated: 1-2 weeks of part-time work, but DON'T START until 30 days post-launch.**

⚠️ **Critical timing constraint.** Amazon Associates terminates accounts that fail to make 3 qualifying sales within 180 days of approval. Once terminated, you cannot reapply. **Do not apply until the app has steady real-user traffic** (target: ~100+ active users / ~1000+ monthly sessions). Applying early to "get a head start" is the most common way new app builders permanently lose their affiliate eligibility.

### 9.1 Eligibility prep (before applying)

Build these BEFORE applying to any program:
- 20+ real spot detail pages with photos, descriptions, fishing reports
- Active user-generated content (catch logs, reviews) on at least 30% of spots
- Working catch logging flow that's been used by real users
- Functional spot reviews flow
- 30 days of analytics data showing real traffic patterns

### 9.2 Affiliate program applications

Apply in this order, one at a time, ~1 week apart:

1. **Amazon Associates** (primary - largest fishing product catalog, broad audience)
   - Country: choose based on user base (likely .com.au for Australian users; .com for US users)
   - If app has users in both regions, apply to both — they're separate accounts with separate tags
2. **Bass Pro Shops / Cabela's Affiliate** (secondary - fishing-specific authority)
3. **Tackle Warehouse Affiliate** (tertiary - specialized fishing retailer)

Skip ClickBank (mostly digital info products, poor fit for outdoor app).

### 9.3 Click tracking infrastructure

The `affiliate_products` and `affiliate_clicks` tables already exist with Phase 1 RLS policies. Need to:

1. Build a redirect endpoint: `/go/:product_id` that:
   - Inserts a row into `affiliate_clicks` with `user_id`, `product_id`, `clicked_at`, `referrer_path`
   - Appends affiliate tag to outbound URL (different per program)
   - 302-redirects to the target URL with affiliate parameters
   - Captures referrer path so you know which page drove the click

2. Build basic attribution: store affiliate tag as a cookie on first click, so subsequent purchases get credited.

3. Wire `AffiliateProductCard` component (already exists, rescued during marketplace removal) to use this redirect endpoint instead of linking directly.

### 9.4 Product curation

You need a real product catalog, not placeholder data:

- 50-100 hand-picked products initially
- Categorized by: species (bass, trout, walleye, panfish, saltwater), technique (jigging, trolling, fly), gear type (rods, reels, lures, line, terminal tackle), price tier
- Each product needs: title, description (your own words, not Amazon's), image URL (must respect Amazon's image policy), affiliate URL with your tag, commission rate, retailer
- Update the catalog quarterly

Curation philosophy: recommend gear YOU would actually buy, not what pays the highest commission.

### 9.5 Placement surfaces

- **Spot detail page** — "Gear locals use here" section, 3-5 products contextual to spot type
- **Catch log entry** — "Tackle similar to what worked" recommendations based on species + technique
- **Dedicated /shop page** — curated lists by species/technique
- **Newsletter** — monthly "gear pick" featured product (highest converting placement)

Start with spot detail + catch log only. Add /shop later based on what's actually clicking.

### 9.6 Disclosure compliance (legally required)

Non-negotiable:

- Add static disclosure to any page with affiliate links: "As an Amazon Associate I earn from qualifying purchases."
- Update Privacy Policy to disclose affiliate relationships and cookie usage
- Update Terms of Service to reference affiliate compensation
- FTC (US) and Australian Consumer Law require transparency for AU users

This isn't optional. Non-compliance can result in account termination and FTC fines.

### 9.7 Performance tracking

Track clicks per product/category/placement, conversion rate, EPC (earnings per click). A/B test placements quarterly. Cull bottom performers.

### 9.8 Realistic revenue expectations

- Most fishing affiliate sites earn $50-500/month in the first year
- Strong sites with good traffic + curation can hit $1000-5000/month after 2-3 years
- Amazon commission rates: 3-4.5% for "Sports & Outdoors"
- Bass Pro / Tackle Warehouse: 5-8% but lower traffic conversion

Affiliate is a long-tail revenue stream that compounds with traffic. Don't expect to replace Stripe subscriptions — affiliate complements them.

---

## Suggested order if you only have a week

Tightest critical-path version, in priority order:

1. **Day 1:** Phase 1 entirely (security + paywall). Non-negotiable.
2. **Day 2-3:** Phase 2 (Stripe). Without this you can't make money.
3. **Day 4 morning:** Phase 3 (lint + cleanup). Fast wins.
4. **Day 4 afternoon:** Phase 4 (deps + bundle). `npm audit fix` is a one-liner.
5. **Day 5:** Phase 5.1 only (critical-path tests for paywall and auth). Skip the rest until post-launch.
6. **Day 6:** Phase 6.1 + 6.3 (Sentry + uptime). Skip the rest.
7. **Day 7:** Phase 7 (polish) and Phase 8 (launch checklist).

Phases 5.2–5.4, 6.2, 6.4, and 7.4–7.5 are post-launch improvements — they make the product better but they don't block opening the doors.
