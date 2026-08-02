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

**Migration first, then build. Permanently.** The build reads the live
database, so a build that runs ahead of its migration queries columns that do
not exist yet. PostgREST answers a filter on a missing column with HTTP 400 —
it does not ignore the filter — and the build's fallback is an empty result, so
the failure surfaces as content quietly disappearing rather than as a build
error. `20260802_add_review_moderation.sql` is the worked example: every review
read path filters `status=eq.approved`, and against a pre-migration database
that returns 400, then zero reviews, and any spot that earned +2 from a review
drops back under `INDEX_THRESHOLD` and out of the index. `prerender.mjs` and
`vite.config.ts` now warn loudly on that 400 instead of swallowing it, but a
smoke alarm is not a fix — the build still ships wrong. Apply the SQL, confirm
it, then `git pull && npm run build`.

---

## Work in progress

### 1. Access details — ongoing

`spots.access` is a jsonb column (see `20260729_add_spot_access.sql` for the
shape).

**Never hardcode progress counts in this file — they go stale within a session.**
Run `node scripts/access-audit.mjs` instead. It reads the live database through
the same quality gate the build uses, and reports which spots lack access detail
plus what adding it would do to each score.

Do not use `featured = true` as shorthand for "indexed". It selects exactly the
indexed set today, but only by luck: the best non-featured spot scores 4 against
a threshold of 5, and a first review and an access record are each worth +2. The
first non-featured spot to gain either breaks the equivalence — and the work in
this section is what will break it. The gate is `spotScore() >= INDEX_THRESHOLD`
in `scripts/spot-quality.mjs`, never a column.

Also worth knowing before bulk-filling access: **every** currently-noindexed
spot would cross the threshold on access detail alone. Completing all of them
would index the whole 192-page site at once, which is the opposite of the
slow-growth behaviour the gate exists to produce, and badly timed against the
AdSense review in item 4. Promote deliberately, not exhaustively.

Unapplied migration files may already cover a spot — Sean runs them by hand, so
the DB lags the repo, and `access-audit.mjs` reports the database. Check the
dated `*_access_*.sql` files before re-researching anything.

Validate a batch with `node scripts/check-access-migration.mjs <file>` before it
goes to the SQL Editor. It enforces the content rules mechanically: JSON parses,
`sourceUrl` present and https, slug exists, no duplicate UPDATEs, at least one
field the quality gate actually counts, and a warning on anything resembling a
bag or size limit.

**When an access record contradicts the existing regulations, fix both.** The
access source is usually more specific than whatever was used to write the
regulations originally, so contradictions are common and look careless on the
page. Two worked examples: Yarrawonga's regulations said only "Murray cod closed
season Sep 1 – Nov 30" when the VFA closes that entire stretch to *all* fishing
across the same months; and Nikkō's implied fish could be kept when Lake Yunoko
is catch-and-release only. Both are the kind of error a reader could be fined
for following.

For the current remaining list, run `access-audit.mjs` — do not trust any
enumeration written here. Broadly, what is left divides into spots with real
agencies that simply have not been attempted, and the access-model group below.
- **Access-model only** — Jurassic Lake, Río Grande, Kamchatka, Kola, Rio
  Negro. Lodge- or outfitter-only; the honest and useful record is "no public
  road access, fished exclusively through licensed lodges booked well in
  advance". That is a real fact, not padding. Ponoi and Agua Boa share the
  model but are not currently indexed, so they rank lower.
- **Fetcher-blocked, not source-blocked** — Bay of Islands only. Miramichi,
  Campbell River, Tokyo Bay and Sydney Harbour have since been written using a
  real browser and are done.

  What the blocks actually turned out to be, since the diagnosis matters more
  than the symptom: New Brunswick sits behind Cloudflare bot protection *and*
  had moved the page (the old URL 404s). MPI restructured — Northland rules now
  live under "Auckland and Kermadec". Campbell River does publish ramp detail,
  but on individual park pages rather than a boat-launch index. The Japan
  Fisheries Agency has a perfectly readable English HTML page for foreign
  nationals; only the PDF is binary. In every case the fix was a real browser
  plus a fresh URL, not a missing source. Assume the same before concluding a
  site "doesn't publish" something.

A worked lesson on sourcing: guide sites, forums and local papers universally
place Islamorada's public boat ramp at Founders Park. The Village's own pages
show Founders Park is signed *no fishing*, and the ramp is at Plantation Yacht
Harbor Marina, on different hours and a different fee. Official page or NULL —
the consensus of unofficial sources is not a source.

**Always check for health and contamination advisories**, especially on urban,
industrial or post-industrial water. These are published by health or fisheries
departments, are rarely mentioned on guide sites, and are the most genuinely
useful thing a spot page can carry. Sydney Harbour is the worked example: NSW
advises eating *no* fish caught west of the Harbour Bridge and limiting catches
east of it to 150 g a month, following dioxin contamination traced to Homebush
Bay sediments — commercial fishing there has been banned since 2006. Candidates
worth checking include the Elbe at Hamburg, the Tiber in Rome, the Vistula, the
Po, the Rhine, Lagoa dos Patos and the Detroit-adjacent Great Lakes waters.

