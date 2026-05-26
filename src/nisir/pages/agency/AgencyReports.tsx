import { useState, useEffect } from 'react';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import { useAuth } from '@nisir/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@nisir/components/MobilePortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import {
  Home, CreditCard, Users, BarChart3, FileText,
  ArrowDownToLine, ArrowUpFromLine, TrendingUp, Calendar
} from 'lucide-react';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/agency' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/agency/payments' },
  { icon: <Users className="h-5 w-5" />, labelKey: 'admin.customers', path: '/agency/customers' },
  { icon: <BarChart3 className="h-5 w-5" />, labelKey: 'agency.reports', path: '/agency/reports' },
  { icon: <FileText className="h-5 w-5" />, labelKey: 'common.profile', path: '/agency/profile' },
];

const AgencyReports = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [agent, setAgent] = useState<any>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const [period, setPeriod] = useState('today');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: ag } = await supabase.from('agents').select('*').eq('profile_id', user.id).single();
      if (ag) {
        setAgent(ag);
        const { data } = await supabase.from('agent_transactions').select('*').eq('agent_id', ag.id).order('created_at', { ascending: false });
        setTxns(data || []);
      }
    };
    load();
  }, [user]);

  const getFilteredTxns = () => {
    const now = new Date();
    return txns.filter(t => {
      if (!t.created_at) return false;
      const d = new Date(t.created_at);
      if (period === 'today') return d.toDateString() === now.toDateString();
      if (period === 'week') { const w = new Date(now); w.setDate(w.getDate() - 7); return d >= w; }
      if (period === 'month') { const m = new Date(now); m.setMonth(m.getMonth() - 1); return d >= m; }
      return true;
    });
  };

  const filtered = getFilteredTxns();
  const cashIn = filtered.filter(t => t.transaction_type === 'cash_in');
  const cashOut = filtered.filter(t => t.transaction_type === 'cash_out');
  const totalIn = cashIn.reduce((s, t) => s + t.amount, 0);
  const totalOut = cashOut.reduce((s, t) => s + t.amount, 0);
  const totalFees = filtered.reduce((s, t) => s + (t.fee || 0), 0);
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

  return (
    <MobilePortalLayout portalName="Nisir Agent" portalColor="agency" navItems={navItems} showBack backPath="/agency">
      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{t('agency.reports')}</h2>
          <Calendar className="h-5 w-5 text-muted-foreground" />
        </div>

        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-success/10 rounded-xl border border-success/20">
            <ArrowDownToLine className="h-5 w-5 text-success mb-1" />
            <p className="text-[10px] text-muted-foreground">Cash In</p>
            <p className="text-lg font-extrabold text-foreground">{fmt(totalIn)}</p>
            <p className="text-[10px] text-muted-foreground">{cashIn.length} txns</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-portal-merchant/10 rounded-xl border border-portal-merchant/20">
            <ArrowUpFromLine className="h-5 w-5 text-portal-merchant mb-1" />
            <p className="text-[10px] text-muted-foreground">Cash Out</p>
            <p className="text-lg font-extrabold text-foreground">{fmt(totalOut)}</p>
            <p className="text-[10px] text-muted-foreground">{cashOut.length} txns</p>
          </motion.div>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Volume</span><span className="font-bold">{fmt(totalIn + totalOut)} ETB</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Transactions</span><span className="font-bold">{filtered.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Fees Collected</span><span className="font-bold text-success">{fmt(totalFees)} ETB</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Commission Earned</span><span className="font-bold text-primary">{fmt((totalIn + totalOut) * (agent?.commission_rate || 0.5) / 100)} ETB</span></div>
              {agent && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Current Float</span><span className="font-bold">{fmt(agent.float_balance)} ETB</span></div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-foreground mb-3">Recent Activity</h3>
            {filtered.slice(0, 10).map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  {t.transaction_type === 'cash_in'
                    ? <ArrowDownToLine className="h-3.5 w-3.5 text-success" />
                    : <ArrowUpFromLine className="h-3.5 w-3.5 text-portal-merchant" />}
                  <div>
                    <p className="text-xs font-medium text-foreground">{t.customer_name || 'Customer'}</p>
                    <p className="text-[9px] text-muted-foreground">{t.created_at ? new Date(t.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold ${t.transaction_type === 'cash_in' ? 'text-success' : 'text-portal-merchant'}`}>
                  {t.transaction_type === 'cash_in' ? '+' : '-'}{fmt(t.amount)}
                </span>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No transactions for this period</p>}
          </CardContent>
        </Card>
      </div>
    </MobilePortalLayout>
  );
};

export default AgencyReports;
