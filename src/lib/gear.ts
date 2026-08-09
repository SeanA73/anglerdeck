/**
 * Affiliate gear: price banding, category artwork and spot matching.
 *
 * Shared by the AffiliateGear card, the /gear page and the admin preview so all
 * three obey the same compliance rules and produce the same ranking.
 */

import bands from "@/data/price-bands.json";

import rodsArt from "@/assets/gear/rods.svg";
import reelsArt from "@/assets/gear/reels.svg";
import luresArt from "@/assets/gear/lures.svg";
import fliesArt from "@/assets/gear/flies.svg";
import lineArt from "@/assets/gear/line.svg";
import apparelArt from "@/assets/gear/apparel.svg";
import electronicsArt from "@/assets/gear/electronics.svg";
import tackleArt from "@/assets/gear/tackle.svg";
import genericArt from "@/assets/gear/generic.svg";

/* -------------------------------------------------------------------------- */
/* Price bands                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * WHY THIS EXISTS — DO NOT REPLACE WITH A NUMBER.
 *
 * The Amazon Associates Operating Agreement requires any displayed price to
 * come from an Amazon API and be refreshed on the order of an hour. We have no
 * such API: PA-API retired on 15 May 2026 and the replacement Creators API
 * needs qualifying sales we do not yet have. `affiliate_products.price` is a
 * hand-entered figure that goes stale within days, so publishing it is both a
 * policy violation and, in practice, a lie to the reader.
 *
 * A band is editorial commentary about where a product sits in the market —
 * ours to publish, and still useful to someone deciding whether to click. It
 * stays roughly true as prices drift, which a decimal never does.
 *
 * If a live Amazon price feed is ever wired up, delete the band and render the
 * API value — not the stored column.
 *
 * Thresholds live in src/data/price-bands.json because scripts/prerender.mjs
 * reads the same file for the prerendered /gear body and the two must agree.
 */
export const PRICE_BANDS: { label: string; maxUsd: number | null }[] = bands;

/** Editorial band for a stored price. Returns null when no price is recorded. */
export const priceBand = (price: number | null | undefined): string | null => {
  if (price == null || !Number.isFinite(price)) return null;
  return (
    PRICE_BANDS.find((b) => b.maxUsd == null || price <= b.maxUsd)?.label ?? null
  );
};

/* -------------------------------------------------------------------------- */
/* Category artwork                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Amazon's terms forbid storing their product images — they may only be linked
 * through short-lived API URLs, which we cannot mint. Hotlinked
 * m.media-amazon.com URLs also rot without notice, so the seeded ones were a
 * broken-image risk on top of the policy problem.
 *
 * These local illustrations replace them. `image_url` stays in the schema for
 * merchants where we do have hosting rights; it is simply never populated for
 * Amazon rows.
 */
const CATEGORY_ART: Record<string, string> = {
  rods: rodsArt,
  combos: rodsArt,
  reels: reelsArt,
  lures: luresArt,
  flies: fliesArt,
  line: lineArt,
  apparel: apparelArt,
  electronics: electronicsArt,
  tackle: tackleArt,
  tools: tackleArt,
  storage: tackleArt,
};

export const categoryArt = (category: string | null | undefined): string =>
  CATEGORY_ART[String(category ?? "").toLowerCase().trim()] ?? genericArt;

/** Amazon's image CDNs, in the shapes their URLs actually take. */
const AMAZON_IMAGE_HOST =
  /^https?:\/\/[^/]*\b(media-amazon|images-amazon|ssl-images-amazon)\.com\//i;

/**
 * The artwork to show for a product.
 *
 * `20260810_affiliate_amazon_image_compliance.sql` nulls image_url on every
 * Amazon row, but the admin form still accepts a URL, so this refuses to render
 * an Amazon-hosted image regardless of what is in the column. A migration fixes
 * the rows that exist today; this stops the next one being created.
 */
