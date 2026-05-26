import { useLanguage } from '@nisir/contexts/LanguageContext';
import { Shield, ShieldCheck, Crown, Check, ChevronRight, Wallet, Send, CreditCard, HandCoins, Building, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import type { KycTier } from '@nisir/pages/retail/KycWizard';

interface Props {
  currentTier: string;
  onSelect: (tier: KycTier) => void;
}

const tiers = [
  {
    id: 'basic' as KycTier,
    icon: Shield,
    color: 'bg-muted',
    iconColor: 'text-muted-foreground',
    borderColor: 'border-muted',
    features: [
      { key: 'kyc.basic.feature1', icon: Wallet },
      { key: 'kyc.basic.feature2', icon: Send },
    ],
    limits: 'kyc.basic.limits',
    requirements: 'kyc.basic.requirements',
  },
  {
    id: 'standard' as KycTier,
    icon: ShieldCheck,
    color: 'bg-primary/10',
    iconColor: 'text-primary',
    borderColor: 'border-primary/30',
    features: [
      { key: 'kyc.standard.feature1', icon: CreditCard },
      { key: 'kyc.standard.feature2', icon: HandCoins },
      { key: 'kyc.standard.feature3', icon: Send },
    ],
    limits: 'kyc.standard.limits',
    requirements: 'kyc.standard.requirements',
  },
  {
    id: 'premium' as KycTier,
    icon: Crown,
    color: 'bg-accent-gold/10',
    iconColor: 'text-accent-gold',
    borderColor: 'border-accent-gold/30',
    features: [
      { key: 'kyc.premium.feature1', icon: Building },
      { key: 'kyc.premium.feature2', icon: Globe },
      { key: 'kyc.premium.feature3', icon: HandCoins },
      { key: 'kyc.premium.feature4', icon: CreditCard },
    ],
    limits: 'kyc.premium.limits',
    requirements: 'kyc.premium.requirements',
  },
];

const KycTierSelector = ({ currentTier, onSelect }: Props) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-foreground">{t('kyc.chooseTier')}</h3>
        <p className="text-xs text-muted-foreground mt-1">{t('kyc.chooseTierDesc')}</p>
      </div>

      {tiers.map((tier, i) => {
        const Icon = tier.icon;
        const isCompleted = (currentTier === 'simplified' && tier.id === 'basic') ||
                           (currentTier === 'full' && (tier.id === 'basic' || tier.id === 'standard'));
        return (
          <motion.button
            key={tier.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onSelect(tier.id)}
            className={`w-full text-left p-4 rounded-2xl border-2 ${tier.borderColor} bg-card transition-all hover:shadow-md`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-10 w-10 rounded-xl ${tier.color} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${tier.iconColor}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-foreground">{t(`kyc.tier.${tier.id}`)}</h4>
                  {isCompleted && (
                    <span className="text-[10px] bg-success/20 text-success px-2 py-0.5 rounded-full font-medium">
                      {t('kyc.completed')}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">{t(tier.limits)}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="space-y-1.5 mb-2">
              {tier.features.map((f) => {
                const FIcon = f.icon;
                return (
                  <div key={f.key} className="flex items-center gap-2">
                    <FIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-foreground">{t(f.key)}</span>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-muted-foreground italic">{t(tier.requirements)}</p>
          </motion.button>
        );
      })}
    </div>
  );
};

export default KycTierSelector;
