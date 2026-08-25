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
import { isPublished, PUBLISH_THRESHOLD } from "./spot-quality.mjs";
import { STATIC_ROUTES } from "./static-routes.mjs";

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

/**
 * Per-country licensing and seasonal guidance, from the same JSON
 * src/lib/country-guides.ts hands to the React pages, so the prerendered body
 * and the hydrated page cannot drift.
 *
 * This is the single source of truth for both /regulations and the licensing,
 * seasons and water sections of every country hub. It replaced
 * regulation-regions.json, which covered four of nineteen countries and held a
 * second copy of licensing facts that also appear on the hubs.
 *
 * Everything in it is sourced to a government fisheries agency, a statutory
 * licensing body or a park authority, and it carries no bag or size limits
 * (content rules 1 and 3). `sourcing` and `sourceNotes` in that file are
 * provenance metadata and are deliberately never rendered.
 */
const COUNTRY_GUIDES = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/country-guides.json"), "utf8")
);

const countryGuide = (code) => (code === "_README" ? undefined : COUNTRY_GUIDES[code]);

/**
 * Per-spot researched prose, from the same JSON src/lib/spot-guides.ts hands to
 * SpotGuideSections, so the prerendered body and the hydrated page cannot drift.
 *
 * This is the depth layer the Supabase row cannot carry. A spot page built from
 * the row alone is a description plus six bulleted field lists — roughly 209
 * words of unique content, which is what AdSense rejected as low-value twice.
 * The publication gate cannot help: it scores whether fields are populated, and
 * every published spot already maxes it out.
 *
 * Most spots have no entry. That is deliberate — these are researched a few at a
 * time — and a spot without one renders exactly as it did before.
 */
const SPOT_GUIDES = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/spot-guides.json"), "utf8")
);

const spotGuide = (slug) => (slug === "_README" ? undefined : SPOT_GUIDES[slug]);

/** Official source links for a country: the authority first, then any others. */
const guideSources = (guide) =>
  guide ? [guide.authority, ...(guide.links || [])] : [];

/**
 * Price bands for /gear, from the same JSON src/lib/gear.ts reads.
 *
 * The prerendered gear page must never carry a number either: Amazon's terms
 * only permit a displayed price sourced live from their API, and we have none.
 * The long-form reasoning is in the PRICE_BANDS comment in src/lib/gear.ts.
 */
const PRICE_BANDS = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/price-bands.json"), "utf8")
);

const priceBand = (price) => {
  const n = Number(price);
  if (price == null || !Number.isFinite(n)) return null;
  return PRICE_BANDS.find((b) => b.maxUsd == null || n <= b.maxUsd)?.label ?? null;
};

/** Mirrors CATEGORY_LABELS in src/pages/Gear.tsx — keep the two in step. */
const GEAR_CATEGORY_LABELS = {
  rods: "Rods",
  combos: "Rod & reel combos",
  reels: "Reels",
  lures: "Lures",
  flies: "Flies",
  line: "Line & leader",
  apparel: "Clothing & eyewear",
  electronics: "Electronics",
  tackle: "Tackle",
  tools: "Tools",
  storage: "Storage & packs",
};

const gearCategoryLabel = (category) => {
  const key = String(category ?? "").toLowerCase().trim();
  if (GEAR_CATEGORY_LABELS[key]) return GEAR_CATEGORY_LABELS[key];
  return key ? key.charAt(0).toUpperCase() + key.slice(1) : "Other gear";
};

const gearCtaLabel = (merchant) => {
  const m = String(merchant ?? "").toLowerCase();
  if (m === "amazon") return "Check price on Amazon";
  const label = String(merchant ?? "").replace(/_/g, " ").trim();
  return label ? `View on ${label}` : "View product";
};

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

/**
 * Active affiliate products for the /gear body.
 *
 * Unlike spots, an empty result here is not fatal — /gear degrades to head tags
 * only, exactly as it did before it had a body, and every other route is
 * unaffected. Losing the whole build over an affiliate catalog would be a worse
 * outcome than shipping one thin page.
 */
