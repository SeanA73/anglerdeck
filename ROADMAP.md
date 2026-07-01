# AnglerDeck — Production Readiness Roadmap

A sequenced plan to take AnglerDeck from "Lovable scaffold + working features" to "live with multiple revenue streams." Phases are ordered so each one unblocks the next; **do not skip ahead**. Estimates assume one developer working part-time.

**Current state, as of June 2026:**
- ✅ Phase 1 complete — security hardening, RLS lockdown, ai-chat secured, ProtectedRoute, AnglerDeck rename
- ✅ Phase 2.1-2.5 complete — Stripe SDK, products/prices, checkout session function, webhook handler, Pricing page wired
- 🟡 Phase 2.6 outstanding — Customer portal link
- 🟡 Phase 2.7 outstanding — Remove "14-day free trial" FAQ
- ⏭️ Phases 3-10 to follow
- ⚠️ 26 npm vulnerabilities (Phase 4.1)
- ⚠️ Main bundle is 666 KB (205 KB gzipped) — needs code splitting (Phase 4.2)

---

## Stage Map — Sequenced path to full vision

**Constraints documented for future sessions:**
- 10-15 hrs/week available development time
- $50-200/month marketing budget post-launch
- Phase 5 (testing), Phase 6 (most observability), Phase 7.4 (deep a11y), Phase 4 (perf beyond bundle splits), marketing email infrastructure, and advanced PWA features are **deferred to post-launch**, not skipped permanently

**Sequenced stages from now to full revenue model:**

| When | Stage | Focus | Outcome |
|---|---|---|---|
| Weeks 1-3 | Stage 1: Launch | Finish Phase 2.6/2.7, then Phase 3, 4 (essentials), 6 (Sentry only), 7 (basic), 8 | AnglerDeck live with subscriptions, real money flowing |
| Weeks 4-9 | Stage 2: Traffic | Content sprint (30+ spots, 10 articles), soft launch, Bass Pro/Booking.com affiliate applications, wire AffiliateProductCard | ~300-500 users, 2-3 affiliate programs approved |
| Weeks 10-17 | Stage 3: Marketplace MVP | Phase 10 — Marketplace rebuild with Stripe Connect, listings, orders, manual moderation | Marketplace live, 3 revenue streams active |
| Weeks 18+ | Stage 4: Compound | Amazon + AdSense applications, Phase 5 testing, Phase 7.4 a11y, marketing emails | Full vision active, all revenue streams compounding |

**Inviolable constraints (cannot be rushed regardless of effort):**

- **Amazon Associates** — must make 3 qualifying sales within 180 days of approval, or you're terminated and cannot reapply. Apply ONLY when you have ~100+ active users and proven affiliate traffic from other programs first.
- **Google AdSense** — manual review of applications, requires content depth (30+ pages), traffic history, and policy compliance. Apply after Stage 2 content sprint complete.
- **Marketplace trust/safety** — Stripe Connect identity verification + listing flow + order management cannot be built in less than 6 weeks done properly. Cutting corners here creates real money/legal problems.

---

## Phase 1 — Critical security & paywall ✅ COMPLETE

**Goal:** stop the bleeding. After Phase 1, free users can't make themselves Elite, anonymous users can't write to your DB, and your AI endpoint stops being a free-credits dispenser.

### 1.1 Subscriptions UPDATE policy ✅ DONE
Dropped broad UPDATE policy. Only Stripe webhook (service role) writes to subscriptions table.

### 1.2 RLS lockdown across all user-owned tables ✅ DONE
catch_logs, posts, post_likes, post_comments, spot_reviews, review_votes, storage buckets, affiliate_products, water_conditions_cache, offline_maps, spot_views — all secured with proper INSERT/UPDATE/DELETE policies.

### 1.3 Subscription auto-create trigger ✅ DONE
Migration 20260202030000 installed. New user signup auto-creates `subscriptions` row with tier='free'.

### 1.4 ai-chat edge function secured ✅ DONE
JWT verification, tier check (pro/elite only), rate limiting, CORS restricted to anglerdeck.com + localhost. Switched from Lovable AI gateway to OpenAI direct (gpt-4o-mini).

### 1.5 Hardcoded Supabase fallback removed ✅ DONE
src/integrations/supabase/client.ts now throws on missing env vars.

