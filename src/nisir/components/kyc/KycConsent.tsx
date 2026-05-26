import { useLanguage } from '@/contexts/LanguageContext';
import { FileCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { KycFormData } from '@/pages/retail/KycWizard';

interface Props {
  data: KycFormData;
  onChange: (updates: Partial<KycFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const KycConsent = ({ data, onChange, onNext, onBack }: Props) => {
  const { t } = useLanguage();

  const toggleConsent = (key: keyof KycFormData['consents']) => {
    onChange({
      consents: { ...data.consents, [key]: !data.consents[key] },
    });
  };

  const validate = () => {
    if (!data.consents.dataProcessing) {
      toast.error('Data processing consent is mandatory to proceed');
      return false;
    }
    if (!data.consents.digitalStatements) {
      toast.error('Digital statements consent is required');
      return false;
    }
    if (data.tier === 'premium' && !data.consents.biometricData) {
      toast.error('Biometric consent is required for Premium KYC');
      return false;
    }
    return true;
  };

  const handleNext = () => { if (validate()) onNext(); };

  const ConsentItem = ({ label, description, checked, mandatory, onToggle }: {
    label: string; description: string; checked: boolean; mandatory: boolean; onToggle: () => void;
  }) => (
    <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card cursor-pointer hover:border-primary/40 transition-colors">
      <input type="checkbox" checked={checked} onChange={onToggle}
        className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary" />
      <div className="flex-1">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {mandatory && <span className="text-[10px] text-destructive font-bold">*</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </label>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <FileCheck className="h-5 w-5 text-primary" />
        <h3 className="text-base font-bold text-foreground">Consent & Declarations</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        As per NBE FIS/04/2021, your explicit consent is required. Mandatory items must be accepted to proceed.
      </p>

      <div className="space-y-2">
        <ConsentItem
          label="Data Processing"
          description="I consent to the collection, storage, and processing of my personal data for account operations, compliance, and regulatory reporting."
          checked={data.consents.dataProcessing}
          mandatory
          onToggle={() => toggleConsent('dataProcessing')}
        />

        <ConsentItem
          label="Digital Statements"
          description="I agree to receive account statements, notifications, and correspondence electronically."
          checked={data.consents.digitalStatements}
          mandatory
          onToggle={() => toggleConsent('digitalStatements')}
        />

        <ConsentItem
          label="Credit Bureau Sharing"
          description="I authorize sharing my credit information with the national credit reference bureau as mandated by NBE."
          checked={data.consents.creditBureau}
          mandatory={false}
          onToggle={() => toggleConsent('creditBureau')}
        />

        {data.tier === 'premium' && (
          <ConsentItem
            label="Biometric Data"
            description="I consent to the capture and storage of my facial biometric data for identity verification and liveness detection."
            checked={data.consents.biometricData}
            mandatory
            onToggle={() => toggleConsent('biometricData')}
          />
        )}

        <ConsentItem
          label="Marketing Communications"
          description="I agree to receive promotional offers, product updates, and marketing materials."
          checked={data.consents.marketing}
          mandatory={false}
          onToggle={() => toggleConsent('marketing')}
        />
      </div>

      <div className="bg-[hsl(var(--warning))]/10 rounded-xl p-3 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))] mt-0.5 shrink-0" />
        <p className="text-[11px] text-muted-foreground">
          Items marked with * are mandatory. Withholding mandatory consent will prevent account activation.
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <button onClick={onBack} className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium text-sm">
          {t('common.back')}
        </button>
        <button onClick={handleNext} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
          {t('common.next')}
        </button>
      </div>
    </div>
  );
};

export default KycConsent;
