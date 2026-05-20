import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { STEPS, TOTAL_STEPS } from "@/lib/wizard-config";
import { ABX_THEMES, shiftHueHex, type AbxTheme, type ThemeId } from "@/lib/abx-themes";

const STORAGE_KEY = "abx.wizard.v1";

export type Persona = {
  id: string;
  name: string;
  description: string;
  ageRange: string;
  incomeProfile: string;
  digitalLiteracy: "low" | "medium" | "high";
  channels: string[];
  goals: string;
};

export type Product = {
  id: string;
  type: string;
  name: string;
  tagline: string;
  description: string;
};

export type Branch = {
  id: string;
  name: string;
  address: string;
  hours: string;
  services: string[];
};

export type BankConfig = {
  themeId: ThemeId;
  accentShift: number; // -20..+20 deg hue rotation applied to theme primary
  bank: {
    name: string;
    shortName: string;
    tagline: string;
    country: string;
    currency: string;
    timezone: string;
    regulatorName: string;
    licenseNumber: string;
    primaryLanguage: string;
    supportedLanguages: string[];
    logoLabel: string;
  };
  brand: {
    primaryColor: string;
    secondaryColor: string;
    surfaceColor: string;
    backgroundColor: string;
    textPrimary: string;
    textSecondary: string;
    successColor: string;
    warningColor: string;
    errorColor: string;
    fontHeading: string;
    fontBody: string;
    borderRadius: "none" | "soft" | "rounded" | "pill";
    shadowStyle: "flat" | "soft" | "elevated" | "dramatic";
  };
  ux: {
    navigationStyle: "bottom-tabs" | "side-drawer" | "floating-hub" | "ai-first";
    homeScreenLayout: "balance-hero" | "card-grid" | "feed" | "agent-chat";
    primaryInteractionMode: "tap" | "voice" | "conversation" | "gesture";
    voiceInputEnabled: boolean;
    offlineModeEnabled: boolean;
    biometricAuthEnabled: boolean;
    animationLevel: "minimal" | "balanced" | "expressive";
    density: "compact" | "comfortable" | "spacious";
    cardStyle: "flat" | "elevated" | "outlined" | "glass";
    iconLibrary: "lucide" | "phosphor" | "tabler" | "custom";
    dateFormat: string;
    numberFormat: string;
    rtlSupport: boolean;
    accessibilityLevel: "AA" | "AAA";
    darkModeSupport: boolean;
    transactionConfirmStyle: "simple-modal" | "detailed-summary" | "conversational-confirm";
  };
  personas: Persona[];
  personaRules: string;
  onboarding: {
    kycMethod: "video-kyc" | "voice-kyc" | "fayda-id" | "in-branch" | "agent-assisted";
    idDocumentTypes: string[];
    livenessCheckEnabled: boolean;
    selfieRequired: boolean;
    proofOfAddressRequired: boolean;
    accountOpeningMode: "instant" | "review" | "tiered";
    phoneVerificationMethod: "otp-sms" | "otp-voice" | "missed-call";
    languageSelectionStep: boolean;
    voiceOnboardingEnabled: boolean;
    ussdFallbackEnabled: boolean;
    welcomeScreenType: "static" | "video" | "ai-personalised";
    stepSequence: string[];
  };
  ai: {
    conversationMemoryDepth: number;
    intentConfidenceThreshold: number;
    maxTurnsBeforeEscalation: number;
    proactiveMessagingEnabled: boolean;
    tone: "warm" | "direct" | "joyful" | "formal";
    agents: Record<string, { enabled: boolean; tone: string; systemPrompt: string }>;
  };
  products: Product[];
  branch: {
    enabled: boolean;
    staffRoles: string[];
    supervisorThreshold: string;
    services: string[];
    branches: Branch[];
  };
  process: {
    reconciliationFreq: "realtime" | "hourly" | "daily" | "weekly";
    matchingRule: string;
    amlEnabled: boolean;
    amlRuleSet: string;
    ctrThreshold: string;
    sarWorkflow: string;
    kycRefreshMonths: number;
    sanctionsLists: string[];
    customWorkflows: string[];
  };
  ethiopia: {
    fayda: { endpoint: string; apiKey: string; matchThreshold: number; tested: boolean };
    ethSwitch: { participantCode: string; telebirr: boolean; mpesa: boolean; cbeBirr: boolean; settlementAccount: string };
    calendarMode: "ethiopic" | "gregorian" | "dual";
    fiscalYearStart: string;
    eQubEnabled: boolean;
    nbeReports: { id: string; name: string; enabled: boolean; schedule: string }[];
  };
};