### 1.6 ProtectedRoute wrapper ✅ DONE
/account, /catches, /community now require auth, redirect to /auth?next=<path> with open-redirect guard.

---

## Phase 2 — Stripe payments 🟡 IN PROGRESS

**Goal:** real payments and tier sync working end-to-end.

### 2.1 Install Stripe SDKs ✅ DONE
@stripe/stripe-js and stripe packages installed.

### 2.2 Stripe Dashboard setup ✅ DONE
AnglerDeck Pro ($9.99/mo, $95.90/yr) and AnglerDeck Elite ($29.99/mo, $287.90/yr) products created in test mode. 4 price IDs added to .env.local and Supabase secrets. 20% annual discount math applied.

### 2.3 create-checkout-session edge function ✅ DONE
Deployed with JWT verify, tier+interval validation, already-subscribed check, Stripe Checkout session creation with user_id metadata. Verified working end-to-end.

### 2.4 stripe-webhook edge function ✅ DONE
Deployed with --no-verify-jwt flag, signature verification via constructEventAsync, handles checkout.session.completed / customer.subscription.updated / customer.subscription.deleted, uses service-role client to bypass RLS. Verified: real test payment with card 4242 successfully updated Supabase row from tier='free' to tier='pro' automatically.

### 2.5 Pricing page wired ✅ DONE
src/lib/checkout.ts fixed (renamed billingPeriod→interval at network boundary). Clicking Upgrade to Pro/Elite redirects to Stripe Checkout, completes payment, redirects back to /account?upgrade=success, webhook syncs subscription state.

