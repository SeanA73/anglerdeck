import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

// ============================================================================
// CORS — Restrict which domains can call this from a browser.
// ============================================================================
const ALLOWED_ORIGINS = [
  "http://127.0.0.1:8080",
  "http://localhost:8080",
  "https://anglerdeck.com",
  "https://www.anglerdeck.com",
];

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

// ============================================================================
// Price ID lookup table — maps (tier, interval) → Stripe price ID
// All four price IDs come from Supabase Edge Function Secrets.
// ============================================================================
function getPriceId(tier: string, interval: string): string | null {
  const key = `STRIPE_PRICE_${tier.toUpperCase()}_${interval.toUpperCase()}`;
  return Deno.env.get(key) || null;
}

// ============================================================================
// Main handler
// ============================================================================
serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = buildCorsHeaders(origin);

  // ----- CORS preflight -----
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // ========================================================================
    // GATE 1 — Verify JWT (user must be logged in to subscribe)
    // ========================================================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const jwt = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !anonKey) {
      console.error("Supabase env vars not configured");
      return new Response(
        JSON.stringify({ error: "Server misconfigured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(jwt);
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const user = userData.user;

    // ========================================================================
    // GATE 2 — Validate request body
    // ========================================================================
    let body: { tier?: string; interval?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { tier, interval } = body;

    if (!tier || !["pro", "elite"].includes(tier)) {
      return new Response(
        JSON.stringify({ error: "Invalid tier. Must be 'pro' or 'elite'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!interval || !["monthly", "yearly"].includes(interval)) {
      return new Response(
        JSON.stringify({ error: "Invalid interval. Must be 'monthly' or 'yearly'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // Look up the Stripe price ID for this tier+interval combo
    // ========================================================================
    const priceId = getPriceId(tier, interval);
    if (!priceId) {
      console.error(`Missing price ID for tier=${tier} interval=${interval}`);
      return new Response(
        JSON.stringify({ error: "Price configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // GATE 3 — Check if user already has an active subscription
    // ========================================================================
    // Block ALL active subscriptions, not just same-tier. A Pro user who wants
    // Elite (or vice versa) must go through the Stripe Billing Portal, which
    // handles the subscription update correctly — cancelling the old plan and
    // starting the new one without overlap. Creating a second checkout session
    // would produce two parallel subscriptions charging the same customer.
    const { data: existingSub } = await supabaseClient
      .from("subscriptions")
      .select("tier, status, stripe_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingSub?.status === "active" && existingSub.tier !== "free") {
      return new Response(
        JSON.stringify({
          error: `You already have an active ${existingSub.tier} subscription. Use Manage Subscription in your account to change your plan.`,
          code: "already_subscribed",
          use_portal: true,
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // Initialize Stripe client
    // ========================================================================
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // ========================================================================
    // Determine success/cancel URLs (use the request origin so dev and prod
    // both work without configuration)
    // ========================================================================
    const baseUrl =
      origin && ALLOWED_ORIGINS.includes(origin)
        ? origin
        : "https://anglerdeck.com";

    // ========================================================================
    // Create the Checkout session
    // ========================================================================
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        tier,
        interval,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          tier,
          interval,
        },
      },
      success_url: `${baseUrl}/account?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?upgrade=canceled`,
      // Allow promotion codes to be entered at checkout
      allow_promotion_codes: true,
    });

    console.log(`Checkout session created: ${session.id} for user ${user.id} (${tier}/${interval})`);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Checkout session error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});