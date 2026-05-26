/**
 * ABX Module Registry
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for every Techurate product that can be
 * federated into the ABX Seamless Platform. The wizard reads this
 * list to render module toggles; <ModuleHost/> reads it to mount
 * (or stub) a module at runtime.
 *
 * Today: every entry is a STUB ("Coming soon" placeholder).
 * Tomorrow: each entry gets `remoteEntry` + `exposedModule` and
 * is loaded via Module Federation / React.lazy at runtime.
 */

import {
  Wallet,
  Smartphone,
  Globe,
  Building2,
  Store,
  Scale,
  BookOpen,
  ShieldCheck,
  LineChart,
  CreditCard,
  Network,
  BrainCircuit,
  type LucideIcon,
} from "lucide-react";

export type ModuleStatus = "live" | "beta" | "stub" | "planned";
export type ModuleCategory = "channels" | "operations" | "compliance" | "analytics";

export type ModuleSettingField =
  | { key: string; label: string; type: "text"; placeholder?: string; help?: string; default?: string }
  | { key: string; label: string; type: "number"; min?: number; max?: number; step?: number; help?: string; default?: number }
  | { key: string; label: string; type: "toggle"; help?: string; default?: boolean }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[]; help?: string; default?: string }
  | { key: string; label: string; type: "multiselect"; options: { value: string; label: string }[]; help?: string; default?: string[] };

export type ModuleSettingsSchema = {
  /** Optional grouping for visual sections inside the settings drawer. */
  sections?: { title: string; fields: ModuleSettingField[] }[];
  /** Flat fields if no sections are needed. */
  fields?: ModuleSettingField[];
};

export type AbxModule = {
  id: string;
  name: string;
  category: ModuleCategory;
  description: string;
  icon: LucideIcon;
  status: ModuleStatus;
  /** Default-on for new banks. Wallet + Mobile are the floor. */
  defaultEnabled?: boolean;
  /** Federation contract — populated once the Techurate team ships a remoteEntry.js */
  remoteEntry?: string;
  exposedModule?: string;
  /** Internal route segment under /platform/:moduleId */
  route: string;
  /** Module-specific config form. Stored under BankConfig.moduleSettings[id]. */
  settings?: ModuleSettingsSchema;
};

/** Flatten a schema into a flat list of fields (sections + top-level). */
export function flattenSchema(schema?: ModuleSettingsSchema): ModuleSettingField[] {
  if (!schema) return [];
  const out: ModuleSettingField[] = [];
  if (schema.fields) out.push(...schema.fields);
  if (schema.sections) for (const s of schema.sections) out.push(...s.fields);
  return out;
}

/** Build the default settings object for a module from its schema. */
export function defaultSettingsFor(mod: AbxModule): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of flattenSchema(mod.settings)) {
    if (f.default !== undefined) out[f.key] = f.default;
    else if (f.type === "toggle") out[f.key] = false;
    else if (f.type === "multiselect") out[f.key] = [];
    else if (f.type === "number") out[f.key] = 0;
    else out[f.key] = "";
  }
  return out;
}

export function defaultModuleSettingsMap(): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  for (const m of ABX_MODULES) {
    if (m.settings) out[m.id] = defaultSettingsFor(m);
  }
  return out;
}

