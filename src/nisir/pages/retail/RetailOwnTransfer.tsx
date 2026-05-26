import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts } from '@/hooks/useAccounts';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@/components/MobilePortalLayout';
import { motion } from 'framer-motion';
import {
  Home, Wallet, CreditCard, HandCoins, HelpCircle,
  ArrowLeftRight, Loader2, Check, ArrowDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/retail' },
  { icon: <Wallet className="h-5 w-5" />, labelKey: 'common.accounts', path: '/retail/accounts' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/retail/payments' },
  { icon: <HandCoins className="h-5 w-5" />, labelKey: 'common.loans', path: '/retail/loans' },
  { icon: <HelpCircle className="h-5 w-5" />, labelKey: 'common.support', path: '/retail/support' },
];

const RetailOwnTransfer = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { accounts, refetch } = useAccounts();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preselectedFrom = searchParams.get('from') || '';

  const [fromId, setFromId] = useState(preselectedFrom);
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState('');

  const fromAccount = accounts.find((a) => a.id === fromId);
  const toAccount = accounts.find((a) => a.id === toId);
  const parsedAmount = parseFloat(amount) || 0;
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

  const eligibleToAccounts = accounts.filter((a) => a.id !== fromId);

  const canProceed = fromId && toId && parsedAmount > 0 && fromAccount && (fromAccount.available_balance || 0) >= parsedAmount;

  const handleTransfer = async () => {
    if (!user || !fromAccount || !toAccount) return;
    setSubmitting(true);

    // Debit from account
    const { error: debitErr } = await supabase
      .from('accounts')
      .update({
        balance: (fromAccount.balance || 0) - parsedAmount,
        available_balance: (fromAccount.available_balance || 0) - parsedAmount,
      })
      .eq('id', fromId);

    if (debitErr) {
      toast.error(t('accounts.transferError'));
      setSubmitting(false);
      return;
    }

    // Credit to account
    await supabase
      .from('accounts')
      .update({
        balance: (toAccount.balance || 0) + parsedAmount,
        available_balance: (toAccount.available_balance || 0) + parsedAmount,
      })
      .eq('id', toId);

    const ref = 'TXN-' + crypto.randomUUID().substring(0, 12);

    // Record transactions
    await supabase.from('transactions').insert([
      {
        account_id: fromId,
        profile_id: user.id,
        transaction_type: 'transfer' as const,
        amount: parsedAmount,
        direction: 'debit' as const,
        status: 'completed' as const,
        reference: ref,
        description: `Transfer to ${toAccount.product_name}`,
      },
      {
        account_id: toId,
        profile_id: user.id,
        transaction_type: 'transfer' as const,
        amount: parsedAmount,
        direction: 'credit' as const,
        status: 'completed' as const,
        reference: ref,
        description: `Received from ${fromAccount.product_name}`,
      },
    ]);

    setReference(ref);
    setSubmitting(false);
    setStep('success');
    refetch();
  };

  return (
    <MobilePortalLayout portalName="Nisir" portalColor="retail" navItems={navItems} showBack backPath="/retail/accounts">
      <div className="px-4 pt-4 pb-6">
        <h2 className="text-lg font-bold text-foreground mb-1">{t('accounts.ownTransfer')}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t('accounts.ownTransferDesc')}</p>

        {step === 'form' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* From Account */}
            <div>
              <Label className="text-xs mb-1.5">{t('accounts.fromAccount')}</Label>
              <select
                value={fromId}
                onChange={(e) => { setFromId(e.target.value); if (toId === e.target.value) setToId(''); }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">{t('accounts.selectAccount')}</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.product_name} - {fmt(a.available_balance || 0)} ETB</option>
                ))}
              </select>
            </div>

            <div className="flex justify-center">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <ArrowDown className="h-4 w-4 text-primary" />
              </div>
            </div>

            {/* To Account */}
            <div>
              <Label className="text-xs mb-1.5">{t('accounts.toAccount')}</Label>
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={!fromId}
              >
                <option value="">{t('accounts.selectAccount')}</option>
                {eligibleToAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.product_name} - {fmt(a.available_balance || 0)} ETB</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <Label className="text-xs mb-1.5">{t('accounts.amount')}</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
              />
              {fromAccount && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t('retail.available')}: {fmt(fromAccount.available_balance || 0)} ETB
                </p>
              )}
            </div>

            <Button className="w-full" disabled={!canProceed} onClick={() => setStep('confirm')}>
              {t('accounts.reviewTransfer')}
            </Button>
          </motion.div>
        )}

        {step === 'confirm' && fromAccount && toAccount && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <h3 className="text-sm font-bold text-foreground">{t('accounts.confirmTransfer')}</h3>
              <div className="divide-y divide-border">
                <div className="flex justify-between py-2">
                  <span className="text-xs text-muted-foreground">{t('accounts.fromAccount')}</span>
                  <span className="text-xs font-semibold text-foreground">{fromAccount.product_name}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-xs text-muted-foreground">{t('accounts.toAccount')}</span>
                  <span className="text-xs font-semibold text-foreground">{toAccount.product_name}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-xs text-muted-foreground">{t('accounts.amount')}</span>
                  <span className="text-sm font-bold text-primary">{fmt(parsedAmount)} ETB</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('form')}>
                {t('common.back')}
              </Button>
              <Button className="flex-1" onClick={handleTransfer} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.confirm')}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-8 space-y-4">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
              <Check className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-lg font-bold text-foreground">{t('accounts.transferSuccess')}</h3>
            <p className="text-sm text-muted-foreground">{fmt(parsedAmount)} ETB</p>
            <p className="text-xs text-muted-foreground">Ref: {reference}</p>
            <Button className="w-full mt-4" onClick={() => navigate('/retail/accounts')}>
              {t('accounts.backToAccounts')}
            </Button>
          </motion.div>
        )}
      </div>
    </MobilePortalLayout>
  );
};

export default RetailOwnTransfer;
