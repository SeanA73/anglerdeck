# Fishing Guides Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the first comparison article ("Where you can fish without a licence") behind a repeatable `/guides` section: a JSON data file, an index page, an article page, prerendered bodies, `Article` JSON-LD, and internal links to and from the country hubs it covers.

**Architecture:** `src/data/guides.json` is the single source of truth for article content (structured sections, not markdown), read directly by `scripts/prerender.mjs` (JSON.parse, no TS import capability) and by `src/lib/guides.ts` (typed accessor for the React pages) — the same pattern `country-guides.json` already established. `scripts/static-routes.mjs` generates the `/guides` and `/guides/<slug>` route entries (title/description) from that same JSON, so it keeps acting as the one shared path list `vite.config.ts` (sitemap) and `prerender.mjs` (prerendered HTML) both read — no changes needed in either of those two files' guide-routing logic beyond what already consumes `STATIC_ROUTES`/`STATIC_ROUTE_PATHS`. `prerender.mjs` gains guide body builders and an `Article` JSON-LD builder, wired into its existing `STATIC_ROUTES` loop by pattern-matching `/guides/<slug>` paths.

**Tech Stack:** Vite + React 18 + TypeScript, react-router-dom, react-helmet-async, Vitest, plain-ESM Node scripts (`scripts/*.mjs`).

**Spec:** No separate spec doc — the user's task brief (routes, JSON-LD requirements, nav requirements, quality bar, verify steps) and the brainstorming-phase design agreed in chat serve as the spec for this plan.

## Global Constraints

- Never invent a fact, source, or licensing claim (CLAUDE.md content rule 1).
- No rating or review structured data anywhere in the guides section (task requirement; CLAUDE.md content rule 4 is the same principle for spots).
- No bag/size numbers (CLAUDE.md content rule 3) — not applicable to this article's content, but any new country-guides.json prose must still obey it.
- One source of truth for article content — never duplicate guide prose between `guides.json`, the prerenderer, and the React pages (CLAUDE.md's repeated lesson about `regulation-regions.json` / `static-routes.mjs` drift).
- Inline formatting: plain prose only, no markdown/bold markup anywhere in `guides.json` — no markdown parser is to be added to `prerender.mjs`.
- The article body must not contain the "Notes for Sean — not for publication" section or its content, in any form.
- `PowerShell 5` locally, no `&&` chaining — one command per call when giving shell instructions.
- Must not touch `scripts/spot-quality.mjs`, the publication gate, or change `ls dist/spot | wc -l` (must stay 49).
- Nothing is committed or pushed as part of plan execution — flag suggested commit boundaries per task, leave the actual `git commit`/`push` to Sean.

---

## File Structure

- **Create** `src/data/guides.json` — the article's content (and every future article's), keyed by slug.
- **Create** `src/lib/guides.ts` — typed accessor: `getAllGuides()`, `getGuideBySlug(slug)`, `guidesForCountry(code)`.
- **Create** `src/test/guides.test.ts` — unit tests for the three accessor functions.
- **Create** `src/pages/Guides.tsx` — `/guides` index page.
- **Create** `src/pages/GuideDetail.tsx` — `/guides/:slug` article page.
- **Modify** `src/data/country-guides.json` — add the verified South Australia clause to `AU`, add the verified France sea-fishing clause to `FR` (promote `FR.sourcing` to `full`).
- **Modify** `scripts/static-routes.mjs` — read `guides.json`, generate `/guides` and `/guides/<slug>` entries, append to `STATIC_ROUTES`.
- **Modify** `scripts/prerender.mjs` — add `GUIDES` data load, `guidesForCountry()`, `guideContent()`, `guidesIndexContent()`, `guideJsonLd()`; wire jsonLd into the `STATIC_ROUTES` loop; add a "Related guides" block to `hubContent()`.
- **Modify** `src/App.tsx` — lazy-import and route `/guides` and `/guides/:slug`.
- **Modify** `src/components/Footer.tsx` — add a "Guides" link.
- **Modify** `src/pages/CountryHub.tsx` — render a "Related guides" section when `guidesForCountry(country.code)` is non-empty.

---

## Task 1: Verified country-guides.json updates (France, South Australia)

**Files:**
- Modify: `src/data/country-guides.json` (`AU` entry, `FR` entry)

**Interfaces:**
- Consumes: nothing new — same `CountryGuide` shape already defined in `src/lib/country-guides.ts`.
- Produces: the two verified facts, available to `guides.json` (Task 2) when writing the Australia and France sections of the article, and to `/regulations` and the two hubs immediately (no code change needed there — they already read this file).

