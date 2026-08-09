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
crawlable body.

It **exits non-zero if Supabase returns zero spots**, rather than writing a dist
with no spot pages. Reviews and individual missing fields still degrade
gracefully; only an empty spot list is fatal. Note what the exit does and does
not buy: `vite build` has already replaced `dist/`, and nginx serves that
directory with no reload, so when this fires the live site is *already* down to
a shell. The failure is loud, not prevented — fix the cause and rebuild.

The home page is prerendered last, because `dist/index.html` is the template
every other route is built from; writing it earlier would leak its head tags and
body into every subsequent route. Its body is built from Supabase counts and
links rather than paraphrasing `Hero`/`Features`, so it cannot drift into
advertising a feature that does not ship (rule 5).

Because nginx resolves both `/` and its SPA fallback to the same
`dist/index.html`, any non-prerendered route (`/community`, `/admin/*`, and
genuine 404s) now serves the home page's body and `canonical` to crawlers until
React hydrates. Splitting the two needs an nginx change, not a build change.

**Route lists live in `scripts/static-routes.mjs`**, shared by `prerender.mjs`
and `vite.config.ts` for the same reason `spot-quality.mjs` is shared. A route
prerendered but absent from the sitemap is invisible to sitemap-only crawlers; a
route in the sitemap that was never prerendered serves a shell. `robots.txt` is
`public/robots.txt` alone — `vite-plugin-sitemap` has `generateRobotsTxt: false`
because its default policy overwrote the file and silently dropped the
`Disallow` lines.

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

**Affiliate gear: no prices, no Amazon images.** Both rules come from the
Associates Operating Agreement and both were being broken until 10 Aug 2026.

*Prices are banded, never printed.* Amazon only permits a displayed price that
came from their API and was refreshed within about an hour. There is no API
available to us — PA-API retired 15 May 2026 and the replacement Creators API
needs qualifying sales Sean does not have yet — so `affiliate_products.price`
is a hand-entered figure that was seeded on 27 July and is now simply wrong.
The site renders an editorial band (`Budget` / `Mid-range` / `Premium`) from
`priceBand()` instead. The column stays: it is useful internally and it is what
a Creators API swap would replace. Thresholds live in
`src/data/price-bands.json`, read by both `src/lib/gear.ts` and
`prerender.mjs`. **Do not "restore" the number** — if a live feed ever lands,
render the API value, not the column.

*Images are local artwork.* Amazon product images may only be shown through
short-lived API URLs, never stored, and the seeded `m.media-amazon.com` links
also rot without notice. Every card now uses a category illustration from
`src/assets/gear/*.svg`, mapped in `src/lib/gear.ts`.
`20260810_affiliate_amazon_image_compliance.sql` nulls `image_url` on Amazon
rows, and `gearImage()` refuses to render an Amazon-hosted URL even if one is
entered again. `image_url` stays in the schema for merchants where hosting
rights are clear.

*Matching is token-aware, and was silently dead before.* Product tags are
generic (`trout`, `bass`) while spot species are specific (`rainbow trout`,
`largemouth bass`), and the old scorer compared them with `===`. Species
matching therefore never fired at all, so every freshwater product tied on
water type and ordering was arbitrary. `gearScore()` in `src/lib/gear.ts` now
matches whole tokens in both directions and weights species above water type;
`src/test/gear.test.ts` pins the behaviour. The admin tag field is a
multi-select over the live `spots` vocabulary for the same reason — free text
is what allowed the mismatch to go unnoticed.

Gear appears on spot pages, country hubs and `/gear`, and nowhere else. That is
a deliberate ceiling: this is a fishing guide with affiliate links, not a
storefront, and an ad-heavy layout is a common AdSense rejection reason while
item 4 below is still pending.

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

**Never verify a deploy by fetching the live URL. Three layers cache.** This
has produced two confidently wrong diagnoses in a single session, one of them
recorded in an audit as "confirmed twice independently". Both were reading
stale copies of pages that were, in fact, correct.

The three layers, and what defeats each:

| Layer | Symptom | Defeated by |
|---|---|---|
| Cloudflare edge | Stale HTML. A `?v=` param does **not** reliably bust it | `grep` the file in `dist/` on the VPS |
| PWA service worker | Stale JS bundle in any browser that has visited before. `registerType: 'autoUpdate'` refreshes, but typically one page-load late | An incognito window |
| Browser cache | Usual staleness | Hard reload, or incognito |

So:

