import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts } from '@/hooks/useAccounts';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Loan = Tables<'loans'>;
const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

interface Props {
  loan: Loan;
  schedule: any[];
  onBack: () => void;
  onComplete: () => void;
}

const LoanRepaymentFlow = ({ loan, schedule, onBack, onComplete }: Props) => {
  const { user } = useAuth();
  const { accounts, refetch: refetchAccounts } = useAccounts();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [selectedInstallments, setSelectedInstallments] = useState<string[]>([]);

  const pendingInstallments = schedule.filter(s => s.status === 'pending' || s.status === 'overdue' || s.status === 'partial');
  const totalSelected = pendingInstallments
    .filter(s => selectedInstallments.includes(s.id))
    .reduce((sum, s) => sum + s.total_due - (s.amount_paid || 0), 0);

  const primaryAcc = accounts.find(a => a.is_primary) || accounts[0];
  const hasBalance = primaryAcc && (primaryAcc.available_balance || 0) >= totalSelected;

  const toggleInstallment = (id: string) => {
    setSelectedInstallments(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Auto-select first overdue/pending
  if (selectedInstallments.length === 0 && pendingInstallments.length > 0) {
    const first = pendingInstallments[0];
    if (first) setSelectedInstallments([first.id]);
  }

  const handlePay = async () => {
    if (!user || !primaryAcc || selectedInstallments.length === 0) return;
    setSubmitting(true);

    try {
      // Debit savings
      const { error: accErr } = await supabase.from('accounts').update({
        balance: (primaryAcc.balance || 0) - totalSelected,
        available_balance: (primaryAcc.available_balance || 0) - totalSelected,
      }).eq('id', primaryAcc.id);
      if (accErr) throw accErr;

      // Record transaction
      await supabase.from('transactions').insert({
        account_id: primaryAcc.id,
        profile_id: user.id,
        transaction_type: 'loan_repayment',
        amount: totalSelected,
        fee: 0,
        direction: 'debit',
        status: 'completed',
        description: `Loan repayment - ${loan.product_type} loan`,
        channel: 'mobile',
      });

      // Update each schedule entry
      for (const id of selectedInstallments) {
        const inst = pendingInstallments.find(s => s.id === id);
        if (!inst) continue;
        const remaining = inst.total_due - (inst.amount_paid || 0);
        await supabase.from('loan_schedules').update({
          amount_paid: inst.total_due,
          status: 'paid',
          paid_at: new Date().toISOString(),
        }).eq('id', id);
      }

      // Update loan outstanding balance
      const newOutstanding = (loan.outstanding_balance || 0) - totalSelected;
      await supabase.from('loans').update({
        outstanding_balance: Math.max(0, newOutstanding),
        status: newOutstanding <= 0 ? 'closed' : loan.status,
      }).eq('id', loan.id);

      // Log event
      await supabase.from('loan_events').insert({
        loan_id: loan.id,
        profile_id: user.id,
        event_type: 'REPAYMENT',
        amount: totalSelected,
        description: `Repayment of ${selectedInstallments.length} installment(s)`,
        metadata: { installment_ids: selectedInstallments },
      });

      refetchAccounts();
      setDone(true);
      toast.success('Repayment successful!');
    } catch (err: any) {
      toast.error(err.message);
    }

    setSubmitting(false);
  };

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-8">
        <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
        <div>
          <p className="text-lg font-extrabold text-foreground">Payment Successful!</p>
          <p className="text-sm text-muted-foreground mt-1">{fmt(totalSelected)} ETB debited from savings</p>
        </div>
        <button onClick={onComplete} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
          Back to Loan Details
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <p className="text-sm font-bold text-foreground">Make Repayment</p>
      </div>

      {/* Account info */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-3 border border-primary/20">
        <p className="text-[10px] text-muted-foreground">Paying from</p>
        <p className="text-sm font-bold text-foreground">{primaryAcc?.product_name || 'Savings Account'}</p>
        <p className="text-xs text-muted-foreground">Available: {fmt(primaryAcc?.available_balance || 0)} ETB</p>
      </div>

      {/* Select installments */}
      <p className="text-xs font-bold text-foreground">Select installments to pay</p>
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {pendingInstallments.map(s => {
          const remaining = s.total_due - (s.amount_paid || 0);
          const selected = selectedInstallments.includes(s.id);
          return (
            <button key={s.id} onClick={() => toggleInstallment(s.id)}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${
                selected ? 'bg-primary/10 border-primary/30' :
                s.status === 'overdue' ? 'bg-destructive/5 border-destructive/20' : 'bg-card border-border'
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center ${
                    selected ? 'bg-primary border-primary' : 'border-border'
                  }`}>
                    {selected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      #{s.installment_number}
                      {s.status === 'overdue' && <span className="text-destructive ml-1">(Overdue)</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Due: {new Date(s.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                  </div>
                </div>
                <p className="text-xs font-bold text-foreground">{fmt(remaining)} ETB</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary */}
      {selectedInstallments.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Installments</span>
            <span className="font-semibold text-foreground">{selectedInstallments.length}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Total Amount</span>
            <span className="font-extrabold text-foreground">{fmt(totalSelected)} ETB</span>
          </div>
        </div>
      )}

      {!hasBalance && totalSelected > 0 && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <p className="text-[10px] text-destructive font-medium">Insufficient balance</p>
        </div>
      )}

      <button onClick={handlePay} disabled={submitting || !hasBalance || selectedInstallments.length === 0}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CreditCard className="h-4 w-4" /> Pay {fmt(totalSelected)} ETB</>}
      </button>
    </div>
  );
};

export default LoanRepaymentFlow;
