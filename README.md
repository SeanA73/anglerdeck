# AnglerDeck

Fishing spot discovery, catch logging, and community for anglers. Free tier with paid Pro and Elite subscriptions unlocking AI-powered features, unlimited access, and advanced tools.

**Status:** In active development. See [ROADMAP.md](./ROADMAP.md) for the sequenced plan to launch.

---

## Tech Stack

- **Frontend:** Vite 5 + React 18 + TypeScript
- **UI:** shadcn/ui + Tailwind CSS + Radix UI
- **State/Data:** TanStack Query + React Context
- **Maps:** Leaflet with react-leaflet
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions)
- **Payments:** Stripe (Checkout, Subscriptions, Billing Portal, Webhooks)
- **AI:** OpenAI (gpt-4o-mini) via secured edge function
- **PWA:** vite-plugin-pwa with offline support

---

## Prerequisites

- Node.js 20+ and npm
- Supabase CLI (for edge function deploys): `npm install -g supabase`
- A Supabase project with the migrations in `supabase/migrations/` applied
- A Stripe account with test-mode API keys and 4 subscription price IDs created

---

## Setup

```bash
# 1. Clone and install
git clone https://github.com/SeanA73/anglerdeck.git
cd anglerdeck
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — see "Environment variables" below

# 3. Run dev server
npm run dev
# App available at http://127.0.0.1:8080
```

---

## Environment variables

All required. Missing or malformed values throw a clear error at app startup (see `src/lib/env.ts`).

| Variable | Purpose | Example |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key | `sb_publishable_...` |
| `VITE_SITE_URL` | Canonical site URL | `https://anglerdeck.com` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_...` (dev) / `pk_live_...` (prod) |
| `VITE_STRIPE_PRICE_PRO_MONTHLY` | Stripe price ID | `price_...` |
| `VITE_STRIPE_PRICE_PRO_YEARLY` | Stripe price ID | `price_...` |
| `VITE_STRIPE_PRICE_ELITE_MONTHLY` | Stripe price ID | `price_...` |
| `VITE_STRIPE_PRICE_ELITE_YEARLY` | Stripe price ID | `price_...` |

Server-side secrets (Supabase Edge Function Secrets — NOT in `.env.local`):

| Secret | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe server-side key for creating sessions and portals |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification |
| `STRIPE_PRICE_PRO_MONTHLY` | Same 4 price IDs (also needed server-side) |
| `STRIPE_PRICE_PRO_YEARLY` | |
| `STRIPE_PRICE_ELITE_MONTHLY` | |
| `STRIPE_PRICE_ELITE_YEARLY` | |
| `OPENAI_API_KEY` | OpenAI API key for the AI Fishing Assistant |

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Vite dev server on port 8080 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest (only placeholder tests currently; see Phase 5 in ROADMAP) |

---

## Edge Functions

Located in `supabase/functions/`, deployed via `npx supabase functions deploy <name>`.

| Function | Purpose | Notes |
|---|---|---|
| `ai-chat` | Streams AI Fishing Assistant responses | JWT + tier-gated (Pro/Elite only), rate-limited |
| `create-checkout-session` | Creates Stripe Checkout URL for upgrade | JWT-verified |
| `stripe-webhook` | Syncs Stripe subscription events → Supabase | Signature-verified, deploy with `--no-verify-jwt` |
| `create-portal-session` | Creates Stripe Billing Portal URL | JWT-verified |
| `ai-generate-story` | Legacy | Untouched |

**Deploying:**

```bash
npx supabase functions deploy stripe-webhook --no-verify-jwt
npx supabase functions deploy create-checkout-session
npx supabase functions deploy create-portal-session
npx supabase functions deploy ai-chat
```

The `--no-verify-jwt` flag on `stripe-webhook` is essential — Stripe doesn't send Supabase JWTs, and signature verification via `STRIPE_WEBHOOK_SECRET` provides much stronger authentication anyway.

---

## Project Structure

```
src/
├── components/       React components (shadcn ui/ + app-specific)
├── contexts/         React Context providers (AuthContext)
├── hooks/            Custom React hooks (useSubscription, useWeather, ...)
├── integrations/     Third-party client setup (Supabase)
├── lib/              Utilities (env validation, Stripe helpers, checkout/portal wrappers)
├── pages/            Route components (one per page)
└── main.tsx          App entry point
supabase/
├── functions/        Edge functions (Deno)
└── migrations/       SQL migrations (chronological)
```

---

## Development notes

- **Windows path:** Development happens on Windows in Cursor. PowerShell commands throughout the codebase and tooling.
- **Australian context:** Prices in AUD, GST-inclusive, Sydney-region Supabase.
- **Security-first RLS:** Every user-owned table has explicit RLS policies (see Phase 1 migrations). The subscriptions table is only writable by the Stripe webhook via the service role key.
- **No secret keys in the frontend:** Anything starting with `sk_`, `service_role_`, or otherwise privileged lives ONLY in Supabase Edge Function Secrets, never in `.env.local` or committed to git.

---

## Contributing

Not currently accepting external contributions — this is a solo dev project. If you find a bug or security issue, open a GitHub issue.

---

## Testing
## License

Copyright © 2026 MRS Design. All rights reserved.

Not open source. The code in this repository is not licensed for reuse, redistribution, or commercial use.
