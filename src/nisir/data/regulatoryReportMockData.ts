// Ethiopian names for realistic mock data
const firstNames = ['Abebe', 'Almaz', 'Bekele', 'Chaltu', 'Dawit', 'Emebet', 'Fikru', 'Genet', 'Hailu', 'Hiwot',
  'Kebede', 'Lemlem', 'Meseret', 'Nigist', 'Tadesse', 'Tigist', 'Worku', 'Yeshiwork', 'Zerihun', 'Selamawit',
  'Getachew', 'Birtukan', 'Dereje', 'Mulu', 'Tesfaye', 'Rahel', 'Solomon', 'Bezawit', 'Girma', 'Asnakech',
  'Mulugeta', 'Tsehay', 'Berhanu', 'Tsedale', 'Yohannes', 'Ayelech', 'Kassahun', 'Woinshet', 'Mengistu', 'Aster'];

const fatherNames = ['Alemu', 'Tadesse', 'Bekele', 'Haile', 'Gebre', 'Tekle', 'Wolde', 'Debebe', 'Mesfin', 'Assefa',
  'Kebede', 'Girma', 'Tessema', 'Negash', 'Abera', 'Demissie', 'Shiferaw', 'Ayele', 'Bogale', 'Lemma'];

const regions = [
  { name: 'Addis Ababa', weight: 42 }, { name: 'Oromia', weight: 18 }, { name: 'Amhara', weight: 14 },
  { name: 'SNNPR', weight: 10 }, { name: 'Tigray', weight: 8 }, { name: 'Sidama', weight: 4 },
  { name: 'Dire Dawa', weight: 2 }, { name: 'Harari', weight: 2 }
];

const woredas: Record<string, string[]> = {
  'Addis Ababa': ['Bole', 'Kirkos', 'Yeka', 'Kolfe Keranio', 'Lideta', 'Arada', 'Nifas Silk-Lafto', 'Gulele', 'Addis Ketema', 'Akaki Kality'],
  'Oromia': ['Adama', 'Bishoftu', 'Jimma', 'Nekemte', 'Shashemene', 'Ambo', 'Asella', 'Batu'],
  'Amhara': ['Bahir Dar', 'Gondar', 'Dessie', 'Debre Markos', 'Kombolcha', 'Debre Birhan'],
  'SNNPR': ['Hawassa', 'Sodo', 'Arba Minch', 'Dilla', 'Hossana'],
  'Tigray': ['Mekelle', 'Adwa', 'Axum', 'Adigrat', 'Shire'],
  'Sidama': ['Hawassa', 'Yirgalem'],
  'Dire Dawa': ['Dire Dawa'],
  'Harari': ['Harar']
};

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

const rand = seededRandom(42);
function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]; }
function pickWeighted(items: typeof regions): string {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rand() * total;
  for (const item of items) { r -= item.weight; if (r <= 0) return item.name; }
  return items[0].name;
}

// Generate 1000 customers
export interface MockCustomer {
  id: string;
  name: string;
  gender: 'M' | 'F';
  kycTier: 'tier1' | 'tier2' | 'tier3';
  region: string;
  woreda: string;
  accountType: 'savings' | 'wallet' | 'current';
  balance: number;
  loanOutstanding: number;
  loanProduct: string;
  daysPastDue: number;
  grade: number;
  gradeLabel: string;
  isUrban: boolean;
  accountOpenedMonth: number; // 1-12
}

const loanProducts = ['micro', 'personal', 'business', 'salary_advance', 'agricultural'];
const gradeLabels = ['', 'Pass', 'Special Mention', 'Substandard', 'Doubtful', 'Loss'];
const provisionRates = [0, 0.01, 0.10, 0.20, 0.50, 1.00];

