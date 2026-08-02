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
import { isIndexable, INDEX_THRESHOLD } from "./spot-quality.mjs";

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

/**
 * Countries are parsed out of src/lib/countries.ts so the hub slugs, names and
 * blurbs cannot drift between the app and the prerenderer.
 */
const COUNTRIES = (() => {
  const src = fs.readFileSync(path.join(root, "src/lib/countries.ts"), "utf8");
  const out = [];
  const re = /\{\s*code:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*slug:\s*"([^"]+)",\s*blurb:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;
  let m;
  while ((m = re.exec(src))) {
    out.push({ code: m[1], name: m[2], slug: m[3], blurb: m[4].replace(/\\"/g, '"') });
  }
  return out;
})();

const COUNTRY_NAMES = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.name]));
const countrySlug = (code) =>
  COUNTRIES.find((c) => c.code === code)?.slug || String(code).toLowerCase();

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

/**
 * Angler reviews are the most valuable content on a spot page — first-hand
 * experience that cannot be researched or generated. They must reach crawlers
 * in the initial HTML, and they drive the AggregateRating markup that produces
 * star ratings in search results.
 */
async function fetchReviews() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return new Map();
  try {
    const res = await fetch(
      // status=eq.approved is belt and braces: RLS already hides unapproved
      // rows from the anon key. Both are deliberate — an unapproved review must
      // never reach crawlable HTML or AggregateRating, so neither the filter
      // nor the policy is the single point of failure.
      `${SUPABASE_URL}/rest/v1/spot_reviews?select=spot_id,author_name,rating,title,content,visit_date,created_at&status=eq.approved&order=created_at.desc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const bySpot = new Map();
    for (const r of await res.json()) {
      if (!bySpot.has(r.spot_id)) bySpot.set(r.spot_id, []);
      bySpot.get(r.spot_id).push(r);
    }
    return bySpot;
  } catch (err) {
    // A 400 here almost always means 20260802_add_review_moderation.sql has not
    // been run yet, so status=eq.approved filters on a column that does not
    // exist. Deliberately no unfiltered retry: falling back would put
    // unmoderated reviews into crawlable HTML and AggregateRating, which is the
    // exact failure this migration exists to prevent. Better to ship zero
    // reviews and say so loudly.
    console.warn(`[prerender] could not load reviews (${err})`);
    if (String(err).includes("400")) {
      console.warn(
        "[prerender] 400 usually means the review moderation migration has " +
          "not been applied. Spot pages will build with zero reviews, which " +
          "can drop spots below the indexing threshold."
      );
    }
    return new Map();
  }
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

/** Renders a <ul>, tolerating null/undefined or a non-array value. */
const list = (items) =>
  Array.isArray(items) && items.length
    ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`
    : "";

/** Access details — omitted entirely when nothing has been verified. */
function accessSection(access) {
  if (!access || typeof access !== "object") return "";

  const rows = [];
  const from = [access.shore ? "land-based" : null, access.boat ? "boat" : null]
    .filter(Boolean)
    .join(" or ");
  if (from) rows.push(`<li><strong>Fish from:</strong> ${esc(from)}</li>`);
  if (access.ramp) rows.push(`<li><strong>Boat ramp:</strong> ${esc(access.ramp)}</li>`);
  if (access.parking) rows.push(`<li><strong>Parking:</strong> ${esc(access.parking)}</li>`);
  if (access.walkIn) rows.push(`<li><strong>Walk in:</strong> ${esc(access.walkIn)}</li>`);
  if (Array.isArray(access.facilities) && access.facilities.length) {
    rows.push(`<li><strong>Facilities:</strong> ${esc(access.facilities.join(", "))}</li>`);
  }
  if (!rows.length && !access.notes) return "";

  return `
      <h2>Getting there &amp; access</h2>
      ${rows.length ? `<ul>${rows.join("")}</ul>` : ""}
      ${access.notes ? `<p>${esc(access.notes)}</p>` : ""}
      ${
        access.sourceUrl
          ? `<p><a href="${esc(access.sourceUrl)}" rel="noopener noreferrer">Access information source</a></p>`
          : ""
      }`;
}

function spotContent(spot, all, reviews = []) {
  const country = COUNTRY_NAMES[spot.country] || spot.country;
  const gear = (spot.recommended_gear && typeof spot.recommended_gear === "object")
    ? spot.recommended_gear
    : {};
  const nearby = all
    .filter((s) => s.id !== spot.id && s.coordinates?.lat != null)
    .map((s) => ({ s, km: distanceKm(spot.coordinates, s.coordinates) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 5);

  return `
    <article>
      <h1>${esc(spot.title)}</h1>
      <p><strong>${esc(spot.location)}, ${esc(country)}</strong> &middot; ${esc(spot.type)} &middot; ${esc(spot.difficulty)}</p>
      <p>${esc(spot.description)}</p>

      ${accessSection(spot.access)}

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

      ${reviewsSection(reviews)}

      <h2>Nearby fishing spots</h2>
      <ul>
        ${nearby
          .map(
            ({ s, km }) =>
              `<li><a href="/spot/${esc(s.slug)}">${esc(s.title)}</a> — ${Math.round(km)} km away</li>`
          )
          .join("")}
      </ul>

      <p>
        <a href="/fishing/${esc(countrySlug(spot.country))}">More fishing spots in ${esc(country)}</a>
        &middot; <a href="/spots">Browse all fishing spots</a>
        &middot; <a href="/map">View the fishing map</a>
      </p>
    </article>`;
}

/** Country hub page body — the parent in the link hierarchy. */
function hubContent(country, spots) {
  const species = [...new Set(spots.flatMap((s) => s.species || []))].sort();
  const types = {};
  spots.forEach((s) => (types[s.type] = (types[s.type] || 0) + 1));

  return `
    <article>
      <nav><a href="/spots">Fishing spots</a> / ${esc(country.name)}</nav>
      <h1>Fishing in ${esc(country.name)}</h1>
      <p>${esc(country.blurb)}</p>
      <p>${spots.length} researched spots — ${Object.entries(types)
        .map(([t, n]) => `${n} ${esc(t)}`)
        .join(", ")}.</p>

      <h2>Species you can target</h2>
      ${list(species)}

      <h2>Fishing spots in ${esc(country.name)}</h2>
      <ul>
        ${spots
          .map(
            (s) =>
              `<li><a href="/spot/${esc(s.slug)}">${esc(s.title)}</a> — ${esc(s.location)}. ${esc(s.type)}, ${esc(s.difficulty)}. Target species: ${esc((s.species || []).join(", "))}.</li>`
          )
          .join("")}
      </ul>

      <p>Licence requirements and closed seasons change regularly. Always confirm
      with the relevant fisheries authority before you fish — each spot page links
      to its source.</p>
      <p><a href="/map">View the fishing map</a></p>
    </article>`;
}

/** Angler reviews rendered into the crawlable body. */
function reviewsSection(reviews) {
  if (!reviews?.length) return "";
  const avg = reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length;

  return `
      <h2>Angler reviews</h2>
      <p>${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}, average rating ${avg.toFixed(1)} out of 5.</p>
      ${reviews
        .slice(0, 10)
        .map(
          (r) => `
      <article>
        <h3>${esc(r.title || `${r.rating} out of 5`)}</h3>
        <p><strong>${esc(r.author_name || "Angler")}</strong>${
          r.visit_date ? ` &middot; fished ${esc(r.visit_date)}` : ""
        } &middot; rated ${esc(r.rating)}/5</p>
        <p>${esc(r.content)}</p>
      </article>`
        )
        .join("")}`;
}

function spotJsonLd(spot, reviews = []) {
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
    // Only emit ratings when real reviews exist — never fabricate them.
    ...(reviews.length
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: (
              reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
            ).toFixed(1),
            reviewCount: reviews.length,
            bestRating: 5,
            worstRating: 1,
          },
          review: reviews.slice(0, 5).map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.author_name || "Angler" },
            datePublished: r.created_at,
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 1,
            },
            name: r.title || undefined,
            reviewBody: r.content,
          })),
        }
      : {}),
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

  const reviewsBySpot = await fetchReviews();
  // Review counts feed the indexing quality gate.
  for (const spot of spots) {
    spot.reviewCount = (reviewsBySpot.get(spot.id) || []).length;
  }

  for (const route of STATIC_ROUTES) {
    const html = withHead(template, {
      title: route.title,
      description: route.description,
      canonical: `${SITE_URL}${route.path}`,
    });
    write(route.path, html);
  }

  let indexed = 0;
  for (const spot of spots) {
    const country = COUNTRY_NAMES[spot.country] || spot.country;
    const title = `${spot.title} — Fishing in ${spot.location}, ${country} | AnglerDeck`;
    const description = String(spot.description || "").slice(0, 155);
    const indexable = isIndexable(spot);
    if (indexable) indexed++;

    const reviews = reviewsBySpot.get(spot.id) || [];

    let html = withHead(template, {
      title,
      description,
      canonical: `${SITE_URL}/spot/${spot.slug}`,
      jsonLd: spotJsonLd(spot, reviews),
      // Thin pages stay crawlable and keep passing link equity, but out of the index.
      noIndex: !indexable,
    });
    html = withBody(html, spotContent(spot, spots, reviews));
    write(`/spot/${spot.slug}`, html);
  }

  // Country hubs — the parent tier in the link hierarchy. Always indexable:
  // they aggregate real spot data, so they are not thin even when a country has
  // few spots, and they are what can rank for head terms.
  let hubs = 0;
  for (const country of COUNTRIES) {
    const countrySpots = spots.filter((s) => s.country === country.code);
    if (countrySpots.length === 0) continue;

    const title = `Fishing in ${country.name} — Spots, Licences & Access | AnglerDeck`;
    const description = `${countrySpots.length} researched fishing spots in ${country.name}, with verified access details, licence requirements and seasons.`;

    let html = withHead(template, {
      title,
      description,
      canonical: `${SITE_URL}/fishing/${country.slug}`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: title,
        description,
        url: `${SITE_URL}/fishing/${country.slug}`,
        about: { "@type": "Country", name: country.name },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Fishing spots", item: `${SITE_URL}/spots` },
            { "@type": "ListItem", position: 2, name: country.name, item: `${SITE_URL}/fishing/${country.slug}` },
          ],
        },
      },
    });
    html = withBody(html, hubContent(country, countrySpots));
    write(`/fishing/${country.slug}`, html);
    hubs++;
  }

  console.log(
    `[prerender] wrote ${STATIC_ROUTES.length} static routes, ${hubs} country hubs and ${spots.length} spot pages`
  );
  if (spots.length) {
    console.log(
      `[prerender] ${indexed} indexable, ${spots.length - indexed} noindex (quality score < ${INDEX_THRESHOLD})`
    );
  }
}

main().catch((err) => {
  console.error("[prerender] failed:", err);
  process.exit(1);
});
