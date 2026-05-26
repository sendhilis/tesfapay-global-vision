import { useState, useEffect } from 'react';
import { useAuth } from '@nisir/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@nisir/components/MobilePortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Home, CreditCard, Users, BarChart3, FileText,
  HandCoins, Check, Loader2, Shield, Phone, Search
} from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import CustomerPicker from '@nisir/components/agency/CustomerPicker';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/agency' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/agency/payments' },
  { icon: <Users className="h-5 w-5" />, labelKey: 'admin.customers', path: '/agency/customers' },
  { icon: <BarChart3 className="h-5 w-5" />, labelKey: 'agency.reports', path: '/agency/reports' },
  { icon: <FileText className="h-5 w-5" />, labelKey: 'common.profile', path: '/agency/profile' },
];

type Step = 'find' | 'select-loan' | 'amount' | 'confirm' | 'otp' | 'success';

interface LoanInfo {
  id: string;
  product_type: string;
  amount: number;
  outstanding_balance: number | null;
  monthly_installment: number | null;
  next_due_date: string | null;
  status: string | null;
}

const AgencyLoanRepay = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('find');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerProfileId, setCustomerProfileId] = useState('');
  const [loans, setLoans] = useState<LoanInfo[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanInfo | null>(null);
  const [amount, setAmount] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [txnRef, setTxnRef] = useState('');
  const [agentId, setAgentId] = useState('');

  useEffect(() => {
    if (user) {
      supabase.from('agents').select('id').eq('profile_id', user.id).single()
        .then(({ data }) => { if (data) setAgentId(data.id); });
    }
  }, [user]);

  const handleFindCustomer = async () => {
    if (!customerPhone || customerPhone.length < 9) { toast.error('Enter valid phone'); return; }
    setLoading(true);
    const phone = customerPhone.startsWith('+') ? customerPhone : `+251${customerPhone.replace(/^0/, '')}`;
    const { data: profile } = await supabase.from('profiles').select('id, first_name, father_name')
      .eq('msisdn', phone).single();
    if (!profile) { toast.error('Customer not found'); setLoading(false); return; }

    setCustomerName(`${profile.first_name} ${profile.father_name}`);
    setCustomerProfileId(profile.id);

    const { data: customerLoans } = await supabase.from('loans').select('*')
      .eq('profile_id', profile.id)
      .in('status', ['active', 'disbursed']);

    if (!customerLoans || customerLoans.length === 0) {
      toast.error('No active loans found for this customer');
      setLoading(false);
      return;
    }

    setLoans(customerLoans);
    setStep('select-loan');
    setLoading(false);
  };

  const handleSelectLoan = (loan: LoanInfo) => {
    setSelectedLoan(loan);
    setAmount(String(loan.monthly_installment || ''));
    setStep('amount');
  };

  const handleComplete = async () => {
    if (otp.length < 6) { toast.error('Enter OTP'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    const amt = parseFloat(amount);
    const ref = 'ALRP-' + Math.random().toString(36).substring(2, 12).toUpperCase();

    // Update loan outstanding balance
    if (selectedLoan) {
      const newBalance = Math.max(0, (selectedLoan.outstanding_balance || 0) - amt);
      await supabase.from('loans').update({
        outstanding_balance: newBalance,
        status: newBalance <= 0 ? 'closed' : 'active',
      }).eq('id', selectedLoan.id);

      // Record loan event
      await supabase.from('loan_events').insert({
        loan_id: selectedLoan.id,
        profile_id: customerProfileId,
        event_type: 'repayment',
        amount: amt,
        description: `Agent cash repayment - ${ref}`,
      });
    }

    // Record agent transaction
    if (agentId) {
      await supabase.from('agent_transactions').insert({
        agent_id: agentId,
        customer_profile_id: customerProfileId,
        transaction_type: 'loan_repayment',
        amount: amt,
        fee: 0,
        reference: ref,
        customer_msisdn: customerPhone.startsWith('+') ? customerPhone : `+251${customerPhone.replace(/^0/, '')}`,
        customer_name: customerName,
        notes: `Loan repayment for ${selectedLoan?.product_type}`,
      });

      // Deduct agent float
      const { data: agent } = await supabase.from('agents').select('float_balance').eq('id', agentId).single();
      if (agent) {
        await supabase.from('agents').update({ float_balance: agent.float_balance - amt }).eq('id', agentId);
      }
    }

    setTxnRef(ref);
    setStep('success');
    toast.success('Loan repayment successful!');
    setLoading(false);
  };

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

  return (
    <MobilePortalLayout portalName="Nisir Agent" portalColor="agency" navItems={navItems} showBack backPath="/agency/payments">
      <div className="px-4 pt-4 pb-6">
        <AnimatePresence mode="wait">
          {step === 'find' && (
            <motion.div key="find" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-info/10 flex items-center justify-center">
                  <HandCoins className="h-5 w-5 text-info" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Loan Repayment</h2>
                  <p className="text-xs text-muted-foreground">Accept loan payment from customer</p>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <CustomerPicker
                  phoneValue={customerPhone}
                  onPhoneChange={setCustomerPhone}
                  label="Customer Phone"
                  onSelect={async (c) => {
                    setCustomerName(`${c.first_name} ${c.father_name}`);
                    setCustomerProfileId(c.id);
                    const phone = c.msisdn || '';
                    setCustomerPhone(phone.replace('+251', ''));
                    // Auto-fetch loans
                    const { data: loansData } = await supabase.from('loans').select('*')
                      .eq('profile_id', c.id).in('status', ['active', 'disbursed'] as any);
                    if (loansData && loansData.length > 0) {
                      setLoans(loansData);
                      setStep('select-loan');
                    } else {
                      toast.error('No active loans found');
                    }
                  }}
                />
              </div>
              <Button onClick={handleFindCustomer} disabled={loading} className="w-full bg-info hover:bg-info/90 text-primary-foreground">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-2" />Find Customer</>}
              </Button>
            </motion.div>
          )}

          {step === 'select-loan' && (
            <motion.div key="loans" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="text-lg font-bold text-foreground">Active Loans - {customerName}</h2>
              <div className="space-y-2">
                {loans.map(loan => (
                  <motion.button
                    key={loan.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectLoan(loan)}
                    className="w-full p-4 bg-card rounded-xl border border-border text-left"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-foreground capitalize">{loan.product_type} Loan</p>
                        <p className="text-[10px] text-muted-foreground">Original: {fmt(loan.amount)} ETB</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-destructive">{fmt(loan.outstanding_balance || 0)}</p>
                        <p className="text-[10px] text-muted-foreground">Outstanding</p>
                      </div>
                    </div>
                    {loan.next_due_date && (
                      <p className="text-[10px] text-muted-foreground mt-1">Next due: {loan.next_due_date} · Installment: {fmt(loan.monthly_installment || 0)}</p>
                    )}
                  </motion.button>
                ))}
              </div>
              <Button variant="outline" onClick={() => setStep('find')} className="w-full">Back</Button>
            </motion.div>
          )}

          {step === 'amount' && (
            <motion.div key="amount" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="text-lg font-bold text-foreground">Repayment Amount</h2>
              <p className="text-xs text-muted-foreground">Outstanding: {fmt(selectedLoan?.outstanding_balance || 0)} ETB</p>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="relative">
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="text-2xl font-bold h-14 pr-12" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ETB</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('select-loan')} className="flex-1">Back</Button>
                <Button onClick={() => { if (parseFloat(amount) > 0) setStep('confirm'); else toast.error('Enter amount'); }} className="flex-1 bg-info hover:bg-info/90 text-primary-foreground">Continue</Button>
              </div>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="text-lg font-bold text-foreground">Confirm Repayment</h2>
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Customer</span><span className="font-semibold">{customerName}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Loan</span><span className="font-semibold capitalize">{selectedLoan?.product_type}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount</span><span className="font-bold text-success">{fmt(parseFloat(amount))} ETB</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">New Balance</span><span className="font-bold">{fmt(Math.max(0, (selectedLoan?.outstanding_balance || 0) - parseFloat(amount)))} ETB</span></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('amount')} className="flex-1">Back</Button>
                <Button onClick={() => setStep('otp')} className="flex-1 bg-info hover:bg-info/90 text-primary-foreground">Proceed</Button>
              </div>
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="text-center">
                <Shield className="h-8 w-8 text-info mx-auto mb-2" />
                <h2 className="text-lg font-bold text-foreground">OTP Verification</h2>
              </div>
              <div className="bg-card rounded-xl border border-border p-6 text-center">
                <div className="flex justify-center">
                  <InputOTP value={otp} onChange={setOtp} maxLength={6}>
                    <InputOTPGroup>
                      {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Enter any 6 digits for demo</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('confirm')} className="flex-1">Back</Button>
                <Button onClick={handleComplete} disabled={loading || otp.length < 6} className="flex-1 bg-info hover:bg-info/90 text-primary-foreground">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete'}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">Repayment Successful!</h2>
              <p className="text-sm text-muted-foreground">{fmt(parseFloat(amount))} ETB for {customerName}</p>
              <p className="text-xs font-mono text-muted-foreground mt-2">Ref: {txnRef}</p>
              <Button onClick={() => { setStep('find'); setAmount(''); setOtp(''); setCustomerPhone(''); setLoans([]); setSelectedLoan(null); }} className="w-full mt-6">
                New Repayment
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobilePortalLayout>
  );
};

export default AgencyLoanRepay;