export const mockCustomers: MockCustomer[] = Array.from({ length: 1000 }, (_, i) => {
  const region = pickWeighted(regions);
  const woreda = pick(woredas[region] || ['Unknown']);
  const gender = rand() > 0.45 ? 'M' as const : 'F' as const;
  const kycTier = rand() < 0.3 ? 'tier1' as const : rand() < 0.7 ? 'tier2' as const : 'tier3' as const;
  const hasLoan = rand() < 0.55;
  const balance = Math.round((rand() * 80000 + 500) * 100) / 100;
  let daysPastDue = 0;
  let grade = 1;
  if (hasLoan) {
    const r = rand();
    if (r < 0.65) daysPastDue = Math.floor(rand() * 30);
    else if (r < 0.80) daysPastDue = 31 + Math.floor(rand() * 60);
    else if (r < 0.90) daysPastDue = 91 + Math.floor(rand() * 90);
    else if (r < 0.96) daysPastDue = 181 + Math.floor(rand() * 180);
    else daysPastDue = 361 + Math.floor(rand() * 200);
    if (daysPastDue <= 30) grade = 1;
    else if (daysPastDue <= 90) grade = 2;
    else if (daysPastDue <= 180) grade = 3;
    else if (daysPastDue <= 360) grade = 4;
    else grade = 5;
  }

  return {
    id: `CUST-${String(i + 1).padStart(4, '0')}`,
    name: `${pick(firstNames)} ${pick(fatherNames)}`,
    gender,
    kycTier,
    region,
    woreda,
    accountType: rand() < 0.5 ? 'savings' : rand() < 0.8 ? 'wallet' : 'current',
    balance,
    loanOutstanding: hasLoan ? Math.round((rand() * 150000 + 2000) * 100) / 100 : 0,
    loanProduct: hasLoan ? pick(loanProducts) : '',
    daysPastDue,
    grade: hasLoan ? grade : 0,
    gradeLabel: hasLoan ? gradeLabels[grade] : '',
    isUrban: ['Addis Ababa', 'Dire Dawa', 'Harari'].includes(region) || rand() < 0.4,
    accountOpenedMonth: Math.floor(rand() * 12) + 1,
  };
});

// Aggregated data computations
export const computeBalanceSheet = () => {
  const totalWallets = mockCustomers.filter(c => c.accountType === 'wallet').reduce((s, c) => s + c.balance, 0);
  const totalSavings = mockCustomers.filter(c => c.accountType === 'savings').reduce((s, c) => s + c.balance, 0);
  const totalCurrent = mockCustomers.filter(c => c.accountType === 'current').reduce((s, c) => s + c.balance, 0);
  const grossLoans = mockCustomers.reduce((s, c) => s + c.loanOutstanding, 0);
  const provision = mockCustomers.reduce((s, c) => c.grade > 0 ? s + c.loanOutstanding * provisionRates[c.grade] : s, 0);
  const netLoans = grossLoans - provision;
  const cashAtBank = 12500000;
  const fixedAssets = 8200000;
  const otherAssets = 3100000;
  const totalAssets = totalWallets + netLoans + cashAtBank + fixedAssets + otherAssets;
  const totalDeposits = totalSavings + totalCurrent;
  const borrowings = 5000000;
  const otherLiabilities = 1800000;
  const totalLiabilities = totalDeposits + borrowings + otherLiabilities;
  const paidUpCapital = 75000000;
  const retainedEarnings = totalAssets - totalLiabilities - paidUpCapital - 4500000;
  const legalReserve = 4500000;
  const totalEquity = paidUpCapital + retainedEarnings + legalReserve;
  return {
    assets: [
      { item: 'Cash and Bank Balances', code: 'ASSET-001', amount: cashAtBank },
      { item: 'Digital Wallet Balances', code: 'ASSET-002', amount: totalWallets },
      { item: 'Gross Loan Portfolio', code: 'ASSET-003', amount: grossLoans },
      { item: 'Less: Provision for Loan Losses', code: 'ASSET-003a', amount: -provision },
      { item: 'Net Loan Portfolio', code: 'ASSET-003b', amount: netLoans },
      { item: 'Fixed Assets', code: 'ASSET-004', amount: fixedAssets },
      { item: 'Other Assets', code: 'ASSET-005', amount: otherAssets },
      { item: 'Total Assets', code: '', amount: totalAssets },
    ],
    liabilities: [
      { item: 'Customer Savings Deposits', code: 'LIAB-001', amount: totalSavings },
      { item: 'Current Account Deposits', code: 'LIAB-002', amount: totalCurrent },
      { item: 'Borrowings', code: 'LIAB-003', amount: borrowings },
      { item: 'Other Liabilities', code: 'LIAB-004', amount: otherLiabilities },
      { item: 'Total Liabilities', code: '', amount: totalLiabilities },
    ],
    equity: [
      { item: 'Paid-up Capital', code: 'EQ-001', amount: paidUpCapital },
      { item: 'Legal Reserve (25% net profit)', code: 'EQ-002', amount: legalReserve },
      { item: 'Retained Earnings', code: 'EQ-003', amount: retainedEarnings },
      { item: 'Total Equity', code: '', amount: totalEquity },
    ],
    totalAssets,
    totalLiabilities,
    totalEquity,
    balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    paidUpCapital,
    grossLoans,
    provision,
  };
};

