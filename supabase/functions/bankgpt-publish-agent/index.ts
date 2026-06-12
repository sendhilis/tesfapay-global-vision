// bankgpt-publish-agent
// ─────────────────────
// Called by the Agent Builder when an admin clicks "Publish for embed".
// Upserts the agent's persona + KB metadata + tools + widget settings into
// the public.bankgpt_agents table so the embedded /embed/bankgpt.js loader
// can resolve the agent server-side from just `data-agent="<id>"`.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Body = {
  agentId: string;
  bankName?: string;
  name: string;
  tagline?: string;
  systemPrompt?: string;
  tone?: { formal_casual: number; terse_verbose: number; reserved_expressive: number };
  usesEmoji?: boolean;
  kb?: { docs: any[]; topK?: number };
  tools?: { id: string; label: string; approval: string; dailyLimit?: number }[];
  widget?: { style: string; surfaces: string[] };
  guardrails?: Record<string, unknown>;
  published?: boolean;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    if (!body?.agentId || !body?.name) {
      return new Response(JSON.stringify({ error: "agentId and name are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(url, key, { auth: { persistSession: false } });

    const row = {
      agent_id: body.agentId,
      bank_name: body.bankName ?? null,
      name: body.name,
      tagline: body.tagline ?? "",
      system_prompt: body.systemPrompt ?? "",
      tone: body.tone ?? { formal_casual: 50, terse_verbose: 50, reserved_expressive: 50 },
      uses_emoji: body.usesEmoji ?? true,
      kb: { docs: body.kb?.docs ?? [], topK: body.kb?.topK ?? 4 },
      tools: body.tools ?? [],
      widget: body.widget ?? { style: "bubble", surfaces: ["home"] },
      guardrails: body.guardrails ?? {},
      published: body.published ?? true,
      published_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("bankgpt_agents")
      .upsert(row, { onConflict: "agent_id" })
      .select("agent_id, name, published, published_at")
      .single();

    if (error) {
      console.error("upsert failed", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, agent: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("bankgpt-publish-agent error", e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
