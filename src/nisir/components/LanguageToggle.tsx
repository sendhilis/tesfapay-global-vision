import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
      className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm border border-border transition-colors hover:bg-muted"
      aria-label="Toggle language"
    >
      <Globe className="h-4 w-4" />
      <span>{language === 'en' ? 'አማ' : 'EN'}</span>
    </button>
  );
};

export default LanguageToggle;
