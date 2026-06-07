// Council follow-up — Amara (chair) routes a user question to the most relevant
// specialist agent, then that specialist answers. Returns short, voice-friendly
// lines plus a consensus signal so the UI can close the loop.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Agent = { id: string; name: string; tagline: string; systemPrompt?: string };
type Turn = { role: "user" | "chair" | "specialist"; agentId?: string; text: string };

type Body = {
  scenario: string;
  synthesis: string;
  actionLabel: string;
  question: string;
  history: Turn[];
  language: "en" | "am";
  bankName?: string;
  customerName?: string;
  agents: Agent[];
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) return json({ error: "Missing LOVABLE_API_KEY" }, 500);
    const body = (await req.json()) as Body;
    const { scenario, synthesis, actionLabel, question, history, language, agents,
            bankName = "the bank", customerName = "the customer" } = body;
    if (!question || !Array.isArray(agents) || agents.length === 0) {
      return json({ error: "question and agents required" }, 400);
    }
    const chair = agents.find((a) => a.id === "concierge") ?? agents[0];
    const specialists = agents.filter((a) => a.id !== chair.id);

    const langDirective = language === "am"
      ? "Reply ENTIRELY in fluent Amharic (አማርኛ)."
      : "Reply ENTIRELY in clear warm English suitable for an Ethiopian banking customer.";

    const roster = specialists.map((a) => `- ${a.id}: ${a.name} — ${a.tagline}`).join("\n");
    const transcript = history.slice(-10).map((t) => {
      if (t.role === "user") return `Customer: ${t.text}`;
      const who = agents.find((a) => a.id === t.agentId)?.name ?? t.agentId ?? "Agent";
      return `${who}: ${t.text}`;
    }).join("\n");

    const system = `You are running an interactive ${bankName} BankGPT Council follow-up.
Customer: ${customerName}. ${langDirective}

CONTEXT
Scenario: """${scenario}"""
Council decision so far: """${synthesis}"""
Current action proposed: "${actionLabel}"

ROSTER (specialists you may route to)
${roster}

Chair: ${chair.name} (${chair.id}) — routes the customer's question to ONE best specialist.

TASK
1) Pick exactly one specialistId from the roster best suited to the customer's new question.
2) Chair speaks ONE short routing line (10-16 words) that names the specialist and the angle.
3) Specialist answers the customer directly in 25-40 words — concrete, ETB-aware, actionable, references the existing plan when relevant. No hedging, no "I think".
4) If the customer is asking to change the plan, return an updated actionLabel; otherwise repeat the current one.
5) Set consensusReached=true ONLY if the customer's message clearly accepts/confirms (e.g. "let's do it", "go ahead", "approved", "እሺ", "ጀምር"). Otherwise false.

Return STRICT JSON only:
{
  "specialistId": "<id>",
  "chairLine": "<chair routing sentence>",
  "specialistReply": "<specialist's answer to the customer>",
  "updatedActionLabel": "<short action button label>",
  "consensusReached": true|false
}`;

    const userMsg = `Recent transcript:\n${transcript}\n\nNew customer message: "${question}"\n\nReturn JSON only.`;

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
      console.error("followup gateway error", aiRes.status, t);
      if (aiRes.status === 429) return json({ error: "Rate limit — try again shortly." }, 429);
      if (aiRes.status === 402) return json({ error: "AI credits exhausted." }, 402);
      return json({ error: "AI gateway error", details: t }, 500);
    }
    const data = await aiRes.json();
    const raw = data?.choices?.[0]?.message?.content?.trim() ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()); }
    catch { return json({ error: "Follow-up returned invalid JSON" }, 500); }

    const specialist =
      specialists.find((s) => s.id === parsed.specialistId) ??
      specialists.find((s) => question.toLowerCase().includes(s.id.toLowerCase())) ??
      specialists[0];

    return json({
      chairId: chair.id,
      specialistId: specialist.id,
      chairLine: clampWords(parsed.chairLine || fallbackChair(chair, specialist, language), language === "am" ? 20 : 16),
      specialistReply: clampWords(parsed.specialistReply || fallbackSpec(specialist, language), language === "am" ? 55 : 45),
      updatedActionLabel: parsed.updatedActionLabel || actionLabel,
      consensusReached: !!parsed.consensusReached,
      language,
    });
  } catch (e) {
    console.error("council-followup error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function clampWords(text: string, max: number) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  const words = clean.split(" ").filter(Boolean);
  if (words.length <= max) return clean;
  return words.slice(0, max).join(" ").replace(/[,.፣።;:]*$/, "") + "…";
}
function fallbackChair(chair: Agent, spec: Agent, lang: "en" | "am") {
  if (lang === "am") return `${chair.name}፦ ${spec.name} ይህንን ጥያቄ በተሻለ ሁኔታ ይመልሳል።`;
  return `${chair.name}: routing this to ${spec.name} — best placed to address it directly.`;
}
function fallbackSpec(spec: Agent, lang: "en" | "am") {
  if (lang === "am") return `${spec.name}፦ ጥያቄዎ ተቀብያለሁ፤ በተግባር የሚሰራ መፍትሄ እናዘጋጃለን።`;
  return `${spec.name}: noted — we can adjust the plan to fit that constraint and keep it executable today.`;
}
