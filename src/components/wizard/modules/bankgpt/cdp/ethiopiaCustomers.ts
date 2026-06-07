/**
 * Ethiopian synthetic CDP — 50 customers across 5 BankGPT personas.
 * Mirrors the framework of the reference Tigiverse CDP, localised to ETB,
 * Ethiopian cities, Amharic/Oromo/Tigrinya speakers and realistic income bands.
 */
import { generateSpendProfile, type SpendProfile } from "./spendCategoriesET";

export type AgentPersona =
  | 'financial_advisor'
  | 'collections_copilot'
  | 'savings_coach'
  | 'merchant_support'
  | 'corporate_liaison';

export const PERSONA_LABELS: Record<AgentPersona, string> = {
  financial_advisor:   'Investment Coach',
  collections_copilot: 'Loan & Collections',
  savings_coach:       'Savings Coach',
  merchant_support:    'Merchant Success',
  corporate_liaison:   'Corporate Liaison',
};

export const PERSONA_DESCRIPTIONS: Record<AgentPersona, string> = {
  financial_advisor:   'Guides Ethiopian customers through T-Bills, mutual funds and goal-based investing',
  collections_copilot: 'Manages overdue micro-loans and working-capital facilities with empathy',
  savings_coach:       'Builds Equb, wedding and emergency savings habits in ETB',
  merchant_support:    'Helps Mercato traders & merchants grow digital payment volume',
  corporate_liaison:   'Manages payroll, FX and receivables for Addis corporates',
};

export interface Customer {
  customerId: string;
  city: string;
  region: 'Addis Ababa' | 'Oromia' | 'Amhara' | 'Tigray' | 'SNNPR' | 'Sidama' | 'Dire Dawa' | 'Harari';
  segment: 'Retail' | 'Corporate' | 'Merchant';
  fullName: string;
  primaryLanguage: 'am' | 'om' | 'ti' | 'en';
  age: number;
  occupation: string;
  creditScore: number;
  scoreTrend: number;
  riskTier: 'Low' | 'Medium' | 'High';
  kycTier: 1 | 2 | 3;
  savingsRate: number;
  balance: number;       // ETB
  currency: 'ETB';
  missedPayments: number;
  loanStatus: 'Active' | 'Paid' | 'Overdue' | 'None';
  monthlySpend: number;
  goalProgress: number;
  monthlyIncome: number;
  savingsGoalName: string;
  savingsGoalTarget: number;
  savingsGoalCurrent: number;
  loanAmount: number;
  loanProduct: string;
  loanTenureMonths: number;
  loanInterestRate: number;
  delinquencyDays: number;
  merchantTxnVolume: number;
  merchantAvgTxnValue: number;
  payrollAutomated: boolean;
  receivablesDaysOutstanding: number;
  investmentToIncomeRatio: number;
  emergencyFundMonths: number;
  digitalPaymentAdoption: number;
  idleCashPercent: number;
  fxTransactionCostPercent: number;
  depositGrowthRate: number;
  spendProfile?: SpendProfile;
}