export const computeIncomeStatement = () => {
  const grossLoans = mockCustomers.reduce((s, c) => s + c.loanOutstanding, 0);
  const interestIncome = Math.round(grossLoans * 0.24 / 4);
  const feeIncome = Math.round(grossLoans * 0.02);
  const penaltyIncome = Math.round(mockCustomers.filter(c => c.daysPastDue > 30).reduce((s, c) => s + c.loanOutstanding * 0.005, 0));
  const commissionIncome = 1850000;
  const merchantFees = 920000;
  const totalIncome = interestIncome + feeIncome + penaltyIncome + commissionIncome + merchantFees;
  const interestExpense = Math.round(mockCustomers.filter(c => c.accountType === 'savings').reduce((s, c) => s + c.balance * 0.075 / 4, 0));
  const provision = Math.round(mockCustomers.reduce((s, c) => c.grade > 0 ? s + c.loanOutstanding * provisionRates[c.grade] : s, 0) * 0.25);
  const staffCosts = 4200000;
  const adminExpenses = 1800000;
  const itCosts = 950000;
  const totalExpense = interestExpense + provision + staffCosts + adminExpenses + itCosts;
  const netOperating = totalIncome - totalExpense;
  const tax = Math.round(netOperating * 0.30);
  const netIncome = netOperating - tax;
  return {
    lines: [
      { line: 1, desc: 'Interest Income on Loans', amount: interestIncome, category: 'Financial Income' },
      { line: 2, desc: 'Fee Income (Origination)', amount: feeIncome, category: 'Financial Income' },
      { line: 3, desc: 'Penalty Income', amount: penaltyIncome, category: 'Financial Income' },
      { line: 4, desc: 'Commission Income (Agent)', amount: commissionIncome, category: 'Non-Financial Income' },
      { line: 5, desc: 'Merchant Settlement Fees', amount: merchantFees, category: 'Non-Financial Income' },
      { line: 6, desc: 'Total Operating Income', amount: totalIncome, category: 'Total' },
      { line: 7, desc: 'Interest Expense on Deposits', amount: interestExpense, category: 'Financial Expense' },
      { line: 8, desc: 'Provision for Loan Losses', amount: provision, category: 'Impairment' },
      { line: 9, desc: 'Staff Costs', amount: staffCosts, category: 'Operating Expense' },
      { line: 10, desc: 'Administrative Expenses', amount: adminExpenses, category: 'Operating Expense' },
      { line: 11, desc: 'IT and Platform Costs', amount: itCosts, category: 'Operating Expense' },
      { line: 12, desc: 'Total Operating Expenses', amount: totalExpense, category: 'Total' },
      { line: 13, desc: 'Net Operating Income', amount: netOperating, category: 'Net' },
      { line: 14, desc: 'Income Tax (30%)', amount: tax, category: 'Tax' },
      { line: 15, desc: 'Net Income After Tax', amount: netIncome, category: 'Net' },
    ],
    roa: ((netIncome / (computeBalanceSheet().totalAssets || 1)) * 100).toFixed(2),
    roe: ((netIncome / (computeBalanceSheet().totalEquity || 1)) * 100).toFixed(2),
    ossr: ((totalIncome / (interestExpense + provision + staffCosts + adminExpenses + itCosts || 1)) * 100).toFixed(1),
  };
};

