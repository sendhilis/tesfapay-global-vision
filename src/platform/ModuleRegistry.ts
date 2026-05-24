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
  },
  {
    id: "mobile-banking",
    name: "Mobile Banking",
    category: "channels",
    description: "Retail mobile banking app for account holders.",
    icon: Smartphone,
    status: "stub",
    defaultEnabled: true,
    route: "/platform/mobile-banking",
  },
  {
    id: "internet-banking",
    name: "Internet Banking",
    category: "channels",
    description: "Web banking portal for retail and SME customers.",
    icon: Globe,
    status: "stub",
    route: "/platform/internet-banking",
  },
  {
    id: "smart-branch",
    name: "Smart Branch Banking",
    category: "channels",
    description: "Teller, CSO and branch supervisor workbench.",
    icon: Building2,
    status: "stub",
    route: "/platform/smart-branch",
  },
  {
    id: "agency-banking",
    name: "Agency Banking",
    category: "channels",
    description: "Agent and merchant POS / cash-in-out platform.",
    icon: Store,
    status: "stub",
    route: "/platform/agency-banking",
  },
  {
    id: "reconciliation",
    name: "Reconciliation",
    category: "operations",
    description: "Inter-system, switch and settlement reconciliation.",
    icon: Scale,
    status: "stub",
    route: "/platform/reconciliation",
  },
  {
    id: "general-ledger",
    name: "General Ledger",
    category: "operations",
    description: "Chart of accounts, postings, journal voucher engine.",
    icon: BookOpen,
    status: "planned",
    route: "/platform/general-ledger",
  },
  {
    id: "card-management",
    name: "Card Management",
    category: "channels",
    description: "Issue, manage and tokenize debit/credit cards.",
    icon: CreditCard,
    status: "planned",
    route: "/platform/card-management",
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
  },
  {
    id: "analytics-bi",
    name: "Analytics & BI",
    category: "analytics",
    description: "Executive dashboards and operational analytics.",
    icon: LineChart,
    status: "planned",
    route: "/platform/analytics-bi",
  },
  {
    id: "switch-integration",
    name: "Switch Integration",
    category: "operations",
    description: "EthSwitch, Telebirr, M-Pesa, CBE Birr interop.",
    icon: Network,
    status: "stub",
    route: "/platform/switch-integration",
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
