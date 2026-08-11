import guides from "@/data/country-guides.json";

/**
 * Typed access to src/data/country-guides.json — the single source of truth for
 * per-country licensing and seasonal guidance.
 *
 * Three surfaces read this data: the country hubs (CountryHub.tsx), /regulations
 * (Regulations.tsx) and the prerenderer (scripts/prerender.mjs, which parses the
 * JSON directly since it cannot import TypeScript). It replaced
 * regulation-regions.json, which held a second copy of the same licensing facts
 * for /regulations alone — and two copies of a licence rule drift.
 *
 * `sourcing` and `sourceNotes` are provenance metadata for whoever edits this
 * next. They are deliberately not rendered: they record which claims were
 * verified against an official page and which were left out for lack of one.
 */
export interface CountryGuide {
  /** Primary official licensing body. */
  authority: { name: string; url: string };
  /** Further official pages. May be empty. */
  links: { name: string; url: string }[];
  /** Two to four sentences, for /regulations. */
  regulations: string;
  /** How licensing actually works there — the practical version. */
  licensing: string;
  /** The seasonal shape of the year. */
  seasons: string;
  /** The character of the water and the species. */
  water: string;
  sourcing: "full" | "partial";
  sourceNotes?: string;
}

const GUIDES = guides as unknown as Record<string, CountryGuide>;

/**
 * Returns undefined for a country with no guide yet, so callers render nothing
 * rather than an empty section. Every code in COUNTRIES has one today; a country
 * added without a guide should degrade quietly, not print headings with no text.
 */
export const countryGuide = (code: string): CountryGuide | undefined =>
  code === "_README" ? undefined : GUIDES[code];
