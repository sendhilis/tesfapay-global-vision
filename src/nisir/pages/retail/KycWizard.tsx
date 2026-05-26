import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@/components/MobilePortalLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Home, Wallet, CreditCard, HandCoins, HelpCircle,
  Check, ChevronRight, Shield, ShieldCheck, ShieldAlert,
  Crown, Camera, ScanFace, MapPin, Loader2
} from 'lucide-react';
import KycTierSelector from '@/components/kyc/KycTierSelector';
import KycPersonalDetails from '@/components/kyc/KycPersonalDetails';
import KycAddress from '@/components/kyc/KycAddress';
import KycDocumentUpload from '@/components/kyc/KycDocumentUpload';
import KycSelfieVerification from '@/components/kyc/KycSelfieVerification';
import KycReview from '@/components/kyc/KycReview';
import KycOtpVerification from '@/components/kyc/KycOtpVerification';
import KycFinancialProfile from '@/components/kyc/KycFinancialProfile';
import KycConsent from '@/components/kyc/KycConsent';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/retail' },
  { icon: <Wallet className="h-5 w-5" />, labelKey: 'common.accounts', path: '/retail/accounts' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/retail/payments' },
  { icon: <HandCoins className="h-5 w-5" />, labelKey: 'common.loans', path: '/retail/loans' },
  { icon: <HelpCircle className="h-5 w-5" />, labelKey: 'common.support', path: '/retail/support' },
];

export type KycTier = 'basic' | 'standard' | 'premium';

export interface KycConsents {
  dataProcessing: boolean;
  digitalStatements: boolean;
  creditBureau: boolean;
  biometricData: boolean;
  marketing: boolean;
}

export interface KycFormData {
  tier: KycTier;
  // Personal
  firstName: string;
  fatherName: string;
  grandfatherName: string;
  firstNameAm: string;
  fatherNameAm: string;
  grandfatherNameAm: string;
  gender: string;
  dateOfBirth: string;
  maritalStatus: string;
  phone: string;
  // Gap 4: Phone verification
  phoneVerified: boolean;
  // Gap 5: Nationality
  nationality: string;
  placeOfBirthRegion: string;
  isForeignNational: boolean;
  // Address
  region: string;
  woreda: string;
  kebele: string;
  houseNumber: string;
  // Document
  documentType: string;
  documentNumber: string;
  frontImageFile: File | null;
  backImageFile: File | null;
  // Gap 7: Document dates
  documentIssueDate: string;
  documentExpiryDate: string;
  // Gap 6: Financial profile (Premium)
  occupation: string;
  employerName: string;
  incomeBand: string;
  sourceOfFunds: string;
  // Premium
  selfieFile: File | null;
  livenessVerified: boolean;
  ocrResult: any;
  // Gap 8: Consents
  consents: KycConsents;
}

const initialFormData: KycFormData = {
  tier: 'basic',
  firstName: '', fatherName: '', grandfatherName: '',
  firstNameAm: '', fatherNameAm: '', grandfatherNameAm: '',
  gender: '', dateOfBirth: '', maritalStatus: '', phone: '',
  phoneVerified: false,
  nationality: 'Ethiopian', placeOfBirthRegion: '', isForeignNational: false,
  region: '', woreda: '', kebele: '', houseNumber: '',
  documentType: 'national_id', documentNumber: '',
  frontImageFile: null, backImageFile: null,
  documentIssueDate: '', documentExpiryDate: '',
  occupation: '', employerName: '', incomeBand: '', sourceOfFunds: '',
  selfieFile: null, livenessVerified: false, ocrResult: null,
  consents: { dataProcessing: false, digitalStatements: false, creditBureau: false, biometricData: false, marketing: false },
};

// Gap 2, 3, 6, 8: Updated step flows with OTP, consent, and financial profile
const getStepsForTier = (tier: KycTier): string[] => {
  if (tier === 'basic') return ['tier', 'personal', 'otp', 'consent', 'review'];
  if (tier === 'standard') return ['tier', 'personal', 'otp', 'address', 'document', 'consent', 'review'];
  return ['tier', 'personal', 'otp', 'address', 'financial', 'document', 'consent', 'selfie', 'review'];
};

