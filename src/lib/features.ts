// Flags for functionality that exists in source but is not operational in
// production. A flag here means "built, not shipping" — the code stays so it
// can be switched back on, but nothing advertises it in the meantime.

/**
 * The AI Fishing Assistant chat widget and the community "Magic Write" button.
 *
 * STATE AS OF 9 Aug 2026 — live and verified end to end.
 *
 * Both features call OpenAI (`gpt-4o-mini`) through Edge Functions that enforce
 * the same four gates: JWT, an active pro/elite subscription, a rate limit, and
 * body validation. `ai-generate-story` no longer touches Lovable — one vendor,
 * one key, and `LOVABLE_API_KEY` is gone from the codebase entirely. It also
 * previously shipped with no auth, tier or rate-limit gate and
 * `Access-Control-Allow-Origin: *`, while `supabase/config.toml` still sets
 * `verify_jwt = false`; deploying that with a live key would have been an
 * unauthenticated proxy to a paid OpenAI account for anyone who knew the URL.
 * The gates are what make `verify_jwt = false` survivable, so do not remove
 * them without changing config.toml in the same commit.
 *
 * What was verified on 9 Aug 2026, against a non-admin account with
 * tier `pro` / status `active` — admins pass the same tier gate the original
 * bug lived behind, so an admin test proves nothing about a paying account:
 *   - `OPENAI_API_KEY` present in Edge Function secrets.
 *   - `ai-generate-story` deployed (it had never been deployed — HTTP 404).
 *   - Pro account: `ai-chat` returns a real streamed SSE response; Magic Write
 *     returns real generated text for both `catch` and `tip`.
 *   - Free account: both functions return 403 `tier_required`.
 *   - Missing or non-user bearer token: both return 401.
 *
 * KNOWN GAP — the rate limit does not actually limit anything. `checkRateLimit`
 * keeps its counter in a module-level `Map`, which is per-isolate, and Supabase
 * hands out fresh isolates rather than reusing one. Measured 9 Aug 2026: 28
 * requests to `ai-chat` against a 10-per-60s limit produced zero 429s, and 12
 * to `ai-generate-story` likewise. Use invalid bodies to re-test — they clear
 * the rate-limit gate and fail body validation, so the counter is exercised
 * without spending on OpenAI. A working limiter needs shared state (a Postgres
 * table keyed by user and window), which means a migration. Until then the only
 * real cap on a subscriber's spend is the OpenAI account budget. Deliberate
 * call: shipping beat leaving paying Pro subscribers with a dead feature.
 *
 * This is a headline *Pro* benefit at $9.99/month on live Stripe, so it falls
 * under CLAUDE.md rule 5 ("don't claim features that don't ship"). The copy in
 * `SUBSCRIPTION_TIERS.pro.features` (lib/stripe.ts), Features.tsx, Hero.tsx,
 * Pricing.tsx, Premium.tsx, UpgradePrompt.tsx and the `/pricing` entry in
 * scripts/static-routes.mjs is restored and landed in the SAME commit as this
 * flag. If this ever goes back to false, that copy has to come out again in the
 * same commit, or the rule 5 violation returns.
 *
 * Terms.tsx and Privacy.tsx disclose the OpenAI data flow for both features.
 * They were widened from "the AI Assistant" to also name Magic Write, because
 * Magic Write sends user-supplied post details (species, weight, location,
 * topic) to OpenAI too and the old wording did not cover that transfer.
 */
export const AI_ASSISTANT_ENABLED = true;
