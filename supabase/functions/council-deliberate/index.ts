// Council Mode — every specialist offers a short opinion on a customer scenario,
// then the Concierge synthesizes a single recommended action plan.
// Returns one structured JSON payload so the UI can sequence voice playback.
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

    const system = `You are simulating the "${bankName}" BankGPT AI Council — a live boardroom of specialist banking agents.
Customer: ${customerName}. ${langDirective}

ROSTER (each speaks IN-PERSONA, one short turn):
${agentRoster}

CONTEXT (Ethiopia banking, NBE-regulated):
- Currency: ETB (Birr). Be realistic with local amounts and product names (e.g. Wedding Savings, Personal Loan, T-Bill, Visa Gold).
- Tone: confident, human, warm. Show genuine reasoning — like a real banker thinking out loud.
- Show "consciousness": agents reference each other by name when they hand off ("Building on what {Other} said…").
- Each agent's turn MUST be at most 2 sentences (~25 words) so the full council fits in 90 seconds of speech.

DELIVERABLE — return STRICT JSON only, no prose, no code fences:
{
  "contributions": [
    { "agentId": "<id from roster, NOT concierge>", "opinion": "<2 sentences max, in ${language === "am" ? "Amharic" : "English"}>" }
  ],
  "synthesis": "<Concierge's final 3-4 sentence action plan that explicitly cites 2-3 of the agents' contributions and ends with a concrete next step the customer can approve>",
  "actionLabel": "<short button label for the recommended action, e.g. 'Open Wedding Savings & apply for ETB 80k loan'>"
}

Include EVERY specialist from the roster in contributions, in this order: ${specialists.map((a) => a.id).join(", ")}.
The "synthesis" is spoken by ${concierge.name} (concierge) and MUST weave together the council's reasoning into ONE coherent recommendation.`;

    const userMsg = `Scenario from ${customerName}:\n"""${scenario}"""\n\nConvene the council. Return JSON only.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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

    return json({
      contributions: Array.isArray(parsed.contributions) ? parsed.contributions : [],
      synthesis: parsed.synthesis ?? "",
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
