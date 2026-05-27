import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  // Use service-role key so webhook can bypass RLS and write to any user's row
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeSecret || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
    console.error("Missing required environment variables");
    return new Response(JSON.stringify({ error: "Missing configuration" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify the Stripe webhook signature before processing anything
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.text();
  const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook verification failed";
    console.error("Stripe signature verification failed:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Service-role client bypasses RLS — only used server-side here
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      // -----------------------------------------------------------------------
      // User successfully completed checkout — activate their subscription
      // -----------------------------------------------------------------------
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode !== "subscription") break;

        const userId = session.metadata?.user_id;
        const tier = session.metadata?.tier as "pro" | "elite" | undefined;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId || !tier) {
          console.error("checkout.session.completed: missing user_id or tier in metadata");
          break;
        }

        // Fetch the Stripe subscription to get period dates
        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);

        const { error } = await supabase
          .from("subscriptions")
          .upsert(
            {
              user_id: userId,
              tier,
              status: stripeSub.status === "trialing" ? "trialing" : "active",
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
              current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
              cancel_at_period_end: stripeSub.cancel_at_period_end,
              trial_ends_at: stripeSub.trial_end
                ? new Date(stripeSub.trial_end * 1000).toISOString()
                : null,
            },
            { onConflict: "user_id" }
          );

        if (error) throw error;
        console.log(`✅ Subscription activated — user: ${userId}, tier: ${tier}`);
        break;
      }

      // -----------------------------------------------------------------------
      // Subscription changed (renewal, plan change, cancellation scheduled)
      // -----------------------------------------------------------------------
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;

        // Map Stripe statuses → our statuses
        const statusMap: Record<string, string> = {
          active: "active",
          trialing: "trialing",
          past_due: "past_due",
          unpaid: "past_due",
          incomplete: "past_due",
          incomplete_expired: "canceled",
          canceled: "canceled",
          paused: "past_due",
        };
        const status = statusMap[sub.status] ?? "active";

        // Determine tier from price ID if we can
        const priceId = sub.items.data[0]?.price?.id;
        const proMonthly = Deno.env.get("STRIPE_PRICE_PRO_MONTHLY") ?? "";
        const proYearly = Deno.env.get("STRIPE_PRICE_PRO_YEARLY") ?? "";
        const eliteMonthly = Deno.env.get("STRIPE_PRICE_ELITE_MONTHLY") ?? "";
        const eliteYearly = Deno.env.get("STRIPE_PRICE_ELITE_YEARLY") ?? "";

        const updateData: Record<string, unknown> = {
          status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
          trial_ends_at: sub.trial_end
            ? new Date(sub.trial_end * 1000).toISOString()
            : null,
        };

        // Only overwrite tier when we can confirm it from a known price ID
        if (priceId) {
          if (priceId === proMonthly || priceId === proYearly) {
            updateData.tier = "pro";
          } else if (priceId === eliteMonthly || priceId === eliteYearly) {
            updateData.tier = "elite";
          }
        }

        const { error } = await supabase
          .from("subscriptions")
          .update(updateData)
          .eq("stripe_subscription_id", sub.id);

        if (error) throw error;
        console.log(`✅ Subscription updated — id: ${sub.id}, status: ${status}`);
        break;
      }

      // -----------------------------------------------------------------------
      // Subscription fully deleted — drop back to free tier
      // -----------------------------------------------------------------------
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        const { error } = await supabase
          .from("subscriptions")
          .update({
            tier: "free",
            status: "canceled",
            cancel_at_period_end: false,
            stripe_subscription_id: null,
          })
          .eq("stripe_subscription_id", sub.id);

        if (error) throw error;
        console.log(`✅ Subscription deleted — user reverted to free tier (sub: ${sub.id})`);
        break;
      }

      // -----------------------------------------------------------------------
      // Payment failed — mark as past_due so the UI can prompt the user
      // -----------------------------------------------------------------------
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : (invoice.subscription as Stripe.Subscription | null)?.id;

        if (subId) {
          await supabase
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", subId);
          console.log(`⚠️ Payment failed — subscription ${subId} marked past_due`);
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled Stripe event: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Handler error";
    console.error("Webhook handler threw:", message);
    // Return 500 so Stripe will retry the event
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
