/**
 * Synthetic Customer Data Platform (CDP)
 * ─────────────────────────────────────────────────────────────
 * Stand-in for the real banking CDP that the BankGPT AI Mesh
 * agents will read from at runtime. Every chat request to the
 * mesh-chat edge function ships a snapshot of this profile so
 * each agent can answer with concrete numbers ("you spent ETB
 * 4,210 on groceries last month") instead of generic banking
 * platitudes.
 *
 * In production the Spring Boot CDP service replaces this file.
 * The shape (`CustomerProfile`) stays identical.
 */

export type Txn = {
  id: string;
  date: string;          // ISO yyyy-mm-dd
  merchant: string;
  category: "groceries" | "transport" | "salary" | "transfer" | "bills" | "dining" | "remittance" | "fees" | "savings";
  amount: number;        // ETB, negative = debit
};

export type Loan = {
  id: string;
  product: string;
  principal: number;
  outstanding: number;
  monthlyInstallment: number;
  rate: number;          // %
  nextDueDate: string;
  status: "active" | "closed" | "overdue";
};

export type Card = {
  id: string;
  brand: "Visa" | "Mastercard" | "UnionPay";
  type: "debit" | "credit";
  last4: string;
  limit?: number;
  outstanding?: number;
  status: "active" | "blocked";
};

export type Investment = {
  id: string;
  instrument: "T-Bill 91d" | "T-Bill 182d" | "T-Bill 364d" | "Fixed Deposit" | "Mutual Fund";
  principal: number;
  currentValue: number;
  rate: number;
  maturityDate: string;
};

export type SavingsGoal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  dueDate: string;
};

export type CustomerProfile = {
  customerId: string;
  firstName: string;
  fullName: string;
  age: number;
  city: string;
  language: "en" | "am";
  persona: "Urban Hustler" | "Market Trader" | "Salaried Professional" | "Diaspora Sender";
  // Balances
  walletBalanceETB: number;
  savingsBalanceETB: number;
  monthlyInflowETB: number;
  monthlyOutflowETB: number;
  // Scores
  creditScore: number;          // 300-850
  engagementScore: number;      // 0-100
  riskTier: "low" | "medium" | "high";
  kycTier: 1 | 2 | 3;
  // Holdings
  loans: Loan[];
  cards: Card[];
  investments: Investment[];
  savingsGoals: SavingsGoal[];
  recentTransactions: Txn[];
  // Behaviour signals (drive proactive nudges)
  signals: {
    lastSalaryCreditedAt?: string;
    lowBalanceFlag: boolean;
    missedInstallmentLast90d: number;
    daysSinceLogin: number;
    overspendCategory?: string;
    eligibleForLoanETB?: number;
    eligibleForTBillETB?: number;
  };
};

