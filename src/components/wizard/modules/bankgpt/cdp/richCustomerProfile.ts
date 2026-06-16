/**
 * Build a single rich CDP customer profile for the Amara concierge demo.
 * Provides everything mesh-chat needs to:
 *   • Address the customer by name
 *   • Quote real balances (bank + MNO wallet)
 *   • Pick transfer beneficiaries (bank-to-bank, bank-to-MNO, P2P)
 *   • Render weekly / monthly spend + savings charts
 *   • Show savings-goal progress
 */
import { generateSpendProfile, SPEND_CATEGORIES } from "./spendCategoriesET";

export interface RichCustomer {
  customerId: string;
  fullName: string;
  firstName: string;
  primaryLanguage: "am" | "om" | "ti" | "en";
  region: string;
  city: string;
  msisdn: string;
  occupation: string;
  currency: "ETB";
  monthlyIncome: number;
  monthlySpend: number;
  accounts: {
    id: string;
    name: string;
    type: "savings" | "current" | "wallet";
    provider: string;
    balance: number;
  }[];
  beneficiaries: {
    banks: { id: string; bankName: string; accountNumber: string; nickname: string }[];
    mnoWallets: { id: string; wallet: string; msisdn: string; nickname: string }[];
    individuals: { id: string; name: string; relationship: string; preferredChannel: "bank" | "wallet"; msisdn?: string; bank?: string; account?: string }[];
  };
  savingsGoals: {
    id: string;
    name: string;
    target: number;
    current: number;
    progressPct: number;
    monthsRemaining: number;
  }[];
  spend: {
    monthlyTotal: number;
    topCategory: string;
    weeklyByDay: { name: string; value: number }[];        // Mon..Sun (current week)
    monthlyByWeek: { name: string; value: number }[];      // W1..W4 (current month)
    last6Months: { name: string; value: number }[];        // last 6 months totals
    categoryBreakdown: { name: string; value: number }[];  // pie/donut
  };
  savings: {
    weeklyDeposits: { name: string; value: number }[];     // Mon..Sun
    monthlyDeposits: { name: string; value: number }[];    // last 6 months
    goalProgress: { name: string; value: number }[];       // % per goal
  };
  recentTransactions: {
    date: string;
    direction: "credit" | "debit";
    amount: number;
    category: string;
    counterparty: string;
    channel: string;
  }[];
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKS = ["W1", "W2", "W3", "W4"];
const MONTHS_BACK = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function buildAmaraCustomer(): RichCustomer {
  const rng = seeded(42);
  const monthlyIncome = 28500;
  const monthlySpend = 19400;
  const spendProfile = generateSpendProfile(monthlyIncome, monthlySpend, 3);

  // Weekly spend (current week) — Mon..Sun
  const weeklyByDay = DAYS.map((d, i) => ({
    name: d,
    value: Math.round((monthlySpend / 30) * (i === 5 || i === 6 ? 1.6 : 0.85) * (0.7 + rng() * 0.6)),
  }));

  // 4 weeks in this month
  const monthlyByWeek = WEEKS.map((w, i) => ({
    name: w,
    value: Math.round((monthlySpend / 4) * (0.85 + rng() * 0.35) * (i === 3 ? 1.15 : 1)),
  }));

  // Last 6 months totals
  const last6Months = MONTHS_BACK.map((m) => ({
    name: m,
    value: Math.round(monthlySpend * (0.78 + rng() * 0.4)),
  }));

  // Category breakdown for pie
  const categoryBreakdown = spendProfile.categories.map((c) => ({
    name: c.category,
    value: c.amount,
  }));

  // Savings deposits
  const weeklyDeposits = DAYS.map((d, i) => ({
    name: d,
    value: i === 0 || i === 4 ? Math.round(400 + rng() * 300) : Math.round(rng() * 220),
  }));
  const monthlyDeposits = MONTHS_BACK.map((m, i) => ({
    name: m,
    value: Math.round(2400 + i * 220 + rng() * 600),
  }));

  const goals = [
    { id: "SG-1", name: "Wedding fund",       target: 250000, current: 142000 },
    { id: "SG-2", name: "Lalibela pilgrimage", target:  45000, current:  31500 },
    { id: "SG-3", name: "Emergency (3 mo)",   target:  90000, current:  28500 },
  ].map((g) => ({
    ...g,
    progressPct: Math.round((g.current / g.target) * 100),
    monthsRemaining: Math.max(1, Math.round((g.target - g.current) / 5500)),
  }));

  const goalProgress = goals.map((g) => ({ name: g.name, value: g.progressPct }));

  const recentTransactions = [
    { date: "Today 09:14",   direction: "credit" as const, amount: 28500, category: "Salary",        counterparty: "Black Lion Hospital",  channel: "Bank transfer" },
    { date: "Today 11:02",   direction: "debit"  as const, amount:   850, category: "Transport",     counterparty: "Ride ET",              channel: "MNO wallet" },
    { date: "Yesterday",     direction: "debit"  as const, amount:  3200, category: "Groceries",     counterparty: "Shoa Supermarket",     channel: "Card" },
    { date: "Yesterday",     direction: "debit"  as const, amount:   400, category: "Airtime",       counterparty: "Ethio Telecom",        channel: "Telebirr" },
    { date: "2 days ago",    direction: "debit"  as const, amount:  1500, category: "Remittance",    counterparty: "Mother (Bahir Dar)",   channel: "P2P" },
    { date: "3 days ago",    direction: "debit"  as const, amount:  2200, category: "Utilities",     counterparty: "EEU electricity",      channel: "Biller" },
    { date: "4 days ago",    direction: "credit" as const, amount:  1200, category: "Refund",        counterparty: "Hagbes Engineering",   channel: "Bank transfer" },
    { date: "5 days ago",    direction: "debit"  as const, amount:   780, category: "Food",          counterparty: "Kategna Restaurant",   channel: "Card" },
  ];

  return {
    customerId: "CDP-CUST-001",
    fullName: "Selam Tadesse",
    firstName: "Selam",
    primaryLanguage: "am",
    region: "Addis Ababa",
    city: "Addis Ababa",
    msisdn: "+251 911 223 344",
    occupation: "Nurse · Black Lion Hospital",
    currency: "ETB",
    monthlyIncome,
    monthlySpend,
    accounts: [
      { id: "ACC-1", name: "Primary Savings", type: "savings", provider: "ABX Bank",  balance: 64320 },
      { id: "ACC-2", name: "Current Account", type: "current", provider: "ABX Bank",  balance: 12480 },
      { id: "ACC-3", name: "Telebirr Wallet", type: "wallet",  provider: "Telebirr",  balance:  3850 },
    ],
    beneficiaries: {
      banks: [
        { id: "B-1", bankName: "Awash Bank",                    accountNumber: "01300123456",  nickname: "Awash — landlord" },
        { id: "B-2", bankName: "Commercial Bank of Ethiopia",   accountNumber: "1000123456789", nickname: "CBE — savings club" },
        { id: "B-3", bankName: "Dashen Bank",                   accountNumber: "5301223344",   nickname: "Dashen — brother" },
        { id: "B-4", bankName: "Bank of Abyssinia",             accountNumber: "16001445566",  nickname: "BoA — tuition" },
      ],
      mnoWallets: [
        { id: "W-1", wallet: "Telebirr",   msisdn: "0912334455", nickname: "Telebirr — sister" },
        { id: "W-2", wallet: "M-Pesa ET",  msisdn: "0791223344", nickname: "M-Pesa — driver" },
        { id: "W-3", wallet: "HelloCash",  msisdn: "0922556677", nickname: "HelloCash — vendor" },
      ],
      individuals: [
        { id: "P-1", name: "Mother",   relationship: "Mother",      preferredChannel: "wallet", msisdn: "0911776655" },
        { id: "P-2", name: "Brother",  relationship: "Brother",     preferredChannel: "bank",   bank: "Dashen Bank",  account: "5301223344" },
        { id: "P-3", name: "Almaz",    relationship: "Friend",      preferredChannel: "wallet", msisdn: "0913445566" },
        { id: "P-4", name: "Landlord", relationship: "Landlord",    preferredChannel: "bank",   bank: "Awash Bank",   account: "01300123456" },
      ],
    },
    savingsGoals: goals,
    spend: {
      monthlyTotal: monthlySpend,
      topCategory: spendProfile.topCategory,
      weeklyByDay,
      monthlyByWeek,
      last6Months,
      categoryBreakdown,
    },
    savings: {
      weeklyDeposits,
      monthlyDeposits,
      goalProgress,
    },
    recentTransactions,
  };
}

export const AMARA_DEFAULT_CUSTOMER = buildAmaraCustomer();
export const SPEND_CATEGORY_NAMES = SPEND_CATEGORIES;
