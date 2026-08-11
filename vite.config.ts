import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';
import sitemap from 'vite-plugin-sitemap';
import { COUNTRIES } from './src/lib/countries';
import { isPublished } from './scripts/spot-quality.mjs';
// @ts-expect-error — plain ESM module shared with scripts/prerender.mjs
import { STATIC_ROUTE_PATHS } from './scripts/static-routes.mjs';

const siteUrl = process.env.VITE_SITE_URL || 'https://anglerdeck.com';

/**
 * lovable-tagger is a development-only plugin, but importing it at the top level
 * meant a broken or mismatched dependency inside it could fail the *production*
 * build — it once could not resolve `tailwindcss/resolveConfig.js` and took the
 * whole deploy down. Loading it lazily, only in dev, and tolerating failure
 * keeps a dev tool from ever blocking a release.
 */
async function devTaggerPlugin(mode: string) {
  if (mode !== 'development') return null;
  try {
    const { componentTagger } = await import('lovable-tagger');
    return componentTagger();
  } catch (err) {
    console.warn(`[vite] lovable-tagger unavailable, continuing without it (${err})`);
    return null;
  }
}

/**
 * Spot slugs come from the Supabase `spots` table so the sitemap stays in sync
 * when spots are added via SQL. Only spots that pass the publication quality gate
 * are listed, because only those get a page written for them at all — a slug in
 * the sitemap that prerender.mjs skipped is a URL that resolves to the SPA
 * fallback, which is a soft 404 reported straight back to Search Console.
 *
 * Country hubs come from the countries that have *published* spots, for the same
 * reason: prerender.mjs only writes those hubs.
 *
 * When Supabase is unreachable the fallback lists **no** spot slugs. It used to
 * fall back to the checked-in list in src/data/spotSlugs.ts, but that list cannot
 * be scored — publishing every slug in it would advertise the ~140 URLs the gate
 * withholds. Missing sitemap entries only slow discovery of pages that internal
 * links still reach; wrong ones are soft 404s. And this is not the quiet failure
 * it looks like: prerender.mjs reads the same database moments later and exits
 * non-zero if it gets nothing, so a build that loses Supabase here does not ship
 * silently anyway.
 */
async function fetchSpotSlugs(
  env: Record<string, string>
): Promise<{ slugs: string[]; countryCodes: string[] }> {
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    console.warn(
      '[sitemap] Supabase env vars missing — no spot URLs in the sitemap. The ' +
        'publication gate cannot be scored without the database.'
    );
    return { slugs: [], countryCodes: COUNTRIES.map((c) => c.code) };
  }

  try {
    const res = await fetch(`${url}/rest/v1/spots?select=*&order=id`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('no rows returned');

    // Review counts feed the quality gate, so the sitemap and the pages
    // prerender.mjs writes reach the same verdict.
    try {
      // Approved only — an unapproved review must not push a spot past
      // PUBLISH_THRESHOLD and into the sitemap.
      const rres = await fetch(`${url}/rest/v1/spot_reviews?select=spot_id&status=eq.approved`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      if (!rres.ok) throw new Error(`HTTP ${rres.status}`);
      const counts = new Map<number, number>();
      for (const r of (await rres.json()) as { spot_id: number }[]) {
        counts.set(r.spot_id, (counts.get(r.spot_id) ?? 0) + 1);
      }
      for (const row of rows) row.reviewCount = counts.get(row.id) ?? 0;
    } catch (err) {
      // Falling back to zero is safe for moderation (nothing unapproved can
      // sneak in) but it silently shrinks the sitemap, so say so. A 400 here
      // means the review moderation migration has not been applied yet.
      console.warn(`[sitemap] review counts unavailable (${err}) — treating as zero`);
    }

    const published = rows.filter(isPublished);
    console.log(
      `[sitemap] ${published.length} of ${rows.length} spots pass the publication gate`
    );
    // Only list hubs for countries that have a published spot — otherwise the
    // sitemap advertises a page the prerenderer never wrote.
    const countryCodes = [
      ...new Set(published.map((r: { country: string }) => r.country)),
    ];
    return { slugs: published.map((r: { slug: string }) => r.slug), countryCodes };
  } catch (err) {
    console.warn(
      `[sitemap] Supabase fetch failed (${err}) — no spot URLs in the sitemap. ` +
        'The publication gate cannot be scored without the database.'
    );
    return { slugs: [], countryCodes: COUNTRIES.map((c) => c.code) };
  }
}

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Only production emits a sitemap, so dev needs neither list and must not pay
  // for the two Supabase round trips on every server start.
  const { slugs, countryCodes } =
    mode === 'production'
      ? await fetchSpotSlugs(env)
      : { slugs: [] as string[], countryCodes: [] as string[] };
  const tagger = await devTaggerPlugin(mode);

  return {
    server: {
      host: "127.0.0.1",
      port: 8080,
      strictPort: true,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      tagger,
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'AnglerDeck',
          short_name: 'AnglerDeck',
          description: 'Your Ultimate Fishing Companion',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      }),
      mode === 'production' &&
        sitemap({
          hostname: siteUrl,
          dynamicRoutes: [
            // The plugin only emits '/' plus whatever is listed here — it has no
            // file-based routing to discover. Without this line the ten static
            // routes were prerendered as real HTML but never advertised,
            // including /spots, the parent every hub and spot page links to.
            ...STATIC_ROUTE_PATHS,
            // Country hubs are always indexed — they aggregate real spot data
            // and are the pages that can rank for head terms.
            ...COUNTRIES.filter((c) => countryCodes.includes(c.code)).map(
              (c) => `/fishing/${c.slug}`
            ),
            ...slugs.map((slug) => `/spot/${slug}`),
          ],
          exclude: ['/auth', '/account', '/catches'],
          changefreq: 'weekly',
          priority: 0.8,
          // public/robots.txt is the single source of truth. The plugin's
          // generator defaults to `[{ userAgent: '*', allow: '/' }]` and wrote
          // over the copied file, silently dropping the Disallow lines for
          // /account, /auth and /catches — so production was inviting crawlers
          // into the gated routes. Keep this false; edit public/robots.txt.
          generateRobotsTxt: false,
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      include: ["react-leaflet", "leaflet"],
    },
  };
});