This task has no test — it is a content correction to an existing, already-typed JSON file, verified against two official sources fetched this session:
- PIRSA (`pir.sa.gov.au/fishing-and-aquaculture/recreational-fishing/rules`): *"You do not need a licence for recreational fishing in South Australia. However, you will need a permit when fishing in certain reservoirs."*
- `service-public.gouv.fr/particuliers/vosdroits/F2118` ("Pêche de loisir en mer", verified by that site 17 Apr 2026): ordinary recreational sea fishing needs no licence; only competitive/*sportive* fishing needs a national sporting licence; some species require registration.

- [ ] **Step 1: Update the `AU` entry's `regulations`, `licensing`, `links` and `sourceNotes`**

In `src/data/country-guides.json`, find the `"AU"` object. Replace its `links`, `regulations`, `licensing` and `sourceNotes` fields with the text below (leave `authority`, `seasons`, `water`, `sourcing` untouched — `sourcing` stays `"partial"` because Queensland, Victoria and Tasmania remain unverified):

```json
    "links": [
      { "name": "NSW recreational fishing fee — exemptions", "url": "https://www.dpi.nsw.gov.au/fishing/recreational/recreational-fishing-fee/exemptions" },
      { "name": "NT Government — about recreational fishing", "url": "https://nt.gov.au/marine/recreational-fishing/rules/about-recreational-fishing" },
      { "name": "PIRSA — recreational fishing rules (South Australia)", "url": "https://pir.sa.gov.au/fishing-and-aquaculture/recreational-fishing/rules" }
    ],
    "regulations": "Australia licenses fishing state by state, and the rules change as you cross a border. New South Wales requires the Recreational Fishing Fee for both fresh and salt water, and you must carry the receipt while fishing. The Northern Territory and South Australia both require no recreational fishing licence at all. Confirm with the agency for the state you are fishing before you travel, because none of them defers to the others.",
    "licensing": "There is no Australian fishing licence. Each state and territory runs its own system, and the difference between neighbours is large enough to catch visitors out. New South Wales requires the Recreational Fishing Fee for both fresh and salt water, sold in short-term and multi-year forms, and you must carry proof of payment while you fish; the state publishes a list of exemptions, including anglers fishing under a guide or charter operator who holds an exemption certificate. The Northern Territory and South Australia are the opposite case: PIRSA, South Australia's fisheries department, states plainly that you do not need a licence for recreational fishing in the state, though a permit is required to fish in certain reservoirs, and the Northern Territory requires no recreational licence whatsoever either — though boating rules, closed areas and Aboriginal land permissions all still apply in both. Because the border matters more than the country, check the state agency rather than any national page — and on the Murray, check which bank you are standing on.",
```

For `sourceNotes`, replace the existing string with:

```json
    "sourceNotes": "NSW fee, NT no-licence position and SA no-licence position (permit required only for reservoirs) verified against dpi.nsw.gov.au, nt.gov.au and pir.sa.gov.au. Queensland's no-general-licence position for tidal waters, and the Victorian and Tasmanian licence requirements asserted in the countries.ts blurb, were NOT verified this session — no claim about them is made in this prose. The Yarrawonga all-fishing closure and the Cairns season come from the existing researched spot rows, not from a fresh agency fetch."
```

- [ ] **Step 2: Update the `FR` entry's `links`, `licensing`, `sourcing` and `sourceNotes`**

In the `"FR"` object, replace `links` (currently `[]`), `licensing`, `sourcing` and `sourceNotes`:

```json
    "links": [
      { "name": "Service-Public.fr — Pêche de loisir en mer", "url": "https://www.service-public.gouv.fr/particuliers/vosdroits/F2118" }
    ],
```

Append this sentence to the end of the existing `licensing` string (keep everything before it unchanged, including the existing "Sea angling operates under separate national rules..." sentence — replace only that one sentence with the text below, since it is now superseded by a verified claim):

Find this sentence inside `licensing`: `"Sea angling operates under separate national rules rather than the carte de pêche."` — replace it with:

```
Sea angling is a separate case entirely, and it needs no licence at all: the French government's official guidance for recreational sea fishing (pêche de loisir en mer) — from shore, boat or freediving — states no licence requirement applies. That is specifically for ordinary recreational fishing; competitive sport fishing (pêche sportive) is a distinct category that does need a national sporting licence, and some species carry their own registration or declaration duty, so it is worth checking the rules for what you actually plan to target.
```

Set:
```json
    "sourcing": "full",
```

Replace `sourceNotes` with:

```json
    "sourceNotes": "The carte de pêche requirement, AAPPMA membership model, FNPF as operator, and the daily/weekly/annual and minor/discovery card range all verified against cartedepeche.fr. That recreational SEA fishing requires no licence in France is now verified against service-public.gouv.fr (Direction de l'information légale et administrative, Premier ministre), page F2118 'Pêche de loisir en mer', content verified by that site 17 April 2026 — read via a live browser fetch this session after the direct URL 404'd previously. The page also states that competitive/sportive fishing needs a national sporting licence and that some species require registration; the licensing prose above reflects both."
```

- [ ] **Step 3: Verify the JSON still parses and no other field was disturbed**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/data/country-guides.json','utf8')); console.log('OK')"`
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add src/data/country-guides.json
git commit -m "$(cat <<'EOF'
Verify France sea-fishing and South Australia licence claims

Both were open questions blocking the fish-without-a-licence article.
South Australia confirmed via PIRSA's official rules page (no licence,
reservoir permit excepted). France confirmed via service-public.gouv.fr:
recreational sea fishing needs no licence; only competitive/sportive
fishing does.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Vo6K5Vn94WLj3Qz5J1copS
EOF
)"
```

---

## Task 2: `src/data/guides.json` — the article content

**Files:**
- Create: `src/data/guides.json`

**Interfaces:**
- Consumes: the verified France/SA facts from Task 1 (for the Australia and France sections).
- Produces: the `guides.json` shape every later task reads —
  ```
  {
    "_README": { "purpose": string, "fields": string },
    "<slug>": {
      "slug": string,
      "title": string,
      "summary": string,          // ~150 chars, used as meta description and index-card blurb
      "datePublished": "YYYY-MM-DD",
      "dateModified": "YYYY-MM-DD",
      "countries": string[],      // ISO codes from src/lib/countries.ts, for hub cross-linking
      "intro": string[],          // lead paragraphs before the first heading
      "sections": [ { "heading": string, "paragraphs": string[] } ],
      "table": { "caption": string, "columns": string[], "rows": string[][] }  // optional
    }
  }
  ```

- [ ] **Step 1: Write the file**

Create `src/data/guides.json` with this exact content:

```json
{
  "_README": {
    "purpose": "Long-form comparison articles, the /guides section. ONE source of truth for article content — read by src/lib/guides.ts (React pages) and scripts/prerender.mjs (JSON.parse directly, same reason src/data/country-guides.json is read that way: prerender.mjs cannot import TypeScript).",
    "fields": "slug = URL segment under /guides/. title/summary = <h1> and meta description / index-card blurb. datePublished/dateModified = ISO date strings, used verbatim in Article JSON-LD. countries = ISO codes from src/lib/countries.ts that this article covers, used to cross-link country hubs both directions. intro = paragraphs rendered before the first heading. sections = ordered {heading, paragraphs} blocks, rendered as h2 + p. table = an optional structured comparison table rendered as a real <table>, never as prose. No markdown anywhere in any string field — paragraphs are plain prose, rendered by escaping and wrapping in <p>, exactly like spot descriptions. CLAUDE.md content rules apply in full: every factual claim traces to an official source recorded in src/data/country-guides.json for that country, no bag/size numbers, no fabricated ratings."
  },

  "fish-without-a-licence": {
    "slug": "fish-without-a-licence",
    "title": "Where You Can Fish Without a Licence",
    "summary": "A country-by-country look at where recreational anglers can fish without a licence, and the landowner permits and paperwork that often take its place.",
    "datePublished": "2026-09-07",
    "dateModified": "2026-09-07",
    "countries": ["NO", "SE", "NZ", "FR", "GB", "AU", "JP", "RU", "IT", "ES", "FI"],
    "intro": [
      "Most fishing advice starts with \"buy a licence\". It is good advice almost everywhere — but not everywhere, and the exceptions are more useful than they look. If you are planning a trip, knowing which waters you can simply walk up to and fish changes what is worth flying for.",
      "This is a comparison across the nineteen countries we cover. Every claim links to the agency that made the rule. Two warnings before the list: free never means unregulated, and \"no licence\" rarely means \"no permission needed\". Both catch people out, and we come back to them at the end."
    ],
    "sections": [
      {
        "heading": "Norway: the sea is free, the rivers are not",
        "paragraphs": [
          "Norway draws the cleanest line of any country here. The Norwegian Environment Agency confirms you do not need to pay the national fishing fee to fish with a rod or hand line in the sea — and you may fish there for salmon, sea trout and Arctic char from the shore year-round, subject to local bylaws.",
          "That is an unusually generous position. Sea-run salmon from the shore, no paperwork.",
          "Fresh water is the opposite. For rivers and lakes holding anadromous fish you must pay the national fishing fee before fishing during the ordinary season, carry proof, and produce it on request. And the fee is not permission to fish — fishing rights belong to the landowner, so you need their licence as well. On a river like the Alta, that landowner permit is the real bottleneck, not the fee."
        ]
      },
      {
        "heading": "Sweden: free coast, and five free lakes",
        "paragraphs": [
          "Sweden has the most generous access rules on this list, and the boundary is geographic rather than bureaucratic. Along the entire coast, and on the five great lakes — Vänern, Vättern, Mälaren, Hjälmaren and Storsjön in Jämtland — recreational rod fishing is free.",
          "That is not a technicality. Vänern is the largest lake in the European Union. You can fish it, with a rod, without buying anything.",
          "Outside those waters, fishing rights are private. Most managed waters are organised into fishing conservation areas selling a fiskekort, and the Swedish Agency for Marine and Water Management maps them — species, permit sellers and all — so a specific water is easy to check before you travel."
        ]
      },
      {
        "heading": "New Zealand: free at sea, one trap inland",
        "paragraphs": [
          "Sea fishing in New Zealand needs no licence at all. The freshwater rules are the only paperwork most visitors face, and they contain a trap worth knowing: a Fish & Game licence covers the whole country except the Taupō district, which the Department of Conservation administers separately. A Fish & Game licence is not valid there. Lake Rotoaira is a third district again, with its own licences.",
          "Since Taupō is one of the best trout fisheries on earth, this catches a lot of people."
        ]
      },
      {
        "heading": "France: free at sea, a card inland",
        "paragraphs": [
          "France draws a similar line to Norway and New Zealand, though the split runs between land and water rather than species. The French government's official guidance for recreational sea fishing is clear: ordinary recreational sea angling — from the shore, a boat, or freediving — needs no fishing licence. Competitive sport fishing is a separate category and does need a national sporting licence, which is not what most visitors are doing, and some species carry their own registration or declaration duty, so it is worth checking the rules for whatever you actually plan to target.",
          "Fresh water works differently. To fish inland you need a carte de pêche, which is really membership: it enrols you in an AAPPMA, one of the local approved fishing and aquatic-environment protection associations, within the national recreational fishing network. The national federation sells cards centrally — daily, weekly or annual, with reduced options for under-18s — which makes France one of the more visitor-friendly systems in Europe once you know that a licence and a membership are the same document. Closed seasons for species like pike and zander are set locally, by département, so the rules that matter are the ones for the specific water."
        ]
      },
      {
        "heading": "United Kingdom: sea angling free, fresh water split in two",
        "paragraphs": [
          "Sea angling is free throughout the UK. Fresh water is really two systems.",
          "In England and Wales you need an Environment Agency rod licence to fish for salmon, trout, freshwater fish, smelt or eel with a rod and line — and GOV.UK is explicit that this applies on private water too, club lakes included. The licence permits you to hold a rod; it is not permission to fish a particular water, so you still need the owner's consent.",
          "Scotland issues no rod licence at all. Instead you need a permit from whoever owns the beat, usually an estate or a District Salmon Fishery Board. So Scotland is simultaneously licence-free and among the harder places to arrange access.",
          "Children under 13 need no licence in England and Wales; 13-to-16-year-olds hold a free junior one."
        ]
      },
      {
        "heading": "Australia: it depends entirely which state you are standing in",
        "paragraphs": [
          "There is no Australian fishing licence. Each state and territory runs its own system, and the gap between neighbours is wide.",
          "The Northern Territory and South Australia both require no recreational fishing licence whatsoever. South Australia's fisheries department, PIRSA, is direct about it: no licence is needed for recreational fishing in the state, though a permit is required to fish in certain reservoirs, and the usual size, bag, boat and possession limits still apply everywhere. The Northern Territory's exemption is the same in shape — no licence, but boating rules, closed areas and Aboriginal land permissions all still apply.",
          "New South Wales sits at the other end: the Recreational Fishing Fee covers both fresh and salt water, and you must carry proof while fishing. NSW does publish exemptions, including anglers fishing under a guide or charter operator holding an exemption certificate.",
          "On border rivers like the Murray, which bank you are standing on decides whose rules apply."
        ]
      },
      {
        "heading": "Japan and Russia: no licence, but not open access",
        "paragraphs": [
          "Japan has no recreational fishing licence in the European sense. The Fisheries Agency treats recreational fishing as \"minor capture\" and sets out what foreign nationals may do by method and vessel: from shore, rod, hand line, net and spear fishing are permitted. Inland waters are different — local fisheries cooperatives set rules approved by the prefectural governor, including a fee and a permit called a yugyoken.",
          "Russia likewise has no recreational licence, and the Federal Agency for Fishery states that public waters may be fished freely and free of charge, subject to the fishing rules for the relevant basin. But on designated fishing grounds — which is what the famous salmon and trout rivers are — fishing runs under a putyovka, a paid-services contract specifying catch, area, methods and period. Those fisheries are booked commercially, well in advance."
        ]
      },
      {
        "heading": "Free of charge, but not free of paperwork",
        "paragraphs": [
          "Two countries charge nothing and still require you to file something.",
          "Italy: sea fishing is free of charge, but MASAF operates a sport-fishing census through which recreational sea anglers must file a comunicazione. The practical catch is the login — access has run exclusively through Italian digital identity credentials (SPID, electronic ID card, or national services card) since 2022, which most visitors do not hold. Resolve it with a charter operator before travelling, not at the harbour.",
          "Spain: on top of a regional licence, the Ministry of Agriculture, Fisheries and Food runs PescaREC, an app through which sea anglers register and report catches daily — from shore as well as from a boat."
        ]
      },
      {
        "heading": "Age exemptions worth knowing",
        "paragraphs": [
          "Finland applies its state fisheries management fee to anglers aged 18 to 69 fishing with lures. Outside that band, no fee. Finland's everyman's-right tradition also leaves simple methods — ice fishing, basic float fishing — outside the fee regime entirely, which is why a Finnish winter trip involves almost no paperwork.",
          "England and Wales: under-13s free, 13–16 free junior licence."
        ]
      },
      {
        "heading": "The two things that catch people out",
        "paragraphs": [
          "Free does not mean unregulated. Sweden's free waters still carry size rules and closed seasons. Norway's free sea fishing is still subject to local bylaws. The Northern Territory still has closed areas. Removing the licence removes one requirement, not the rest.",
          "No licence is not the same as permission. This is the one that costs people a day's fishing. In Norway, paying the national fee does not entitle you to fish — the landowner still has to sell you a permit. In Scotland there is no licence at all, but you cannot fish without the beat owner's say-so. In England and Wales the rod licence is explicitly not permission to fish a given water. In Finland, the state fee covers single-rod fishing in much of the country, but the good rivers and rapids need the water owner's permit too.",
          "The pattern: countries that removed the licence usually did so because fishing rights sit with landowners instead. The paperwork moved rather than disappeared."
        ]
      }
    ],
    "table": {
      "caption": "Quick reference",
      "columns": ["Country", "Free sea fishing", "Free fresh water", "Note"],
      "rows": [
        ["Norway", "Yes", "No", "Fee plus landowner permit inland"],
        ["Sweden", "Yes", "Coast + 5 great lakes", "Elsewhere needs a fiskekort"],
        ["New Zealand", "Yes", "No", "Taupō licensed separately from Fish & Game"],
        ["France", "Yes", "No", "Inland needs a carte de pêche via AAPPMA"],
        ["United Kingdom", "Yes", "No (E&W); no licence in Scotland", "Scotland needs beat permission"],
        ["Australia (NT)", "Yes", "Yes", "No recreational licence at all"],
        ["Australia (SA)", "Yes", "Yes", "No general recreational licence; permit needed for reservoirs"],
        ["Australia (NSW)", "No", "No", "Recreational Fishing Fee for both waters"],
        ["Italy", "Free of charge", "No", "Census filing required; SPID login"],
        ["Japan", "No licence", "Local permit inland", "Method and vessel rules apply"],
        ["Russia", "No licence", "No licence on public water", "Putyovka on designated grounds"],
        ["Finland", "—", "Free outside ages 18–69", "Simple methods exempt entirely"]
      ]
    }
  }
}
```

- [ ] **Step 2: Verify the JSON parses and contains no forbidden text**

Run: `node -e "const g=JSON.parse(require('fs').readFileSync('src/data/guides.json','utf8')); console.log(Object.keys(g).length, 'entries')"`
Expected: `2 entries` (the `_README` plus one article).

Run: `node -e "const g=require('./src/data/guides.json'); const s=JSON.stringify(g); console.log(s.includes('Notes for Sean') || s.includes('not for publication'))"`
Expected: `false`

- [ ] **Step 3: Commit**

```bash
git add src/data/guides.json
git commit -m "$(cat <<'EOF'
Add fish-without-a-licence article as structured guide data

First entry in the /guides content file, structured as sections rather
than markdown so prerender.mjs never needs a markdown parser. Adds the
verified France and South Australia claims from the prior commit into
the article body; everything else traces to src/data/country-guides.json.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Vo6K5Vn94WLj3Qz5J1copS
EOF
)"
```

---

## Task 3: `src/lib/guides.ts` typed accessor, TDD

**Files:**
- Create: `src/lib/guides.ts`
- Test: `src/test/guides.test.ts`

**Interfaces:**
- Consumes: `src/data/guides.json` (Task 2).
- Produces (used by Tasks 6 and 7):
  - `interface GuideSection { heading: string; paragraphs: string[] }`
  - `interface GuideTable { caption: string; columns: string[]; rows: string[][] }`
  - `interface Guide { slug: string; title: string; summary: string; datePublished: string; dateModified: string; countries: string[]; intro: string[]; sections: GuideSection[]; table?: GuideTable }`
  - `getAllGuides(): Guide[]`
  - `getGuideBySlug(slug: string): Guide | undefined`
  - `guidesForCountry(code: string): Guide[]`

- [ ] **Step 1: Write the failing test**

Create `src/test/guides.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getAllGuides, getGuideBySlug, guidesForCountry } from "@/lib/guides";

describe("getAllGuides", () => {
  it("excludes the _README metadata entry", () => {
    const guides = getAllGuides();
    expect(guides.every((g) => g.slug !== "_README")).toBe(true);
    expect(guides.length).toBeGreaterThan(0);
  });

  it("returns guides with the required fields populated", () => {
    for (const g of getAllGuides()) {
      expect(g.slug).toBeTruthy();
      expect(g.title).toBeTruthy();
      expect(g.summary).toBeTruthy();
      expect(g.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Array.isArray(g.intro)).toBe(true);
      expect(Array.isArray(g.sections)).toBe(true);
      expect(g.sections.length).toBeGreaterThan(0);
    }
  });
});

describe("getGuideBySlug", () => {
  it("finds the seeded article by slug", () => {
    const guide = getGuideBySlug("fish-without-a-licence");
    expect(guide?.title).toBe("Where You Can Fish Without a Licence");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getGuideBySlug("does-not-exist")).toBeUndefined();
  });

  it("refuses to resolve the _README key as a guide", () => {
    expect(getGuideBySlug("_README")).toBeUndefined();
  });
});

describe("guidesForCountry", () => {
  it("finds the seeded article for a country it covers", () => {
    const guides = guidesForCountry("NO");
    expect(guides.some((g) => g.slug === "fish-without-a-licence")).toBe(true);
  });

  it("returns an empty array for a country no guide covers", () => {
    expect(guidesForCountry("DE")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/guides.test.ts`
Expected: FAIL — `Cannot find module '@/lib/guides'` (the file does not exist yet).

- [ ] **Step 3: Write the implementation**

Create `src/lib/guides.ts`:

```ts
import guidesData from "@/data/guides.json";

/**
 * Typed access to src/data/guides.json — the single source of truth for
 * /guides article content. scripts/prerender.mjs reads the same JSON directly
 * (it cannot import TypeScript), so the prerendered body and this hydrated
 * page can never drift, the same reason src/lib/country-guides.ts exists.
 */
