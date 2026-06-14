import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import sitemap from 'vite-plugin-sitemap';
import { spotSlugs } from './src/data/spotSlugs';

const siteUrl = process.env.VITE_SITE_URL || 'https://castlog.app';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
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
        name: 'CastLog',
        short_name: 'CastLog',
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
        dynamicRoutes: spotSlugs.map((slug) => `/spot/${slug}`),
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
}));
