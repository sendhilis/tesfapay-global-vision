import { motion } from 'framer-motion';
import { Building2, Tractor, Smartphone, ShoppingCart, Home, Car, Briefcase, Sparkles } from 'lucide-react';

export interface LoanProduct {
  type: string;
  name: string;
  description: string;
  maxAmount: number;
  rate: number;
  maxTenor: number;
  icon: React.ReactNode;
  gradient: string;
  iconBg?: string;
  textColor?: string;
  mutedColor?: string;
}

export const loanProducts: LoanProduct[] = [
  {
    type: 'micro',
    name: 'Micro Business',
    description: 'Upgrade your micro business',
    maxAmount: 50000,
    rate: 18,
    maxTenor: 18,
    icon: <Smartphone className="h-5 w-5" />,
    gradient: 'from-[hsl(152,55%,22%)] to-[hsl(152,45%,32%)]',
    iconBg: 'bg-[hsl(152,55%,30%)]/20',
    textColor: 'text-primary-foreground',
    mutedColor: 'text-primary-foreground/70',
  },
  {
    type: 'retail',
    name: 'Personal Loan',
    description: 'Personal needs & assets',
    maxAmount: 200000,
    rate: 15,
    maxTenor: 36,
    icon: <ShoppingCart className="h-5 w-5" />,
    gradient: 'from-[hsl(200,65%,38%)] to-[hsl(200,55%,48%)]',
    iconBg: 'bg-[hsl(200,65%,50%)]/20',
    textColor: 'text-primary-foreground',
    mutedColor: 'text-primary-foreground/70',
  },
  {
    type: 'nano',
    name: 'Nano Loan',
    description: 'Quick short-term finance',
    maxAmount: 5000,
    rate: 20,
    maxTenor: 3,
    icon: <Sparkles className="h-5 w-5" />,
    gradient: 'from-[hsl(42,85%,50%)] to-[hsl(38,90%,55%)]',
    iconBg: 'bg-[hsl(42,85%,60%)]/20',
    textColor: 'text-[hsl(160,30%,12%)]',
    mutedColor: 'text-[hsl(160,30%,12%)]/70',
  },
  {
    type: 'agri',
    name: 'Agricultural',
    description: 'Farming inputs & equipment',
    maxAmount: 100000,
    rate: 12,
    maxTenor: 24,
    icon: <Tractor className="h-5 w-5" />,
    gradient: 'from-[hsl(152,50%,30%)] to-[hsl(130,45%,40%)]',
    iconBg: 'bg-[hsl(130,45%,45%)]/20',
    textColor: 'text-primary-foreground',
    mutedColor: 'text-primary-foreground/70',
  },
  {
    type: 'msme',
    name: 'SME Loan',
    description: 'Business operations & growth',
    maxAmount: 500000,
    rate: 14,
    maxTenor: 36,
    icon: <Building2 className="h-5 w-5" />,
    gradient: 'from-[hsl(260,45%,40%)] to-[hsl(260,40%,52%)]',
    iconBg: 'bg-[hsl(260,40%,55%)]/20',
    textColor: 'text-primary-foreground',
    mutedColor: 'text-primary-foreground/70',
  },
  {
    type: 'consumer',
    name: 'Housing Loan',
    description: 'Home purchase & construction',
    maxAmount: 1000000,
    rate: 13,
    maxTenor: 60,
    icon: <Home className="h-5 w-5" />,
    gradient: 'from-[hsl(25,80%,50%)] to-[hsl(30,75%,55%)]',
    iconBg: 'bg-[hsl(25,80%,60%)]/20',
    textColor: 'text-primary-foreground',
    mutedColor: 'text-primary-foreground/70',
  },
];

const fmt = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toString();

interface LoanProductCardsProps {
  onSelect: (product: LoanProduct) => void;
}

const LoanProductCards = ({ onSelect }: LoanProductCardsProps) => (
  <div className="space-y-3">
    <p className="text-xs font-bold text-foreground uppercase tracking-wider px-1">Choose a Loan Product</p>
    <div className="grid grid-cols-2 gap-3">
      {loanProducts.map((product, i) => (
        <motion.button
          key={product.type}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          whileHover={{ y: -5, boxShadow: '0 12px 28px hsl(160 30% 12% / 0.12)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(product)}
          className={`relative bg-gradient-to-br ${product.gradient} rounded-2xl p-3.5 border border-white/10 text-left transition-colors shadow-lg`}
        >
          <motion.div
            className={`w-9 h-9 rounded-xl ${product.iconBg || 'bg-white/20'} flex items-center justify-center ${product.textColor || 'text-primary-foreground'} mb-2.5`}
            whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
            transition={{ duration: 0.4 }}
          >
            {product.icon}
          </motion.div>
          <p className={`text-sm font-bold ${product.textColor || 'text-primary-foreground'} leading-tight`}>{product.name}</p>
          <p className={`text-[10px] ${product.mutedColor || 'text-primary-foreground/70'} mt-0.5 leading-tight`}>{product.description}</p>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className={`text-xs font-extrabold ${product.textColor || 'text-primary-foreground'}`}>Up to {fmt(product.maxAmount)}</span>
            <span className={`text-[10px] ${product.mutedColor || 'text-primary-foreground/70'}`}>ETB</span>
          </div>
          <div className="flex gap-2 mt-1.5">
            <span className={`text-[9px] ${product.mutedColor || 'text-primary-foreground/70'}`}>{product.rate}% p.a.</span>
            <span className={`text-[9px] ${product.mutedColor || 'text-primary-foreground/70'}`}>•</span>
            <span className={`text-[9px] ${product.mutedColor || 'text-primary-foreground/70'}`}>{product.maxTenor}mo max</span>
          </div>
        </motion.button>
      ))}
    </div>
  </div>
);

export default LoanProductCards;
