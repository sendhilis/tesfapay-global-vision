import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CreditScoreGaugeProps {
  score: number;
  maxScore?: number;
}

const scoreFactors = [
  { label: 'Payment History', value: 95, source: 'Bureau', weight: '35%' },
  { label: 'Credit Utilization', value: 82, source: 'Bureau', weight: '20%' },
  { label: 'Mobile Money Activity', value: 91, source: 'Alternate', weight: '15%' },
  { label: 'Savings Consistency', value: 88, source: 'Alternate', weight: '10%' },
  { label: 'Account Age', value: 78, source: 'Bureau', weight: '10%' },
  { label: 'Digital Footprint', value: 85, source: 'Alternate', weight: '10%' },
];

const getScoreColor = (score: number) => {
  if (score >= 750) return 'hsl(var(--success))';
  if (score >= 650) return 'hsl(var(--warning))';
  return 'hsl(var(--destructive))';
};

const getScoreLabel = (score: number) => {
  if (score >= 800) return 'Excellent';
  if (score >= 750) return 'Very Good';
  if (score >= 650) return 'Good';
  if (score >= 550) return 'Fair';
  return 'Poor';
};

const CreditScoreGauge = ({ score, maxScore = 900 }: CreditScoreGaugeProps) => {
  const percentage = (score / maxScore) * 100;
  const color = getScoreColor(score);
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (percentage / 100) * circumference * 0.75; // 270° arc

  return (
    <div className="space-y-4">
      {/* Gauge */}
      <div className="relative flex items-center justify-center">
        <svg viewBox="0 0 160 130" className="w-48 h-36">
          {/* Background arc */}
          <path
            d="M 15 110 A 70 70 0 1 1 145 110"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Score arc */}
          <motion.path
            d="M 15 110 A 70 70 0 1 1 145 110"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.75}`}
            initial={{ strokeDashoffset: circumference * 0.75 }}
            animate={{ strokeDashoffset: circumference * 0.75 - (percentage / 100) * circumference * 0.75 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
          {/* Gradient glow */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
        <div className="absolute bottom-2 text-center">
          <motion.p
            className="text-3xl font-extrabold"
            style={{ color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            {score}
          </motion.p>
          <p className="text-[10px] text-muted-foreground font-medium">out of {maxScore}</p>
        </div>
      </div>

      {/* Score label */}
      <div className="text-center">
        <motion.span
          className="inline-block px-3 py-1 rounded-full text-xs font-bold"
          style={{ backgroundColor: `${color}20`, color }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          {getScoreLabel(score)}
        </motion.span>
      </div>

      {/* Score breakdown */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 mb-2">
          <p className="text-xs font-bold text-foreground">Score Breakdown</p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[260px] text-xs">
                <p className="font-semibold mb-1">Hybrid Credit Scoring</p>
                <p>Your score combines traditional credit bureau data (65%) with alternate data signals (35%) including mobile money usage, savings patterns, and digital footprint analysis.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {scoreFactors.map((factor, i) => (
          <motion.div
            key={factor.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="text-foreground font-medium">{factor.label}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                  factor.source === 'Bureau' ? 'bg-primary/10 text-primary' : 'bg-accent/20 text-accent-foreground'
                }`}>
                  {factor.source}
                </span>
              </div>
              <span className="text-muted-foreground">{factor.weight}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: factor.value >= 85 ? 'hsl(var(--success))' : factor.value >= 70 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))' }}
                initial={{ width: 0 }}
                animate={{ width: `${factor.value}%` }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CreditScoreGauge;
