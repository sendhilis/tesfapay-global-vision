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
    const { action, ...params } = await req.json();
    switch (action) {
      case "screen_customer": {
        const { profile_id, full_name, transaction_id, screening_type = "transaction" } = params;
        const startTime = Date.now();
        const screeningLists = ["UN_CONSOLIDATED", "OFAC_SDN", "EU_SANCTIONS", "ETH_FIC_DOMESTIC"];
        const matchFound = false;
        const matchScore = 0;
        await supabase.from("aml_screening_log").insert({
          screening_type, profile_id, transaction_id: transaction_id || null,
          provider: "internal_mock", request_payload: { full_name, screening_type },
          response_payload: { match_found: matchFound, score: matchScore, lists_checked: screeningLists },
          match_found: matchFound, match_score: matchScore, screening_lists: screeningLists,
          latency_ms: Date.now() - startTime,
        });
        if (matchFound) {
          await supabase.from("aml_alerts").insert({
            alert_type: "sanctions_match", severity: "critical", profile_id, transaction_id,
            description: `Sanctions match for ${full_name}`, screening_result: { score: matchScore, lists: screeningLists },
          });
        }
        return new Response(JSON.stringify({ screened: true, match_found: matchFound, score: matchScore, lists_checked: screeningLists, latency_ms: Date.now() - startTime }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "dashboard_stats": {
        const { data: alerts } = await supabase.from("aml_alerts").select("status, severity, alert_type").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString());
        const pending = (alerts || []).filter(a => a.status === "pending").length;
        const underReview = (alerts || []).filter(a => a.status === "under_review").length;
        const critical = (alerts || []).filter(a => a.severity === "critical" && a.status !== "dismissed" && a.status !== "str_filed").length;
        const strFiled = (alerts || []).filter(a => a.status === "str_filed").length;
        const { data: ctrs } = await supabase.from("aml_ctr_reports").select("status").eq("status", "draft");
        const { data: screenings } = await supabase.from("aml_screening_log").select("id").gte("created_at", new Date(Date.now() - 86400000).toISOString());
        return new Response(JSON.stringify({
          alerts_pending: pending, alerts_under_review: underReview, alerts_critical: critical,
          str_filed_30d: strFiled, ctr_pending: (ctrs || []).length, screenings_24h: (screenings || []).length,
          total_alerts_30d: (alerts || []).length,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
