import { useLanguage } from '@/contexts/LanguageContext';
import { User } from 'lucide-react';
import type { KycFormData } from '@/pages/retail/KycWizard';
import { toast } from 'sonner';

interface Props {
  data: KycFormData;
  onChange: (updates: Partial<KycFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const ethiopianRegions = [
  'Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Dire Dawa',
  'Gambela', 'Harari', 'Oromia', 'Sidama', 'SNNPR',
  'Somali', 'South West Ethiopia', 'Tigray',
];

const KycPersonalDetails = ({ data, onChange, onNext, onBack }: Props) => {
  const { t } = useLanguage();

  const validate = () => {
    if (!data.firstName.trim() || !data.fatherName.trim()) {
      toast.error(t('kyc.nameRequired'));
      return false;
    }
    if (!data.phone.trim()) {
      toast.error(t('kyc.phoneRequired'));
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
      <h3 className="text-base font-bold text-foreground">{t('kyc.personalDetails')}</h3>

      {/* English names */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('kyc.firstName')}</label>
          <input className={inputClass} value={data.firstName} onChange={e => onChange({ firstName: e.target.value })} placeholder={t('kyc.firstName')} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('kyc.fatherName')}</label>
          <input className={inputClass} value={data.fatherName} onChange={e => onChange({ fatherName: e.target.value })} placeholder={t('kyc.fatherName')} />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('kyc.grandfatherName')}</label>
        <input className={inputClass} value={data.grandfatherName} onChange={e => onChange({ grandfatherName: e.target.value })} placeholder={t('kyc.grandfatherName')} />
      </div>

      {/* Amharic names */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs font-medium text-muted-foreground mb-2">{t('kyc.amharicNames')}</p>
        <div className="grid grid-cols-2 gap-3">
          <input className={inputClass} value={data.firstNameAm} onChange={e => onChange({ firstNameAm: e.target.value })} placeholder={t('kyc.firstNameAm')} />
          <input className={inputClass} value={data.fatherNameAm} onChange={e => onChange({ fatherNameAm: e.target.value })} placeholder={t('kyc.fatherNameAm')} />
        </div>
        <input className={`${inputClass} mt-3`} value={data.grandfatherNameAm} onChange={e => onChange({ grandfatherNameAm: e.target.value })} placeholder={t('kyc.grandfatherNameAm')} />
      </div>

      {/* Gender, DOB, Marital */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('kyc.gender')}</label>
          <select className={inputClass} value={data.gender} onChange={e => onChange({ gender: e.target.value })}>
            <option value="">{t('kyc.select')}</option>
            <option value="male">{t('kyc.male')}</option>
            <option value="female">{t('kyc.female')}</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('kyc.dob')}</label>
          <input type="date" className={inputClass} value={data.dateOfBirth} onChange={e => onChange({ dateOfBirth: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('kyc.maritalStatus')}</label>
          <select className={inputClass} value={data.maritalStatus} onChange={e => onChange({ maritalStatus: e.target.value })}>
            <option value="">{t('kyc.select')}</option>
            <option value="single">{t('kyc.single')}</option>
            <option value="married">{t('kyc.married')}</option>
            <option value="divorced">{t('kyc.divorced')}</option>
            <option value="widowed">{t('kyc.widowed')}</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('kyc.phone')}</label>
          <input type="tel" className={inputClass} value={data.phone} onChange={e => onChange({ phone: e.target.value })} placeholder="+251 9XX" />
        </div>
      </div>

      {/* Gap 5: Nationality & Place of Birth */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs font-bold text-muted-foreground mb-2">Nationality & Birth</p>
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!data.isForeignNational}
              onChange={e => onChange({ isForeignNational: !e.target.checked, nationality: e.target.checked ? 'Ethiopian' : '' })}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-foreground">Ethiopian National</span>
          </label>

          {data.isForeignNational && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nationality *</label>
              <input className={inputClass} value={data.nationality} onChange={e => onChange({ nationality: e.target.value })} placeholder="Enter nationality" />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Place of Birth (Region)</label>
            <select className={inputClass} value={data.placeOfBirthRegion} onChange={e => onChange({ placeOfBirthRegion: e.target.value })}>
              <option value="">Select region</option>
              {ethiopianRegions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
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

export default KycPersonalDetails;
