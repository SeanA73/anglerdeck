import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TONES = {
  casual: "Write in a casual, friendly tone like you're telling a buddy about your day.",
  proud: "Write with excitement and pride about the achievement, but stay humble.",
  humorous: "Make it fun and lighthearted with fishing humor or puns.",
  educational: "Include helpful tips or interesting facts about the species or technique used.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postType, tone = "casual", details } = await req.json();
    
    if (!postType) {
      return new Response(
        JSON.stringify({ error: "Post type is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    console.log("Generating story with tone:", tone, "type:", postType);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { 
            role: "system", 
            content: "You are a creative writer helping anglers craft engaging social media posts for the AnglerDeck fishing community. Keep posts authentic, relatable, and under 280 characters when possible." 
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 256,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