export const gearImage = (product: {
  image_url?: string | null;
  merchant?: string | null;
  category?: string | null;
}): string => {
  const url = product.image_url?.trim();
  const isAmazon =
    String(product.merchant ?? "").toLowerCase() === "amazon" ||
    (url ? AMAZON_IMAGE_HOST.test(url) : false);
  if (url && !isAmazon) return url;
  return categoryArt(product.category);
};

/* -------------------------------------------------------------------------- */
/* Click-target copy                                                           */
/* -------------------------------------------------------------------------- */

export const merchantLabel = (merchant: string | null | undefined): string =>
  String(merchant ?? "").replace(/_/g, " ").trim();

/**
 * Amazon rows say "Check price on Amazon" — required, since we are deliberately
 * not showing one. Other merchants keep generic copy.
 */
export const gearCtaLabel = (merchant: string | null | undefined): string => {
  const m = String(merchant ?? "").toLowerCase();
  if (m === "amazon") return "Check price on Amazon";
  const label = merchantLabel(merchant);
  return label ? `View on ${label}` : "View product";
};

/* -------------------------------------------------------------------------- */
/* Spot matching                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Match weights.
 *
 * Water type is close to universal in the catalog — almost every product is
 * tagged freshwater or saltwater — so on its own it cannot rank anything, it
 * can only break ties. Species is what actually differentiates one product from
 * another on a given spot, so it carries real weight, and an exact species tag
 * beats a partial one.
 */
const WEIGHT = {
  speciesExact: 4,
  speciesPartial: 2,
  waterTypeExact: 1,
  waterTypePartial: 1,
} as const;

/**
 * Tokens shorter than this never carry a partial match, so a stray "a" or "of"
 * in a tag cannot pull in unrelated products.
 */
const MIN_PARTIAL_TOKEN = 3;

/** Words that appear in tags and product names without narrowing anything. */
const STOPWORDS = new Set([
  "fishing", "fish", "gear", "kit", "set", "combo", "pack", "and", "the", "for", "with",
]);

/** Lowercase, strip accents and punctuation, collapse whitespace. */
const normalise = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const tokenise = (s: string): string[] => normalise(s).split(" ").filter(Boolean);

const meaningful = (tokens: string[]): string[] =>
  tokens.filter((t) => t.length >= MIN_PARTIAL_TOKEN && !STOPWORDS.has(t));

export type MatchStrength = "none" | "partial" | "exact";

/**
 * How well one tag matches one spot value.
 *
 * The bug this replaces compared strings with `===`, so the generic tags the
 * catalog actually uses ("trout", "bass", "salmon") never matched the specific
 * species the spots carry ("rainbow trout", "largemouth bass", "Atlantic
 * salmon"). Species matching simply never fired, leaving every freshwater
 * product tied on water type alone.
 *
 * Matching is whole-token in both directions: "bass" matches "sea bass", and
 * "yellowfin tuna" matches "tuna". It is deliberately NOT substring matching —
 * that would make "bass" match "bassdash" and "cod" match "codling".
 */
export const matchStrength = (tag: string, value: string): MatchStrength => {
  const a = normalise(tag);
  const b = normalise(value);
  if (!a || !b) return "none";
  if (a === b) return "exact";

  const tagTokens = tokenise(a);
  const valueTokens = tokenise(b);
  const tagSet = new Set(tagTokens);
  const valueSet = new Set(valueTokens);

  const tagCore = meaningful(tagTokens);
  const valueCore = meaningful(valueTokens);

  const tagInsideValue = tagCore.length > 0 && tagCore.every((t) => valueSet.has(t));
  const valueInsideTag = valueCore.length > 0 && valueCore.every((t) => tagSet.has(t));

  return tagInsideValue || valueInsideTag ? "partial" : "none";
};

