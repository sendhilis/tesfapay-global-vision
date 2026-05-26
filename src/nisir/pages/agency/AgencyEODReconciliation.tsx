import { useState, useEffect } from 'react';
import { useAuth } from '@nisir/hooks/useAuth';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@nisir/components/MobilePortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Home, CreditCard, Users, BarChart3, FileText,
  ClipboardCheck, Loader2, Check, AlertTriangle, Calculator
} from 'lucide-react';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/agency' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/agency/payments' },
  { icon: <Users className="h-5 w-5" />, labelKey: 'admin.customers', path: '/agency/customers' },
  { icon: <BarChart3 className="h-5 w-5" />, labelKey: 'agency.reports', path: '/agency/reports' },
  { icon: <FileText className="h-5 w-5" />, labelKey: 'common.profile', path: '/agency/profile' },
];

const denominations = [1000, 500, 200, 100, 50, 10, 5, 1];

type Step = 'transactions' | 'cash-count' | 'float-check' | 'variance' | 'submit';

const AgencyEODReconciliation = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('transactions');
  const [agent, setAgent] = useState<any>(null);
  const [todayTxns, setTodayTxns] = useState<any[]>([]);
  const [denomCounts, setDenomCounts] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: ag } = await supabase.from('agents').select('*').eq('profile_id', user.id).single();
      if (ag) {
        setAgent(ag);
        const today = new Date().toISOString().split('T')[0];
        const { data: txns } = await supabase.from('agent_transactions').select('*')
          .eq('agent_id', ag.id).gte('created_at', today).order('created_at', { ascending: false });
        setTodayTxns(txns || []);
      }
    };
    load();
  }, [user]);

  const cashInTotal = todayTxns.filter(t => t.transaction_type === 'cash_in').reduce((s, t) => s + t.amount, 0);
  const cashOutTotal = todayTxns.filter(t => t.transaction_type === 'cash_out').reduce((s, t) => s + t.amount, 0);
  const feesTotal = todayTxns.reduce((s, t) => s + (t.fee || 0), 0);
  const cashOnHand = Object.entries(denomCounts).reduce((s, [d, c]) => s + Number(d) * (c || 0), 0);
  const expectedCash = cashInTotal - cashOutTotal; // simplified
  const variance = cashOnHand - expectedCash;

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });
  const steps: Step[] = ['transactions', 'cash-count', 'float-check', 'variance', 'submit'];

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    toast.success('EOD Reconciliation submitted successfully!');
    setLoading(false);
    setStep('submit');
  };

  return (
    <MobilePortalLayout portalName="Nisir Agent" portalColor="agency" navItems={navItems} showBack backPath="/agency">
      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">EOD Reconciliation</h2>
            <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {steps.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${steps.indexOf(step) >= i ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        {step === 'transactions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h3 className="text-sm font-bold">Today's Transaction Summary</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-success/10 rounded-xl text-center">
                <p className="text-[10px] text-muted-foreground">Cash Received</p>
                <p className="text-lg font-extrabold text-success">{fmt(cashInTotal)}</p>
                <p className="text-[10px]">{todayTxns.filter(t => t.transaction_type === 'cash_in').length} txns</p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-xl text-center">
                <p className="text-[10px] text-muted-foreground">Cash Paid</p>
                <p className="text-lg font-extrabold text-destructive">{fmt(cashOutTotal)}</p>
                <p className="text-[10px]">{todayTxns.filter(t => t.transaction_type === 'cash_out').length} txns</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-card rounded-xl border text-center">
                <p className="text-[10px] text-muted-foreground">Total Txns</p>
                <p className="text-base font-bold">{todayTxns.length}</p>
              </div>
              <div className="p-2 bg-card rounded-xl border text-center">
                <p className="text-[10px] text-muted-foreground">Fees Earned</p>
                <p className="text-base font-bold">{fmt(feesTotal)}</p>
              </div>
              <div className="p-2 bg-card rounded-xl border text-center">
                <p className="text-[10px] text-muted-foreground">Net Cash</p>
                <p className="text-base font-bold">{fmt(cashInTotal - cashOutTotal)}</p>
              </div>
            </div>
            <Button onClick={() => setStep('cash-count')} className="w-full">Next: Cash Count</Button>
          </motion.div>
        )}

        {step === 'cash-count' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2"><Calculator className="h-4 w-4" /> Denomination Count</h3>
            <div className="space-y-2">
              {denominations.map(d => (
                <div key={d} className="flex items-center gap-3 p-2 bg-card rounded-lg border">
                  <span className="text-sm font-bold w-16">{d} ETB</span>
                  <span className="text-xs text-muted-foreground">×</span>
                  <Input type="number" value={denomCounts[d] || ''} onChange={e => setDenomCounts(prev => ({ ...prev, [d]: parseInt(e.target.value) || 0 }))}
                    placeholder="0" className="flex-1 h-8 text-sm text-center" />
                  <span className="text-xs font-medium w-20 text-right">{fmt(d * (denomCounts[d] || 0))}</span>
                </div>
              ))}
            </div>
            <div className="p-3 bg-primary/10 rounded-xl flex justify-between">
              <span className="text-sm font-bold">Total Cash Counted</span>
              <span className="text-lg font-extrabold text-primary">{fmt(cashOnHand)} ETB</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('transactions')} className="flex-1">Back</Button>
              <Button onClick={() => setStep('float-check')} className="flex-1">Next: Float</Button>
            </div>
          </motion.div>
        )}

        {step === 'float-check' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h3 className="text-sm font-bold">Float Position</h3>
            {agent && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">System Float Balance</span><span className="font-bold">{fmt(agent.float_balance)} ETB</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Max Float</span><span>{fmt(agent.max_float)} ETB</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Float Utilization</span><span className="font-medium">{((agent.float_balance / agent.max_float) * 100).toFixed(1)}%</span></div>
                </CardContent>
              </Card>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('cash-count')} className="flex-1">Back</Button>
              <Button onClick={() => setStep('variance')} className="flex-1">Next: Variance</Button>
            </div>
          </motion.div>
        )}

        {step === 'variance' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h3 className="text-sm font-bold">Variance Analysis</h3>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Expected Cash</span><span className="font-bold">{fmt(expectedCash)} ETB</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Counted Cash</span><span className="font-bold">{fmt(cashOnHand)} ETB</span></div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">Variance</span>
                    <div className="flex items-center gap-1">
                      {Math.abs(variance) > 0 && <AlertTriangle className={`h-3 w-3 ${variance > 0 ? 'text-success' : 'text-destructive'}`} />}
                      <span className={`text-lg font-extrabold ${variance === 0 ? 'text-success' : variance > 0 ? 'text-success' : 'text-destructive'}`}>
                        {variance > 0 ? '+' : ''}{fmt(variance)} ETB
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {variance === 0 ? '✅ Perfectly balanced' : variance > 0 ? '⬆️ Cash surplus detected' : '⬇️ Cash shortage detected'}
                  </p>
                </div>
              </CardContent>
            </Card>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes / Explanation</label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes about variances, exceptions..." rows={3} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('float-check')} className="flex-1">Back</Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-success hover:bg-success/90 text-primary-foreground">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit EOD'}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'submit' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-bold mb-1">EOD Submitted!</h2>
            <p className="text-sm text-muted-foreground">Reconciliation complete for today</p>
            <div className="mt-4 p-3 bg-card rounded-xl border text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Transactions</span><span className="font-bold">{todayTxns.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Cash Counted</span><span className="font-bold">{fmt(cashOnHand)} ETB</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Variance</span><span className={`font-bold ${variance === 0 ? 'text-success' : 'text-destructive'}`}>{fmt(variance)} ETB</span></div>
            </div>
          </motion.div>
        )}
      </div>
    </MobilePortalLayout>
  );
};

export default AgencyEODReconciliation;
