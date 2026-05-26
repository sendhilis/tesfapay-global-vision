import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts } from '@/hooks/useAccounts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props { onBack: () => void; }

const ethiopianBanks = [
  { name: 'Commercial Bank of Ethiopia (CBE)', code: 'CBE' },
  { name: 'Awash Bank', code: 'AWASH' },
  { name: 'Dashen Bank', code: 'DASHEN' },
  { name: 'Bank of Abyssinia', code: 'BOA' },
  { name: 'Wegagen Bank', code: 'WEGAGEN' },
  { name: 'United Bank', code: 'UNITED' },
  { name: 'Nib International Bank', code: 'NIB' },
  { name: 'Cooperative Bank of Oromia', code: 'COOP' },
  { name: 'Lion International Bank', code: 'LION' },
  { name: 'Zemen Bank', code: 'ZEMEN' },
  { name: 'Oromia Bank', code: 'OROMIA' },
  { name: 'Bunna Bank', code: 'BUNNA' },
  { name: 'Berhan Bank', code: 'BERHAN' },
  { name: 'Abay Bank', code: 'ABAY' },
  { name: 'Addis International Bank', code: 'ADDIS' },
  { name: 'Debub Global Bank', code: 'DEBUB' },
  { name: 'Enat Bank', code: 'ENAT' },
  { name: 'Hijra Bank', code: 'HIJRA' },
  { name: 'Amhara Bank', code: 'AMHARA' },
  { name: 'Gadaa Bank', code: 'GADAA' },
  { name: 'Siinqee Bank', code: 'SIINQEE' },
  { name: 'Goh Betoch Bank', code: 'GOH' },
  { name: 'Tsehay Bank', code: 'TSEHAY' },
  { name: 'ZamZam Bank', code: 'ZAMZAM' },
];

const BankDepositFlow = ({ onBack }: Props) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { accounts, refetch } = useAccounts();
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [toAccountId, setToAccountId] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [txnRef, setTxnRef] = useState('');

  const toAccount = accounts.find((a) => a.id === toAccountId);
  const selectedBank = ethiopianBanks.find((b) => b.code === bankCode);
  const parsedAmount = parseFloat(amount) || 0;
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });
  const canProceed = toAccountId && bankCode && bankAccountNo && parsedAmount > 0;

  const handleDeposit = async () => {
    if (!user || !toAccount) return;
    setSubmitting(true);
    // Simulate deposit from bank — credit Nisir account
    const { error } = await supabase.from('accounts').update({
      balance: (toAccount.balance || 0) + parsedAmount,
      available_balance: (toAccount.available_balance || 0) + parsedAmount,
    }).eq('id', toAccountId);

    if (error) { toast.error('Deposit failed'); setSubmitting(false); return; }

    const ref = 'DEP-' + crypto.randomUUID().substring(0, 12);
    await supabase.from('transactions').insert({
      account_id: toAccountId,
      profile_id: user.id,
      transaction_type: 'deposit' as const,
      amount: parsedAmount,
      direction: 'credit' as const,
      status: 'completed' as const,
      reference: ref,
      description: `Bank deposit from ${selectedBank?.name} (${bankAccountNo})`,
    });

    setTxnRef(ref);
    setSubmitting(false);
    setStep('success');
    refetch();
  };

  if (step === 'success') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-10 px-4">
        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-4"><Check className="h-8 w-8 text-success" /></div>
        <h3 className="text-lg font-bold text-foreground mb-1">{t('transfer.depositSuccess')}</h3>
        <p className="text-sm text-muted-foreground">{fmt(parsedAmount)} ETB {t('transfer.deposited')}</p>
        <p className="text-xs text-muted-foreground mt-1">Ref: {txnRef}</p>
        <Button className="w-full mt-6" onClick={onBack}>{t('payment.done') || 'Done'}</Button>
      </motion.div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-6">
      <button onClick={() => step === 'form' ? onBack() : setStep('form')} className="flex items-center gap-1 text-sm text-primary mb-4">
        <ArrowLeft className="h-4 w-4" /> {t('common.back')}
      </button>
      <h2 className="text-lg font-bold text-foreground mb-1">{t('transfer.bankDeposit')}</h2>
      <p className="text-xs text-muted-foreground mb-4">{t('transfer.bankDepositDesc')}</p>

      {step === 'form' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div>
            <Label className="text-xs mb-1.5">{t('transfer.selectBank')}</Label>
            <select value={bankCode} onChange={(e) => setBankCode(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">{t('transfer.chooseBank')}</option>
              {ethiopianBanks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs mb-1.5">{t('transfer.bankAccountNumber')}</Label>
            <Input value={bankAccountNo} onChange={(e) => setBankAccountNo(e.target.value)} placeholder="e.g. 1000012345678" />
          </div>
          <div>
            <Label className="text-xs mb-1.5">{t('transfer.depositTo')}</Label>
            <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">{t('accounts.selectAccount')}</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.product_name} - {fmt(a.available_balance || 0)} ETB</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs mb-1.5">{t('accounts.amount')}</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min="0" />
          </div>
          <Button className="w-full" disabled={!canProceed} onClick={() => setStep('confirm')}>{t('accounts.reviewTransfer')}</Button>
        </motion.div>
      )}

      {step === 'confirm' && toAccount && selectedBank && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2"><Building2 className="h-4 w-4 text-primary" /><span className="text-sm font-bold">{selectedBank.name}</span></div>
            <div className="flex justify-between py-1.5"><span className="text-xs text-muted-foreground">{t('transfer.bankAccount')}</span><span className="text-xs font-semibold">{bankAccountNo}</span></div>
            <div className="flex justify-between py-1.5"><span className="text-xs text-muted-foreground">{t('transfer.depositTo')}</span><span className="text-xs font-semibold">{toAccount.product_name}</span></div>
            <div className="flex justify-between py-1.5 border-t border-border pt-2"><span className="text-xs text-muted-foreground">{t('accounts.amount')}</span><span className="text-sm font-bold text-primary">{fmt(parsedAmount)} ETB</span></div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep('form')}>{t('common.back')}</Button>
            <Button className="flex-1" onClick={handleDeposit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.confirm')}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BankDepositFlow;