export const defaultBankConfig: BankConfig = {
  bank: {
    name: "GlobalPay Bank",
    shortName: "GlobalPay",
    tagline: "Your Trust. Your Wallet.",
    country: "ET",
    currency: "ETB",
    timezone: "Africa/Addis_Ababa",
    regulatorName: "National Bank of Ethiopia",
    licenseNumber: "NBE/BNK/—",
    primaryLanguage: "Amharic",
    supportedLanguages: ["Amharic", "English", "Afaan Oromo"],
    logoLabel: "GP",
  },
  brand: {
    primaryColor: "#0B1538",
    secondaryColor: "#2DD4BF",
    surfaceColor: "#FFFFFF",
    backgroundColor: "#F7F4ED",
    textPrimary: "#0B1538",
    textSecondary: "#6B7280",
    successColor: "#10B981",
    warningColor: "#F59E0B",
    errorColor: "#EF4444",
    fontHeading: "Cormorant Garamond",
    fontBody: "Inter",
    borderRadius: "rounded",
    shadowStyle: "soft",
  },
  ux: {
    navigationStyle: "bottom-tabs",
    homeScreenLayout: "balance-hero",
    primaryInteractionMode: "conversation",
    voiceInputEnabled: true,
    offlineModeEnabled: true,
    biometricAuthEnabled: true,
    animationLevel: "balanced",
    density: "comfortable",
    cardStyle: "elevated",
    iconLibrary: "lucide",
    dateFormat: "DD MMM YYYY",
    numberFormat: "1,234.56",
    rtlSupport: false,
    accessibilityLevel: "AA",
    darkModeSupport: true,
    transactionConfirmStyle: "conversational-confirm",
  },
  personas: [
    { id: "p1", name: "Selam — The Urban Hustler", description: "Addis gig worker, 2 phones, sends money weekly to family.", ageRange: "20–28", incomeProfile: "Variable / informal", digitalLiteracy: "high", channels: ["Mobile App", "Telegram", "USSD"], goals: "Instant transfers, micro-savings, referrals." },
    { id: "p2", name: "Bekele — The Market Trader", description: "Mercato wholesaler, cash-heavy, needs working capital.", ageRange: "32–48", incomeProfile: "High cash flow, irregular", digitalLiteracy: "medium", channels: ["Agent Tablet", "USSD"], goals: "Micro-loans, supplier payments, cash safety." },
  ],
  personaRules: "IF income.type = 'salary' AND age < 35 THEN persona = 'Rising Professional'",
  onboarding: {
    kycMethod: "voice-kyc",
    idDocumentTypes: ["Fayda ID", "Passport", "Driver Licence"],
    livenessCheckEnabled: true,
    selfieRequired: true,
    proofOfAddressRequired: false,
    accountOpeningMode: "instant",
    phoneVerificationMethod: "otp-sms",
    languageSelectionStep: true,
    voiceOnboardingEnabled: true,
    ussdFallbackEnabled: true,
    welcomeScreenType: "ai-personalised",
    stepSequence: ["Language", "Phone OTP", "Voice KYC", "ID Capture", "Liveness", "Account Created"],
  },
  ai: {
    conversationMemoryDepth: 12,
    intentConfidenceThreshold: 0.72,
    maxTurnsBeforeEscalation: 4,
    proactiveMessagingEnabled: true,
    tone: "warm",
    agents: {
      "Concierge":    { enabled: true,  tone: "warm",    systemPrompt: "You are the customer's brilliant banking friend. Be warm, direct, never use jargon." },
      "Onboarding":   { enabled: true,  tone: "patient", systemPrompt: "Guide the customer through KYC in their language. Celebrate every step." },
      "Transactions": { enabled: true,  tone: "precise", systemPrompt: "Confirm every action. Read amounts back. Detect fraud signals." },
      "Savings Coach":{ enabled: true,  tone: "joyful",  systemPrompt: "Surface savings opportunities. Celebrate milestones." },
      "Credit Advisor":{ enabled: true, tone: "honest",  systemPrompt: "Explain credit decisions plainly. Recommend the right product." },
      "Insurance":    { enabled: false, tone: "calm",    systemPrompt: "" },
      "Investments":  { enabled: false, tone: "expert",  systemPrompt: "" },
      "Remittance":   { enabled: true,  tone: "trust",   systemPrompt: "Make FX transparent. Show savings versus alternatives." },
      "Complaints":   { enabled: true,  tone: "empathic",systemPrompt: "Listen first. Resolve fast. Escalate at frustration signals." },
      "Compliance":   { enabled: true,  tone: "formal",  systemPrompt: "Handle CTR, SAR, KYC refresh. Never leak PII." },
      "Branch Assist":{ enabled: true,  tone: "helpful", systemPrompt: "Brief staff. Prefill forms. Suggest next-best action." },
      "Insights":     { enabled: true,  tone: "narrative",systemPrompt: "Weekly Money Story. Personal. Never preachy." },
    },
  },
  products: [
    { id: "pr1", type: "Savings Account", name: "Selam Save",   tagline: "Goals that grow with you.",       description: "Goal-based savings with weekly nudges." },
    { id: "pr2", type: "Micro-Loan",      name: "Mercato Cash", tagline: "Working capital in 60 seconds.",  description: "Pre-approved micro-loans at payday." },
    { id: "pr3", type: "Remittance",      name: "Habesha Home", tagline: "Family money. Fairer FX.",        description: "Diaspora transfers with transparent rates." },
  ],
  branch: {
    enabled: true,
    staffRoles: ["Teller", "Customer Service Officer", "Branch Supervisor", "Manager"],
    supervisorThreshold: "ETB 250,000",
    services: ["New Customer Onboarding", "Cash Deposit", "Loan Origination", "Account Maintenance"],
    branches: [
      { id: "b1", name: "Bole HQ",        address: "Bole Sub-City, Addis Ababa",   hours: "Mon–Fri 08:30–16:30", services: ["All"] },
      { id: "b2", name: "Mercato Branch", address: "Mercato District, Addis Ababa", hours: "Mon–Sat 08:00–17:00", services: ["Cash", "Onboarding"] },
    ],
  },
  process: {
    reconciliationFreq: "hourly",
    matchingRule: "match-by-reference-and-amount",
    amlEnabled: true,
    amlRuleSet: "FATF + NBE Directive SBB/74/2020",
    ctrThreshold: "ETB 200,000",
    sarWorkflow: "auto-draft-review-submit",
    kycRefreshMonths: 36,
    sanctionsLists: ["UN", "OFAC", "EU", "NBE Domestic"],
    customWorkflows: ["Loan Origination", "Dispute Resolution"],
  },
  ethiopia: {
    fayda: { endpoint: "https://api.fayda.et/v1/verify", apiKey: "", matchThreshold: 0.92, tested: false },
    ethSwitch: { participantCode: "ETSW-GP-001", telebirr: true, mpesa: true, cbeBirr: true, settlementAccount: "0100-GP-NBE" },
    calendarMode: "dual",
    fiscalYearStart: "Hamle 1 (8 July)",
    eQubEnabled: true,
    nbeReports: [
      { id: "r1", name: "Daily Liquidity Position",  enabled: true, schedule: "Daily 18:00" },
      { id: "r2", name: "Weekly FX Exposure",        enabled: true, schedule: "Friday 17:00" },
      { id: "r3", name: "Monthly CAR & NPL",         enabled: true, schedule: "1st of month" },
      { id: "r4", name: "Quarterly AML Summary",     enabled: true, schedule: "Quarter end + 5d" },
      { id: "r5", name: "Annual Stress Test",        enabled: true, schedule: "Sene 30" },
    ],
  },
};

