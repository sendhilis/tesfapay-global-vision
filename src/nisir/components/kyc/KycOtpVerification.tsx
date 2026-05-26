import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import { Shield, Smartphone, Clock, CheckCircle } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import type { KycFormData } from '@nisir/pages/retail/KycWizard';

interface Props {
  data: KycFormData;
  onChange: (updates: Partial<KycFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const KycOtpVerification = ({ data, onChange, onNext, onBack }: Props) => {
  const { t } = useLanguage();
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const generateOtp = useCallback(() => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setSent(true);
    setResendTimer(30);
    setOtp('');
    setError('');
  }, []);

  useEffect(() => {
    if (resendTimer > 0 && sent) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer, sent]);

  const handleSendOtp = () => {
    if (!data.phone.trim()) {
      toast.error('Please enter your phone number first');
      return;
    }
    generateOtp();
    toast.success(`OTP sent to ${data.phone}`);
  };

  const handleVerify = async () => {
    if (otp.length !== 6) { setError('Enter complete 6-digit OTP'); return; }
    setVerifying(true);
    setError('');
    await new Promise(r => setTimeout(r, 800));
    if (otp === generatedOtp) {
      onChange({ phoneVerified: true });
      toast.success('Phone number verified successfully');
      setVerifying(false);
      onNext();
    } else {
      setError('Invalid OTP. Please try again.');
      setVerifying(false);
    }
  };

  if (data.phoneVerified) {
    return (
      <div className="space-y-4">
        <h3 className="text-base font-bold text-foreground">Phone Verification</h3>
        <div className="bg-[hsl(var(--success))]/10 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-[hsl(var(--success))]" />
          <div>
            <p className="text-sm font-semibold text-foreground">Phone Verified</p>
            <p className="text-xs text-muted-foreground">{data.phone}</p>
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <button onClick={onBack} className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium text-sm">
            {t('common.back')}
          </button>
          <button onClick={onNext} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
            {t('common.next')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-foreground">Phone Verification</h3>
      <p className="text-xs text-muted-foreground">
        As per NBE regulation, your phone number must be verified via OTP before account activation.
      </p>

      <div className="bg-muted/50 rounded-xl p-4">
        <div className="flex items-center gap-2 text-sm">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{data.phone || 'No phone entered'}</span>
        </div>
      </div>

      {!sent ? (
        <button
          onClick={handleSendOtp}
          disabled={!data.phone.trim()}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
        >
          Send OTP
        </button>
      ) : (
        <div className="space-y-4">
          {/* Demo OTP display */}
          <div className="bg-[hsl(var(--success))]/5 border border-[hsl(var(--success))]/20 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-[hsl(var(--success))] text-xs mb-1">
              <Smartphone className="h-3 w-3" />
              <span>Demo OTP (simulated Ethio Telecom SMS)</span>
            </div>
            <p className="text-2xl font-mono font-bold tracking-[0.5em] text-foreground">{generatedOtp}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              In production: SMS sent via Ethio Telecom gateway
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {resendTimer > 0 ? (
              <span>Resend in {resendTimer}s</span>
            ) : (
              <button onClick={handleSendOtp} className="text-primary font-medium hover:underline">
                Resend OTP
              </button>
            )}
          </div>

          <button
            onClick={handleVerify}
            disabled={verifying || otp.length !== 6}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {verifying ? (
              <><div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />Verifying...</>
            ) : (
              <><Shield className="h-4 w-4" />Verify Phone</>
            )}
          </button>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium text-sm">
          {t('common.back')}
        </button>
      </div>
    </div>
  );
};

export default KycOtpVerification;
