// AI Mesh chat endpoint — routes to the right agent and streams a reply
// using Lovable AI Gateway. No API key needed from the user.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type MeshAgent = {
  id: string;
  name: string;
  tagline: string;
  enabled: boolean;
  tone: { formal_casual: number; terse_verbose: number; reserved_expressive: number };
  usesEmoji: boolean;
  keywords: string[];
  handoffMessage: string;
  greetingOnHandoff: string;
  systemPrompt: string;
};

type Body = {
  agents: Record<string, MeshAgent>;
  currentAgentId: string;
  persona: { firstName: string; line: string };
  bankName: string;
  messages: { role: "user" | "assistant"; content: string; agentName?: string }[];
  model?: string;
};

function routeIntent(text: string, agents: Record<string, MeshAgent>): string {
  const t = text.toLowerCase();
  const order = ["complaintAgent", "loanAgent", "savingsCoach", "investmentCoach", "onboarding"];
  for (const id of order) {
    const a = agents[id];
    if (!a?.enabled) continue;
    if (a.keywords.some((k) => k && t.includes(k))) return id;
  }
  return "concierge";
}

function describeTone(a: MeshAgent): string {
  const reg = a.tone.formal_casual < 33 ? "formal" : a.tone.formal_casual > 66 ? "casual" : "neutral";
  const len = a.tone.terse_verbose < 33 ? "terse (1-2 short sentences)" : a.tone.terse_verbose > 66 ? "verbose (4-6 sentences)" : "medium (2-3 sentences)";
  const exp = a.tone.reserved_expressive < 33 ? "reserved" : a.tone.reserved_expressive > 66 ? "expressive" : "balanced";
  const emo = a.usesEmoji ? "Use 1 relevant emoji where appropriate." : "Do not use emojis.";
  return `Register: ${reg}. Length: ${len}. Expressiveness: ${exp}. ${emo}`;
}

function buildSystem(a: MeshAgent, persona: { firstName: string; line: string }, bankName: string) {
  return [
    `You are ${a.name}, an AI agent inside the ${bankName} mobile banking app.`,
    `Role: ${a.tagline}`,
    `You are talking to ${persona.firstName} (${persona.line}).`,
    a.systemPrompt,
    describeTone(a),
    `Speak in the first person as ${a.name}. Never say you are an AI language model. Never mention OpenAI, Google, or Gemini.`,
    `If the user's request is outside your specialty, briefly help and suggest they ask the Concierge to route them.`,
    `Keep numeric amounts in ETB. Be concrete, warm, and useful.`,
  ].join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    const { agents, currentAgentId, persona, bankName, messages } = body;
    if (!agents || !messages?.length) {
      return new Response(JSON.stringify({ error: "Missing agents or messages" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const targetId = routeIntent(lastUser, agents);
    const handingOff = targetId !== currentAgentId && targetId !== "concierge";
    const agent = agents[targetId] ?? agents.concierge;

    const system = buildSystem(agent, persona, bankName);

    // Build conversation: keep last 8 turns to bound tokens
    const recent = messages.slice(-8).map((m) => ({
      role: m.role,
      content: m.role === "assistant" && m.agentName ? `[${m.agentName}]: ${m.content}` : m.content,
    }));

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: body.model || "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, ...recent],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiRes.text();
      console.error("AI gateway error", aiRes.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error", details: t }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "(no reply)";

    return new Response(JSON.stringify({
      targetAgentId: targetId,
      handoff: handingOff ? {
        to: targetId,
        text: agent.handoffMessage || `Connecting you to ${agent.name}…`,
      } : null,
      reply,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mesh-chat error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