- **Prerender, sitemap, robots, JSON-LD** — verify on the VPS with `grep`
  against `dist/`, e.g. `grep -c "find your next fishing spot"
  /var/www/anglerdeck/dist/index.html` or
  `grep -rl "Live Chat" /var/www/anglerdeck/dist/assets/*.js`. That reads what
  was actually built, with nothing in between.
- **Rendered UI** — verify in an incognito window, never a browser that has
  visited the site before.
- `curl` with a cache-buster is the *weakest* check available here. Treat a
  negative result from it as "unknown", never as "broken".

**"Already up to date" from `git pull` is ambiguous** and cost a long detour
this session. It means the pull found nothing *new*, which is equally true
when the remote lacks the commit **and** when the VPS already has it. It is
not evidence that a push failed. Check `git log -1 --format="%h %s"` on the
VPS and compare hashes; that is unambiguous.

**Auto-gc is disabled (`gc.auto 0`) because the repo lives in OneDrive.**
OneDrive holds file locks that make git's garbage collector fail partway
through, prompting `Deletion of directory '.git/objects/XX' failed. Should I
try again? (y/n)` once per object directory — up to 256 prompts. The same
lock contention produces stray `.git/index.lock` files that block all git
operations until removed. Moving the repo out of OneDrive would remove this
whole class of failure; until then, leave gc off.

**`node_modules` on the VPS corrupts regularly** — three times in one
session, surfacing as either `Cannot find package '.../vite/index.js'` or
`Bus error (core dumped)`. Both are the same underlying problem and both are
fixed by `rm -rf node_modules && npm ci`. It is not memory (the box has ~7 GB
free); interrupted builds appear to leave the tree half-written. The VPS has
**no swap**, which is worth adding as cheap insurance.

**A failed build is not just local downtime — outsiders see a broken site,
and some of them remember.** `vite build` replaces `dist/` before it
finishes, and nginx serves that directory live with no reload, so any build
that dies partway leaves the public site serving 404s and shells until the
next successful build. That window has external consequences, not just
cosmetic ones.

Worked example, 9 Aug 2026: `ads.txt` was **Authorised** in the AdSense
console that morning. After a `Bus error` build and a
`Cannot find package vite/index.js` build, the console flipped it to **Not
found** — Google's checker had crawled during a window when the file
genuinely 404'd. The file itself was never wrong: it verified correct on
both `anglerdeck.com/ads.txt` and `www.anglerdeck.com/ads.txt` immediately
after. Nothing to fix; Google rechecks on its own schedule and the status
reverts. But the same window is equally visible to the indexing crawler,
which is a worse outcome and harder to notice.

**The structural fix is an atomic swap** — build into `dist-next/`, and only
`mv` it into place once the build and prerender both exit zero. Until that
exists, treat every failed build as a live incident: rebuild immediately
rather than leaving it until later, and do not run speculative builds on the
VPS while diagnosing something else.

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

### 5. Edge Function rate limiting — does not work, next up

`ai-chat` and `ai-generate-story` both call `checkRateLimit`, which counts
requests in a module-level `Map`. That is per-isolate state, and Supabase hands
out fresh isolates rather than reusing one, so the counter is empty on almost
every request. Measured 9 Aug 2026: 28 requests to `ai-chat` against its
10-per-60s limit returned zero 429s; `ai-generate-story` allowed 12. This is a
design problem, not a bug in the counting — the deployed code was confirmed to
be the version containing the limiter before concluding anything.

A fix needs shared state: a table keyed by `(user_id, window_start)` and a
migration, applied by hand before the functions are redeployed. Until then a
pro/elite subscriber can call `gpt-4o-mini` without limit and the OpenAI
account budget is the only cap. Shipped anyway on 9 Aug 2026 because the
alternative was leaving paying Pro subscribers with a dead headline feature.

**To re-test, send invalid bodies.** Rate limiting is gate 3 and body
validation is gate 4, so a malformed body exercises the counter and returns 400
without spending anything at OpenAI. Do not test with valid bodies unless you
want ten real completions per run.

### 6. Other open items

- Main JS bundle is ~735 kB (222 kB gzipped). Code-splitting would help LCP.
- Sentry was deferred; add before any paid marketing.
- `src/data/spotSlugs.ts` is only a build-time fallback for the sitemap now —
  the live list comes from Supabase.
- A quarterly data refresh runs as a scheduled task (1 Jan/Apr/Jul/Oct):
  seasonal water temperatures for all spots, plus a rotating regional
  regulations audit.
