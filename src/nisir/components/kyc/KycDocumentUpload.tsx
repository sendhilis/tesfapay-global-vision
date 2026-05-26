import { useState } from 'react';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import { Upload, FileCheck, Calendar } from 'lucide-react';
import type { KycFormData } from '@nisir/pages/retail/KycWizard';
import { toast } from 'sonner';

interface Props {
  data: KycFormData;
  onChange: (updates: Partial<KycFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const documentTypes = [
  { value: 'national_id', labelKey: 'kyc.nationalId' },
  { value: 'passport', labelKey: 'kyc.passport' },
  { value: 'driving_license', labelKey: 'kyc.drivingLicense' },
  { value: 'kebele_id', labelKey: 'kyc.kebeleId' },
];

const docsWithExpiry = ['passport', 'driving_license'];

const KycDocumentUpload = ({ data, onChange, onNext, onBack }: Props) => {
  const { t } = useLanguage();
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  const handleFile = (side: 'front' | 'back', file: File) => {
    const url = URL.createObjectURL(file);
    if (side === 'front') {
      setFrontPreview(url);
      onChange({ frontImageFile: file });
    } else {
      setBackPreview(url);
      onChange({ backImageFile: file });
    }
  };

  const validate = () => {
    if (!data.documentNumber.trim()) {
      toast.error(t('kyc.docNumberRequired'));
      return false;
    }
    // Demo mode: skip image requirement when no file selected
    // In production, uncomment the check below
    // if (!data.frontImageFile) {
    //   toast.error(t('kyc.frontImageRequired'));
    //   return false;
    // }
    // Gap 7: Check expiry for docs that have them
    if (docsWithExpiry.includes(data.documentType) && data.documentExpiryDate) {
      const expiry = new Date(data.documentExpiryDate);
      if (expiry < new Date()) {
        toast.error('This document has expired. Please provide a valid document.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  const showExpiry = docsWithExpiry.includes(data.documentType);
  const inputClass = "w-full px-3 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none";

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-foreground">{t('kyc.documentUpload')}</h3>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('kyc.documentType')}</label>
        <select className={inputClass} value={data.documentType} onChange={e => onChange({ documentType: e.target.value })}>
          {documentTypes.map(d => (
            <option key={d.value} value={d.value}>{t(d.labelKey)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('kyc.documentNumber')}</label>
        <input className={inputClass} value={data.documentNumber} onChange={e => onChange({ documentNumber: e.target.value })} placeholder={t('kyc.enterDocNumber')} />
      </div>

      {/* Gap 7: Issue and Expiry dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Issue Date
          </label>
          <input type="date" className={inputClass} value={data.documentIssueDate} onChange={e => onChange({ documentIssueDate: e.target.value })} />
        </div>
        {showExpiry && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Expiry Date *
            </label>
            <input type="date" className={inputClass} value={data.documentExpiryDate} onChange={e => onChange({ documentExpiryDate: e.target.value })} />
          </div>
        )}
      </div>

      {/* Front image */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('kyc.frontSide')}</label>
        <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:border-primary transition-colors">
          {frontPreview ? (
            <div className="relative w-full">
              <img src={frontPreview} alt="Front" className="rounded-lg w-full h-32 object-cover" />
              <FileCheck className="absolute top-2 right-2 h-5 w-5 text-[hsl(var(--success))]" />
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t('kyc.tapToUpload')}</span>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile('front', e.target.files[0])} />
        </label>
      </div>

      {/* Back image */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('kyc.backSide')}</label>
        <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:border-primary transition-colors">
          {backPreview ? (
            <div className="relative w-full">
              <img src={backPreview} alt="Back" className="rounded-lg w-full h-32 object-cover" />
              <FileCheck className="absolute top-2 right-2 h-5 w-5 text-[hsl(var(--success))]" />
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t('kyc.tapToUpload')}</span>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile('back', e.target.files[0])} />
        </label>
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

export default KycDocumentUpload;