/**
 * Water realms — the guard against a species-name coincidence outranking
 * common sense.
 *
 * Common names borrow across families. Cairns Black Marlin Grounds holds
 * "coral trout", a reef grouper, and token matching happily scored freshwater
 * chest waders and a bass lure kit onto an offshore heavy-tackle page because
 * their "trout" tag is a fair whole-word hit. Confidently wrong is worse than
 * the arbitrary tie this whole change replaced, so a product whose declared
 * water conflicts with the spot's scores nothing at all.
 *
 * "Fly fishing" is a technique rather than a water body, but a product tagged
 * only "fly fishing" is freshwater fly gear in this catalog — saltwater fly
 * gear carries "saltwater" too, which puts it in both realms and exempts it.
 *
 * Keys are the lowercased `spots.type` values. Add a row here if that column
 * ever gains a value.
 */
const WATER_REALM: Record<string, "fresh" | "salt"> = {
  freshwater: "fresh",
  saltwater: "salt",
  "fly fishing": "fresh",
};

const realmsOf = (values: readonly string[]): Set<"fresh" | "salt"> => {
  const out = new Set<"fresh" | "salt">();
  for (const v of values) {
    const realm = WATER_REALM[normalise(v)];
    if (realm) out.add(realm);
  }
  return out;
};

export interface GearMatchContext {
  /** 'Freshwater' | 'Saltwater' | 'Fly Fishing' — one per spot, several per country. */
  waterTypes?: string[];
  /** Spot species names, e.g. "rainbow trout". */
  species?: string[];
}

export interface GearMatchable {
  tags: string[] | null;
  category: string | null;
}

/**
 * Relevance of a product to a spot or country.
 *
 * Each tag contributes its single best match rather than one per species hit,
 * so a product tagged "trout" does not score twice on a river holding both
 * brown and rainbow trout. Breadth of relevant tags is rewarded; accidental
 * species duplication is not.
 *
 * `category` is included because the seeded catalog documents it as a matching
 * field alongside `tags`. In practice no category value equals a water type or
 * a species, so it contributes nothing today.
 */
export const gearScore = (
  product: GearMatchable,
  { waterTypes = [], species = [] }: GearMatchContext
): number => {
  const tags = [...(product.tags ?? []), product.category ?? ""].filter(Boolean);
  if (!tags.length) return 0;

  // Freshwater gear on a saltwater spot (or the reverse) is not a match however
  // well its species tags happen to read — see WATER_REALM. A product that
  // declares no water at all is not contradicted by anything, so it still
  // ranks on species.
  const productRealms = realmsOf(product.tags ?? []);
  const spotRealms = realmsOf(waterTypes);
  if (
    productRealms.size > 0 &&
    spotRealms.size > 0 &&
    ![...productRealms].some((r) => spotRealms.has(r))
  ) {
    return 0;
  }

  let total = 0;
  for (const tag of tags) {
    let best = 0;
    for (const sp of species) {
      const m = matchStrength(tag, sp);
      if (m === "exact") best = Math.max(best, WEIGHT.speciesExact);
      else if (m === "partial") best = Math.max(best, WEIGHT.speciesPartial);
    }
    for (const wt of waterTypes) {
      const m = matchStrength(tag, wt);
      if (m === "exact") best = Math.max(best, WEIGHT.waterTypeExact);
      else if (m === "partial") best = Math.max(best, WEIGHT.waterTypePartial);
    }
    total += best;
  }
  return total;
};

/**
 * Highest-scoring products first. Array.prototype.sort is stable, so products
 * that tie keep the incoming order — which callers supply as created_at desc,
 * making the result deterministic rather than arbitrary.
 */
export const rankGear = <T extends GearMatchable>(
  products: T[],
  context: GearMatchContext
): T[] => {
  const scores = new Map<T, number>(products.map((p) => [p, gearScore(p, context)]));
  return [...products].sort((a, b) => (scores.get(b) ?? 0) - (scores.get(a) ?? 0));
};
