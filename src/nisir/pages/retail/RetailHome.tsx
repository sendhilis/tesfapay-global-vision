import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { useProfile } from '@/hooks/useProfile';
import MobilePortalLayout from '@/components/MobilePortalLayout';
import NisirAIWidget from '@/components/NisirAIWidget';
import KycTierCard from '@/components/KycTierCard';
import LoanRepaymentTracker from '@/components/loans/LoanRepaymentTracker';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Home, Wallet, CreditCard, HandCoins, HelpCircle,
  Send, Receipt, Smartphone, PiggyBank, ArrowUpRight,
  CircleDollarSign, FileText, Loader2,
  ArrowDownToLine, ArrowUpFromLine
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/retail' },
  { icon: <Wallet className="h-5 w-5" />, labelKey: 'common.accounts', path: '/retail/accounts' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/retail/payments' },
  { icon: <HandCoins className="h-5 w-5" />, labelKey: 'common.loans', path: '/retail/loans' },
  { icon: <HelpCircle className="h-5 w-5" />, labelKey: 'common.support', path: '/retail/support' },
];

const quickActions = [
  { icon: Send, labelKey: 'retail.sendMoney', color: 'bg-primary', path: '/retail/payments/send' },
  { icon: ArrowDownToLine, labelKey: 'agent.cashIn', color: 'bg-success', path: '/retail/agent/cash-in' },
  { icon: ArrowUpFromLine, labelKey: 'agent.cashOut', color: 'bg-portal-merchant', path: '/retail/agent/cash-out' },
  { icon: Receipt, labelKey: 'retail.payBills', color: 'bg-portal-agency', path: '/retail/payments/bills' },
  { icon: Smartphone, labelKey: 'retail.buyAirtime', color: 'bg-info', path: '/retail/payments/airtime' },
  { icon: HandCoins, labelKey: 'retail.loanApply', color: 'bg-portal-admin', path: '/retail/loans' },
  { icon: PiggyBank, labelKey: 'retail.openAccount', color: 'bg-muted', path: '/retail/accounts' },
  { icon: ArrowUpRight, labelKey: 'retail.upgradeKyc', color: 'bg-primary/70', path: '/retail/kyc' },
];

const iconMap: Record<string, any> = {
  transfer: Send,
  bill_payment: Receipt,
  airtime: Smartphone,
  loan_repayment: FileText,
  deposit: CircleDollarSign,
  withdrawal: ArrowUpRight,
};

const RetailHome = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { accounts, loading: accountsLoading, totalBalance } = useAccounts();
  const { transactions, loading: txnLoading } = useTransactions(5);
  const { profile } = useProfile();
  const navigate = useNavigate();

  const displayName = profile?.first_name || user?.email?.split('@')[0] || 'Customer';
  const completeness = profile?.profile_completeness || 0;

  const formatAmount = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
    <MobilePortalLayout
      portalName="Nisir"
      portalColor="retail"
      navItems={navItems}
      showBack
      backPath="/"
    >
      {/* Welcome & Balance */}
      <div className="px-4 pt-4 pb-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-primary p-5 text-primary-foreground"
        >
          <p className="text-sm opacity-80 mb-1">{t('common.welcome')}, {displayName}</p>
          <p className="text-[11px] opacity-60 mb-1">{t('retail.availableBalance')}</p>
          {accountsLoading ? (
            <Loader2 className="h-6 w-6 animate-spin mt-1" />
          ) : (
            <h2 className="text-3xl font-extrabold tracking-tight">
              {formatAmount(totalBalance)} <span className="text-base font-medium opacity-70">{t('common.etb')}</span>
            </h2>
          )}
        </motion.div>
      </div>

      {/* KYC Tier & Upgrade Card */}
      <div className="px-4 pb-2">
        <KycTierCard currentTier={profile?.kyc_tier || null} completeness={completeness} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.labelKey}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                whileHover={{ y: -4, scale: 1.05, boxShadow: '0 8px 24px hsl(160 30% 12% / 0.12)' }}
                whileTap={{ scale: 0.93 }}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border transition-colors"
              >
                <motion.div
                  className={`h-10 w-10 rounded-xl ${action.color} flex items-center justify-center`}
                  whileHover={{ rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </motion.div>
                <span className="text-[11px] font-medium text-foreground text-center leading-tight">
                  {t(action.labelKey)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Accounts Preview */}
      <div className="px-4 pb-3">
        <h3 className="text-sm font-bold text-foreground mb-2">{t('retail.myAccounts')}</h3>
        {accountsLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-2">
            {accounts.map((acc) => {
              const Icon = acc.account_type === 'savings' ? PiggyBank : Wallet;
              return (
                <div key={acc.id} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{acc.product_name}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">{acc.account_type}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    {formatAmount(acc.available_balance || 0)}{' '}
                    <span className="text-muted-foreground text-[10px]">{t('common.etb')}</span>
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Loan Repayment Tracker */}
      <div className="px-4 pb-3">
        <LoanRepaymentTracker />
      </div>

      {/* Recent Transactions */}
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-foreground">{t('retail.transactions')}</h3>
          <button onClick={() => navigate('/retail/transactions')} className="text-xs font-medium text-primary">
            {t('common.viewAll') || 'View all'}
          </button>
        </div>
        {txnLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t('retail.noTransactions') || 'No transactions yet'}</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const Icon = iconMap[tx.transaction_type] || CircleDollarSign;
              const isCredit = tx.direction === 'credit';
              const timeAgo = tx.created_at
                ? formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })
                : '';
              return (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {tx.description || tx.transaction_type}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{timeAgo}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-bold ${isCredit ? 'text-success' : 'text-foreground'}`}>
                    {isCredit ? '+' : '-'}{formatAmount(tx.amount)} {t('common.etb')}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MobilePortalLayout>
    <NisirAIWidget portal="retail" />
    </>
  );
};

export default RetailHome;
