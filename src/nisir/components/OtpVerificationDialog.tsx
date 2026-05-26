import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Badge } from '@/components/ui/badge';
import { Shield, Smartphone, Clock, CheckCircle } from 'lucide-react';

interface OtpVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
  amount?: number;
  transactionType?: string;
  recipientInfo?: string;
}

const OtpVerificationDialog = ({
  open, onOpenChange, onVerified, amount, transactionType, recipientInfo
}: OtpVerificationDialogProps) => {
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [sent, setSent] = useState(false);

  const generateOtp = useCallback(() => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setSent(true);
    setResendTimer(30);
    setOtp('');
    setError('');
  }, []);

  useEffect(() => {
    if (open && !sent) generateOtp();
  }, [open, sent, generateOtp]);

  useEffect(() => {
    if (!open) { setSent(false); setOtp(''); setError(''); }
  }, [open]);

  useEffect(() => {
    if (resendTimer > 0 && sent) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer, sent]);

  const handleVerify = async () => {
    if (otp.length !== 6) { setError('Enter complete 6-digit OTP'); return; }
    setVerifying(true);
    setError('');
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1000));
    if (otp === generatedOtp) {
      setVerifying(false);
      onVerified();
      onOpenChange(false);
    } else {
      setError('Invalid OTP. Please try again.');
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            2FA Verification
          </DialogTitle>
          <DialogDescription>
            Enter the OTP sent to your registered mobile number
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Transaction summary */}
          {(amount || transactionType) && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              {transactionType && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Type</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{transactionType}</Badge>
                </div>
              )}
              {amount != null && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-foreground">{amount.toLocaleString()} ETB</span>
                </div>
              )}
              {recipientInfo && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">To</span>
                  <span className="text-foreground">{recipientInfo}</span>
                </div>
              )}
            </div>
          )}

          {/* Simulated OTP display (demo only) */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-green-700 text-xs mb-1">
              <Smartphone className="h-3 w-3" />
              <span>Demo OTP (simulated SMS)</span>
            </div>
            <p className="text-2xl font-mono font-bold tracking-[0.5em] text-green-800">{generatedOtp}</p>
            <p className="text-[10px] text-green-600 mt-1">In production, this would be sent via SMS/Authenticator</p>
          </div>

          {/* OTP Input */}
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

          {/* Resend */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {resendTimer > 0 ? (
              <span>Resend in {resendTimer}s</span>
            ) : (
              <button onClick={generateOtp} className="text-primary font-medium hover:underline">
                Resend OTP
              </button>
            )}
          </div>

          <Button className="w-full" onClick={handleVerify} disabled={verifying || otp.length !== 6}>
            {verifying ? (
              <span className="flex items-center gap-2"><div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />Verifying...</span>
            ) : (
              <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" />Verify & Confirm</span>
            )}
          </Button>

          <p className="text-[10px] text-center text-muted-foreground">
            As per NBE regulations, 2FA is mandatory for all financial transactions
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OtpVerificationDialog;
