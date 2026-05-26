import { useState } from 'react';
import { useAccounts } from '@nisir/hooks/useAccounts';
import { useAuth } from '@nisir/hooks/useAuth';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeftRight, Building2, Smartphone, RefreshCw } from 'lucide-react';
import OtpVerificationDialog from '@nisir/components/OtpVerificationDialog';

const ethiopianBanks = [
  'Commercial Bank of Ethiopia', 'Awash International Bank', 'Dashen Bank',
  'Bank of Abyssinia', 'Wegagen Bank', 'United Bank', 'Nib International Bank',
  'Cooperative Bank of Oromia', 'Lion International Bank', 'Zemen Bank',
  'Bunna International Bank', 'Berhan International Bank', 'Abay Bank',
  'Addis International Bank', 'Debub Global Bank', 'Enat Bank', 'Hijra Bank',
  'ZamZam Bank', 'Siinqee Bank', 'Amhara Bank', 'Gadaa Bank', 'Goh Betoch Bank',
];

const IBTransfers = () => {
  const { accounts, refetch } = useAccounts();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeType, setActiveType] = useState('own');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [showOtp, setShowOtp] = useState(false);

  const transferTypes = [
    { id: 'own', label: t('ib.transfer.ownAccount'), icon: RefreshCw, desc: t('ib.transfer.ownDesc') },
    { id: 'internal', label: t('ib.transfer.withinNisir'), icon: Building2, desc: t('ib.transfer.internalDesc') },
    { id: 'rtgs', label: t('ib.transfer.rtgs'), icon: ArrowLeftRight, desc: t('ib.transfer.rtgsDesc') },
    { id: 'ach', label: t('ib.transfer.ach'), icon: ArrowLeftRight, desc: t('ib.transfer.achDesc') },
    { id: 'mobile', label: t('ib.transfer.mobileWallet'), icon: Smartphone, desc: t('ib.transfer.mobileWalletDesc') },
  ];

  const [formData, setFormData] = useState({
    fromAccount: '', toAccount: '', recipientMsisdn: '', recipientName: '',
    recipientBank: '', recipientAccountNo: '', amount: '', description: '', mobileProvider: 'telebirr',
  });

  const [txRef, setTxRef] = useState('');
  const selectedFrom = accounts.find((a) => a.id === formData.fromAccount);

  const handleTransfer = async () => {
    setLoading(true);
    try {
      const amount = parseFloat(formData.amount);
      if (!amount || amount <= 0) { toast.error('Invalid amount'); setLoading(false); return; }

      if (activeType === 'own') {
        if (formData.fromAccount === formData.toAccount) { toast.error('Select different accounts'); setLoading(false); return; }
        const { error: e1 } = await supabase.from('accounts').update({
          balance: (selectedFrom!.balance || 0) - amount, available_balance: (selectedFrom!.available_balance || 0) - amount,
        }).eq('id', formData.fromAccount);
        const toAcc = accounts.find((a) => a.id === formData.toAccount);
        const { error: e2 } = await supabase.from('accounts').update({
          balance: (toAcc!.balance || 0) + amount, available_balance: (toAcc!.available_balance || 0) + amount,
        }).eq('id', formData.toAccount);
        if (e1 || e2) throw new Error('Transfer failed');
        const ref = 'IB-' + Date.now().toString(36).toUpperCase();
        await supabase.from('transactions').insert([
          { account_id: formData.fromAccount, profile_id: user!.id, transaction_type: 'transfer', amount, fee: 0, direction: 'debit', status: 'completed', reference: ref, description: 'Own account transfer' },
          { account_id: formData.toAccount, profile_id: user!.id, transaction_type: 'transfer', amount, fee: 0, direction: 'credit', status: 'completed', reference: ref, description: 'Own account transfer (credit)' },
        ]);
        setTxRef(ref);
      } else if (activeType === 'internal') {
        const { data, error } = await supabase.rpc('process_transfer', { p_from_account_id: formData.fromAccount, p_to_msisdn: formData.recipientMsisdn, p_amount: amount, p_fee: 0, p_description: formData.description || 'Internal transfer via IB' });
        if (error) throw error;
        const result = data as any;
        if (!result.success) throw new Error(result.error);
        setTxRef(result.reference);
      } else {
        const fee = activeType === 'rtgs' ? 25 : activeType === 'ach' ? 10 : 5;
        const { error: e1 } = await supabase.from('accounts').update({
          balance: (selectedFrom!.balance || 0) - (amount + fee), available_balance: (selectedFrom!.available_balance || 0) - (amount + fee),
        }).eq('id', formData.fromAccount);
        if (e1) throw e1;
        const ref = (activeType === 'rtgs' ? 'RTGS-' : activeType === 'ach' ? 'ACH-' : 'MOB-') + Date.now().toString(36).toUpperCase();
        await supabase.from('transactions').insert({
          account_id: formData.fromAccount, profile_id: user!.id, transaction_type: 'transfer', amount, fee, direction: 'debit',
          status: activeType === 'ach' ? 'pending' : 'completed', reference: ref,
          description: `${activeType.toUpperCase()} transfer to ${formData.recipientName || formData.recipientAccountNo}`,
          recipient_name: formData.recipientName, recipient_account: formData.recipientAccountNo || formData.recipientMsisdn,
        });
        setTxRef(ref);
      }
      setStep('success'); refetch(); toast.success(t('ib.transfer.successful'));
    } catch (err: any) { toast.error(err.message || 'Transfer failed'); } finally { setLoading(false); }
  };

  const resetForm = () => {
    setStep('form');
    setFormData({ fromAccount: '', toAccount: '', recipientMsisdn: '', recipientName: '', recipientBank: '', recipientAccountNo: '', amount: '', description: '', mobileProvider: 'telebirr' });
    setTxRef('');
  };

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Card className="text-center">
          <CardContent className="p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <ArrowLeftRight className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{t('ib.transfer.successful')}</h2>
            <p className="text-sm text-muted-foreground">{t('common.reference')}: <span className="font-mono">{txRef}</span></p>
            <p className="text-2xl font-bold text-foreground">{parseFloat(formData.amount).toLocaleString()} {t('common.etb')}</p>
            <Button onClick={resetForm} className="w-full">{t('ib.transfer.newTransfer')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground">{t('ib.fundTransfers')}</h1>
        <p className="text-sm text-muted-foreground">{t('ib.transfer.sendSecurely')}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {transferTypes.map((tp) => (
          <Card key={tp.id} className={`cursor-pointer transition-all ${activeType === tp.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`} onClick={() => { setActiveType(tp.id); resetForm(); }}>
            <CardContent className="p-3 text-center">
              <tp.icon className={`h-5 w-5 mx-auto mb-1 ${activeType === tp.id ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="text-xs font-medium text-foreground">{tp.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">{transferTypes.find((tp) => tp.id === activeType)?.desc}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">{t('ib.transfer.fromAccount')}</Label>
            <Select value={formData.fromAccount} onValueChange={(v) => setFormData({ ...formData, fromAccount: v })}>
              <SelectTrigger><SelectValue placeholder={t('ib.transfer.selectSource')} /></SelectTrigger>
              <SelectContent>{accounts.map((acc) => (<SelectItem key={acc.id} value={acc.id}>{acc.product_name} — {acc.account_number} ({(acc.available_balance || 0).toLocaleString()} {t('common.etb')})</SelectItem>))}</SelectContent>
            </Select>
          </div>

          {activeType === 'own' && (
            <div className="space-y-1">
              <Label className="text-xs">{t('ib.transfer.toAccount')}</Label>
              <Select value={formData.toAccount} onValueChange={(v) => setFormData({ ...formData, toAccount: v })}>
                <SelectTrigger><SelectValue placeholder={t('ib.transfer.selectDest')} /></SelectTrigger>
                <SelectContent>{accounts.filter((a) => a.id !== formData.fromAccount).map((acc) => (<SelectItem key={acc.id} value={acc.id}>{acc.product_name} — {acc.account_number}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          )}

          {activeType === 'internal' && (
            <div className="space-y-1">
              <Label className="text-xs">{t('ib.transfer.recipientPhone')}</Label>
              <Input placeholder="+251..." value={formData.recipientMsisdn} onChange={(e) => setFormData({ ...formData, recipientMsisdn: e.target.value })} />
            </div>
          )}

          {(activeType === 'rtgs' || activeType === 'ach') && (
            <>
              <div className="space-y-1"><Label className="text-xs">{t('ib.transfer.recipientName')}</Label><Input value={formData.recipientName} onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">{t('ib.transfer.bank')}</Label>
                <Select value={formData.recipientBank} onValueChange={(v) => setFormData({ ...formData, recipientBank: v })}>
                  <SelectTrigger><SelectValue placeholder={t('ib.transfer.selectBank')} /></SelectTrigger>
                  <SelectContent>{ethiopianBanks.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">{t('ib.transfer.accountNumber')}</Label><Input value={formData.recipientAccountNo} onChange={(e) => setFormData({ ...formData, recipientAccountNo: e.target.value })} /></div>
              {activeType === 'rtgs' && <Badge variant="outline" className="text-xs">Min 100,000 {t('common.etb')} • {t('common.fee')}: 25 {t('common.etb')} • Instant</Badge>}
              {activeType === 'ach' && <Badge variant="outline" className="text-xs">{t('common.fee')}: 10 {t('common.etb')} • Next-day settlement</Badge>}
            </>
          )}

          {activeType === 'mobile' && (
            <>
              <div className="space-y-1"><Label className="text-xs">{t('ib.transfer.provider')}</Label>
                <Select value={formData.mobileProvider} onValueChange={(v) => setFormData({ ...formData, mobileProvider: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="telebirr">Telebirr</SelectItem><SelectItem value="mpesa">M-Pesa</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">{t('ib.transfer.phoneNumber')}</Label><Input placeholder="+251..." value={formData.recipientMsisdn} onChange={(e) => setFormData({ ...formData, recipientMsisdn: e.target.value })} /></div>
              <Badge variant="outline" className="text-xs">{t('common.fee')}: 5 {t('common.etb')}</Badge>
            </>
          )}

          <div className="space-y-1"><Label className="text-xs">{t('ib.transfer.amountEtb')}</Label><Input type="number" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} /></div>

          {activeType !== 'own' && (
            <div className="space-y-1"><Label className="text-xs">{t('ib.transfer.description')}</Label><Input placeholder={t('ib.transfer.optional')} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
          )}

          {step === 'form' && (
            <Button className="w-full" disabled={!formData.fromAccount || !formData.amount} onClick={() => setStep('confirm')}>{t('common.continue')}</Button>
          )}

          {step === 'confirm' && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <h3 className="text-sm font-semibold text-foreground">{t('ib.transfer.confirmTransfer')}</h3>
              <div className="text-sm space-y-1">
                <p>{t('common.amount')}: <strong>{parseFloat(formData.amount || '0').toLocaleString()} {t('common.etb')}</strong></p>
                <p>{t('ib.transfer.fromAccount')}: <strong>{selectedFrom?.account_number}</strong></p>
                <p>{t('common.type')}: <strong>{activeType.toUpperCase()}</strong></p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('form')} className="flex-1">{t('common.back')}</Button>
                <Button onClick={() => setShowOtp(true)} disabled={loading} className="flex-1">{loading ? t('common.processing') : t('ib.transfer.verifyAndSend')}</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <OtpVerificationDialog open={showOtp} onOpenChange={setShowOtp} onVerified={handleTransfer} amount={parseFloat(formData.amount || '0')} transactionType={activeType} recipientInfo={formData.recipientName || formData.recipientMsisdn || formData.recipientAccountNo || t('ib.transfer.ownAccount')} />
    </div>
  );
};

export default IBTransfers;
