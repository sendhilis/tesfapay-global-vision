import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INTENT_DETECTION_BLOCK = `
## Intent Detection (CRITICAL)
When a user message clearly indicates they want to PERFORM an action (not just ask about it), you MUST include an intent marker at the very start of your response in this exact format:
[INTENT:intent_name]

Available intents:
- check_balance, send_money, pay_bill, buy_airtime, apply_loan, repay_loan, view_transactions, upgrade_kyc, open_account, transfer_own, cash_in, cash_out, view_notifications, account_settings, get_support, view_sales, manage_qr, check_settlements, manage_vendors, merchant_wallet

Only include intent if the user clearly wants to DO something.
`;

const RETAIL_SYSTEM_PROMPT = `You are NisirAI for retail customers. Bilingual EN/Amharic. ${INTENT_DETECTION_BLOCK}`;
const MERCHANT_SYSTEM_PROMPT = `You are NisirAI for merchants. Bilingual EN/Amharic. ${INTENT_DETECTION_BLOCK}`;
const AGENCY_SYSTEM_PROMPT = `You are NisirAI for agents. Bilingual EN/Amharic. ${INTENT_DETECTION_BLOCK}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { messages, portal, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    const systemPrompt = portal === "merchant" ? MERCHANT_SYSTEM_PROMPT : portal === "agency" ? AGENCY_SYSTEM_PROMPT : RETAIL_SYSTEM_PROMPT;
    const langNote = language === "am" ? "\n\nPrefer Amharic." : "\n\nPrefer English.";
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt + langNote }, ...messages],
        stream: true,
      }),
    });
    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI service unavailable" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