const PROFILES: Record<string, CustomerProfile> = {
  selam: {
    customerId: "GP-100245",
    firstName: "Selam",
    fullName: "Selam Tadesse",
    age: 26,
    city: "Addis Ababa",
    language: "en",
    persona: "Urban Hustler",
    walletBalanceETB: 4_280,
    savingsBalanceETB: 12_500,
    monthlyInflowETB: 18_500,
    monthlyOutflowETB: 15_900,
    creditScore: 712,
    engagementScore: 84,
    riskTier: "low",
    kycTier: 2,
    loans: [
      {
        id: "LN-44210",
        product: "Mercato Cash micro-loan",
        principal: 5_000,
        outstanding: 1_800,
        monthlyInstallment: 600,
        rate: 5,
        nextDueDate: "2026-06-05",
        status: "active",
      },
    ],
    cards: [
      { id: "CD-1", brand: "Visa", type: "debit", last4: "4421", status: "active" },
      { id: "CD-2", brand: "Mastercard", type: "credit", last4: "9087", limit: 15_000, outstanding: 3_240, status: "active" },
    ],
    investments: [
      { id: "IV-1", instrument: "T-Bill 91d", principal: 5_000, currentValue: 5_062, rate: 7.4, maturityDate: "2026-08-12" },
    ],
    savingsGoals: [
      { id: "SG-1", name: "Iftar trip to Lalibela", target: 20_000, saved: 8_400, dueDate: "2026-09-30" },
      { id: "SG-2", name: "Emergency fund (3 mo)",   target: 45_000, saved: 12_500, dueDate: "2026-12-31" },
    ],
    recentTransactions: [
      { id: "T1", date: "2026-05-23", merchant: "Salary — GlobalPay Bank",  category: "salary",    amount:  18_500 },
      { id: "T2", date: "2026-05-23", merchant: "Mercato Wholesale",        category: "groceries", amount:  -1_240 },
      { id: "T3", date: "2026-05-22", merchant: "Ride — Feres",             category: "transport", amount:    -185 },
      { id: "T4", date: "2026-05-21", merchant: "EthioTelecom airtime",     category: "bills",     amount:    -300 },
      { id: "T5", date: "2026-05-20", merchant: "Send to Mother (Bahir Dar)",category: "remittance",amount:  -2_000 },
      { id: "T6", date: "2026-05-19", merchant: "Tomoca Coffee",            category: "dining",    amount:    -240 },
      { id: "T7", date: "2026-05-18", merchant: "Goal sweep — Lalibela",    category: "savings",   amount:  -1_000 },
    ],
    signals: {
      lastSalaryCreditedAt: "2026-05-23",
      lowBalanceFlag: false,
      missedInstallmentLast90d: 0,
      daysSinceLogin: 0,
      overspendCategory: "dining",
      eligibleForLoanETB: 8_000,
      eligibleForTBillETB: 10_000,
    },
  },
  bekele: {
    customerId: "GP-100311",
    firstName: "Bekele",
    fullName: "Bekele Wolde",
    age: 41,
    city: "Addis Ababa",
    language: "am",
    persona: "Market Trader",
    walletBalanceETB: 38_900,
    savingsBalanceETB: 6_000,
    monthlyInflowETB: 95_000,
    monthlyOutflowETB: 88_000,
    creditScore: 668,
    engagementScore: 61,
    riskTier: "medium",
    kycTier: 3,
    loans: [
      {
        id: "LN-50991",
        product: "Working-capital loan",
        principal: 150_000,
        outstanding: 92_400,
        monthlyInstallment: 14_300,
        rate: 11,
        nextDueDate: "2026-06-10",
        status: "active",
      },
    ],
    cards: [
      { id: "CD-3", brand: "Visa", type: "debit", last4: "7711", status: "active" },
    ],
    investments: [],
    savingsGoals: [
      { id: "SG-3", name: "Shop renovation", target: 60_000, saved: 6_000, dueDate: "2027-01-31" },
    ],
    recentTransactions: [
      { id: "T1", date: "2026-05-23", merchant: "Supplier — Akaki Foods",   category: "transfer",  amount: -22_000 },
      { id: "T2", date: "2026-05-22", merchant: "Daily sales deposit",       category: "salary",    amount:  31_500 },
      { id: "T3", date: "2026-05-21", merchant: "Rent — Mercato stall",      category: "bills",     amount:  -8_500 },
      { id: "T4", date: "2026-05-20", merchant: "Loan installment",          category: "fees",      amount: -14_300 },
    ],
    signals: {
      lowBalanceFlag: false,
      missedInstallmentLast90d: 0,
      daysSinceLogin: 1,
      overspendCategory: "transfer",
      eligibleForLoanETB: 50_000,
    },
  },
  tigist: {
    customerId: "GP-100478",
    firstName: "Tigist",
    fullName: "Tigist Alemu",
    age: 33,
    city: "Hawassa",
    language: "am",
    persona: "Salaried Professional",
    walletBalanceETB: 1_120,
    savingsBalanceETB: 84_000,
    monthlyInflowETB: 32_000,
    monthlyOutflowETB: 21_500,
    creditScore: 758,
    engagementScore: 91,
    riskTier: "low",
    kycTier: 3,
    loans: [],
    cards: [
      { id: "CD-4", brand: "Visa", type: "credit", last4: "2266", limit: 50_000, outstanding: 7_400, status: "active" },
    ],
    investments: [
      { id: "IV-2", instrument: "T-Bill 182d",  principal: 40_000, currentValue: 41_580, rate: 8.1, maturityDate: "2026-11-04" },
      { id: "IV-3", instrument: "Fixed Deposit", principal: 30_000, currentValue: 31_120, rate: 7.5, maturityDate: "2027-02-14" },
    ],
    savingsGoals: [
      { id: "SG-4", name: "Daughter's education",    target: 250_000, saved: 84_000, dueDate: "2030-09-01" },
    ],
    recentTransactions: [
      { id: "T1", date: "2026-05-25", merchant: "Salary credit",       category: "salary",  amount:  32_000 },
      { id: "T2", date: "2026-05-24", merchant: "Auto-sweep to T-Bill",category: "savings", amount:  -5_000 },
      { id: "T3", date: "2026-05-23", merchant: "Shoa Supermarket",    category: "groceries",amount:  -2_140 },
    ],
    signals: {
      lastSalaryCreditedAt: "2026-05-25",
      lowBalanceFlag: true,                 // wallet < cushion
      missedInstallmentLast90d: 0,
      daysSinceLogin: 0,
      eligibleForTBillETB: 25_000,
    },
  },
};

export const SYNTHETIC_CUSTOMERS = Object.values(PROFILES);

export function getCustomer(idOrFirstName: string): CustomerProfile {
  const key = idOrFirstName.toLowerCase();
  return PROFILES[key] ?? PROFILES.selam;
}

