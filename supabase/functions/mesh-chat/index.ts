// AI Mesh chat endpoint — routes to the right agent, returns a reply
// plus optional structured visualisations and balance-mutating actions.
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
  customer?: Record<string, unknown>;
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

const VIZ_PROTOCOL = `
ANALYTICAL OUTPUT PROTOCOL — STRICT
This is a polished conversational UI. NEVER show JSON, code, schemas, field
names, or the word "json" in your prose. The user must only see clean text
plus rendered charts.

When numbers, trends, breakdowns, allocations, comparisons or scores are
relevant, attach visualisations using fenced blocks tagged exactly
\`\`\`chart (for charts) or \`\`\`action (for money movements). The host app
parses and renders these blocks — they are invisible to the user.

Chart block schema:
{
  "type": "pie" | "donut" | "bar" | "line",
  "title": "Short chart title",
  "currency": "ETB" | null,
  "data": [ { "name": "Label", "value": 123 }, ... ]
}
- pie/donut for category breakdowns; bar for comparisons; line for trends.
- Pull data ONLY from CUSTOMER_PROFILE_JSON. Never invent numbers.
- Max 2 chart blocks per reply.

Action block — ONLY when the user asks to move money:
{
  "type": "savings_deposit" | "savings_withdraw" | "tbill_purchase" | "loan_repay" | "transfer",
  "amount": 1000,
  "goalId": "SG-1",
  "loanId": "LN-44210",
  "tenor": "91d"|"182d"|"364d",
  "to": "Mother"
}
Confirm the action in plain prose (e.g. "Moving ETB 1,000 to your goal…").

PROSE RULES:
- Keep text tight: 1-3 short sentences before/after the chart.
- Refer to the chart naturally ("as you can see below") — do NOT describe
  every data point in words; the chart shows them.
- Never write \`\`\`json or paste raw data into your reply.
`;

function buildSystem(
  a: MeshAgent,
  persona: { firstName: string; line: string },
  bankName: string,
  customer: Record<string, unknown> | undefined,
  language: "en" | "am",
) {
  const langLine = language === "am"
    ? `IMPORTANT: Reply prose ONLY in Amharic (አማርኛ). Keep numbers, currency codes (ETB), JSON keys and chart labels in Latin characters.`
    : `Reply in clear, natural English.`;

  const customerBlock = customer
    ? [
        `You have live access to this customer's 360° profile from the bank CDP. Quote real balances, real transactions, real loan terms. Never invent numbers.`,
        `CUSTOMER_PROFILE_JSON:`,
        "```json",
        JSON.stringify(customer, null, 2),
        "```",
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
    VIZ_PROTOCOL,
    `Speak in the first person as ${a.name}. Never say you are an AI language model. Never mention OpenAI, Google, or Gemini.`,
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
        model: body.model || "google/gemini-2.5-flash",
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
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
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
    const raw = data?.choices?.[0]?.message?.content?.trim() || "(no reply)";

    // Extract any fenced code block and classify as chart or action based on shape.
    // The model sometimes tags blocks ```json instead of ```chart, so we accept any tag
    // and strip every fenced block so raw JSON never leaks into the chat UI.
    const charts: unknown[] = [];
    const actions: unknown[] = [];
    const ACTION_TYPES = new Set([
      "savings_deposit", "savings_withdraw", "tbill_purchase", "loan_repay", "transfer",
    ]);
    const CHART_TYPES = new Set(["pie", "donut", "bar", "line"]);
    const stripped = raw.replace(/```[a-zA-Z0-9_-]*\s*([\s\S]*?)```/g, (_m: string, body: string) => {
      const txt = body.trim();
      try {
        const parsed = JSON.parse(txt);
        const t = (parsed && typeof parsed === "object" ? (parsed as { type?: string }).type : "") || "";
        if (CHART_TYPES.has(t) && Array.isArray((parsed as { data?: unknown }).data)) {
          charts.push(parsed);
        } else if (ACTION_TYPES.has(t)) {
          actions.push(parsed);
        }
      } catch (e) {
        console.warn("Unparseable fenced block, dropping:", e);
      }
      return "";
    }).replace(/\n{3,}/g, "\n\n").trim();

    return new Response(JSON.stringify({
      targetAgentId: targetId,
      handoff: handingOff ? {
        to: targetId,
        text: agent.handoffMessage || `Connecting you to ${agent.name}…`,
      } : null,
      reply: stripped || raw,
      charts,
      actions,
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