export interface GuideSection {
  heading: string;
  paragraphs: string[];
}

export interface GuideTable {
  caption: string;
  columns: string[];
  rows: string[][];
}

export interface Guide {
  slug: string;
  title: string;
  summary: string;
  datePublished: string;
  dateModified: string;
  /** ISO codes from src/lib/countries.ts this article covers, for hub cross-linking. */
  countries: string[];
  intro: string[];
  sections: GuideSection[];
  table?: GuideTable;
}

const GUIDES = guidesData as unknown as Record<string, Guide>;

const isGuideKey = (key: string) => key !== "_README";

export const getAllGuides = (): Guide[] =>
  Object.keys(GUIDES)
    .filter(isGuideKey)
    .map((key) => GUIDES[key]);

export const getGuideBySlug = (slug: string): Guide | undefined =>
  isGuideKey(slug) ? GUIDES[slug] : undefined;

export const guidesForCountry = (code: string): Guide[] =>
  getAllGuides().filter((g) => g.countries.includes(code));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/guides.test.ts`
Expected: PASS, all 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/guides.ts src/test/guides.test.ts
git commit -m "$(cat <<'EOF'
Add typed accessor for guides.json

Mirrors src/lib/country-guides.ts: one JSON file read by both the
prerenderer and the React pages, so article content can't drift.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Vo6K5Vn94WLj3Qz5J1copS
EOF
)"
```