export const computeAssetQuality = () => {
  const borrowers = mockCustomers.filter(c => c.loanOutstanding > 0);
  const grades = [1, 2, 3, 4, 5].map(g => {
    const loans = borrowers.filter(c => c.grade === g);
    const outstanding = loans.reduce((s, c) => s + c.loanOutstanding, 0);
    return {
      grade: g,
      label: gradeLabels[g],
      loanCount: loans.length,
      outstanding,
      provisionRate: provisionRates[g],
      requiredProvision: outstanding * provisionRates[g],
    };
  });
  const grossPortfolio = grades.reduce((s, g) => s + g.outstanding, 0);
  const totalProvision = grades.reduce((s, g) => s + g.requiredProvision, 0);
  const nplOutstanding = grades.filter(g => g.grade >= 3).reduce((s, g) => s + g.outstanding, 0);
  const par30 = borrowers.filter(c => c.daysPastDue > 30).reduce((s, c) => s + c.loanOutstanding, 0);
  const par90 = borrowers.filter(c => c.daysPastDue > 90).reduce((s, c) => s + c.loanOutstanding, 0);

  const byProduct = loanProducts.map(p => {
    const loans = borrowers.filter(c => c.loanProduct === p);
    return {
      product: p.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count: loans.length,
      outstanding: loans.reduce((s, c) => s + c.loanOutstanding, 0),
      npl: loans.filter(c => c.grade >= 3).reduce((s, c) => s + c.loanOutstanding, 0),
    };
  });

  const ageing = [
    { bucket: '0-30 days', count: borrowers.filter(c => c.daysPastDue <= 30).length, amount: borrowers.filter(c => c.daysPastDue <= 30).reduce((s, c) => s + c.loanOutstanding, 0) },
    { bucket: '31-60 days', count: borrowers.filter(c => c.daysPastDue > 30 && c.daysPastDue <= 60).length, amount: borrowers.filter(c => c.daysPastDue > 30 && c.daysPastDue <= 60).reduce((s, c) => s + c.loanOutstanding, 0) },
    { bucket: '61-90 days', count: borrowers.filter(c => c.daysPastDue > 60 && c.daysPastDue <= 90).length, amount: borrowers.filter(c => c.daysPastDue > 60 && c.daysPastDue <= 90).reduce((s, c) => s + c.loanOutstanding, 0) },
    { bucket: '91-180 days', count: borrowers.filter(c => c.daysPastDue > 90 && c.daysPastDue <= 180).length, amount: borrowers.filter(c => c.daysPastDue > 90 && c.daysPastDue <= 180).reduce((s, c) => s + c.loanOutstanding, 0) },
    { bucket: '181-360 days', count: borrowers.filter(c => c.daysPastDue > 180 && c.daysPastDue <= 360).length, amount: borrowers.filter(c => c.daysPastDue > 180 && c.daysPastDue <= 360).reduce((s, c) => s + c.loanOutstanding, 0) },
    { bucket: '360+ days', count: borrowers.filter(c => c.daysPastDue > 360).length, amount: borrowers.filter(c => c.daysPastDue > 360).reduce((s, c) => s + c.loanOutstanding, 0) },
  ];

  return {
    grades,
    grossPortfolio,
    totalProvision,
    nplRatio: ((nplOutstanding / (grossPortfolio || 1)) * 100).toFixed(2),
    par30Ratio: ((par30 / (grossPortfolio || 1)) * 100).toFixed(2),
    par90Ratio: ((par90 / (grossPortfolio || 1)) * 100).toFixed(2),
    provisionCoverage: 100,
    byProduct,
    ageing,
  };
};

