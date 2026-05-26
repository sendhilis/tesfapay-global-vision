import { useState, useEffect } from 'react';
import { useAuth } from '@nisir/hooks/useAuth';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@nisir/components/MobilePortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import {
  Home, CreditCard, Users, BarChart3, FileText,
  Send, Phone, Search, Shield, Check, Loader2, ArrowRight
} from 'lucide-react';
import CustomerPicker from '@nisir/components/agency/CustomerPicker';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/agency' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/agency/payments' },
  { icon: <Users className="h-5 w-5" />, labelKey: 'admin.customers', path: '/agency/customers' },
  { icon: <BarChart3 className="h-5 w-5" />, labelKey: 'agency.reports', path: '/agency/reports' },
  { icon: <FileText className="h-5 w-5" />, labelKey: 'common.profile', path: '/agency/profile' },
];

type Step = 'sender' | 'beneficiary' | 'amount' | 'confirm' | 'otp' | 'success';

const AgencyTransfer = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('sender');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderData, setSenderData] = useState<any>(null);
  const [benefPhone, setBenefPhone] = useState('');
  const [benefData, setBenefData] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [txnRef, setTxnRef] = useState('');
  const [agentId, setAgentId] = useState('');
  const fee = parseFloat(amount) > 0 ? Math.min(Math.max(parseFloat(amount) * 0.005, 5), 25) : 0;

  useEffect(() => {
    if (user) {
      supabase.from('agents').select('id').eq('profile_id', user.id).single()
        .then(({ data }) => { if (data) setAgentId(data.id); });
    }
  }, [user]);

  const findCustomer = async (phone: string, isSender: boolean) => {
    const p = phone.startsWith('+') ? phone : `+251${phone.replace(/^0/, '')}`;
    setLoading(true);
    const { data: profile } = await supabase.from('profiles').select('id, first_name, father_name, msisdn').eq('msisdn', p).single();
    if (!profile) { toast.error('Customer not found'); setLoading(false); return; }
    const { data: account } = await supabase.from('accounts').select('id, available_balance, account_number').eq('profile_id', profile.id).eq('is_primary', true).single();
    const data = { profile, account };
    if (isSender) { setSenderData(data); setStep('beneficiary'); }
    else { setBenefData(data); setStep('amount'); }
    setLoading(false);
  };

  const handleComplete = async () => {
    if (otp.length < 6) { toast.error('Enter OTP'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const amt = parseFloat(amount);
    const ref = 'ATRF-' + Math.random().toString(36).substring(2, 12).toUpperCase();

    if (senderData?.account && benefData?.account) {
      await supabase.from('accounts').update({
        balance: senderData.account.available_balance - amt - fee,
        available_balance: senderData.account.available_balance - amt - fee,
      }).eq('id', senderData.account.id);

      await supabase.from('accounts').update({
        balance: (benefData.account.available_balance || 0) + amt,
        available_balance: (benefData.account.available_balance || 0) + amt,
      }).eq('id', benefData.account.id);

      await supabase.from('transactions').insert([
        { account_id: senderData.account.id, profile_id: senderData.profile.id, transaction_type: 'transfer', amount: amt, fee, direction: 'debit', status: 'completed', reference: ref, description: `Transfer to ${benefData.profile.first_name}`, channel: 'agent' },
        { account_id: benefData.account.id, profile_id: benefData.profile.id, transaction_type: 'transfer', amount: amt, fee: 0, direction: 'credit', status: 'completed', reference: ref, description: `Transfer from ${senderData.profile.first_name}`, channel: 'agent' },
      ]);
    }

    if (agentId) {
      await supabase.from('agent_transactions').insert({
        agent_id: agentId, transaction_type: 'transfer', amount: amt, fee,
        reference: ref, customer_msisdn: senderPhone.startsWith('+') ? senderPhone : `+251${senderPhone.replace(/^0/, '')}`,
        customer_name: `${senderData.profile.first_name} → ${benefData.profile.first_name}`,
      });
    }

    setTxnRef(ref);
    setStep('success');
    toast.success('Transfer successful!');
    setLoading(false);
  };

  const fmt = (n: number) => n?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00';
  const steps: Step[] = ['sender', 'beneficiary', 'amount', 'confirm', 'otp', 'success'];

  return (
    <MobilePortalLayout portalName="Nisir Agent" portalColor="agency" navItems={navItems} showBack backPath="/agency/payments">
      <div className="px-4 pt-4 pb-6">
        <div className="flex items-center gap-1 mb-4">
          {steps.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${steps.indexOf(step) >= i ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 'sender' && (
            <motion.div key="sender" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Send className="h-5 w-5 text-primary" /></div>
                <div><h2 className="text-lg font-bold">Customer Transfer</h2><p className="text-xs text-muted-foreground">Find sender</p></div>
              </div>
              <Card><CardContent className="p-4">
                <CustomerPicker
                  phoneValue={senderPhone}
                  onPhoneChange={setSenderPhone}
                  label="Sender Phone"
                  onSelect={(c) => {
                    setSenderData({
                      profile: { id: c.id, first_name: c.first_name, father_name: c.father_name, msisdn: c.msisdn },
                      account: { id: c.account_id, available_balance: c.balance, account_number: '' }
                    });
                    setStep('beneficiary');
                  }}
                />
              </CardContent></Card>
              <Button onClick={() => findCustomer(senderPhone, true)} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Find Sender'}
              </Button>
            </motion.div>
          )}

          {step === 'beneficiary' && (
            <motion.div key="benef" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="p-3 bg-success/10 rounded-xl text-sm">
                <span className="text-muted-foreground">Sender: </span>
                <span className="font-bold">{senderData?.profile.first_name} {senderData?.profile.father_name}</span>
                <span className="text-muted-foreground ml-2">Bal: {fmt(senderData?.account?.available_balance || 0)} ETB</span>
              </div>
              <Card><CardContent className="p-4">
                <CustomerPicker
                  phoneValue={benefPhone}
                  onPhoneChange={setBenefPhone}
                  label="Beneficiary Phone"
                  onSelect={(c) => {
                    setBenefData({
                      profile: { id: c.id, first_name: c.first_name, father_name: c.father_name, msisdn: c.msisdn },
                      account: { id: c.account_id, available_balance: c.balance, account_number: '' }
                    });
                    setStep('amount');
                  }}
                />
              </CardContent></Card>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('sender')} className="flex-1">Back</Button>
                <Button onClick={() => findCustomer(benefPhone, false)} disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Find Beneficiary'}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'amount' && (
            <motion.div key="amount" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-card rounded-xl border border-border">
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-muted-foreground">From</p>
                  <p className="text-sm font-bold">{senderData?.profile.first_name}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-muted-foreground">To</p>
                  <p className="text-sm font-bold">{benefData?.profile.first_name}</p>
                </div>
              </div>
              <Card><CardContent className="p-4">
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Transfer Amount</label>
                <div className="relative">
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="text-2xl font-bold h-14 pr-12" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ETB</span>
                </div>
                {parseFloat(amount) > 0 && <p className="text-[11px] text-muted-foreground mt-2">Fee: {fmt(fee)} ETB · Total debit: {fmt(parseFloat(amount) + fee)} ETB</p>}
              </CardContent></Card>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('beneficiary')} className="flex-1">Back</Button>
                <Button onClick={() => {
                  const amt = parseFloat(amount);
                  if (!amt || amt <= 0) { toast.error('Enter amount'); return; }
                  if (amt + fee > (senderData?.account?.available_balance || 0)) { toast.error('Insufficient balance'); return; }
                  setStep('confirm');
                }} className="flex-1">Continue</Button>
              </div>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="text-lg font-bold">Confirm Transfer</h2>
              <Card><CardContent className="p-4 space-y-2.5">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sender</span><span className="font-semibold">{senderData?.profile.first_name} {senderData?.profile.father_name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Beneficiary</span><span className="font-semibold">{benefData?.profile.first_name} {benefData?.profile.father_name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount</span><span className="font-bold">{fmt(parseFloat(amount))} ETB</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Fee</span><span>{fmt(fee)} ETB</span></div>
                <div className="border-t pt-2 flex justify-between text-sm font-bold"><span>Total Debit</span><span className="text-primary">{fmt(parseFloat(amount) + fee)} ETB</span></div>
              </CardContent></Card>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('amount')} className="flex-1">Back</Button>
                <Button onClick={() => setStep('otp')} className="flex-1">Proceed</Button>
              </div>
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="text-center">
                <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                <h2 className="text-lg font-bold">OTP Verification</h2>
                <p className="text-xs text-muted-foreground">Enter sender's OTP</p>
              </div>
              <div className="flex justify-center">
                <InputOTP value={otp} onChange={setOtp} maxLength={6}>
                  <InputOTPGroup>{[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
                </InputOTP>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">Enter any 6 digits for demo</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('confirm')} className="flex-1">Back</Button>
                <Button onClick={handleComplete} disabled={loading || otp.length < 6} className="flex-1">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete Transfer'}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-xl font-bold mb-1">Transfer Successful!</h2>
              <p className="text-sm text-muted-foreground">{fmt(parseFloat(amount))} ETB from {senderData?.profile.first_name} to {benefData?.profile.first_name}</p>
              <p className="text-xs font-mono text-muted-foreground mt-2">Ref: {txnRef}</p>
              <Button onClick={() => { setStep('sender'); setAmount(''); setOtp(''); setSenderPhone(''); setBenefPhone(''); setSenderData(null); setBenefData(null); }} className="w-full mt-6">New Transfer</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobilePortalLayout>
  );
};

export default AgencyTransfer;
