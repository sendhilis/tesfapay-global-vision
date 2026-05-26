import { useState, useEffect } from 'react';
import { useAuth } from '@nisir/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@nisir/components/MobilePortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Home, CreditCard, Users, BarChart3, FileText,
  Receipt, Check, Loader2, Shield, Phone, Zap
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

const billers = [
  { name: 'Ethiopian Electric Utility', code: 'EEU', category: 'electricity' },
  { name: 'Addis Ababa Water & Sewerage', code: 'AAWSA', category: 'water' },
  { name: 'Ethio Telecom', code: 'ET', category: 'telecom' },
  { name: 'DSTV Ethiopia', code: 'DSTV', category: 'tv' },
  { name: 'School Fee Payment', code: 'SCHOOL', category: 'education' },
];

type Step = 'details' | 'confirm' | 'otp' | 'success';

const AgencyBillPay = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('details');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [biller, setBiller] = useState('');
  const [accountNo, setAccountNo] = useState('');
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

  const handleConfirm = () => {
    if (!biller || !accountNo || !amount || parseFloat(amount) <= 0 || !customerPhone) {
      toast.error('Fill all required fields');
      return;
    }
    const phone = customerPhone.startsWith('+') ? customerPhone : `+251${customerPhone.replace(/^0/, '')}`;
    // Try to find customer name
    supabase.from('profiles').select('first_name, father_name').eq('msisdn', phone).single()
      .then(({ data }) => {
        setCustomerName(data ? `${data.first_name} ${data.father_name}` : customerPhone);
        setStep('confirm');
      });
  };

  const handleComplete = async () => {
    if (otp.length < 6) { toast.error('Enter OTP'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const amt = parseFloat(amount);
    const fee = 5;
    const ref = 'ABILL-' + Math.random().toString(36).substring(2, 12).toUpperCase();

    if (agentId) {
      await supabase.from('agent_transactions').insert({
        agent_id: agentId,
        customer_profile_id: null,
        transaction_type: 'bill_payment',
        amount: amt,
        fee,
        reference: ref,
        customer_msisdn: customerPhone.startsWith('+') ? customerPhone : `+251${customerPhone.replace(/^0/, '')}`,
        customer_name: customerName,
        notes: `${billers.find(b => b.code === biller)?.name} - Acc: ${accountNo}`,
      });

      // Deduct agent float
      const { data: agent } = await supabase.from('agents').select('float_balance').eq('id', agentId).single();
      if (agent) {
        await supabase.from('agents').update({ float_balance: agent.float_balance - (amt + fee) }).eq('id', agentId);
      }
    }

    setTxnRef(ref);
    setStep('success');
    toast.success('Bill payment successful!');
    setLoading(false);
  };

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });
  const selectedBiller = billers.find(b => b.code === biller);

  return (
    <MobilePortalLayout portalName="Nisir Agent" portalColor="agency" navItems={navItems} showBack backPath="/agency/payments">
      <div className="px-4 pt-4 pb-6">
        <AnimatePresence mode="wait">
          {step === 'details' && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Bill Payment</h2>
                  <p className="text-xs text-muted-foreground">Pay bills for customer</p>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <CustomerPicker
                  phoneValue={customerPhone}
                  onPhoneChange={setCustomerPhone}
                  label="Customer Phone"
                  onSelect={(c) => {
                    setCustomerName(`${c.first_name} ${c.father_name}`);
                    setCustomerPhone(c.msisdn?.replace('+251', '') || '');
                  }}
                />
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Biller</label>
                  <Select value={biller} onValueChange={setBiller}>
                    <SelectTrigger><SelectValue placeholder="Select biller" /></SelectTrigger>
                    <SelectContent>
                      {billers.map(b => <SelectItem key={b.code} value={b.code}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Account / Meter Number</label>
                  <Input value={accountNo} onChange={e => setAccountNo(e.target.value)} placeholder="Enter number" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Amount</label>
                  <div className="relative">
                    <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="text-lg font-bold h-12 pr-12" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ETB</span>
                  </div>
                </div>
              </div>
              <Button onClick={handleConfirm} className="w-full bg-primary">Continue</Button>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="text-lg font-bold text-foreground">Confirm Bill Payment</h2>
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Customer</span><span className="font-semibold">{customerName}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Biller</span><span className="font-semibold">{selectedBiller?.name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Account</span><span className="font-medium">{accountNo}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount</span><span className="font-bold">{fmt(parseFloat(amount))} ETB</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Fee</span><span>5.00 ETB</span></div>
                <div className="border-t pt-2 flex justify-between text-sm font-bold"><span>Total</span><span>{fmt(parseFloat(amount) + 5)} ETB</span></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('details')} className="flex-1">Back</Button>
                <Button onClick={() => setStep('otp')} className="flex-1 bg-primary">Proceed</Button>
              </div>
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="text-center">
                <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
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
                <Button onClick={handleComplete} disabled={loading || otp.length < 6} className="flex-1 bg-primary">
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
              <h2 className="text-xl font-bold text-foreground mb-1">Payment Successful!</h2>
              <p className="text-sm text-muted-foreground">{selectedBiller?.name} - {fmt(parseFloat(amount))} ETB</p>
              <p className="text-xs font-mono text-muted-foreground mt-2">Ref: {txnRef}</p>
              <Button onClick={() => { setStep('details'); setAmount(''); setOtp(''); setBiller(''); setAccountNo(''); setCustomerPhone(''); }} className="w-full mt-6">
                New Payment
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobilePortalLayout>
  );
};

export default AgencyBillPay;
