import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts } from '@/hooks/useAccounts';
import MobilePortalLayout from '@/components/MobilePortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Home, Wallet, CreditCard, HandCoins, HelpCircle,
  MapPin, ArrowDownToLine, Check, Loader2, Shield,
  Star, Navigation, Phone, Clock, Copy
} from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/retail' },
  { icon: <Wallet className="h-5 w-5" />, labelKey: 'common.accounts', path: '/retail/accounts' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/retail/payments' },
  { icon: <HandCoins className="h-5 w-5" />, labelKey: 'common.loans', path: '/retail/loans' },
  { icon: <HelpCircle className="h-5 w-5" />, labelKey: 'common.support', path: '/retail/support' },
];

interface NearbyAgent {
  id: string;
  name: string;
  nameAm: string;
  outlet: string;
  distance: string;
  rating: number;
  phone: string;
  available: boolean;
}

const simulatedAgents: NearbyAgent[] = [
  { id: 'a1', name: 'Dawit Tadesse', nameAm: 'ዳዊት ታደሰ', outlet: 'Merkato Branch #12', distance: '0.3 km', rating: 4.8, phone: '+251911234567', available: true },
  { id: 'a2', name: 'Hana Bekele', nameAm: 'ሃና በቀለ', outlet: 'Bole Road Agent', distance: '0.7 km', rating: 4.6, phone: '+251922345678', available: true },
  { id: 'a3', name: 'Yonas Getachew', nameAm: 'ዮናስ ጌታቸው', outlet: 'Mexico Square #5', distance: '1.2 km', rating: 4.9, phone: '+251933456789', available: true },
  { id: 'a4', name: 'Tigist Alemu', nameAm: 'ትግስት አለሙ', outlet: 'Piassa Central', distance: '1.5 km', rating: 4.3, phone: '+251944567890', available: false },
  { id: 'a5', name: 'Abel Mengistu', nameAm: 'አቤል መንግስቱ', outlet: 'CMC Road Agent', distance: '2.1 km', rating: 4.7, phone: '+251955678901', available: true },
];

type Step = 'select-agent' | 'enter-amount' | 'generate-code' | 'otp-verify' | 'success';

