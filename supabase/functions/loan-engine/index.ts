const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { loan_id, action } = await req.json();
    if (!loan_id || !action) return new Response(JSON.stringify({ error: 'loan_id and action required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: loan, error: loanErr } = await supabase.from('loans').select('*').eq('id', loan_id).single();
    if (loanErr || !loan) return new Response(JSON.stringify({ error: 'Loan not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { data: config } = await supabase.from('loan_configurations').select('*').eq('product_type', loan.product_type).single();
    const calcMethod = config?.interest_calc_method || 'reducing_balance';
    let result: any = {};

    if (action === 'generate_schedule') {
      const { amount, interest_rate, tenor_months, profile_id } = loan;
      const annualRate = interest_rate / 100;
      const monthlyRate = annualRate / 12;
      const schedule: any[] = [];
      let balance = amount;
      const disbDate = loan.disbursed_at ? new Date(loan.disbursed_at) : new Date();
      const monthlyInstallment = monthlyRate === 0 ? amount / tenor_months : (amount * monthlyRate * Math.pow(1 + monthlyRate, tenor_months)) / (Math.pow(1 + monthlyRate, tenor_months) - 1);
      for (let i = 1; i <= tenor_months; i++) {
        const dueDate = new Date(disbDate); dueDate.setMonth(dueDate.getMonth() + i);
        const interest = balance * monthlyRate;
        let principal = monthlyInstallment - interest;
        principal = Math.min(principal, balance);
        const closingBalance = Math.max(0, balance - principal);
        schedule.push({
          loan_id: loan.id, profile_id, installment_number: i,
          due_date: dueDate.toISOString().split('T')[0],
          opening_balance: +balance.toFixed(2), principal: +principal.toFixed(2),
          interest: +interest.toFixed(2), total_due: +(principal + interest).toFixed(2),
          closing_balance: +closingBalance.toFixed(2), status: 'pending',
        });
        balance = closingBalance;
      }
      await supabase.from('loan_schedules').delete().eq('loan_id', loan.id);
      const { error } = await supabase.from('loan_schedules').insert(schedule);
      if (error) throw error;
      await supabase.from('loan_events').insert({ loan_id: loan.id, profile_id, event_type: 'SCHEDULE_GENERATED', description: `${tenor_months}-month ${calcMethod} schedule generated` });
      result = { schedule_count: schedule.length, method: calcMethod, monthly_installment: +monthlyInstallment.toFixed(2) };
    } else {
      return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ success: true, ...result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
