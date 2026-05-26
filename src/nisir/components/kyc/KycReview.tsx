import { useLanguage } from '@nisir/contexts/LanguageContext';
import { Check, Loader2, Shield, ShieldCheck, Crown, AlertTriangle } from 'lucide-react';
import type { KycFormData } from '@nisir/pages/retail/KycWizard';

interface Props {
  data: KycFormData;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

const KycReview = ({ data, onBack, onSubmit, submitting }: Props) => {
  const { t } = useLanguage();

  const TierIcon = data.tier === 'premium' ? Crown : data.tier === 'standard' ? ShieldCheck : Shield;

  const Section = ({ title, items }: { title: string; items: [string, string][] }) => (
    <div className="bg-card rounded-xl border border-border p-4">
      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">{title}</h4>
      <div className="space-y-1.5">
        {items.filter(([, v]) => v).map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-xs font-medium text-foreground">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-foreground">{t('kyc.reviewTitle')}</h3>

      {/* Tier badge */}
      <div className="flex items-center gap-3 bg-primary/5 rounded-xl p-3 border border-primary/20">
        <TierIcon className="h-6 w-6 text-primary" />
        <div>
          <p className="text-sm font-bold text-foreground">{t(`kyc.tier.${data.tier}`)}</p>
          <p className="text-[11px] text-muted-foreground">{t('kyc.tierSelected')}</p>
        </div>
      </div>

      {/* Pending review notice for standard/premium */}
      {data.tier !== 'basic' && (
        <div className="flex items-start gap-2 bg-[hsl(var(--warning))]/10 rounded-xl p-3 border border-[hsl(var(--warning))]/20">
          <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))] mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Your documents will be reviewed by an officer. You'll operate under Tier 1 limits until approval.
          </p>
        </div>
      )}

      {/* Personal */}
      <Section
        title={t('kyc.personalDetails')}
        items={[
          [t('kyc.firstName'), data.firstName],
          [t('kyc.fatherName'), data.fatherName],
          [t('kyc.grandfatherName'), data.grandfatherName],
          [t('kyc.gender'), data.gender],
          [t('kyc.dob'), data.dateOfBirth],
          [t('kyc.phone'), data.phone],
          ['Phone Verified', data.phoneVerified ? '✅ Verified' : '❌ Not Verified'],
          ['Nationality', data.nationality || 'Ethiopian'],
          ['Place of Birth', data.placeOfBirthRegion || '—'],
        ]}
      />

      {/* Address */}
      {data.tier !== 'basic' && (
        <Section
          title={t('kyc.addressDetails')}
          items={[
            [t('kyc.region'), data.region],
            [t('kyc.woreda'), data.woreda],
            [t('kyc.kebele'), data.kebele],
            [t('kyc.houseNumber'), data.houseNumber],
          ]}
        />
      )}

      {/* Financial Profile (Premium) */}
      {data.tier === 'premium' && (
        <Section
          title="Financial Profile"
          items={[
            ['Occupation', data.occupation],
            ['Employer / Business', data.employerName],
            ['Income Band', data.incomeBand],
            ['Source of Funds', data.sourceOfFunds],
          ]}
        />
      )}

      {/* Document */}
      {data.tier !== 'basic' && (
        <Section
          title={t('kyc.documentUpload')}
          items={[
            [t('kyc.documentType'), data.documentType],
            [t('kyc.documentNumber'), data.documentNumber],
            ['Issue Date', data.documentIssueDate || '—'],
            ['Expiry Date', data.documentExpiryDate || '—'],
            [t('kyc.frontSide'), data.frontImageFile ? '✅ ' + t('kyc.uploaded') : ''],
            [t('kyc.backSide'), data.backImageFile ? '✅ ' + t('kyc.uploaded') : ''],
          ]}
        />
      )}

      {/* Premium verification */}
      {data.tier === 'premium' && (
        <Section
          title={t('kyc.selfieVerification')}
          items={[
            [t('kyc.selfie'), data.selfieFile ? '✅ ' + t('kyc.captured') : ''],
            [t('kyc.liveness'), data.livenessVerified ? '✅ ' + t('kyc.passed') : '❌'],
          ]}
        />
      )}

      {/* Consents */}
      <Section
        title="Consents"
        items={[
          ['Data Processing', data.consents.dataProcessing ? '✅ Granted' : '❌'],
          ['Digital Statements', data.consents.digitalStatements ? '✅ Granted' : '❌'],
          ['Credit Bureau', data.consents.creditBureau ? '✅ Granted' : '—'],
          ...(data.tier === 'premium' ? [['Biometric Data', data.consents.biometricData ? '✅ Granted' : '❌'] as [string, string]] : []),
          ['Marketing', data.consents.marketing ? '✅ Opted In' : '— Opted Out'],
        ]}
      />

      <div className="flex gap-3 pt-4">
        <button onClick={onBack} className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium text-sm">
          {t('common.back')}
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {submitting ? t('kyc.submitting') : t('kyc.submitKyc')}
        </button>
      </div>
    </div>
  );
};

export default KycReview;
