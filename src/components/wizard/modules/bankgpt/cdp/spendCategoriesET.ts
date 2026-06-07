/**
 * Ethiopia-flavoured spend categories + anomaly detection.
 * Mirrors the CDP framework from the reference project.
 */
export const SPEND_CATEGORIES = [
  'Food & Groceries',
  'Transport',
  'Housing & Rent',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Education',
  'Airtime & Data',
  'Clothing',
  'Remittance',
] as const;

export type SpendCategory = typeof SPEND_CATEGORIES[number];

export interface CategorySpend {
  category: SpendCategory;
  amount: number;
  percentOfIncome: number;
  changeFromAvg: number;
  isAnomaly: boolean;
}

export interface SpendAlert {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  category?: SpendCategory;
  impactOnSavings: number;
}

export interface SpendProfile {
  categories: CategorySpend[];
  totalSpend: number;
  topCategory: SpendCategory;
  anomalyCount: number;
  alerts: SpendAlert[];
  savingsLeakage: number;
  weeklySpendTrend: number[];
  monthOverMonthChange: number;
}

const BASE_ALLOCATIONS: Record<SpendCategory, [number, number]> = {
  'Food & Groceries': [0.25, 0.35],
  'Transport':        [0.08, 0.15],
  'Housing & Rent':   [0.15, 0.30],
  'Utilities':        [0.04, 0.08],
  'Entertainment':    [0.03, 0.10],
  'Healthcare':       [0.02, 0.06],
  'Education':        [0.03, 0.10],
  'Airtime & Data':   [0.03, 0.07],
  'Clothing':         [0.02, 0.06],
  'Remittance':       [0.02, 0.08],
};

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }

export function generateSpendProfile(
  monthlyIncome: number,
  monthlySpend: number,
  customerIndex: number,
): SpendProfile {
  const rawAllocations: { category: SpendCategory; fraction: number }[] = [];
  let totalFrac = 0;

  for (const cat of SPEND_CATEGORIES) {
    const [lo, hi] = BASE_ALLOCATIONS[cat];
    let frac = rand(lo, hi);
    if (customerIndex % 3 === 0 && (cat === 'Entertainment' || cat === 'Remittance')) frac *= rand(1.5, 2.5);
    if (customerIndex % 4 === 0 && cat === 'Airtime & Data') frac *= rand(1.6, 2.2);
    rawAllocations.push({ category: cat, fraction: frac });
    totalFrac += frac;
  }

  const categories: CategorySpend[] = rawAllocations.map(({ category, fraction }) => {
    const normalizedFrac = fraction / totalFrac;
    const amount = Math.round(monthlySpend * normalizedFrac);
    const percentOfIncome = +(normalizedFrac * (monthlySpend / monthlyIncome) * 100).toFixed(1);
    const changeFromAvg = +(rand(-15, 50) * (fraction > BASE_ALLOCATIONS[category][1] ? 1.5 : 0.7)).toFixed(1);
    const isAnomaly = changeFromAvg > 40;
    return { category, amount, percentOfIncome, changeFromAvg, isAnomaly };
  }).sort((a, b) => b.amount - a.amount);

  const anomalyCount = categories.filter(c => c.isAnomaly).length;
  const topCategory = categories[0].category;
  const alerts: SpendAlert[] = [];

  for (const cat of categories) {
    if (cat.isAnomaly) {
      const overspend = Math.round(cat.amount * (cat.changeFromAvg / (100 + cat.changeFromAvg)));
      alerts.push({
        severity: cat.changeFromAvg > 60 ? 'critical' : 'warning',
        message: `${cat.category} spending is ${cat.changeFromAvg.toFixed(0)}% above your 3-month average`,
        category: cat.category,
        impactOnSavings: overspend,
      });
    }
  }

  const savingsRate = (monthlyIncome - monthlySpend) / monthlyIncome;
  if (savingsRate < 0.05) {
    alerts.push({ severity: 'critical', message: `Savings rate is only ${(savingsRate * 100).toFixed(1)}% — critically below the 10% target`, impactOnSavings: Math.round(monthlyIncome * 0.05) });
  } else if (savingsRate < 0.10) {
    alerts.push({ severity: 'warning', message: `Savings rate at ${(savingsRate * 100).toFixed(1)}% — below the recommended 10% minimum`, impactOnSavings: Math.round(monthlyIncome * (0.10 - savingsRate)) });
  }

  const nonEssentialCats: SpendCategory[] = ['Entertainment', 'Clothing', 'Remittance'];
  const nonEssentialTotal = categories.filter(c => nonEssentialCats.includes(c.category)).reduce((s, c) => s + c.amount, 0);
  const nonEssentialPct = nonEssentialTotal / monthlyIncome;
  if (nonEssentialPct > 0.15) {
    alerts.push({ severity: 'warning', message: `Non-essential spending is ${(nonEssentialPct * 100).toFixed(0)}% of income`, impactOnSavings: Math.round(nonEssentialTotal - monthlyIncome * 0.12) });
  }

  if (savingsRate < 0.08) {
    alerts.push({ severity: 'info', message: 'At current savings rate, your savings goal deadline will slip by 3+ months', impactOnSavings: 0 });
  }

  const savingsLeakage = alerts.reduce((s, a) => s + a.impactOnSavings, 0);
  const weeklyBase = monthlySpend / 4;
  const weeklySpendTrend = [
    Math.round(weeklyBase * rand(0.85, 1.0)),
    Math.round(weeklyBase * rand(0.9, 1.05)),
    Math.round(weeklyBase * rand(0.95, 1.1)),
    Math.round(weeklyBase * rand(1.0, 1.25)),
  ];
  const monthOverMonthChange = +(rand(-8, 18)).toFixed(1);

  return { categories, totalSpend: monthlySpend, topCategory, anomalyCount, alerts, savingsLeakage, weeklySpendTrend, monthOverMonthChange };
}