async function fetchGearProducts() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/affiliate_products?select=id,title,description,price,affiliate_url,merchant,category&is_active=eq.true&order=category.asc,title.asc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[prerender] could not load affiliate products (${err}) — /gear will be head-only`);
    return [];
  }
}

/**
 * Replace the head tags Vite ships with route-specific ones.
 *
 * No `noindex` branch: every route this script writes is meant to be indexed.
 * Spots that are not good enough to index are not good enough to publish, so
 * they get no file at all — see the gate in spot-quality.mjs.
 */
function withHead(template, { title, description, canonical, jsonLd }) {
  let html = template;

  html = html.replace(/<title>.*?<\/title>/s, `<title>${esc(title)}</title>`);
  html = html.replace(
    /<meta\s+name="description"\s+content=".*?"\s*\/?>/s,
    `<meta name="description" content="${esc(description)}" />`
  );

  const extra = [
    `<link rel="canonical" href="${esc(canonical)}" />`,
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

/**
 * Trim a description to something Google will not cut off itself.
 *
 * A plain slice(0, 155) lands mid-word on almost every spot — "…Considered the
 * premier fly fishing destination" — so back up to the last space and mark the
 * elision. Trailing punctuation is dropped first so the result never reads
 * ",…" or ".…".
 */
function metaDescription(text, limit = 155) {
  const s = String(text ?? "").replace(/\s+/g, " ").trim();
  if (s.length <= limit) return s;

  const cut = s.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  const trimmed = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
  return `${trimmed.replace(/[\s.,;:!?—–-]+$/, "")}…`;
}

/** Renders a <ul>, tolerating null/undefined or a non-array value. */
const list = (items) =>
  Array.isArray(items) && items.length
    ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`
    : "";

/**
 * One spot as a list item, shared by the country hubs and /spots so the two
 * cannot describe the same spot differently. The country name is only worth
 * printing where the surrounding page is not already about one country.
 */
const spotListItem = (s, countryName) =>
  `<li><a href="/spot/${esc(s.slug)}">${esc(s.title)}</a> — ${esc(s.location)}${
    countryName ? `, ${esc(countryName)}` : ""
  }. ${esc(s.type)}, ${esc(s.difficulty)}. Target species: ${esc((s.species || []).join(", "))}.</li>`;

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

/**
 * Researched prose for one spot, with its citations. Omitted entirely when the
 * spot has no guide, so an undeepened page keeps its previous shape rather than
 * gaining empty headings.
 *
 * Kept structurally identical to SpotGuideSections.tsx — same order, same
 * headings, sources in the same place — because a crawler reading this body and
 * a reader seeing the hydrated page should not be shown two different articles.
 */
