import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

// ============================================================================
// CORS — Webhook is server-to-server (Stripe → us), not browser-initiated.
// We don't need browser CORS, but we keep a permissive header for the
// OPTIONS preflight that Stripe doesn't actually send (defensive).
// ============================================================================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "stripe-signature, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================================================
// Service role Supabase client — bypasses RLS so the webhook can UPDATE
// the subscriptions table even though our Phase 1 corrective migration
// removed user-side write policies. This is correct: webhooks aren't acting
// on behalf of a logged-in user, they're acting on behalf of "the system."
// ============================================================================
function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    throw new Error("Supabase env vars not configured");
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ============================================================================
// Stripe client — uses our secret key to call the Stripe API for things
// like fetching subscription details when a webhook only gives us an ID.
// ============================================================================
function getStripeClient() {
  const secretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }
  return new Stripe(secretKey, {
    apiVersion: "2024-12-18.acacia",
    httpClient: Stripe.createFetchHttpClient(),
  });
}

// ============================================================================
// Map Stripe price ID → tier name.
// We can't use Deno.env reverse-lookup at module level cleanly, so we
// build the map once on first call.
// ============================================================================
function buildPriceMap(): Map<string, "pro" | "elite"> {
  const map = new Map<string, "pro" | "elite">();
  const proMonthly = Deno.env.get("STRIPE_PRICE_PRO_MONTHLY");
  const proYearly = Deno.env.get("STRIPE_PRICE_PRO_YEARLY");
  const eliteMonthly = Deno.env.get("STRIPE_PRICE_ELITE_MONTHLY");
  const eliteYearly = Deno.env.get("STRIPE_PRICE_ELITE_YEARLY");
  if (proMonthly) map.set(proMonthly, "pro");
  if (proYearly) map.set(proYearly, "pro");
  if (eliteMonthly) map.set(eliteMonthly, "elite");
  if (eliteYearly) map.set(eliteYearly, "elite");
  return map;
}

// ============================================================================
// Event handlers — one function per event type we care about.
// Each handler is idempotent: receiving the same event twice produces
// the same result. Stripe DOES retry webhooks, so this matters.
// ============================================================================

/**
 * Fires when a Checkout Session completes successfully (first payment).
 * This is where we mark the user as Pro/Elite for the first time.
 */
async function handleCheckoutSessionCompleted(
  event: Stripe.Event,
  stripe: Stripe,
  supabase: ReturnType<typeof getServiceClient>
): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;

  // The user_id was stuffed into metadata by create-checkout-session.
  // If it's missing, this isn't a session we created — ignore safely.
  const userId = session.metadata?.user_id || session.client_reference_id;
  const tierFromMetadata = session.metadata?.tier;

  if (!userId) {
    console.warn(`checkout.session.completed: no user_id in metadata (session ${session.id})`);
    return;
  }

  // Mode must be 'subscription' — we don't handle one-time payments here.
  if (session.mode !== "subscription") {
    console.log(`Skipping non-subscription session ${session.id}`);
    return;
  }

  // Fetch the subscription Stripe just created to get its full details
  if (!session.subscription) {
    console.warn(`Session ${session.id} has no subscription`);
    return;
  }

  const subscriptionId = typeof session.subscription === "string"
    ? session.subscription
    : session.subscription.id;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Determine tier from the price (more reliable than metadata)
  const priceMap = buildPriceMap();
  const priceId = subscription.items.data[0]?.price?.id;
  const tierFromPrice = priceId ? priceMap.get(priceId) : null;
  const tier = tierFromPrice || (tierFromMetadata === "elite" ? "elite" : "pro");

  // current_period_end is in seconds, JS Date wants milliseconds
  const periodEndIso = new Date(subscription.current_period_end * 1000).toISOString();

  const customerId = typeof session.customer === "string"
    ? session.customer
    : session.customer?.id;

  // Update the subscriptions table. Using update + insert pattern via upsert
  // would be cleaner but requires a unique constraint on user_id which we
  // already have. Use upsert with onConflict to handle both cases:
  //   - existing row (free tier from signup trigger) → update to paid tier
  //   - missing row (shouldn't happen but defensive) → create one
  const { error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        tier,
        status: "active",
        stripe_customer_id: customerId || null,
        stripe_subscription_id: subscription.id,
        current_period_end: periodEndIso,
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error(`Failed to update subscription for user ${userId}:`, error);
    throw error;
  }

  console.log(`checkout.session.completed: user ${userId} upgraded to ${tier}`);
}