export const computeCAR = () => {
  const bs = computeBalanceSheet();
  const aq = computeAssetQuality();
  const cashRWA = 0; // 0% risk weight
  const govSecRWA = 0;
  const loanRWA = aq.grades.reduce((s, g) => {
    const weight = g.grade <= 2 ? 1.0 : g.grade <= 4 ? 1.5 : 0;
    return s + g.outstanding * weight;
  }, 0);
  const fixedAssetRWA = 8200000;
  const otherRWA = 3100000;
  const totalRWA = cashRWA + govSecRWA + loanRWA + fixedAssetRWA + otherRWA;
  const qualifyingCapital = bs.paidUpCapital + 4500000; // paid-up + reserves
  const carPercent = (qualifyingCapital / (totalRWA || 1)) * 100;
  return {
    components: [
      { category: 'Cash and Central Bank', amount: 12500000, riskWeight: '0%', rwa: 0 },
      { category: 'Government Securities', amount: 0, riskWeight: '20%', rwa: 0 },
      { category: 'Loans — Pass (Grade 1)', amount: aq.grades[0].outstanding, riskWeight: '100%', rwa: aq.grades[0].outstanding },
      { category: 'Loans — Special Mention (Grade 2)', amount: aq.grades[1].outstanding, riskWeight: '100%', rwa: aq.grades[1].outstanding },
      { category: 'Loans — Substandard (Grade 3)', amount: aq.grades[2].outstanding, riskWeight: '150%', rwa: aq.grades[2].outstanding * 1.5 },
      { category: 'Loans — Doubtful (Grade 4)', amount: aq.grades[3].outstanding, riskWeight: '150%', rwa: aq.grades[3].outstanding * 1.5 },
      { category: 'Loans — Loss (Grade 5, net)', amount: 0, riskWeight: '0%', rwa: 0 },
      { category: 'Fixed Assets', amount: 8200000, riskWeight: '100%', rwa: 8200000 },
      { category: 'Other Assets', amount: 3100000, riskWeight: '100%', rwa: 3100000 },
    ],
    totalRWA,
    qualifyingCapital,
    carPercent: carPercent.toFixed(2),
    compliant: carPercent >= 12,
    minRequired: 12,
  };
};

export const computeLiquidity = () => {
  const liquidAssets = 12500000 + mockCustomers.filter(c => c.accountType === 'wallet').reduce((s, c) => s + c.balance, 0);
  const totalDeposits = mockCustomers.filter(c => ['savings', 'current'].includes(c.accountType)).reduce((s, c) => s + c.balance, 0);
  const ratio = (liquidAssets / (totalDeposits || 1)) * 100;
  return {
    liquidAssets,
    totalDeposits,
    ratio: ratio.toFixed(2),
    compliant: ratio >= 20,
    minRequired: 20,
    maturityGap: [
      { bucket: '0-7 days', assets: 8500000, liabilities: 2100000 },
      { bucket: '8-30 days', assets: 6200000, liabilities: 4500000 },
      { bucket: '31-90 days', assets: 12800000, liabilities: 8200000 },
      { bucket: '91-180 days', assets: 18500000, liabilities: 12000000 },
      { bucket: '> 180 days', assets: 35000000, liabilities: 22000000 },
    ],
  };
};

export const computeKYCStats = () => {
  const tiers: Array<{ tier: string; label: string; dailyLimit: number }> = [
    { tier: 'tier1', label: 'Tier 1 — Simplified KYC', dailyLimit: 5000 },
    { tier: 'tier2', label: 'Tier 2 — Standard KYC', dailyLimit: 50000 },
    { tier: 'tier3', label: 'Tier 3 — Full KYC', dailyLimit: 200000 },
  ];
  return tiers.map(t => {
    const customers = mockCustomers.filter(c => c.kycTier === t.tier);
    const breaches = Math.floor(customers.length * 0.02);
    return {
      ...t,
      customerCount: customers.length,
      accountsOpened: Math.floor(customers.length * 0.15),
      totalDeposits: customers.reduce((s, c) => s + c.balance, 0),
      breaches,
      pendingUpgrades: Math.floor(customers.length * 0.08),
      docsVerified: Math.floor(customers.length * 0.85),
      docsRejected: Math.floor(customers.length * 0.05),
    };
  });
};