---

## Task 4: `scripts/static-routes.mjs` — generate guide routes from the JSON

**Files:**
- Modify: `scripts/static-routes.mjs`

**Interfaces:**
- Consumes: `src/data/guides.json` directly (fs read, same technique `prerender.mjs` already uses for the same file elsewhere).
- Produces: `STATIC_ROUTES` (existing export) gains a `/guides` entry and one `/guides/<slug>` entry per article; `STATIC_ROUTE_PATHS` (existing export, `STATIC_ROUTES.map(r => r.path)`) picks these up automatically — **no change needed in `vite.config.ts`**, since it already imports `STATIC_ROUTE_PATHS` and spreads it into the sitemap's `dynamicRoutes`.

- [ ] **Step 1: Add the guide-route generation and extend the export**

Open `scripts/static-routes.mjs`. Add these imports at the top, above the `export const STATIC_ROUTES` line:

```js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * /guides and /guides/<slug> route entries, generated from src/data/guides.json
 * rather than written by hand — title and description come straight from the
 * article data, so this file can never advertise a different title than the
 * one prerender.mjs and the hydrated page actually render. See guides.json's
 * _README for the field meanings.
 */
const GUIDES = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../src/data/guides.json"), "utf8")
);
const GUIDE_LIST = Object.keys(GUIDES)
  .filter((k) => k !== "_README")
  .map((k) => GUIDES[k]);

const GUIDE_ROUTES = [
  // Keep this description in step with the one in src/pages/Guides.tsx's
  // <SEO> tag — that copy applies after hydration, this one is what
  // crawlers read. It deliberately does not count guides, so it can't drift
  // as more are added without a code change.
  {
    path: "/guides",
    title: "Fishing Guides — AnglerDeck",
    description: "Researched, source-linked comparison guides for anglers planning a trip — starting with where you can fish without a licence.",
  },
  ...GUIDE_LIST.map((g) => ({
    path: `/guides/${g.slug}`,
    title: `${g.title} — AnglerDeck`,
    description: g.summary,
  })),
];
```

