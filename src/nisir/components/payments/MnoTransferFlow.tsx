import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts } from '@/hooks/useAccounts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props { direction: 'send' | 'receive'; onBack: () => void; }

const mnoOperators = [
  { name: 'Telebirr', code: 'TELEBIRR', color: 'bg-emerald-600', fee: 5 },
  { name: 'M-PESA (Safaricom Ethiopia)', code: 'MPESA', color: 'bg-green-700', fee: 10 },
  { name: 'CBE Birr', code: 'CBEBIRR', color: 'bg-blue-700', fee: 3 },
  { name: 'Amole (Dashen)', code: 'AMOLE', color: 'bg-orange-600', fee: 5 },
  { name: 'HelloCash', code: 'HELLOCASH', color: 'bg-yellow-600', fee: 5 },
  { name: 'Kaafi (Coop)', code: 'KAAFI', color: 'bg-teal-600', fee: 4 },
];

const MnoTransferFlow = ({ direction, onBack }: Props) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { accounts, refetch } = useAccounts();
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [accountId, setAccountId] = useState('');
  const [operatorCode, setOperatorCode] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [txnRef, setTxnRef] = useState('');

  const account = accounts.find((a) => a.id === accountId);
  const operator = mnoOperators.find((o) => o.code === operatorCode);
  const parsedAmount = parseFloat(amount) || 0;
  const fee = operator?.fee || 0;
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });
  const isSend = direction === 'send';

  const canProceed = accountId && operatorCode && phone && parsedAmount > 0 &&
    (!isSend || (account && (account.available_balance || 0) >= parsedAmount + fee));

  const handleSubmit = async () => {
    if (!user || !account || !operator) return;
    setSubmitting(true);

    if (isSend) {
      // Debit Nisir wallet, simulated credit to MNO
      const { error } = await supabase.from('accounts').update({
        balance: (account.balance || 0) - (parsedAmount + fee),
        available_balance: (account.available_balance || 0) - (parsedAmount + fee),
      }).eq('id', accountId);
      if (error) { toast.error('Transfer failed'); setSubmitting(false); return; }

      const ref = 'MNO-' + crypto.randomUUID().substring(0, 12);
      await supabase.from('transactions').insert({
        account_id: accountId,
        profile_id: user.id,
        transaction_type: 'transfer' as const,
        amount: parsedAmount,
        fee,
        direction: 'debit' as const,
        status: 'completed' as const,
        reference: ref,
        description: `Transfer to ${operator.name} (${phone})`,
        recipient_msisdn: phone,
        recipient_name: operator.name,
      });
      setTxnRef(ref);
    } else {
      // Receive: credit Nisir wallet from MNO (simulated)
      const { error } = await supabase.from('accounts').update({
        balance: (account.balance || 0) + parsedAmount,
        available_balance: (account.available_balance || 0) + parsedAmount,
      }).eq('id', accountId);
      if (error) { toast.error('Receive failed'); setSubmitting(false); return; }

      const ref = 'MNR-' + crypto.randomUUID().substring(0, 12);
      await supabase.from('transactions').insert({
        account_id: accountId,
        profile_id: user.id,
        transaction_type: 'transfer' as const,
        amount: parsedAmount,
        fee: 0,
        direction: 'credit' as const,
        status: 'completed' as const,
        reference: ref,
        description: `Received from ${operator.name} (${phone})`,
        recipient_msisdn: phone,
      });
      setTxnRef(ref);
    }

    setSubmitting(false);
    setStep('success');
    refetch();
  };

  if (step === 'success') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-10 px-4">
        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-4"><Check className="h-8 w-8 text-success" /></div>
        <h3 className="text-lg font-bold text-foreground mb-1">{isSend ? t('transfer.sentSuccess') : t('transfer.receiveSuccess')}</h3>
        <p className="text-sm text-muted-foreground">{fmt(parsedAmount)} ETB {isSend ? '→' : '←'} {operator?.name}</p>
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
      <h2 className="text-lg font-bold text-foreground mb-1">{isSend ? t('transfer.sendToMno') : t('transfer.receiveFromMno')}</h2>
      <p className="text-xs text-muted-foreground mb-4">{isSend ? t('transfer.sendToMnoDesc') : t('transfer.receiveFromMnoDesc')}</p>

      {step === 'form' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Operator selection as grid */}
          <div>
            <Label className="text-xs mb-2">{t('transfer.selectOperator')}</Label>
            <div className="grid grid-cols-2 gap-2">
              {mnoOperators.map((op) => (
                <button key={op.code} onClick={() => setOperatorCode(op.code)}
                  className={`p-3 rounded-xl border text-left transition-all ${operatorCode === op.code ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card hover:bg-muted'}`}>
                  <div className={`h-8 w-8 rounded-lg ${op.color} flex items-center justify-center mb-1.5`}>
                    <span className="text-[10px] font-bold text-white">{op.code.slice(0, 2)}</span>
                  </div>
                  <p className="text-xs font-bold text-foreground">{op.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t('transfer.fee')}: {op.fee} ETB</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1.5">{isSend ? t('accounts.fromAccount') : t('transfer.depositTo')}</Label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">{t('accounts.selectAccount')}</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.product_name} - {fmt(a.available_balance || 0)} ETB</option>)}
            </select>
          </div>

          <div>
            <Label className="text-xs mb-1.5">{isSend ? t('transfer.recipientPhone') : t('transfer.senderPhone')}</Label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251 9XX XXX XXX" />
          </div>

          <div>
            <Label className="text-xs mb-1.5">{t('accounts.amount')}</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min="0" />
            {isSend && account && <p className="text-[11px] text-muted-foreground mt-1">{t('retail.available')}: {fmt(account.available_balance || 0)} ETB</p>}
          </div>

          <Button className="w-full" disabled={!canProceed} onClick={() => setStep('confirm')}>{t('accounts.reviewTransfer')}</Button>
        </motion.div>
      )}

      {step === 'confirm' && account && operator && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-4 space-y-2">
            <div className="flex justify-between py-1.5"><span className="text-xs text-muted-foreground">{t('transfer.operator')}</span><span className="text-xs font-semibold">{operator.name}</span></div>
            <div className="flex justify-between py-1.5"><span className="text-xs text-muted-foreground">{t('transfer.phone')}</span><span className="text-xs font-semibold">{phone}</span></div>
            <div className="flex justify-between py-1.5"><span className="text-xs text-muted-foreground">{isSend ? t('accounts.fromAccount') : t('transfer.depositTo')}</span><span className="text-xs font-semibold">{account.product_name}</span></div>
            <div className="flex justify-between py-1.5 border-t border-border pt-2"><span className="text-xs text-muted-foreground">{t('accounts.amount')}</span><span className="text-sm font-bold text-primary">{fmt(parsedAmount)} ETB</span></div>
            {isSend && <div className="flex justify-between py-1.5"><span className="text-xs text-muted-foreground">{t('transfer.fee')}</span><span className="text-xs">{fmt(fee)} ETB</span></div>}
            {isSend && <div className="flex justify-between py-1.5"><span className="text-xs font-bold">{t('transfer.total')}</span><span className="text-sm font-bold">{fmt(parsedAmount + fee)} ETB</span></div>}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep('form')}>{t('common.back')}</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.confirm')}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MnoTransferFlow;
