import { z } from "zod";

/**
 * Environment variable schema for AnglerDeck.
 *
 * All Vite-exposed env vars (prefixed with VITE_) are validated at app startup.
 * If any required var is missing or malformed, the app throws a descriptive
 * error at import time — no silent undefined values reaching runtime code.
 *
 * Add new env vars here as they're introduced. See .env.local (gitignored)
 * for actual values; see .env.example (if it exists) for documentation.
 */
const EnvSchema = z.object({
  // Supabase — required for auth, DB, edge function calls
  VITE_SUPABASE_URL: z
    .string()
    .url("VITE_SUPABASE_URL must be a valid URL (e.g. https://xxx.supabase.co)"),
  VITE_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "VITE_SUPABASE_PUBLISHABLE_KEY is required"),

  // Site URL — used for redirects, canonical URLs, SEO, etc.
  VITE_SITE_URL: z
    .string()
    .url("VITE_SITE_URL must be a valid URL (e.g. https://anglerdeck.com)"),

  // Stripe — publishable key and 4 price IDs
  // Publishable key is safe to expose (browser-side); secret key lives only in
  // Supabase Edge Function Secrets.
  VITE_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .startsWith("pk_", "VITE_STRIPE_PUBLISHABLE_KEY must start with pk_"),
  VITE_STRIPE_PRICE_PRO_MONTHLY: z
    .string()
    .startsWith("price_", "VITE_STRIPE_PRICE_PRO_MONTHLY must start with price_"),
  VITE_STRIPE_PRICE_PRO_YEARLY: z
    .string()
    .startsWith("price_", "VITE_STRIPE_PRICE_PRO_YEARLY must start with price_"),
  VITE_STRIPE_PRICE_ELITE_MONTHLY: z
    .string()
    .startsWith("price_", "VITE_STRIPE_PRICE_ELITE_MONTHLY must start with price_"),
  VITE_STRIPE_PRICE_ELITE_YEARLY: z
    .string()
    .startsWith("price_", "VITE_STRIPE_PRICE_ELITE_YEARLY must start with price_"),

  // ------------------------------------------------------------------
  // Optional — set these as they become relevant (see ROADMAP Phase 9)
  // ------------------------------------------------------------------

  // Google Analytics 4 measurement ID
  VITE_GA_ID: z.string().startsWith("G-").optional(),

  // Affiliate tracking IDs (Phase 9 — Path B multi-revenue layer)
  VITE_AMAZON_AFFILIATE_TAG: z.string().optional(),
  VITE_CLICKBANK_HOP_ID: z.string().optional(),
  VITE_BOOKING_AFFILIATE_ID: z.string().optional(),
  VITE_AIRBNB_AFFILIATE_ID: z.string().optional(),

  // Google AdSense (Phase 9 — approval required first)
  VITE_ADSENSE_CLIENT_ID: z.string().startsWith("ca-pub-").optional(),
  VITE_ADSENSE_SLOT_SPOTS: z.string().optional(),
  VITE_ADSENSE_SLOT_SPOT_DETAIL: z.string().optional(),
  VITE_ADSENSE_SLOT_COMMUNITY: z.string().optional(),
});

/**
 * Parse and validate the environment. Called once at app startup.
 * Throws with a formatted error message if validation fails.
 */
function parseEnv() {
  const result = EnvSchema.safeParse(import.meta.env);

  if (!result.success) {
    // Build a human-readable error message listing every problem at once.
    const issues = result.error.errors
      .map((err) => `  • ${err.path.join(".")}: ${err.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration. Fix the following in your .env.local file:\n${issues}\n\nAfter editing .env.local, restart the Vite dev server.`
    );
  }

  return result.data;
}

export const env = parseEnv();
export type Env = typeof env;
