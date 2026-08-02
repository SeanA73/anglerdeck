import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';
import sitemap from 'vite-plugin-sitemap';
import { spotSlugs as fallbackSlugs } from './src/data/spotSlugs';
import { COUNTRIES } from './src/lib/countries';
// @ts-expect-error — plain ESM module shared with scripts/prerender.mjs
import { isIndexable } from './scripts/spot-quality.mjs';

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
 * when spots are added via SQL. Only spots that pass the indexing quality gate
 * are listed — the rest are prerendered with `noindex,follow` and deliberately
 * kept out of the sitemap so the two signals agree.
 *
 * Falls back to the checked-in list if Supabase is unreachable at build time,
 * so a network blip never breaks a deploy.
 */
async function fetchSpotSlugs(
  env: Record<string, string>
): Promise<{ slugs: string[]; countryCodes: string[] }> {
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    console.warn('[sitemap] Supabase env vars missing — using fallback slug list');
    return { slugs: [...fallbackSlugs], countryCodes: COUNTRIES.map((c) => c.code) };
  }

  try {
    const res = await fetch(`${url}/rest/v1/spots?select=*&order=id`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('no rows returned');

    // Review counts feed the quality gate, so the sitemap and the prerendered
    // robots tags reach the same verdict.
    try {
      // Approved only — an unapproved review must not promote a spot past
      // INDEX_THRESHOLD and into the sitemap.
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

    const indexable = rows.filter(isIndexable);
    console.log(
      `[sitemap] ${indexable.length} of ${rows.length} spots pass the quality gate`
    );
    // Only list hubs for countries that actually have spots — otherwise the
    // sitemap advertises a page the prerenderer never wrote.
    const countryCodes = [...new Set(rows.map((r: { country: string }) => r.country))];
    return { slugs: indexable.map((r: { slug: string }) => r.slug), countryCodes };
  } catch (err) {
    console.warn(`[sitemap] Supabase fetch failed (${err}) — using fallback slug list`);
    return { slugs: [...fallbackSlugs], countryCodes: COUNTRIES.map((c) => c.code) };
  }
}

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const { slugs, countryCodes } =
    mode === 'production'
      ? await fetchSpotSlugs(env)
      : { slugs: [...fallbackSlugs], countryCodes: COUNTRIES.map((c) => c.code) };
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
