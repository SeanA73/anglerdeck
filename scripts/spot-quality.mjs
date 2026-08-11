/**
 * Shared publication quality gate for spot pages.
 *
 * Every spot page follows the same template, so a spot with nothing but the
 * template filled in is a thin page. This gate decides which spots are good
 * enough to publish at all: a spot scoring below PUBLISH_THRESHOLD is not
 * prerendered, not listed anywhere on the site, not in the sitemap, and its URL
 * does not resolve. The row stays in the database untouched — this is a
 * publication decision, not a data one.
 *
 * It used to gate indexing only: failing spots were still published, marked
 * `noindex,follow`. That was changed on 11 Aug 2026 after AdSense rejected the
 * site for low-value content on 10 Aug. `noindex` keeps a page out of search
 * results and does nothing about a human reviewer browsing it, and the failing
 * spots were three quarters of the site — 143 pages at a median 178 words with
 * no verified access detail, against 49 published pages at a median 306.
 *
 * Everything published is therefore also indexed; the two are now the same
 * decision. Spots publish themselves as their data improves — no code change
 * needed, just better rows in the database and a rebuild. That cuts both ways:
 * filling in access detail no longer promotes a page from noindex to indexed, it
 * brings a page into existence. Promote deliberately.
 *
 * Used by scripts/prerender.mjs (which pages to write), vite.config.ts (which
 * URLs to put in the sitemap), src/hooks/useSpots.ts (what the client renders
 * and links to) and scripts/access-audit.mjs, so no two of them can disagree.
 */

/** Minimum score for a spot page to be published. */
export const PUBLISH_THRESHOLD = 5;

/**
 * Kept because publication and indexing are now the same decision, and callers
 * that reason about indexing are still correct to consult this number.
 */
export const INDEX_THRESHOLD = PUBLISH_THRESHOLD;

const arr = (v) => (Array.isArray(v) ? v : []);

/**
 * Content-depth score. `featured` is weighted heavily because those are the
 * marquee destinations — the ones with real search demand behind them.
 *
 * Reads snake_case fields, so callers pass raw database rows, not the camelCase
 * `FishingSpot` the app maps them to.
 */
export function spotScore(spot) {
  let score = 0;
  if (spot.featured === true) score += 2;
  if (String(spot.description || "").length >= 250) score += 1;
  if (arr(spot.species).length >= 3) score += 1;
  if (arr(spot.regulations).length >= 3) score += 1;
  if (arr(spot.best_times).length >= 3) score += 1;
  if (arr(spot.recommended_gear?.essential).length >= 4) score += 1;
  // Verified access detail is a strong signal that a page is genuinely useful
  // rather than templated, so it is worth two points.
  if (hasAccessDetail(spot.access)) score += 2;
  // Angler reviews are first-hand experience — the one thing that cannot be
  // researched or generated — so they count for the most.
  //
  // reviewCount must only ever count *approved* reviews. This file does not
  // query; callers supply the count (prerender.mjs, vite.config.ts,
  // useSpots.ts, access-audit.mjs) and each filters status=eq.approved. A
  // caller that forgets would let an unmoderated review publish a spot page.
  if ((spot.reviewCount ?? 0) >= 1) score += 2;
  if ((spot.reviewCount ?? 0) >= 3) score += 1;
  return score;
}

/** True when access has been verified against a source, not just stubbed out. */
function hasAccessDetail(access) {
  if (!access || typeof access !== "object") return false;
  return Boolean(
    access.ramp ||
      access.parking ||
      access.walkIn ||
      arr(access.facilities).length ||
      access.notes
  );
}

/** True when a spot is good enough to publish a page for. */
export function isPublished(spot) {
  return spotScore(spot) >= PUBLISH_THRESHOLD;
}

/**
 * Former name, kept as an alias so any caller still thinking in terms of
 * indexing resolves to the same verdict rather than growing a second gate.
 * Prefer isPublished: an unpublished spot is not merely unindexed, it has no
 * page at all.
 */
export const isIndexable = isPublished;
