/**
 * Build-time prerender step.
 *
 * Vite outputs a single client-rendered index.html, which means crawlers see an
 * empty shell — no title, no copy, no spot data. This script runs after
 * `vite build`, fetches spots from Supabase, and writes a real static HTML file
 * per route with the correct <head> tags and a crawlable content block.
 *
 * React still hydrates and takes over on load, so users get the full SPA. The
 * prerendered markup mirrors what the app renders from the same data, so there
 * is no cloaking.
 *
 * Usage: node scripts/prerender.mjs   (wired into `npm run build`)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const env = loadEnv("production", root, "");
const SITE_URL = (env.VITE_SITE_URL || "https://anglerdeck.com").replace(/\/$/, "");
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const COUNTRY_NAMES = {
  US: "United States", CA: "Canada", AU: "Australia", NZ: "New Zealand",
  GB: "United Kingdom", DE: "Germany", FR: "France", ES: "Spain", IT: "Italy",
  NO: "Norway", SE: "Sweden", FI: "Finland", ZA: "South Africa",
  AR: "Argentina", BR: "Brazil", MX: "Mexico", JP: "Japan", RU: "Russia",
  PL: "Poland",
};

const distanceKm = (a, b) => {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

async function fetchSpots() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("[prerender] Supabase env vars missing — skipping spot pages");
    return [];
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/spots?select=*&order=id`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase returned HTTP ${res.status}`);
  return res.json();
}

/** Replace the head tags Vite ships with route-specific ones. */
function withHead(template, { title, description, canonical, jsonLd, noIndex }) {
  let html = template;

  html = html.replace(/<title>.*?<\/title>/s, `<title>${esc(title)}</title>`);
  html = html.replace(
    /<meta\s+name="description"\s+content=".*?"\s*\/?>/s,
    `<meta name="description" content="${esc(description)}" />`
  );

  const extra = [
    `<link rel="canonical" href="${esc(canonical)}" />`,
    noIndex ? `<meta name="robots" content="noindex,follow" />` : "",
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    jsonLd
      ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`
      : "",
  ]
    .filter(Boolean)
    .join("\n    ");

  return html.replace("</head>", `  ${extra}\n  </head>`);
}

/**
 * Inject crawlable content into #root. React's createRoot().render() replaces
 * this on hydration, so it is only ever seen by crawlers and no-JS clients.
 */
function withBody(html, contentHtml) {
  return html.replace(
    /(<div id="root">)(<\/div>)/,
    `$1<div id="prerender-content">${contentHtml}</div>$2`
  );
}

const list = (items) =>
  items?.length
    ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`
    : "";

function spotContent(spot, all) {
  const country = COUNTRY_NAMES[spot.country] || spot.country;
  const gear = spot.recommended_gear || {};
  const nearby = all
    .filter((s) => s.id !== spot.id)
    .map((s) => ({ s, km: distanceKm(spot.coordinates, s.coordinates) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 5);

  return `
    <article>
      <h1>${esc(spot.title)}</h1>
      <p><strong>${esc(spot.location)}, ${esc(country)}</strong> &middot; ${esc(spot.type)} &middot; ${esc(spot.difficulty)}</p>
      <p>${esc(spot.description)}</p>

      <h2>Species</h2>
      ${list(spot.species)}

      <h2>Best times to fish</h2>
      ${list(spot.best_times)}

      <h2>Recommended gear</h2>
      <h3>Essential</h3>
      ${list(gear.essential)}
      <h3>Optional</h3>
      ${list(gear.optional)}

      <h2>Regulations and requirements</h2>
      ${list(spot.regulations)}
      <p>Rules change regularly — always confirm with the relevant fisheries authority before you fish.</p>

      <h2>Nearby fishing spots</h2>
      <ul>
        ${nearby
          .map(
            ({ s, km }) =>
              `<li><a href="/spot/${esc(s.slug)}">${esc(s.title)}</a> — ${Math.round(km)} km away</li>`
          )
          .join("")}
      </ul>

      <p><a href="/spots">Browse all fishing spots</a> &middot; <a href="/map">View the fishing map</a></p>
    </article>`;
}

function spotJsonLd(spot) {
  const country = COUNTRY_NAMES[spot.country] || spot.country;
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: spot.title,
    description: spot.description,
    url: `${SITE_URL}/spot/${spot.slug}`,
    geo: {
      "@type": "GeoCoordinates",
      latitude: spot.coordinates?.lat,
      longitude: spot.coordinates?.lng,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: spot.location,
      addressCountry: spot.country,
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Water type", value: spot.type },
      { "@type": "PropertyValue", name: "Difficulty", value: spot.difficulty },
      {
        "@type": "PropertyValue",
        name: "Target species",
        value: (spot.species || []).join(", "),
      },
    ],
    containedInPlace: { "@type": "Country", name: country },
  };
}

const STATIC_ROUTES = [
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

function write(routePath, html) {
  const dir = path.join(dist, routePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
}

async function main() {
  const templatePath = path.join(dist, "index.html");
  if (!fs.existsSync(templatePath)) {
    console.error("[prerender] dist/index.html not found — run vite build first");
    process.exit(1);
  }
  const template = fs.readFileSync(templatePath, "utf8");

  let spots = [];
  try {
    spots = await fetchSpots();
  } catch (err) {
    console.warn(`[prerender] could not load spots (${err}) — static routes only`);
  }

  for (const route of STATIC_ROUTES) {
    const html = withHead(template, {
      title: route.title,
      description: route.description,
      canonical: `${SITE_URL}${route.path}`,
    });
    write(route.path, html);
  }

  for (const spot of spots) {
    const country = COUNTRY_NAMES[spot.country] || spot.country;
    const title = `${spot.title} — Fishing in ${spot.location}, ${country} | AnglerDeck`;
    const description = String(spot.description || "").slice(0, 155);

    let html = withHead(template, {
      title,
      description,
      canonical: `${SITE_URL}/spot/${spot.slug}`,
      jsonLd: spotJsonLd(spot),
    });
    html = withBody(html, spotContent(spot, spots));
    write(`/spot/${spot.slug}`, html);
  }

  console.log(
    `[prerender] wrote ${STATIC_ROUTES.length} static routes and ${spots.length} spot pages`
  );
}

main().catch((err) => {
  console.error("[prerender] failed:", err);
  process.exit(1);
});
