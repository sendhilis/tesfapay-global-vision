import { useLanguage } from '@nisir/contexts/LanguageContext';
import { useAccounts } from '@nisir/hooks/useAccounts';
import MobilePortalLayout from '@nisir/components/MobilePortalLayout';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Home, Wallet, CreditCard, HandCoins, HelpCircle,
  PiggyBank, Loader2, Building2, TrendingUp, ChevronRight, Plus, ArrowLeftRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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

const RetailAccounts = () => {
  const { t } = useLanguage();
  const { accounts, loading, totalBalance } = useAccounts();
  const navigate = useNavigate();
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

  return (
    <MobilePortalLayout portalName="Nisir" portalColor="retail" navItems={navItems} showBack backPath="/retail">
      <div className="px-4 pt-4">
        <h2 className="text-lg font-bold text-foreground mb-1">{t('retail.myAccounts')}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t('retail.totalBalance') || 'Total Balance'}: <span className="font-bold text-foreground">{fmt(totalBalance)} {t('common.etb')}</span>
        </p>
        <div className="flex gap-2 mb-2">
          <Button size="sm" onClick={() => navigate('/retail/accounts/open')} className="text-xs gap-1.5">
            <Plus className="h-3.5 w-3.5" /> {t('accounts.openNew')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/retail/accounts/transfer')} className="text-xs gap-1.5">
            <ArrowLeftRight className="h-3.5 w-3.5" /> {t('accounts.ownTransfer')}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="px-4 space-y-3 pb-6">
          {accounts.map((acc, i) => {
            const Icon = iconForType[acc.account_type] || Wallet;
            return (
              <motion.div
                key={acc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/retail/accounts/${acc.id}`)}
                className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{acc.product_name}</p>
                      <p className="text-[11px] text-muted-foreground">{acc.account_number}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground">{t('retail.available') || 'Available'}</p>
                    <p className="text-sm font-bold text-foreground">{fmt(acc.available_balance || 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">{t('retail.book') || 'Book'}</p>
                    <p className="text-sm font-semibold text-foreground">{fmt(acc.balance || 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">{t('retail.blocked') || 'Blocked'}</p>
                    <p className="text-sm font-semibold text-muted-foreground">{fmt(acc.blocked_balance || 0)}</p>
                  </div>
                </div>
                {acc.interest_rate && acc.interest_rate > 0 && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-[11px] text-success font-medium">{acc.interest_rate}% p.a.</span>
                    <span className="text-[10px] text-muted-foreground capitalize">· {acc.status}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </MobilePortalLayout>
  );
};

export default RetailAccounts;
