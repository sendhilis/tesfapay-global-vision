import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@/components/MobilePortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  Home, CreditCard, Users, BarChart3, FileText,
  Coins, ArrowDownToLine, ArrowUpFromLine, Receipt, Smartphone, Send, TrendingUp
} from 'lucide-react';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/agency' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/agency/payments' },
  { icon: <Users className="h-5 w-5" />, labelKey: 'admin.customers', path: '/agency/customers' },
  { icon: <BarChart3 className="h-5 w-5" />, labelKey: 'agency.reports', path: '/agency/reports' },
  { icon: <FileText className="h-5 w-5" />, labelKey: 'common.profile', path: '/agency/profile' },
];

const commissionRates: Record<string, { rate: number; label: string; icon: any; color: string }> = {
  cash_in: { rate: 0.3, label: 'Cash In', icon: ArrowDownToLine, color: 'text-success' },
  cash_out: { rate: 0.5, label: 'Cash Out', icon: ArrowUpFromLine, color: 'text-portal-merchant' },
  bill_pay: { rate: 0.2, label: 'Bill Pay', icon: Receipt, color: 'text-primary' },
  airtime: { rate: 2.0, label: 'Airtime', icon: Smartphone, color: 'text-info' },
  transfer: { rate: 0.15, label: 'Transfer', icon: Send, color: 'text-purple-500' },
  loan_repay: { rate: 0.1, label: 'Loan Repay', icon: Send, color: 'text-amber-500' },
  savings_collection: { rate: 0.3, label: 'Savings', icon: Coins, color: 'text-success' },
};

const AgencyCommissions = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [agent, setAgent] = useState<any>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: ag } = await supabase.from('agents').select('*').eq('profile_id', user.id).single();
      if (ag) {
        setAgent(ag);
        const now = new Date();
        let from = new Date();
        if (period === 'today') from.setHours(0, 0, 0, 0);
        else if (period === 'week') from.setDate(now.getDate() - 7);
        else from.setMonth(now.getMonth() - 1);

        const { data } = await supabase.from('agent_transactions').select('*')
          .eq('agent_id', ag.id).gte('created_at', from.toISOString()).order('created_at', { ascending: false });
        setTxns(data || []);
      }
    };
    load();
  }, [user, period]);

  const commissionByType = Object.entries(commissionRates).map(([type, config]) => {
    const typeTxns = txns.filter(t => t.transaction_type === type);
    const volume = typeTxns.reduce((s, t) => s + t.amount, 0);
    const commission = volume * (config.rate / 100);
    return { type, ...config, count: typeTxns.length, volume, commission };
  }).filter(c => c.count > 0);

  const totalCommission = commissionByType.reduce((s, c) => s + c.commission, 0);
  const totalVolume = txns.reduce((s, t) => s + t.amount, 0);
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

  return (
    <MobilePortalLayout portalName="Nisir Agent" portalColor="agency" navItems={navItems} showBack backPath="/agency">
      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Coins className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Commission Dashboard</h2>
            <p className="text-xs text-muted-foreground">Earnings & revenue share</p>
          </div>
        </div>

        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          {(['today', 'week', 'month'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors capitalize ${period === p ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
              {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 text-primary-foreground" style={{ background: 'linear-gradient(135deg, hsl(43,75%,45%), hsl(43,65%,55%))' }}>
          <p className="text-sm opacity-80">Total Commission Earned</p>
          <p className="text-3xl font-extrabold">{fmt(totalCommission)} <span className="text-sm font-normal opacity-70">ETB</span></p>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-primary-foreground/10 rounded-xl p-2 text-center">
              <p className="text-[10px] opacity-70">Volume</p>
              <p className="text-sm font-bold">{fmt(totalVolume)}</p>
            </div>
            <div className="bg-primary-foreground/10 rounded-xl p-2 text-center">
              <p className="text-[10px] opacity-70">Transactions</p>
              <p className="text-sm font-bold">{txns.length}</p>
            </div>
          </div>
        </motion.div>

        <div>
          <h3 className="text-sm font-bold text-foreground mb-2">Commission by Service</h3>
          <div className="space-y-2">
            {commissionByType.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No transactions in this period</p>
            ) : commissionByType.map(c => {
              const Icon = c.icon;
              return (
                <Card key={c.type}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className={`h-4 w-4 ${c.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{c.label}</p>
                      <p className="text-[10px] text-muted-foreground">{c.count} txns · Vol: {fmt(c.volume)} · Rate: {c.rate}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-600">{fmt(c.commission)}</p>
                      <p className="text-[10px] text-muted-foreground">ETB</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {agent && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-bold mb-3">Commission Split (Hierarchy)</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 bg-primary rounded-full" style={{ flex: 60 }} />
                  <span className="text-xs font-medium w-24">Nisir MFI 60%</span>
                  <span className="text-xs font-bold">{fmt(totalCommission * 0.6)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 bg-amber-500 rounded-full" style={{ flex: agent.agent_category === 'super_agent' ? 40 : 25 }} />
                  <span className="text-xs font-medium w-24">{agent.agent_category === 'super_agent' ? 'You 40%' : 'Super Agt 15%'}</span>
                  <span className="text-xs font-bold">{fmt(totalCommission * (agent.agent_category === 'super_agent' ? 0.4 : 0.15))}</span>
                </div>
                {agent.agent_category !== 'super_agent' && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 bg-success rounded-full" style={{ flex: 25 }} />
                    <span className="text-xs font-medium w-24">You 25%</span>
                    <span className="text-xs font-bold">{fmt(totalCommission * 0.25)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MobilePortalLayout>
  );
};

export default AgencyCommissions;
