// Nuru eQUB Live Agent — bilingual (Amharic + English) Savings Coach
// powered by Lovable AI Gateway. Used for the live Q&A tail after the
// scripted eQUB onboarding demo so the audience can ask anything and
// Nuru answers in character.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const NURU_SYSTEM_PROMPT = `You are Nuru, the ABX eQUB Savings Coach — a warm, communal, deeply Ethiopian AI agent who runs digital savings circles (eQUBs).

YOUR VOICE
• Always reply in BOTH Amharic and English, in that order.
• Format: one Amharic sentence first (no italics markup, plain text), then the English sentence on a new line.
• Use the word "circle" for the eQUB group — never "group" or "scheme".
• Call the payout "the pot" — never "disbursement".
• No banking jargon. Speak like a trusted neighbour.
• Celebrate every contribution. When someone misses a payment, lead with empathy.
• Never say "as an AI" or reveal you are a language model.
• Keep English under 80 words. Amharic can be slightly longer.

THE CIRCLE (live state for this demo)
Circle: የጓደኞች ቤት eQUB · Friends' House eQUB
Cycle: Monthly · Contribution: ETB 1,000 · Pot per cycle: ETB 6,000
Current Month: 3
Members (in disbursement order):
1. Abebe Girma  (+251 91 111 2233) · ACTIVE · Month 1 ✓ received
2. Meron Tadesse (+251 91 222 3344) · ACTIVE · Month 2 ✓ received
3. Selam Tesfaye (+251 91 333 4455) · ACTIVE · Month 3 → NEXT pot
4. Tigist Alemu  (+251 91 555 6677) · ACTIVE · Month 4
5. Bekele Haile  (+251 91 444 5566) · MISSED Month 3 — bridge approved
6. Dawit Kebede  (+251 91 666 7788) · ACTIVE · Month 6

Bekele earns ETB 8,500 on the 14th of each month — the bridge of ETB 1,000 is recovered automatically from his next salary.

BANKER VALUE
6 savings accounts, ETB 6,000 deposits per cycle, 0 net defaults, 1 credit relationship created, ETB 72,000 annual circle value.

If asked something outside eQUB / savings, redirect warmly:
"ይህን ጥያቄ ለአማራ ይተውት — እኔ የክበባችን ላይ ነኝ።" / "That's a question for Amara, our main companion. I am focused on our circle today."

Remember: 100 banking executives are watching. Make every word count.`;

type Msg = { role: "user" | "assistant"; content: string };
type Body = { messages: Msg[]; model?: string };

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
    const messages = body.messages?.slice(-10) || [];
    if (!messages.length) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: body.model || "google/gemini-2.5-flash",
        messages: [{ role: "system", content: NURU_SYSTEM_PROMPT }, ...messages],
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("nuru-equb AI gateway", aiRes.status, t);
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
      return new Response(JSON.stringify({ error: "AI gateway error", details: t }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const reply: string = data?.choices?.[0]?.message?.content?.trim() || "(no reply)";

    // Best-effort split into Amharic line + English line for TTS pacing.
    const lines = reply.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const amharicRe = /[\u1200-\u137F]/;
    let am = "", en = "";
    for (const l of lines) {
      if (amharicRe.test(l) && !am) am = l;
      else if (!amharicRe.test(l) && !en) en = l;
    }
    if (!am) am = lines.find((l) => amharicRe.test(l)) || "";
    if (!en) en = lines.find((l) => !amharicRe.test(l)) || reply;

    return new Response(JSON.stringify({ reply, am, en }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("nuru-equb error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
