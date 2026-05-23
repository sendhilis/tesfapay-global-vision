// ElevenLabs TTS — bilingual (English / Amharic) voice for Amara,
// the ABX Onboarding Agent. Returns MP3 bytes.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Body = {
  text: string;
  lang?: "en" | "am";          // language hint
  voiceId?: string;            // override
  stability?: number;
  similarity?: number;
};

// Sarah — warm, female, multilingual; ideal for "Amara" persona.
const DEFAULT_VOICE = "EXAVITQu4vr4xnSDxMaL";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    const text = (body.text || "").trim();
    if (!text) {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const voiceId = body.voiceId || DEFAULT_VOICE;
    // Always use multilingual v2 — covers Amharic + English in same call.
    const model = "eleven_multilingual_v2";

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: model,
          voice_settings: {
            stability: body.stability ?? 0.5,
            similarity_boost: body.similarity ?? 0.75,
            style: 0.35,
            use_speaker_boost: true,
            speed: body.lang === "am" ? 0.95 : 1.0,
          },
        }),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("ElevenLabs TTS error", res.status, errText);
      return new Response(JSON.stringify({ error: "TTS failed", status: res.status, details: errText }), {
        status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audio = await res.arrayBuffer();
    return new Response(audio, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("elevenlabs-tts error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
