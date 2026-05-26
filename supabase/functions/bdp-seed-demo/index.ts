/** DEV-ONLY demo seeder for BDP */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const batchId = crypto.randomUUID();
    const startTime = Date.now();

    await supabase.from('bdp_ingestion_logs').insert({
      batch_id: batchId, source_system: 'cbs_los_sync', entity_type: 'demo_seed',
      status: 'running', triggered_by: 'demo',
    });

    // Trigger production pipeline against existing data
    await supabase.rpc('bdp_sync_customer_dimension');
    await supabase.rpc('bdp_sync_product_dimension');
    const today = new Date().toISOString().split('T')[0];
    await supabase.rpc('bdp_populate_loan_facts', { p_date: today });
    await supabase.rpc('bdp_populate_transaction_facts', { p_date: today });
    await supabase.rpc('bdp_compute_snapshots', { p_date: today });

    await supabase.from('bdp_ingestion_logs').update({
      status: 'completed', completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    }).eq('batch_id', batchId);

    return new Response(JSON.stringify({ success: true, batch_id: batchId, duration_ms: Date.now() - startTime }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
