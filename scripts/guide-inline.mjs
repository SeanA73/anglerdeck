/**
 * The one inline-markup parser for /guides article text.
 *
 * Guide articles are stored as structured blocks in src/data/guides.json rather
 * than as markdown, so scripts/prerender.mjs needs no markdown parser — it has
 * none today and this is what keeps that true. But prose still needs bold for
 * the country leads and italic for the foreign terms (fiskekort, yugyoken,
 * putyovka, comunicazione), so exactly two marks survive: `**bold**` and
 * `*italic*`. Nothing else. No links, no headings, no lists inside a paragraph —
 * those are block types.
 *
 * This module is deliberately plain ESM with no imports, for the same reason
 * spot-quality.mjs is: it is consulted by both a build script (prerender.mjs,
 * which wraps the tokens in HTML) and TypeScript in the browser bundle
 * (src/pages/GuideArticle.tsx, which wraps them in React elements). Two thin
 * renderers over one parser cannot disagree about what `**` means; two parsers
 * eventually would, and the prerendered HTML and the hydrated page would then
 * differ — which is the drift class CLAUDE.md keeps warning about.
 *
 * Keep it dependency-free and DOM-free so importing it from the client costs
 * nothing and importing it from node needs no build step.
 */

/**
 * Split text into runs, each carrying the marks that apply to it.
 *
 * Non-greedy and single-pass, so marks do not nest — `**a *b* c**` yields one
 * bold run containing literal asterisks rather than a bold-italic run. That is
 * an accepted limit, not an oversight: nesting is not worth a real parser here,
 * and the articles do not use it.
 *
 * Unmatched or stray asterisks are left alone and rendered literally, so a typo
 * in the JSON shows up as a visible asterisk rather than swallowing the rest of
 * the paragraph.
 */
export function inlineRuns(text) {
  const src = String(text ?? "");
  const runs = [];
  // Bold first: `**` must win over `*` or every bold marker parses as two
  // empty italics.
  const re = /\*\*([\s\S]+?)\*\*|\*([\s\S]+?)\*/g;
  let last = 0;
  let m;

  while ((m = re.exec(src))) {
    if (m.index > last) runs.push({ text: src.slice(last, m.index) });
    if (m[1] !== undefined) runs.push({ text: m[1], strong: true });
    else runs.push({ text: m[2], em: true });
    last = re.lastIndex;
  }
  if (last < src.length) runs.push({ text: src.slice(last) });

  return runs;
}

/** True when the text carries no inline marks, so a caller can skip the wrap. */
export function isPlain(text) {
  const runs = inlineRuns(text);
  return runs.length === 1 && !runs[0].strong && !runs[0].em;
}
