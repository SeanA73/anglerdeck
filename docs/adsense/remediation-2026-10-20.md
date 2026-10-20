# AdSense remediation — 20 October 2026

## Status

Prepared and verified against GitHub main (including the latest consent/privacy changes) in an isolated production build at `/tmp/anglerdeck-publish/dist`. Deployment verification is recorded in the task conversation; no AdSense review has been submitted. No live database rows were changed.

Google's supplied rejection names low-value content and asks for authentic usefulness, ongoing curation and genuine user interest. It does not identify a failing URL, prescribe a traffic target, or confirm that these changes will result in approval.

## Concrete changes

- Replaced the simulated contact form with a direct `mailto:support@anglerdeck.com` link, a copyable address and clear correction instructions. Removed the unsubstantiated 24-hour response promise. This opens the visitor's email app; there is no server-side message submission or false sent state. Delivery to the existing advertised mailbox still needs the owner's confirmation.
- Added `/about` with an honest description of desk research, primary sources, access limitations, moderation, corrections and commercial relationships. No personal expertise or field visits are claimed. Publisher remains AnglerDeck pending the owner's preference about a public name.
- Linked editorial policy from the footer, guide articles and spot overviews. About and Contact use shared content for React and prerendered HTML; About is in the generated sitemap.
- Expanded two existing published pages rather than creating more destinations:
  - `lake-wanaka-trout`: choosing shore access versus a boat plan; lake versus Clutha Outlet conditions and method restrictions.
  - `motueka-river`: choosing a river reach; interpreting numbered access maps alongside historical flood-repair information. December 2025 access disruption is expressly historical; present access status was not established.
- Added source-check dates to those two researched sections only. Existing article dates and other spot records have not been relabelled as reviewed.
- Added a repeatable read-only inventory: `node scripts/content-audit.mjs <build-directory>`. The adjacent `spot-inventory.csv` records the isolated candidate build, not the current live build.

## Content inventory and next research queue

Published build: 114 spots across 19 country hubs. Existing researched spot sections: 11; candidate build: 13. The remaining 101 lack that additional layer; this flags a research gap, not proof that every one is unacceptable. Five comparison guides remain available.

The inventory reports rendered words and core words excluding nearby listings. Neither is a Google approval threshold. Headings, gear lists and recurring text still contribute to counts, so manual usefulness review matters more than length.

Use Search Console landing pages to reorder the queue when data is available. Until then, the shortest core pages without researched sections are:

| Page slug | Research questions, not verified claims |
| --- | --- |
| loreto-yellowtail | What official marine-area zoning and launch/access constraints affect a visitor's plan? |
| lake-baccarac-bass | What can an independent visitor verify about legal shore or boat access? Which claims depend on a private operator? |
| lake-el-salto-bass | Can public access and launch details be substantiated by a responsible authority? |
| campeche-tarpon | Which areas and permissions distinguish an independent outing from a guided one? |
| la-paz-roosterfish | Where do official access and protected-area rules affect shore versus boat plans? |

For each page, first read existing source notes and linked authorities. Write sections only when the sources answer a real trip-planning question. Cite the source next to the content, record when it was actually read, distinguish editorial conclusions, and leave unresolved details out. Avoid adding copied summaries, padding, unverified facilities, bag/size numbers or manufactured angler experience. If a destination cannot support a useful, reliable page, consider withholding it through the existing shared publication system after reviewing its links and any real audience interest; do not delete rows or change publication rules in bulk.

## Audience review — awaiting account figures

No Search Console or GA4 dashboard data was available during this work. The nginx configuration uses a shared access log across multiple sites; raw requests cannot safely be treated as AnglerDeck visitors or genuine user interest. No traffic finding has been made.

Supply these figures for the last 90 days, ideally with the preceding 90 days for comparison:

- Search Console: total clicks, impressions, top pages and top queries, plus indexing issues affecting content routes.
- GA4: users, sessions, engaged sessions, landing pages, acquisition channels and returning users, excluding known internal activity where configured.

Use them to answer: which destinations attract searchers; whether queries match page content; whether visitors continue to another useful page; and whether interest persists over time. Analytics consent can undercount visits. There is no assumed minimum that guarantees approval, and traffic must not be purchased or manufactured for a review.

## Maintenance and resubmission

Keep a small corrections log with page, evidence, decision and actual change date. Recheck affected access information when an authority reports floods, closures or rule changes; do not merely refresh date labels. Prioritize the source-supported improvements for pages people already use.

Before requesting another review: deploy and verify these changes; confirm the support mailbox receives mail; review the next content batch for genuine usefulness; and examine the audience figures. A review request remains the owner's account action. The confirmation checkbox is not Google's acceptance of the fixes.

## Verification

- TypeScript application check: passed.
- Existing test suite: 89 tests passed across 12 files. Existing auth test `act` warnings remain.
- Targeted ESLint and JavaScript syntax checks: passed.
- Official-source guide validator: 13 guides, zero failures. Its existing Sydney Harbour health-advisory numeric warning remains; unrelated to the new content.
- Isolated production build: 18 static routes, 19 country hubs, 114 spot pages; 78 database rows remain withheld by the existing gate.
- Generated HTML checks: About/Contact content and email links present, About in sitemap, both new spot sections and genuine source-check dates present.
- Existing large-bundle warning remains. The initial verification left live `dist/` untouched; deployment uses the verified candidate output after backup.
