/**
 * Node-side access to src/data/guides.json — the /guides articles.
 *
 * Two build-time callers share this so they cannot disagree about what exists:
 * static-routes.mjs (which turns it into routes, and therefore into sitemap
 * entries) and prerender.mjs (which writes the bodies). That is the same
 * arrangement, and the same reason, as spot-quality.mjs being shared — a route
 * prerendered but absent from the sitemap is invisible to sitemap-only crawlers,
 * and a route in the sitemap that was never prerendered serves a shell.
 *
 * The JSON is read with fs rather than imported, matching how prerender.mjs
 * already reads country-guides.json and price-bands.json. That keeps this module
 * node-only: **do not import it from src/**. The client reads the same JSON
 * through src/lib/guides.ts, and the parser they genuinely must share lives in
 * guide-inline.mjs, which has no fs dependency for exactly this reason.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const data = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/guides.json"), "utf8")
);

/** Articles in file order — the order the /guides index lists them in. */
export const GUIDES = data.articles ?? [];

/** Where the index lives. One place, so nothing hardcodes the string twice. */
export const GUIDES_INDEX_PATH = "/guides";

export const guidePath = (slug) => `${GUIDES_INDEX_PATH}/${slug}`;

/**
 * The /guides index plus one route per article, in the STATIC_ROUTES shape.
 *
 * Adding an article to guides.json therefore adds a prerendered page and a
 * sitemap entry with no code change, which is the whole point of the section
 * being data-driven. The index's own title and description are here rather than
 * in the JSON because they describe the section, not any article.
 */
export function guideRoutes() {
  return [
    {
      path: GUIDES_INDEX_PATH,
      title: "Fishing Guides — AnglerDeck",
      description:
        "In-depth guides to the rules that decide where you can fish — licences, permits and access, compared across countries and sourced to official fisheries agencies.",
    },
    ...GUIDES.map((g) => ({
      path: guidePath(g.slug),
      title: g.title,
      description: g.description,
    })),
  ];
}

/** Articles that cover a given country, for the hub cross-links. */
export const guidesForCountry = (code) =>
  GUIDES.filter((g) => (g.countries || []).includes(code));