export const computeAgentNetwork = () => {
  const agents = [
    { id: 'AGT-001', name: 'Desta Alemu', category: 'super_agent', location: 'Addis Ababa', cashIn: 2850000, cashOut: 1920000, commission: 85500, float: 1501500, maxFloat: 10000000, customers: 245, txnCount: 1820, status: 'active' },
    { id: 'AGT-002', name: 'Samuel Express', category: 'agent', location: 'Hawassa', cashIn: 1250000, cashOut: 980000, commission: 44600, float: 650000, maxFloat: 2000000, customers: 156, txnCount: 980, status: 'active' },
    { id: 'AGT-003', name: 'Kiros Agency', category: 'agent', location: 'Mekelle', cashIn: 890000, cashOut: 720000, commission: 32200, float: 420000, maxFloat: 2000000, customers: 98, txnCount: 650, status: 'active' },
    { id: 'AGT-004', name: 'Almaz Digital', category: 'sub_agent', location: 'Bole', cashIn: 580000, cashOut: 450000, commission: 20600, float: 280000, maxFloat: 500000, customers: 67, txnCount: 420, status: 'active' },
    { id: 'AGT-005', name: 'Biruk Mobile', category: 'agent', location: 'Bahir Dar', cashIn: 1120000, cashOut: 860000, commission: 39600, float: 520000, maxFloat: 2000000, customers: 134, txnCount: 880, status: 'active' },
    { id: 'AGT-006', name: 'Tigist Services', category: 'sub_agent', location: 'Jimma', cashIn: 340000, cashOut: 290000, commission: 12600, float: 180000, maxFloat: 500000, customers: 45, txnCount: 280, status: 'active' },
    { id: 'AGT-007', name: 'Yonas Agency', category: 'agent', location: 'Adama', cashIn: 980000, cashOut: 2950000, commission: 78600, float: 380000, maxFloat: 2000000, customers: 112, txnCount: 760, status: 'active', suspicious: true },
    { id: 'AGT-008', name: 'Henok Digital', category: 'sub_agent', location: 'Dire Dawa', cashIn: 420000, cashOut: 350000, commission: 15400, float: 210000, maxFloat: 500000, customers: 52, txnCount: 340, status: 'dormant' },
  ];
  return agents.map(a => ({
    ...a,
    floatUtil: ((a.float / a.maxFloat) * 100).toFixed(1),
    cashOutRatio: (a.cashOut / (a.cashIn || 1)).toFixed(2),
    suspicious: a.suspicious || (a.cashOut / (a.cashIn || 1)) > 3,
  }));
};

export const computeDFSReport = () => {
  const txnTypes = [
    { type: 'P2P Transfers (Nisir)', count: 4250, value: 18500000, fees: 185000, users: 1820, successRate: 97.2 },
    { type: 'Bank Transfers (RTGS)', count: 320, value: 12800000, fees: 8000, users: 280, successRate: 95.1 },
    { type: 'Bank Transfers (ACH)', count: 890, value: 5200000, fees: 8900, users: 620, successRate: 98.5 },
    { type: 'Mobile Wallet (Telebirr)', count: 1560, value: 4800000, fees: 48000, users: 1100, successRate: 96.8 },
    { type: 'Bill Payments', count: 2100, value: 8500000, fees: 42000, users: 1450, successRate: 99.1 },
    { type: 'Airtime Purchases', count: 3800, value: 950000, fees: 0, users: 2200, successRate: 99.5 },
    { type: 'Agent Cash-In', count: 5200, value: 28000000, fees: 260000, users: 3100, successRate: 98.2 },
    { type: 'Agent Cash-Out', count: 4100, value: 22000000, fees: 220000, users: 2800, successRate: 97.8 },
    { type: 'Loan Disbursements', count: 180, value: 9200000, fees: 184000, users: 180, successRate: 100 },
    { type: 'Loan Repayments', count: 650, value: 4800000, fees: 0, users: 520, successRate: 99.2 },
  ];
  const total = {
    type: 'Total',
    count: txnTypes.reduce((s, t) => s + t.count, 0),
    value: txnTypes.reduce((s, t) => s + t.value, 0),
    fees: txnTypes.reduce((s, t) => s + t.fees, 0),
    users: new Set(txnTypes.flatMap(() => Array.from({ length: 100 }, (_, i) => i))).size,
    successRate: 98.1,
  };
  return { txnTypes, total, nfisMetrics: {
    newAccountsWomen: 82, newAccountsMen: 68, newRural: 45, newUrban: 105,
    firstTimeDigital: 38, avgTxnTier1: 850, avgTxnTier2: 4200, avgTxnTier3: 18500,
  }};
};

