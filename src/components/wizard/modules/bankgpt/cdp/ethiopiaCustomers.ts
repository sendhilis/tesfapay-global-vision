/**
 * Ethiopian synthetic CDP — 50 customers, one persona view per Mesh agent.
 * The personas + data fields are aligned 1:1 with the customer-facing
 * BankGPT Mesh agents (Concierge, Onboarding, Savings Coach, Investment
 * Coach, Loan Agent, Service Agent). The outbound-only Notification agent
 * (Pulse) does not need a customer persona view — it broadcasts on top of
 * any of these segments.
 */
import { generateSpendProfile, type SpendProfile } from "./spendCategoriesET";

/** Mirrors MeshAgentId from BankConfigContext (minus notificationAgent). */
export type AgentPersona =
  | 'concierge'
  | 'onboarding'
  | 'savings_coach'
  | 'investment_coach'
  | 'loan_agent'
  | 'service_agent';

export const PERSONA_LABELS: Record<AgentPersona, string> = {
  concierge:        'Amara · Concierge',
  onboarding:       'Selam-Bot · Onboarding',
  savings_coach:    'Nuru · Savings Coach',
  investment_coach: 'Kea · Investment Coach',
  loan_agent:       'Dawit-Bot · Loan Agent',
  service_agent:    'Hana · Service Agent',
};

export const PERSONA_DESCRIPTIONS: Record<AgentPersona, string> = {
  concierge:        'The 360° intent router — sees every customer, last interaction, top intent, and routes to a specialist.',
  onboarding:       'New & in-flight customers — KYC tier, Fayda capture progress, missing documents, language preference.',
  savings_coach:    'Goal-based savings, Equb, wedding & emergency funds — savings rate, goal progress, spend leakage.',
  investment_coach: 'Idle cash & wealth-building — T-Bills, fixed deposits, investment ratio, risk appetite.',
  loan_agent:       'Pre-qualification, micro-loans & collections — credit score, delinquency, DTI, qualifying amount.',
  service_agent:    'Disputes, fraud, complaints & escalations — open tickets, NPS, SLA, fraud flags.',
};

