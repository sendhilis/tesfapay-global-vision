import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAccounts } from '@/hooks/useAccounts';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@/components/MobilePortalLayout';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Home, Wallet, CreditCard, HandCoins, HelpCircle,
  PiggyBank, Building2, Loader2, ArrowDownLeft, ArrowUpRight,
  Copy, Check, Settings, FileText, ArrowLeftRight, Snowflake, Eye, EyeOff,
  CircleDollarSign, Send, Receipt, Smartphone
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Transaction = Tables<'transactions'>;

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/retail' },
  { icon: <Wallet className="h-5 w-5" />, labelKey: 'common.accounts', path: '/retail/accounts' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/retail/payments' },
  { icon: <HandCoins className="h-5 w-5" />, labelKey: 'common.loans', path: '/retail/loans' },
  { icon: <HelpCircle className="h-5 w-5" />, labelKey: 'common.support', path: '/retail/support' },
];

const iconForType: Record<string, any> = {
  savings: PiggyBank,
  wallet: Wallet,
  current: Building2,
};

const txnIconMap: Record<string, any> = {
  transfer: Send,
  bill_payment: Receipt,
  airtime: Smartphone,
  deposit: CircleDollarSign,
  withdrawal: ArrowUpRight,
  loan_repayment: FileText,
};

const RetailAccountDetail = () => {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { accounts, loading: accountsLoading } = useAccounts();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txnLoading, setTxnLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [balanceHidden, setBalanceHidden] = useState(false);

  const account = accounts.find((a) => a.id === accountId);
  const Icon = account ? iconForType[account.account_type] || Wallet : Wallet;

  useEffect(() => {
    if (!accountId || !user) return;
    const fetchTxns = async () => {
      setTxnLoading(true);
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('account_id', accountId)
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setTransactions(data || []);
      setTxnLoading(false);
    };
    fetchTxns();
  }, [accountId, user]);

  const fmt = (n: number) => balanceHidden ? '****' : n.toLocaleString('en-US', { minimumFractionDigits: 2 });

  const copyAccountNumber = () => {
    if (account) {
      navigator.clipboard.writeText(account.account_number);
      setCopied(true);
      toast.success(t('accounts.copied'));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (accountsLoading) {
    return (
      <MobilePortalLayout portalName="Nisir" portalColor="retail" navItems={navItems} showBack backPath="/retail/accounts">
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </MobilePortalLayout>
    );
  }

  if (!account) {
    return (
      <MobilePortalLayout portalName="Nisir" portalColor="retail" navItems={navItems} showBack backPath="/retail/accounts">
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p>{t('accounts.notFound')}</p>
        </div>
      </MobilePortalLayout>
    );
  }

  return (
    <MobilePortalLayout portalName="Nisir" portalColor="retail" navItems={navItems} showBack backPath="/retail/accounts">
      {/* Account Hero Card */}
      <div className="px-4 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-primary p-5 text-primary-foreground"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary-foreground/15 flex items-center justify-center">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-base">{account.product_name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-xs opacity-70">{account.account_number}</p>
                  <button onClick={copyAccountNumber} className="opacity-70 hover:opacity-100">
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            </div>
            <button onClick={() => setBalanceHidden(!balanceHidden)} className="p-1.5 rounded-lg bg-primary-foreground/10">
              {balanceHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <p className="text-[11px] opacity-60">{t('retail.available')}</p>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {fmt(account.available_balance || 0)} <span className="text-sm font-medium opacity-70">{t('common.etb')}</span>
          </h2>

          <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-primary-foreground/15">
            <div>
              <p className="text-[10px] opacity-60">{t('retail.book')}</p>
              <p className="text-sm font-bold">{fmt(account.balance || 0)}</p>
            </div>
            <div>
              <p className="text-[10px] opacity-60">{t('retail.blocked')}</p>
              <p className="text-sm font-bold">{fmt(account.blocked_balance || 0)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: ArrowLeftRight, label: t('accounts.ownTransfer'), action: () => navigate(`/retail/accounts/transfer?from=${accountId}`) },
            { icon: Send, label: t('retail.sendMoney'), action: () => navigate('/retail/payments/send') },
            { icon: FileText, label: t('accounts.statement'), action: () => toast.info(t('accounts.statementDownloading')) },
            { icon: Settings, label: t('accounts.settings'), action: () => navigate(`/retail/accounts/${accountId}/settings`) },
          ].map((action, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.04 }}
              onClick={action.action}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-card border border-border hover:shadow-sm transition-shadow"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <action.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[10px] font-medium text-foreground text-center leading-tight">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Account Details */}
      <div className="px-4 pb-3">
        <h3 className="text-sm font-bold text-foreground mb-2">{t('accounts.details')}</h3>
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          {[
            { label: t('accounts.type'), value: account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1) },
            { label: t('accounts.currency'), value: account.currency || 'ETB' },
            { label: t('accounts.status'), value: (account.status || 'active').charAt(0).toUpperCase() + (account.status || 'active').slice(1) },
            { label: t('accounts.dailyLimit'), value: `${(account.daily_limit || 0).toLocaleString()} ETB` },
            { label: t('accounts.monthlyLimit'), value: `${(account.monthly_limit || 0).toLocaleString()} ETB` },
            ...(account.interest_rate && account.interest_rate > 0 ? [{ label: t('accounts.interestRate'), value: `${account.interest_rate}% p.a.` }] : []),
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5">
              <p className="text-xs text-muted-foreground">{row.label}</p>
              <p className="text-xs font-semibold text-foreground">{row.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mini Statement */}
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-foreground">{t('accounts.miniStatement')}</h3>
          <button onClick={() => navigate('/retail/transactions')} className="text-xs font-medium text-primary">
            {t('common.viewAll')}
          </button>
        </div>
        {txnLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">{t('accounts.noTransactions')}</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const TxIcon = txnIconMap[tx.transaction_type] || CircleDollarSign;
              const isCredit = tx.direction === 'credit';
              const timeAgo = tx.created_at ? formatDistanceToNow(new Date(tx.created_at), { addSuffix: true }) : '';
              return (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${isCredit ? 'bg-success/10' : 'bg-muted'}`}>
                      <TxIcon className={`h-4 w-4 ${isCredit ? 'text-success' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.description || tx.transaction_type}</p>
                      <p className="text-[11px] text-muted-foreground">{timeAgo}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-bold ${isCredit ? 'text-success' : 'text-foreground'}`}>
                    {isCredit ? '+' : '-'}{(tx.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {t('common.etb')}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MobilePortalLayout>
  );
};

export default RetailAccountDetail;
