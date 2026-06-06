// Agent Sandbox Chat — bilingual (English / Amharic) single-agent endpoint
// used by the BankGPT Agent Builder Sandbox tab. Grounds replies in
// uploaded / URL-attached KB doc names so the demo feels real.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Tone = { formal_casual: number; terse_verbose: number; reserved_expressive: number };
type KbDoc = { name: string; type: string; status: string; enabled: boolean; source?: string };
type Tool = { id: string; label: string; approval: string; dailyLimit?: number };

type Body = {
  agent: {
    name: string;
    tagline: string;
    systemPrompt: string;
    tone: Tone;
    usesEmoji: boolean;
    bankName?: string;
  };
  kb: { docs: KbDoc[]; topK: number };
  tools: Tool[];
  messages: { role: "user" | "assistant"; content: string }[];
  language?: "en" | "am";
  model?: string;
};

function describeTone(t: Tone, usesEmoji: boolean) {
  const reg = t.formal_casual < 33 ? "formal" : t.formal_casual > 66 ? "casual" : "neutral";
  const len = t.terse_verbose < 33 ? "terse (1-2 short sentences)" : t.terse_verbose > 66 ? "verbose (4-6 sentences)" : "medium (2-3 sentences)";
  const exp = t.reserved_expressive < 33 ? "reserved" : t.reserved_expressive > 66 ? "expressive" : "balanced";
  return `Register: ${reg}. Length: ${len}. Expressiveness: ${exp}. ${usesEmoji ? "May use 1 relevant emoji." : "Do not use emojis."}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    const { agent, kb, tools, messages } = body;
    const language = body.language ?? "en";

    if (!agent?.name || !messages?.length) {
      return new Response(JSON.stringify({ error: "Missing agent or messages" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const enabledDocs = (kb?.docs ?? []).filter((d) => d.enabled && d.status === "indexed");
    const kbBlock = enabledDocs.length
      ? `KNOWLEDGE BASE (use these as your authoritative grounding sources — cite by document name when relevant):\n${
          enabledDocs.slice(0, 8).map((d, i) => `  [${i + 1}] ${d.name}${d.source && d.source !== "upload" ? ` (${d.source})` : ""}`).join("\n")
        }`
      : "KNOWLEDGE BASE: (none attached — answer from general banking knowledge, be transparent about it).";

    const toolBlock = tools?.length
      ? `AVAILABLE ACTIONS (simulate these in your reply — describe what you would do, do NOT actually execute):\n${
          tools.map((t) => `  • ${t.label} [policy: ${t.approval}${t.dailyLimit ? `, daily limit ETB ${t.dailyLimit}` : ""}]`).join("\n")
        }`
      : "";

    const langLine = language === "am"
      ? `CRITICAL: Reply ONLY in Amharic (አማርኛ) prose. Keep numbers, currency codes (ETB) and product names like "VISA" or "Mastercard" in Latin script. This is a spoken demo — keep replies under 3 short sentences so the TTS sounds natural.`
      : `Reply in clear, natural, conversational English. This is a spoken demo — keep replies under 3 short sentences so the TTS sounds natural.`;

    const system = [
      `You are ${agent.name}, an AI specialist agent inside the ${agent.bankName || "bank"}'s BankGPT mesh.`,
      `Role: ${agent.tagline}`,
      agent.systemPrompt,
      describeTone(agent.tone, agent.usesEmoji),
      langLine,
      kbBlock,
      toolBlock,
      `Be concrete, warm, helpful. Never say "as an AI". Never mention OpenAI, Google or Gemini. Never output JSON or code fences.`,
    ].filter(Boolean).join("\n\n");

    const recent = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: body.model || "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, ...recent],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit — try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiRes.text();
      return new Response(JSON.stringify({ error: "AI gateway error", details: t }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const reply = data?.choices?.[0]?.message?.content?.trim()
      ?.replace(/```[\s\S]*?```/g, "")
      ?.trim() || "(no reply)";

    return new Response(JSON.stringify({
      reply,
      groundedCitations: enabledDocs.length,
      language,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("agent-sandbox-chat error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
