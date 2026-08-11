/**
 * Types for the plain-ESM gate in spot-quality.mjs.
 *
 * The gate is shared by build scripts (plain ESM) and TypeScript — vite.config.ts
 * for the sitemap and src/hooks/useSpots.ts for what the client renders. Without
 * this file each TypeScript caller needs a `@ts-expect-error` and gets `any`,
 * which is a poor trade for a function whose whole job is to be consulted
 * identically everywhere.
 */

/**
 * What the gate reads: a raw `spots` row, snake_case, plus an approved-review
 * count the caller supplies. Every field is optional so a partial select still
 * type-checks — a missing field simply scores nothing.
 */
export interface ScorableSpot {
  featured?: boolean | null;
  description?: string | null;
  species?: string[] | null;
  regulations?: string[] | null;
  best_times?: string[] | null;
  recommended_gear?: { essential?: string[] | null } | null;
  access?: unknown;
  /** Approved reviews only — see the note in spot-quality.mjs. */
  reviewCount?: number;
}

/** Minimum score for a spot page to be published. */
export const PUBLISH_THRESHOLD: number;

/** Alias of PUBLISH_THRESHOLD — publication and indexing are one decision now. */
export const INDEX_THRESHOLD: number;

export function spotScore(spot: ScorableSpot): number;

/** True when a spot is good enough to publish a page for. */
export function isPublished(spot: ScorableSpot): boolean;

/** Former name of isPublished, kept so callers cannot grow a second gate. */
export const isIndexable: typeof isPublished;