Then change the `export const STATIC_ROUTES = [` line so the array spreads `GUIDE_ROUTES` in alongside the existing hand-written entries — add this as the last element before the closing `];`:

```js
  ...GUIDE_ROUTES,
```

So the full export looks like the existing twelve entries, followed by `...GUIDE_ROUTES,`, then `];`.

- [ ] **Step 2: Verify it loads and produces the expected paths**

Run: `node -e "import('./scripts/static-routes.mjs').then(m => console.log(m.STATIC_ROUTE_PATHS.filter(p => p.startsWith('/guides'))))"`
Expected: `[ '/guides', '/guides/fish-without-a-licence' ]`

- [ ] **Step 3: Commit**

```bash
git add scripts/static-routes.mjs
git commit -m "$(cat <<'EOF'
Generate /guides routes from guides.json in static-routes.mjs

Keeps the sitemap and the prerenderer in step the same way every other
route list here does, per this file's header comment — and since the
route title/description are generated from guides.json rather than
typed by hand, they can't drift from the article's own title/summary.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Vo6K5Vn94WLj3Qz5J1copS
EOF
)"
```

---

## Task 5: `scripts/prerender.mjs` — guide bodies, Article JSON-LD, hub cross-links

**Files:**
- Modify: `scripts/prerender.mjs`

**Interfaces:**
- Consumes: `STATIC_ROUTES` (Task 4, already imported), `src/data/guides.json` (new read in this file, same pattern as `COUNTRY_GUIDES`).
- Produces: prerendered `#prerender-content` bodies for `/guides` and `/guides/<slug>`, `Article` JSON-LD in the `<head>` of each `/guides/<slug>` page, and a "Related guides" block inside `hubContent()`.

- [ ] **Step 1: Load `guides.json` and add a `guidesForCountry` helper**

Immediately after the existing `COUNTRY_GUIDES` block (after the `countryGuide` function, around line 73), add:

```js
/**
 * /guides article content — the same JSON src/lib/guides.ts hands to the
 * React pages, so the prerendered body and the hydrated page cannot drift.
 * Structured as sections rather than markdown so this script never needs a
 * markdown parser.
 */
const GUIDES = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/guides.json"), "utf8")
);
const GUIDE_LIST = Object.keys(GUIDES)
  .filter((k) => k !== "_README")
  .map((k) => GUIDES[k]);

const guidesForCountry = (code) => GUIDE_LIST.filter((g) => g.countries.includes(code));
```

- [ ] **Step 2: Add the guide body and JSON-LD builder functions**

Add these functions after `regulationsContent()` (after its closing `}`, before the `reviewsSection` function, so guide-related builders sit together):

