/**
 * Types for the plain-ESM inline parser in guide-inline.mjs.
 *
 * Same arrangement as spot-quality.d.mts: the module is shared between a build
 * script and TypeScript in the browser bundle, and without this file the
 * TypeScript caller needs a `@ts-expect-error` and gets `any` — a poor trade for
 * a function whose whole job is to be applied identically on both sides.
 */

/** One run of text plus the marks that apply to it. Marks do not nest. */
export interface InlineRun {
  text: string;
  strong?: boolean;
  em?: boolean;
}

/** Split article text into runs on `**bold**` and `*italic*`. */
export function inlineRuns(text: string): InlineRun[];

/** True when the text carries no inline marks. */
export function isPlain(text: string): boolean;
