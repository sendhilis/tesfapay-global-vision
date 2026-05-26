import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import { useAuth } from '@nisir/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@nisir/components/MobilePortalLayout';
import { motion } from 'framer-motion';
import {
  Home, Wallet, CreditCard, HandCoins, HelpCircle,
  PiggyBank, Building2, Check, Loader2, ChevronRight
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

type AccountProduct = {
  type: 'savings' | 'current' | 'wallet';
  nameKey: string;
  descKey: string;
  icon: any;
  interestRate: number;
  minBalance: number;
  features: string[];
};

const products: AccountProduct[] = [
  {
    type: 'savings',
    nameKey: 'accounts.product.savings',
    descKey: 'accounts.product.savingsDesc',
    icon: PiggyBank,
    interestRate: 7.5,
    minBalance: 100,
    features: ['7.5% annual interest', 'Free monthly statement', 'Mobile access'],
  },
  {
    type: 'current',
    nameKey: 'accounts.product.current',
    descKey: 'accounts.product.currentDesc',
    icon: Building2,
    interestRate: 0,
    minBalance: 500,
    features: ['Unlimited transactions', 'Cheque book', 'Higher daily limits'],
  },
  {
    type: 'wallet',
    nameKey: 'accounts.product.wallet',
    descKey: 'accounts.product.walletDesc',
    icon: Wallet,
    interestRate: 0,
    minBalance: 0,
    features: ['Instant transfers', 'QR payments', 'Zero minimum balance'],
  },
];

const RetailOpenAccount = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'select' | 'confirm'>('select');
  const [selected, setSelected] = useState<AccountProduct | null>(null);
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!user || !selected) return;
    setSubmitting(true);

    const productName = nickname.trim() || t(selected.nameKey);

    const { error } = await supabase.from('accounts').insert({
      profile_id: user.id,
      account_type: selected.type,
      product_name: productName,
      balance: 0,
      available_balance: 0,
      is_primary: false,
      interest_rate: selected.interestRate,
      daily_limit: selected.type === 'current' ? 100000 : 50000,
      monthly_limit: selected.type === 'current' ? 1000000 : 500000,
    });

    setSubmitting(false);

    if (error) {
      toast.error(t('accounts.createError'));
    } else {
      toast.success(t('accounts.createSuccess'));
      navigate('/retail/accounts');
    }
  };

  return (
    <MobilePortalLayout portalName="Nisir" portalColor="retail" navItems={navItems} showBack backPath="/retail/accounts">
      <div className="px-4 pt-4 pb-6">
        <h2 className="text-lg font-bold text-foreground mb-1">{t('accounts.openNew')}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t('accounts.openNewDesc')}</p>

        {step === 'select' && (
          <div className="space-y-3">
            {products.map((product, i) => {
              const ProductIcon = product.icon;
              const isSelected = selected?.type === product.type;
              return (
                <motion.button
                  key={product.type}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelected(product)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary/15' : 'bg-muted'}`}>
                        <ProductIcon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{t(product.nameKey)}</p>
                        <p className="text-[11px] text-muted-foreground">{t(product.descKey)}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    {product.features.map((f, j) => (
                      <p key={j} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-success" /> {f}
                      </p>
                    ))}
                  </div>
                  {product.interestRate > 0 && (
                    <p className="text-xs font-semibold text-success mt-2">{product.interestRate}% p.a. interest</p>
                  )}
                  {product.minBalance > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-1">Min. balance: {product.minBalance} ETB</p>
                  )}
                </motion.button>
              );
            })}

            <Button
              className="w-full mt-4"
              disabled={!selected}
              onClick={() => setStep('confirm')}
            >
              {t('common.next')} <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {step === 'confirm' && selected && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <selected.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{t(selected.nameKey)}</p>
                  <p className="text-[11px] text-muted-foreground">{t(selected.descKey)}</p>
                </div>
              </div>
              <div className="divide-y divide-border">
                <div className="flex justify-between py-2">
                  <span className="text-xs text-muted-foreground">{t('accounts.type')}</span>
                  <span className="text-xs font-semibold text-foreground capitalize">{selected.type}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-xs text-muted-foreground">{t('accounts.interestRate')}</span>
                  <span className="text-xs font-semibold text-foreground">{selected.interestRate}%</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-xs text-muted-foreground">{t('accounts.currency')}</span>
                  <span className="text-xs font-semibold text-foreground">ETB</span>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs">{t('accounts.nickname')}</Label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t('accounts.nicknamePlaceholder')}
                className="mt-1"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('select')}>
                {t('common.back')}
              </Button>
              <Button className="flex-1" onClick={handleCreate} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('accounts.createAccount')}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </MobilePortalLayout>
  );
};

export default RetailOpenAccount;