const AgentCashIn = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const [step, setStep] = useState<Step>('select-agent');
  const [selectedAgent, setSelectedAgent] = useState<NearbyAgent | null>(null);
  const [amount, setAmount] = useState('');
  const [depositCode, setDepositCode] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [txnRef, setTxnRef] = useState('');

  const primaryAccount = accounts.find(a => a.is_primary) || accounts[0];

  const generateDepositCode = () => {
    return 'DEP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSelectAgent = (agent: NearbyAgent) => {
    if (!agent.available) {
      toast.error(t('agent.notAvailable'));
      return;
    }
    setSelectedAgent(agent);
    setStep('enter-amount');
  };

  const handleGenerateCode = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error(t('agent.enterValidAmount'));
      return;
    }
    const code = generateDepositCode();
    setDepositCode(code);
    setStep('generate-code');
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      toast.error(t('agent.enterOtp'));
      return;
    }
    setLoading(true);
    // Simulate OTP verification
    await new Promise(r => setTimeout(r, 1500));

    if (otp === '123456' || otp.length === 6) {
      // Process the cash-in deposit
      if (primaryAccount && user) {
        const { error } = await supabase.rpc('process_bill_payment', {
          p_account_id: primaryAccount.id,
          p_biller_name: `Agent Cash-In via ${selectedAgent?.name}`,
          p_biller_account: depositCode,
          p_amount: -parseFloat(amount), // negative to simulate deposit (credit)
          p_fee: 0,
        });

        // Instead use direct insert for deposit
        const ref = 'TXN-' + Math.random().toString(36).substring(2, 14).toUpperCase();

        // Credit the account
        const { error: updateError } = await supabase
          .from('accounts')
          .update({
            balance: (primaryAccount.balance || 0) + parseFloat(amount),
            available_balance: (primaryAccount.available_balance || 0) + parseFloat(amount),
          })
          .eq('id', primaryAccount.id);

        // Record the transaction
        const { error: txnError } = await supabase
          .from('transactions')
          .insert({
            account_id: primaryAccount.id,
            profile_id: user.id,
            transaction_type: 'deposit',
            amount: parseFloat(amount),
            fee: 0,
            direction: 'credit',
            status: 'completed',
            reference: ref,
            description: `Agent Cash-In via ${selectedAgent?.name} (${selectedAgent?.outlet})`,
            channel: 'agent',
          });

        if (!updateError && !txnError) {
          setTxnRef(ref);
          setStep('success');
          toast.success(t('agent.cashInSuccess'));
        } else {
          toast.error(t('agent.transactionFailed'));
        }
      }
    } else {
      toast.error(t('agent.invalidOtp'));
    }
    setLoading(false);
  };

  const formatAmount = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <MobilePortalLayout portalName="Nisir" portalColor="retail" navItems={navItems} showBack backPath="/retail">
      <div className="px-4 pt-4 pb-6">
        {/* Progress Bar */}
        <div className="flex items-center gap-1 mb-4">
          {['select-agent', 'enter-amount', 'generate-code', 'otp-verify', 'success'].map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${
              ['select-agent', 'enter-amount', 'generate-code', 'otp-verify', 'success'].indexOf(step) >= i
                ? 'bg-success' : 'bg-muted'
            }`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Select Nearby Agent */}
          {step === 'select-agent' && (
            <motion.div key="select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{t('agent.selectNearbyAgent')}</h2>
                  <p className="text-xs text-muted-foreground">{t('agent.selectAgentDesc')}</p>
                </div>
              </div>

              <div className="space-y-2">
                {simulatedAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => handleSelectAgent(agent)}
                    disabled={!agent.available}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      agent.available
                        ? 'bg-card border-border hover:border-success hover:shadow-md'
                        : 'bg-muted/50 border-border opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {language === 'am' ? agent.nameAm : agent.name}
                          </p>
                          {!agent.available && (
                            <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full font-medium">
                              {t('agent.offline')}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{agent.outlet}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Navigation className="h-3 w-3" /> {agent.distance}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-amber-500">
                            <Star className="h-3 w-3 fill-current" /> {agent.rating}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Phone className="h-3 w-3" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Enter Amount */}
          {step === 'enter-amount' && selectedAgent && (
            <motion.div key="amount" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <ArrowDownToLine className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{t('agent.enterCashInAmount')}</h2>
                  <p className="text-xs text-muted-foreground">{language === 'am' ? selectedAgent.nameAm : selectedAgent.name} — {selectedAgent.outlet}</p>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-4 mb-4">
                <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('agent.depositAmount')}</label>
                <div className="relative">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-2xl font-bold h-14 pr-12"
                    min="1"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">{t('common.etb')}</span>
                </div>
              </div>

              {primaryAccount && (
                <div className="bg-muted/50 rounded-xl p-3 mb-4">
                  <p className="text-[11px] text-muted-foreground">{t('agent.depositTo')}</p>
                  <p className="text-sm font-semibold text-foreground">{primaryAccount.product_name}</p>
                  <p className="text-xs text-muted-foreground">{primaryAccount.account_number}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('select-agent')} className="flex-1">{t('common.back')}</Button>
                <Button onClick={handleGenerateCode} className="flex-1 bg-success hover:bg-success/90">{t('agent.generateCode')}</Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Deposit Code */}
          {step === 'generate-code' && selectedAgent && (
            <motion.div key="code" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{t('agent.depositCode')}</h2>
                  <p className="text-xs text-muted-foreground">{t('agent.showCodeToAgent')}</p>
                </div>
              </div>

              <div className="bg-card rounded-xl border-2 border-dashed border-success p-6 text-center mb-4">
                <p className="text-xs text-muted-foreground mb-2">{t('agent.yourDepositCode')}</p>
                <p className="text-3xl font-black text-success tracking-wider font-mono">{depositCode}</p>
                <button
                  onClick={() => { navigator.clipboard.writeText(depositCode); toast.success(t('agent.codeCopied')); }}
                  className="flex items-center gap-1 mx-auto mt-2 text-xs text-primary"
                >
                  <Copy className="h-3 w-3" /> {t('agent.copyCode')}
                </button>
              </div>

              <div className="bg-muted/50 rounded-xl p-3 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('accounts.amount')}</span>
                  <span className="font-bold text-foreground">{formatAmount(parseFloat(amount))} {t('common.etb')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('agent.agentName')}</span>
                  <span className="font-medium text-foreground">{language === 'am' ? selectedAgent.nameAm : selectedAgent.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('agent.outlet')}</span>
                  <span className="font-medium text-foreground">{selectedAgent.outlet}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-amber-600 mt-2">
                  <Clock className="h-3 w-3" /> {t('agent.codeExpiry')}
                </div>
              </div>

              <Button onClick={() => setStep('otp-verify')} className="w-full bg-primary">
                {t('agent.agentConfirmed')}
              </Button>
            </motion.div>
          )}

          {/* Step 4: OTP Verification */}
          {step === 'otp-verify' && (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{t('agent.otpVerification')}</h2>
                  <p className="text-xs text-muted-foreground">{t('agent.otpSentDesc')}</p>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-6 text-center mb-4">
                <p className="text-sm text-muted-foreground mb-4">{t('agent.enterOtpCode')}</p>
                <div className="flex justify-center">
                  <InputOTP value={otp} onChange={setOtp} maxLength={6}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3">{t('agent.otpHint')}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('generate-code')} className="flex-1">{t('common.back')}</Button>
                <Button onClick={handleVerifyOtp} disabled={loading || otp.length < 6} className="flex-1 bg-success hover:bg-success/90">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.confirm')}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Success */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="text-center py-6">
                <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-success" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-1">{t('agent.cashInSuccess')}</h2>
                <p className="text-sm text-muted-foreground">{formatAmount(parseFloat(amount))} {t('common.etb')} {t('agent.depositedToAccount')}</p>
              </div>

              <div className="bg-card rounded-xl border border-border p-4 space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('agent.reference')}</span>
                  <span className="font-mono text-xs text-foreground">{txnRef}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('agent.agentName')}</span>
                  <span className="font-medium">{selectedAgent?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('agent.depositCode')}</span>
                  <span className="font-mono text-xs">{depositCode}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('accounts.amount')}</span>
                  <span className="font-bold text-success">{formatAmount(parseFloat(amount))} {t('common.etb')}</span>
                </div>
              </div>

              <Button onClick={() => navigate('/retail')} className="w-full">{t('common.home')}</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobilePortalLayout>
  );
};

export default AgentCashIn;