const KycWizard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<KycFormData>(() => ({
    ...initialFormData,
    firstName: profile?.first_name || '',
    fatherName: profile?.father_name || '',
    phone: profile?.msisdn || '',
  }));
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const steps = getStepsForTier(formData.tier);
  const stepKey = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateForm = (updates: Partial<KycFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleTierSelect = (tier: KycTier) => {
    updateForm({ tier });
    setCurrentStep(1);
  };

  const goNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(prev => prev + 1);
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      // Upload document images if standard/premium
      let frontUrl = null, backUrl = null;
      if (formData.tier !== 'basic' && formData.frontImageFile) {
        const ext = formData.frontImageFile.name.split('.').pop();
        const path = `${user.id}/id-front-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('kyc-documents').upload(path, formData.frontImageFile);
        if (!error) frontUrl = path;
      }
      if (formData.tier !== 'basic' && formData.backImageFile) {
        const ext = formData.backImageFile.name.split('.').pop();
        const path = `${user.id}/id-back-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('kyc-documents').upload(path, formData.backImageFile);
        if (!error) backUrl = path;
      }

      // Upload selfie if premium
      let selfieUrl = null;
      if (formData.tier === 'premium' && formData.selfieFile) {
        const ext = formData.selfieFile.name.split('.').pop();
        const path = `${user.id}/selfie-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('kyc-documents').upload(path, formData.selfieFile);
        if (!error) selfieUrl = path;
      }

      // Gap 10: Dedup check on document number
      if (formData.tier !== 'basic' && formData.documentNumber) {
        const { data: existing } = await supabase
          .from('kyc_documents')
          .select('id')
          .eq('document_number', formData.documentNumber)
          .neq('status', 'rejected')
          .limit(1);
        if (existing && existing.length > 0) {
          toast.error('This document number is already registered. Please contact support.');
          setSubmitting(false);
          return;
        }
      }

      // Insert KYC document record if standard+ (Gap 7: include dates)
      if (formData.tier !== 'basic') {
        await supabase.from('kyc_documents').insert({
          profile_id: user.id,
          document_type: formData.documentType,
          document_number: formData.documentNumber,
          front_image_url: frontUrl,
          back_image_url: backUrl,
          status: 'pending',
          issue_date: formData.documentIssueDate || null,
          expiry_date: formData.documentExpiryDate || null,
        } as any);
      }

      // Gap 3: Tier gating — basic gets 'simplified', standard/premium get 'pending_review'
      const kycTierMap: Record<KycTier, string> = {
        basic: 'simplified',
        standard: 'pending_review',
        premium: 'pending_review',
      };

      let completeness = 30;
      if (formData.tier === 'standard') completeness = 60;
      if (formData.tier === 'premium') completeness = 80;

      const { error: profileError } = await updateProfile({
        first_name: formData.firstName,
        father_name: formData.fatherName,
        grandfather_name: formData.grandfatherName,
        first_name_am: formData.firstNameAm,
        father_name_am: formData.fatherNameAm,
        grandfather_name_am: formData.grandfatherNameAm,
        gender: formData.gender,
        date_of_birth: formData.dateOfBirth || null,
        marital_status: formData.maritalStatus,
        msisdn: formData.phone,
        region: formData.region,
        woreda: formData.woreda,
        kebele: formData.kebele,
        house_number: formData.houseNumber,
        kyc_tier: kycTierMap[formData.tier] as any,
        profile_completeness: completeness,
        // Gap 5
        nationality: formData.nationality,
        place_of_birth_region: formData.placeOfBirthRegion,
        is_foreign_national: formData.isForeignNational,
        // Gap 4
        msisdn_verified: formData.phoneVerified,
        // Gap 6
        occupation: formData.occupation,
        employer_name: formData.employerName,
        income_band: formData.incomeBand,
        source_of_funds: formData.sourceOfFunds,
      } as any);

      if (profileError) {
        console.error('Profile update error:', profileError);
        toast.error(t('kyc.submitError'));
        return;
      }

      // Gap 8: Write consent records
      const consentRecords = [];
      if (formData.consents.dataProcessing) consentRecords.push({ profile_id: user.id, consent_type: 'data_sharing' as const, granted: true, method: 'digital' });
      if (formData.consents.digitalStatements) consentRecords.push({ profile_id: user.id, consent_type: 'digital_statements' as const, granted: true, method: 'digital' });
      if (formData.consents.creditBureau) consentRecords.push({ profile_id: user.id, consent_type: 'credit_bureau' as const, granted: true, method: 'digital' });
      if (formData.consents.biometricData) consentRecords.push({ profile_id: user.id, consent_type: 'biometric_data' as const, granted: true, method: 'digital' });
      if (formData.consents.marketing) consentRecords.push({ profile_id: user.id, consent_type: 'marketing' as const, granted: true, method: 'digital' });

      if (consentRecords.length > 0) {
        await supabase.from('consents').insert(consentRecords as any);
      }

      // Gap 1: Set account limits based on tier
      await supabase.rpc('set_account_limits_for_tier', {
        p_profile_id: user.id,
        p_tier: kycTierMap[formData.tier],
      } as any);

      if (formData.tier === 'basic') {
        toast.success(t('kyc.submitSuccess'));
      } else {
        toast.success('KYC submitted for review. You will operate under Tier 1 limits until approved.');
      }
      navigate('/retail');
    } catch (err) {
      toast.error(t('kyc.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobilePortalLayout portalName="Nisir" portalColor="retail" navItems={navItems} showBack backPath="/retail">
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-foreground">{t('kyc.title')}</h2>
          <span className="text-xs text-muted-foreground">
            {currentStep + 1}/{steps.length}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="px-4 py-4 pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={stepKey}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {stepKey === 'tier' && (
              <KycTierSelector currentTier={profile?.kyc_tier || 'pending'} onSelect={handleTierSelect} />
            )}
            {stepKey === 'personal' && (
              <KycPersonalDetails data={formData} onChange={updateForm} onNext={goNext} onBack={goBack} />
            )}
            {stepKey === 'otp' && (
              <KycOtpVerification data={formData} onChange={updateForm} onNext={goNext} onBack={goBack} />
            )}
            {stepKey === 'address' && (
              <KycAddress data={formData} onChange={updateForm} onNext={goNext} onBack={goBack} />
            )}
            {stepKey === 'financial' && (
              <KycFinancialProfile data={formData} onChange={updateForm} onNext={goNext} onBack={goBack} />
            )}
            {stepKey === 'document' && (
              <KycDocumentUpload data={formData} onChange={updateForm} onNext={goNext} onBack={goBack} />
            )}
            {stepKey === 'consent' && (
              <KycConsent data={formData} onChange={updateForm} onNext={goNext} onBack={goBack} />
            )}
            {stepKey === 'selfie' && (
              <KycSelfieVerification data={formData} onChange={updateForm} onNext={goNext} onBack={goBack} />
            )}
            {stepKey === 'review' && (
              <KycReview data={formData} onBack={goBack} onSubmit={handleSubmit} submitting={submitting} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </MobilePortalLayout>
  );
};

export default KycWizard;
