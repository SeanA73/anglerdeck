import guides from "@/data/spot-guides.json";

/**
 * Typed access to src/data/spot-guides.json — the per-spot depth layer.
 *
 * Three surfaces read this: SpotDetail.tsx (through SpotGuideSections),
 * scripts/prerender.mjs (which parses the JSON directly, since it cannot import
 * TypeScript) and scripts/check-spot-guides.mjs (the validator). It is the same
 * arrangement as country-guides.ts and exists for the same two reasons: one copy
 * of a claim, and prose that is reviewed in git rather than typed into a
 * database the build reads at build time.
 *
 * Why this exists at all: the Supabase row holds structured fields, and
 * rendering those as bulleted lists produced a spot page with roughly 209 words
 * of unique content. The publication gate scores field presence, so every
 * published spot already maxes it out — there was no data lever left, and the
 * pages were still thin. This is the depth that the schema cannot express.
 *
 * `sources` is rendered on the page. `sourcing` and `sourceNotes` are not: they
 * are provenance for whoever edits this next, and sourceNotes in particular
 * records which claims were deliberately left out for lack of a readable
 * official page. Read it before researching a spot again.
 */
export interface SpotGuideSection {
  /** Section heading. Deliberately per-spot — see the note in the JSON. */
  heading: string;
  /** One to three paragraphs of sourced prose. */
  body: string;
}

export interface SpotGuide {
  sections: SpotGuideSection[];
  /** Rendered under the guide as visible citations. */
  sources: { name: string; url: string }[];
  sourcing: "full" | "partial";
  sourceNotes?: string;
}

const GUIDES = guides as unknown as Record<string, SpotGuide>;

/**
 * Returns undefined for a spot with no guide yet, so callers render nothing
 * rather than an empty heading. Most spots have no guide — these are written a
 * few at a time, deliberately, and a spot without one still renders its
 * structured fields exactly as before.
 */
export const spotGuide = (slug: string): SpotGuide | undefined =>
  slug === "_README" ? undefined : GUIDES[slug];

/** Slugs that currently have a guide. Used by the validator and for reporting. */
export const spotGuideSlugs = (): string[] =>
  Object.keys(GUIDES).filter((k) => k !== "_README");