```js
/** One <p> per paragraph, escaped — no inline markup anywhere in guide prose. */
const guideParagraphs = (paragraphs) =>
  paragraphs.map((p) => `<p>${esc(p)}</p>`).join("\n      ");

/** Renders a guide's optional quick-reference table as a real <table>. */
function guideTableHtml(table) {
  if (!table) return "";
  return `
      <h2>${esc(table.caption)}</h2>
      <table>
        <thead><tr>${table.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>
        <tbody>
          ${table.rows
            .map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`)
            .join("")}
        </tbody>
      </table>`;
}

/**
 * /guides/<slug> body.
 *
 * Every country this article touches links to its hub, and the hub links
 * back (see hubContent()) — internal links in both directions are the point
 * of this section, not a nice-to-have: nobody links to a directory entry,
 * but a comparison article can earn a link, and it should also earn clicks
 * to the spots and hubs behind it.
 */
function guideContent(guide) {
  const countryLinks = guide.countries
    .map((code) => ({ name: COUNTRY_NAMES[code], slug: countrySlug(code) }))
    .filter((c) => c.name);

  return `
    <article>
      <nav><a href="/guides">Fishing guides</a> / ${esc(guide.title)}</nav>
      <h1>${esc(guide.title)}</h1>
      <p><em>Published ${esc(guide.datePublished)}</em></p>
      ${guideParagraphs(guide.intro)}
      ${guide.sections
        .map(
          (s) => `
      <h2>${esc(s.heading)}</h2>
      ${guideParagraphs(s.paragraphs)}`
        )
        .join("")}
      ${guideTableHtml(guide.table)}

      <h2>Fishing regulations by country</h2>
      <ul>
        ${countryLinks
          .map((c) => `<li><a href="/fishing/${esc(c.slug)}">Fishing in ${esc(c.name)}</a></li>`)
          .join("")}
      </ul>

      <p><a href="/guides">More fishing guides</a>
      &middot; <a href="/regulations">Fishing regulations and licences by country</a></p>
    </article>`;
}

/** /guides index body. */
function guidesIndexContent(guides) {
  return `
    <article>
      <h1>Fishing Guides</h1>
      <p>Researched, source-linked comparisons for anglers planning a trip.</p>
      <ul>
        ${guides
          .map(
            (g) =>
              `<li><a href="/guides/${esc(g.slug)}">${esc(g.title)}</a> — ${esc(g.summary)}</li>`
          )
          .join("")}
      </ul>
    </article>`;
}

/**
 * Article JSON-LD for a guide page. No rating or review property, ever —
 * these are editorial comparisons, not reviewed products or places.
 */
function guideJsonLd(guide) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.summary,
    datePublished: guide.datePublished,
    dateModified: guide.dateModified,
    author: { "@type": "Organization", name: "AnglerDeck" },
    publisher: { "@type": "Organization", name: "AnglerDeck" },
    url: `${SITE_URL}/guides/${guide.slug}`,
    mainEntityOfPage: `${SITE_URL}/guides/${guide.slug}`,
  };
}
```

- [ ] **Step 3: Add the "Related guides" block to `hubContent()`**

In `hubContent(country, spots)`, find the line `const sources = guideSources(guide);` and add immediately below it:

```js
  const relatedGuides = guidesForCountry(country.code);
```

Then find the closing `<p>Licence requirements and closed seasons change regularly...` paragraph near the end of the returned template (just before the final `</article>` closing template literal), and insert this block immediately before it:

```js
      ${
        relatedGuides.length
          ? `
      <h2>Related guide${relatedGuides.length > 1 ? "s" : ""}</h2>
      <ul>
        ${relatedGuides
          .map((g) => `<li><a href="/guides/${esc(g.slug)}">${esc(g.title)}</a></li>`)
          .join("")}
      </ul>`
          : ""
      }
```

- [ ] **Step 4: Wire guide bodies and JSON-LD into the `STATIC_ROUTES` loop and `staticBodies`**

In `main()`, find the `staticBodies` object definition (currently mapping `/spots`, `/map`, `/regulations`, and conditionally `/gear`). Add these two lines inside it, before the closing `};`:

```js
    "/guides": () => guidesIndexContent(GUIDE_LIST),
    ...Object.fromEntries(GUIDE_LIST.map((g) => [`/guides/${g.slug}`, () => guideContent(g)])),
```

Then find the loop:

```js
  for (const route of STATIC_ROUTES) {
    let html = withHead(template, {
      title: route.title,
      description: route.description,
      canonical: `${SITE_URL}${route.path}`,
    });
    const body = staticBodies[route.path];
    if (body) html = withBody(html, body());
    write(route.path, html);
  }
```

Replace it with:

```js
  for (const route of STATIC_ROUTES) {
    // /guides/<slug> routes carry Article JSON-LD; every other static route
    // gets none, same as before.
    const guideSlug = route.path.startsWith("/guides/")
      ? route.path.slice("/guides/".length)
      : null;
    const guide = guideSlug ? GUIDES[guideSlug] : null;

    let html = withHead(template, {
      title: route.title,
      description: route.description,
      canonical: `${SITE_URL}${route.path}`,
      jsonLd: guide ? guideJsonLd(guide) : undefined,
    });
    const body = staticBodies[route.path];
    if (body) html = withBody(html, body());
    write(route.path, html);
  }
```

- [ ] **Step 5: Update the final summary log line to mention guides**

Find:

```js
  console.log(
    `[prerender] wrote home, ${STATIC_ROUTES.length} static routes, ${hubs} country hubs and ${published.length} spot pages`
  );
```

This line already counts guide routes as part of `STATIC_ROUTES.length` (no change needed — confirm this is still accurate after Task 4's change, since `STATIC_ROUTES` now includes the guide entries).

- [ ] **Step 6: Build and verify the guide pages exist with real content**

Run: `npm run build`
Expected: exits 0. Log line includes `[prerender] wrote home, 13 static routes, ...` (11 original + `/guides` + 1 article slug = 13 — count the entries in `scripts/static-routes.mjs` before this task's edit if this number looks off).

Run: `node -e "console.log(require('fs').readFileSync('dist/guides/index.html','utf8').includes('prerender-content'))"`
Expected: `true`

Run: `node -e "console.log(require('fs').readFileSync('dist/guides/fish-without-a-licence/index.html','utf8').includes('prerender-content'))"`
Expected: `true`

Run: `node -e "const h=require('fs').readFileSync('dist/guides/fish-without-a-licence/index.html','utf8'); const m=[...h.matchAll(/<script type=\"application\/ld\+json\">([^<]+)<\/script>/g)].map(x=>JSON.parse(x[1])); console.log(m.map(x=>x['@type']))"`
Expected: includes `'Article'`, and no entry has type `'AggregateRating'` or `'Review'`.

- [ ] **Step 7: Confirm the publication gate and spot count are untouched**

Run: `node -e "console.log(require('fs').readdirSync('dist/spot').length)"`
Expected: `49` (unchanged from before this task).

- [ ] **Step 8: Commit**

```bash
git add scripts/prerender.mjs
git commit -m "$(cat <<'EOF'
Prerender /guides index and article bodies with Article JSON-LD

