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
  /** Snapshot of the customer 360 from the CDP — balances, txns, loans, etc. */
  customer?: Record<string, unknown>;
  /** "en" | "am" — agent must reply in this language. */
  language?: "en" | "am";
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

function buildSystem(
  a: MeshAgent,
  persona: { firstName: string; line: string },
  bankName: string,
  customer: Record<string, unknown> | undefined,
  language: "en" | "am",
) {
  const langLine = language === "am"
    ? `IMPORTANT: Reply ONLY in Amharic (አማርኛ). Use Ethiopian script. Keep numbers and currency codes (ETB) in Latin characters.`
    : `Reply in clear, natural English.`;

  const customerBlock = customer
    ? [
        `You have live access to this customer's 360° profile from the bank CDP. Use it to give specific, concrete answers — quote real balances, real transactions, real loan terms. Never invent numbers.`,
        `CUSTOMER_PROFILE_JSON:`,
        "```json",
        JSON.stringify(customer, null, 2),
        "```",
        `Rules: (1) If the answer requires data not in this profile, say so briefly. (2) Always be proactive — if a relevant nudge fits (low balance, missed installment, eligible loan/T-Bill, near savings goal), surface it. (3) Quote ETB amounts with thousands separators.`,
      ].join("\n")
    : "";

  return [
    `You are ${a.name}, an AI agent inside the ${bankName} mobile banking app — part of the BankGPT AI Mesh.`,
    `Role: ${a.tagline}`,
    `You are talking to ${persona.firstName} (${persona.line}).`,
    a.systemPrompt,
    describeTone(a),
    langLine,
    customerBlock,
    `Speak in the first person as ${a.name}. Never say you are an AI language model. Never mention OpenAI, Google, or Gemini.`,
    `If the user's request is outside your specialty, briefly help and suggest they ask the Concierge to route them.`,
    `Be concrete, warm, and useful.`,
  ].filter(Boolean).join("\n\n");
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

    const system = buildSystem(agent, persona, bankName, body.customer, body.language ?? "en");

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
