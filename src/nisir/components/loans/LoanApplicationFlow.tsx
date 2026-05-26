import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Loader2, FileText, User, Target, Shield, ChevronRight } from 'lucide-react';
import { type LoanProduct } from './LoanProductCards';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@nisir/hooks/useAuth';
import { useAccounts } from '@nisir/hooks/useAccounts';

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

interface LoanApplicationFlowProps {
  product: LoanProduct;
  amount: number;
  tenor: number;
  creditScore: number;
  onBack: () => void;
  onComplete: () => void;
}

const steps = [
  { icon: FileText, label: 'Loan Details' },
  { icon: User, label: 'Personal Info' },
  { icon: Target, label: 'Purpose' },
  { icon: Shield, label: 'Review & Submit' },
];

const LoanApplicationFlow = ({ product, amount, tenor, creditScore, onBack, onComplete }: LoanApplicationFlowProps) => {
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [collateral, setCollateral] = useState('');
  const [agreed, setAgreed] = useState(false);

  const mr = product.rate / 100 / 12;
  const mi = mr === 0 ? amount / tenor : (amount * mr * Math.pow(1 + mr, tenor)) / (Math.pow(1 + mr, tenor) - 1);
  const tp = mi * tenor;

  const handleSubmit = async () => {
    if (!user || !agreed) return;
    setSubmitting(true);
    const primaryAcc = accounts.find((a) => a.is_primary) || accounts[0];
    const { error } = await supabase.from('loans').insert({
      profile_id: user.id,
      product_type: product.type as any,
      amount,
      interest_rate: product.rate,
      tenor_months: tenor,
      monthly_installment: parseFloat(mi.toFixed(2)),
      total_payable: parseFloat(tp.toFixed(2)),
      outstanding_balance: parseFloat(tp.toFixed(2)),
      purpose,
      guarantor_name: guarantorName || null,
      guarantor_msisdn: guarantorPhone || null,
      collateral_description: collateral || null,
      status: 'submitted',
      disbursement_account_id: primaryAcc?.id,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }

    // Log origination event
    const { data: newLoan } = await supabase.from('loans').select('id').eq('profile_id', user.id).order('created_at', { ascending: false }).limit(1).single();
    if (newLoan) {
      await supabase.from('loan_events').insert({
        loan_id: newLoan.id,
        profile_id: user.id,
        event_type: 'ORIGINATION',
        amount,
        description: `${product.name} loan application submitted`,
        metadata: { product_type: product.type, tenor: tenor, rate: product.rate, purpose },
      });
    }

    toast.success('Loan application submitted successfully!');
    onComplete();
  };

  const canNext = () => {
    if (step === 2 && !purpose) return false;
    if (step === 3 && !agreed) return false;
    return true;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={step === 0 ? onBack : () => setStep(step - 1)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Apply: {product.name}</p>
          <p className="text-[10px] text-muted-foreground">Step {step + 1} of {steps.length}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5">
        {steps.map((s, i) => (
          <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
          {/* Step 0: Loan Details */}
          {step === 0 && (
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-4 border border-primary/20">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-[10px] text-muted-foreground">Amount</p><p className="text-sm font-extrabold text-foreground">{fmt(amount)} ETB</p></div>
                  <div><p className="text-[10px] text-muted-foreground">Interest Rate</p><p className="text-sm font-extrabold text-foreground">{product.rate}% p.a.</p></div>
                  <div><p className="text-[10px] text-muted-foreground">Monthly Payment</p><p className="text-sm font-extrabold text-primary">{fmt(mi)} ETB</p></div>
                  <div><p className="text-[10px] text-muted-foreground">Total Payable</p><p className="text-sm font-extrabold text-foreground">{fmt(tp)} ETB</p></div>
                  <div><p className="text-[10px] text-muted-foreground">Tenor</p><p className="text-sm font-extrabold text-foreground">{tenor} months</p></div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Credit Score</p>
                    <p className="text-sm font-extrabold" style={{ color: creditScore >= 750 ? 'hsl(var(--success))' : 'hsl(var(--warning))' }}>{creditScore}/900</p>
                  </div>
                </div>
              </div>
              {creditScore >= 700 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-success/10 rounded-xl p-3 border border-success/20 flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  <p className="text-xs text-success font-medium">Pre-approved! Your credit score qualifies for instant disbursement.</p>
                </motion.div>
              )}
            </div>
          )}

          {/* Step 1: Personal */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-foreground">Guarantor Details <span className="font-normal text-muted-foreground">(Optional)</span></p>
              <input value={guarantorName} onChange={(e) => setGuarantorName(e.target.value)}
                className="w-full py-3 px-3 rounded-xl border border-border bg-card text-foreground text-sm" placeholder="Guarantor full name" />
              <input value={guarantorPhone} onChange={(e) => setGuarantorPhone(e.target.value)}
                className="w-full py-3 px-3 rounded-xl border border-border bg-card text-foreground text-sm" placeholder="Guarantor phone (09...)" />
              <p className="text-xs font-bold text-foreground mt-4">Collateral <span className="font-normal text-muted-foreground">(if applicable)</span></p>
              <textarea value={collateral} onChange={(e) => setCollateral(e.target.value)}
                className="w-full py-3 px-3 rounded-xl border border-border bg-card text-foreground text-sm resize-none" rows={2}
                placeholder="e.g., Vehicle registration, property deed..." />
            </div>
          )}

          {/* Step 2: Purpose */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-foreground">Loan Purpose *</p>
              <div className="grid grid-cols-2 gap-2">
                {['Business Expansion', 'Working Capital', 'Agricultural Inputs', 'Equipment Purchase', 'Education', 'Home Improvement', 'Vehicle Purchase', 'Other'].map((p) => (
                  <button key={p} onClick={() => setPurpose(p)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                      purpose === p ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-foreground'
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
              {purpose === 'Other' && (
                <textarea value={purpose === 'Other' ? '' : purpose} onChange={(e) => setPurpose(e.target.value || 'Other')}
                  className="w-full py-3 px-3 rounded-xl border border-border bg-card text-foreground text-sm resize-none" rows={2}
                  placeholder="Describe purpose..." />
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="bg-card rounded-xl border border-border p-3 space-y-2">
                {[
                  ['Product', product.name],
                  ['Amount', `${fmt(amount)} ETB`],
                  ['Monthly', `${fmt(mi)} ETB`],
                  ['Tenor', `${tenor} months`],
                  ['Total', `${fmt(tp)} ETB`],
                  ['Purpose', purpose],
                  ['Disbursement', 'Nisir Savings Account'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={() => setAgreed(!agreed)} className="mt-1 accent-primary" />
                <span className="text-[11px] text-muted-foreground">I agree to the terms & conditions, authorize credit checks, and confirm all information is accurate.</span>
              </label>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-3">
        {step < 3 ? (
          <button onClick={() => setStep(step + 1)} disabled={!canNext()}
            className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-1">
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting || !agreed}
            className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Submit Application'}
          </button>
        )}
      </div>
    </div>
  );
};

export default LoanApplicationFlow;
