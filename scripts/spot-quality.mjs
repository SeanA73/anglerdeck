/**
 * Shared indexing quality gate for spot pages.
 *
 * Every spot page follows the same template, so publishing all of them at once
 * risks a site-wide thin-content assessment — much harder to recover from than
 * slow growth. Instead we index a strong subset and mark the rest
 * `noindex,follow`, so they still pass link equity and stay reachable by users
 * while their content is deepened.
 *
 * Spots become indexable automatically as their data improves — no code change
 * needed, just better rows in the database and a rebuild.
 *
 * Used by both scripts/prerender.mjs (robots meta) and vite.config.ts (sitemap)
 * so the two can never disagree.
 */

/** Minimum score for a spot page to be indexed. */
export const INDEX_THRESHOLD = 5;

const arr = (v) => (Array.isArray(v) ? v : []);

/**
 * Content-depth score. `featured` is weighted heavily because those are the
 * marquee destinations — the ones with real search demand behind them.
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

export function isIndexable(spot) {
  return spotScore(spot) >= INDEX_THRESHOLD;
}
