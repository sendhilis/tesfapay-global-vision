import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck, Crown, ChevronRight, Zap, ArrowUpRight } from 'lucide-react';

interface KycTierCardProps {
  currentTier: string | null;
  completeness: number;
}

const tierConfig = {
  pending: {
    level: 0,
    icon: Shield,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    borderColor: 'border-muted-foreground/20',
    gradientFrom: 'from-muted',
    gradientTo: 'to-muted/50',
    labelKey: 'kyc.tier.unverified',
    nextTier: 'basic',
    nextLabelKey: 'kyc.tier.basic',
    benefitsKeys: ['kyc.upgrade.basic1', 'kyc.upgrade.basic2', 'kyc.upgrade.basic3'],
  },
  simplified: {
    level: 1,
    icon: Shield,
    color: 'text-info',
    bgColor: 'bg-info/10',
    borderColor: 'border-info/30',
    gradientFrom: 'from-info/20',
    gradientTo: 'to-info/5',
    labelKey: 'kyc.tier.basic',
    nextTier: 'standard',
    nextLabelKey: 'kyc.tier.standard',
    benefitsKeys: ['kyc.upgrade.standard1', 'kyc.upgrade.standard2', 'kyc.upgrade.standard3'],
  },
  full: {
    level: 2,
    icon: ShieldCheck,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
    gradientFrom: 'from-success/20',
    gradientTo: 'to-success/5',
    labelKey: 'kyc.tier.standard',
    nextTier: 'premium',
    nextLabelKey: 'kyc.tier.premium',
    benefitsKeys: ['kyc.upgrade.premium1', 'kyc.upgrade.premium2', 'kyc.upgrade.premium3'],
  },
  premium: {
    level: 3,
    icon: Crown,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    gradientFrom: 'from-amber-500/20',
    gradientTo: 'to-amber-500/5',
    labelKey: 'kyc.tier.premium',
    nextTier: null,
    nextLabelKey: null,
    benefitsKeys: [],
  },
};

// Map DB values: full with profile_completeness >= 95 = premium
const resolveTier = (dbTier: string | null, completeness: number): string => {
  if (!dbTier || dbTier === 'pending' || dbTier === 'rejected' || dbTier === 'expired') return 'pending';
  if (dbTier === 'simplified') return 'simplified';
  if (dbTier === 'full' && completeness >= 95) return 'premium';
  if (dbTier === 'full') return 'full';
  return 'pending';
};

const KycTierCard = ({ currentTier, completeness }: KycTierCardProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const resolvedTier = resolveTier(currentTier, completeness);
  const config = tierConfig[resolvedTier as keyof typeof tierConfig] || tierConfig.pending;
  const Icon = config.icon;
  const isMaxTier = !config.nextTier;

  const tierDots = [0, 1, 2, 3];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className={`rounded-2xl border ${config.borderColor} bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} p-4`}
    >
      {/* Tier Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`h-9 w-9 rounded-xl ${config.bgColor} flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${config.color}`} />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{t('kyc.yourLevel')}</p>
            <p className={`text-sm font-bold ${config.color}`}>{t(config.labelKey)}</p>
          </div>
        </div>

        {/* Level Dots */}
        <div className="flex items-center gap-1">
          {tierDots.map((dot) => (
            <div
              key={dot}
              className={`h-2 w-2 rounded-full transition-colors ${
                dot <= config.level
                  ? dot === config.level
                    ? `${config.color.replace('text-', 'bg-')}`
                    : 'bg-foreground/30'
                  : 'bg-muted-foreground/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Completeness Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">{t('retail.profileComplete')}</span>
          <span className="text-[10px] font-semibold text-foreground">{completeness}%</span>
        </div>
        <div className="h-1.5 bg-background/50 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              completeness >= 95 ? 'bg-amber-500' :
              completeness >= 70 ? 'bg-success' :
              completeness >= 30 ? 'bg-info' : 'bg-muted-foreground'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${completeness}%` }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
        </div>
      </div>

      {/* Upgrade Prompt */}
      {!isMaxTier && (
        <button
          onClick={() => navigate('/retail/kyc')}
          className="w-full rounded-xl bg-card border border-border p-3 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-bold text-foreground">
                {t('kyc.upgradeToNext')} {t(config.nextLabelKey!)}
              </span>
            </div>
            <ArrowUpRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <div className="space-y-1">
            {config.benefitsKeys.map((key) => (
              <div key={key} className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-success" />
                <span className="text-[11px] text-muted-foreground">{t(key)}</span>
              </div>
            ))}
          </div>
        </button>
      )}

      {isMaxTier && (
        <div className="flex items-center gap-2 px-1">
          <Crown className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-[11px] text-muted-foreground">{t('kyc.maxTierReached')}</span>
        </div>
      )}
    </motion.div>
  );
};

export default KycTierCard;
