import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@/components/MobilePortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Home, CreditCard, Users, BarChart3, FileText,
  Smartphone, Check, Loader2, Phone
} from 'lucide-react';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/agency' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/agency/payments' },
  { icon: <Users className="h-5 w-5" />, labelKey: 'admin.customers', path: '/agency/customers' },
  { icon: <BarChart3 className="h-5 w-5" />, labelKey: 'agency.reports', path: '/agency/reports' },
  { icon: <FileText className="h-5 w-5" />, labelKey: 'common.profile', path: '/agency/profile' },
];

const quickAmounts = [10, 25, 50, 100, 200, 500];

type Step = 'details' | 'confirm' | 'success';

const AgencyAirtime = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('details');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txnRef, setTxnRef] = useState('');
  const [agentId, setAgentId] = useState('');

  useEffect(() => {
    if (user) {
      supabase.from('agents').select('id').eq('profile_id', user.id).single()
        .then(({ data }) => { if (data) setAgentId(data.id); });
    }
  }, [user]);

  const handleComplete = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const amt = parseFloat(amount);
    const ref = 'AAIR-' + Math.random().toString(36).substring(2, 12).toUpperCase();
    const msisdn = phone.startsWith('+') ? phone : `+251${phone.replace(/^0/, '')}`;

    if (agentId) {
      await supabase.from('agent_transactions').insert({
        agent_id: agentId,
        transaction_type: 'airtime',
        amount: amt,
        fee: 0,
        reference: ref,
        customer_msisdn: msisdn,
        customer_name: msisdn,
        notes: 'Ethio Telecom airtime',
      });
      const { data: agent } = await supabase.from('agents').select('float_balance').eq('id', agentId).single();
      if (agent) {
        await supabase.from('agents').update({ float_balance: agent.float_balance - amt }).eq('id', agentId);
      }
    }

    setTxnRef(ref);
    setStep('success');
    toast.success('Airtime sent!');
    setLoading(false);
  };

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

  return (
    <MobilePortalLayout portalName="Nisir Agent" portalColor="agency" navItems={navItems} showBack backPath="/agency/payments">
      <div className="px-4 pt-4 pb-6">
        <AnimatePresence mode="wait">
          {step === 'details' && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-info/10 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-info" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Airtime Top-Up</h2>
                  <p className="text-xs text-muted-foreground">Ethio Telecom</p>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone Number</label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-3 bg-muted rounded-lg text-sm font-medium"><Phone className="h-4 w-4 mr-1" />+251</span>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="9XXXXXXXX" className="flex-1" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Amount</label>
                  <div className="relative">
                    <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="text-lg font-bold h-12 pr-12" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ETB</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map(a => (
                    <Button key={a} variant={amount === String(a) ? 'default' : 'outline'} size="sm" onClick={() => setAmount(String(a))} className="text-xs">
                      {a} ETB
                    </Button>
                  ))}
                </div>
              </div>
              <Button onClick={() => {
                if (!phone || phone.length < 9) { toast.error('Enter phone'); return; }
                if (!amount || parseFloat(amount) <= 0) { toast.error('Enter amount'); return; }
                setStep('confirm');
              }} className="w-full bg-info hover:bg-info/90 text-primary-foreground">Continue</Button>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="text-lg font-bold text-foreground">Confirm Airtime</h2>
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Phone</span><span className="font-semibold">+251{phone.replace(/^0/, '')}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Operator</span><span className="font-semibold">Ethio Telecom</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount</span><span className="font-bold text-info">{fmt(parseFloat(amount))} ETB</span></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('details')} className="flex-1">Back</Button>
                <Button onClick={handleComplete} disabled={loading} className="flex-1 bg-info hover:bg-info/90 text-primary-foreground">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Airtime'}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">Airtime Sent!</h2>
              <p className="text-sm text-muted-foreground">{fmt(parseFloat(amount))} ETB to +251{phone.replace(/^0/, '')}</p>
              <p className="text-xs font-mono text-muted-foreground mt-2">Ref: {txnRef}</p>
              <Button onClick={() => { setStep('details'); setAmount(''); setPhone(''); }} className="w-full mt-6">New Top-Up</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobilePortalLayout>
  );
};

export default AgencyAirtime;