/** 50 real-sounding Ethiopian names (mixed Amhara/Oromo/Tigray/Gurage). */
const NAMES: { name: string; lang: Customer['primaryLanguage']; region: Customer['region']; city: string }[] = [
  { name: 'Selam Tadesse',       lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Bekele Wolde',        lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Tigist Alemu',        lang: 'am', region: 'Sidama',      city: 'Hawassa' },
  { name: 'Abebe Girma',         lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Hanna Mekonnen',      lang: 'am', region: 'Amhara',      city: 'Bahir Dar' },
  { name: 'Dawit Haile',         lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Meron Tesfaye',       lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Yonas Asrat',         lang: 'am', region: 'Amhara',      city: 'Gondar' },
  { name: 'Rahel Bekele',        lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Samuel Kebede',       lang: 'am', region: 'Oromia',      city: 'Adama' },
  { name: 'Liya Solomon',        lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Henok Gebremariam',   lang: 'ti', region: 'Tigray',      city: 'Mekelle' },
  { name: 'Senait Yohannes',     lang: 'ti', region: 'Tigray',      city: 'Mekelle' },
  { name: 'Tewodros Lemma',      lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Kalkidan Assefa',     lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Biruk Tilahun',       lang: 'am', region: 'Amhara',      city: 'Dessie' },
  { name: 'Hiwot Negash',        lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Eyob Demissie',       lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Frehiwot Abera',      lang: 'am', region: 'SNNPR',       city: 'Arba Minch' },
  { name: 'Mulugeta Worku',      lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Sara Eshetu',         lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Daniel Hailu',        lang: 'am', region: 'Oromia',      city: 'Bishoftu' },
  { name: 'Bethlehem Tsegaye',   lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Solomon Endale',      lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Mahlet Berhanu',      lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Gemechu Tolosa',      lang: 'om', region: 'Oromia',      city: 'Jimma' },
  { name: 'Chaltu Bedasa',       lang: 'om', region: 'Oromia',      city: 'Nekemte' },
  { name: 'Boran Diriba',        lang: 'om', region: 'Oromia',      city: 'Adama' },
  { name: 'Lelise Wakene',       lang: 'om', region: 'Oromia',      city: 'Shashemene' },
  { name: 'Tariku Fufa',         lang: 'om', region: 'Oromia',      city: 'Adama' },
  { name: 'Asnakech Belay',      lang: 'am', region: 'Amhara',      city: 'Bahir Dar' },
  { name: 'Yared Mengistu',      lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Tirhas Kahsay',       lang: 'ti', region: 'Tigray',      city: 'Axum' },
  { name: 'Genet Wondwossen',    lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Helen Asefa',         lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Mikiyas Getachew',    lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Aster Hailemariam',   lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Robel Abraham',       lang: 'ti', region: 'Tigray',      city: 'Mekelle' },
  { name: 'Beza Petros',         lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Fasil Teklu',         lang: 'am', region: 'Amhara',      city: 'Gondar' },
  { name: 'Saba Markos',         lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Habtamu Belete',      lang: 'am', region: 'Amhara',      city: 'Debre Birhan' },
  { name: 'Nardos Yilma',        lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Mesfin Aklilu',       lang: 'am', region: 'Dire Dawa',   city: 'Dire Dawa' },
  { name: 'Lemlem Goitom',       lang: 'ti', region: 'Tigray',      city: 'Adigrat' },
  { name: 'Endale Sisay',        lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
  { name: 'Birhane Tesfaldet',   lang: 'ti', region: 'Tigray',      city: 'Mekelle' },
  { name: 'Wubit Kassahun',      lang: 'am', region: 'Sidama',      city: 'Hawassa' },
  { name: 'Tsegaye Molla',       lang: 'am', region: 'Harari',      city: 'Harar' },
  { name: 'Aklilu Wondimu',      lang: 'am', region: 'Addis Ababa', city: 'Addis Ababa' },
];

const OCCUPATIONS = ['Software Engineer','Nurse','Teacher','Bajaj driver','Mercato trader','Café owner','Tour guide','Civil servant','Construction foreman','Doctor','University lecturer','Hotel manager','NGO officer','Bank teller','Coffee exporter','Garment factory worker','Shop owner','Pharmacist','Accountant','Logistics coordinator'];

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min: number, max: number) { return +(Math.random() * (max - min) + min).toFixed(2); }
function pick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

const SAVINGS_GOALS = ['Wedding fund','Lalibela pilgrimage','Daughter\'s education','House down-payment','Hajj savings','Emergency fund (3 mo)','Car purchase','Shop renovation','Land purchase','Master\'s degree fund'];
const LOAN_PRODUCTS = ['Mercato micro-loan','Salary advance','Working-capital loan','Agri-loan (coffee)','Equb top-up','Home improvement loan','SME expansion loan'];

export function generateCustomersForPersona(persona: AgentPersona): Customer[] {
  return NAMES.map((meta, i) => {
    const id = String(i + 1).padStart(3, '0');

    let monthlyIncome = rand(8_000, 250_000);
    let creditScore = rand(500, 800);
    let scoreTrend = rand(-15, 30);
    let savingsRate = randFloat(0.02, 0.25);
    let missedPayments = rand(0, 3);
    let balance = rand(1_000, 400_000);
    let loanStatus: Customer['loanStatus'] = pick(['Active','Paid','None'] as const);
    let delinquencyDays = 0;
    let loanAmount = 0;
    let merchantTxnVolume = 0;
    let merchantAvgTxnValue = 0;
    let payrollAutomated = false;
    let receivablesDaysOutstanding = 0;
    let investmentToIncomeRatio = randFloat(0, 0.15);
    let emergencyFundMonths = randFloat(0, 3);
    let digitalPaymentAdoption = rand(20, 90);
    let idleCashPercent = randFloat(5, 40);
    let fxTransactionCostPercent = randFloat(0.5, 3);
    let depositGrowthRate = randFloat(-5, 15);
    let segment: Customer['segment'] = 'Retail';
    let riskTier: Customer['riskTier'] = 'Low';
    let goalProgress = rand(20, 90);
    let savingsGoalTarget = rand(20_000, 500_000);

    switch (persona) {
      case 'savings_coach':
        savingsRate = i % 3 === 0 ? randFloat(0.01, 0.06) : randFloat(0.07, 0.28);
        emergencyFundMonths = i % 4 === 0 ? randFloat(0, 0.5) : randFloat(0.5, 4);
        goalProgress = i % 3 === 0 ? rand(5, 30) : rand(30, 95);
        idleCashPercent = randFloat(10, 50);
        segment = 'Retail';
        break;
      case 'collections_copilot':
        loanAmount = rand(15_000, 800_000);
        loanStatus = i % 2 === 0 ? 'Overdue' : 'Active';
        delinquencyDays = loanStatus === 'Overdue' ? rand(7, 180) : 0;
        missedPayments = loanStatus === 'Overdue' ? rand(1, 8) : rand(0, 1);
        creditScore = loanStatus === 'Overdue' ? rand(420, 580) : rand(550, 700);
        scoreTrend = loanStatus === 'Overdue' ? rand(-40, -5) : rand(-10, 10);
        riskTier = delinquencyDays > 60 ? 'High' : delinquencyDays > 20 ? 'Medium' : 'Low';
        break;
      case 'financial_advisor':
        balance = rand(80_000, 2_000_000);
        investmentToIncomeRatio = i % 3 === 0 ? randFloat(0, 0.05) : randFloat(0.05, 0.35);
        idleCashPercent = i % 3 === 0 ? randFloat(30, 60) : randFloat(5, 25);
        creditScore = rand(620, 820);
        savingsRate = randFloat(0.1, 0.35);
        segment = i % 4 === 0 ? 'Corporate' : 'Retail';
        break;
      case 'merchant_support':
        segment = 'Merchant';
        merchantTxnVolume = rand(50, 5_000);
        merchantAvgTxnValue = rand(100, 8_000);
        digitalPaymentAdoption = i % 3 === 0 ? rand(10, 35) : rand(40, 95);
        balance = rand(10_000, 1_500_000);
        depositGrowthRate = i % 4 === 0 ? randFloat(-10, 0) : randFloat(0, 20);
        break;
      case 'corporate_liaison':
        segment = 'Corporate';
        monthlyIncome = rand(200_000, 5_000_000);
        payrollAutomated = i % 3 !== 0;
        receivablesDaysOutstanding = i % 3 === 0 ? rand(45, 120) : rand(10, 45);
        fxTransactionCostPercent = i % 4 === 0 ? randFloat(2, 5) : randFloat(0.3, 2);
        balance = rand(500_000, 10_000_000);
        depositGrowthRate = randFloat(-5, 25);
        break;
    }

    const monthlySpend = Math.round(monthlyIncome * (1 - savingsRate));
    const savingsGoalCurrent = Math.round(savingsGoalTarget * goalProgress / 100);
    const spendProfile = persona === 'savings_coach' ? generateSpendProfile(monthlyIncome, monthlySpend, i) : undefined;
    const kycTier = (segment === 'Corporate' ? 3 : monthlyIncome > 50_000 ? 3 : monthlyIncome > 15_000 ? 2 : 1) as Customer['kycTier'];

    return {
      customerId: `GP-ET-${id}`,
      city: meta.city,
      region: meta.region,
      segment,
      fullName: meta.name,
      primaryLanguage: meta.lang,
      age: rand(22, 58),
      occupation: pick(OCCUPATIONS),
      creditScore, scoreTrend, riskTier, kycTier,
      savingsRate, balance, currency: 'ETB',
      missedPayments, loanStatus, monthlySpend, goalProgress,
      monthlyIncome,
      savingsGoalName: pick(SAVINGS_GOALS),
      savingsGoalTarget, savingsGoalCurrent,
      loanAmount,
      loanProduct: loanAmount > 0 ? pick(LOAN_PRODUCTS) : '',
      loanTenureMonths: loanAmount > 0 ? rand(6, 60) : 0,
      loanInterestRate: loanAmount > 0 ? randFloat(8, 24) : 0,
      delinquencyDays,
      merchantTxnVolume, merchantAvgTxnValue,
      payrollAutomated, receivablesDaysOutstanding,
      investmentToIncomeRatio, emergencyFundMonths,
      digitalPaymentAdoption, idleCashPercent,
      fxTransactionCostPercent, depositGrowthRate,
      spendProfile,
    };
  });
}

export const cdpStats = {
  totalCustomers: NAMES.length,
  regions: ['Addis Ababa','Oromia','Amhara','Tigray','SNNPR','Sidama','Dire Dawa','Harari'],
  languages: ['Amharic','Oromo','Tigrinya','English'],
};

/* ── Synthetic realtime event stream ─────────────────────────── */

export type CustomerEvent = {
  id: string;
  customer_id: string;
  customer_name: string;
  event_type: 'salary_credit' | 'deposit' | 'transfer_in' | 'interest_credit' | 'loan_debit' | 'bill_payment' | 'merchant_payment' | 'withdrawal' | 'transfer_out' | 'airtime_topup';
  amount: number;
  currency: 'ETB';
  description: string;
  category: string | null;
  balance_after: number | null;
  event_date: string;
};

const EVENT_TEMPLATES: { type: CustomerEvent['event_type']; desc: string; sign: 1 | -1; amt: [number, number]; cat: string | null }[] = [
  { type: 'salary_credit',    desc: 'Salary credit',                   sign:  1, amt: [8000, 80000], cat: 'Income' },
  { type: 'deposit',          desc: 'Cash deposit at agent',           sign:  1, amt: [500, 20000],  cat: 'Deposit' },
  { type: 'transfer_in',      desc: 'Received from family',            sign:  1, amt: [200, 15000],  cat: 'Transfer' },
  { type: 'interest_credit',  desc: 'T-Bill interest credit',          sign:  1, amt: [50, 2500],    cat: 'Investment' },
  { type: 'loan_debit',       desc: 'Loan installment debit',          sign: -1, amt: [600, 14300],  cat: 'Loan' },
  { type: 'bill_payment',     desc: 'EEU electricity bill',            sign: -1, amt: [120, 2400],   cat: 'Bills' },
  { type: 'merchant_payment', desc: 'Mercato wholesale purchase',      sign: -1, amt: [80, 4200],    cat: 'Shopping' },
  { type: 'withdrawal',       desc: 'Agent cash-out',                  sign: -1, amt: [300, 10000],  cat: 'Withdrawal' },
  { type: 'transfer_out',     desc: 'Send to Bahir Dar',               sign: -1, amt: [200, 8000],   cat: 'Transfer' },
  { type: 'airtime_topup',    desc: 'Ethio Telecom airtime',           sign: -1, amt: [50, 500],     cat: 'Airtime' },
];

export function generateRandomEvent(customers: Customer[]): CustomerEvent {
  const c = customers[Math.floor(Math.random() * customers.length)];
  const tpl = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
  const raw = Math.floor(Math.random() * (tpl.amt[1] - tpl.amt[0])) + tpl.amt[0];
  const amount = tpl.sign * raw;
  return {
    id: `EVT-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    customer_id: c.customerId,
    customer_name: c.fullName,
    event_type: tpl.type,
    amount,
    currency: 'ETB',
    description: tpl.desc,
    category: tpl.cat,
    balance_after: Math.max(0, c.balance + amount),
    event_date: new Date().toISOString(),
  };
}
