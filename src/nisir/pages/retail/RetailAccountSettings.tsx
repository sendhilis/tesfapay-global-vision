import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAccounts } from '@/hooks/useAccounts';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@/components/MobilePortalLayout';
import { motion } from 'framer-motion';
import {
  Home, Wallet, CreditCard, HandCoins, HelpCircle,
  Loader2, Snowflake, Shield, Bell, Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/retail' },
  { icon: <Wallet className="h-5 w-5" />, labelKey: 'common.accounts', path: '/retail/accounts' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/retail/payments' },
  { icon: <HandCoins className="h-5 w-5" />, labelKey: 'common.loans', path: '/retail/loans' },
  { icon: <HelpCircle className="h-5 w-5" />, labelKey: 'common.support', path: '/retail/support' },
];

const RetailAccountSettings = () => {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { accounts, loading, refetch } = useAccounts();
  const account = accounts.find((a) => a.id === accountId);

  const [dailyLimit, setDailyLimit] = useState(String(account?.daily_limit || 50000));
  const [monthlyLimit, setMonthlyLimit] = useState(String(account?.monthly_limit || 500000));
  const [saving, setSaving] = useState(false);
  const [freezing, setFreezing] = useState(false);

  const isFrozen = account?.status === 'frozen';

  const handleSaveLimits = async () => {
    if (!accountId) return;
    setSaving(true);
    const { error } = await supabase
      .from('accounts')
      .update({
        daily_limit: parseFloat(dailyLimit) || 50000,
        monthly_limit: parseFloat(monthlyLimit) || 500000,
      })
      .eq('id', accountId);
    setSaving(false);
    if (error) {
      toast.error(t('accounts.settingsError'));
    } else {
      toast.success(t('accounts.settingsSaved'));
      refetch();
    }
  };

  const handleToggleFreeze = async () => {
    if (!accountId) return;
    setFreezing(true);
    const newStatus = isFrozen ? 'active' : 'frozen';
    const { error } = await supabase
      .from('accounts')
      .update({ status: newStatus })
      .eq('id', accountId);
    setFreezing(false);
    if (error) {
      toast.error(t('accounts.settingsError'));
    } else {
      toast.success(isFrozen ? t('accounts.unfrozen') : t('accounts.frozen'));
      refetch();
    }
  };

  if (loading || !account) {
    return (
      <MobilePortalLayout portalName="Nisir" portalColor="retail" navItems={navItems} showBack backPath={`/retail/accounts/${accountId}`}>
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </MobilePortalLayout>
    );
  }

  return (
    <MobilePortalLayout portalName="Nisir" portalColor="retail" navItems={navItems} showBack backPath={`/retail/accounts/${accountId}`}>
      <div className="px-4 pt-4 pb-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-foreground">{t('accounts.settings')}</h2>
          <p className="text-sm text-muted-foreground">{account.product_name} · {account.account_number}</p>
        </div>

        {/* Transaction Limits */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">{t('accounts.transactionLimits')}</h3>
          </div>
          <div>
            <Label className="text-xs">{t('accounts.dailyLimit')}</Label>
            <Input type="number" value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">{t('accounts.monthlyLimit')}</Label>
            <Input type="number" value={monthlyLimit} onChange={(e) => setMonthlyLimit(e.target.value)} className="mt-1" />
          </div>
          <Button onClick={handleSaveLimits} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('accounts.saveLimits')}
          </Button>
        </motion.div>

        {/* Freeze / Unfreeze */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Snowflake className={`h-5 w-5 ${isFrozen ? 'text-info' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-sm font-bold text-foreground">{t('accounts.freezeAccount')}</p>
                <p className="text-[11px] text-muted-foreground">{t('accounts.freezeDesc')}</p>
              </div>
            </div>
            <Button
              variant={isFrozen ? 'default' : 'destructive'}
              size="sm"
              onClick={handleToggleFreeze}
              disabled={freezing}
            >
              {freezing ? <Loader2 className="h-4 w-4 animate-spin" /> : isFrozen ? t('accounts.unfreeze') : t('accounts.freeze')}
            </Button>
          </div>
        </motion.div>

        {isFrozen && (
          <div className="rounded-xl bg-info/10 border border-info/20 p-3">
            <p className="text-xs text-info font-medium">{t('accounts.frozenWarning')}</p>
          </div>
        )}
      </div>
    </MobilePortalLayout>
  );
};

export default RetailAccountSettings;
