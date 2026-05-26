import { useLanguage } from '@/contexts/LanguageContext';
import type { KycFormData } from '@/pages/retail/KycWizard';
import { toast } from 'sonner';

interface Props {
  data: KycFormData;
  onChange: (updates: Partial<KycFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const regions = [
  'Addis Ababa', 'Amhara', 'Oromia', 'Tigray', 'SNNPR',
  'Somali', 'Afar', 'Benishangul-Gumuz', 'Gambela', 'Harari',
  'Dire Dawa', 'Sidama', 'South West Ethiopia',
];

const KycAddress = ({ data, onChange, onNext, onBack }: Props) => {
  const { t } = useLanguage();

  const validate = () => {
    if (!data.region) {
      toast.error(t('kyc.regionRequired'));
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  const inputClass = "w-full px-3 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none";

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-foreground">{t('kyc.addressDetails')}</h3>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('kyc.region')}</label>
        <select className={inputClass} value={data.region} onChange={e => onChange({ region: e.target.value })}>
          <option value="">{t('kyc.selectRegion')}</option>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('kyc.woreda')}</label>
          <input className={inputClass} value={data.woreda} onChange={e => onChange({ woreda: e.target.value })} placeholder={t('kyc.woreda')} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('kyc.kebele')}</label>
          <input className={inputClass} value={data.kebele} onChange={e => onChange({ kebele: e.target.value })} placeholder={t('kyc.kebele')} />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('kyc.houseNumber')}</label>
        <input className={inputClass} value={data.houseNumber} onChange={e => onChange({ houseNumber: e.target.value })} placeholder={t('kyc.houseNumber')} />
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

export default KycAddress;
