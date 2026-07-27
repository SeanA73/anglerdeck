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
/**
 * An optional var that may legitimately be present-but-blank.
 *
 * `.env` files can only express "unset" as an empty string, and .env.example
 * ships blank placeholders that get copied forward. Vite surfaces those as ""
 * rather than undefined, so a bare `z.string().startsWith(...).optional()`
 * would fail validation on a blank line — and because parseEnv() throws at
 * import time, that takes the whole app down rather than just disabling the
 * feature. Treat blank as absent.
 */
const optionalVar = (schema: z.ZodType<string>) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema.optional());

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
  VITE_GA_ID: optionalVar(z.string().startsWith("G-", "VITE_GA_ID must start with G-")),

  // Affiliate tracking IDs (Phase 9 — Path B multi-revenue layer)
  VITE_AMAZON_AFFILIATE_TAG: optionalVar(z.string()),
  // Amazon OneLink adInstanceId (Associates Central → Tools → OneLink).
  // Redirects non-US visitors to their local Amazon store so international
  // clicks can actually earn. Unset = US-only links.
  VITE_AMAZON_ONELINK_ID: optionalVar(z.string()),
  VITE_CLICKBANK_HOP_ID: optionalVar(z.string()),
  VITE_BOOKING_AFFILIATE_ID: optionalVar(z.string()),
  VITE_AIRBNB_AFFILIATE_ID: optionalVar(z.string()),

  // Google AdSense (Phase 9 — approval required first)
  VITE_ADSENSE_CLIENT_ID: optionalVar(
    z.string().startsWith("ca-pub-", "VITE_ADSENSE_CLIENT_ID must start with ca-pub-")
  ),
  VITE_ADSENSE_SLOT_SPOTS: optionalVar(z.string()),
  VITE_ADSENSE_SLOT_SPOT_DETAIL: optionalVar(z.string()),
  VITE_ADSENSE_SLOT_COMMUNITY: optionalVar(z.string()),
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