export const computeSavingsMobilisation = () => [
  { type: 'Regular Savings', count: mockCustomers.filter(c => c.accountType === 'savings').length, totalDeposits: mockCustomers.filter(c => c.accountType === 'savings').reduce((s, c) => s + c.balance, 0), avgBalance: 0, interestRate: 7.5, quarterlyInterest: 0 },
  { type: 'Current Accounts', count: mockCustomers.filter(c => c.accountType === 'current').length, totalDeposits: mockCustomers.filter(c => c.accountType === 'current').reduce((s, c) => s + c.balance, 0), avgBalance: 0, interestRate: 0, quarterlyInterest: 0 },
  { type: 'Digital Wallets', count: mockCustomers.filter(c => c.accountType === 'wallet').length, totalDeposits: mockCustomers.filter(c => c.accountType === 'wallet').reduce((s, c) => s + c.balance, 0), avgBalance: 0, interestRate: 0, quarterlyInterest: 0 },
].map(r => ({ ...r, avgBalance: Math.round(r.totalDeposits / (r.count || 1)), quarterlyInterest: Math.round(r.totalDeposits * r.interestRate / 100 / 4) }));

export const computeLargeExposures = () => {
  const capital = 79500000;
  const borrowers = mockCustomers.filter(c => c.loanOutstanding > 0);
  // Aggregate by name (simulate multiple loans)
  const grouped: Record<string, { name: string; total: number; tier: string }> = {};
  borrowers.forEach(c => {
    if (!grouped[c.name]) grouped[c.name] = { name: c.name, total: 0, tier: c.kycTier };
    grouped[c.name].total += c.loanOutstanding;
  });
  return Object.values(grouped)
    .map(g => ({
      ...g,
      exposurePct: ((g.total / capital) * 100).toFixed(2),
      flag: g.total / capital > 0.10,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);
};

// Report registry
export interface ReportDefinition {
  code: string;
  name: string;
  frequency: string;
  deadline: string;
  directive: string;
  format: string;
  type: 'regulatory' | 'business';
  status: 'draft' | 'review' | 'approved' | 'submitted' | 'overdue';
  lastGenerated: string;
  deadlineDate: string;
  validationErrors: number;
  validationWarnings: number;
}

export const reportRegistry: ReportDefinition[] = [
  { code: 'REG-01', name: 'Balance Sheet', frequency: 'Quarterly', deadline: '21 days', directive: 'MFI/07/96', format: 'Excel + PDF', type: 'regulatory', status: 'approved', lastGenerated: '2026-03-28', deadlineDate: '2026-04-21', validationErrors: 0, validationWarnings: 1 },
  { code: 'REG-02', name: 'Income Statement', frequency: 'Quarterly', deadline: '21 days', directive: 'MFI/07/96', format: 'Excel + PDF', type: 'regulatory', status: 'review', lastGenerated: '2026-03-28', deadlineDate: '2026-04-21', validationErrors: 0, validationWarnings: 2 },
  { code: 'REG-03', name: 'Loan Portfolio & Asset Quality', frequency: 'Quarterly', deadline: '21 days', directive: 'SBB/90/2024', format: 'Excel', type: 'regulatory', status: 'review', lastGenerated: '2026-03-28', deadlineDate: '2026-04-21', validationErrors: 0, validationWarnings: 3 },
  { code: 'REG-04', name: 'Capital Adequacy Return (CAR)', frequency: 'Quarterly', deadline: '21 days', directive: 'MFI/16/2002', format: 'Excel', type: 'regulatory', status: 'draft', lastGenerated: '2026-03-29', deadlineDate: '2026-04-21', validationErrors: 1, validationWarnings: 0 },
  { code: 'REG-05', name: 'Liquidity Return', frequency: 'Quarterly', deadline: '21 days', directive: 'MFI/07/96', format: 'Excel', type: 'regulatory', status: 'submitted', lastGenerated: '2026-03-15', deadlineDate: '2026-04-21', validationErrors: 0, validationWarnings: 0 },
  { code: 'REG-06', name: 'Agent Network Activity', frequency: 'Quarterly', deadline: '30 days', directive: 'FIS/02/2020', format: 'Excel', type: 'regulatory', status: 'review', lastGenerated: '2026-03-30', deadlineDate: '2026-04-30', validationErrors: 0, validationWarnings: 1 },
  { code: 'REG-07', name: 'KYC Tier & Account Statistics', frequency: 'Quarterly', deadline: '30 days', directive: 'FIS/04/2021', format: 'Excel', type: 'regulatory', status: 'draft', lastGenerated: '2026-03-30', deadlineDate: '2026-04-30', validationErrors: 0, validationWarnings: 2 },
  { code: 'REG-08', name: 'DFS Transaction Report', frequency: 'Monthly', deadline: '15 days', directive: 'NBE MFISD', format: 'Excel', type: 'regulatory', status: 'submitted', lastGenerated: '2026-03-12', deadlineDate: '2026-04-15', validationErrors: 0, validationWarnings: 0 },
  { code: 'REG-09', name: 'Savings Mobilisation Schedule', frequency: 'Quarterly', deadline: '21 days', directive: 'MFI/07/96', format: 'Excel', type: 'regulatory', status: 'review', lastGenerated: '2026-03-28', deadlineDate: '2026-04-21', validationErrors: 0, validationWarnings: 1 },
  { code: 'REG-14', name: 'Large Exposure Report', frequency: 'Quarterly', deadline: '21 days', directive: 'NBE MFISD', format: 'Excel', type: 'regulatory', status: 'draft', lastGenerated: '2026-03-30', deadlineDate: '2026-04-21', validationErrors: 0, validationWarnings: 4 },
  { code: 'REG-15', name: 'Financial Inclusion Outreach', frequency: 'Semi-annual', deadline: '30 days', directive: 'NFIS-II', format: 'Excel', type: 'regulatory', status: 'draft', lastGenerated: '2026-03-25', deadlineDate: '2026-04-30', validationErrors: 0, validationWarnings: 1 },
  { code: 'BIZ-01', name: 'Portfolio Health Dashboard', frequency: 'Daily', deadline: 'By 06:00 EAT', directive: 'Internal', format: 'Dashboard', type: 'business', status: 'approved', lastGenerated: '2026-04-04', deadlineDate: '', validationErrors: 0, validationWarnings: 0 },
  { code: 'BIZ-02', name: 'Savings & Deposits Dashboard', frequency: 'Daily', deadline: 'By 06:00 EAT', directive: 'Internal', format: 'Dashboard', type: 'business', status: 'approved', lastGenerated: '2026-04-04', deadlineDate: '', validationErrors: 0, validationWarnings: 0 },
  { code: 'BIZ-03', name: 'Agent Performance Report', frequency: 'Weekly', deadline: 'Monday', directive: 'Internal', format: 'Excel', type: 'business', status: 'approved', lastGenerated: '2026-03-31', deadlineDate: '', validationErrors: 0, validationWarnings: 0 },
  { code: 'BIZ-04', name: 'Revenue & Fee Income Report', frequency: 'Monthly', deadline: '5th of month', directive: 'Internal', format: 'Excel', type: 'business', status: 'review', lastGenerated: '2026-03-05', deadlineDate: '', validationErrors: 0, validationWarnings: 0 },
  { code: 'BIZ-05', name: 'Operational Efficiency Metrics', frequency: 'Monthly', deadline: '5th of month', directive: 'Internal', format: 'Dashboard', type: 'business', status: 'approved', lastGenerated: '2026-03-05', deadlineDate: '', validationErrors: 0, validationWarnings: 0 },
];

export const computeRegionBreakdown = () => {
  const result: Record<string, { total: number; urban: number; rural: number; women: number; men: number }> = {};
  mockCustomers.forEach(c => {
    if (!result[c.region]) result[c.region] = { total: 0, urban: 0, rural: 0, women: 0, men: 0 };
    result[c.region].total++;
    if (c.isUrban) result[c.region].urban++; else result[c.region].rural++;
    if (c.gender === 'F') result[c.region].women++; else result[c.region].men++;
  });
  return Object.entries(result).map(([region, data]) => ({ region, ...data })).sort((a, b) => b.total - a.total);
};
