/**
 * One-off audit: which spots still lack verified access detail, and what would
 * happen to their publication status if access were added.
 *
 * Read the "potential" column as what it now is. Access detail is worth +2, so
 * for most unpublished spots it is the difference between having no page at all
 * and having a published, indexed one — not the old promotion from `noindex` to
 * indexed. Every spot listed under "access alone would publish them" is a page
 * that appears on the site the moment its migration is applied and the site is
 * rebuilt, so work through that list deliberately rather than in bulk.
 *
 * Read-only, uses the publishable key like scripts/prerender.mjs does.
 *   node scripts/access-audit.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { spotScore, PUBLISH_THRESHOLD } from "./spot-quality.mjs";

// Same env resolution as scripts/prerender.mjs, so this audit sees exactly the
// database the build reads from.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = loadEnv("production", root, "");

const URL_ = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const spots = await (
  await fetch(`${URL_}/rest/v1/spots?select=*&order=id`, { headers })
).json();

const reviews = await (
  // Approved only, so the audit reports the same score the build will compute.
  await fetch(`${URL_}/rest/v1/spot_reviews?select=spot_id&status=eq.approved`, { headers })
).json();

const reviewCount = new Map();
for (const r of Array.isArray(reviews) ? reviews : []) {
  reviewCount.set(r.spot_id, (reviewCount.get(r.spot_id) ?? 0) + 1);
}

const rows = spots.map((s) => {
  const withCount = { ...s, reviewCount: reviewCount.get(s.id) ?? 0 };
  const score = spotScore(withCount);
  // access is worth +2; what the score would be if access were added
  const hasAccess = score !== spotScore({ ...withCount, access: null });
  return {
    slug: s.slug,
    title: s.title,
    country: s.country,
    featured: s.featured === true,
    hasAccess,
    score,
    potential: hasAccess ? score : score + 2,
  };
});

const published = rows.filter((r) => r.score >= PUBLISH_THRESHOLD);
const missing = rows.filter((r) => !r.hasAccess);
const withAccess = rows.filter((r) => r.hasAccess);

console.log(`total spots:            ${rows.length}`);
console.log(`currently published:    ${published.length}`);
console.log(`unpublished (no page):  ${rows.length - published.length}`);
console.log(`have access detail:     ${withAccess.length}`);
console.log(`missing access detail:  ${missing.length}\n`);

console.log("=== PUBLISHED but missing access (deepen these first) ===");
for (const r of missing.filter((r) => r.score >= PUBLISH_THRESHOLD)) {
  console.log(`  ${r.score} -> ${r.potential}  ${r.slug}  (${r.country})`);
}

console.log(
  `\n=== NOT published, but access alone would publish them (score+2 >= ${PUBLISH_THRESHOLD}) ===`
);
for (const r of missing.filter(
  (r) => r.score < PUBLISH_THRESHOLD && r.potential >= PUBLISH_THRESHOLD
)) {
  console.log(`  ${r.score} -> ${r.potential}  ${r.slug}  (${r.country})`);
}

console.log("\n=== NOT published, access alone is not enough ===");
for (const r of missing.filter((r) => r.potential < PUBLISH_THRESHOLD)) {
  console.log(`  ${r.score} -> ${r.potential}  ${r.slug}  (${r.country})`);
}

console.log("\n=== already has access detail ===");
for (const r of withAccess) console.log(`  ${r.score}  ${r.slug}`);