/**
 * Fires when a subscription is updated — renewal, plan change, cancellation
 * scheduled, etc. Use this to keep our DB in sync with Stripe.
 */
async function handleSubscriptionUpdated(
  event: Stripe.Event,
  _stripe: Stripe,
  supabase: ReturnType<typeof getServiceClient>
): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;

  // user_id is in subscription metadata (we set it in create-checkout-session)
  const userId = subscription.metadata?.user_id;
  if (!userId) {
    console.warn(`subscription.updated: no user_id metadata (sub ${subscription.id})`);
    return;
  }

  // Determine tier from the current price
  const priceMap = buildPriceMap();
  const priceId = subscription.items.data[0]?.price?.id;
  const tier = priceId ? priceMap.get(priceId) : null;

  if (!tier) {
    console.warn(`subscription.updated: unknown price ${priceId}, leaving tier alone`);
    return;
  }

  // Stripe status values we care about: active, past_due, canceled, unpaid, etc.
  // Map them to our simpler status field.
  let status: "active" | "canceled" | "past_due";
  if (subscription.status === "active" || subscription.status === "trialing") {
    status = "active";
  } else if (subscription.status === "past_due" || subscription.status === "unpaid") {
    status = "past_due";
  } else {
    status = "canceled";
  }

  const periodEndIso = new Date(subscription.current_period_end * 1000).toISOString();

  const { error } = await supabase
    .from("subscriptions")
    .update({
      tier,
      status,
      stripe_subscription_id: subscription.id,
      current_period_end: periodEndIso,
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    })
    .eq("user_id", userId);

  if (error) {
    console.error(`Failed to update subscription for user ${userId}:`, error);
    throw error;
  }

  console.log(`customer.subscription.updated: user ${userId} → tier=${tier} status=${status}`);
}

/**
 * Fires when a subscription is fully canceled and the access window ends.
 * Reset the user to the free tier.
 */
async function handleSubscriptionDeleted(
  event: Stripe.Event,
  _stripe: Stripe,
  supabase: ReturnType<typeof getServiceClient>
): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;

  const userId = subscription.metadata?.user_id;
  if (!userId) {
    console.warn(`subscription.deleted: no user_id metadata (sub ${subscription.id})`);
    return;
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({
      tier: "free",
      status: "canceled",
      cancel_at_period_end: false,
      // Keep stripe_customer_id and stripe_subscription_id for audit history;
      // they're useful if the user resubscribes later.
    })
    .eq("user_id", userId);

  if (error) {
    console.error(`Failed to downgrade user ${userId} to free:`, error);
    throw error;
  }

  console.log(`customer.subscription.deleted: user ${userId} → free`);
}

// ============================================================================
// Main handler
// ============================================================================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  // ========================================================================
  // CRITICAL: Verify the Stripe signature.
  //
  // Without this check, anyone can POST forged events to this URL and trick
  // us into upgrading their tier. Stripe signs every webhook with HMAC-SHA256
  // using a secret only Stripe and we know. The Stripe SDK verifies it.
  //
  // We must read the raw body as text BEFORE parsing as JSON — the signature
  // is computed over the exact byte sequence Stripe sent, and even
  // whitespace changes break verification.
  // ========================================================================
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    console.warn("Webhook received without stripe-signature header");
    return new Response("Missing signature", { status: 400, headers: corsHeaders });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return new Response("Server misconfigured", { status: 500, headers: corsHeaders });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  let stripe: Stripe;

  try {
    stripe = getStripeClient();
    // constructEventAsync is the Deno-friendly version (the sync constructEvent
    // uses Node's crypto which isn't available in Deno).
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error("Signature verification failed:", err instanceof Error ? err.message : err);
    return new Response("Invalid signature", { status: 400, headers: corsHeaders });
  }

  console.log(`Webhook received: ${event.type} (${event.id})`);

  // ========================================================================
  // Dispatch to the right handler based on event type.
  // Stripe sends MANY event types; we only care about these three for now.
  // Unknown events return 200 so Stripe doesn't retry — being a good citizen.
  // ========================================================================
  try {
    const supabase = getServiceClient();

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event, stripe, supabase);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event, stripe, supabase);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event, stripe, supabase);
        break;

      default:
        // Acknowledge but don't process — Stripe won't retry.
        console.log(`Ignoring event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    // Return 500 so Stripe will retry. Stripe retries failed webhooks for up
    // to 3 days with exponential backoff. That's good — it means transient
    // failures don't lose subscription updates.
    console.error("Webhook handler error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});