function spotGuideSection(slug) {
  const guide = spotGuide(slug);
  if (!guide || !Array.isArray(guide.sections) || !guide.sections.length) return "";

  const sections = guide.sections
    .map((s) => `<h2>${esc(s.heading)}</h2><p>${esc(s.body)}</p>`)
    .join("");

  const sources = Array.isArray(guide.sources) && guide.sources.length
    ? `<h3>Sources</h3><ul>${guide.sources
        .map(
          (s) =>
            `<li><a href="${esc(s.url)}" rel="noopener noreferrer">${esc(s.name)}</a></li>`
        )
        .join("")}</ul>`
    : "";

  return `\n      ${sections}\n      ${sources}`;
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
      ${spotGuideSection(spot.slug)}

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

/**
 * Country hub page body — the parent in the link hierarchy.
 *
 * The three guide sections are the substance of this page. Before they existed a
 * hub was a one-line blurb over a spot list, which for the countries holding two
 * published spots was itself thin content — the same problem the publication gate
 * was built to solve one level down. The prose is sourced; see the note on
 * COUNTRY_GUIDES above.
 */
function hubContent(country, spots) {
  const species = [...new Set(spots.flatMap((s) => s.species || []))].sort();
  const types = {};
  spots.forEach((s) => (types[s.type] = (types[s.type] || 0) + 1));
  const guide = countryGuide(country.code);
  const sources = guideSources(guide);

  return `
    <article>
      <nav><a href="/spots">Fishing spots</a> / ${esc(country.name)}</nav>
      <h1>Fishing in ${esc(country.name)}</h1>
      <p>${esc(country.blurb)}</p>
      <p>${spots.length} researched spots — ${Object.entries(types)
        .map(([t, n]) => `${n} ${esc(t)}`)
        .join(", ")}.</p>
      ${
        guide
          ? `
      <h2>Licences and permits in ${esc(country.name)}</h2>
      <p>${esc(guide.licensing)}</p>

      <h2>When to fish in ${esc(country.name)}</h2>
      <p>${esc(guide.seasons)}</p>

      <h2>What the fishing is like</h2>
      <p>${esc(guide.water)}</p>`
          : ""
      }

      <h2>Species you can target</h2>
      ${list(species)}

      <h2>Fishing spots in ${esc(country.name)}</h2>
      <ul>
        ${spots.map((s) => spotListItem(s)).join("")}
      </ul>
      ${
        sources.length
          ? `
      <h2>Official sources</h2>
      <ul>
        ${sources
          .map(
            (l) =>
              `<li><a href="${esc(l.url)}" rel="noopener noreferrer">${esc(l.name)}</a></li>`
          )
          .join("")}
      </ul>`
          : ""
      }

      <p>Licence requirements and closed seasons change regularly. Always confirm
      with the relevant fisheries authority before you fish — each spot page links
      to its source.</p>
      <p><a href="/regulations">Fishing regulations and licences by country</a>
      &middot; <a href="/map">View the fishing map</a></p>
    </article>`;
}

/**
 * /spots body.
 *
 * This route had head tags but no body, so the single highest-impression page
 * on the site after the home page served crawlers an empty #root. It mirrors
 * the Spots page: the same h1 and intro, the "Browse by country" hub links it
 * renders above the grid, and the cards in the grid itself. Grouping by country
 * is that page's own country filter expressed as static markup.
 *
 * Only published spots are listed, because only they have a page to link to.
 * Unpublished spots are not written at all, so listing one would be a link to a
 * URL that resolves to the SPA fallback. The counts here are counts of published
 * spots for the same reason — this page must not advertise a catalogue larger
 * than the one it can show.
 */
function spotsContent(spots, countriesWithSpots) {
  return `
    <article>
      <h1>Explore Fishing Spots</h1>
      <p>Discover the best fishing locations worldwide. Filter by country,
      species and water type. ${spots.length} researched spots across
      ${countriesWithSpots.length} countries.</p>

      <h2>Browse by country</h2>
      <ul>
        ${countriesWithSpots
          .map(
            (c) =>
              `<li><a href="/fishing/${esc(c.slug)}">Fishing in ${esc(c.name)}</a> — ${c.spots.length} ${c.spots.length === 1 ? "spot" : "spots"}</li>`
          )
          .join("")}
      </ul>
      ${countriesWithSpots
        .map(
          (c) => `
      <h2>Fishing spots in ${esc(c.name)}</h2>
      <ul>
        ${c.spots.map((s) => spotListItem(s, c.name)).join("")}
      </ul>`
        )
        .join("")}

      <p><a href="/map">View the fishing map</a> &middot;
      <a href="/regulations">Fishing regulations and licences</a></p>

      <p>Licence requirements and closed seasons change regularly. Always
      confirm with the relevant fisheries authority before you fish — each spot
      page links to its source.</p>
    </article>`;
}

/**
 * /map body.
 *
 * A map is not textually representable and this does not pretend otherwise: it
 * describes what the map view actually does — a marker per spot coloured by
 * water type, filters for water type and country, a popup per marker — and then
 * reproduces the spot list the page itself renders in its mobile sheet.
 *
 * That sheet shows name, location and water type, and the marker popup adds
 * nothing else static (its extra fields are a photo and live weather), so this
 * list carries the same three fields. Difficulty and species are deliberately
 * left out: they appear nowhere on the map view, and adding them here to catch
 * more queries would be padding the prerendered copy past what the page shows.
 */
function mapContent(spots, countriesWithSpots) {
  return `
    <article>
      <h1>Interactive Fishing Map</h1>
      <p>${spots.length} spots worldwide.</p>
      <p>The map plots every published spot as a marker, coloured by water type
      — green for freshwater, blue for saltwater, amber for fly fishing — and
      filters by water type and by country. Selecting a marker opens the spot's
      name, location, water type and current conditions, with a link through to
      its full page.</p>
      <p>The map needs JavaScript. The same spots are listed below, grouped by
      country, with the location and water type the map shows.</p>
      ${countriesWithSpots
        .map(
          (c) => `
      <h2>Fishing spots in ${esc(c.name)}</h2>
      <ul>
        ${c.spots
          .map(
            (s) =>
              `<li><a href="/spot/${esc(s.slug)}">${esc(s.title)}</a> — ${esc(s.location)}, ${esc(c.name)}. ${esc(s.type)}.</li>`
          )
          .join("")}
      </ul>`
        )
        .join("")}

      <p><a href="/spots">Browse all fishing spots</a> &middot;
      <a href="/regulations">Fishing regulations and licences</a></p>
    </article>`;
}

/**
 * /gear body.
 *
 * Mirrors src/pages/Gear.tsx: the same intro, the same disclosure, the same
 * category grouping and the same per-product line — title, description, price
 * band, click-target copy.
 *
 * No numeric price and no Amazon-hosted image reaches this markup, for the same
 * Operating Agreement reasons the React page obeys. The images are decorative
 * category artwork, so the prerendered version simply omits them rather than
 * describing pictures a crawler cannot use.
 */
function gearContent(products) {
  const byCategory = new Map();
  for (const p of products) {
    const key = String(p.category ?? "").toLowerCase().trim();
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key).push(p);
  }
  const groups = [...byCategory.entries()].sort((a, b) =>
    gearCategoryLabel(a[0]).localeCompare(gearCategoryLabel(b[0]))
  );

  return `
    <article>
      <h1>Fishing Gear</h1>
      <p>Gear we point anglers at, grouped by what it is. Every spot page
      surfaces the items that suit its water and species — this is the whole
      list. ${products.length} ${products.length === 1 ? "item" : "items"} across
      ${groups.length} ${groups.length === 1 ? "category" : "categories"}.</p>

      <p>These are affiliate links: as an Amazon Associate, AnglerDeck earns from
      qualifying purchases, at no extra cost to you. We show a price band rather
      than a figure, because we have no live price feed and a stale number would
      be worse than none — check the current price on the merchant's own page.</p>
      ${groups
        .map(
          ([category, items]) => `
      <h2>${esc(gearCategoryLabel(category))}</h2>
      <ul>
        ${items
          .map((p) => {
            const band = priceBand(p.price);
            return `<li><a href="${esc(p.affiliate_url)}" rel="noopener noreferrer sponsored">${esc(p.title)}</a>${
              band ? ` — ${esc(band)}` : ""
            }. ${esc(gearCtaLabel(p.merchant))}.${
              p.description ? ` ${esc(p.description)}` : ""
            }</li>`;
          })
          .join("")}
      </ul>`
        )
        .join("")}

      <p>Nothing here is a lab test or a ranked review — it is gear we are
      comfortable pointing at. Check the merchant's page for the current price,
      specification and availability before you buy.</p>

      <p><a href="/spots">Browse all fishing spots</a> &middot;
      <a href="/map">View the fishing map</a></p>
    </article>`;
}

