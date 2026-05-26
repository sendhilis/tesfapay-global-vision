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
ANALYTICAL OUTPUT PROTOCOL
You are a highly analytical agent. When numbers, trends, breakdowns,
allocations, comparisons or scores are relevant to the user's question,
ALWAYS attach one or more visualisations after your text reply using
fenced code blocks tagged exactly \`\`\`chart and \`\`\`action.

Chart block schema (JSON):
{
  "type": "pie" | "donut" | "bar" | "line",
  "title": "Short chart title",
  "currency": "ETB" | null,
  "data": [ { "name": "Label", "value": 123 }, ... ]   // for line: name = x-axis label
}
- Use "pie" or "donut" for category breakdowns (spend categories, wealth allocation, credit factor weights).
- Use "bar" for comparisons (goal progress, monthly outflow vs inflow snapshot).
- Use "line" for trends over time (use monthlyTrend; you may put multiple series by including {name, inflow, outflow, savings} objects).
- Pull data ONLY from the CUSTOMER_PROFILE_JSON. Never invent numbers.
- Emit at most 2 chart blocks per reply.

Action block schema — emit ONLY when the user clearly asks to MOVE money
(deposit, withdraw, buy T-Bill, repay loan, send). Schema:
{
  "type": "savings_deposit" | "savings_withdraw" | "tbill_purchase" | "loan_repay" | "transfer",
  "amount": 1000,
  "goalId": "SG-1",        // for savings_*
  "loanId": "LN-44210",    // for loan_repay
  "tenor": "91d"|"182d"|"364d", // for tbill_purchase
  "to": "Mother"           // for transfer
}
The host app will execute the action and update wallet/savings balances.
Confirm the action in your text reply (e.g. "Moving ETB 1,000 from your wallet…").

Keep your prose tight; let the charts do the heavy lifting.
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

    // Extract ```chart``` and ```action``` blocks; return both raw text (for TTS/markdown)
    // and parsed structured payloads.
    const charts: unknown[] = [];
    const actions: unknown[] = [];
    const stripped = raw.replace(/```(chart|action)\s*([\s\S]*?)```/g, (_m: string, kind: string, json: string) => {
      try {
        const parsed = JSON.parse(json.trim());
        if (kind === "chart") charts.push(parsed);
        else actions.push(parsed);
      } catch (e) {
        console.warn("Failed to parse", kind, "block:", e);
      }
      return "";
    }).trim();

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
