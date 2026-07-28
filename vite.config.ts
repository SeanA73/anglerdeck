import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import sitemap from 'vite-plugin-sitemap';
import { spotSlugs as fallbackSlugs } from './src/data/spotSlugs';
// @ts-expect-error — plain ESM module shared with scripts/prerender.mjs
import { isIndexable } from './scripts/spot-quality.mjs';

const siteUrl = process.env.VITE_SITE_URL || 'https://anglerdeck.com';

/**
 * Spot slugs come from the Supabase `spots` table so the sitemap stays in sync
 * when spots are added via SQL. Only spots that pass the indexing quality gate
 * are listed — the rest are prerendered with `noindex,follow` and deliberately
 * kept out of the sitemap so the two signals agree.
 *
 * Falls back to the checked-in list if Supabase is unreachable at build time,
 * so a network blip never breaks a deploy.
 */
async function fetchSpotSlugs(env: Record<string, string>): Promise<string[]> {
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    console.warn('[sitemap] Supabase env vars missing — using fallback slug list');
    return [...fallbackSlugs];
  }

  try {
    const res = await fetch(`${url}/rest/v1/spots?select=*&order=id`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('no rows returned');

    const indexable = rows.filter(isIndexable);
    console.log(
      `[sitemap] ${indexable.length} of ${rows.length} spots pass the quality gate`
    );
    return indexable.map((r: { slug: string }) => r.slug);
  } catch (err) {
    console.warn(`[sitemap] Supabase fetch failed (${err}) — using fallback slug list`);
    return [...fallbackSlugs];
  }
}

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const slugs = mode === 'production' ? await fetchSpotSlugs(env) : [...fallbackSlugs];

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
      mode === "development" && componentTagger(),
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
          dynamicRoutes: slugs.map((slug) => `/spot/${slug}`),
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
