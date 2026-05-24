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
};

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
