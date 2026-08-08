import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// CORS — Restrict which domains can call this from a browser.
// Kept in step with ai-chat; edit both when adding a domain.
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

const TONES = {
  casual: "Write in a casual, friendly tone like you're telling a buddy about your day.",
  proud: "Write with excitement and pride about the achievement, but stay humble.",
  humorous: "Make it fun and lighthearted with fishing humor or puns.",
  educational: "Include helpful tips or interesting facts about the species or technique used.",
};

const SYSTEM_PROMPT =
  "You are a creative writer helping anglers craft engaging social media posts for the AnglerDeck fishing community. Keep posts authentic, relatable, and under 280 characters when possible.";

// ============================================================================
// Main handler
//
// This function spends money on every call, so it enforces the same four gates
// as ai-chat rather than trusting the UI. MagicWriteButton only renders for
// Pro and Elite, but `verify_jwt = false` in supabase/config.toml means the
// endpoint is reachable by anyone who knows the URL — without these gates a
// deployed OPENAI_API_KEY is an open, unmetered proxy to a paid account.
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
          error: "Magic Write requires an active Pro or Elite subscription",
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
    const { postType, tone = "casual", details } = await req.json();

    if (!postType) {
      return new Response(
        JSON.stringify({ error: "Post type is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const toneInstruction = TONES[tone as keyof typeof TONES] || TONES.casual;

    let prompt = "";
    if (postType === "catch") {
      const species = details?.species || "a nice fish";
      const weight = details?.weight ? `${details.weight} ${details.weightUnit || 'lbs'}` : null;
      const location = details?.location || null;

      prompt = `Write a short, engaging fishing community post about catching ${species}${weight ? ` weighing ${weight}` : ''}${location ? ` at ${location}` : ''}.

${toneInstruction}

Keep it to 2-3 sentences. Include 1-2 relevant hashtags at the end.`;
    } else if (postType === "tip") {
      const topic = details?.topic || "general fishing";
      prompt = `Write a helpful fishing tip about ${topic} for the AnglerDeck community.

${toneInstruction}

Keep it practical and actionable, 2-3 sentences max. Add 1-2 hashtags.`;
    } else {
      const topic = details?.topic || "a recent fishing trip";
      prompt = `Write a short, engaging story about ${topic} for the AnglerDeck fishing community.

${toneInstruction}

Keep it to 2-3 sentences. Include 1-2 relevant hashtags.`;
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

    console.log(`Magic Write — user ${user.id} (${tier}) — type ${postType}, tone ${tone}`);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        max_tokens: 256,
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

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || "";

    console.log("Story generated successfully");
    return new Response(
      JSON.stringify({ content: generatedText.trim() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI story generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