### 2.6 Customer portal link 🟡 TODO
Need to:
- Build `create-portal-session` edge function (referenced from Account.tsx:207-208 but doesn't exist)
- Use stripe.billingPortal.sessions.create() with return URL = /account
- Wire existing button in Account.tsx to invoke this function
**Estimated: 15-20 minutes.**

### 2.7 Remove "14-day free trial" FAQ 🟡 TODO
Delete the FAQ entry in Pricing.tsx that promises a trial we don't actually offer.
**Estimated: 2 minutes.**

### 2.8 KNOWN GAP — proper upgrade/downgrade flow
Current create-checkout-session blocks duplicate same-tier subscriptions but allows parallel Pro+Elite subscriptions, which would charge users twice. Real fix uses Stripe's subscription update API for tier transitions. Deferred to Phase 8 (pre-launch).

---

## Phase 3 — Code quality cleanup

**Goal:** clean lint, no dead code, no `any`. **Estimated: half a day.**

### 3.1 Auto-fix what's safe
```bash
npm run lint -- --fix
```

### 3.2 Eliminate the remaining `any` / empty-interface errors
- `ErrorBoundary.tsx:37` — `errorInfo: any` → `errorInfo: React.ErrorInfo`
- `marketplace/CreateListingDialog.tsx:173` — (deleted during marketplace removal, may not exist)
- `stripe.ts` — already typed via @stripe/stripe-js
- `ui/command.tsx:24` and `ui/textarea.tsx:5` — empty interfaces; delete or add marker property

### 3.3 Address remaining warnings
- `react-refresh/only-export-components` in shadcn files — disable rule for ui/ folder via flat-config override
- `react-hooks/exhaustive-deps` in useOnboarding.ts, useReviewVotes.ts, useSpotReviews.ts — wrap functions in useCallback

### 3.4 Delete .bak files
```bash
rm src/components/AIRecommendations.tsx.bak \
   src/components/WaterConditionsDashboard.tsx.bak \
   src/lib/aiRecommendations.ts.bak \
   src/lib/pushNotifications.ts.bak \
   src/lib/waterConditions.ts.bak
```

### 3.5 Add env-var validation
New file: `src/lib/env.ts` using zod (already a dependency):
```ts
import { z } from 'zod';
const Env = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  VITE_STRIPE_PRICE_PRO_MONTHLY: z.string().startsWith('price_'),
  VITE_STRIPE_PRICE_PRO_YEARLY: z.string().startsWith('price_'),
  VITE_STRIPE_PRICE_ELITE_MONTHLY: z.string().startsWith('price_'),
  VITE_STRIPE_PRICE_ELITE_YEARLY: z.string().startsWith('price_'),
  VITE_SITE_URL: z.string().url(),
});
export const env = Env.parse(import.meta.env);
```

### 3.6 Clean up README
Replace Lovable boilerplate with real AnglerDeck setup instructions, env-var docs, link to this roadmap. Replace any `REPLACE_WITH_PROJECT_ID` placeholders.

---

## Phase 4 — Dependencies & build ✅ COMPLETE

**Goal:** no known CVEs in prod deps, faster initial load.

### 4.1 Patch vulnerabilities ✅ DONE
Ran `npm audit fix` — reduced from 26 vulnerabilities (2 low, 8 moderate, 15 high, 1 critical) to 2 (1 moderate, 1 high). Fixes applied via patch/minor bumps within existing package.json ranges: @babel/* 7.29.0 → 7.29.7, react-router 6.30.1 → 6.30.4 (XSS via open redirect), vite 5.4.19 → 5.4.21, vitest 3.2.4 → 3.2.6 (critical UI server RCE), postcss 8.5.6 → 8.5.16, rollup 4.24.0 → 4.62.2, plus transitive deps.

**Deferred:** esbuild ≤ 0.24.2 (dev-server can serve source code cross-origin). Fix requires Vite 5 → 8 major bump. Dev-time only. Real impact very low (source is public on GitHub anyway). Added to Phase 8 pre-launch checklist.

### 4.2 Route-based code splitting ✅ ALREADY DONE
`src/App.tsx` already uses `React.lazy()` around every page import with a `<Suspense>` fallback showing a spinner. All page-level chunks split correctly at build time (Auth, Account, Pricing, Spots, SpotDetail, MapView, FishingAssistant, LeafletMap, CommunityFeed, CatchLog, plus the smaller legal/support pages). No further action needed — the work happened in an earlier session before this roadmap phase was reached.

### 4.3 manualChunks configuration ⚠️ ATTEMPTED, REVERTED
Attempted list-based `manualChunks` config in `vite.config.ts` grouping React/Radix/Supabase/Stripe/utils vendors. Result: main chunk GREW from 666KB → 721KB with no vendor chunks appearing. Reverted the config. Root cause not diagnosed — likely conflict with Vite's automatic chunking heuristics.

The main chunk at 721KB (218KB gzipped) is dominated by React + Radix (many primitives via shadcn) + Supabase client + TanStack Query + Framer Motion, all imported eagerly through AuthProvider/TooltipProvider/QueryClient in App.tsx. Further reduction would require refactoring AuthProvider to defer Supabase imports. Not worth the churn given Stage 1 launch focus.

### 4.4 Update browserslist ✅ DONE
Ran `npm update caniuse-lite baseline-browser-mapping` to silence build warning. Note: `npx update-browserslist-db@latest` crashed on Bun v1.2.23 on Windows; falling back to plain npm was the fix.

---

## Phase 5 — Testing (DEFERRED TO POST-LAUNCH)

Per Stage Map decision: deferred to Stage 4 (Weeks 18+). The current single test asserting `true === true` should be deleted, but new tests wait until bugs start mattering.

When you return to this phase, focus on:
- `hasFeatureAccess()` tier × feature matrix
- `useSubscription.hasReachedLimit()` boundary cases
- Pricing component smoke test
- ProtectedRoute redirect behavior
- Edge function tests (ai-chat auth, stripe-webhook signature verification)

---

## Phase 6 — Observability & ops

**Goal:** when something breaks in prod, you find out before the user emails you. **Launch scope only: Sentry. Defer rest to Stage 4.**

### 6.1 Error tracking 🟡 DEFERRED (user decision)
Add Sentry free tier to main.tsx and edge functions. Replace console.error calls with Sentry.captureException.
**Estimated: 1 hour.**

**Deferred to post-launch by user decision.** Trade-off: launch without visibility into user-facing errors. Bugs may go undetected until users complain. Revisit BEFORE any real marketing push — running paid ads to a broken app while blind to errors is much worse than launching quietly and adding observability once traffic starts.

### 6.2 Analytics (DEFERRED)
PostHog/Plausible — post-launch.

### 6.3 Uptime monitoring (DEFERRED)
UptimeRobot or Better Stack — post-launch. For now, Supabase + Vercel dashboards are sufficient.

### 6.4 Logging cleanup (DEFERRED)
Remaining console.log calls — post-launch.

---

## Phase 7 — Polish for launch

**Goal:** the things a user notices in the first 60 seconds. **Estimated: 1 day for launch essentials.**

### 7.1 Loading & empty states (LAUNCH ESSENTIAL)
Audit every page that fetches data. Loading skeleton, empty state with CTA, error state with retry button.

### 7.2 SEO basics (LAUNCH ESSENTIAL)
- `<title>` and `<meta description>` per page (react-helmet-async)
- OpenGraph + Twitter card tags
- public/robots.txt
- sitemap.xml generated at build time
- Schema.org markup for spots

### 7.3 Legal pages (LAUNCH ESSENTIAL)
Privacy.tsx, Terms.tsx, Cookies.tsx, Licenses.tsx — read through, remove Lovable boilerplate, mention Stripe/Supabase as sub-processors, real "last updated" date.

### 7.4 Accessibility pass (DEFERRED — basic only at launch)
**Launch scope:** alt text, semantic HTML, keyboard-focusable buttons. Quick pass only.
**Full WCAG AA audit:** post-launch.

### 7.5 Mobile responsive audit (LAUNCH ESSENTIAL)
Pricing cards, map view, AI assistant chat are the most likely to break on small screens.

---

## Phase 8 — Pre-launch checklist

Run through these the day before flipping DNS:

- [ ] Stripe in live mode (not test), webhook signing secret is the live one
- [ ] Supabase project on paid plan (free tier pauses after 1 week inactive)
- [ ] All env vars set in production hosting
- [ ] Custom domain SSL working
- [ ] Email deliverability verified (Supabase auth emails landing in inbox — needs custom SMTP via Resend/Postmark)
- [ ] Database backups enabled in Supabase dashboard
- [ ] Stripe tax settings configured for Australia (ABN registered for GST)
- [ ] One end-to-end test: sign up → subscribe to Pro → use AI feature → cancel → verify tier downgrades on next period end
- [ ] Existing test subscriptions cancelled in Stripe live mode
- [ ] **Implement proper upgrade/downgrade flow (Phase 2.8 deferred item)** — use Stripe's subscription update API for tier transitions to prevent duplicate parallel subscriptions
- [ ] Upgrade Vite 5 → 8 to close remaining esbuild dev-server vulnerability (deferred from Phase 4.1 — dev-time only, low real impact, but should be done before public launch)
- [ ] Reconsider Sentry (Phase 6.1) — you deferred this. Before any paid marketing spend, add Sentry so you can see bugs users hit. Free tier is 5,000 errors/month, ~1 hour setup.

---

## Phase 9 — Path B Multi-Revenue Layer (Affiliate + AdSense)

**Goal:** layer affiliate marketing + Google AdSense onto the subscription foundation. **Estimated: ~3 weeks at 10-15 hrs/week. Stage 2 work (Weeks 4-9).**

⚠️ **Critical timing constraints (Stage Map):**
- **Amazon Associates** — defer until ~100+ users + proven affiliate clicks from other programs. The 180-day-3-sales rule means premature applications get terminated permanently.
- **AdSense** — defer until 30+ content pages exist and analytics shows real organic traffic.
- **Bass Pro Shops & Booking.com** — apply early (Week 4-5), easier approval.

### 9.A Affiliate Marketing

#### 9.A.1 Eligibility prep
Build these BEFORE applying:
- 30+ real spot detail pages with photos, descriptions, fishing reports
- 10+ long-form articles (gear guides, technique tutorials, regional reports)
- Active user-generated content on 30%+ of spots
- Working catch logging used by real users
- 30 days of analytics data

#### 9.A.2 Application order

Apply in this order, ~1 week apart:

1. **Bass Pro Shops / Cabela's Affiliate** (Week 4-5) — fishing-specific authority, easier approval
2. **Booking.com Affiliate** (Week 5-6) — accommodation links for fishing trip pages
3. **Tackle Warehouse Affiliate** (Week 6-7) — specialized fishing retailer
4. **Amazon Associates** (Week 10+, after Stage 2 traffic proves out) — largest catalog, biggest risk

#### 9.A.3 Click tracking infrastructure

`affiliate_products` and `affiliate_clicks` tables already exist with Phase 1 RLS. Need:

1. Redirect endpoint `/go/:product_id`:
   - Insert row into affiliate_clicks with user_id, product_id, clicked_at, referrer_path
   - Append affiliate tag to outbound URL (different per program)
   - 302-redirect to target URL
   - Capture referrer for placement analytics

2. Attribution cookie on first click for cross-session attribution

3. Wire existing `AffiliateProductCard` component (rescued during marketplace removal) to use redirect endpoint

#### 9.A.4 Product curation

50-100 hand-picked products initially:
- Categorized by: species, technique, gear type, price tier
- Each: title, description (own words), image URL, affiliate URL with tag, commission rate, retailer
- Update quarterly
- Recommend gear you would actually buy, not highest commission

#### 9.A.5 Placement surfaces

Start with these, add more based on analytics:

- **Spot detail page** — "Gear locals use here" 3-5 products contextual to spot type
- **Catch log entry** — "Tackle similar to what worked" based on species + technique
- **Dedicated /shop page** — curated lists by species/technique
- **Newsletter** — monthly "gear pick" featured product (highest converting)

#### 9.A.6 Disclosure compliance

Non-negotiable:
- Static disclosure on any page with affiliate links: "As an Amazon Associate I earn from qualifying purchases."
- Update Privacy Policy to disclose affiliate relationships and cookie usage
- Update Terms of Service to reference affiliate compensation
- FTC (US) and Australian Consumer Law require transparency

### 9.B Google AdSense

#### 9.B.1 Eligibility prep
- 30+ substantive pages (spot details, articles, guides)
- 30+ days of organic traffic
- Real privacy policy + terms of service
- No copyright-violating content
- No prohibited niches

#### 9.B.2 Application
Apply via https://www.google.com/adsense — ~1-2 weeks review. Common rejection reasons: insufficient content, low traffic, missing policy pages.

#### 9.B.3 Placement integration

Use the existing `AdBanner` component (already in build at AdBanner-D03mPf_6.js). Tier-gated logic already present — Pro/Elite see no ads.

Surfaces for free tier:
- Spot list page (rectangle ad between rows, every 6-8 items)
- Community feed (between posts, every 4-5 posts)
- Article pages (in-content, top + middle + bottom)
- /shop page (sidebar)

#### 9.B.4 Performance optimization
- Track viewable impressions vs paid impressions (Auto Ads optimization)
- A/B test placement densities quarterly
- Disable ads on pages with low fill rate

### 9.C Tier-gating refinements

Pro and Elite users see no ads (already implemented). Additional ad-free surfaces:
- Catch log entry forms
- Account/Settings pages
- Checkout/billing flows
- Customer support pages

### 9.D Realistic revenue expectations

- Bass Pro / Tackle Warehouse: 5-8% commission, lower conversion
- Amazon: 3-4.5% commission for "Sports & Outdoors", high conversion
- AdSense: $1-5 per 1000 impressions in fishing niche
- Typical Year 1: $50-500/month combined affiliate + ads
- Year 2-3 with established traffic: $500-3000/month

Affiliate + ads complement subscriptions, don't replace them.

---

## Phase 10 — Marketplace Rebuild (Path C Foundation)

**Goal:** rebuild the user-to-user gear marketplace that was removed during Phase 1 security work, but properly secured this time. **Estimated: 6-8 weeks at 10-15 hrs/week. Stage 3 work (Weeks 10-17).**

⚠️ **Critical scoping reality:** A real marketplace requires payment infrastructure (Stripe Connect), trust mechanisms (reviews, moderation), and operational support (disputes, refunds). The MVP defined below is genuinely lean — but it cannot be compressed below 6 weeks without compromising user safety.

**What this MVP includes:** Listings, browsing, checkout, basic order management, manual moderation, reviews.

**What this MVP does NOT include:** Shipping label generation, automated escrow, real-time chat between buyers/sellers, advanced fraud detection, scheduled auctions, "buy it now" vs "best offer", multi-currency, international shipping support.

### 10.A Foundation (Weeks 10-11)

#### 10.A.1 Database schema (re-add tables)

Re-create tables that were dropped during Phase 1, with proper RLS this time:
- `vendors` — vendor profiles, ABN, payout info, Stripe Connect account ID
- `gear_listings` — title, description, price, category, condition, images, vendor_id, status
- `orders` — buyer_id, vendor_id, listing_id, amount, commission, status, shipping_address
- `product_reviews` — buyer_id, vendor_id, order_id, rating, body, created_at
- `gear_categories` — predefined categories (rods, reels, lures, etc.)

All tables: RLS enabled, proper INSERT/UPDATE/DELETE policies tied to auth.uid() or admin role.

#### 10.A.2 Stripe Connect setup

- Enable Stripe Connect in dashboard (Standard accounts — simplest)
- Build vendor onboarding flow: vendor clicks "Become a seller" → creates Stripe Connect account → completes Stripe-hosted KYC → returns to AnglerDeck with verified status
- Store stripe_account_id on vendors table

### 10.B Operations (Weeks 12-13)

#### 10.B.1 Listing creation flow
- Vendor-only access (must have verified Stripe Connect account)
- Re-add `CreateListingDialog` component (was removed in Phase 1)
- Image upload to existing `gear-images` Supabase Storage bucket
- Form validation: required fields, price > 0, max 8 images

#### 10.B.2 Browse + search
- Re-add Marketplace.tsx page
- Re-add `GearListingCard` component
- Category filters, price range filters, condition filters
- Search by title/description
- Pagination

#### 10.B.3 Checkout flow
- "Buy now" button → Stripe Checkout with destination charges to vendor's connected account
- 8-12% platform commission (industry standard for gear marketplaces)
- Buyer shipping address collected at checkout
- Order row inserted on successful payment
- Email notifications to vendor (new order) and buyer (order confirmation)

### 10.C Trust & Safety (Weeks 14-15)

#### 10.C.1 Manual moderation
- New listings hidden until admin approves
- Admin dashboard (basic — just a list of pending listings with approve/reject buttons)
- Report listing button for users
- Block user functionality

#### 10.C.2 Order management
- Vendor sees their incoming orders
- Buyer sees their purchase history
- Status transitions: paid → shipped → delivered → completed
- "Mark as shipped" button for vendors
- "Confirm received" button for buyers (triggers payment release after delay)

#### 10.C.3 Reviews and ratings
- Buyers can review after order completion
- 1-5 star rating + text review
- Vendor profile shows aggregate rating + recent reviews

#### 10.C.4 Dispute basics
- "Open dispute" button on order page
- Disputes go to admin email for manual resolution
- Refund triggered via Stripe (transfers reversed from vendor's connected account)
- More sophisticated dispute flow deferred to Stage 4

### 10.D Revenue model

- **Platform commission:** 8-12% per sale, deducted automatically via Stripe Connect destination charges
- **Listing fees:** $0 for MVP. Consider $1-2 per listing post-launch if needed for spam control.
- **Promoted listings:** $5-10 to bump to top of category for 7 days. Defer to Stage 4.
- **Vendor subscriptions:** Premium vendor tier ($20-50/month) with lower commission, analytics, priority support. Defer to Stage 4.

### 10.E Soft launch (Weeks 16-17)

- Launch marketplace to existing subscribed users first (closed beta)
- Onboard 5-10 trusted sellers (friends, fishing club members)
- Monitor first 50 orders manually
- Iterate based on real friction points
- Public launch after 2 weeks of stable operations

---

## Suggested order — Sequenced plan reference

This roadmap reflects the Stage Map decision (10-15 hrs/week, $50-200/mo marketing budget). For aggressive sprint-style execution, see "Stage Map" at top of file.

**Current status:** Phase 1 done, Phase 2.1-2.5 done. Resume at Phase 2.6.

**Week 1-3 (Stage 1 Launch):**
1. Phase 2.6 (customer portal) + 2.7 (FAQ cleanup) — ~2 hrs
2. Phase 3 essentials (lint, .bak cleanup, env validation) — ~6 hrs
3. Phase 4.1 + 4.2 (audit fix + code splitting) — ~6 hrs
4. Phase 6.1 (Sentry only) — ~1 hr
5. Phase 7.1-7.3 + 7.5 (loading states, SEO, legal pages, mobile audit) — ~12 hrs
6. Phase 8 (live mode launch checklist) — ~10 hrs

**Week 4-9 (Stage 2 Traffic):** Content sprint + Phase 9.A.1-9.A.6 (affiliate prep through wiring)

**Week 10-17 (Stage 3 Marketplace):** Phase 10 A-E

**Week 18+ (Stage 4 Compound):** Phase 5 testing, Phase 6.2-6.4, Phase 7.4, marketing emails, Amazon + AdSense applications

Phases 5, 6.2-6.4, 7.4, and marketing email are explicitly post-launch — they make the product better but don't block opening the doors.