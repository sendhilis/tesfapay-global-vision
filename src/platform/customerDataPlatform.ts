/**
 * Synthetic Customer Data Platform (CDP)
 * ─────────────────────────────────────────────────────────────
 * Stand-in for the real banking CDP that the BankGPT AI Mesh
 * agents read from at runtime. Every chat request ships a
 * snapshot of this profile so each agent can answer with
 * concrete numbers AND structured analytics that the UI renders
 * as pies, bars and line charts.
 *
 * In production the Spring Boot CDP service replaces this file.
 * The shape (`CustomerProfile`) stays identical.
 */

export type Txn = {
  id: string;
  date: string;          // ISO yyyy-mm-dd
  merchant: string;
  category: "groceries" | "transport" | "salary" | "transfer" | "bills" | "dining" | "remittance" | "fees" | "savings" | "entertainment" | "health" | "education" | "shopping";
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

export type MonthlyPoint = {
  month: string;     // "Jan", "Feb"...
  inflow: number;
  outflow: number;
  savings: number;
};

export type CreditFactor = {
  factor: string;          // e.g. "Payment history"
  weight: number;          // 0..100 (contribution to score)
  status: "excellent" | "good" | "fair" | "poor";
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
  // Analytics
  monthlyTrend: MonthlyPoint[];               // last 6 months
  spendByCategory: { category: string; amount: number }[];
  creditFactors: CreditFactor[];
  netWorthETB: number;
  debtToIncome: number;        // 0..1
  savingsRate: number;         // 0..1
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

const SELAM_SPEND = [
  { category: "Groceries", amount: 4_210 },
  { category: "Transport", amount: 1_650 },
  { category: "Bills", amount: 2_400 },
  { category: "Dining", amount: 1_880 },
  { category: "Remittance", amount: 2_000 },
  { category: "Shopping", amount: 1_460 },
  { category: "Entertainment", amount: 980 },
  { category: "Health", amount: 620 },
];

const BEKELE_SPEND = [
  { category: "Supplier payouts", amount: 52_000 },
  { category: "Rent", amount: 8_500 },
  { category: "Loan installment", amount: 14_300 },
  { category: "Transport / logistics", amount: 6_200 },
  { category: "Utilities", amount: 2_400 },
  { category: "Staff wages", amount: 9_000 },
];

const TIGIST_SPEND = [
  { category: "Groceries", amount: 5_800 },
  { category: "Education (daughter)", amount: 4_500 },
  { category: "Bills", amount: 3_200 },
  { category: "Dining", amount: 1_400 },
  { category: "Investments sweep", amount: 5_000 },
  { category: "Health", amount: 1_100 },
];

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
      { id: "LN-44210", product: "Mercato Cash micro-loan", principal: 5_000, outstanding: 1_800, monthlyInstallment: 600, rate: 5, nextDueDate: "2026-06-05", status: "active" },
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
      { id: "T1", date: "2026-05-23", merchant: "Salary — ABX Bank",  category: "salary",    amount:  18_500 },
      { id: "T2", date: "2026-05-23", merchant: "Mercato Wholesale",        category: "groceries", amount:  -1_240 },
      { id: "T3", date: "2026-05-22", merchant: "Ride — Feres",             category: "transport", amount:    -185 },
      { id: "T4", date: "2026-05-21", merchant: "EthioTelecom airtime",     category: "bills",     amount:    -300 },
      { id: "T5", date: "2026-05-20", merchant: "Send to Mother (Bahir Dar)",category: "remittance",amount:  -2_000 },
      { id: "T6", date: "2026-05-19", merchant: "Tomoca Coffee",            category: "dining",    amount:    -240 },
      { id: "T7", date: "2026-05-18", merchant: "Goal sweep — Lalibela",    category: "savings",   amount:  -1_000 },
    ],
    monthlyTrend: [
      { month: "Dec", inflow: 17_800, outflow: 16_200, savings: 1_000 },
      { month: "Jan", inflow: 18_200, outflow: 15_400, savings: 1_200 },
      { month: "Feb", inflow: 18_500, outflow: 16_100, savings: 1_400 },
      { month: "Mar", inflow: 19_000, outflow: 15_800, savings: 1_600 },
      { month: "Apr", inflow: 18_500, outflow: 15_900, savings: 1_800 },
      { month: "May", inflow: 18_500, outflow: 15_900, savings: 2_000 },
    ],
    spendByCategory: SELAM_SPEND,
    creditFactors: [
      { factor: "Payment history",   weight: 35, status: "excellent" },
      { factor: "Credit utilisation", weight: 22, status: "good" },
      { factor: "Account age",        weight: 15, status: "fair" },
      { factor: "Credit mix",         weight: 15, status: "good" },
      { factor: "Recent enquiries",   weight: 13, status: "excellent" },
    ],
    netWorthETB: 22_580,
    debtToIncome: 0.097,
    savingsRate: 0.14,
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
      { id: "LN-50991", product: "Working-capital loan", principal: 150_000, outstanding: 92_400, monthlyInstallment: 14_300, rate: 11, nextDueDate: "2026-06-10", status: "active" },
    ],
    cards: [{ id: "CD-3", brand: "Visa", type: "debit", last4: "7711", status: "active" }],
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
    monthlyTrend: [
      { month: "Dec", inflow: 88_000, outflow: 84_000, savings: 1_000 },
      { month: "Jan", inflow: 92_000, outflow: 90_000, savings: 1_500 },
      { month: "Feb", inflow: 85_000, outflow: 82_000, savings: 800 },
      { month: "Mar", inflow: 98_000, outflow: 89_000, savings: 1_800 },
      { month: "Apr", inflow: 96_000, outflow: 91_000, savings: 1_000 },
      { month: "May", inflow: 95_000, outflow: 88_000, savings: 900 },
    ],
    spendByCategory: BEKELE_SPEND,
    creditFactors: [
      { factor: "Payment history",   weight: 35, status: "good" },
      { factor: "Credit utilisation", weight: 22, status: "fair" },
      { factor: "Account age",        weight: 15, status: "good" },
      { factor: "Credit mix",         weight: 15, status: "fair" },
      { factor: "Recent enquiries",   weight: 13, status: "good" },
    ],
    netWorthETB: -47_500,
    debtToIncome: 0.18,
    savingsRate: 0.012,
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
    cards: [{ id: "CD-4", brand: "Visa", type: "credit", last4: "2266", limit: 50_000, outstanding: 7_400, status: "active" }],
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
    monthlyTrend: [
      { month: "Dec", inflow: 31_500, outflow: 20_800, savings: 7_000 },
      { month: "Jan", inflow: 32_000, outflow: 21_200, savings: 7_500 },
      { month: "Feb", inflow: 32_000, outflow: 22_000, savings: 7_200 },
      { month: "Mar", inflow: 32_500, outflow: 21_400, savings: 8_000 },
      { month: "Apr", inflow: 32_000, outflow: 21_500, savings: 8_500 },
      { month: "May", inflow: 32_000, outflow: 21_500, savings: 9_000 },
    ],
    spendByCategory: TIGIST_SPEND,
    creditFactors: [
      { factor: "Payment history",   weight: 35, status: "excellent" },
      { factor: "Credit utilisation", weight: 22, status: "excellent" },
      { factor: "Account age",        weight: 15, status: "good" },
      { factor: "Credit mix",         weight: 15, status: "excellent" },
      { factor: "Recent enquiries",   weight: 13, status: "excellent" },
    ],
    netWorthETB: 158_700,
    debtToIncome: 0.04,
    savingsRate: 0.33,
    signals: {
      lastSalaryCreditedAt: "2026-05-25",
      lowBalanceFlag: true,
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

/** Compact JSON the edge function stuffs into the system prompt. */
export function customerSnapshot(p: CustomerProfile) {
  return {
    customer: { id: p.customerId, name: p.firstName, persona: p.persona, city: p.city, language: p.language, age: p.age },
    balances: {
      wallet: p.walletBalanceETB,
      savings: p.savingsBalanceETB,
      monthlyInflow: p.monthlyInflowETB,
      monthlyOutflow: p.monthlyOutflowETB,
      netWorth: p.netWorthETB,
      savingsRate: p.savingsRate,
      debtToIncome: p.debtToIncome,
    },
    scores: { credit: p.creditScore, engagement: p.engagementScore, risk: p.riskTier, kycTier: p.kycTier },
    creditFactors: p.creditFactors,
    loans: p.loans,
    cards: p.cards,
    investments: p.investments,
    savingsGoals: p.savingsGoals,
    spendByCategory: p.spendByCategory,
    monthlyTrend: p.monthlyTrend,
    last7Transactions: p.recentTransactions.slice(0, 7),
    signals: p.signals,
  };
}

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
          ? `“${top.name}” ላይ ${pct}% ደርሰሃል።`
          : `You're ${pct}% to "${top.name}". Just ETB ${Math.round((top.target - top.saved) / 12).toLocaleString()}/week gets you there.`);
      }
      break;
    }
    case "investmentCoach": {
      if (p.signals.eligibleForTBillETB) {
        out.push(am
          ? `እስከ ${p.signals.eligibleForTBillETB.toLocaleString()} ብር T-Bill (8.1%) ለመግዛት ብቁ ነህ።`
          : `You qualify for up to ETB ${p.signals.eligibleForTBillETB.toLocaleString()} in T-Bills at 8.1% — safer than idle wallet.`);
      }
      break;
    }
    case "loanAgent": {
      if (p.signals.eligibleForLoanETB) {
        out.push(am
          ? `እስከ ${p.signals.eligibleForLoanETB.toLocaleString()} ብር በ5% ወለድ መበደር ትችላለህ።`
          : `Pre-approved: up to ETB ${p.signals.eligibleForLoanETB.toLocaleString()} at 5% — instant.`);
      }
      break;
    }
    case "onboarding": {
      if (p.kycTier < 3) {
        out.push(am
          ? `KYC ደረጃህን ወደ Tier ${p.kycTier + 1} አሳድግ።`
          : `Upgrade to KYC Tier ${p.kycTier + 1} to unlock higher limits — 2 minutes with your Fayda ID.`);
      }
      break;
    }
    case "concierge": {
      if (p.signals.lowBalanceFlag) {
        out.push(am
          ? `Wallet ${p.walletBalanceETB.toLocaleString()} ብር ብቻ ነው።`
          : `Your wallet is running low (ETB ${p.walletBalanceETB.toLocaleString()}). Want to transfer from savings?`);
      }
      break;
    }
  }
  return out;
}