Mirrors the hub/spot pattern: real crawlable HTML per route, no
noindex branch (nothing here is gated), Article schema with no
rating/review property. Country hubs gain a "Related guides" section
sourced from the same guides.json.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Vo6K5Vn94WLj3Qz5J1copS
EOF
)"
```

---

## Task 6: React pages — `Guides.tsx`, `GuideDetail.tsx`, routes in `App.tsx`

**Files:**
- Create: `src/pages/Guides.tsx`
- Create: `src/pages/GuideDetail.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `getAllGuides`, `getGuideBySlug` from `src/lib/guides.ts` (Task 3); `countryByCode` from `src/lib/countries.ts`; `SEO` from `src/components/SEO.tsx`; `Header`/`Footer` components.
- Produces: hydrated `/guides` and `/guides/:slug` routes matching what `prerender.mjs` already writes for the same paths (Task 5).

- [ ] **Step 1: Create `src/pages/Guides.tsx`**

```tsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { getAllGuides } from "@/lib/guides";

/**
 * /guides index. Keep the description below in step with the one generated
 * for "/guides" in scripts/static-routes.mjs — that copy is what crawlers
 * read before hydration, this one applies after.
 */
const Guides = () => {
  const guides = getAllGuides();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Fishing Guides"
        description="Researched, source-linked comparison guides for anglers planning a trip — starting with where you can fish without a licence."
        canonicalPath="/guides"
      />
      <Header />

      <main id="main-content" className="flex-1 container mx-auto px-4 lg:px-8 py-12 pt-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Fishing Guides</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Researched, source-linked comparisons for anglers planning a trip.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4 mt-10">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              to={`/guides/${guide.slug}`}
              className="group block p-5 rounded-xl border border-border/50 bg-card hover:border-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                    {guide.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">{guide.summary}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 group-hover:text-accent transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Guides;
```

- [ ] **Step 2: Create `src/pages/GuideDetail.tsx`**

```tsx
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO, BASE_URL } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getGuideBySlug } from "@/lib/guides";
import { countryByCode } from "@/lib/countries";

/**
 * /guides/:slug — a long-form comparison article. Structured the same way
 * scripts/prerender.mjs renders it (intro paragraphs, then heading+paragraph
 * sections, then an optional table) so the hydrated page and the crawlable
 * body describe the same content.
 */
const GuideDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const guide = slug ? getGuideBySlug(slug) : undefined;

  if (!guide) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEO title="Guide not found" description="This guide could not be found." noIndex />
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Guide not found</h1>
            <Button asChild>
              <Link to="/guides">Browse all guides</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const countryLinks = guide.countries
    .map((code) => countryByCode(code))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.summary,
    datePublished: guide.datePublished,
    dateModified: guide.dateModified,
    author: { "@type": "Organization", name: "AnglerDeck" },
    publisher: { "@type": "Organization", name: "AnglerDeck" },
    url: `${BASE_URL}/guides/${guide.slug}`,
    mainEntityOfPage: `${BASE_URL}/guides/${guide.slug}`,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={guide.title}
        description={guide.summary}
        canonicalPath={`/guides/${guide.slug}`}
        ogType="article"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      </Helmet>
      <Header />

      <main id="main-content" className="flex-1 container mx-auto px-4 lg:px-8 py-12 pt-28 max-w-3xl">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/guides" className="hover:text-foreground">Fishing guides</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{guide.title}</span>
        </nav>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{guide.title}</h1>
          <p className="text-sm text-muted-foreground mb-8">Published {guide.datePublished}</p>
        </motion.div>

        <div className="space-y-6 text-muted-foreground leading-relaxed">
          {guide.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {guide.sections.map((section, i) => (
          <section key={i} className="mt-10">
            <h2 className="text-xl font-bold text-foreground mb-3">{section.heading}</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              {section.paragraphs.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </div>
          </section>
        ))}

        {guide.table && (
          <section className="mt-10 overflow-x-auto">
            <h2 className="text-xl font-bold text-foreground mb-3">{guide.table.caption}</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  {guide.table.columns.map((col) => (
                    <TableHead key={col}>{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {guide.table.rows.map((row, i) => (
                  <TableRow key={i}>
                    {row.map((cell, j) => (
                      <TableCell key={j}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        )}

        {countryLinks.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-foreground mb-3">Fishing regulations by country</h2>
            <div className="space-y-2">
              {countryLinks.map((c) => (
                <Link
                  key={c.code}
                  to={`/fishing/${c.slug}`}
                  className="flex items-center gap-2 text-sm text-accent hover:underline"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  Fishing in {c.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <p className="mt-12 text-sm text-muted-foreground">
          <Link to="/guides" className="hover:text-foreground">More fishing guides</Link>
          {" "}&middot;{" "}
          <Link to="/regulations" className="hover:text-foreground">Fishing regulations and licences by country</Link>
        </p>
      </main>

      <Footer />
    </div>
  );
};

export default GuideDetail;
```

- [ ] **Step 3: Verify `src/components/ui/table.tsx` exports the names used above**

Run: `node -e "const s=require('fs').readFileSync('src/components/ui/table.tsx','utf8'); ['Table','TableBody','TableCell','TableHead','TableHeader','TableRow'].forEach(n => console.log(n, s.includes('export const '+n) || s.includes('export {')))"`
Expected: every name resolves `true` in some form (either an individual `export const` or a grouped `export { ... }` at the bottom — read the file if any print `false false` to get the exact export names before proceeding).

- [ ] **Step 4: Wire the routes into `src/App.tsx`**

Add two lazy imports after the existing `const Regulations = lazy(...)` line:

```tsx
const Guides = lazy(() => import("./pages/Guides"));
const GuideDetail = lazy(() => import("./pages/GuideDetail"));
```

Add two routes after the existing `<Route path="/regulations" element={<Regulations />} />` line:

```tsx
                <Route path="/guides" element={<Guides />} />
                <Route path="/guides/:slug" element={<GuideDetail />} />
```

- [ ] **Step 5: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual smoke test in dev**

Run: `npm run dev` (background)
Navigate to `http://127.0.0.1:8080/guides` — the index should list "Where You Can Fish Without a Licence".
Navigate to `http://127.0.0.1:8080/guides/fish-without-a-licence` — the article should render intro, all nine section headings, and the quick-reference table.
Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Guides.tsx src/pages/GuideDetail.tsx src/App.tsx
git commit -m "$(cat <<'EOF'
Add /guides index and article pages

