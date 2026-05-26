import { useState } from 'react';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import { useAuth } from '@nisir/hooks/useAuth';
import { useAccounts } from '@nisir/hooks/useAccounts';
import MobilePortalLayout from '@nisir/components/MobilePortalLayout';
import { supabase } from '@/integrations/supabase/client';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Home, Wallet, CreditCard, HandCoins, HelpCircle,
  Send, Receipt, Smartphone, ArrowLeft, Check, Loader2
} from 'lucide-react';
import PaymentHub from '@nisir/components/payments/PaymentHub';
import NisirTransferFlow from '@nisir/components/payments/NisirTransferFlow';
import BankDepositFlow from '@nisir/components/payments/BankDepositFlow';
import MnoTransferFlow from '@nisir/components/payments/MnoTransferFlow';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/retail' },
  { icon: <Wallet className="h-5 w-5" />, labelKey: 'common.accounts', path: '/retail/accounts' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/retail/payments' },
  { icon: <HandCoins className="h-5 w-5" />, labelKey: 'common.loans', path: '/retail/loans' },
  { icon: <HelpCircle className="h-5 w-5" />, labelKey: 'common.support', path: '/retail/support' },
];

type PaymentMode = 'hub' | 'nisir-transfer' | 'bank-deposit' | 'mno-send' | 'mno-receive' | 'send' | 'bills' | 'airtime';
type FlowStep = 'form' | 'confirm' | 'success';

const billers = [
  { name: 'Ethiopian Electric Utility', category: 'utility' },
  { name: 'Addis Ababa Water Authority', category: 'utility' },
  { name: 'Ethio Telecom', category: 'telecom' },
  { name: 'Revenue Authority (Tax)', category: 'government' },
  { name: 'DSTV Ethiopia', category: 'entertainment' },
  { name: 'Ethiopian Airlines', category: 'travel' },
];

const airtimeDenominations = [10, 25, 50, 100, 200, 500, 1000];

