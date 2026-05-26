import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts } from '@/hooks/useAccounts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowDown, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props { onBack: () => void; }

const NisirTransferFlow = ({ onBack }: Props) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { accounts, refetch } = useAccounts();
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [fromId, setFromId] = useState('');
  const [toPhone, setToPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [txnRef, setTxnRef] = useState('');

  const fromAccount = accounts.find((a) => a.id === fromId);
  const parsedAmount = parseFloat(amount) || 0;
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });
  const canProceed = fromId && toPhone && parsedAmount > 0 && fromAccount && (fromAccount.available_balance || 0) >= parsedAmount;

  const handleTransfer = async () => {
    if (!user || !fromAccount) return;
    setSubmitting(true);
    const { data, error } = await supabase.rpc('process_transfer', {
      p_from_account_id: fromId,
      p_to_msisdn: toPhone,
      p_amount: parsedAmount,
      p_fee: 0,
      p_description: `Nisir wallet transfer to ${toPhone}`,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    const result = data as any;
    if (!result?.success) { toast.error(result?.error || 'Transfer failed'); return; }
    setTxnRef(result.reference);
    setStep('success');
    refetch();
  };

  if (step === 'success') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-10 px-4">
        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">{t('accounts.transferSuccess')}</h3>
        <p className="text-sm text-muted-foreground">{fmt(parsedAmount)} ETB → {toPhone}</p>
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
      <h2 className="text-lg font-bold text-foreground mb-1">{t('transfer.nisirToNisir')}</h2>
      <p className="text-xs text-muted-foreground mb-4">{t('transfer.nisirToNisirDesc')}</p>

      {step === 'form' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div>
            <Label className="text-xs mb-1.5">{t('accounts.fromAccount')}</Label>
            <select value={fromId} onChange={(e) => setFromId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">{t('accounts.selectAccount')}</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.product_name} - {fmt(a.available_balance || 0)} ETB</option>)}
            </select>
          </div>
          <div className="flex justify-center"><div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><ArrowDown className="h-4 w-4 text-primary" /></div></div>
          <div>
            <Label className="text-xs mb-1.5">{t('transfer.recipientNisirPhone')}</Label>
            <Input type="tel" value={toPhone} onChange={(e) => setToPhone(e.target.value)} placeholder="+251 9XX XXX XXX" />
          </div>
          <div>
            <Label className="text-xs mb-1.5">{t('accounts.amount')}</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min="0" />
            {fromAccount && <p className="text-[11px] text-muted-foreground mt-1">{t('retail.available')}: {fmt(fromAccount.available_balance || 0)} ETB</p>}
          </div>
          <Button className="w-full" disabled={!canProceed} onClick={() => setStep('confirm')}>{t('accounts.reviewTransfer')}</Button>
        </motion.div>
      )}

      {step === 'confirm' && fromAccount && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-4 space-y-2">
            <div className="flex justify-between py-1.5"><span className="text-xs text-muted-foreground">{t('accounts.fromAccount')}</span><span className="text-xs font-semibold">{fromAccount.product_name}</span></div>
            <div className="flex justify-between py-1.5"><span className="text-xs text-muted-foreground">{t('transfer.recipient')}</span><span className="text-xs font-semibold">{toPhone}</span></div>
            <div className="flex justify-between py-1.5"><span className="text-xs text-muted-foreground">{t('transfer.network')}</span><span className="text-xs font-semibold text-primary">Nisir Wallet</span></div>
            <div className="flex justify-between py-1.5 border-t border-border pt-2"><span className="text-xs text-muted-foreground">{t('accounts.amount')}</span><span className="text-sm font-bold text-primary">{fmt(parsedAmount)} ETB</span></div>
            <div className="flex justify-between py-1.5"><span className="text-xs text-muted-foreground">{t('transfer.fee')}</span><span className="text-xs">0.00 ETB</span></div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep('form')}>{t('common.back')}</Button>
            <Button className="flex-1" onClick={handleTransfer} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.confirm')}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default NisirTransferFlow;
