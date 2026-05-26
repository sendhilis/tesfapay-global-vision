import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import { useAuth } from '@nisir/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@nisir/components/MobilePortalLayout';
import { motion } from 'framer-motion';
import {
  Home, BarChart3, Users, CreditCard, FileText,
  ArrowDownToLine, ArrowUpFromLine, Send, Receipt,
  UserPlus, HandCoins, TrendingUp, Banknote, Clock,
  Eye, PiggyBank, MessageSquareWarning, ClipboardCheck, Coins, Trophy, Network, RotateCcw
} from 'lucide-react';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/agency' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/agency/payments' },
  { icon: <Users className="h-5 w-5" />, labelKey: 'admin.customers', path: '/agency/customers' },
  { icon: <BarChart3 className="h-5 w-5" />, labelKey: 'agency.reports', path: '/agency/reports' },
  { icon: <FileText className="h-5 w-5" />, labelKey: 'common.profile', path: '/agency/profile' },
];

interface AgentTxn {
  id: string;
  transaction_type: string;
  amount: number;
  fee: number | null;
  customer_name: string | null;
  customer_msisdn: string | null;
  reference: string | null;
  status: string;
  created_at: string | null;
}

const AgencyHome = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<any>(null);
  const [todayStats, setTodayStats] = useState({ cashIn: 0, cashOut: 0, cashInCount: 0, cashOutCount: 0 });
  const [recentTxns, setRecentTxns] = useState<AgentTxn[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: ag } = await supabase.from('agents').select('*').eq('profile_id', user.id).single();
      if (ag) {
        setAgent(ag);
        const today = new Date().toISOString().split('T')[0];
        const { data: txns } = await supabase.from('agent_transactions').select('*')
          .eq('agent_id', ag.id).gte('created_at', today);
        if (txns) {
          setTodayStats({
            cashIn: txns.filter(t => t.transaction_type === 'cash_in').reduce((s, t) => s + t.amount, 0),
            cashOut: txns.filter(t => t.transaction_type === 'cash_out').reduce((s, t) => s + t.amount, 0),
            cashInCount: txns.filter(t => t.transaction_type === 'cash_in').length,
            cashOutCount: txns.filter(t => t.transaction_type === 'cash_out').length,
          });
        }

        // Fetch recent transactions (last 20)
        const { data: recent } = await supabase.from('agent_transactions').select('*')
          .eq('agent_id', ag.id).order('created_at', { ascending: false }).limit(20);
        if (recent) setRecentTxns(recent);
      }
    };
    load();
  }, [user]);

  const agentActions = [
    { icon: ArrowDownToLine, labelKey: 'agency.cashIn', color: 'bg-success', path: '/agency/cash-in' },
    { icon: ArrowUpFromLine, labelKey: 'agency.cashOut', color: 'bg-portal-merchant', path: '/agency/cash-out' },
    { icon: Send, labelKey: 'agency.transfer' in t ? 'agency.transfer' : 'common.transfer', color: 'bg-primary', path: '/agency/transfer' },
    { icon: Eye, labelKey: 'agency.balanceInquiry' in t ? 'agency.balanceInquiry' : 'common.search', color: 'bg-info', path: '/agency/balance-inquiry' },
    { icon: UserPlus, labelKey: 'agency.newCustomer', color: 'bg-portal-admin', path: '/agency/onboarding' },
    { icon: Banknote, labelKey: 'agency.float', color: 'bg-portal-agency', path: '/agency/float' },
    { icon: Receipt, labelKey: 'retail.payBills', color: 'bg-amber-500', path: '/agency/bill-pay' },
    { icon: HandCoins, labelKey: 'agency.loanRepay', color: 'bg-purple-500', path: '/agency/loan-repay' },
    { icon: PiggyBank, labelKey: 'agency.savingsCollection' in t ? 'agency.savingsCollection' : 'common.savings', color: 'bg-teal-500', path: '/agency/savings-collection' },
    { icon: Coins, labelKey: 'agency.commission', color: 'bg-amber-600', path: '/agency/commissions' },
    { icon: ClipboardCheck, labelKey: 'agency.eodReconciliation' in t ? 'agency.eodReconciliation' : 'common.reconciliation', color: 'bg-slate-500', path: '/agency/eod' },
    { icon: Network, labelKey: 'agency.subAgents' in t ? 'agency.subAgents' : 'common.network', color: 'bg-indigo-500', path: '/agency/sub-agents' },
  ];

  if (!agent) {
    return (
      <MobilePortalLayout portalName="Nisir Agent" portalColor="agency" navItems={navItems} showBack backPath="/">
        <div className="px-4 pt-8 text-center">
          <h2 className="text-lg font-bold text-foreground mb-2">{t('agency.onboarding')}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t('common.noData')}</p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/agency/onboarding')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold"
          >
            {t('agency.onboarding')}
          </motion.button>
        </div>
      </MobilePortalLayout>
    );
  }

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <MobilePortalLayout portalName="Nisir Agent" portalColor="agency" navItems={navItems} showBack backPath="/">
      {/* Agent Summary Card */}
      <div className="px-4 pt-4 pb-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 text-primary-foreground"
          style={{ background: 'linear-gradient(135deg, hsl(200,65%,38%), hsl(200,55%,48%))' }}
        >
          <p className="text-sm opacity-80 mb-0.5">Agent: {agent.business_name}</p>
          <p className="text-[11px] opacity-60 mb-1 capitalize">{agent.agent_category?.replace('_', ' ')} · {agent.agent_code}</p>
          <p className="text-[11px] opacity-60 mb-3">{agent.location}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary-foreground/10 rounded-xl p-3">
              <p className="text-[10px] opacity-70">{t('agency.float')}</p>
              <p className="text-xl font-extrabold">{fmt(agent.float_balance)}</p>
              <p className="text-[10px] opacity-60">{t('common.etb')}</p>
            </div>
            <div className="bg-primary-foreground/10 rounded-xl p-3">
              <p className="text-[10px] opacity-70">{t('agency.commission')}</p>
              <p className="text-xl font-extrabold">{agent.commission_rate}%</p>
              <p className="text-[10px] opacity-60">rate</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          {agentActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.labelKey}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border hover:shadow-md transition-shadow"
              >
                <div className={`h-10 w-10 rounded-xl ${action.color} flex items-center justify-center`}>
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-[11px] font-medium text-foreground text-center leading-tight">
                  {t(action.labelKey)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Today's Summary */}
      <div className="px-4 pb-3">
        <h3 className="text-sm font-bold text-foreground mb-2">{t('agency.dailySummary')}</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: t('agency.cashIn'), count: todayStats.cashInCount, amount: fmt(todayStats.cashIn), icon: ArrowDownToLine },
            { label: t('agency.cashOut'), count: todayStats.cashOutCount, amount: fmt(todayStats.cashOut), icon: ArrowUpFromLine },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="p-3 bg-card rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-lg font-bold text-foreground">{stat.amount} <span className="text-[10px] text-muted-foreground">{t('common.etb')}</span></p>
                <p className="text-[10px] text-muted-foreground">{stat.count} {t('agency.totalTransactions').toLowerCase()}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transaction History */}
      <div className="px-4 pb-6">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground">{t('agency.recentTransactions')}</h3>
        </div>
        {recentTxns.length === 0 ? (
          <div className="text-center py-6 bg-card rounded-xl border border-border">
            <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTxns.map((txn) => {
              const isCashIn = txn.transaction_type === 'cash_in';
              return (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border"
                >
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${isCashIn ? 'bg-success/10' : 'bg-portal-merchant/10'}`}>
                    {isCashIn
                      ? <ArrowDownToLine className="h-4 w-4 text-success" />
                      : <ArrowUpFromLine className="h-4 w-4 text-portal-merchant" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {txn.customer_name || txn.customer_msisdn || 'Customer'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {isCashIn ? t('agency.cashIn') : t('agency.cashOut')} · {formatTime(txn.created_at)}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className={`text-sm font-bold ${isCashIn ? 'text-success' : 'text-portal-merchant'}`}>
                          {isCashIn ? '+' : '-'}{fmt(txn.amount)}
                        </p>
                        <p className="text-[9px] font-mono text-muted-foreground">{txn.reference}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </MobilePortalLayout>
  );
};

export default AgencyHome;
