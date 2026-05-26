import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, Shield, CreditCard, Banknote, ArrowRight, Sparkles, PartyPopper } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts } from '@/hooks/useAccounts';
import { toast } from 'sonner';

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

interface DisbursementStep {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  duration: number;
}

interface DisbursementSimulationProps {
  amount: number;
  accountName?: string;
  onComplete?: () => void;
}

const disbursementSteps: DisbursementStep[] = [
  { icon: <Shield className="h-5 w-5" />, title: 'Identity Verified', subtitle: 'KYC & credit check passed', duration: 1200 },
  { icon: <CheckCircle2 className="h-5 w-5" />, title: 'Loan Approved', subtitle: 'Pre-approval criteria met', duration: 1500 },
  { icon: <CreditCard className="h-5 w-5" />, title: 'Agreement Signed', subtitle: 'Digital loan agreement executed', duration: 1000 },
  { icon: <Banknote className="h-5 w-5" />, title: 'Funds Processing', subtitle: 'Initiating disbursement...', duration: 2000 },
  { icon: <PartyPopper className="h-5 w-5" />, title: 'Funds Credited!', subtitle: 'Amount deposited to your account', duration: 500 },
];

const DisbursementSimulation = ({ amount, accountName = 'Nisir Savings', onComplete }: DisbursementSimulationProps) => {
  const { user } = useAuth();
  const { accounts, refetch: refetchAccounts } = useAccounts();
  const [currentStep, setCurrentStep] = useState(-1);
  const [isComplete, setIsComplete] = useState(false);
  const disbursedRef = useRef(false);

  const disburse = async () => {
    if (disbursedRef.current || !user) return;
    disbursedRef.current = true;

    const primaryAcc = accounts.find(a => a.is_primary) || accounts[0];
    if (!primaryAcc) return;

    try {
      // Credit the savings account
      const { error: accErr } = await supabase
        .from('accounts')
        .update({
          balance: (primaryAcc.balance || 0) + amount,
          available_balance: (primaryAcc.available_balance || 0) + amount,
        })
        .eq('id', primaryAcc.id);

      if (accErr) throw accErr;

      // Record the deposit transaction
      const { error: txErr } = await supabase.from('transactions').insert({
        account_id: primaryAcc.id,
        profile_id: user.id,
        transaction_type: 'deposit',
        amount,
        fee: 0,
        direction: 'credit',
        status: 'completed',
        description: 'Loan disbursement credited to savings',
        channel: 'system',
      });

      if (txErr) throw txErr;

      // Update loan status to disbursed
      const { data: loans } = await supabase
        .from('loans')
        .select('id')
        .eq('profile_id', user.id)
        .in('status', ['submitted', 'approved'])
        .order('created_at', { ascending: false })
        .limit(1);

      // Generate amortization schedule via edge function
      if (loans && loans.length > 0) {
        const loanId = loans[0].id;
        await supabase.from('loans').update({
          status: 'active',
          disbursed_at: new Date().toISOString(),
        }).eq('id', loanId);

        // Log disbursement event
        await supabase.from('loan_events').insert({
          loan_id: loanId,
          profile_id: user.id,
          event_type: 'DISBURSEMENT',
          amount,
          description: `Loan disbursed: ${amount} ETB to savings account`,
        });

        // Generate schedule via edge function
        try {
          await supabase.functions.invoke('loan-engine', {
            body: { loan_id: loanId, action: 'generate_schedule' },
          });
        } catch (e) {
          console.warn('Schedule generation deferred:', e);
        }
      }

      refetchAccounts();
    } catch (err: any) {
      toast.error('Disbursement failed: ' + err.message);
    }
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const runSteps = (stepIndex: number) => {
      if (stepIndex >= disbursementSteps.length) {
        setIsComplete(true);
        disburse().then(() => onComplete?.());
        return;
      }
      setCurrentStep(stepIndex);
      timeout = setTimeout(() => runSteps(stepIndex + 1), disbursementSteps[stepIndex].duration);
    };
    timeout = setTimeout(() => runSteps(0), 600);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-2">
        <p className="text-sm font-bold text-foreground">Loan Disbursement</p>
        <p className="text-xs text-muted-foreground">Processing your {fmt(amount)} ETB loan</p>
      </motion.div>

      <div className="space-y-1">
        {disbursementSteps.map((step, i) => {
          const isActive = i === currentStep;
          const isDone = i < currentStep || isComplete;
          const isPending = i > currentStep && !isComplete;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isPending && currentStep >= 0 ? 0.4 : 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                isActive ? 'bg-primary/10 border border-primary/30' :
                isDone ? 'bg-success/5 border border-success/20' :
                'bg-muted/30 border border-transparent'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isDone ? 'bg-success/20 text-success' :
                isActive ? 'bg-primary/20 text-primary' :
                'bg-muted text-muted-foreground'
              }`}>
                {isDone ? <CheckCircle2 className="h-5 w-5" /> :
                 isActive ? <Loader2 className="h-5 w-5 animate-spin" /> :
                 step.icon}
              </div>
              <div className="flex-1">
                <p className={`text-xs font-bold ${isDone ? 'text-success' : isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {step.title}
                </p>
                <p className="text-[10px] text-muted-foreground">{step.subtitle}</p>
              </div>
              {isDone && <CheckCircle2 className="h-4 w-4 text-success" />}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', bounce: 0.4 }}
            className="bg-gradient-to-br from-success/10 to-primary/10 rounded-2xl p-5 border border-success/30 text-center space-y-3"
          >
            <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ delay: 0.3, duration: 0.5 }}>
              <Sparkles className="h-10 w-10 text-success mx-auto" />
            </motion.div>
            <div>
              <p className="text-lg font-extrabold text-foreground">Congratulations! 🎉</p>
              <p className="text-sm text-muted-foreground mt-1">Your loan has been disbursed</p>
            </div>
            <div className="bg-card/60 rounded-xl p-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Amount Credited</span>
                <span className="font-extrabold text-success">{fmt(amount)} ETB</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">To Account</span>
                <span className="font-semibold text-foreground">{accountName}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ArrowRight className="h-3.5 w-3.5" />
              <span>Funds available immediately</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DisbursementSimulation;