/* ---------- Color helpers (hex → HSL string) ---------- */
function hexToHslString(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 3 && h.length !== 6) return "0 0% 50%";
  const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hue = 0, sat = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hue = (b - r) / d + 2; break;
      case b: hue = (r - g) / d + 4; break;
    }
    hue /= 6;
  }
  return `${Math.round(hue * 360)} ${Math.round(sat * 100)}% ${Math.round(l * 100)}%`;
}

function ensureGoogleFont(family: string) {
  if (typeof document === "undefined" || !family) return;
  const id = `gf-${family.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@300;400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
}

function ensureBrandFontStyle() {
  if (typeof document === "undefined") return;
  if (document.getElementById("abx-brand-fonts")) return;
  const s = document.createElement("style");
  s.id = "abx-brand-fonts";
  s.textContent = `
    body { font-family: var(--brand-font-body, 'Plus Jakarta Sans'), system-ui, sans-serif; }
    body h1, body h2, body h3, body h4 { font-family: var(--brand-font-heading, 'Sora'), Georgia, serif; }
    .abx-scope, .abx-scope * { font-family: 'Inter', system-ui, sans-serif; }
    .abx-scope .font-display { font-family: 'Cormorant Garamond', Georgia, serif; }
  `;
  document.head.appendChild(s);
}

function applyBrandTokens(cfg: BankConfig) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Brand passthrough vars
  root.style.setProperty("--brand-primary", cfg.brand.primaryColor);
  root.style.setProperty("--brand-secondary", cfg.brand.secondaryColor);
  root.style.setProperty("--brand-surface", cfg.brand.surfaceColor);
  root.style.setProperty("--brand-background", cfg.brand.backgroundColor);
  root.style.setProperty("--brand-text", cfg.brand.textPrimary);
  root.style.setProperty("--brand-text-soft", cfg.brand.textSecondary);
  root.style.setProperty("--brand-success", cfg.brand.successColor);
  root.style.setProperty("--brand-warning", cfg.brand.warningColor);
  root.style.setProperty("--brand-error", cfg.brand.errorColor);
  root.style.setProperty("--brand-font-heading", `'${cfg.brand.fontHeading}'`);
  root.style.setProperty("--brand-font-body", `'${cfg.brand.fontBody}'`);
  const radiusMap = { none: "0px", soft: "8px", rounded: "16px", pill: "24px" } as const;
  root.style.setProperty("--brand-radius", radiusMap[cfg.brand.borderRadius]);

  // ── Override semantic Tailwind tokens (HSL) so wallet repaints live ──
  const primaryHsl    = hexToHslString(cfg.brand.primaryColor);
  const secondaryHsl  = hexToHslString(cfg.brand.secondaryColor);
  const surfaceHsl    = hexToHslString(cfg.brand.surfaceColor);
  const backgroundHsl = hexToHslString(cfg.brand.backgroundColor);
  const textHsl       = hexToHslString(cfg.brand.textPrimary);
  const textSoftHsl   = hexToHslString(cfg.brand.textSecondary);

  root.style.setProperty("--primary", primaryHsl);
  root.style.setProperty("--primary-foreground", surfaceHsl);
  root.style.setProperty("--secondary", secondaryHsl);
  root.style.setProperty("--secondary-foreground", surfaceHsl);
  root.style.setProperty("--accent", secondaryHsl);
  root.style.setProperty("--accent-foreground", surfaceHsl);
  root.style.setProperty("--background", backgroundHsl);
  root.style.setProperty("--foreground", textHsl);
  root.style.setProperty("--card", surfaceHsl);
  root.style.setProperty("--card-foreground", textHsl);
  root.style.setProperty("--popover", surfaceHsl);
  root.style.setProperty("--popover-foreground", textHsl);
  root.style.setProperty("--muted-foreground", textSoftHsl);
  root.style.setProperty("--ring", primaryHsl);

  // Legacy GlobalPay tokens (drive .text-gold, .gradient-green, .gradient-gold, etc.)
  root.style.setProperty("--tesfa-gold", primaryHsl);
  root.style.setProperty("--tesfa-gold-light", primaryHsl);
  root.style.setProperty("--tesfa-green", secondaryHsl);
  root.style.setProperty("--tesfa-green-mid", secondaryHsl);
  root.style.setProperty("--tesfa-green-light", secondaryHsl);
  root.style.setProperty("--tesfa-teal", secondaryHsl);
  root.style.setProperty("--tesfa-teal-light", secondaryHsl);
  root.style.setProperty("--tesfa-dark", textHsl);
  root.style.setProperty("--tesfa-dark-mid", textHsl);
  root.style.setProperty("--tesfa-dark-card", surfaceHsl);

  // Fonts
  ensureGoogleFont(cfg.brand.fontHeading);
  ensureGoogleFont(cfg.brand.fontBody);
  ensureBrandFontStyle();
}

/* ---------- Context ---------- */
type Ctx = {
  config: BankConfig;
  update: <K extends keyof BankConfig>(k: K, v: Partial<BankConfig[K]>) => void;
  setConfig: (c: BankConfig) => void;
  stepIdx: number;
  goTo: (i: number) => void;
  next: () => void;
  prev: () => void;
  completed: Set<number>;
  markComplete: (i: number) => void;
  progress: number;
  published: boolean;
  publish: () => void;
  reset: () => void;
};

const WizardCtx = createContext<Ctx | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<BankConfig>(defaultBankConfig);
  const [stepIdx, setStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [published, setPublished] = useState(false);
  const hydrated = useRef(false);

  // Hydrate
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.config) setConfig({ ...defaultBankConfig, ...parsed.config });
        if (typeof parsed.stepIdx === "number") setStep(Math.max(0, Math.min(TOTAL_STEPS - 1, parsed.stepIdx)));
        if (Array.isArray(parsed.completed)) setCompleted(new Set(parsed.completed));
        if (parsed.published) setPublished(true);
      }
    } catch { /* ignore */ }
    hydrated.current = true;
  }, []);

  // Apply CSS tokens whenever config changes
  useEffect(() => { applyBrandTokens(config); }, [config]);

  // Persist
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ config, stepIdx, completed: Array.from(completed), published }),
      );
    } catch { /* ignore */ }
  }, [config, stepIdx, completed, published]);

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed.config) setConfig({ ...defaultBankConfig, ...parsed.config });
        if (typeof parsed.stepIdx === "number") setStep(parsed.stepIdx);
        if (Array.isArray(parsed.completed)) setCompleted(new Set(parsed.completed));
        if (typeof parsed.published === "boolean") setPublished(parsed.published);
      } catch { /* ignore */ }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value: Ctx = useMemo(() => ({
    config,
    setConfig,
    update: (k, v) => setConfig((c) => ({
      ...c,
      [k]: Array.isArray(v) ? v : { ...(c[k] as object), ...(v as object) },
    } as BankConfig)),
    stepIdx,
    goTo: (i) => setStep(Math.max(0, Math.min(TOTAL_STEPS - 1, i))),
    next: () => setStep((s) => {
      setCompleted((c) => new Set(c).add(s));
      return Math.min(TOTAL_STEPS - 1, s + 1);
    }),
    prev: () => setStep((s) => Math.max(0, s - 1)),
    completed,
    markComplete: (i) => setCompleted((c) => new Set(c).add(i)),
    progress: Math.round(((stepIdx + 1) / TOTAL_STEPS) * 100),
    published,
    publish: () => setPublished(true),
    reset: () => {
      setConfig(defaultBankConfig); setStep(0); setCompleted(new Set()); setPublished(false);
    },
  }), [config, stepIdx, completed, published]);

  return <WizardCtx.Provider value={value}>{children}</WizardCtx.Provider>;
}

export function useWizard() {
  const ctx = useContext(WizardCtx);
  if (!ctx) throw new Error("useWizard must be inside WizardProvider");
  return ctx;
}

export function useBankConfig() {
  return useWizard().config;
}

export function useStep() {
  const { stepIdx } = useWizard();
  return STEPS[stepIdx];
}
