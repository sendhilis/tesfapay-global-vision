import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@nisir/hooks/useAuth';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import LanguageToggle from '@nisir/components/LanguageToggle';
import TechurateABXFooter from '@nisir/components/TechurateABXFooter';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Phone, Mail, Lock, User, ArrowLeft, Shield, Smartphone, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Gap 4: Phone OTP state for signup
  const [signupStep, setSignupStep] = useState<'phone' | 'otp' | 'details'>('phone');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const { signIn, signUp } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const sendOtp = () => {
    if (!phone.trim() || phone.length < 10) {
      toast.error('Please enter a valid Ethiopian phone number');
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setResendTimer(30);
    setOtp('');
    setSignupStep('otp');
    toast.success(`OTP sent to ${phone}`);
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const verifyOtp = () => {
    if (otp === generatedOtp) {
      toast.success('Phone verified!');
      setSignupStep('details');
    } else {
      toast.error('Invalid OTP');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message || t('auth.loginError'));
      } else {
        toast.success(t('auth.loginSuccess'));
        navigate('/retail');
      }
    } else {
      if (!firstName || !fatherName) {
        toast.error(t('auth.nameRequired'));
        setSubmitting(false);
        return;
      }
      const { error } = await signUp(email, password, phone || undefined);
      if (error) {
        toast.error(error.message || t('auth.signupError'));
      } else {
        toast.success(t('auth.signupSuccess'));
        navigate('/retail/kyc');
      }
    }
    setSubmitting(false);
  };

  const inputCls = "w-full pl-10 pr-3 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none";

  return (
    <div className="min-h-screen flex flex-col bg-background max-w-md mx-auto">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-muted">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <LanguageToggle />
      </div>

      <div className="flex-1 flex flex-col px-6 pt-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-extrabold text-primary-foreground">N</span>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">
            {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? t('auth.loginSubtitle') : 'Verify your phone to get started'}
          </p>
        </motion.div>

        {isLogin ? (
          /* LOGIN FORM */
          <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputCls} placeholder="name@example.com" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={submitting} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
              {submitting ? '...' : t('common.login')}
            </button>
          </motion.form>
        ) : (
          /* SIGNUP FLOW — Phone-first (Gap 4) */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
            {signupStep === 'phone' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="+251 9XX XXX XXX" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Your phone number is the primary identity anchor (NBE requirement)</p>
                </div>
                <button onClick={sendOtp} disabled={!phone.trim()} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">
                  Send OTP
                </button>
              </div>
            )}

            {signupStep === 'otp' && (
              <div className="space-y-4">
                <div className="bg-[hsl(var(--success))]/5 border border-[hsl(var(--success))]/20 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-[hsl(var(--success))] text-xs mb-1">
                    <Smartphone className="h-3 w-3" /><span>Demo OTP (simulated SMS)</span>
                  </div>
                  <p className="text-2xl font-mono font-bold tracking-[0.5em] text-foreground">{generatedOtp}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">In production: SMS via Ethio Telecom</p>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                      <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {resendTimer > 0 ? <span>Resend in {resendTimer}s</span> : (
                    <button onClick={sendOtp} className="text-primary font-medium hover:underline">Resend OTP</button>
                  )}
                </div>

                <button onClick={verifyOtp} disabled={otp.length !== 6} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4" /> Verify & Continue
                </button>
                <button onClick={() => setSignupStep('phone')} className="w-full py-2 text-sm text-muted-foreground">← Change number</button>
              </div>
            )}

            {signupStep === 'details' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-[hsl(var(--success))]/10 rounded-xl p-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[hsl(var(--success))]" />
                  <span className="text-xs font-medium text-foreground">Phone verified: {phone}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('auth.firstName')}</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} placeholder={t('auth.firstName')} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('auth.fatherName')}</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input type="text" value={fatherName} onChange={e => setFatherName(e.target.value)} className={inputCls} placeholder={t('auth.fatherName')} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('auth.email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputCls} placeholder="name@example.com" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('auth.password')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                      {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                  {submitting ? '...' : t('auth.signUp')}
                </button>
              </form>
            )}
          </motion.div>
        )}

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
            <button onClick={() => { setIsLogin(!isLogin); setSignupStep('phone'); }} className="font-semibold text-primary">
              {isLogin ? t('auth.signUp') : t('common.login')}
            </button>
          </p>
        </div>

        <div className="mt-auto pb-8 pt-6">
          <TechurateABXFooter />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