export function detectLang(text: string): "en" | "am" {
  return /[\u1200-\u137F]/.test(text) ? "am" : "en";
}

/* ─────────────────────────────────────────────────────────────
 * Action application — keeps wallet, savings, investments and
 * transaction history in sync when an agent executes something
 * for the customer (savings deposit, T-Bill purchase, etc.).
 * ────────────────────────────────────────────────────────────── */

export type AgentAction =
  | { type: "savings_deposit";  goalId?: string; goalName?: string; amount: number }
  | { type: "savings_withdraw"; goalId?: string; goalName?: string; amount: number }
  | { type: "tbill_purchase";   amount: number; tenor?: "91d" | "182d" | "364d" }
  | { type: "loan_repay";       loanId?: string; amount: number }
  | { type: "transfer";         to: string; amount: number }
  | { type: "transfer_bank_to_bank"; amount: number; toBank?: string; toAccount?: string; fromAccount?: string; memo?: string }
  | { type: "transfer_bank_to_mno";  amount: number; toWallet?: string; toMsisdn?: string; fromAccount?: string; memo?: string }
  | { type: "transfer_p2p";          amount: number; toContact?: string; fromAccount?: string; memo?: string };

export function applyAction(p: CustomerProfile, a: AgentAction): { profile: CustomerProfile; receipt: string } {
  const next: CustomerProfile = JSON.parse(JSON.stringify(p));
  const today = new Date().toISOString().slice(0, 10);
  const newTxn = (merchant: string, category: Txn["category"], amount: number): Txn => ({
    id: `T${Date.now()}`, date: today, merchant, category, amount,
  });

  // Decide which bucket of money funds a transfer based on the free-form
  // `fromAccount` label the agent supplies (e.g. "Wallet", "Primary Savings").
  // Returns the source key + a human label so receipts stay accurate.
  const resolveSource = (label?: string): { key: "wallet" | "savings"; label: string } => {
    const l = (label ?? "").toLowerCase();
    if (l.includes("saving") || l.includes("goal") || l.includes("deposit")) {
      return { key: "savings", label: label || "Savings" };
    }
    return { key: "wallet", label: label || "Wallet" };
  };
  const balanceOf = (key: "wallet" | "savings") =>
    key === "wallet" ? next.walletBalanceETB : next.savingsBalanceETB;
  const debit = (key: "wallet" | "savings", amt: number) => {
    if (key === "wallet") next.walletBalanceETB = Math.max(0, next.walletBalanceETB - amt);
    else next.savingsBalanceETB = Math.max(0, next.savingsBalanceETB - amt);
  };


  switch (a.type) {
    case "savings_deposit": {
      const amt = Math.max(0, Math.round(a.amount));
      if (amt <= 0 || next.walletBalanceETB < amt) {
        return { profile: p, receipt: `Insufficient wallet balance for ETB ${amt.toLocaleString()} deposit.` };
      }
      const goal = next.savingsGoals.find((g) => g.id === a.goalId)
        ?? next.savingsGoals.find((g) => a.goalName && g.name.toLowerCase().includes(a.goalName.toLowerCase()))
        ?? next.savingsGoals[0];
      next.walletBalanceETB -= amt;
      next.savingsBalanceETB += amt;
      if (goal) goal.saved += amt;
      next.recentTransactions = [newTxn(`Savings → ${goal?.name ?? "savings"}`, "savings", -amt), ...next.recentTransactions].slice(0, 12);
      return { profile: next, receipt: `Moved ETB ${amt.toLocaleString()} from wallet to ${goal?.name ?? "savings"}.` };
    }
    case "savings_withdraw": {
      const amt = Math.max(0, Math.round(a.amount));
      const goal = next.savingsGoals.find((g) => g.id === a.goalId) ?? next.savingsGoals[0];
      if (amt <= 0 || !goal || goal.saved < amt) {
        return { profile: p, receipt: `Not enough saved in goal for ETB ${amt.toLocaleString()} withdrawal.` };
      }
      goal.saved -= amt;
      next.savingsBalanceETB = Math.max(0, next.savingsBalanceETB - amt);
      next.walletBalanceETB += amt;
      next.recentTransactions = [newTxn(`Withdraw ← ${goal.name}`, "savings", amt), ...next.recentTransactions].slice(0, 12);
      return { profile: next, receipt: `Returned ETB ${amt.toLocaleString()} from ${goal.name} to wallet.` };
    }
    case "tbill_purchase": {
      const amt = Math.max(0, Math.round(a.amount));
      if (amt <= 0 || next.walletBalanceETB < amt) {
        return { profile: p, receipt: `Need ETB ${amt.toLocaleString()} in wallet for T-Bill purchase.` };
      }
      next.walletBalanceETB -= amt;
      const tenor = a.tenor ?? "91d";
      const instrument = (tenor === "182d" ? "T-Bill 182d" : tenor === "364d" ? "T-Bill 364d" : "T-Bill 91d") as Investment["instrument"];
      const rate = tenor === "364d" ? 8.8 : tenor === "182d" ? 8.1 : 7.4;
      next.investments.unshift({
        id: `IV-${Date.now()}`, instrument, principal: amt, currentValue: amt, rate,
        maturityDate: new Date(Date.now() + (tenor === "364d" ? 364 : tenor === "182d" ? 182 : 91) * 86400000).toISOString().slice(0, 10),
      });
      next.recentTransactions = [newTxn(`Buy ${instrument}`, "savings", -amt), ...next.recentTransactions].slice(0, 12);
      return { profile: next, receipt: `Purchased ${instrument} for ETB ${amt.toLocaleString()} at ${rate}%.` };
    }
    case "loan_repay": {
      const amt = Math.max(0, Math.round(a.amount));
      const loan = next.loans.find((l) => l.id === a.loanId) ?? next.loans[0];
      if (!loan || amt <= 0 || next.walletBalanceETB < amt) {
        return { profile: p, receipt: `Cannot repay ETB ${amt.toLocaleString()} — check wallet and active loans.` };
      }
      next.walletBalanceETB -= amt;
      loan.outstanding = Math.max(0, loan.outstanding - amt);
      if (loan.outstanding === 0) loan.status = "closed";
      next.recentTransactions = [newTxn(`Loan repayment — ${loan.product}`, "fees", -amt), ...next.recentTransactions].slice(0, 12);
      return { profile: next, receipt: `Paid ETB ${amt.toLocaleString()} toward ${loan.product}. Outstanding: ETB ${loan.outstanding.toLocaleString()}.` };
    }
    case "transfer": {
      const amt = Math.max(0, Math.round(a.amount));
      if (amt <= 0 || next.walletBalanceETB < amt) {
        return { profile: p, receipt: `Insufficient wallet balance for ETB ${amt.toLocaleString()} transfer.` };
      }
      next.walletBalanceETB -= amt;
      next.recentTransactions = [newTxn(`Send to ${a.to}`, "transfer", -amt), ...next.recentTransactions].slice(0, 12);
      return { profile: next, receipt: `Sent ETB ${amt.toLocaleString()} to ${a.to}.` };
    }
    case "transfer_bank_to_bank": {
      const amt = Math.max(0, Math.round(a.amount));
      if (amt <= 0 || next.walletBalanceETB < amt) {
        return { profile: p, receipt: `Insufficient balance for ETB ${amt.toLocaleString()} bank transfer.` };
      }
      next.walletBalanceETB -= amt;
      const dest = [a.toBank, a.toAccount].filter(Boolean).join(" · ") || "external bank";
      next.recentTransactions = [newTxn(`Bank transfer → ${dest}`, "transfer", -amt), ...next.recentTransactions].slice(0, 12);
      return { profile: next, receipt: `Sent ETB ${amt.toLocaleString()} to ${dest}.` };
    }
    case "transfer_bank_to_mno": {
      const amt = Math.max(0, Math.round(a.amount));
      if (amt <= 0 || next.walletBalanceETB < amt) {
        return { profile: p, receipt: `Insufficient balance for ETB ${amt.toLocaleString()} wallet top-up.` };
      }
      next.walletBalanceETB -= amt;
      const dest = [a.toWallet, a.toMsisdn].filter(Boolean).join(" · ") || "MNO wallet";
      next.recentTransactions = [newTxn(`Wallet top-up → ${dest}`, "transfer", -amt), ...next.recentTransactions].slice(0, 12);
      return { profile: next, receipt: `Sent ETB ${amt.toLocaleString()} to ${dest}.` };
    }
    case "transfer_p2p": {
      const amt = Math.max(0, Math.round(a.amount));
      if (amt <= 0 || next.walletBalanceETB < amt) {
        return { profile: p, receipt: `Insufficient balance for ETB ${amt.toLocaleString()} P2P transfer.` };
      }
      next.walletBalanceETB -= amt;
      const dest = a.toContact || "contact";
      next.recentTransactions = [newTxn(`P2P → ${dest}`, "transfer", -amt), ...next.recentTransactions].slice(0, 12);
      return { profile: next, receipt: `Sent ETB ${amt.toLocaleString()} to ${dest}.` };
    }
    default:
      return { profile: p, receipt: `Unsupported action.` };
  }
}