export const ABX_MODULES: AbxModule[] = [
  {
    id: "wallet",
    name: "GlobalPay Wallet",
    category: "channels",
    description: "Consumer mobile wallet — the ABX flagship app.",
    icon: Wallet,
    status: "live",
    defaultEnabled: true,
    route: "/wallet",
    settings: {
      sections: [
        {
          title: "Limits",
          fields: [
            { key: "dailySendLimit",    label: "Daily send limit (ETB)",      type: "number", default: 50000,  min: 0, step: 1000 },
            { key: "perTxnLimit",       label: "Per-transaction cap (ETB)",   type: "number", default: 25000,  min: 0, step: 500 },
            { key: "minTopup",          label: "Min top-up (ETB)",            type: "number", default: 50,     min: 0 },
          ],
        },
        {
          title: "Features",
          fields: [
            { key: "p2pEnabled",        label: "Peer-to-peer transfers",      type: "toggle", default: true },
            { key: "billPay",           label: "Bill payments",               type: "toggle", default: true },
            { key: "merchantQr",        label: "Merchant QR payments",        type: "toggle", default: true },
            { key: "savingsGoals",      label: "Goal-based savings",          type: "toggle", default: true },
          ],
        },
      ],
    },
  },
  {
    id: "mobile-banking",
    name: "Mobile Banking",
    category: "channels",
    description: "Retail mobile banking app for account holders.",
    icon: Smartphone,
    status: "live",
    defaultEnabled: true,
    route: "/platform/mobile-banking",
    settings: {
      fields: [
        { key: "sessionTimeoutMin", label: "Session timeout (minutes)", type: "number", default: 5, min: 1, max: 30 },
        { key: "biometricLogin",    label: "Biometric login",           type: "toggle", default: true },
        { key: "cardlessAtm",       label: "Cardless ATM withdrawals",  type: "toggle", default: true },
        { key: "minAppVersion",     label: "Minimum app version",       type: "text",   default: "3.0.0", placeholder: "e.g. 3.0.0" },
      ],
    },
  },
  {
    id: "internet-banking",
    name: "Internet Banking",
    category: "channels",
    description: "Web banking portal for retail and SME customers.",
    icon: Globe,
    status: "live",
    defaultEnabled: true,
    route: "/platform/internet-banking",
    settings: {
      fields: [
        { key: "portalDomain",      label: "Portal domain",             type: "text",   placeholder: "ibank.example.com", default: "ibank.globalpay.et" },
        { key: "mfaMethod",         label: "MFA method",                type: "select", default: "totp",
          options: [
            { value: "sms",  label: "SMS OTP" },
            { value: "totp", label: "TOTP app" },
            { value: "hard", label: "Hardware token" },
          ] },
        { key: "corporateBanking",  label: "Enable corporate banking",  type: "toggle", default: true },
        { key: "bulkPayments",      label: "Bulk payment uploads",      type: "toggle", default: true },
      ],
    },
  },
  {
    id: "smart-branch",
    name: "Smart Branch Banking",
    category: "channels",
    description: "Teller, CSO and branch supervisor workbench.",
    icon: Building2,
    status: "stub",
    route: "/platform/smart-branch",
    settings: {
      fields: [
        { key: "tellerCashLimit",   label: "Teller cash limit (ETB)",     type: "number", default: 100000, step: 5000 },
        { key: "supervisorApproval",label: "Supervisor approval above",   type: "number", default: 250000, step: 10000 },
        { key: "queueManagement",   label: "Queue management system",     type: "toggle", default: true },
        { key: "videoBanking",      label: "Video banking kiosks",        type: "toggle", default: false },
      ],
    },
  },
  {
    id: "agency-banking",
    name: "Agency Banking",
    category: "channels",
    description: "Agent and merchant POS / cash-in-out platform.",
    icon: Store,
    status: "live",
    defaultEnabled: true,
    route: "/platform/agency-banking",
    settings: {
      sections: [
        {
          title: "Commissions",
          fields: [
            { key: "cashInPct",   label: "Cash-in commission (%)",  type: "number", default: 0.5, min: 0, max: 10, step: 0.1 },
            { key: "cashOutPct",  label: "Cash-out commission (%)", type: "number", default: 0.7, min: 0, max: 10, step: 0.1 },
          ],
        },
        {
          title: "Float",
          fields: [
            { key: "minAgentFloat", label: "Min agent float (ETB)", type: "number", default: 5000,  step: 500 },
            { key: "maxAgentFloat", label: "Max agent float (ETB)", type: "number", default: 500000, step: 5000 },
            { key: "autoTopup",     label: "Auto-topup at threshold", type: "toggle", default: true },
          ],
        },
      ],
    },
  },
  {
    id: "merchant-portal",
    name: "Merchant Portal",
    category: "channels",
    description: "Merchant acceptance — QR sales, wallet, settlements and vendor payouts.",
    icon: Store,
    status: "live",
    defaultEnabled: true,
    route: "/platform/merchant-portal",
    settings: {
      fields: [
        { key: "qrAcceptance",  label: "QR acceptance",            type: "toggle", default: true },
        { key: "settlementT",   label: "Settlement cycle (days)",  type: "number", default: 1, min: 0, max: 7 },
        { key: "vendorPayouts", label: "Vendor payouts",           type: "toggle", default: true },
        { key: "disputeWindowDays", label: "Dispute window (days)",type: "number", default: 30, min: 1, max: 120 },
      ],
    },
  },
  {
    id: "reconciliation",
    name: "Reconciliation",
    category: "operations",
    description: "Inter-system, switch and settlement reconciliation.",
    icon: Scale,
    status: "stub",
    route: "/platform/reconciliation",
    settings: {
      fields: [
        { key: "frequency", label: "Recon frequency", type: "select", default: "hourly",
          options: [
            { value: "realtime", label: "Real-time" },
            { value: "hourly",   label: "Hourly" },
            { value: "daily",    label: "Daily" },
          ] },
        { key: "matchingRule",     label: "Matching rule",     type: "text",   default: "reference + amount" },
        { key: "tolerancePct",     label: "Amount tolerance (%)", type: "number", default: 0.01, min: 0, max: 5, step: 0.01 },
        { key: "autoResolveBreaks",label: "Auto-resolve sub-1 ETB breaks", type: "toggle", default: true },
      ],
    },
  },
  {
    id: "general-ledger",
    name: "General Ledger",
    category: "operations",
    description: "Chart of accounts, postings, journal voucher engine.",
    icon: BookOpen,
    status: "planned",
    route: "/platform/general-ledger",
    settings: {
      fields: [
        { key: "fiscalYearStart", label: "Fiscal year start", type: "text",   default: "Hamle 1 (8 July)" },
        { key: "baseCurrency",    label: "Base currency",     type: "text",   default: "ETB" },
        { key: "multiCurrency",   label: "Multi-currency postings", type: "toggle", default: true },
      ],
    },
  },
  {
    id: "card-management",
    name: "Card Management",
    category: "channels",
    description: "Issue, manage and tokenize debit/credit cards.",
    icon: CreditCard,
    status: "planned",
    route: "/platform/card-management",
    settings: {
      fields: [
        { key: "schemes", label: "Card schemes", type: "multiselect", default: ["visa", "mastercard"],
          options: [
            { value: "visa",       label: "Visa" },
            { value: "mastercard", label: "Mastercard" },
            { value: "unionpay",   label: "UnionPay" },
            { value: "amex",       label: "Amex" },
          ] },
        { key: "virtualCards",   label: "Virtual cards",     type: "toggle", default: true },
        { key: "contactless",    label: "Contactless / NFC", type: "toggle", default: true },
        { key: "tokenization",   label: "Apple/Google Pay tokenization", type: "toggle", default: false },
      ],
    },
  },
  {
    id: "aml-compliance",
    name: "AML & Compliance",
    category: "compliance",
    description: "Sanctions screening, CTR/SAR workflows, NBE reports.",
    icon: ShieldCheck,
    status: "stub",
    defaultEnabled: true,
    route: "/platform/aml-compliance",
    settings: {
      sections: [
        {
          title: "Screening",
          fields: [
            { key: "sanctionsLists", label: "Sanctions lists", type: "multiselect",
              default: ["UN", "OFAC", "EU", "NBE"],
              options: [
                { value: "UN",    label: "UN" },
                { value: "OFAC",  label: "OFAC" },
                { value: "EU",    label: "EU" },
                { value: "NBE",   label: "NBE Domestic" },
                { value: "HMT",   label: "UK HMT" },
              ] },
            { key: "screeningFreq", label: "Re-screen frequency", type: "select", default: "daily",
              options: [
                { value: "realtime", label: "Real-time" },
                { value: "daily",    label: "Daily" },
                { value: "weekly",   label: "Weekly" },
              ] },
          ],
        },
        {
          title: "Thresholds",
          fields: [
            { key: "ctrThreshold", label: "CTR reporting threshold (ETB)", type: "number", default: 200000, step: 10000 },
            { key: "sarAutoDraft", label: "Auto-draft SAR cases",          type: "toggle", default: true },
            { key: "kycRefreshMonths", label: "KYC refresh cycle (months)", type: "number", default: 36, min: 6, max: 60 },
          ],
        },
      ],
    },
  },
  {
    id: "analytics-bi",
    name: "Analytics & BI",
    category: "analytics",
    description: "Executive dashboards and operational analytics.",
    icon: LineChart,
    status: "planned",
    route: "/platform/analytics-bi",
    settings: {
      fields: [
        { key: "retentionDays", label: "Event retention (days)", type: "number", default: 365, min: 30, max: 2555 },
        { key: "execDashboards",label: "Executive dashboards",   type: "toggle", default: true },
        { key: "embedReports",  label: "Embeddable reports",     type: "toggle", default: false },
      ],
    },
  },
  {
    id: "bankgpt",
    name: "BankGPT · AI Mesh",
    category: "analytics",
    description: "Conversational AI Mesh — bilingual concierge agents grounded in the customer 360 CDP.",
    icon: BrainCircuit,
    status: "live",
    defaultEnabled: true,
    route: "/platform/bankgpt",
    // Settings drawer is rendered by a bespoke component (BankGPTSettings) —
    // it edits config.ai.mesh directly, so no schema is needed here.
    settings: { fields: [] },
  },
  {
    id: "switch-integration",
    name: "Switch Integration",
    category: "operations",
    description: "EthSwitch, Telebirr, M-Pesa, CBE Birr interop.",
    icon: Network,
    status: "stub",
    route: "/platform/switch-integration",
    settings: {
      fields: [
        { key: "participantCode", label: "EthSwitch participant code", type: "text", default: "ETSW-GP-001" },
        { key: "telebirr",  label: "Telebirr interop", type: "toggle", default: true },
        { key: "mpesa",     label: "M-Pesa interop",   type: "toggle", default: true },
        { key: "cbeBirr",   label: "CBE Birr interop", type: "toggle", default: true },
        { key: "settlementAccount", label: "Settlement account", type: "text", default: "0100-GP-NBE" },
      ],
    },
  },
];

export const MODULES_BY_CATEGORY: Record<ModuleCategory, AbxModule[]> = {
  channels:   ABX_MODULES.filter((m) => m.category === "channels"),
  operations: ABX_MODULES.filter((m) => m.category === "operations"),
  compliance: ABX_MODULES.filter((m) => m.category === "compliance"),
  analytics:  ABX_MODULES.filter((m) => m.category === "analytics"),
};

export const CATEGORY_LABEL: Record<ModuleCategory, string> = {
  channels:   "Customer Channels",
  operations: "Operations",
  compliance: "Risk & Compliance",
  analytics:  "Insight",
};

export function defaultEnabledModuleIds(): string[] {
  return ABX_MODULES.filter((m) => m.defaultEnabled).map((m) => m.id);
}

export function getModule(id: string): AbxModule | undefined {
  return ABX_MODULES.find((m) => m.id === id);
}
