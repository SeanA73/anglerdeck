/**
 * The public routes that are not driven by Supabase data.
 *
 * Shared by scripts/prerender.mjs (which writes the HTML) and vite.config.ts
 * (which lists them in the sitemap), for the same reason spot-quality.mjs is
 * shared: a route that is prerendered but missing from the sitemap is invisible
 * to crawlers that only read the sitemap, and a route in the sitemap that was
 * never prerendered is a shell served to a crawler that asked for it. The two
 * lists must be one list.
 *
 * `/` is deliberately absent — it needs a data-driven body, so prerender.mjs
 * builds it separately, and vite-plugin-sitemap emits it without being asked.
 *
 * Gated routes (/auth, /account, /catches, /community, /admin/*) are absent on
 * purpose: they render nothing useful without a session, so they are neither
 * prerendered nor listed. robots.txt disallows the first three.
 *
 * The `description` strings here are a SECOND copy of the copy in each page's
 * <SEO> component, and this one is what crawlers read — the React tag only
 * applies after hydration. So a marketing claim edited in the page alone still
 * ships here. /pricing is the worked example: "AI Fishing Assistant" was pulled
 * from Pricing.tsx but survived in this file and went out in the prerendered
 * <head>. When changing a page's description, change both.
 */
export const STATIC_ROUTES = [
  { path: "/spots", title: "Fishing Spots — AnglerDeck", description: "Browse curated fishing spots worldwide. Filter by country, species, freshwater or saltwater." },
  { path: "/map", title: "Interactive Fishing Map — AnglerDeck", description: "Find fishing spots near you on an interactive map. Filter by species, water type and difficulty." },
  { path: "/pricing", title: "Pricing — AnglerDeck Pro", description: "Free forever, or upgrade to Pro for unlimited spots, catch logging and the AI Fishing Assistant." },
  { path: "/regulations", title: "Fishing Regulations — AnglerDeck", description: "Links to official fishing authorities and licence information by country." },
  { path: "/support", title: "Help Centre — AnglerDeck", description: "Answers to common questions about AnglerDeck." },
  { path: "/contact", title: "Contact — AnglerDeck", description: "Get in touch with the AnglerDeck team." },
  { path: "/privacy", title: "Privacy Policy — AnglerDeck", description: "How AnglerDeck handles your data." },
  { path: "/terms", title: "Terms of Service — AnglerDeck", description: "The terms governing use of AnglerDeck." },
  { path: "/cookies", title: "Cookie Policy — AnglerDeck", description: "How AnglerDeck uses cookies." },
  { path: "/licenses", title: "Licences — AnglerDeck", description: "Open source licences used by AnglerDeck." },
];

export const STATIC_ROUTE_PATHS = STATIC_ROUTES.map((r) => r.path);
