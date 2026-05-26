import { useLanguage } from '@/contexts/LanguageContext';
import { Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import type { KycFormData } from '@/pages/retail/KycWizard';

interface Props {
  data: KycFormData;
  onChange: (updates: Partial<KycFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const occupationCategories = [
  'Government Employee', 'Private Sector Employee', 'Business Owner / Self-Employed',
  'Farmer / Agriculture', 'Student', 'Retired', 'Unemployed', 'Other',
];

const incomeBands = [
  'Below ETB 5,000', 'ETB 5,000 – 15,000', 'ETB 15,000 – 50,000',
  'ETB 50,000 – 150,000', 'Above ETB 150,000',
];

const sourceOfFundsOptions = [
  'Salary / Wages', 'Business Income', 'Remittance', 'Investment Returns',
  'Agricultural Income', 'Pension', 'Other',
];

const KycFinancialProfile = ({ data, onChange, onNext, onBack }: Props) => {
  const { t } = useLanguage();

  const validate = () => {
    if (!data.occupation) { toast.error('Occupation is required for Premium KYC'); return false; }
    if (!data.incomeBand) { toast.error('Income band is required'); return false; }
    if (!data.sourceOfFunds) { toast.error('Source of funds is required'); return false; }
    return true;
  };

  const handleNext = () => { if (validate()) onNext(); };

  const inputClass = "w-full px-3 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Briefcase className="h-5 w-5 text-primary" />
        <h3 className="text-base font-bold text-foreground">Financial Profile</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Required for Premium KYC as per NBE FIS/04/2021 — source of funds declaration.
      </p>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Occupation *</label>
        <select className={inputClass} value={data.occupation} onChange={e => onChange({ occupation: e.target.value })}>
          <option value="">Select occupation</option>
          {occupationCategories.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Employer / Business Name</label>
        <input className={inputClass} value={data.employerName} onChange={e => onChange({ employerName: e.target.value })} placeholder="Enter employer or business name" />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Monthly Income Band *</label>
        <select className={inputClass} value={data.incomeBand} onChange={e => onChange({ incomeBand: e.target.value })}>
          <option value="">Select income range</option>
          {incomeBands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Primary Source of Funds *</label>
        <select className={inputClass} value={data.sourceOfFunds} onChange={e => onChange({ sourceOfFunds: e.target.value })}>
          <option value="">Select source</option>
          {sourceOfFundsOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
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

export default KycFinancialProfile;
