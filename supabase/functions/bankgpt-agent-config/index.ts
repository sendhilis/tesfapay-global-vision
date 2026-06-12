// bankgpt-agent-config
// ────────────────────
// Load / save the Agent Builder draft config (KB list, tools, guardrails,
// widget settings, intents, etc.) per agent. Stored in
// public.bankgpt_agent_drafts and accessed via service role so the
// prototype works without a per-user auth session.
//
// GET-style:   POST { op: "load", agentId }            → { config }
// SAVE:        POST { op: "save", agentId, config }    → { ok: true }
// LIST IDS:    POST { op: "list" }                     → { agentIds: [...] }
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Body =
  | { op: "load"; agentId: string }
  | { op: "save"; agentId: string; config: Record<string, unknown> }
  | { op: "list" };

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
    const supabase = createClient(url, key, { auth: { persistSession: false } });

    const body = (await req.json()) as Body;

    if (body.op === "load") {
      if (!body.agentId) {
        return new Response(JSON.stringify({ error: "agentId required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data, error } = await supabase
        .from("bankgpt_agent_drafts")
        .select("config, updated_at")
        .eq("agent_id", body.agentId)
        .maybeSingle();
      if (error) throw error;
      return new Response(JSON.stringify({ config: data?.config ?? null, updatedAt: data?.updated_at ?? null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.op === "save") {
      if (!body.agentId || typeof body.config !== "object" || body.config === null) {
        return new Response(JSON.stringify({ error: "agentId and config required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await supabase
        .from("bankgpt_agent_drafts")
        .upsert({ agent_id: body.agentId, config: body.config, updated_at: new Date().toISOString() }, { onConflict: "agent_id" });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.op === "list") {
      const { data, error } = await supabase
        .from("bankgpt_agent_drafts")
        .select("agent_id, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ agents: data ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown op" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("bankgpt-agent-config error", e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
