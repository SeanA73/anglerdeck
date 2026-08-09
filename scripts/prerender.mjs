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
 * The four regions the regulations page actually has data for, read from the
 * same JSON src/pages/Regulations.tsx imports so the prerendered body and the
 * hydrated page cannot drift.
 *
 * Four of nineteen countries — the page has never covered the rest. The
 * prerendered body links the other fifteen through their country hubs rather
 * than inventing an authority or a licence rule for them (content rules 1
 * and 3). A shorter honest page beats a padded one.
 */
const REGULATION_REGIONS = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/regulation-regions.json"), "utf8")
);

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
        ${spots.map((s) => spotListItem(s)).join("")}
      </ul>

      <p>Licence requirements and closed seasons change regularly. Always confirm
      with the relevant fisheries authority before you fish — each spot page links
      to its source.</p>
      <p><a href="/map">View the fishing map</a></p>
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
 * Every spot is listed, not only the indexable ones. Noindexed spot pages are
 * `noindex,follow` so they still pass link equity, and the country hubs already
 * list all of them — this follows that, it is not a new decision.
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
      <p>The map plots every researched spot as a marker, coloured by water type
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
 * /regulations body.
 *
 * The page carries real data for four countries only, so this renders those
 * four with their official links and nothing more. The remaining fifteen are
 * reached through their country hubs, which each carry a researched licensing
 * blurb — a link to something true beats an invented authority for a country
 * the page has never covered.
 *
 * No bag or size numbers here or anywhere: they change constantly, go stale
 * silently, and a reader can be fined for following them (content rule 3).
 */
function regulationsContent(countriesWithSpots) {
  return `
    <article>
      <h1>Fishing Regulations</h1>
      <p>Stay informed about fishing regulations in your area. Always fish
      responsibly and legally.</p>

      <h2>Important disclaimer</h2>
      <p>Fishing regulations change frequently. The information on this page is
      for general guidance only. Always verify current regulations with official
      local authorities before fishing. AnglerDeck is not responsible for any
      violations resulting from outdated information.</p>

      ${REGULATION_REGIONS.map(
        (region) => `
      <h2>${esc(region.name)}</h2>
      <p>${esc(region.description)}</p>
      <ul>
        ${(region.links || [])
          .map(
            (l) =>
              `<li><a href="${esc(l.url)}" rel="noopener noreferrer">${esc(l.name)}</a></li>`
          )
          .join("")}
      </ul>`
      ).join("")}

      <h2>Licensing by country</h2>
      <p>AnglerDeck covers ${countriesWithSpots.length} countries. Each country
      page sets out how licences work there and links on to the spots
      themselves.</p>
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
 * load, so there is no stable "featured six" to mirror — this links the
 * indexable spots instead, which is also the more useful set to hand a crawler.
 */
function homeContent(spots, countriesWithSpots) {
  const indexable = spots.filter(isIndexable);
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
        ${indexable
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
  // Review counts feed the indexing quality gate.
  for (const spot of spots) {
    spot.reviewCount = (reviewsBySpot.get(spot.id) || []).length;
  }

  // Countries that actually have spots, in COUNTRIES order. Built once because
  // the /spots, /map and /regulations bodies, the country hubs and the home
  // page all need the same grouping.
  const countriesWithSpots = COUNTRIES.map((c) => ({
    ...c,
    spots: spots.filter((s) => s.country === c.code),
  })).filter((c) => c.spots.length > 0);

  // Static routes with a data-driven body. The rest are hand-written pages with
  // no Supabase content behind them, so head tags are all they can honestly
  // get from here — their copy lives in the React components.
  const staticBodies = {
    "/spots": () => spotsContent(spots, countriesWithSpots),
    "/map": () => mapContent(spots, countriesWithSpots),
    "/regulations": () => regulationsContent(countriesWithSpots),
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

  let indexed = 0;
  for (const spot of spots) {
    const country = COUNTRY_NAMES[spot.country] || spot.country;
    // No "| AnglerDeck" suffix here. It cost ~13 characters on every spot
    // title, which pushed most of them past the ~60 characters Google renders,
    // and Google appends the site name itself anyway. Country hub titles keep
    // theirs — they are short enough to fit.
    const title = `${spot.title} — Fishing in ${spot.location}, ${country}`;
    const description = metaDescription(spot.description);
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
  homeHtml = withBody(homeHtml, homeContent(spots, countriesWithSpots));
  write("/", homeHtml);

  console.log(
    `[prerender] wrote home, ${STATIC_ROUTES.length} static routes, ${hubs} country hubs and ${spots.length} spot pages`
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
