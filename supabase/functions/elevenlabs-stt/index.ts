// ElevenLabs STT — transcribe short user audio clips for the
// ABX Onboarding demo (phone number capture, goal selection, etc.)
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Accept multipart/form-data { audio: Blob, language: 'eng'|'amh' }
    const form = await req.formData();
    const file = form.get("audio");
    const language = (form.get("language") as string) || "eng";

    if (!(file instanceof File) && !(file instanceof Blob)) {
      return new Response(JSON.stringify({ error: "audio file is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiForm = new FormData();
    apiForm.append("file", file, "clip.webm");
    apiForm.append("model_id", "scribe_v2");
    apiForm.append("language_code", language);
    apiForm.append("tag_audio_events", "false");
    apiForm.append("diarize", "false");

    const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: apiForm,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("ElevenLabs STT error", res.status, errText);
      return new Response(JSON.stringify({ error: "STT failed", status: res.status, details: errText }), {
        status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify({ text: data.text || "", raw: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("elevenlabs-stt error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
