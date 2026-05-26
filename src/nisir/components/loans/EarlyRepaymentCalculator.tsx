import { useMemo } from 'react';
import { ArrowLeft, Calculator, TrendingDown, AlertTriangle, Sparkles } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Loan = Tables<'loans'>;
const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

interface Props {
  loan: Loan;
  schedule: any[];
  onBack: () => void;
}

const EarlyRepaymentCalculator = ({ loan, schedule, onBack }: Props) => {
  const calc = useMemo(() => {
    const outstanding = loan.outstanding_balance || 0;
    const pendingSchedules = schedule.filter(s => s.status !== 'paid');
    const remainingInterest = pendingSchedules.reduce((sum, s) => sum + s.interest, 0);
    const remainingPrincipal = pendingSchedules.reduce((sum, s) => sum + s.principal, 0);
    const earlyRepaymentFeePct = 2.0; // from config
    const earlyRepaymentFee = remainingPrincipal * (earlyRepaymentFeePct / 100);
    const totalEarlyPayoff = remainingPrincipal + earlyRepaymentFee;
    const interestSaved = remainingInterest - earlyRepaymentFee;

    return {
      outstanding,
      remainingPrincipal,
      remainingInterest,
      earlyRepaymentFeePct,
      earlyRepaymentFee,
      totalEarlyPayoff,
      interestSaved,
      remainingInstallments: pendingSchedules.length,
    };
  }, [loan, schedule]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div>
          <p className="text-sm font-bold text-foreground">Early Repayment</p>
          <p className="text-[10px] text-muted-foreground">Settlement calculator</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-4 border border-primary/20 space-y-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <p className="text-xs font-bold text-foreground">Settlement Breakdown</p>
        </div>
        {[
          ['Remaining Principal', fmt(calc.remainingPrincipal)],
          ['Remaining Interest (scheduled)', fmt(calc.remainingInterest)],
          [`Early Repayment Fee (${calc.earlyRepaymentFeePct}%)`, fmt(calc.earlyRepaymentFee)],
        ].map(([l, v]) => (
          <div key={l} className="flex justify-between text-xs">
            <span className="text-muted-foreground">{l}</span>
            <span className="font-semibold text-foreground">{v} ETB</span>
          </div>
        ))}
        <div className="border-t border-primary/20 pt-2 flex justify-between text-sm">
          <span className="font-bold text-foreground">Total Early Payoff</span>
          <span className="font-extrabold text-primary">{fmt(calc.totalEarlyPayoff)} ETB</span>
        </div>
      </div>

      {calc.interestSaved > 0 ? (
        <div className="bg-success/10 rounded-xl p-3 border border-success/20 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-success mt-0.5" />
          <div>
            <p className="text-xs font-bold text-success">You save {fmt(calc.interestSaved)} ETB!</p>
            <p className="text-[10px] text-muted-foreground">
              By paying off early, you skip {calc.remainingInstallments} remaining installments and save on future interest.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-700">Early repayment fee exceeds interest savings</p>
            <p className="text-[10px] text-muted-foreground">
              Consider continuing with regular payments for better value.
            </p>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border p-3 space-y-2">
        <p className="text-xs font-bold text-foreground">Comparison</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
            <p className="text-[9px] text-muted-foreground">If you continue</p>
            <p className="text-sm font-extrabold text-foreground">{fmt(calc.outstanding)}</p>
            <p className="text-[9px] text-muted-foreground">over {calc.remainingInstallments} months</p>
          </div>
          <div className="bg-primary/5 rounded-lg p-2.5 text-center border border-primary/10">
            <p className="text-[9px] text-muted-foreground">Pay off today</p>
            <p className="text-sm font-extrabold text-primary">{fmt(calc.totalEarlyPayoff)}</p>
            <p className="text-[9px] text-muted-foreground">one-time payment</p>
          </div>
        </div>
      </div>

      <div className="bg-muted/30 rounded-xl p-3">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <strong>Note:</strong> Early repayment is subject to a {calc.earlyRepaymentFeePct}% fee on outstanding principal. 
          The fee compensates for lost interest income. Contact support if you believe you qualify for a fee waiver.
        </p>
      </div>
    </div>
  );
};

export default EarlyRepaymentCalculator;
