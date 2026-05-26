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
    const three = new Date(); three.setDate(three.getDate() + 3);
    const targetDate = three.toISOString().split("T")[0];

    const { data: schedules, error } = await supabase
      .from("loan_schedules")
      .select("id, loan_id, profile_id, installment_number, due_date, total_due, amount_paid, status")
      .eq("due_date", targetDate).in("status", ["pending", "partial"]);
    if (error) throw error;
    if (!schedules || schedules.length === 0) {
      return new Response(JSON.stringify({ message: "None", count: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const loanIds = [...new Set(schedules.map((s) => s.loan_id))];
    const { data: loans } = await supabase.from("loans").select("id, product_type").in("id", loanIds);
    const loanMap = Object.fromEntries((loans || []).map((l) => [l.id, l.product_type]));
    const notifications = [];
    for (const s of schedules) {
      const remaining = s.total_due - (s.amount_paid || 0);
      if (remaining <= 0) continue;
      const { data: existing } = await supabase.from("notifications").select("id")
        .eq("profile_id", s.profile_id).eq("type", "loan_reminder")
        .contains("metadata", { schedule_id: s.id }).limit(1);
      if (existing && existing.length > 0) continue;
      const productType = loanMap[s.loan_id] || "loan";
      notifications.push({
        profile_id: s.profile_id,
        title: "Loan Payment Due in 3 Days",
        message: `Your ${productType} loan installment #${s.installment_number} of ${remaining.toFixed(2)} ETB is due on ${s.due_date}.`,
        type: "loan_reminder",
        metadata: { loan_id: s.loan_id, schedule_id: s.id, installment_number: s.installment_number, amount_due: remaining, due_date: s.due_date },
      });
    }
    if (notifications.length > 0) {
      const { error: ie } = await supabase.from("notifications").insert(notifications);
      if (ie) throw ie;
    }
    return new Response(JSON.stringify({ message: `Sent ${notifications.length}`, count: notifications.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