const RetailPayments = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { accounts, refetch } = useAccounts();
  const [mode, setMode] = useState<PaymentMode>('hub');
  const [step, setStep] = useState<FlowStep>('form');
  const [submitting, setSubmitting] = useState(false);
  const [txnRef, setTxnRef] = useState('');

  // Send money state
  const [recipientPhone, setRecipientPhone] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Bill payment state
  const [selectedBiller, setSelectedBiller] = useState('');
  const [billerAccount, setBillerAccount] = useState('');
  const [billAmount, setBillAmount] = useState('');

  // Airtime state
  const [airtimePhone, setAirtimePhone] = useState('');
  const [airtimeAmount, setAirtimeAmount] = useState(0);

  const primaryAccount = accounts.find((a) => a.is_primary) || accounts[0];
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

  const resetForm = () => {
    setStep('form');
    setRecipientPhone(''); setSendAmount('');
    setSelectedBiller(''); setBillerAccount(''); setBillAmount('');
    setAirtimePhone(''); setAirtimeAmount(0); setTxnRef('');
  };

  const goHub = () => { resetForm(); setMode('hub'); };

  const handleSendMoney = async () => {
    if (!user || !primaryAccount) return;
    setSubmitting(true);
    const { data, error } = await supabase.rpc('process_transfer', {
      p_from_account_id: selectedAccountId || primaryAccount.id,
      p_to_msisdn: recipientPhone, p_amount: parseFloat(sendAmount), p_fee: 0,
      p_description: `Transfer to ${recipientPhone}`,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    const result = data as any;
    if (!result?.success) { toast.error(result?.error || 'Transfer failed'); return; }
    setTxnRef(result.reference); setStep('success'); refetch();
  };

  const handlePayBill = async () => {
    if (!user || !primaryAccount) return;
    setSubmitting(true);
    const { data, error } = await supabase.rpc('process_bill_payment', {
      p_account_id: selectedAccountId || primaryAccount.id,
      p_biller_name: selectedBiller, p_biller_account: billerAccount,
      p_amount: parseFloat(billAmount), p_fee: 5,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    const result = data as any;
    if (!result?.success) { toast.error(result?.error || 'Payment failed'); return; }
    setTxnRef(result.reference); setStep('success'); refetch();
  };

  const handleBuyAirtime = async () => {
    if (!user || !primaryAccount) return;
    setSubmitting(true);
    const { data, error } = await supabase.rpc('process_airtime_purchase', {
      p_account_id: selectedAccountId || primaryAccount.id,
      p_phone: airtimePhone, p_amount: airtimeAmount, p_operator: 'Ethio Telecom',
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    const result = data as any;
    if (!result?.success) { toast.error(result?.error || 'Purchase failed'); return; }
    setTxnRef(result.reference); setStep('success'); refetch();
  };

  const SuccessView = () => (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-10 px-6">
      <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-4"><Check className="h-8 w-8 text-success" /></div>
      <h3 className="text-lg font-bold text-foreground mb-1">{t('payment.success') || 'Transaction Successful!'}</h3>
      <p className="text-sm text-muted-foreground mb-4">{t('payment.reference') || 'Reference'}: {txnRef}</p>
      <button onClick={goHub} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">{t('payment.done') || 'Done'}</button>
    </motion.div>
  );

  const AccountSelector = () => (
    <div className="mb-4">
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('payment.fromAccount') || 'From Account'}</label>
      <select value={selectedAccountId || primaryAccount?.id || ''} onChange={(e) => setSelectedAccountId(e.target.value)}
        className="w-full py-3 px-3 rounded-xl border border-border bg-card text-foreground text-sm">
        {accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.product_name} — {fmt(acc.available_balance || 0)} {t('common.etb')}</option>)}
      </select>
    </div>
  );

  return (
    <MobilePortalLayout portalName="Nisir" portalColor="retail" navItems={navItems} showBack backPath="/retail">
      <AnimatePresence mode="wait">
        {mode === 'hub' && <PaymentHub onSelect={(m) => { resetForm(); setMode(m); }} />}

        {mode === 'nisir-transfer' && <NisirTransferFlow onBack={goHub} />}
        {mode === 'bank-deposit' && <BankDepositFlow onBack={goHub} />}
        {mode === 'mno-send' && <MnoTransferFlow direction="send" onBack={goHub} />}
        {mode === 'mno-receive' && <MnoTransferFlow direction="receive" onBack={goHub} />}

        {/* Legacy Send Money (P2P by phone) */}
        {mode === 'send' && step !== 'success' && (
          <motion.div key="send" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4 pt-4 pb-6">
            <button onClick={() => step === 'form' ? goHub() : setStep('form')} className="flex items-center gap-1 text-sm text-primary mb-4"><ArrowLeft className="h-4 w-4" /> {t('common.back')}</button>
            <h2 className="text-lg font-bold text-foreground mb-4">{t('retail.sendMoney')}</h2>
            {step === 'form' && (
              <div className="space-y-4">
                <AccountSelector />
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('payment.recipientPhone') || 'Recipient Phone'}</label>
                  <input type="tel" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} className="w-full py-3 px-3 rounded-xl border border-border bg-card text-foreground text-sm" placeholder="+251 9XX XXX XXX" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('payment.amount') || 'Amount'} ({t('common.etb')})</label>
                  <input type="number" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} className="w-full py-3 px-3 rounded-xl border border-border bg-card text-foreground text-sm" placeholder="0.00" />
                </div>
                <button onClick={() => setStep('confirm')} disabled={!recipientPhone || !sendAmount || parseFloat(sendAmount) <= 0}
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">{t('common.next')}</button>
              </div>
            )}
            {step === 'confirm' && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">To</span><span className="font-medium text-foreground">{recipientPhone}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount</span><span className="font-bold text-foreground">{fmt(parseFloat(sendAmount))} {t('common.etb')}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Fee</span><span className="text-foreground">0.00 {t('common.etb')}</span></div>
                  <div className="border-t border-border pt-2 flex justify-between text-sm"><span className="font-bold text-foreground">Total</span><span className="font-bold text-foreground">{fmt(parseFloat(sendAmount))} {t('common.etb')}</span></div>
                </div>
                <button onClick={handleSendMoney} disabled={submitting} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : t('common.confirm')}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* PAY BILLS */}
        {mode === 'bills' && step !== 'success' && (
          <motion.div key="bills" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4 pt-4 pb-6">
            <button onClick={() => step === 'form' ? goHub() : setStep('form')} className="flex items-center gap-1 text-sm text-primary mb-4"><ArrowLeft className="h-4 w-4" /> {t('common.back')}</button>
            <h2 className="text-lg font-bold text-foreground mb-4">{t('retail.payBills')}</h2>
            {step === 'form' && (
              <div className="space-y-4">
                <AccountSelector />
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('payment.selectBiller') || 'Select Biller'}</label>
                  <select value={selectedBiller} onChange={(e) => setSelectedBiller(e.target.value)} className="w-full py-3 px-3 rounded-xl border border-border bg-card text-foreground text-sm">
                    <option value="">-- Select --</option>
                    {billers.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('payment.billerAccount') || 'Account/Meter Number'}</label>
                  <input type="text" value={billerAccount} onChange={(e) => setBillerAccount(e.target.value)} className="w-full py-3 px-3 rounded-xl border border-border bg-card text-foreground text-sm" placeholder="Enter account number" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('payment.amount') || 'Amount'} ({t('common.etb')})</label>
                  <input type="number" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} className="w-full py-3 px-3 rounded-xl border border-border bg-card text-foreground text-sm" placeholder="0.00" />
                </div>
                <button onClick={() => setStep('confirm')} disabled={!selectedBiller || !billerAccount || !billAmount}
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">{t('common.next')}</button>
              </div>
            )}
            {step === 'confirm' && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Biller</span><span className="font-medium text-foreground">{selectedBiller}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Account</span><span className="font-medium text-foreground">{billerAccount}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount</span><span className="font-bold text-foreground">{fmt(parseFloat(billAmount))} {t('common.etb')}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Fee</span><span className="text-foreground">5.00 {t('common.etb')}</span></div>
                  <div className="border-t border-border pt-2 flex justify-between text-sm"><span className="font-bold text-foreground">Total</span><span className="font-bold text-foreground">{fmt(parseFloat(billAmount) + 5)} {t('common.etb')}</span></div>
                </div>
                <button onClick={handlePayBill} disabled={submitting} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : t('common.confirm')}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* BUY AIRTIME */}
        {mode === 'airtime' && step !== 'success' && (
          <motion.div key="airtime" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4 pt-4 pb-6">
            <button onClick={() => step === 'form' ? goHub() : setStep('form')} className="flex items-center gap-1 text-sm text-primary mb-4"><ArrowLeft className="h-4 w-4" /> {t('common.back')}</button>
            <h2 className="text-lg font-bold text-foreground mb-4">{t('retail.buyAirtime')}</h2>
            {step === 'form' && (
              <div className="space-y-4">
                <AccountSelector />
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('payment.phoneNumber') || 'Phone Number'}</label>
                  <input type="tel" value={airtimePhone} onChange={(e) => setAirtimePhone(e.target.value)} className="w-full py-3 px-3 rounded-xl border border-border bg-card text-foreground text-sm" placeholder="+251 9XX XXX XXX" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('payment.selectAmount') || 'Select Amount'} ({t('common.etb')})</label>
                  <div className="grid grid-cols-4 gap-2">
                    {airtimeDenominations.map((d) => (
                      <button key={d} onClick={() => setAirtimeAmount(d)}
                        className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${airtimeAmount === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-muted'}`}>{d}</button>
                    ))}
                  </div>
                </div>
                <button onClick={() => setStep('confirm')} disabled={!airtimePhone || airtimeAmount <= 0}
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">{t('common.next')}</button>
              </div>
            )}
            {step === 'confirm' && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Phone</span><span className="font-medium text-foreground">{airtimePhone}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Operator</span><span className="font-medium text-foreground">Ethio Telecom</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount</span><span className="font-bold text-foreground">{fmt(airtimeAmount)} {t('common.etb')}</span></div>
                </div>
                <button onClick={handleBuyAirtime} disabled={submitting} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : t('common.confirm')}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {step === 'success' && (mode === 'send' || mode === 'bills' || mode === 'airtime') && <SuccessView />}
      </AnimatePresence>
    </MobilePortalLayout>
  );
};

export default RetailPayments;
