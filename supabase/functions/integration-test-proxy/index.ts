import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  try {
    const { method, url, headers, body, integration_id, source_type, source_reference } = await req.json();
    if (!url || typeof url !== "string") return new Response(JSON.stringify({ error: "URL required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!url.startsWith("https://") && !url.startsWith("http://localhost")) return new Response(JSON.stringify({ error: "HTTPS only" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (integration_id) {
      const { data: cb } = await supabase.from("integration_circuit_breaker").select("state, opened_at, cooldown_seconds").eq("integration_id", integration_id).single();
      if (cb?.state === "open") {
        const openedAt = new Date(cb.opened_at).getTime();
        const cooldownMs = (cb.cooldown_seconds || 60) * 1000;
        if (Date.now() - openedAt < cooldownMs) {
          return new Response(JSON.stringify({ status: 503, error: "Circuit OPEN", circuit_state: "open", retry_after_seconds: Math.ceil((cooldownMs - (Date.now() - openedAt)) / 1000), body: null }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        await supabase.from("integration_circuit_breaker").update({ state: "half_open", last_state_change_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("integration_id", integration_id);
      }
      const { data: rl } = await supabase.rpc("check_integration_rate_limit", { p_integration_id: integration_id });
      if (rl && !rl.allowed) {
        return new Response(JSON.stringify({ status: 429, error: `Rate limit exceeded`, retry_after_seconds: rl.retry_after_seconds, body: null }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const fetchOptions: RequestInit = { method: method || "GET", headers: { "Content-Type": "application/json", ...(headers || {}) } };
    if (body && !["GET", "HEAD"].includes((method || "GET").toUpperCase())) fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);

    const startTime = Date.now();
    const response = await fetch(url, fetchOptions);
    const latency = Date.now() - startTime;
    let responseBody;
    const ct = response.headers.get("content-type") || "";
    if (ct.includes("application/json")) responseBody = await response.json();
    else responseBody = await response.text();
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((v, k) => { responseHeaders[k] = v; });
    const isSuccess = response.status >= 200 && response.status < 300;

    if (integration_id) {
      if (isSuccess) await supabase.rpc("record_integration_success", { p_integration_id: integration_id });
      else if (response.status >= 500) {
        await supabase.rpc("record_integration_failure", { p_integration_id: integration_id, p_error: `HTTP ${response.status}` });
        if (source_type && source_reference) {
          await supabase.from("integration_retry_queue").insert({
            integration_id, endpoint: url, method: method || "GET", request_headers: headers || {}, request_body: body || null,
            response_status: response.status, response_body: typeof responseBody === "string" ? { raw: responseBody } : responseBody,
            error_message: `HTTP ${response.status}`, source_type, source_reference,
            max_retries: source_type === "gl_posting" ? 10 : 5,
          }).then(() => {}, () => {});
        }
      }
    }

    return new Response(JSON.stringify({ status: response.status, statusText: response.statusText, headers: responseHeaders, body: responseBody, latency_ms: latency, circuit_state: isSuccess ? "closed" : undefined }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ status: 0, error: error instanceof Error ? error.message : "Unknown error", body: null }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
