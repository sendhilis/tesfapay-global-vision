import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@/components/MobilePortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Home, CreditCard, Users, BarChart3, FileText,
  RotateCcw, Search, Loader2, Check, AlertTriangle, Shield
} from 'lucide-react';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/agency' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/agency/payments' },
  { icon: <Users className="h-5 w-5" />, labelKey: 'admin.customers', path: '/agency/customers' },
  { icon: <BarChart3 className="h-5 w-5" />, labelKey: 'agency.reports', path: '/agency/reports' },
  { icon: <FileText className="h-5 w-5" />, labelKey: 'common.profile', path: '/agency/profile' },
];

const AgencyReversal = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [agentId, setAgentId] = useState('');
  const [searchRef, setSearchRef] = useState('');
  const [foundTxn, setFoundTxn] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [reversed, setReversed] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from('agents').select('id').eq('profile_id', user.id).single()
        .then(({ data }) => { if (data) setAgentId(data.id); });
    }
  }, [user]);

  const searchTransaction = async () => {
    if (!searchRef) { toast.error('Enter reference number'); return; }
    setLoading(true);
    const { data } = await supabase.from('agent_transactions').select('*')
      .eq('reference', searchRef.trim()).eq('agent_id', agentId).single();
    if (!data) { toast.error('Transaction not found'); setLoading(false); return; }
    setFoundTxn(data);
    setLoading(false);
  };

  const handleReversal = async () => {
    if (!reason) { toast.error('Enter reason'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    const revRef = 'REV-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    await supabase.from('agent_transactions').insert({
      agent_id: agentId, transaction_type: `reversal_${foundTxn.transaction_type}`,
      amount: foundTxn.amount, fee: 0, reference: revRef,
      customer_msisdn: foundTxn.customer_msisdn, customer_name: foundTxn.customer_name,
      notes: `Reversal of ${foundTxn.reference}: ${reason}`,
    });

    // Reverse float impact
    const { data: agent } = await supabase.from('agents').select('float_balance').eq('id', agentId).single();
    if (agent) {
      const floatAdjust = foundTxn.transaction_type === 'cash_in' ? foundTxn.amount : -foundTxn.amount;
      await supabase.from('agents').update({ float_balance: agent.float_balance + floatAdjust }).eq('id', agentId);
    }

    setReversed(true);
    setLoading(false);
    toast.success(`Transaction ${foundTxn.reference} reversed successfully`);
  };

  const fmt = (n: number) => n?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00';
  const isReversible = foundTxn && foundTxn.status === 'completed' && !foundTxn.transaction_type.startsWith('reversal');
  const timeSinceTxn = foundTxn ? Math.floor((Date.now() - new Date(foundTxn.created_at).getTime()) / 60000) : 0;

  return (
    <MobilePortalLayout portalName="Nisir Agent" portalColor="agency" navItems={navItems} showBack backPath="/agency">
      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <RotateCcw className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Transaction Reversal</h2>
            <p className="text-xs text-muted-foreground">Reverse failed or incorrect transactions</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <label className="text-xs font-medium text-muted-foreground block">Transaction Reference</label>
            <div className="flex gap-2">
              <Input value={searchRef} onChange={e => setSearchRef(e.target.value)} placeholder="ATXN-XXXXXXXX" className="flex-1" />
              <Button onClick={searchTransaction} disabled={loading} size="icon" variant="outline">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {foundTxn && !reversed && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-bold">Transaction Details</h3>
                  {isReversible ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">Reversible</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">Not Reversible</span>
                  )}
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono text-xs">{foundTxn.reference}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize">{foundTxn.transaction_type.replace(/_/g, ' ')}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold">{fmt(foundTxn.amount)} ETB</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{foundTxn.customer_name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span>{timeSinceTxn < 60 ? `${timeSinceTxn}m ago` : `${Math.floor(timeSinceTxn/60)}h ago`}</span></div>
                </div>
              </CardContent>
            </Card>

            {isReversible && (
              <>
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-destructive text-sm font-bold">
                      <AlertTriangle className="h-4 w-4" /> Reversal Impact
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Customer account will be {foundTxn.transaction_type === 'cash_in' ? 'debited' : 'credited'} {fmt(foundTxn.amount)} ETB. Agent float will be adjusted accordingly. Commission for this transaction will be clawed back.
                    </p>
                  </CardContent>
                </Card>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Reason for Reversal</label>
                  <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain why this transaction needs to be reversed..." rows={2} />
                </div>
                <Button onClick={handleReversal} disabled={loading} className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><RotateCcw className="h-4 w-4 mr-2" />Confirm Reversal</>}
                </Button>
              </>
            )}
          </motion.div>
        )}

        {reversed && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-bold mb-1">Reversal Complete</h2>
            <p className="text-sm text-muted-foreground">Transaction {foundTxn?.reference} has been reversed</p>
            <Button onClick={() => { setFoundTxn(null); setReversed(false); setSearchRef(''); setReason(''); }} className="w-full mt-6">Done</Button>
          </motion.div>
        )}
      </div>
    </MobilePortalLayout>
  );
};

export default AgencyReversal;
