import data from "@/data/guides.json";

/**
 * Typed access to src/data/guides.json — the /guides comparison articles.
 *
 * Three surfaces read this: the index (Guides.tsx), the article page
 * (GuideArticle.tsx) and the country hubs (CountryHub.tsx, for the cross-links).
 * scripts/guides.mjs reads the same file with fs for the prerenderer and the
 * route list, exactly as country-guides.json is shared — one file, no second
 * copy of a claim to drift.
 *
 * Articles carry ISO country codes rather than URLs. The official source links
 * a section shows are resolved from country-guides.json at render time, so an
 * article can never cite a stale authority the hub beside it has already
 * corrected, and it can never make a licensing claim the researched country data
 * does not support.
 */

/** A paragraph. `text` may carry `**bold**` and `*italic*`, nothing else. */
export interface GuideParagraph {
  type: "p";
  text: string;
}

/** A bulleted list. Items take the same inline markup as a paragraph. */
export interface GuideList {
  type: "list";
  items: string[];
}

/** A comparison table. `rows` are parallel to `columns`. */
export interface GuideTable {
  type: "table";
  columns: string[];
  rows: string[][];
}

export type GuideBlock = GuideParagraph | GuideList | GuideTable;

export interface GuideSection {
  heading: string;
  /**
   * ISO codes this section is about. Optional — a section with no country
   * (the "what catches people out" summary, for instance) renders no source
   * block rather than an empty one.
   */
  countries?: string[];
  blocks: GuideBlock[];
}

export interface GuideArticleData {
  slug: string;
  /** The document title, site name included. */
  title: string;
  /** The h1, which is shorter than the title on purpose. */
  headline: string;
  /** Meta description. Keep under about 155 characters. */
  description: string;
  /** The teaser used on the index and on the country hubs. */
  summary: string;
  datePublished: string;
  dateModified?: string;
  /** Every country the article covers — this is what makes hubs link to it. */
  countries: string[];
  intro: GuideBlock[];
  sections: GuideSection[];
}

const GUIDES = (data as unknown as { articles: GuideArticleData[] }).articles;

/** Articles in file order, which is the order the index lists them in. */
export const guides = (): GuideArticleData[] => GUIDES;

/** Undefined for an unknown slug, so the page can render a not-found state. */
export const guideBySlug = (slug: string): GuideArticleData | undefined =>
  GUIDES.find((g) => g.slug === slug);

/** Articles covering a country, for the hub cross-links. */
export const guidesForCountry = (code: string): GuideArticleData[] =>
  GUIDES.filter((g) => g.countries.includes(code));

export const guidePath = (slug: string): string => `/guides/${slug}`;
