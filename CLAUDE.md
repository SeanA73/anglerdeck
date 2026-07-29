# AnglerDeck — project context for Claude Code

Fishing spot guide at [anglerdeck.com](https://anglerdeck.com). Launched July 2026.
Vite + React + TypeScript SPA, Supabase backend, Stripe subscriptions, deployed
to a Hostinger VPS behind nginx. See `DEPLOY.md` for infrastructure detail.

Sean is not an angler — this is a content/revenue project. He relies on research
rather than first-hand knowledge, which shapes several rules below.

---

## Non-negotiable content rules

These exist because the site makes factual claims people act on, and because
fabricated content would cost the AdSense account.

1. **Never invent facts about a place.** Access details, ramps, parking,
   facilities — if it can't be traced to an official park, council or fisheries
   page, leave the field NULL. A blank section renders nothing; a wrong one
   sends someone to a ramp that doesn't exist.
2. **Every access record carries `sourceUrl`.** No source, no claim.
3. **Regulations stay high-level.** State licence requirements and closed
   seasons where verified, always with a "check current rules" pointer. Never
   add specific bag or size numbers — they change constantly and go stale.
4. **Never write or commission a fake review.** Spot pages emit
   `AggregateRating` structured data, so fabricated ratings are a Google
   structured-data policy violation, not just dishonest.
5. **Don't claim features that don't ship.** The pricing page was rewritten in
   July 2026 to remove advertised features that didn't exist (offline maps,
   analytics dashboard, CSV export, tide predictions, a 14-day trial). Elite is
   deliberately "Coming Soon" and its checkout path is disabled until it has
   real functionality.

---

## Architecture notes

**Spots live in Supabase**, not in code. `src/data/spots.ts` holds only the
`FishingSpot` type and the image-key mapping. Read spots via `@/hooks/useSpots`.
192 spots across 19 countries.

**Prerendering.** `scripts/prerender.mjs` runs after `vite build` and writes
real static HTML per route into `dist/`, because the SPA alone serves crawlers
an empty shell. It fetches spots and reviews from Supabase, injects head tags,
JSON-LD `Place` schema (plus `AggregateRating` when reviews exist), and a
crawlable body. Falls back gracefully when Supabase is unreachable.

**Indexing quality gate.** `scripts/spot-quality.mjs` scores each spot; only
those scoring >= 5 are indexed. Everything else is prerendered with
`noindex,follow` and excluded from the sitemap, so the two signals agree. Used
by both `prerender.mjs` and `vite.config.ts` — never let them diverge. Verified
access detail is worth +2, angler reviews +2 (and +1 more at three reviews).
Spots promote themselves as their data improves; no code change needed.

**Units and locale.** Use `getVisitorCountryStrict()` (timezone only) for
anything where a wrong guess is worse than none — measurement units especially.
`navigator.language` is unreliable: a large share of non-US users browse as
`en-US`. `getVisitorCountry()` keeps a locale fallback and is fine for soft
personalisation like pre-selecting a country filter.

**Ads.** `AdBanner` hides ads from Pro and Elite subscribers and waits for the
subscription to load before deciding, so paying users never see a flash. Auto
ads **must stay off** in the AdSense console — the loader in `index.html` only
loads the library; enabling Auto ads would let Google inject ads for paying
users. Consent Mode v2 defaults are set in `src/main.tsx` before any Google tag.

**Tides** are deliberately `N/A` and the tide card is hidden. There is no tide
feed. Don't invent one.

---

## Deploy

Env vars are baked in at build time, so edit `.env.production` on the VPS
*before* building.

```bash
# local (PowerShell 5 — no && chaining)
git add <paths>
git commit -m "..."
git push origin main

# VPS
cd /var/www/anglerdeck && git pull origin main && npm run build
```

Migrations in `supabase/migrations/` are applied by hand through the Supabase
SQL Editor — there is no automated migration runner.

---

## Work in progress

### 1. Access details — 39 spots remaining

`spots.access` is a jsonb column (see `20260729_add_spot_access.sql` for the
shape). Seven of the 48 indexed spots are done: Tongariro, Madison, Kenai, Bow
River, Test, Tweed, Spey.

Remaining, roughly in order of how likely official sources are to exist:

- **Good odds** — Lake Taupō and Bay of Islands (NZ DOC), Campbell River and
  Miramichi (BC/NB provincial), Islamorada and Venice LA (state agencies),
  Cape Point and Sodwana (SANParks/iSimangaliso), Masurian Lakes and Vistula
  (PZW), Lake Saimaa and Tornio (Metsähallitus), Lofoten (Norwegian tourism
  boards), Lake Garda and Po (regional).
- **Access-model only** — Alta, Jurassic Lake, Río Grande, Kamchatka, Kola,
  Ponoi, Rio Negro, Agua Boa. These are lodge- or outfitter-only; the honest
  and useful record is "no public road access, fished exclusively through
  licensed lodges booked well in advance". That is a real fact, not padding.
- **Likely thin** — Strait of Gibraltar, Ebro, Rhine, Loire, Brittany, Tokyo
  Bay, Ascension Bay. Record what's verifiable, leave the rest NULL.

Write results as `UPDATE public.spots SET access = '{...}'::jsonb, updated_at =
now() WHERE slug = '...';` in a new dated file under `supabase/migrations/`,
for Sean to run manually.

### 2. Review moderation — not yet built

`spot_reviews` has no approval/status column, so reviews publish instantly.
Before contributor outreach generates volume, add a moderation flag and a
review queue in `src/pages/admin/AdminModeration.tsx` (which already reads the
table). Only approved reviews should count toward the quality gate or appear in
prerendered HTML.

### 3. Contributor rewards — manual by design

Three helpful reports earn a free month of Pro, stated in the reviews empty
state. Granting is deliberately manual (set `tier = 'pro'` in `subscriptions`)
until there's enough real contribution to justify automating it. If automating
later, don't overwrite Stripe state — add a separate `comped_pro_until` column
and resolve the effective tier at read time.

### 4. AdSense — do not request review yet

Site status is "Requires review" and Sean has *not* submitted. `ads.txt` and
the loader are live; publisher ID `pub-2356680512865218`. The site should be
deepened first — a reviewer today sees 192 pages from one template with 144
noindexed. Low-value content is the most common rejection reason.

A **certified CMP** is still required before serving ads to EEA/UK visitors.
Consent Mode signals are correct but the in-house banner is not certified;
Google's own funding-choices tool is the usual free answer.

### 5. Other open items

- Main JS bundle is ~735 kB (222 kB gzipped). Code-splitting would help LCP.
- Sentry was deferred; add before any paid marketing.
- `src/data/spotSlugs.ts` is only a build-time fallback for the sitemap now —
  the live list comes from Supabase.
- A quarterly data refresh runs as a scheduled task (1 Jan/Apr/Jul/Oct):
  seasonal water temperatures for all spots, plus a rotating regional
  regulations audit.
