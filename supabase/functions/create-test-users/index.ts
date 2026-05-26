import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { action } = await req.json().catch(() => ({ action: "users" }));

  if (action === "users") {
    const users = [
      { email: "abebe.kebede@test.com", phone: "+251911000001", meta: { first_name: "Abebe", father_name: "Kebede", role: "retail", region: "Addis Ababa" } },
      { email: "tigist.haile@test.com", phone: "+251911000002", meta: { first_name: "Tigist", father_name: "Haile", role: "retail", region: "Addis Ababa" } },
      { email: "agent.desta@test.com", phone: "+251922000001", meta: { first_name: "Desta", father_name: "Alemu", role: "agent", category: "super_agent", business: "Desta Mobile Money", location: "Addis Ababa, Merkato" } },
      { email: "merchant.abiy@test.com", phone: "+251933000001", meta: { first_name: "Abiy", father_name: "Lemma", role: "merchant", business: "Abiy Electronics" } },
    ];
    const results: any[] = [];
    for (const u of users) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({ email: u.email, password: "Test@12345", phone: u.phone, email_confirm: true, phone_confirm: true });
      if (error) { results.push({ email: u.email, error: error.message }); continue; }
      const uid = data.user!.id;
      await supabaseAdmin.from("profiles").update({
        first_name: u.meta.first_name, father_name: u.meta.father_name,
        msisdn: u.phone, region: u.meta.region || (u.meta.location as string | undefined)?.split(",")[0] || "",
        kyc_tier: "full", profile_completeness: 85, business_type: u.meta.business || null,
      }).eq("id", uid);
      results.push({ id: uid, email: u.email, status: "created" });
    }
    return new Response(JSON.stringify({ created: results.filter(r => r.status === "created").length, results }, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
});
