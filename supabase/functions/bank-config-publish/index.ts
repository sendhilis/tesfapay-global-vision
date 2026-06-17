// bank-config-publish
// ────────────────────
// Persists the singleton ABX BankConfig (id = "global") into
// public.bank_configs using the service role, bypassing RLS.
// The wizard is a public design tool with no admin auth flow, so
// direct client upserts were silently rejected by the admin-only
// RLS policy on bank_configs — that left Launchpad in production
// reading a stale module set. This function is the single write
// path for Go Live / Save Draft.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Body = {
  config: Record<string, unknown>;
  isPublished?: boolean;
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
    if (!body?.config || typeof body.config !== "object") {
      return new Response(JSON.stringify({ error: "config is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const stamp = new Date().toISOString();

    const enabledModules = Array.isArray(
      (body.config as { enabledModules?: unknown }).enabledModules,
    )
      ? ((body.config as { enabledModules: unknown[] }).enabledModules as unknown[])
      : [];

    const { error } = await supabase
      .from("bank_configs")
      .upsert({
        id: "global",
        config: body.config,
        is_published: body.isPublished ?? true,
        updated_at: stamp,
      });

    if (error) {
      console.error("bank-config-publish upsert failed", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, updatedAt: stamp, enabledModuleCount: enabledModules.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("bank-config-publish error", e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
