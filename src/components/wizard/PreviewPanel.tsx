import { useWizard } from "@/contexts/BankConfigContext";
import { Smartphone, Wifi, BatteryFull, Signal, X, Check, MapPin, Shield, Sparkles } from "lucide-react";
import { Diamond } from "./AbxLogo";
import { STEPS } from "@/lib/wizard-config";
import type { ReactNode } from "react";

export function PreviewPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { config, stepIdx } = useWizard();
  const { brand, bank } = config;
  const radiusMap = { none: "0px", soft: "8px", rounded: "16px", pill: "24px" } as const;
  const radius = radiusMap[brand.borderRadius];
  const step = STEPS[stepIdx];
  const mod = step.module;

  const screen = pickScreen(mod);
  const screenLabel = screenLabelFor(mod);

  return (
    <>
      {open && (
        <div className="xl:hidden fixed inset-0 bg-black/40 z-40" onClick={onClose} aria-hidden />
      )}
      <div
        className={`flex flex-col w-[420px] shrink-0 border-l border-[var(--line)] bg-[var(--ivory)] h-screen
          xl:sticky xl:top-0 xl:flex
          ${open ? "fixed right-0 top-0 z-50 shadow-2xl" : "hidden xl:flex"}`}
      >
        <div className="px-6 py-5 border-b border-[var(--line)] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--ink-soft)]">Live Preview · {screenLabel}</div>
            <div className="font-serif text-lg mt-0.5">{bank.shortName || "Bank"} Mobile</div>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[var(--ink-soft)]" />
            <button onClick={onClose} className="xl:hidden p-1 rounded hover:bg-black/5" aria-label="Close preview">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex items-start justify-center">
          <div className="relative w-[280px] h-[580px] rounded-[40px] p-2 shadow-ink" style={{ backgroundColor: brand.primaryColor }}>
            <div className="w-full h-full rounded-[34px] overflow-hidden relative flex flex-col"
              style={{ backgroundColor: brand.backgroundColor, color: brand.textPrimary }}>
              <div className="flex items-center justify-between px-5 pt-3 pb-2 text-[10px]" style={{ color: brand.textPrimary }}>
                <span className="font-semibold">9:41</span>
                <div className="flex items-center gap-1 opacity-70">
                  <Signal className="w-3 h-3" /><Wifi className="w-3 h-3" /><BatteryFull className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="px-5 pt-2 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-7 h-7 grid place-items-center font-serif font-bold text-sm"
                    style={{ backgroundColor: brand.primaryColor, color: brand.surfaceColor, borderRadius: radius }}>
                    {bank.logoLabel || bank.shortName?.slice(0, 2).toUpperCase() || "AB"}
                  </span>
                  <span className="font-serif font-bold text-base">{bank.shortName || "Bank"}</span>
                </div>
                <span className="w-7 h-7 rounded-full grid place-items-center text-[10px]"
                  style={{ backgroundColor: brand.secondaryColor + "33", color: brand.primaryColor }}>S</span>
              </div>

              <div className="flex-1 overflow-hidden">{screen({ config, radius })}</div>

              <div className="mx-4 mb-3 mt-2 flex items-center justify-around py-2"
                style={{ backgroundColor: brand.surfaceColor, borderRadius: 999 }}>
                {["Home", "Pay", "AI", "Cards", "Me"].map((n) => {
                  const active = navActiveFor(mod) === n;
                  return (
                    <span key={n} className="text-[9px]"
                      style={{ color: active ? brand.primaryColor : brand.textSecondary, fontWeight: active ? 600 : 400 }}>
                      {n}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--line)] text-[10px] text-[var(--ink-soft)] flex items-center justify-between">
          <span>BankConfig → live render</span>
          <span className="font-mono">{step.id} · {mod}</span>
        </div>
      </div>
    </>
  );
}

function navActiveFor(mod: string) {
  if (mod === "M3") return "Cards";                // Products
  if (mod === "MESH" || mod === "M4") return "AI"; // AI Mesh / AI Concierge
  if (mod === "M5" || mod === "M6") return "Me";   // Onboarding / Compliance
  return "Home";
}

function screenLabelFor(mod: string) {
  switch (mod) {
    case "M1": return "Identity";
    case "M2": return "Theme";
    case "M3": return "Products";
    case "M4": return "AI Concierge";
    case "MESH": return "AI Mesh";
    case "M5": return "Onboarding";
    case "M6": return "Compliance";
    case "review": return "Go Live";
    default: return "Home";
  }
}

type ScreenProps = { config: ReturnType<typeof useWizard>["config"]; radius: string };
type Screen = (p: ScreenProps) => ReactNode;

function pickScreen(mod: string): Screen {
  switch (mod) {
    case "M3": return ProductsScreen;
    case "M4": return AiConciergeScreen;
    case "MESH": return AiMeshScreen;
    case "M5": return OnboardingScreen;
    case "M6": return EthiopiaScreen;
    case "review": return GoLiveScreen;
    default: return HomeScreen;
  }
}

const AiConciergeScreen: Screen = (p) => AiMeshScreen(p);

const HomeScreen: Screen = ({ config, radius }) => {
  const { brand, bank, ux } = config;
  return (
    <div className="h-full flex flex-col">
      <div className="mx-4 mt-1 p-4 text-white" style={{ backgroundColor: brand.primaryColor, borderRadius: radius }}>
        <div className="text-[9px] uppercase tracking-widest opacity-60">Total balance</div>
        <div className="mt-1 font-serif text-[26px] leading-none">{bank.currency || "ETB"} 248,930</div>
        <div className="mt-3 flex items-center gap-2">
          <Diamond className="w-3 h-3" />
          <span className="text-[10px] opacity-80 italic font-serif">{bank.tagline || "Banking that finally gets you."}</span>
        </div>
      </div>
      {ux.primaryInteractionMode === "conversation" && (
        <div className="mx-4 mt-3 p-3 text-[11px] leading-snug"
          style={{ backgroundColor: brand.secondaryColor + "22", color: brand.textPrimary, borderRadius: radius, borderLeft: `3px solid ${brand.secondaryColor}` }}>
          <div className="flex items-center gap-1.5 mb-1 font-medium" style={{ color: brand.secondaryColor }}>
            <Diamond className="w-2.5 h-2.5" /> Concierge
          </div>
          Your salary just landed. Want to save 500 {bank.currency} toward your Lalibela trip?
        </div>
      )}
      <div className="px-4 mt-4 grid grid-cols-4 gap-2">
        {["Send", "Pay", "Loan", "More"].map((a) => (
          <div key={a} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 grid place-items-center text-[10px] font-medium"
              style={{ backgroundColor: brand.surfaceColor, borderRadius: radius,
                boxShadow: brand.shadowStyle === "flat" ? "none" : "0 4px 14px -8px rgba(0,0,0,0.2)" }}>
              {a[0]}
            </div>
            <span className="text-[9px]" style={{ color: brand.textSecondary }}>{a}</span>
          </div>
        ))}
      </div>
      <div className="px-4 mt-4 flex-1 overflow-hidden">
        <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: brand.textSecondary }}>Recent</div>
        {[
          { n: "Bekele Tessema",  d: "Mercato supplier", a: "−1,200" },
          { n: "Salary · MoH",    d: "Black Lion Hosp.", a: "+28,500" },
          { n: "Telebirr Top-up", d: "Airtime",          a: "−150" },
        ].map((t) => (
          <div key={t.n} className="flex items-center justify-between py-2 text-[11px] border-b border-black/5">
            <div>
              <div className="font-medium">{t.n}</div>
              <div className="text-[9px]" style={{ color: brand.textSecondary }}>{t.d}</div>
            </div>
            <div className="font-mono" style={{ color: t.a.startsWith("+") ? brand.successColor : brand.textPrimary }}>{t.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PersonaScreen: Screen = ({ config, radius }) => {
  const { brand, personas } = config;
  return (
    <div className="px-4 pt-1 h-full overflow-hidden">
      <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: brand.textSecondary }}>Personalised for you</div>
      <div className="space-y-2">
        {personas.slice(0, 4).map((p, i) => (
          <div key={p.id} className="p-3" style={{ backgroundColor: brand.surfaceColor, borderRadius: radius,
            boxShadow: brand.shadowStyle === "flat" ? "none" : "0 4px 14px -8px rgba(0,0,0,0.2)" }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 grid place-items-center text-[10px] font-semibold"
                style={{ backgroundColor: i === 0 ? brand.secondaryColor : brand.primaryColor,
                  color: brand.surfaceColor, borderRadius: radius }}>
                {p.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium truncate">{p.name || "Untitled persona"}</div>
                <div className="text-[9px] truncate" style={{ color: brand.textSecondary }}>
                  {p.ageRange || "—"} · {p.digitalLiteracy} literacy
                </div>
              </div>
            </div>
            <div className="text-[10px] mt-2 leading-snug" style={{ color: brand.textPrimary }}>
              {p.description || "No description yet."}
            </div>
            <div className="text-[9px] mt-1.5 italic" style={{ color: brand.textSecondary }}>
              Goals · {p.goals || "—"}
            </div>
          </div>
        ))}
        {personas.length === 0 && (
          <div className="text-[10px] italic" style={{ color: brand.textSecondary }}>
            No personas defined yet. Add one to see a live card here.
          </div>
        )}
      </div>
    </div>
  );
};

const OnboardingScreen: Screen = ({ config, radius }) => {
  const { brand, onboarding, bank } = config;
  return (
    <div className="px-4 pt-1 h-full overflow-hidden">
      <div className="font-serif text-[18px] leading-tight">Welcome to {bank.shortName}.</div>
      <div className="text-[10px] mt-1" style={{ color: brand.textSecondary }}>
        {onboarding.welcomeScreenType === "ai-personalised" ? "AI-personalised intro" :
         onboarding.welcomeScreenType === "video" ? "Video welcome" : "Static welcome"}
        {" · "}{onboarding.kycMethod}
      </div>
      <div className="mt-3 space-y-1.5">
        {onboarding.stepSequence.map((s, i) => (
          <div key={`${s}-${i}`} className="flex items-center gap-2 p-2 text-[11px]"
            style={{ backgroundColor: brand.surfaceColor, borderRadius: radius }}>
            <div className="w-5 h-5 grid place-items-center text-[9px] font-semibold"
              style={{ backgroundColor: i === 0 ? brand.secondaryColor : brand.backgroundColor,
                color: i === 0 ? brand.surfaceColor : brand.textSecondary, borderRadius: 999 }}>
              {i + 1}
            </div>
            <span className="flex-1">{s}</span>
            {i === 0 && <Check className="w-3 h-3" style={{ color: brand.successColor }} />}
          </div>
        ))}
      </div>
      <div className="mt-3 text-[9px] flex flex-wrap gap-1">
        {onboarding.voiceOnboardingEnabled && <Tag>Voice</Tag>}
        {onboarding.ussdFallbackEnabled && <Tag>USSD</Tag>}
        {onboarding.livenessCheckEnabled && <Tag>Liveness</Tag>}
        {onboarding.selfieRequired && <Tag>Selfie</Tag>}
      </div>
    </div>
  );
};

const AiMeshScreen: Screen = ({ config, radius }) => {
  const { brand, ai } = config;
  const active = Object.entries(ai.agents).filter(([, a]) => a.enabled);
  return (
    <div className="px-4 pt-1 h-full overflow-hidden">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-3 h-3" style={{ color: brand.secondaryColor }} />
        <span className="text-[10px] uppercase tracking-widest" style={{ color: brand.textSecondary }}>
          {active.length} agents online
        </span>
      </div>
      <div className="p-3 text-[11px] leading-snug"
        style={{ backgroundColor: brand.secondaryColor + "22", color: brand.textPrimary, borderRadius: radius, borderLeft: `3px solid ${brand.secondaryColor}` }}>
        <div className="font-medium mb-1" style={{ color: brand.secondaryColor }}>Concierge · {ai.tone}</div>
        Hello — I'm tuned to {ai.tone}, with memory of {ai.conversationMemoryDepth} turns.
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {active.slice(0, 8).map(([name, a]) => (
          <div key={name} className="p-2" style={{ backgroundColor: brand.surfaceColor, borderRadius: radius }}>
            <div className="text-[10px] font-medium truncate">{name}</div>
            <div className="text-[9px]" style={{ color: brand.textSecondary }}>{a.tone}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductsScreen: Screen = ({ config, radius }) => {
  const { brand, products, bank } = config;
  return (
    <div className="px-4 pt-1 h-full overflow-hidden">
      <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: brand.textSecondary }}>
        {products.length} products live
      </div>
      <div className="space-y-2">
        {products.slice(0, 5).map((p) => (
          <div key={p.id} className="p-3" style={{ backgroundColor: brand.surfaceColor, borderRadius: radius,
            boxShadow: brand.shadowStyle === "flat" ? "none" : "0 4px 14px -8px rgba(0,0,0,0.2)" }}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[9px] uppercase tracking-wider" style={{ color: brand.secondaryColor }}>{p.type}</div>
                <div className="font-serif text-[14px] leading-tight truncate">{p.name || "Untitled"}</div>
                <div className="text-[10px] italic mt-0.5" style={{ color: brand.textSecondary }}>{p.tagline}</div>
              </div>
              <div className="text-[9px] font-mono px-1.5 py-0.5"
                style={{ backgroundColor: brand.backgroundColor, color: brand.textSecondary, borderRadius: 999 }}>
                {bank.currency}
              </div>
            </div>
            <div className="text-[10px] mt-1.5 leading-snug">{p.description}</div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="text-[10px] italic" style={{ color: brand.textSecondary }}>
            Add a product to see it surface in the app.
          </div>
        )}
      </div>
    </div>
  );
};

const BranchScreen: Screen = ({ config, radius }) => {
  const { brand, branch } = config;
  return (
    <div className="px-4 pt-1 h-full overflow-hidden">
      <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: brand.textSecondary }}>
        Nearest branches · {branch.branches.length}
      </div>
      <div className="space-y-2">
        {branch.branches.slice(0, 4).map((b) => (
          <div key={b.id} className="p-3 flex gap-2" style={{ backgroundColor: brand.surfaceColor, borderRadius: radius }}>
            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: brand.secondaryColor }} />
            <div className="min-w-0">
              <div className="text-[11px] font-medium truncate">{b.name}</div>
              <div className="text-[9px] truncate" style={{ color: brand.textSecondary }}>{b.address}</div>
              <div className="text-[9px] mt-1" style={{ color: brand.textSecondary }}>{b.hours}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-[9px]" style={{ color: brand.textSecondary }}>
        Staff roles: {branch.staffRoles.join(" · ")}
      </div>
    </div>
  );
};

const ProcessScreen: Screen = ({ config, radius }) => {
  const { brand, process: proc } = config;
  return (
    <div className="px-4 pt-1 h-full overflow-hidden">
      <div className="flex items-center gap-1.5 mb-2">
        <Shield className="w-3 h-3" style={{ color: brand.secondaryColor }} />
        <span className="text-[10px] uppercase tracking-widest" style={{ color: brand.textSecondary }}>Compliance posture</span>
      </div>
      <Row k="Reconciliation" v={proc.reconciliationFreq} brand={brand} radius={radius} />
      <Row k="AML" v={proc.amlEnabled ? "Enabled" : "Disabled"} brand={brand} radius={radius} />
      <Row k="CTR threshold" v={proc.ctrThreshold} brand={brand} radius={radius} />
      <Row k="KYC refresh" v={`${proc.kycRefreshMonths} months`} brand={brand} radius={radius} />
      <div className="mt-2 text-[9px] flex flex-wrap gap-1">
        {proc.sanctionsLists.map((l) => <Tag key={l}>{l}</Tag>)}
      </div>
      <div className="mt-3 p-2 text-[10px]" style={{ backgroundColor: brand.surfaceColor, borderRadius: radius }}>
        <div className="text-[9px] uppercase tracking-wider" style={{ color: brand.textSecondary }}>Rule</div>
        <div className="font-mono leading-snug mt-0.5">{proc.matchingRule}</div>
      </div>
    </div>
  );
};

const EthiopiaScreen: Screen = ({ config, radius }) => {
  const { brand, ethiopia } = config;
  return (
    <div className="px-4 pt-1 h-full overflow-hidden">
      <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: brand.textSecondary }}>Ethiopia rails</div>
      <div className="p-3" style={{ backgroundColor: brand.surfaceColor, borderRadius: radius }}>
        <div className="text-[10px] font-medium">Fayda ID</div>
        <div className="text-[9px] mt-0.5" style={{ color: ethiopia.fayda.tested ? brand.successColor : brand.warningColor }}>
          {ethiopia.fayda.tested ? "Connected" : "Not tested"} · threshold {ethiopia.fayda.matchThreshold}
        </div>
      </div>
      <div className="mt-2 p-3" style={{ backgroundColor: brand.surfaceColor, borderRadius: radius }}>
        <div className="text-[10px] font-medium">Eth-Switch</div>
        <div className="text-[9px] mt-0.5" style={{ color: brand.textSecondary }}>{ethiopia.ethSwitch.participantCode}</div>
        <div className="mt-1 flex flex-wrap gap-1 text-[9px]">
          {ethiopia.ethSwitch.telebirr && <Tag>telebirr</Tag>}
          {ethiopia.ethSwitch.mpesa && <Tag>M-PESA</Tag>}
          {ethiopia.ethSwitch.cbeBirr && <Tag>CBE Birr</Tag>}
        </div>
      </div>
      <div className="mt-2 text-[9px]" style={{ color: brand.textSecondary }}>
        Calendar: {ethiopia.calendarMode} · FY {ethiopia.fiscalYearStart}
      </div>
      <div className="mt-2 text-[9px]" style={{ color: brand.textSecondary }}>
        NBE reports active: {ethiopia.nbeReports.filter((r) => r.enabled).length}
      </div>
    </div>
  );
};

const GoLiveScreen: Screen = ({ config, radius }) => {
  const { brand, bank } = config;
  return (
    <div className="px-4 pt-1 h-full overflow-hidden flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 grid place-items-center mb-3"
        style={{ backgroundColor: brand.secondaryColor + "33", borderRadius: 999 }}>
        <Sparkles className="w-5 h-5" style={{ color: brand.secondaryColor }} />
      </div>
      <div className="font-serif text-[18px] leading-tight">{bank.shortName} is ready.</div>
      <div className="text-[10px] mt-1 px-4" style={{ color: brand.textSecondary }}>
        Validate your BankConfig and publish a sandbox runtime.
      </div>
      <div className="mt-4 p-2 px-3 text-[10px] font-medium"
        style={{ backgroundColor: brand.primaryColor, color: brand.surfaceColor, borderRadius: radius }}>
        Launch sandbox
      </div>
    </div>
  );
};

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="px-1.5 py-0.5 rounded-full text-[9px]" style={{ backgroundColor: "rgba(0,0,0,0.06)" }}>{children}</span>
  );
}

function Row({ k, v, brand, radius }: { k: string; v: string; brand: { surfaceColor: string; textSecondary: string }; radius: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 text-[10px] mb-1"
      style={{ backgroundColor: brand.surfaceColor, borderRadius: radius }}>
      <span style={{ color: brand.textSecondary }}>{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
