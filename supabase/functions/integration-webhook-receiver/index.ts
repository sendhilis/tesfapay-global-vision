import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret, x-webhook-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);
  const slug = url.pathname.split("/").pop() || "";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  try {
    const integrationSlug = slug || url.searchParams.get("integration") || "";
    if (!integrationSlug) return new Response(JSON.stringify({ error: "Missing integration" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: integration } = await supabase.from("integrations").select("id, name, slug, webhook_secret, is_enabled").eq("slug", integrationSlug).eq("is_enabled", true).single();
    if (!integration) return new Response(JSON.stringify({ error: "Integration not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const providedSecret = req.headers.get("x-webhook-secret") || req.headers.get("x-webhook-signature") || "";
    if (integration.webhook_secret && providedSecret !== integration.webhook_secret) {
      await supabase.from("integration_audit_logs").insert({ integration_id: integration.id, action: "webhook_signature_failed", field_changed: "webhook_verification", new_value: "signature_mismatch" });
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    let payload: Record<string, unknown> = {};
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) payload = await req.json();
    else payload = { raw: await req.text() };
    const eventType = (payload.event as string) || (payload.type as string) || (payload.event_type as string) || "unknown";
    await supabase.from("integration_audit_logs").insert({ integration_id: integration.id, action: "webhook_received", field_changed: eventType, new_value: JSON.stringify(payload).slice(0, 1000) });
    await supabase.rpc("record_integration_success", { p_integration_id: integration.id });
    return new Response(JSON.stringify({ received: true, integration: integration.slug, event: eventType }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ received: false, error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
