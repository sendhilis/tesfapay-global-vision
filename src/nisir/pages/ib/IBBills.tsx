import { useState } from 'react';
import { useAccounts } from '@/hooks/useAccounts';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Zap, Droplets, Wifi, GraduationCap, Building, Receipt, CheckCircle } from 'lucide-react';
import OtpVerificationDialog from '@/components/OtpVerificationDialog';

const IBBills = () => {
  const { accounts, refetch } = useAccounts();
  const { user } = useAuth();
  const { t } = useLanguage();

  const billerCategories = [
    { id: 'electricity', label: t('ib.bill.electricity'), icon: Zap, billers: ['Ethiopian Electric Utility (EEU)'] },
    { id: 'water', label: t('ib.bill.water'), icon: Droplets, billers: ['Addis Ababa Water & Sewerage'] },
    { id: 'telecom', label: t('ib.bill.telecom'), icon: Wifi, billers: ['Ethio Telecom', 'Safaricom Ethiopia'] },
    { id: 'education', label: t('ib.bill.education'), icon: GraduationCap, billers: ['Addis Ababa University', 'Unity University', "St. Mary's University"] },
    { id: 'tax', label: t('ib.bill.taxGov'), icon: Building, billers: ['ERCA Tax Payment', 'Addis Ababa Revenue Bureau', 'Trade License Renewal'] },
    { id: 'other', label: t('ib.bill.other'), icon: Receipt, billers: ['DSTV Ethiopia', 'Ethiopian Airlines', 'Insurance Premium'] },
  ];

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBiller, setSelectedBiller] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [amount, setAmount] = useState('');
  const [fromAccount, setFromAccount] = useState('');
  const [step, setStep] = useState<'select' | 'form' | 'success'>('select');
  const [loading, setLoading] = useState(false);
  const [txRef, setTxRef] = useState('');
  const [showOtp, setShowOtp] = useState(false);

  const handlePay = async () => {
    if (!user || !fromAccount || !amount) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('process_bill_payment', { p_account_id: fromAccount, p_biller_name: selectedBiller, p_biller_account: accountNo, p_amount: parseFloat(amount), p_fee: 5 });
      if (error) throw error;
      const result = data as any;
      if (!result.success) throw new Error(result.error);
      setTxRef(result.reference); setStep('success'); refetch(); toast.success(t('ib.bill.paymentSuccessful'));
    } catch (err: any) { toast.error(err.message || t('common.failed')); } finally { setLoading(false); }
  };

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Card className="text-center">
          <CardContent className="p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto"><CheckCircle className="h-8 w-8 text-green-600" /></div>
            <h2 className="text-xl font-bold text-foreground">{t('ib.bill.paymentSuccessful')}</h2>
            <p className="text-sm text-muted-foreground">{selectedBiller}</p>
            <p className="text-2xl font-bold text-foreground">{parseFloat(amount).toLocaleString()} {t('common.etb')}</p>
            <p className="text-xs text-muted-foreground font-mono">{txRef}</p>
            <Button onClick={() => { setStep('select'); setSelectedCategory(null); setSelectedBiller(''); setAccountNo(''); setAmount(''); }} className="w-full">{t('ib.bill.payAnother')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground">{t('ib.bill.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('ib.bill.subtitle')}</p>
      </div>

      {step === 'select' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {billerCategories.map((cat) => (
              <Card key={cat.id} className={`cursor-pointer transition-all ${selectedCategory === cat.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`} onClick={() => setSelectedCategory(cat.id)}>
                <CardContent className="p-4 text-center">
                  <cat.icon className={`h-8 w-8 mx-auto mb-2 ${selectedCategory === cat.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-sm font-medium text-foreground">{cat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {selectedCategory && (
            <Card>
              <CardHeader><CardTitle className="text-sm">{t('ib.bill.selectBiller')}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {billerCategories.find((c) => c.id === selectedCategory)?.billers.map((biller) => (
                  <Button key={biller} variant="outline" className="w-full justify-start" onClick={() => { setSelectedBiller(biller); setStep('form'); }}>{biller}</Button>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {step === 'form' && (
        <Card>
          <CardHeader><CardTitle className="text-sm">{selectedBiller}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label className="text-xs">{t('ib.transfer.fromAccount')}</Label>
              <Select value={fromAccount} onValueChange={setFromAccount}>
                <SelectTrigger><SelectValue placeholder={t('accounts.selectAccount')} /></SelectTrigger>
                <SelectContent>{accounts.map((a) => (<SelectItem key={a.id} value={a.id}>{a.product_name} — {(a.available_balance || 0).toLocaleString()} {t('common.etb')}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">{t('ib.bill.accountRef')}</Label><Input value={accountNo} onChange={(e) => setAccountNo(e.target.value)} placeholder={t('ib.bill.enterAccountNo')} /></div>
            <div><Label className="text-xs">{t('ib.transfer.amountEtb')}</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></div>
            <p className="text-xs text-muted-foreground">{t('ib.bill.serviceFee')}: 5 {t('common.etb')}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('select')} className="flex-1">{t('common.back')}</Button>
              <Button onClick={() => setShowOtp(true)} disabled={loading || !fromAccount || !amount || !accountNo} className="flex-1">{loading ? t('common.processing') : t('ib.bill.verifyAndPay')}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <OtpVerificationDialog open={showOtp} onOpenChange={setShowOtp} onVerified={handlePay} amount={parseFloat(amount || '0')} transactionType={t('ib.billPayments')} recipientInfo={selectedBiller} />
    </div>
  );
};

export default IBBills;
