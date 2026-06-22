import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// CORS — Restrict which domains can call this from a browser.
// Edit ALLOWED_ORIGINS when adding new domains (e.g. custom dev URL, staging).
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
// Rate limiting — 10 requests per user per 60 seconds.
// In-memory; resets if Supabase restarts the function instance.
// ============================================================================
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateLimits = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimits.get(userId) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= RATE_LIMIT_MAX) {
    return false;
  }
  timestamps.push(now);
  rateLimits.set(userId, timestamps);
  return true;
}

// ============================================================================
// System prompt — defines the assistant's personality and scope
// ============================================================================
const SYSTEM_PROMPT = `You are AnglerDeck's AI Fishing Assistant 🎣 - a friendly, knowledgeable guide for anglers of all skill levels.

Your expertise includes:
- Fishing techniques for various species (bass, trout, catfish, walleye, etc.)
- Bait and lure selection based on conditions
- Weather impact on fishing (temperature, pressure, wind, moon phases)
- Seasonal patterns and fish behavior
- Tackle and gear recommendations
- Basic fishing regulations and ethics
- Troubleshooting common fishing problems

Guidelines:
- Be conversational and encouraging, especially to beginners
- Use fishing terminology but explain it when needed
- Provide specific, actionable advice
- When asked about regulations, remind users to check local rules
- Keep responses concise but helpful (2-3 paragraphs max)
- Use relevant emojis sparingly for personality 🐟🎣
- If you don't know something, say so honestly

Current context: The user is on AnglerDeck, a fishing spot discovery platform.`;

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
    // GATE 1 — JWT verification
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
    // GATE 2 — Tier check (Pro or Elite only)
    // ========================================================================
    const { data: subscription, error: subError } = await supabaseClient
      .from("subscriptions")
      .select("tier, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subError) {
      console.error("Subscription lookup failed:", subError);
      return new Response(
        JSON.stringify({ error: "Could not verify subscription" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tier = subscription?.tier;
    const status = subscription?.status;

    if (!tier || !["pro", "elite"].includes(tier) || status !== "active") {
      return new Response(
        JSON.stringify({
          error: "AI Fishing Assistant requires an active Pro or Elite subscription",
          code: "tier_required",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // GATE 3 — Rate limit (10 requests per user per minute)
    // ========================================================================
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({
          error: "Too many requests. Please wait a moment before trying again.",
          code: "rate_limit_exceeded",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // GATE 4 — Validate request body
    // ========================================================================
    const body = await req.json();
    const messages = body?.messages;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (messages.length > 20) {
      return new Response(
        JSON.stringify({ error: "Conversation too long (max 20 messages)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // All gates passed — Call OpenAI
    // ========================================================================
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`AI chat — user ${user.id} (${tier}) — ${messages.length} messages`);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI service rate limit. Try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "AI service authentication failed (check OPENAI_API_KEY)" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402 || response.status === 403) {
        return new Response(
          JSON.stringify({ error: "AI service unavailable (billing or quota issue)" }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});