/**
 * /regulations body.
 *
 * One section per country, built from COUNTRY_GUIDES — the same JSON the React
 * page reads. It covered four of nineteen countries until 12 Aug 2026, on the
 * reasoning that a link to something true beats an invented authority; the
 * remaining fifteen have since been researched against their official agencies,
 * so all nineteen are now here.
 *
 * Countries are listed in COUNTRIES order, filtered to those with a guide, and
 * each section links its own hub — this page is a significant internal link
 * source for the hubs.
 *
 * No bag or size numbers here or anywhere: they change constantly, go stale
 * silently, and a reader can be fined for following them (content rule 3).
 */
function regulationsContent(countriesWithSpots) {
  const guided = COUNTRIES.map((c) => ({ ...c, guide: countryGuide(c.code) })).filter(
    (c) => c.guide
  );

  return `
    <article>
      <h1>Fishing Regulations</h1>
      <p>What a visiting angler actually needs in each of the ${guided.length}
      countries AnglerDeck covers, with a link to the official authority in every
      case. Always fish responsibly and legally.</p>

      <h2>Important disclaimer</h2>
      <p>Fishing regulations change frequently. The information on this page is
      for general guidance only. Always verify current regulations with official
      local authorities before fishing. AnglerDeck is not responsible for any
      violations resulting from outdated information.</p>

      ${guided
        .map(
          (c) => `
      <h2>${esc(c.name)}</h2>
      <p>${esc(c.guide.regulations)}</p>
      <ul>
        ${guideSources(c.guide)
          .map(
            (l) =>
              `<li><a href="${esc(l.url)}" rel="noopener noreferrer">${esc(l.name)}</a></li>`
          )
          .join("")}
        <li><a href="/fishing/${esc(c.slug)}">Fishing in ${esc(c.name)}</a> — spots, seasons and access</li>
      </ul>`
        )
        .join("")}

      <h2>Licensing by country</h2>
      <p>AnglerDeck publishes spots in ${countriesWithSpots.length} countries.
      Each country page sets out how licences work there, when to fish, and links
      on to the spots themselves.</p>
      <ul>
        ${countriesWithSpots
          .map(
            (c) =>
              `<li><a href="/fishing/${esc(c.slug)}">Fishing in ${esc(c.name)}</a></li>`
          )
          .join("")}
      </ul>

      <h2>General best practices</h2>
      <ul>
        <li>Always carry a valid fishing license for the area you're fishing in</li>
        <li>Respect catch limits and size restrictions for each species</li>
        <li>Be aware of seasonal closures and protected areas</li>
        <li>Practice catch and release when appropriate</li>
        <li>Leave no trace - pack out all garbage and fishing line</li>
        <li>Report any illegal fishing activity to local authorities</li>
      </ul>

      <p><a href="/spots">Browse all fishing spots</a> &middot;
      <a href="/map">View the fishing map</a></p>
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

/**
 * Home page body.
 *
 * Built from the same Supabase rows as every other page rather than from the
 * marketing copy in Hero/Features, for two reasons: it cannot drift into
 * claiming a feature that does not ship, and counts stated as fact stay true
 * because they are counted at build time. FeaturedSpots reshuffles on every
 * load, so there is no stable "featured six" to mirror — this links every
 * published spot instead, which is also the more useful set to hand a crawler.
 *
 * `spots` is already the published set, so the count, the species list and the
 * links are all drawn from pages that exist.
 */
function homeContent(spots, countriesWithSpots) {
  const species = [...new Set(spots.flatMap((s) => s.species || []))].sort();

  return `
    <article>
      <h1>AnglerDeck — find your next fishing spot</h1>
      <p>Researched fishing spots with location, target species, access details,
      seasons and licence pointers. ${spots.length} spots across
      ${countriesWithSpots.length} countries.</p>

      <h2>Fishing by country</h2>
      <ul>
        ${countriesWithSpots
          .map(
            (c) =>
              `<li><a href="/fishing/${esc(c.slug)}">Fishing in ${esc(c.name)}</a> — ${c.spots.length} ${c.spots.length === 1 ? "spot" : "spots"}</li>`
          )
          .join("")}
      </ul>

      <h2>Fishing spots</h2>
      <ul>
        ${spots
          .map(
            (s) =>
              `<li><a href="/spot/${esc(s.slug)}">${esc(s.title)}</a> — ${esc(s.location)}, ${esc(COUNTRY_NAMES[s.country] || s.country)}. ${esc(s.type)}, ${esc(s.difficulty)}.</li>`
          )
          .join("")}
      </ul>
      <p><a href="/spots">Browse all fishing spots</a> &middot;
      <a href="/map">View the fishing map</a> &middot;
      <a href="/regulations">Fishing regulations by country</a></p>

      <h2>Species covered</h2>
      ${list(species)}

      <p>Licence requirements, closed seasons and health advisories change
      regularly. Always confirm with the relevant fisheries authority before you
      fish — each spot page links to its source.</p>
    </article>`;
}

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
    console.warn(`[prerender] could not load spots (${err})`);
  }

  // Continuing here would write a dist with no spot pages and an empty home
  // page, while exiting 0 — so the deploy would look like it worked and the
  // content would just be gone. Exit non-zero instead.
  //
  // This does not protect the live site: `vite build` has already replaced
  // dist/, and nginx serves that directory with no restart, so by the time this
  // fires the site is already down to a shell. The non-zero exit is what makes
  // that visible rather than silent — treat it as "the site is currently broken,
  // fix the cause and rebuild", not as "the build was cancelled".
  if (spots.length === 0) {
    console.error(
      "[prerender] no spots returned — refusing to write a dist with zero spot " +
        "pages. dist/ is now shell-only and nginx is already serving it. Check " +
        "VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY in .env.production " +
        "and that the spots table is reachable, then rebuild."
    );
    process.exit(1);
  }

  const reviewsBySpot = await fetchReviews();
  const gearProducts = await fetchGearProducts();
  // Review counts feed the publication quality gate.
  for (const spot of spots) {
    spot.reviewCount = (reviewsBySpot.get(spot.id) || []).length;
  }

  // The publication decision, made once. Everything below this line works from
  // `published` and never from `spots`: a spot below the threshold gets no file,
  // no listing, no sitemap entry and no internal link. Its row is untouched, and
  // it publishes itself on the next build once its data is good enough.
  const published = spots.filter(isPublished);
  const withheld = spots.length - published.length;

  // Same reasoning as the zero-spots exit above: writing a dist whose every spot
  // page is missing, while exiting 0, would look like a successful deploy. This
  // is a different cause though — the database answered fine and every row
  // failed the gate, which in practice means a review-count fetch returned zero
  // for everything (an unapplied migration) rather than a genuine content
  // collapse. Check that before touching the threshold.
  if (published.length === 0) {
    console.error(
      `[prerender] all ${spots.length} spots scored below the publication ` +
        `threshold (${PUBLISH_THRESHOLD}) — refusing to write a dist with zero ` +
        "spot pages. dist/ is now shell-only and nginx is already serving it. " +
        "Check the review-count warnings above, then rebuild."
    );
    process.exit(1);
  }

  // Countries that actually have published spots, in COUNTRIES order. Built once
  // because the /spots, /map and /regulations bodies, the country hubs and the
  // home page all need the same grouping. A country whose spots are all
  // unpublished gets no hub — an aggregate page over an empty set is the thin
  // content this gate exists to prevent.
  const countriesWithSpots = COUNTRIES.map((c) => ({
    ...c,
    spots: published.filter((s) => s.country === c.code),
  })).filter((c) => c.spots.length > 0);

  // Static routes with a data-driven body. The rest are hand-written pages with
  // no Supabase content behind them, so head tags are all they can honestly
  // get from here — their copy lives in the React components.
  const staticBodies = {
    "/spots": () => spotsContent(published, countriesWithSpots),
    "/map": () => mapContent(published, countriesWithSpots),
    "/regulations": () => regulationsContent(countriesWithSpots),
    // Head-only when the catalog is empty or unreachable, same as before /gear
    // had a body — an empty <ul> would be worse than no body at all.
    ...(gearProducts.length ? { "/gear": () => gearContent(gearProducts) } : {}),
  };

  for (const route of STATIC_ROUTES) {
    let html = withHead(template, {
      title: route.title,
      description: route.description,
      canonical: `${SITE_URL}${route.path}`,
    });
    const body = staticBodies[route.path];
    if (body) html = withBody(html, body());
    write(route.path, html);
  }

  for (const spot of published) {
    const country = COUNTRY_NAMES[spot.country] || spot.country;
    // No "| AnglerDeck" suffix here. It cost ~13 characters on every spot
    // title, which pushed most of them past the ~60 characters Google renders,
    // and Google appends the site name itself anyway. Country hub titles keep
    // theirs — they are short enough to fit.
    const title = `${spot.title} — Fishing in ${spot.location}, ${country}`;
    const description = metaDescription(spot.description);
    const reviews = reviewsBySpot.get(spot.id) || [];

    let html = withHead(template, {
      title,
      description,
      canonical: `${SITE_URL}/spot/${spot.slug}`,
      jsonLd: spotJsonLd(spot, reviews),
    });
    // `published`, not `spots`, so the "nearby spots" links only ever point at
    // pages this build actually wrote.
    html = withBody(html, spotContent(spot, published, reviews));
    write(`/spot/${spot.slug}`, html);
  }

  // Country hubs — the parent tier in the link hierarchy. Always indexable:
  // they aggregate real spot data, so they are not thin even when a country has
  // few spots, and they are what can rank for head terms.
  let hubs = 0;
  for (const country of countriesWithSpots) {
    const countrySpots = country.spots;

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

  // Home last: it overwrites dist/index.html, which is the template every other
  // route above was built from. Writing it earlier would feed the home page's
  // own head tags and body into every subsequent route.
  let homeHtml = withHead(template, {
    title: "AnglerDeck - Find Your Perfect Fishing Spots",
    description:
      "Discover, save, and share the best fishing spots worldwide. Connect with fellow anglers and access expert tips.",
    canonical: `${SITE_URL}/`,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "AnglerDeck",
      description:
        "Researched fishing spots worldwide, with access details, target species, seasons and licence requirements.",
      url: `${SITE_URL}/`,
    },
  });
  homeHtml = withBody(homeHtml, homeContent(published, countriesWithSpots));
  write("/", homeHtml);

  console.log(
    `[prerender] wrote home, ${STATIC_ROUTES.length} static routes, ${hubs} country hubs and ${published.length} spot pages`
  );
  console.log(
    `[prerender] ${published.length} of ${spots.length} spots published; ` +
      `${withheld} withheld (quality score < ${PUBLISH_THRESHOLD}) — no page, no ` +
      "sitemap entry, no internal link. Rows are untouched; they publish " +
      "themselves once their data improves."
  );
}

main().catch((err) => {
  console.error("[prerender] failed:", err);
  process.exit(1);
});