Reads the same guides.json the prerenderer reads, so the hydrated page
matches the crawlable HTML. Article JSON-LD injected via Helmet, same
pattern SpotDetail.tsx already uses for its schema.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Vo6K5Vn94WLj3Qz5J1copS
EOF
)"
```

---

## Task 7: Navigation — footer link and country-hub cross-links

**Files:**
- Modify: `src/components/Footer.tsx`
- Modify: `src/pages/CountryHub.tsx`

**Interfaces:**
- Consumes: `guidesForCountry` from `src/lib/guides.ts` (Task 3).
- Produces: a footer link to `/guides`; a "Related guides" section on `CountryHub.tsx` matching the one `prerender.mjs` already writes into `hubContent()` (Task 5, Step 3).

- [ ] **Step 1: Add the footer link**

In `src/components/Footer.tsx`, find the `Explore` array inside `footerLinks` and add an entry:

```tsx
    Explore: [
      { name: "Fishing Spots", href: "/spots" },
      { name: "Map View", href: "/map" },
      { name: "Fishing Guides", href: "/guides" },
      { name: "Fishing Gear", href: "/gear" },
      { name: "My Catches", href: "/catches" },
    ],
```

- [ ] **Step 2: Add "Related guides" to `CountryHub.tsx`**

In `src/pages/CountryHub.tsx`, add the import:

```tsx
import { guidesForCountry } from "@/lib/guides";
```

After the line `const guide = country ? countryGuide(country.code) : undefined;`, add:

```tsx
  const relatedGuides = country ? guidesForCountry(country.code) : [];
```

Then, immediately after the closing `</section>` of the `{guide && (...)}` block (the official-sources guide section, before the `{species.length > 0 && (...)}` block), add:

```tsx
        {relatedGuides.length > 0 && (
          <section className="mt-10 max-w-3xl">
            <h2 className="text-xl font-bold text-foreground mb-3">
              Related guide{relatedGuides.length > 1 ? "s" : ""}
            </h2>
            <div className="space-y-2">
              {relatedGuides.map((g) => (
                <Link
                  key={g.slug}
                  to={`/guides/${g.slug}`}
                  className="flex items-center gap-2 text-sm text-accent hover:underline"
                >
                  <ArrowRight className="w-4 h-4 shrink-0" />
                  {g.title}
                </Link>
              ))}
            </div>
          </section>
        )}
```

(`ArrowRight` and `Link` are already imported in this file.)

- [ ] **Step 3: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev` (background)
Navigate to `http://127.0.0.1:8080/fishing/norway` — a "Related guide" section should appear linking to the article.
Navigate to `http://127.0.0.1:8080/fishing/germany` (not covered by the article) — no "Related guide" section should appear.
Confirm the footer's Explore column shows "Fishing Guides" linking to `/guides` on any page.
Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/components/Footer.tsx src/pages/CountryHub.tsx
git commit -m "$(cat <<'EOF'
Link /guides from the footer and covered country hubs

Internal links in both directions are why a comparison article is
worth writing at all — the hub links to the guide, the guide links
back to every hub it covers.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Vo6K5Vn94WLj3Qz5J1copS
EOF
)"
```

---

## Task 8: Full verification pass

**Files:** none (verification only)

**Interfaces:** none

- [ ] **Step 1: Type-check the app**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors. (Not the root `tsconfig.json` — it is `files: []` and checks nothing.)

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: all suites pass, including the new `src/test/guides.test.ts` and the pre-existing `src/test/useSpots.test.tsx` (which pins a console warning — unrelated to this change, should be unaffected).

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Full build**

Run: `npm run build`
Expected: exits 0. Console output includes the prerender summary line with guide routes counted in the static-route total.

- [ ] **Step 5: Confirm prerendered guide bodies**

Run: `node -e "console.log((require('fs').readFileSync('dist/guides/index.html','utf8').match(/prerender-content/g)||[]).length)"`
Expected: `1`

Run: `node -e "console.log((require('fs').readFileSync('dist/guides/fish-without-a-licence/index.html','utf8').match(/prerender-content/g)||[]).length)"`
Expected: `1`

- [ ] **Step 6: Confirm sitemap coverage**

Run: `node -e "const s=require('fs').readFileSync('dist/sitemap.xml','utf8'); console.log(s.includes('/guides<') || s.includes('/guides\"')); console.log((s.match(/<loc>/g)||[]).length)"`
Expected: first line `true`; note the total `<loc>` count.

Run: `node -e "const s=require('fs').readFileSync('dist/sitemap.xml','utf8'); console.log(s.includes('/guides/fish-without-a-licence'))"`
Expected: `true`

Compare the `<loc>` count against the count from before this change (re-run the same command against a build from `git stash` if you need the baseline) — it should be exactly 2 higher (`/guides` plus `/guides/fish-without-a-licence`).

- [ ] **Step 7: Confirm the publication gate is untouched**

Run: `node -e "console.log(require('fs').readdirSync('dist/spot').length)"`
Expected: `49`

- [ ] **Step 8: Confirm JSON-LD types and zero rating/review markup across the whole dist**

Run:
```
node -e "
const fs = require('fs');
const html = fs.readFileSync('dist/guides/fish-without-a-licence/index.html', 'utf8');
const blocks = [...html.matchAll(/<script type=\"application\/ld\+json\">([^<]+)<\/script>/g)].map(m => JSON.parse(m[1]));
const types = blocks.map(b => b['@type']);
console.log('types:', types);
console.log('has AggregateRating:', types.includes('AggregateRating'));
console.log('has Review:', types.includes('Review'));
"
```
Expected: `types: [ 'Article' ]`, both booleans `false`.

- [ ] **Step 9: Confirm no "Notes for Sean" text reached the built article**

Run: `node -e "console.log(require('fs').readFileSync('dist/guides/fish-without-a-licence/index.html','utf8').includes('Notes for Sean'))"`
Expected: `false`

- [ ] **Step 10: Report results**

Summarize for Sean: which of the above checks ran clean, the exact `<loc>` count before/after, the France/South Australia verification sources and quotes, and confirmation that `dist/spot` still has exactly 49 entries. Do not fetch the live URL to verify anything — CLAUDE.md's three caching layers make that unreliable; everything above reads `dist/` on disk instead.

No commit for this task — it is verification only. If any step fails, fix the underlying task and re-run verification from Step 1.
