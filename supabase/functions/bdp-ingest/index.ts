import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(() => ({}));
    const snapshotDate = body.snapshot_date || new Date().toISOString().split("T")[0];
    const batchId = crypto.randomUUID();
    const startTime = Date.now();
    const results: Record<string, { status: string; duration_ms: number; error?: string }> = {};

    await supabase.from("bdp_ingestion_logs").insert({
      batch_id: batchId, source_system: "cbs", entity_type: "full_pipeline",
      triggered_by: "bdp-ingest", status: "running", started_at: new Date().toISOString(),
    });

    const steps = [
      { name: "customer_dimension", rpc: "bdp_sync_customer_dimension", args: {} },
      { name: "product_dimension", rpc: "bdp_sync_product_dimension", args: {} },
      { name: "loan_facts", rpc: "bdp_populate_loan_facts", args: { p_date: snapshotDate } },
      { name: "transaction_facts", rpc: "bdp_populate_transaction_facts", args: { p_date: snapshotDate } },
      { name: "snapshots", rpc: "bdp_compute_snapshots", args: { p_date: snapshotDate } },
    ];

    for (const s of steps) {
      const t = Date.now();
      try {
        const { error } = await supabase.rpc(s.rpc, s.args);
        if (error) throw error;
        results[s.name] = { status: "ok", duration_ms: Date.now() - t };
      } catch (e) {
        results[s.name] = { status: "error", duration_ms: Date.now() - t, error: (e as Error).message };
      }
    }

    const totalDuration = Date.now() - startTime;
    const failedSteps = Object.values(results).filter((r) => r.status === "error").length;
    await supabase.from("bdp_ingestion_logs").update({
      status: failedSteps > 0 ? "partial" : "completed",
      completed_at: new Date().toISOString(), duration_ms: totalDuration,
      records_processed: Object.keys(results).length, records_failed: failedSteps,
      errors: failedSteps > 0 ? Object.entries(results).filter(([, r]) => r.status === "error").map(([k, r]) => ({ step: k, error: r.error })) : [],
    }).eq("batch_id", batchId);

    return new Response(JSON.stringify({ success: failedSteps === 0, batch_id: batchId, snapshot_date: snapshotDate, duration_ms: totalDuration, steps: results }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