/** Compact JSON the edge function can stuff into the system prompt. */
export function customerSnapshot(p: CustomerProfile) {
  return {
    customer: { id: p.customerId, name: p.firstName, persona: p.persona, city: p.city, language: p.language },
    balances: {
      wallet: p.walletBalanceETB,
      savings: p.savingsBalanceETB,
      monthlyInflow: p.monthlyInflowETB,
      monthlyOutflow: p.monthlyOutflowETB,
    },
    scores: { credit: p.creditScore, engagement: p.engagementScore, risk: p.riskTier, kycTier: p.kycTier },
    loans: p.loans,
    cards: p.cards.map((c) => ({ ...c })),
    investments: p.investments,
    savingsGoals: p.savingsGoals,
    last7Transactions: p.recentTransactions.slice(0, 7),
    signals: p.signals,
  };
}

/** Suggest proactive nudges per agent based on signals. */
export function nudgesForAgent(
  agentId: string,
  p: CustomerProfile,
  lang: "en" | "am",
): string[] {
  const am = lang === "am";
  const out: string[] = [];
  switch (agentId) {
    case "savingsCoach": {
      if (p.signals.lastSalaryCreditedAt) {
        out.push(am
          ? `ደሞዝህ ገብቷል — ${Math.round(p.monthlyInflowETB * 0.1).toLocaleString()} ብር ወደ ቁጠባ ላስተላልፍ?`
          : `Your salary just landed. Want me to sweep ETB ${Math.round(p.monthlyInflowETB * 0.1).toLocaleString()} into savings?`);
      }
      const top = p.savingsGoals[0];
      if (top) {
        const pct = Math.round((top.saved / top.target) * 100);
        out.push(am
          ? `“${top.name}” ላይ ${pct}% ደርሰሃል። ጨርሰህ ለመድረስ በሳምንት ${Math.round((top.target - top.saved) / 12).toLocaleString()} ብር ብቻ ያስፈልጋል።`
          : `You're ${pct}% to "${top.name}". Just ETB ${Math.round((top.target - top.saved) / 12).toLocaleString()}/week gets you there.`);
      }
      break;
    }
    case "investmentCoach": {
      if (p.signals.eligibleForTBillETB) {
        out.push(am
          ? `እስከ ${p.signals.eligibleForTBillETB.toLocaleString()} ብር T-Bill (8.1%) ለመግዛት ብቁ ነህ።`
          : `You qualify for up to ETB ${p.signals.eligibleForTBillETB.toLocaleString()} in T-Bills at 8.1% — safer than your wallet sitting idle.`);
      }
      break;
    }
    case "loanAgent": {
      if (p.signals.eligibleForLoanETB) {
        out.push(am
          ? `እስከ ${p.signals.eligibleForLoanETB.toLocaleString()} ብር በ5% ወለድ በቅጽበት መበደር ትችላለህ።`
          : `Pre-approved: up to ETB ${p.signals.eligibleForLoanETB.toLocaleString()} at 5% — instant disbursement, no paperwork.`);
      }
      const ln = p.loans.find((l) => l.status === "active");
      if (ln) {
        out.push(am
          ? `የ${ln.monthlyInstallment.toLocaleString()} ብር ክፍያ በ${ln.nextDueDate} ይከፈላል።`
          : `Heads up — ETB ${ln.monthlyInstallment.toLocaleString()} loan installment due on ${ln.nextDueDate}.`);
      }
      break;
    }
    case "onboarding": {
      if (p.kycTier < 3) {
        out.push(am
          ? `KYC ደረጃህን ወደ Tier ${p.kycTier + 1} አሳድግ — የበለጠ ገደብ ያለ ይከፍታል።`
          : `Upgrade to KYC Tier ${p.kycTier + 1} to unlock higher limits — takes 2 minutes with your Fayda ID.`);
      }
      break;
    }
    case "complaintAgent": {
      if (p.signals.missedInstallmentLast90d > 0) {
        out.push(am
          ? `ቅሬታ ካለህ እርዳለሁ።`
          : `If something doesn't look right on your account, I can investigate and resolve it within hours.`);
      }
      break;
    }
    case "concierge": {
      if (p.signals.lowBalanceFlag) {
        out.push(am
          ? `Wallet ቀሪሕ ${p.walletBalanceETB.toLocaleString()} ብር ብቻ ነው።`
          : `Your wallet is running low (ETB ${p.walletBalanceETB.toLocaleString()}). Want to transfer from savings?`);
      }
      break;
    }
  }
  return out;
}

/** Tiny Amharic-script detector for auto language picking. */
export function detectLang(text: string): "en" | "am" {
  return /[\u1200-\u137F]/.test(text) ? "am" : "en";
}