Write results as `UPDATE public.spots SET access = '{...}'::jsonb, updated_at =
now() WHERE slug = '...';` in a new dated file under `supabase/migrations/`,
for Sean to run manually.

### 2. Review moderation — shipped and verified

`spot_reviews.status` is `pending | approved | rejected`, defaulting to
`pending`. Nothing reaches the public, the prerendered HTML, `AggregateRating`
or the quality gate until an admin approves it in
`src/pages/admin/AdminModeration.tsx`.

`20260802_add_review_moderation.sql` was applied to production on 2 Aug 2026.
Both triggers exist and are enabled, and the insert path was tested against a
real non-admin account rather than inferred from the DDL — recipe below. The
migration-before-build ordering that this shipped with is now recorded as a
standing rule under Deploy, since it is not specific to this change.

Four read paths filter on status, and `spot-quality.mjs` trusts them: it never
queries, it only consumes `reviewCount`. The filters live in `prerender.mjs`,
`vite.config.ts` and `access-audit.mjs`, plus RLS for the client. Adding a fifth
reader means adding a fifth filter — there is no central chokepoint.

RLS returns approved rows to everyone, plus the viewer's own review whatever its
state, so an author can see their submission is queued rather than assume it
vanished. `useSpotReviews` therefore computes the average and count from
approved rows only; the fetched list and the public rating are deliberately not
the same set.

Moderation is enforced by triggers, not policies. RLS is row-level, so the
existing "author can insert/update own row" policies would otherwise let a
contributor submit or edit straight to `approved`.
`force_review_pending_on_insert` and `enforce_review_moderation` close that, and
the latter also returns an edited approved review to the queue — otherwise
"get approved, then rewrite" is an unmoderated path onto an indexed page.

**Admins bypass moderation, so granting admin is a content decision, not just
a permissions one.** Both trigger functions exempt `public.is_admin()`: a
review an admin submits keeps whatever status it was submitted with and
publishes instantly, and an admin's edit to a live review does not return it to
the queue. That is correct while Sean is the only admin — the sole moderator
should not have to approve himself, and there is nobody else to review him. It
stops being correct the moment a second admin exists, because `role = 'admin'`
in `profiles` then also means "may publish unreviewed content straight onto an
indexed page that emits `AggregateRating`". Before adding an admin, either
accept that, or narrow the exemption from the role to a specific user id.

**Verifying the triggers — must run as a non-admin.** There are two ways this
check passes for the wrong reason and looks like proof. A plain insert in the
SQL Editor runs with `auth.uid() IS NULL`, which the triggers exempt as
service-role. Impersonating `(SELECT id FROM auth.users LIMIT 1)` looks like it
fixes that, but it typically returns the owner's account — an admin, also
exempt. Both return `approved` from a perfectly working trigger. Pick a known
non-admin UUID explicitly:

```sql
BEGIN;
SELECT set_config('request.jwt.claims',
                  '{"sub":"<NON-ADMIN-UUID>","role":"authenticated"}',
                  true);
SET LOCAL role authenticated;

INSERT INTO public.spot_reviews (spot_id, user_id, author_name, rating, content, status)
VALUES ((SELECT id FROM public.spots LIMIT 1),
        '<NON-ADMIN-UUID>',
        'Trigger check', 5, 'rollback test', 'approved')
RETURNING status;   -- expect 'pending'

ROLLBACK;
```

Three details that produce confusing failures rather than clear ones. The
`set_config` call must come before `SET LOCAL role authenticated`, because the
`authenticated` role cannot read `auth.users`. The whole block must be sent as
a single statement, or the `SET LOCAL`s do not survive to the insert. And
`user_id` is a foreign key to `auth.users`, so an invented UUID fails on the
constraint before the trigger is ever reached. Keep the `ROLLBACK`: this writes
a real row, and the moderation queue should never contain test data.

Not built: no notification to the author on approval or rejection, and no
rejection reason recorded. Both are fine while volume is low and Sean is the
only moderator.

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

A **certified CMP** is still required before serving ads to EEA, UK and Swiss
visitors. Consent Mode signals are correct but the in-house banner is not
certified; Google's own funding-choices tool is the usual free answer.

Adopting one is not a drop-in swap. `AdBanner` gates rendering on
`readConsent() !== null` — the in-house banner's localStorage decision. A
certified CMP owns that decision instead, so the gate has to be rewritten to
read `__tcfapi`. Replacing the banner without rewriting the gate leaves
`readConsent()` returning `null` forever, which stops ads rendering **everywhere,
silently and with no error** — including outside the EEA, UK and Switzerland.
Change both in the same commit.

### 5. Other open items

- Main JS bundle is ~735 kB (222 kB gzipped). Code-splitting would help LCP.
- Sentry was deferred; add before any paid marketing.
- `src/data/spotSlugs.ts` is only a build-time fallback for the sitemap now —
  the live list comes from Supabase.
- A quarterly data refresh runs as a scheduled task (1 Jan/Apr/Jul/Oct):
  seasonal water temperatures for all spots, plus a rotating regional
  regulations audit.
