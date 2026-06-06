/**
 * Voice helpers for the BankGPT Sandbox demo.
 * Uses the existing `elevenlabs-tts` and `elevenlabs-stt` edge functions
 * (already deployed under supabase/functions/) and the bilingual
 * `agent-sandbox-chat` endpoint.
 */
import { supabase } from "@/integrations/supabase/client";

const FN_URL = (name: string) =>
  `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/${name}`;

const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** Speak text via ElevenLabs TTS. Returns once playback ends or errors. */
export async function speak(text: string, lang: "en" | "am" = "en"): Promise<void> {
  if (!text?.trim()) return;
  try {
    const res = await fetch(FN_URL("elevenlabs-tts"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ text, lang }),
    });
    if (!res.ok) {
      console.warn("TTS failed", res.status);
      return;
    }
    const ctype = res.headers.get("Content-Type") || "";
    if (!ctype.startsWith("audio/")) {
      // Fallback JSON envelope (e.g. 429 returns JSON)
      const j = await res.json().catch(() => null);
      console.warn("TTS non-audio response", j);
      return;
    }
    const buf = await res.arrayBuffer();
    const blob = new Blob([buf], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    await audio.play();
    await new Promise<void>((resolve) => {
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
    });
  } catch (e) {
    console.warn("speak() error", e);
  }
}

/** Transcribe a recorded Blob via ElevenLabs STT. */
export async function transcribe(audio: Blob, lang: "en" | "am" = "en"): Promise<string> {
  const form = new FormData();
  form.append("audio", audio, "clip.webm");
  form.append("language", lang === "am" ? "amh" : "eng");
  const res = await fetch(FN_URL("elevenlabs-stt"), {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: form,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`STT ${res.status}: ${t}`);
  }
  const data = await res.json();
  return (data?.text || "").trim();
}

/** Call the bilingual agent sandbox chat endpoint. */
export async function sandboxChat(payload: {
  agent: { name: string; tagline: string; systemPrompt: string; tone: any; usesEmoji: boolean; bankName?: string };
  kb: { docs: any[]; topK: number };
  tools: { id: string; label: string; approval: string; dailyLimit?: number }[];
  messages: { role: "user" | "assistant"; content: string }[];
  language: "en" | "am";
}): Promise<{ reply: string; groundedCitations: number }> {
  const { data, error } = await supabase.functions.invoke("agent-sandbox-chat", { body: payload });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as { reply: string; groundedCitations: number };
}

/** Recorder helper — call .stop() to get a webm Blob. */
export async function startRecording(): Promise<{ stop: () => Promise<Blob> }> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";
  const rec = new MediaRecorder(stream, { mimeType });
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  rec.start();
  return {
    stop: () =>
      new Promise<Blob>((resolve) => {
        rec.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          resolve(new Blob(chunks, { type: "audio/webm" }));
        };
        rec.stop();
      }),
  };
}
