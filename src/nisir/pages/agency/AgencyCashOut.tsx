import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@/components/MobilePortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Home, CreditCard, Users, BarChart3, FileText,
  ArrowUpFromLine, Check, Loader2, Shield, Search, Phone
} from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import CustomerPicker from '@/components/agency/CustomerPicker';

const mockCustomers: Record<string, { name: string; balance: number }> = {
  '+251911234567': { name: 'Almaz Bekele', balance: 10000 },
  '+251922345678': { name: 'Dawit Tadesse', balance: 8500 },
  '+251933456789': { name: 'Tigist Hailu', balance: 15000 },
  '+251944567890': { name: 'Yonas Gebre', balance: 22000 },
  '+251955678901': { name: 'Meron Abebe', balance: 5000 },
};

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/agency' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/agency/payments' },
  { icon: <Users className="h-5 w-5" />, labelKey: 'admin.customers', path: '/agency/customers' },
  { icon: <BarChart3 className="h-5 w-5" />, labelKey: 'agency.reports', path: '/agency/reports' },
  { icon: <FileText className="h-5 w-5" />, labelKey: 'common.profile', path: '/agency/profile' },
];

type Step = 'find-customer' | 'enter-amount' | 'confirm' | 'otp-verify' | 'success';

const AgencyCashOut = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('find-customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerProfileId, setCustomerProfileId] = useState('');
  const [customerAccountId, setCustomerAccountId] = useState('');
  const [customerBalance, setCustomerBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [txnRef, setTxnRef] = useState('');
  const [agentId, setAgentId] = useState('');

  const fee = parseFloat(amount) > 0 ? Math.min(Math.max(parseFloat(amount) * 0.01, 5), 50) : 0;

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
    const { data: profile } = await supabase.from('profiles').select('id, first_name, father_name, msisdn')
      .eq('msisdn', phone).single();
    if (!profile) {
      const mock = mockCustomers[phone];
      if (!mock) { toast.error('Customer not found'); setLoading(false); return; }
      setCustomerName(mock.name);
      setCustomerProfileId('mock-' + phone);
      setCustomerAccountId('');
      setCustomerBalance(mock.balance);
      setStep('enter-amount');
      setLoading(false);
      return;
    }
    const { data: account } = await supabase.from('accounts').select('id, available_balance')
      .eq('profile_id', profile.id).eq('is_primary', true).single();
    setCustomerName(`${profile.first_name} ${profile.father_name}`);
    setCustomerProfileId(profile.id);
    setCustomerAccountId(account?.id || '');
    setCustomerBalance(account?.available_balance || 0);
    setStep('enter-amount');
    setLoading(false);
  };

  const handleConfirm = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter valid amount'); return; }
    if (amt + fee > customerBalance) { toast.error('Insufficient customer balance'); return; }
    setStep('confirm');
  };

  const handleOtpVerify = async () => {
    if (otp.length < 6) { toast.error('Enter OTP'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    const amt = parseFloat(amount);
    const ref = 'ATXN-' + Math.random().toString(36).substring(2, 14).toUpperCase();

    if (customerAccountId) {
      await supabase.from('accounts').update({
        balance: customerBalance - (amt + fee),
        available_balance: customerBalance - (amt + fee),
      }).eq('id', customerAccountId);

      await supabase.from('transactions').insert({
        account_id: customerAccountId,
        profile_id: customerProfileId,
        transaction_type: 'withdrawal',
        amount: amt,
        fee,
        direction: 'debit',
        status: 'completed',
        reference: ref,
        description: 'Agent Cash-Out',
        channel: 'agent',
      });
    }

    if (agentId) {
      const isMock = customerProfileId.startsWith('mock-');
      await supabase.from('agent_transactions').insert({
        agent_id: agentId,
        customer_profile_id: isMock ? null : customerProfileId,
        transaction_type: 'cash_out',
        amount: amt,
        fee,
        reference: ref,
        customer_msisdn: customerPhone.startsWith('+') ? customerPhone : `+251${customerPhone.replace(/^0/, '')}`,
        customer_name: customerName,
      });
      const { data: agent } = await supabase.from('agents').select('float_balance').eq('id', agentId).single();
      if (agent) {
        await supabase.from('agents').update({ float_balance: agent.float_balance + amt }).eq('id', agentId);
      }
    }

    setTxnRef(ref);
    setStep('success');
    toast.success('Cash-Out successful!');
    setLoading(false);
  };

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

  return (
    <MobilePortalLayout portalName="Nisir Agent" portalColor="agency" navItems={navItems} showBack backPath="/agency">
      <div className="px-4 pt-4 pb-6">
        <div className="flex items-center gap-1 mb-4">
          {['find-customer', 'enter-amount', 'confirm', 'otp-verify', 'success'].map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${
              ['find-customer', 'enter-amount', 'confirm', 'otp-verify', 'success'].indexOf(step) >= i ? 'bg-portal-merchant' : 'bg-muted'
            }`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 'find-customer' && (
            <motion.div key="find" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-portal-merchant/10 flex items-center justify-center">
                  <Search className="h-5 w-5 text-portal-merchant" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Find Customer</h2>
                  <p className="text-xs text-muted-foreground">Enter phone to withdraw</p>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 mb-4">
                <CustomerPicker
                  phoneValue={customerPhone}
                  onPhoneChange={setCustomerPhone}
                  onSelect={(c) => {
                    setCustomerName(`${c.first_name} ${c.father_name}`);
                    setCustomerProfileId(c.id);
                    setCustomerAccountId(c.account_id || '');
                    setCustomerBalance(c.balance || 0);
                    setStep('enter-amount');
                  }}
                />
              </div>
              <Button onClick={handleFindCustomer} disabled={loading} className="w-full bg-portal-merchant hover:bg-portal-merchant/90 text-primary-foreground">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Find Customer'}
              </Button>
            </motion.div>
          )}

          {step === 'enter-amount' && (
            <motion.div key="amount" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-portal-merchant/10 flex items-center justify-center">
                  <ArrowUpFromLine className="h-5 w-5 text-portal-merchant" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Cash Out for {customerName}</h2>
                  <p className="text-xs text-muted-foreground">Balance: {fmt(customerBalance)} ETB</p>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 mb-4">
                <div className="relative">
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="text-2xl font-bold h-14 pr-12" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">ETB</span>
                </div>
                {parseFloat(amount) > 0 && <p className="text-[11px] text-muted-foreground mt-2">Fee: {fmt(fee)} ETB · Total: {fmt(parseFloat(amount) + fee)} ETB</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('find-customer')} className="flex-1">{t('common.back')}</Button>
                <Button onClick={handleConfirm} className="flex-1 bg-portal-merchant hover:bg-portal-merchant/90 text-primary-foreground">Continue</Button>
              </div>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Confirm Cash-Out</h2>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 space-y-3 mb-4">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Customer</span><span className="font-semibold">{customerName}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount</span><span className="font-bold">{fmt(parseFloat(amount))} ETB</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Fee</span><span>{fmt(fee)} ETB</span></div>
                <div className="border-t pt-2 flex justify-between text-sm"><span className="font-semibold">Total Debit</span><span className="font-bold text-destructive">{fmt(parseFloat(amount) + fee)} ETB</span></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('enter-amount')} className="flex-1">{t('common.back')}</Button>
                <Button onClick={() => setStep('otp-verify')} className="flex-1 bg-portal-merchant hover:bg-portal-merchant/90 text-primary-foreground">Proceed</Button>
              </div>
            </motion.div>
          )}

          {step === 'otp-verify' && (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-foreground">OTP Verification</h2>
                <p className="text-xs text-muted-foreground">Enter customer's OTP</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-6 text-center mb-4">
                <div className="flex justify-center">
                  <InputOTP value={otp} onChange={setOtp} maxLength={6}>
                    <InputOTPGroup>
                      {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('confirm')} className="flex-1">{t('common.back')}</Button>
                <Button onClick={handleOtpVerify} disabled={loading || otp.length < 6} className="flex-1 bg-portal-merchant hover:bg-portal-merchant/90 text-primary-foreground">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete'}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="text-center py-6">
                <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-success" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-1">Cash-Out Complete!</h2>
                <p className="text-sm text-muted-foreground">{fmt(parseFloat(amount))} ETB paid to {customerName}</p>
                <p className="text-xs font-mono text-muted-foreground mt-2">Ref: {txnRef}</p>
              </div>
              <Button onClick={() => { setStep('find-customer'); setAmount(''); setOtp(''); setCustomerPhone(''); }} className="w-full">
                New Transaction
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobilePortalLayout>
  );
};

export default AgencyCashOut;