export const PERSONA_COLORS: Record<AgentPersona, string> = {
  concierge:        '#0B1538',
  onboarding:       '#7C3AED',
  savings_coach:    '#00C9B1',
  investment_coach: '#FFB830',
  loan_agent:       '#3B82F6',
  service_agent:    '#EF4444',
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
  currency: 'ETB';

  /* Core financial profile (used by every agent) */
  monthlyIncome: number;
  monthlySpend: number;
  balance: number;
  savingsRate: number;
  creditScore: number;
  scoreTrend: number;
  riskTier: 'Low' | 'Medium' | 'High';
  kycTier: 1 | 2 | 3;

  /* Concierge — 360° */
  lastInteractionDays: number;
  topIntent: string;
  routedToAgent: AgentPersona;
  engagementScore: number;        // 0..100
  lifetimeValue: number;          // ETB
  productsHeld: number;
  channelPreference: 'App' | 'USSD' | 'Voice' | 'Agent' | 'Branch';

  /* Onboarding */
  daysSinceSignup: number;
  onboardingProgress: number;     // 0..100
  faydaCaptured: boolean;
  livenessPassed: boolean;
  missingDocuments: string[];
  activationStatus: 'New' | 'In-flight' | 'Activated' | 'Dormant';

  /* Savings */
  savingsGoalName: string;
  savingsGoalTarget: number;
  savingsGoalCurrent: number;
  goalProgress: number;
  emergencyFundMonths: number;
  equbMember: boolean;
  autoSweepEnabled: boolean;
  spendProfile?: SpendProfile;

  /* Investment */
  investmentBalance: number;
  investmentToIncomeRatio: number;
  idleCashPercent: number;
  riskAppetite: 'Conservative' | 'Balanced' | 'Growth';
  tbillHoldingsETB: number;
  fixedDepositETB: number;
  depositGrowthRate: number;

  /* Loan */
  loanProduct: string;
  loanAmount: number;
  loanTenureMonths: number;
  loanInterestRate: number;
  loanStatus: 'Active' | 'Paid' | 'Overdue' | 'None';
  delinquencyDays: number;
  missedPayments: number;
  debtToIncomeRatio: number;      // 0..1
  qualifyingAmount: number;       // pre-approved ETB

  /* Service / complaints */
  openTickets: number;
  lastTicketCategory: 'Card dispute' | 'Failed transfer' | 'Fraud alert' | 'App issue' | 'Statement' | 'None';
  npsScore: number;               // 0..10
  slaBreaches: number;
  fraudFlags: number;
  satisfactionTrend: number;      // -10..+10
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
const INTENTS_BY_AGENT: Record<AgentPersona, string[]> = {
  concierge:        ['Check balance', 'General enquiry', 'Update profile', 'Branch hours'],
  onboarding:       ['Open account', 'Re-submit Fayda ID', 'Liveness retry', 'Tier upgrade'],
  savings_coach:    ['Start wedding goal', 'Join Equb', 'Auto-sweep salary', 'Top up savings'],
  investment_coach: ['Buy T-Bills', 'Open fixed deposit', 'Move idle cash', 'Yield comparison'],
  loan_agent:       ['Apply micro-loan', 'Reschedule installment', 'Settle overdue', 'Increase limit'],
  service_agent:    ['Dispute card charge', 'Failed transfer', 'Report fraud', 'App crash'],
};
const TICKET_CATS: Customer['lastTicketCategory'][] = ['Card dispute','Failed transfer','Fraud alert','App issue','Statement'];
const CHANNELS: Customer['channelPreference'][] = ['App','USSD','Voice','Agent','Branch'];

export function generateCustomersForPersona(persona: AgentPersona): Customer[] {
  return NAMES.map((meta, i) => {
    const id = String(i + 1).padStart(3, '0');

    /* baseline */
    let monthlyIncome = rand(8_000, 250_000);
    let creditScore = rand(500, 800);
    let scoreTrend = rand(-15, 30);
    let savingsRate = randFloat(0.02, 0.25);
    let balance = rand(1_000, 400_000);
    let segment: Customer['segment'] = i % 9 === 0 ? 'Corporate' : i % 4 === 0 ? 'Merchant' : 'Retail';
    let riskTier: Customer['riskTier'] = 'Low';

    /* Concierge defaults (general 360) */
    let lastInteractionDays = rand(0, 30);
    let topIntent = pick(INTENTS_BY_AGENT.concierge);
    let routedToAgent: AgentPersona = pick(['savings_coach','investment_coach','loan_agent','service_agent','onboarding'] as AgentPersona[]);
    let engagementScore = rand(20, 95);
    let productsHeld = rand(1, 5);
    let channelPreference = pick(CHANNELS);

    /* Onboarding */
    let daysSinceSignup = rand(0, 720);
    let onboardingProgress = 100;
    let faydaCaptured = true;
    let livenessPassed = true;
    let missingDocuments: string[] = [];
    let activationStatus: Customer['activationStatus'] = 'Activated';

    /* Savings */
    let savingsGoalTarget = rand(20_000, 500_000);
    let goalProgress = rand(20, 90);
    let emergencyFundMonths = randFloat(0, 3);
    let equbMember = i % 3 === 0;
    let autoSweepEnabled = i % 4 === 0;

    /* Investment */
    let investmentBalance = rand(0, 50_000);
    let investmentToIncomeRatio = randFloat(0, 0.15);
    let idleCashPercent = randFloat(5, 40);
    let riskAppetite: Customer['riskAppetite'] = pick(['Conservative','Balanced','Growth'] as const);
    let tbillHoldingsETB = 0;
    let fixedDepositETB = 0;
    let depositGrowthRate = randFloat(-5, 15);

    /* Loan */
    let loanAmount = 0;
    let loanStatus: Customer['loanStatus'] = pick(['Active','Paid','None'] as const);
    let delinquencyDays = 0;
    let missedPayments = 0;
    let debtToIncomeRatio = randFloat(0, 0.35);
    let qualifyingAmount = rand(0, 50_000);

    /* Service */
    let openTickets = 0;
    let lastTicketCategory: Customer['lastTicketCategory'] = 'None';
    let npsScore = rand(6, 10);
    let slaBreaches = 0;
    let fraudFlags = 0;
    let satisfactionTrend = rand(-3, 6);

    switch (persona) {
      case 'concierge':
        // broad mix — emphasise engagement + routing diversity
        topIntent = pick(INTENTS_BY_AGENT[routedToAgent]);
        lastInteractionDays = rand(0, 14);
        engagementScore = rand(40, 98);
        productsHeld = rand(2, 6);
        break;

      case 'onboarding':
        daysSinceSignup = rand(0, 30);
        activationStatus = i % 5 === 0 ? 'New' : i % 4 === 0 ? 'In-flight' : i % 7 === 0 ? 'Dormant' : 'Activated';
        onboardingProgress = activationStatus === 'New' ? rand(10, 40)
                          : activationStatus === 'In-flight' ? rand(40, 80)
                          : activationStatus === 'Dormant' ? rand(60, 90) : 100;
        faydaCaptured  = onboardingProgress >= 50;
        livenessPassed = onboardingProgress >= 70;
        missingDocuments = [
          !faydaCaptured && 'Fayda ID',
          !livenessPassed && 'Liveness selfie',
          onboardingProgress < 90 && 'Proof of address',
        ].filter(Boolean) as string[];
        productsHeld = activationStatus === 'Activated' ? rand(1, 3) : 0;
        topIntent = pick(INTENTS_BY_AGENT.onboarding);
        routedToAgent = 'onboarding';
        balance = activationStatus === 'Activated' ? rand(2_000, 30_000) : 0;
        break;

      case 'savings_coach':
        savingsRate = i % 3 === 0 ? randFloat(0.01, 0.06) : randFloat(0.07, 0.28);
        emergencyFundMonths = i % 4 === 0 ? randFloat(0, 0.5) : randFloat(0.5, 4);
        goalProgress = i % 3 === 0 ? rand(5, 30) : rand(30, 95);
        equbMember = i % 2 === 0;
        autoSweepEnabled = i % 3 !== 0;
        topIntent = pick(INTENTS_BY_AGENT.savings_coach);
        routedToAgent = 'savings_coach';
        segment = 'Retail';
        break;

      case 'investment_coach':
        balance = rand(80_000, 2_000_000);
        investmentBalance = rand(20_000, 1_500_000);
        investmentToIncomeRatio = i % 3 === 0 ? randFloat(0, 0.05) : randFloat(0.05, 0.35);
        idleCashPercent = i % 3 === 0 ? randFloat(30, 60) : randFloat(5, 25);
        creditScore = rand(620, 820);
        savingsRate = randFloat(0.1, 0.35);
        tbillHoldingsETB = i % 2 === 0 ? rand(10_000, 500_000) : 0;
        fixedDepositETB = i % 3 !== 0 ? rand(20_000, 800_000) : 0;
        riskAppetite = pick(['Conservative','Balanced','Growth'] as const);
        topIntent = pick(INTENTS_BY_AGENT.investment_coach);
        routedToAgent = 'investment_coach';
        break;

      case 'loan_agent':
        loanAmount = rand(15_000, 800_000);
        loanStatus = i % 2 === 0 ? 'Overdue' : 'Active';
        delinquencyDays = loanStatus === 'Overdue' ? rand(7, 180) : 0;
        missedPayments = loanStatus === 'Overdue' ? rand(1, 8) : rand(0, 1);
        creditScore = loanStatus === 'Overdue' ? rand(420, 580) : rand(550, 700);
        scoreTrend = loanStatus === 'Overdue' ? rand(-40, -5) : rand(-10, 10);
        riskTier = delinquencyDays > 60 ? 'High' : delinquencyDays > 20 ? 'Medium' : 'Low';
        debtToIncomeRatio = randFloat(0.15, 0.65);
        qualifyingAmount = loanStatus === 'Overdue' ? 0 : Math.round(monthlyIncome * randFloat(0.5, 3));
        topIntent = pick(INTENTS_BY_AGENT.loan_agent);
        routedToAgent = 'loan_agent';
        break;

      case 'service_agent':
        openTickets = i % 3 === 0 ? rand(1, 4) : 0;
        lastTicketCategory = openTickets > 0 ? pick(TICKET_CATS) : 'None';
        npsScore = openTickets > 1 ? rand(0, 5) : rand(5, 10);
        slaBreaches = openTickets > 2 ? rand(1, 3) : 0;
        fraudFlags = lastTicketCategory === 'Fraud alert' ? rand(1, 3) : 0;
        satisfactionTrend = openTickets > 1 ? rand(-10, -2) : rand(0, 8);
        riskTier = fraudFlags > 0 ? 'High' : slaBreaches > 0 ? 'Medium' : 'Low';
        topIntent = pick(INTENTS_BY_AGENT.service_agent);
        routedToAgent = 'service_agent';
        break;
    }

    const monthlySpend = Math.round(monthlyIncome * (1 - savingsRate));
    const savingsGoalCurrent = Math.round(savingsGoalTarget * goalProgress / 100);
    const spendProfile = persona === 'savings_coach'
      ? generateSpendProfile(monthlyIncome, monthlySpend, i) : undefined;
    const kycTier = (segment === 'Corporate' ? 3 : monthlyIncome > 50_000 ? 3 : monthlyIncome > 15_000 ? 2 : 1) as Customer['kycTier'];
    const lifetimeValue = Math.round(monthlyIncome * randFloat(2, 14));

    return {
      customerId: `GP-ET-${id}`,
      city: meta.city, region: meta.region, segment,
      fullName: meta.name, primaryLanguage: meta.lang,
      age: rand(22, 58), occupation: pick(OCCUPATIONS), currency: 'ETB',

      monthlyIncome, monthlySpend, balance, savingsRate,
      creditScore, scoreTrend, riskTier, kycTier,

      lastInteractionDays, topIntent, routedToAgent,
      engagementScore, lifetimeValue, productsHeld, channelPreference,

      daysSinceSignup, onboardingProgress, faydaCaptured, livenessPassed,
      missingDocuments, activationStatus,

      savingsGoalName: pick(SAVINGS_GOALS),
      savingsGoalTarget, savingsGoalCurrent, goalProgress,
      emergencyFundMonths, equbMember, autoSweepEnabled, spendProfile,

      investmentBalance, investmentToIncomeRatio, idleCashPercent,
      riskAppetite, tbillHoldingsETB, fixedDepositETB, depositGrowthRate,

      loanProduct: loanAmount > 0 ? pick(LOAN_PRODUCTS) : '',
      loanAmount,
      loanTenureMonths: loanAmount > 0 ? rand(6, 60) : 0,
      loanInterestRate: loanAmount > 0 ? randFloat(8, 24) : 0,
      loanStatus, delinquencyDays, missedPayments,
      debtToIncomeRatio, qualifyingAmount,

      openTickets, lastTicketCategory, npsScore, slaBreaches,
      fraudFlags, satisfactionTrend,
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
  event_type: 'salary_credit' | 'deposit' | 'transfer_in' | 'interest_credit' | 'loan_debit' | 'bill_payment' | 'merchant_payment' | 'withdrawal' | 'transfer_out' | 'airtime_topup' | 'kyc_step' | 'complaint_open' | 'tbill_buy';
  amount: number;
  currency: 'ETB';
  description: string;
  category: string | null;
  balance_after: number | null;
  event_date: string;
};

const EVENT_TEMPLATES: { type: CustomerEvent['event_type']; desc: string; sign: 1 | -1 | 0; amt: [number, number]; cat: string | null }[] = [
  { type: 'salary_credit',    desc: 'Salary credit',                   sign:  1, amt: [8000, 80000], cat: 'Income' },
  { type: 'deposit',          desc: 'Cash deposit at agent',           sign:  1, amt: [500, 20000],  cat: 'Deposit' },
  { type: 'transfer_in',      desc: 'Received from family',            sign:  1, amt: [200, 15000],  cat: 'Transfer' },
  { type: 'interest_credit',  desc: 'T-Bill interest credit',          sign:  1, amt: [50, 2500],    cat: 'Investment' },
  { type: 'tbill_buy',        desc: 'T-Bill purchase',                 sign: -1, amt: [5000, 200000],cat: 'Investment' },
  { type: 'loan_debit',       desc: 'Loan installment debit',          sign: -1, amt: [600, 14300],  cat: 'Loan' },
  { type: 'bill_payment',     desc: 'EEU electricity bill',            sign: -1, amt: [120, 2400],   cat: 'Bills' },
  { type: 'merchant_payment', desc: 'Mercato wholesale purchase',      sign: -1, amt: [80, 4200],    cat: 'Shopping' },
  { type: 'withdrawal',       desc: 'Agent cash-out',                  sign: -1, amt: [300, 10000],  cat: 'Withdrawal' },
  { type: 'transfer_out',     desc: 'Send to Bahir Dar',               sign: -1, amt: [200, 8000],   cat: 'Transfer' },
  { type: 'airtime_topup',    desc: 'Ethio Telecom airtime',           sign: -1, amt: [50, 500],     cat: 'Airtime' },
  { type: 'kyc_step',         desc: 'Fayda ID liveness passed',        sign:  0, amt: [0, 0],        cat: 'Onboarding' },
  { type: 'complaint_open',   desc: 'Card dispute ticket opened',      sign:  0, amt: [0, 0],        cat: 'Service' },
];

export function generateRandomEvent(customers: Customer[]): CustomerEvent {
  const c = customers[Math.floor(Math.random() * customers.length)];
  const tpl = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
  const raw = tpl.amt[1] > 0 ? Math.floor(Math.random() * (tpl.amt[1] - tpl.amt[0])) + tpl.amt[0] : 0;
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
    balance_after: tpl.sign === 0 ? null : Math.max(0, c.balance + amount),
    event_date: new Date().toISOString(),
  };
}
