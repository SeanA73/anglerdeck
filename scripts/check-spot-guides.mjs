/**
 * Validates src/data/spot-guides.json before it is committed.
 *
 * The same job scripts/check-access-migration.mjs does for access records, and
 * for the same reason: the content rules are easy to agree with and easy to
 * forget at 11pm on the fifth spot of a batch. This enforces them mechanically.
 *
 * Checks, per guide:
 *   - the slug exists in Supabase and is currently PUBLISHED (an unpublished
 *     spot has no page, so prose written for it renders nowhere)
 *   - at least one section, each with a heading and a body
 *   - the body clears a minimum length — the whole point is depth
 *   - at least one source, every source https (rule 2)
 *   - `sourcing` is "full" or "partial", and "partial" carries sourceNotes
 *   - no bag or size numbers anywhere in the prose (rule 3)
 *   - headings are not reused across every spot, which would rebuild the
 *     template this file exists to escape
 *
 *   node scripts/check-spot-guides.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { spotScore, isPublished } from "./spot-quality.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = loadEnv("production", root, "");

const guides = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/spot-guides.json"), "utf8")
);

const headers = {
  apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
  Authorization: `Bearer ${env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
};

const spots = await (
  await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/spots?select=*`, { headers })
).json();

if (!Array.isArray(spots) || !spots.length) {
  console.error(
    "FAIL: Supabase returned no spots. Cannot validate slugs — check the migration ordering rule in CLAUDE.md."
  );
  process.exit(1);
}

// Fifth read path filtering status=eq.approved. See CLAUDE.md item 2 — there is
// no central chokepoint, so a new reader means a new filter.
const reviews = await (
  await fetch(
    `${env.VITE_SUPABASE_URL}/rest/v1/spot_reviews?select=spot_id&status=eq.approved`,
    { headers }
  )
).json();

const reviewCounts = new Map();
if (Array.isArray(reviews)) {
  for (const r of reviews) {
    reviewCounts.set(r.spot_id, (reviewCounts.get(r.spot_id) || 0) + 1);
  }
}

const bySlug = new Map(spots.map((s) => [s.slug, s]));

// Rule 3: no specific bag or size numbers. Broader than the access checker's
// pattern, because prose has more ways to say it than a jsonb field does.
//
// This WARNS rather than fails, deliberately. Not every number with a unit is a
// rule 3 violation: rule 3 exists to keep stale bag and size limits off the
// site, and a health consumption advisory is a different thing that CLAUDE.md
// specifically wants published (Sydney Harbour is the worked example). The
// pattern's job is to make a human look at every such number, not to decide.
const LIMIT_PATTERN =
  /\b\d+\s*(?:fish|salmon|trout|bass|per (?:day|angler|rod|person))|\bbag limit\b|\b(?:minimum|maximum) (?:size|length)\b|\b\d+\s*(?:cm|centimetres|inches|in\.|lb|lbs|pounds|kg|kilos|g|grams?)\b/i;

const MIN_BODY_WORDS = 60;
const MIN_TOTAL_WORDS = 250;

const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;

let checked = 0;
let bad = 0;
const headingUse = new Map();

for (const [slug, guide] of Object.entries(guides)) {
  if (slug === "_README") continue;
  checked++;
  const label = slug;
  const fail = (msg) => {
    console.error(`FAIL ${label}: ${msg}`);
    bad++;
  };
  const warn = (msg) => console.error(`WARN ${label}: ${msg}`);

  const spot = bySlug.get(slug);
  if (!spot) {
    fail("slug not present in spots table");
    continue;
  }

  const score = spotScore({ ...spot, reviewCount: reviewCounts.get(spot.id) || 0 });
  if (!isPublished({ ...spot, reviewCount: reviewCounts.get(spot.id) || 0 })) {
    fail(
      `spot is not published (score ${score}) — prose written for it renders nowhere`
    );
  }

  if (!Array.isArray(guide.sections) || !guide.sections.length) {
    fail("no sections");
    continue;
  }

  let total = 0;
  for (const [i, section] of guide.sections.entries()) {
    const where = `section ${i + 1}`;
    if (!section.heading?.trim()) fail(`${where}: missing heading`);
    if (!section.body?.trim()) {
      fail(`${where}: missing body`);
      continue;
    }
    const n = words(section.body);
    total += n;
    if (n < MIN_BODY_WORDS) {
      fail(`${where} ("${section.heading}"): ${n} words, minimum ${MIN_BODY_WORDS}`);
    }
    const m = section.body.match(LIMIT_PATTERN);
    if (m) warn(`${where}: looks like a bag/size number — "${m[0]}" (rule 3)`);

    const h = section.heading?.trim();
    if (h) headingUse.set(h, (headingUse.get(h) || 0) + 1);
  }

  if (total < MIN_TOTAL_WORDS) {
    fail(`${total} words total, minimum ${MIN_TOTAL_WORDS} — depth is the point`);
  }

  if (!Array.isArray(guide.sources) || !guide.sources.length) {
    fail("no sources (rule 2)");
  } else {
    for (const s of guide.sources) {
      if (!s.url?.startsWith("https://")) fail(`source is not https — ${s.url}`);
      if (!s.name?.trim()) fail(`source has no name — ${s.url}`);
    }
  }

  if (guide.sourcing !== "full" && guide.sourcing !== "partial") {
    fail(`sourcing must be "full" or "partial", got ${JSON.stringify(guide.sourcing)}`);
  }
  if (guide.sourcing === "partial" && !guide.sourceNotes?.trim()) {
    fail('sourcing is "partial" but sourceNotes is empty — record what was left out');
  }
}

// A heading used on most spots means the sections have become a template again,
// which is the exact failure this file was created to avoid.
if (checked >= 5) {
  for (const [heading, n] of headingUse) {
    if (n > checked * 0.6) {
      console.error(
        `WARN: heading "${heading}" appears on ${n} of ${checked} guides — that is a template, not an article`
      );
    }
  }
}

const published = spots.filter((s) =>
  isPublished({ ...s, reviewCount: reviewCounts.get(s.id) || 0 })
).length;

console.log(
  `\n${checked} guide(s) checked, ${bad} failure(s). ${checked}/${published} published spots now have researched prose.`
);
process.exit(bad ? 1 : 0);
