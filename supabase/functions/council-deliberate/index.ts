// Council Mode — autonomous agent-to-agent deliberation.
// One user requirement convenes the council; every agent speaks to the next
// agent, then the chair announces one decision. The UI sequences voice playback.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type CouncilAgent = {
  id: string;
  name: string;
  tagline: string;
  systemPrompt?: string;
};

type Body = {
  scenario: string;
  language: "en" | "am";
  bankName?: string;
  customerName?: string;
  agents: CouncilAgent[];
};

type CouncilTurn = {
  agentId: string;
  addressedTo?: string;
  opinion: string;
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      return json({ error: "Missing LOVABLE_API_KEY" }, 500);
    }
    const body = (await req.json()) as Body;
    const { scenario, language, agents, bankName = "the bank", customerName = "the customer" } = body;
    if (!scenario || !Array.isArray(agents) || agents.length === 0) {
      return json({ error: "scenario and agents required" }, 400);
    }

    const concierge = agents.find((a) => a.id === "concierge") ?? agents[0];
    const specialists = agents.filter((a) => a.id !== concierge.id);

    const langDirective = language === "am"
      ? "Reply ENTIRELY in fluent Amharic (አማርኛ). No English words except brand/product names."
      : "Reply ENTIRELY in clear, warm English suitable for an Ethiopian banking customer.";

    const agentRoster = agents.map((a) =>
      `- ${a.id} ("${a.name}" — ${a.tagline}). ${a.systemPrompt ? "Persona: " + a.systemPrompt.slice(0, 240) : ""}`
    ).join("\n");

    const orderedSpecialistIds = specialists.map((a) => a.id).join(", ");
    const system = `You are simulating the "${bankName}" BankGPT AI Council — a live human-style boardroom of specialist banking agents.
Customer: ${customerName}. ${langDirective}

THIS IS NOT A CHATBOT RESPONSE.
After the user states the requirement, the council must run by itself. No questions to the user. No waiting. No "please confirm" until the final decision is announced.

ROSTER:
${agentRoster}

CONTEXT (Ethiopia banking, NBE-regulated):
- Currency: ETB (Birr). Be realistic with local amounts and product names (e.g. Wedding Savings, Personal Loan, T-Bill, Visa Gold).
- Respect the 1:1 cash backing / trust-account principle for e-money and NBE consumer-protection logic.
- Tone: confident, human, warm, like senior bankers in a decision room.
- Show agentic intelligence: each agent contributes a distinct role, references another agent, and hands off naturally.
- Every specialist turn MUST be very short: one sentence, 12-18 words. The full council must fit in 90 seconds.

DELIVERABLE — return STRICT JSON only, no prose, no code fences:
{
  "opening": { "agentId": "${concierge.id}", "addressedTo": "<first specialist id>", "opinion": "<chair opens the council in 8-14 words>" },
  "turns": [
    { "agentId": "<id from roster, NOT concierge>", "addressedTo": "<next agent id or ${concierge.id}>", "opinion": "<one short sentence, in ${language === "am" ? "Amharic" : "English"}>" }
  ],
  "synthesis": "<${concierge.name}'s final 35-45 word decision that cites 3 agents and announces one executable plan>",
  "actionLabel": "<short button label for the recommended action, e.g. 'Open Wedding Savings & apply for ETB 80k loan'>"
}

MANDATORY SEQUENCE:
- opening is spoken by ${concierge.name} (${concierge.id}) and addressed to ${specialists[0]?.id ?? concierge.id}.
- turns MUST include EVERY specialist exactly once, in this exact order: ${orderedSpecialistIds}.
- Each turn must sound like the agent is speaking to the next council member, not to the customer.
- The last specialist addresses ${concierge.id}, asking the chair to decide.
- The synthesis is spoken by ${concierge.name} and MUST announce ONE coherent solution, not options.`;

    const userMsg = `Scenario from ${customerName}:\n"""${scenario}"""\n\nConvene the council. Return JSON only.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": LOVABLE_API_KEY,
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("council gateway error", aiRes.status, t);
      if (aiRes.status === 429) return json({ error: "Rate limit — try again shortly." }, 429);
      if (aiRes.status === 402) return json({ error: "AI credits exhausted." }, 402);
      return json({ error: "AI gateway error", details: t }, 500);
    }

    const data = await aiRes.json();
    const raw = data?.choices?.[0]?.message?.content?.trim() ?? "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch (e) {
      console.error("bad JSON from council", raw);
      return json({ error: "Council returned invalid JSON" }, 500);
    }

    const rawTurns: CouncilTurn[] = Array.isArray(parsed.turns)
      ? parsed.turns
      : Array.isArray(parsed.contributions)
        ? parsed.contributions
        : [];
    const turns = specialists.map((agent, index) => {
      const next = specialists[index + 1]?.id ?? concierge.id;
      const found = rawTurns.find((t) => t?.agentId === agent.id);
      return {
        agentId: agent.id,
        addressedTo: found?.addressedTo || next,
        opinion: clampWords(found?.opinion || fallbackTurn(agent, next, language), language === "am" ? 20 : 18),
      };
    });
    const opening = {
      agentId: concierge.id,
      addressedTo: specialists[0]?.id ?? concierge.id,
      opinion: clampWords(parsed.opening?.opinion || fallbackOpening(concierge, specialists[0], language), language === "am" ? 18 : 14),
    };
    const synthesis = clampWords(parsed.synthesis || fallbackSynthesis(concierge, specialists, language), language === "am" ? 58 : 48);

    return json({
      opening,
      turns,
      contributions: turns,
      synthesis,
      actionLabel: parsed.actionLabel ?? (language === "am" ? "ይህን አማራጭ ተግብር" : "Apply this plan"),
      conciergeId: concierge.id,
      language,
    });
  } catch (e) {
    console.error("council-deliberate error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function clampWords(text: string, max: number) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  const words = clean.split(" ").filter(Boolean);
  if (words.length <= max) return clean;
  return words.slice(0, max).join(" ").replace(/[,.፣።;:]*$/, "") + "…";
}

function fallbackOpening(chair: CouncilAgent, first: CouncilAgent | undefined, language: "en" | "am") {
  if (language === "am") return `${chair.name} ምክር ቤቱን ከፍቻለሁ፤ ${first?.name ?? "ቡድኑ"} መጀመሪያ ይመልከት።`;
  return `${chair.name} opens the council; ${first?.name ?? "the team"}, start with the customer objective.`;
}

function fallbackTurn(agent: CouncilAgent, nextAgentId: string, language: "en" | "am") {
  if (language === "am") return `${agent.name} ከ${agent.tagline} አንጻር አደጋና ዕድልን አስተካክላለሁ፤ ${nextAgentId} ይቀጥል።`;
  return `${agent.name}: from my ${agent.tagline} lens, I balance risk, timing, and action; ${nextAgentId} continues.`;
}

function fallbackSynthesis(chair: CouncilAgent, specialists: CouncilAgent[], language: "en" | "am") {
  const names = specialists.slice(0, 3).map((a) => a.name).join(", ");
  if (language === "am") return `${chair.name}: ${names} ያቀረቡትን አንድ እቅድ አድርጌዋለሁ። የተለየ ቁጠባ እንከፍታለን፣ ተመጣጣኝ ብድር እንገምግማለን፣ ክፍያዎችንም በማሳወቂያ እናስተዳድራለን።`;
  return `${chair.name}: I combine ${names} into one plan: open a dedicated goal, fund it monthly, assess a responsible loan gap, and automate reminders so the customer can approve and execute now.`;
}
