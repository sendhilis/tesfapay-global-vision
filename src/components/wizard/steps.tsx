import { Fragment, useRef, useState, type ReactNode } from "react";
import { useWizard, type BankConfig } from "@/contexts/BankConfigContext";
import { Diamond } from "./AbxLogo";
import { THEME_LIST, ABX_THEMES, type ThemeId } from "@/lib/abx-themes";
import { MODULES } from "@/lib/wizard-config";
import {
  Check, ChevronRight, AlertCircle, Mic, Fingerprint, WifiOff, Eye,
  Upload, MapPin, Plus, X, Sparkles, ShieldCheck, FileCheck, Languages,
  CreditCard, Building2, Workflow, Bot, Palette, Type, LayoutGrid,
  Smartphone, Users, BadgeCheck, GitBranch, ScrollText, Rocket
} from "lucide-react";

export function StepFrame({ eyebrow, title, lede, children, icon }: { eyebrow: string; title: string; lede: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[var(--ink-soft)]">
        {icon ?? <Diamond className="w-3 h-3" />} {eyebrow}
      </div>
      <h1 className="mt-3 font-serif text-4xl md:text-5xl text-balance leading-[1.05]">{title}</h1>
      <p className="mt-3 max-w-xl text-[15px] text-[var(--ink-soft)] leading-relaxed">{lede}</p>
      <div className="mt-8 space-y-6">{children}</div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-[0.18em] font-medium">{label}</span>
        {hint && <span className="text-[10px] text-[var(--ink-soft)]">{hint}</span>}
      </div>
      <div className="mt-2">{children}</div>
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full bg-white px-4 py-3 text-[15px] border border-[var(--line)] rounded-lg outline-none focus:border-[var(--ink)] focus:ring-2 focus:ring-[var(--teal)]/40 transition text-[var(--ink)] ${props.className ?? ""}`} />;
}
export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full bg-white px-4 py-3 text-[14px] border border-[var(--line)] rounded-lg outline-none focus:border-[var(--ink)] focus:ring-2 focus:ring-[var(--teal)]/40 transition font-mono text-[var(--ink)] ${props.className ?? ""}`} />;
}
export function Select({ children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...rest} className={`w-full bg-white px-4 py-3 text-[15px] border border-[var(--line)] rounded-lg outline-none focus:border-[var(--ink)] focus:ring-2 focus:ring-[var(--teal)]/40 transition cursor-pointer text-[var(--ink)] ${rest.className ?? ""}`}>{children}</select>;
}
export function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="w-full flex items-center justify-between gap-4 p-4 bg-white border border-[var(--line)] rounded-lg hover:border-[var(--ink)]/40 transition text-left">
      <div>
        <div className="text-[14px] font-medium">{label}</div>
        {hint && <div className="text-[12px] text-[var(--ink-soft)] mt-0.5">{hint}</div>}
      </div>
      <span className={`relative w-10 h-6 rounded-full transition shrink-0 ${on ? "bg-[var(--ink)]" : "bg-[var(--line)]"}`}>
        <span className={`absolute top-0.5 ${on ? "left-[18px]" : "left-0.5"} w-5 h-5 rounded-full bg-white shadow transition-all`} style={{ backgroundColor: on ? "var(--teal)" : "white" }} />
      </span>
    </button>
  );
}
export function OptionCard({ selected, onClick, title, desc, children }: { selected: boolean; onClick: () => void; title: string; desc?: string; children?: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`relative text-left p-5 rounded-xl border-2 transition-all ${selected ? "border-[var(--ink)] bg-white shadow-soft" : "border-[var(--line)] bg-white/60 hover:border-[var(--ink)]/40"}`}>
      {selected && <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[var(--teal)] grid place-items-center"><Check className="w-3 h-3" strokeWidth={3} /></span>}
      {children && <div className="mb-3">{children}</div>}
      <div className="font-medium text-[14px]">{title}</div>
      {desc && <div className="text-[12px] text-[var(--ink-soft)] mt-1 leading-snug">{desc}</div>}
    </button>
  );
}

function hexToRgb(h: string) { const m = h.replace("#", "").match(/.{2}/g); if (!m) return [0, 0, 0]; return m.map((v) => parseInt(v, 16)); }
function luminance([r, g, b]: number[]) { const a = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; }
export function contrastRatio(a: string, b: string) { const la = luminance(hexToRgb(a)); const lb = luminance(hexToRgb(b)); return ((Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)); }

export function W01_Welcome() {
  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[var(--teal-deep)]">
        <Diamond className="w-3 h-3 diamond-spin" /> Setup Entry · W01
      </div>
      <h1 className="mt-4 font-serif text-5xl md:text-6xl leading-[1.02] text-balance">
        Stand up the next generation of <em className="text-[var(--teal-deep)] not-italic">African banking</em> in one afternoon.
      </h1>
      <p className="mt-5 max-w-2xl text-[16px] text-[var(--ink-soft)] leading-relaxed">
        This is the ABX Setup Wizard. In the next 4–6 hours you will configure every aspect of how your bank
        looks, speaks, onboards, advises and complies. When you finish, ABX auto-generates a fully branded mobile
        and web experience, a 12-agent AI mesh, and your back-office Process AI — all from a single
        <span className="font-mono text-[14px] bg-[var(--ivory)] px-1.5 py-0.5 rounded mx-1">BankConfig</span> file.
      </p>
      <div className="mt-10 grid md:grid-cols-3 gap-4">
        {MODULES.filter((m) => m.id !== "entry" && m.id !== "review").map((mod) => ({
          n: mod.code,
          t: mod.name,
          d: mod.desc,
        })).map((m) => (
          <div key={m.n} className="p-5 bg-white border border-[var(--line)] rounded-xl hover:shadow-soft transition">
            <span className="font-mono text-[10px] tracking-widest text-[var(--teal-deep)]">{m.n}</span>
            <div className="font-serif text-xl mt-1">{m.t}</div>
            <div className="text-[12px] text-[var(--ink-soft)] mt-1">{m.d}</div>
          </div>
        ))}
      </div>
      <div className="mt-10 p-5 bg-[var(--ink)] text-[var(--cream)] rounded-xl flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <ShieldCheck className="w-5 h-5 text-[var(--teal)]" />
          <div>
            <div className="text-[13px] font-medium">Multi-factor authentication active · admin@globalpay.et</div>
            <div className="text-[11px] text-white/55">Session encrypted · region: Africa-East · audit ID 7F2-A91</div>
          </div>
        </div>
        <span className="text-[11px] uppercase tracking-widest text-[var(--teal)]">36 screens · 9 modules</span>
      </div>
    </div>
  );
}

export function W02_BankName() {
  const { config, update } = useWizard();
  return (
    <StepFrame eyebrow="W02 · Identity" title="What is your bank called?" lede="The full legal name appears in regulatory filings and statements. The short name powers the app header and notifications.">
      <Field label="Full Legal Name" hint="bank.name"><TextInput value={config.bank.name} onChange={(e) => update("bank", { name: e.target.value })} placeholder="e.g. Awash International Bank S.C." /></Field>
      <Field label="Short Name (max 20)" hint={`${config.bank.shortName.length}/20`}><TextInput maxLength={20} value={config.bank.shortName} onChange={(e) => update("bank", { shortName: e.target.value })} /></Field>
    </StepFrame>
  );
}

export function W03_Logo() {
  const { config, update } = useWizard();
  const [files, setFiles] = useState<Record<string, string | null>>({ primary: null, square: null });
  const inputs = { primary: useRef<HTMLInputElement>(null), square: useRef<HTMLInputElement>(null) };
  const onPick = (key: "primary" | "square") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setFiles((s) => ({ ...s, [key]: URL.createObjectURL(f) }));
  };
  const defs = [
    { key: "primary" as const, label: "Primary Logo", note: "Used in app header & statements", dark: false },
    { key: "square" as const, label: "Square Logomark", note: "Used on splash, push, favicon", dark: true },
  ];
  return (
    <StepFrame eyebrow="W03 · Identity" title="Upload your logo & logomark." lede="SVG preferred. PNG at 512×512 minimum." icon={<Upload className="w-3 h-3" />}>
      <div className="grid md:grid-cols-2 gap-4">
        {defs.map((d) => (
          <div key={d.key} className="p-6 bg-white border-2 border-dashed border-[var(--line)] rounded-xl hover:border-[var(--ink)]/40 transition text-center">
            <div className="mx-auto w-20 h-20 rounded-2xl grid place-items-center font-serif font-bold text-2xl overflow-hidden" style={{ background: d.dark ? "var(--ink)" : "white", color: d.dark ? "var(--cream)" : "var(--ink)", border: d.dark ? "none" : "1px solid var(--line)" }}>
              {files[d.key] ? <img src={files[d.key]!} alt={d.label} className="w-full h-full object-contain" /> : config.bank.logoLabel}
            </div>
            <div className="mt-4 text-[13px] font-medium">{d.label}</div>
            <div className="text-[11px] text-[var(--ink-soft)] mt-1">{d.note}</div>
            <input ref={inputs[d.key]} type="file" accept="image/*,.svg" className="hidden" onChange={onPick(d.key)} />
            <button onClick={() => inputs[d.key].current?.click()} className="mt-3 text-[12px] text-[var(--teal-deep)] font-medium inline-flex items-center gap-1 hover:underline">
              <Upload className="w-3 h-3" /> {files[d.key] ? "Replace file" : "Choose file"}
            </button>
          </div>
        ))}
      </div>
      <Field label="Display monogram" hint="2 chars used in mock-ups"><TextInput maxLength={2} value={config.bank.logoLabel} onChange={(e) => update("bank", { logoLabel: e.target.value.toUpperCase() })} className="w-32" /></Field>
    </StepFrame>
  );
}

export function W04_Tagline() {
  const { config, update } = useWizard();
  return (
    <StepFrame eyebrow="W04 · Identity" title="Your tagline, in 60 characters." lede="Appears on the splash screen and onboarding welcome.">
      <Field label="Tagline" hint={`${config.bank.tagline.length}/60`}><TextInput maxLength={60} value={config.bank.tagline} onChange={(e) => update("bank", { tagline: e.target.value })} /></Field>
      <div className="p-6 bg-[var(--ink)] text-[var(--cream)] rounded-xl">
        <div className="text-[10px] uppercase tracking-widest text-[var(--teal)]">Splash preview</div>
        <div className="mt-4 font-serif text-3xl">{config.bank.shortName}</div>
        <div className="mt-2 text-[14px] italic text-white/70 font-serif">{config.bank.tagline || "—"}</div>
      </div>
    </StepFrame>
  );
}

export function W05_Market() {
  const { config, update } = useWizard();
  return (
    <StepFrame eyebrow="W05 · Identity" title="Market & regulator." lede="Selecting Ethiopia auto-enables Module 9." icon={<BadgeCheck className="w-3 h-3" />}>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Country"><Select value={config.bank.country} onChange={(e) => update("bank", { country: e.target.value })}>{["ET — Ethiopia", "NG — Nigeria", "KE — Kenya", "TZ — Tanzania", "GH — Ghana", "ZA — South Africa"].map(o => <option key={o} value={o.slice(0, 2)}>{o}</option>)}</Select></Field>
        <Field label="Currency"><Select value={config.bank.currency} onChange={(e) => update("bank", { currency: e.target.value })}>{["ETB", "NGN", "KES", "TZS", "GHS", "ZAR", "USD"].map(o => <option key={o}>{o}</option>)}</Select></Field>
        <Field label="Time Zone"><TextInput value={config.bank.timezone} onChange={(e) => update("bank", { timezone: e.target.value })} /></Field>
        <Field label="Regulator"><TextInput value={config.bank.regulatorName} onChange={(e) => update("bank", { regulatorName: e.target.value })} /></Field>
        <Field label="Banking Licence Number"><TextInput value={config.bank.licenseNumber} onChange={(e) => update("bank", { licenseNumber: e.target.value })} /></Field>
      </div>
      {config.bank.country === "ET" && (
        <div className="p-4 bg-[var(--teal)]/15 border border-[var(--teal)]/40 rounded-lg flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-[var(--teal-deep)] mt-0.5" />
          <div className="text-[13px]"><strong>Ethiopia detected.</strong> Module 9 (Fayda · Eth-Switch · NBE · Ethiopic calendar · eQUB) is now enabled.</div>
        </div>
      )}
    </StepFrame>
  );
}

export function W06_Languages() {
  const { config, update } = useWizard();
  const all = ["Amharic", "English", "Afaan Oromo", "Tigrinya", "Swahili", "French", "Hausa", "Arabic", "Zulu"];
  const toggle = (l: string) => { const has = config.bank.supportedLanguages.includes(l); update("bank", { supportedLanguages: has ? config.bank.supportedLanguages.filter((x) => x !== l) : [...config.bank.supportedLanguages, l] }); };
  return (
    <StepFrame eyebrow="W06 · Identity" title="Speak your customers' languages." lede="Pick a primary language and any number of additional ones." icon={<Languages className="w-3 h-3" />}>
      <Field label="Primary Language"><Select value={config.bank.primaryLanguage} onChange={(e) => update("bank", { primaryLanguage: e.target.value })}>{all.map(l => <option key={l}>{l}</option>)}</Select></Field>
      <Field label="Supported Languages">
        <div className="flex flex-wrap gap-2">
          {all.map((l) => { const on = config.bank.supportedLanguages.includes(l); return (
            <button key={l} type="button" onClick={() => toggle(l)} className={`px-3 py-1.5 text-[13px] rounded-full border transition ${on ? "bg-[var(--ink)] text-[var(--cream)] border-[var(--ink)]" : "bg-white border-[var(--line)] hover:border-[var(--ink)]/40"}`}>
              {on && <Check className="inline w-3 h-3 mr-1" strokeWidth={3} />}{l}
            </button>
          ); })}
        </div>
      </Field>
    </StepFrame>
  );
}

function ColorPicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3 p-2 bg-white border border-[var(--line)] rounded-lg">
        <label className="relative w-10 h-10 rounded shrink-0 cursor-pointer" style={{ backgroundColor: value }}>
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
        </label>
        <input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 font-mono text-[13px] bg-transparent outline-none text-[var(--ink)]" />
      </div>
    </Field>
  );
}

export function W07_PrimaryColor() {
  const { config, update } = useWizard();
  const ratio = contrastRatio(config.brand.primaryColor, "#FFFFFF");
  const pass = ratio >= 4.5;
  return (
    <StepFrame eyebrow="W07 · Brand" title="Your primary brand colour." lede="Drives buttons, CTAs, active states." icon={<Palette className="w-3 h-3" />}>
      <ColorPicker label="brand.primaryColor" value={config.brand.primaryColor} onChange={(v) => update("brand", { primaryColor: v })} />
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-6 rounded-xl text-white flex items-center justify-between" style={{ backgroundColor: config.brand.primaryColor }}>
          <span className="font-serif text-2xl">Continue</span><ChevronRight className="w-5 h-5" />
        </div>
        <div className={`p-6 rounded-xl border-2 ${pass ? "border-[var(--teal)] bg-[var(--teal)]/10" : "border-[#EF4444] bg-red-50"}`}>
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-widest font-medium">
            {pass ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />} WCAG AA · Contrast {ratio.toFixed(2)}:1
          </div>
          <div className="text-[12px] mt-2 text-[var(--ink-soft)]">{pass ? "Passes against white surfaces." : "Fails AA. Choose a darker primary."}</div>
        </div>
      </div>
    </StepFrame>
  );
}

export function W08_FullPalette() {
  const { config, update } = useWizard();
  const fields: [keyof BankConfig["brand"], string][] = [
    ["secondaryColor", "Secondary / Accent"], ["surfaceColor", "Surface (cards)"], ["backgroundColor", "Background"],
    ["textPrimary", "Text · Primary"], ["textSecondary", "Text · Secondary"],
    ["successColor", "Success"], ["warningColor", "Warning"], ["errorColor", "Error"],
  ];
  return (
    <StepFrame eyebrow="W08 · Brand" title="Complete the palette." lede="Eight tokens, every surface in the app.">
      <div className="grid md:grid-cols-2 gap-4">
        {fields.map(([key, label]) => (
          <ColorPicker key={key} label={label} value={config.brand[key] as string} onChange={(v) => update("brand", { [key]: v } as Partial<BankConfig["brand"]>)} />
        ))}
      </div>
    </StepFrame>
  );
}

export function W09_Typography() {
  const { config, update } = useWizard();
  const heads = ["Cormorant Garamond", "Playfair Display", "Inter", "Poppins", "Nunito", "Lato"];
  const bodies = ["Inter", "Roboto", "Open Sans", "Lato"];
  return (
    <StepFrame eyebrow="W09 · Brand" title="Typography." lede="Pair a heading face with a body font." icon={<Type className="w-3 h-3" />}>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Heading Font"><Select value={config.brand.fontHeading} onChange={(e) => update("brand", { fontHeading: e.target.value })}>{heads.map(f => <option key={f}>{f}</option>)}</Select></Field>
        <Field label="Body Font"><Select value={config.brand.fontBody} onChange={(e) => update("brand", { fontBody: e.target.value })}>{bodies.map(f => <option key={f}>{f}</option>)}</Select></Field>
      </div>
      <div className="p-8 bg-white border border-[var(--line)] rounded-xl">
        <div className="text-[10px] uppercase tracking-widest text-[var(--ink-soft)]">Specimen</div>
        <h2 className="mt-2 text-4xl" style={{ fontFamily: config.brand.fontHeading }}>Banking that finally gets you.</h2>
        <p className="mt-3 text-[15px] text-[var(--ink-soft)] leading-relaxed" style={{ fontFamily: config.brand.fontBody }}>Send 500 ETB to Bekele · Pay your Telebirr top-up · Save toward the Lalibela trip.</p>
      </div>
    </StepFrame>
  );
}

export function W10_VisualStyle() {
  const { config, update } = useWizard();
  const radii = [{ v: "none", label: "Sharp", px: 0 }, { v: "soft", label: "Soft", px: 8 }, { v: "rounded", label: "Rounded", px: 16 }, { v: "pill", label: "Pill", px: 24 }] as const;
  const shadows = [{ v: "flat", label: "Flat" }, { v: "soft", label: "Soft" }, { v: "elevated", label: "Elevated" }, { v: "dramatic", label: "Dramatic" }] as const;
  return (
    <StepFrame eyebrow="W10 · Brand" title="Pick the surface language." lede="Corner radius and elevation.">
      <Field label="Border Radius">
        <div className="grid grid-cols-4 gap-3">
          {radii.map((r) => (
            <OptionCard key={r.v} selected={config.brand.borderRadius === r.v} onClick={() => update("brand", { borderRadius: r.v })} title={r.label} desc={`${r.px}px`}>
              <div className="h-12 bg-[var(--ink)]" style={{ borderRadius: r.px }} />
            </OptionCard>
          ))}
        </div>
      </Field>
      <Field label="Shadow Style">
        <div className="grid grid-cols-4 gap-3">
          {shadows.map((s, i) => (
            <OptionCard key={s.v} selected={config.brand.shadowStyle === s.v} onClick={() => update("brand", { shadowStyle: s.v })} title={s.label}>
              <div className="h-12 bg-white rounded" style={{ boxShadow: ["none", "0 4px 12px -4px rgba(0,0,0,.12)", "0 12px 28px -10px rgba(0,0,0,.18)", "0 24px 50px -16px rgba(0,0,0,.28)"][i] }} />
            </OptionCard>
          ))}
        </div>
      </Field>
    </StepFrame>
  );
}

export function W11_Navigation() {
  const { config, update } = useWizard();
  const opts = [
    { v: "bottom-tabs", t: "Bottom Tabs", d: "Familiar · thumb-friendly" },
    { v: "side-drawer", t: "Side Drawer", d: "Dense · power-user" },
    { v: "floating-hub", t: "Floating Hub", d: "Distinctive · gesture-led" },
    { v: "ai-first", t: "AI-First", d: "Conversation replaces menus" },
  ] as const;
  return (
    <StepFrame eyebrow="W11 · CX Design" title="How does your app feel under the thumb?" lede="Pick the dominant navigation paradigm." icon={<LayoutGrid className="w-3 h-3" />}>
      <div className="grid md:grid-cols-2 gap-3">
        {opts.map((o) => (
          <OptionCard key={o.v} selected={config.ux.navigationStyle === o.v} onClick={() => update("ux", { navigationStyle: o.v })} title={o.t} desc={o.d}>
            <NavSketch kind={o.v} />
          </OptionCard>
        ))}
      </div>
    </StepFrame>
  );
}
function NavSketch({ kind }: { kind: BankConfig["ux"]["navigationStyle"] }) {
  return (
    <div className="h-24 bg-[var(--ivory)] rounded-md relative overflow-hidden border border-[var(--line)]">
      {kind === "bottom-tabs" && <div className="absolute bottom-2 left-2 right-2 h-6 bg-white rounded-full flex items-center justify-around shadow-sm">{[1, 2, 3, 4].map(i => <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === 1 ? "bg-[var(--ink)]" : "bg-[var(--line)]"}`} />)}</div>}
      {kind === "side-drawer" && <div className="absolute inset-y-2 left-2 w-8 bg-white rounded shadow-sm flex flex-col items-center py-2 gap-2">{[1, 2, 3].map(i => <span key={i} className="w-3 h-1 bg-[var(--ink)]/40 rounded" />)}</div>}
      {kind === "floating-hub" && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[var(--ink)] grid place-items-center text-[var(--teal)]"><Diamond className="w-3 h-3" /></div>}
      {kind === "ai-first" && <div className="absolute inset-x-3 bottom-2 h-8 bg-white rounded-full flex items-center px-3 shadow-sm"><Mic className="w-3 h-3 text-[var(--teal-deep)]" /><span className="ml-2 text-[9px] text-[var(--ink-soft)] italic">Ask anything…</span></div>}
    </div>
  );
}

export function W12_Home() {
  const { config, update } = useWizard();
  const opts = [
    { v: "balance-hero", t: "Balance Hero", d: "Big number, fast actions" },
    { v: "card-grid", t: "Card Grid", d: "Multi-account at a glance" },
    { v: "feed", t: "Activity Feed", d: "Story-first timeline" },
    { v: "agent-chat", t: "Agent Chat", d: "Concierge as home screen" },
  ] as const;
  return (
    <StepFrame eyebrow="W12 · CX Design" title="Home screen layout." lede="The first surface every customer sees.">
      <div className="grid md:grid-cols-2 gap-3">{opts.map((o) => <OptionCard key={o.v} selected={config.ux.homeScreenLayout === o.v} onClick={() => update("ux", { homeScreenLayout: o.v })} title={o.t} desc={o.d} />)}</div>
    </StepFrame>
  );
}

export function W13_Interaction() {
  const { config, update } = useWizard();
  const modes = [
    { v: "tap", t: "Tap-first", d: "Classic touch", icon: <Smartphone className="w-4 h-4" /> },
    { v: "voice", t: "Voice-first", d: "Speak in Amharic", icon: <Mic className="w-4 h-4" /> },
    { v: "conversation", t: "Conversation", d: "AI replaces menus", icon: <Bot className="w-4 h-4" /> },
    { v: "gesture", t: "Gesture", d: "Swipe & long-press", icon: <ChevronRight className="w-4 h-4" /> },
  ] as const;
  return (
    <StepFrame eyebrow="W13 · CX Design" title="Primary interaction mode." lede="Voice and conversation modes auto-route to Concierge.">
      <div className="grid md:grid-cols-2 gap-3">
        {modes.map((m) => (
          <OptionCard key={m.v} selected={config.ux.primaryInteractionMode === m.v} onClick={() => update("ux", { primaryInteractionMode: m.v })} title={m.t} desc={m.d}>
            <div className="w-10 h-10 rounded-lg bg-[var(--ink)] text-[var(--teal)] grid place-items-center">{m.icon}</div>
          </OptionCard>
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <Toggle on={config.ux.voiceInputEnabled} onChange={(v) => update("ux", { voiceInputEnabled: v })} label="Voice input" hint="Mic in every field" />
        <Toggle on={config.ux.offlineModeEnabled} onChange={(v) => update("ux", { offlineModeEnabled: v })} label="Offline mode" hint="Queue & sync" />
        <Toggle on={config.ux.biometricAuthEnabled} onChange={(v) => update("ux", { biometricAuthEnabled: v })} label="Biometric auth" hint="Face / fingerprint" />
      </div>
    </StepFrame>
  );
}

export function W14_UXDetails() {
  const { config, update } = useWizard();
  return (
    <StepFrame eyebrow="W14 · CX Design" title="UX details — the fine print." lede="Density, animation, iconography.">
      <div className="grid md:grid-cols-3 gap-4">
        <Field label="Animation Level"><Select value={config.ux.animationLevel} onChange={(e) => update("ux", { animationLevel: e.target.value as BankConfig["ux"]["animationLevel"] })}>{["minimal", "balanced", "expressive"].map(o => <option key={o}>{o}</option>)}</Select></Field>
        <Field label="Density"><Select value={config.ux.density} onChange={(e) => update("ux", { density: e.target.value as BankConfig["ux"]["density"] })}>{["compact", "comfortable", "spacious"].map(o => <option key={o}>{o}</option>)}</Select></Field>
        <Field label="Card Style"><Select value={config.ux.cardStyle} onChange={(e) => update("ux", { cardStyle: e.target.value as BankConfig["ux"]["cardStyle"] })}>{["flat", "elevated", "outlined", "glass"].map(o => <option key={o}>{o}</option>)}</Select></Field>
        <Field label="Icon Library"><Select value={config.ux.iconLibrary} onChange={(e) => update("ux", { iconLibrary: e.target.value as BankConfig["ux"]["iconLibrary"] })}>{["lucide", "phosphor", "tabler", "custom"].map(o => <option key={o}>{o}</option>)}</Select></Field>
        <Field label="Date Format"><TextInput value={config.ux.dateFormat} onChange={(e) => update("ux", { dateFormat: e.target.value })} /></Field>
        <Field label="Number Format"><TextInput value={config.ux.numberFormat} onChange={(e) => update("ux", { numberFormat: e.target.value })} /></Field>
        <Field label="Accessibility Level"><Select value={config.ux.accessibilityLevel} onChange={(e) => update("ux", { accessibilityLevel: e.target.value as BankConfig["ux"]["accessibilityLevel"] })}>{["AA", "AAA"].map(o => <option key={o}>{o}</option>)}</Select></Field>
        <Field label="Transaction Confirm"><Select value={config.ux.transactionConfirmStyle} onChange={(e) => update("ux", { transactionConfirmStyle: e.target.value as BankConfig["ux"]["transactionConfirmStyle"] })}>{["simple-modal", "detailed-summary", "conversational-confirm"].map(o => <option key={o}>{o}</option>)}</Select></Field>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <Toggle on={config.ux.rtlSupport} onChange={(v) => update("ux", { rtlSupport: v })} label="RTL Support" />
        <Toggle on={config.ux.darkModeSupport} onChange={(v) => update("ux", { darkModeSupport: v })} label="Dark Mode" />
      </div>
    </StepFrame>
  );
}

function PersonaForm({ p, onChange, onRemove }: { p: BankConfig["personas"][number]; onChange: (p: BankConfig["personas"][number]) => void; onRemove?: () => void }) {
  return (
    <div className="p-5 bg-white border border-[var(--line)] rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--ink)] text-[var(--teal)] grid place-items-center font-serif font-bold">{p.name.charAt(0)}</div>
          <input value={p.name} onChange={(e) => onChange({ ...p, name: e.target.value })} className="font-serif text-lg bg-transparent outline-none border-b border-transparent focus:border-[var(--ink)] py-1 text-[var(--ink)]" />
        </div>
        {onRemove && <button onClick={onRemove} className="text-[var(--ink-soft)] hover:text-[var(--ink)]"><X className="w-4 h-4" /></button>}
      </div>
      <TextArea rows={2} value={p.description} onChange={(e) => onChange({ ...p, description: e.target.value })} />
      <div className="grid md:grid-cols-3 gap-3 text-[12px]">
        <Field label="Age range"><TextInput value={p.ageRange} onChange={(e) => onChange({ ...p, ageRange: e.target.value })} /></Field>
        <Field label="Income profile"><TextInput value={p.incomeProfile} onChange={(e) => onChange({ ...p, incomeProfile: e.target.value })} /></Field>
        <Field label="Digital literacy"><Select value={p.digitalLiteracy} onChange={(e) => onChange({ ...p, digitalLiteracy: e.target.value as Persona["digitalLiteracy"] })}>{["low", "medium", "high"].map(o => <option key={o}>{o}</option>)}</Select></Field>
      </div>
      <Field label="Goals"><TextInput value={p.goals} onChange={(e) => onChange({ ...p, goals: e.target.value })} /></Field>
    </div>
  );
}
type Persona = BankConfig["personas"][number];

export function W15_Persona1() {
  const { config, update } = useWizard();
  const p = config.personas[0];
  return (
    <StepFrame eyebrow="W15 · Personas" title="Define your first persona." lede="Personas drive every persona-aware behaviour." icon={<Users className="w-3 h-3" />}>
      <PersonaForm p={p} onChange={(np) => update("personas", Object.assign([], config.personas, { 0: np }) as unknown as Partial<BankConfig["personas"]>)} />
    </StepFrame>
  );
}

export function W16_PersonaMany() {
  const { config, update } = useWizard();
  const add = () => update("personas", [...config.personas, { id: `p${Date.now()}`, name: "New Persona", description: "", ageRange: "", incomeProfile: "", digitalLiteracy: "medium" as const, channels: [], goals: "" }] as unknown as Partial<BankConfig["personas"]>);
  return (
    <StepFrame eyebrow="W16 · Personas" title="Add personas 2 through 8." lede="Minimum two. Define up to eight.">
      <div className="space-y-4">
        {config.personas.slice(1).map((p, i) => (
          <PersonaForm key={p.id} p={p} onChange={(np) => { const next = [...config.personas]; next[i + 1] = np; update("personas", next as unknown as Partial<BankConfig["personas"]>); }} onRemove={() => update("personas", config.personas.filter((_, idx) => idx !== i + 1) as unknown as Partial<BankConfig["personas"]>)} />
        ))}
        {config.personas.length < 8 && (
          <button onClick={add} className="w-full p-5 border-2 border-dashed border-[var(--line)] rounded-xl text-[var(--ink-soft)] hover:border-[var(--ink)]/40 hover:text-[var(--ink)] transition flex items-center justify-center gap-2 text-[14px]">
            <Plus className="w-4 h-4" /> Add persona ({config.personas.length}/8)
          </button>
        )}
      </div>
    </StepFrame>
  );
}

export function W17_PersonaRules() {
  const { config, update } = useWizard();
  return (
    <StepFrame eyebrow="W17 · Personas" title="Classification rules." lede="ABX evaluates every customer in real-time." icon={<GitBranch className="w-3 h-3" />}>
      <Field label="Rule script" hint="IF / AND / OR / THEN persona = …"><TextArea rows={6} value={config.personaRules} onChange={(e) => update("personaRules", e.target.value as unknown as Partial<BankConfig["personaRules"]>)} /></Field>
      <div className="p-4 bg-[var(--ivory)] rounded-lg text-[12px]">
        <div className="font-medium mb-2 text-[11px] uppercase tracking-widest">Live evaluation</div>
        <div className="font-mono text-[12px] text-[var(--ink-soft)]">{`{ age: 29, income: "salary", txn30d: 42 }`} → <span className="text-[var(--teal-deep)]">persona = "Rising Professional"</span></div>
      </div>
    </StepFrame>
  );
}

export function W18_PersonaUX() {
  const { config } = useWizard();
  return (
    <StepFrame eyebrow="W18 · Personas" title="Per-persona UX overrides." lede="Leave blank to inherit the global setting.">
      <div className="space-y-3">
        {config.personas.map((p) => (
          <div key={p.id} className="p-4 bg-white border border-[var(--line)] rounded-xl grid md:grid-cols-4 gap-3 items-center">
            <div className="font-serif text-lg">{p.name}</div>
            <Select defaultValue=""><option value="">Inherit nav</option><option>Bottom Tabs</option><option>AI-first</option></Select>
            <Select defaultValue=""><option value="">Inherit density</option><option>Compact</option><option>Spacious</option></Select>
            <Select defaultValue=""><option value="">Inherit tone</option><option>Warm</option><option>Formal</option></Select>
          </div>
        ))}
      </div>
    </StepFrame>
  );
}

export function W19_KYC() {
  const { config, update } = useWizard();
  return (
    <StepFrame eyebrow="W19 · Onboarding" title="KYC & identity." lede="Choose the primary KYC method." icon={<ShieldCheck className="w-3 h-3" />}>
      <Field label="KYC Method">
        <div className="grid md:grid-cols-3 gap-3">{(["video-kyc", "voice-kyc", "fayda-id", "in-branch", "agent-assisted"] as const).map(m => <OptionCard key={m} selected={config.onboarding.kycMethod === m} onClick={() => update("onboarding", { kycMethod: m })} title={m} />)}</div>
      </Field>
      <div className="grid md:grid-cols-3 gap-3">
        <Toggle on={config.onboarding.livenessCheckEnabled} onChange={(v) => update("onboarding", { livenessCheckEnabled: v })} label="Liveness check" />
        <Toggle on={config.onboarding.selfieRequired} onChange={(v) => update("onboarding", { selfieRequired: v })} label="Selfie required" />
        <Toggle on={config.onboarding.proofOfAddressRequired} onChange={(v) => update("onboarding", { proofOfAddressRequired: v })} label="Proof of address" />
      </div>
    </StepFrame>
  );
}

export function W20_AccountOpening() {
  const { config, update } = useWizard();
  return (
    <StepFrame eyebrow="W20 · Onboarding" title="Account opening settings." lede="Instant accounts get a tier-1 wallet immediately.">
      <Field label="Account Opening Mode">
        <div className="grid md:grid-cols-3 gap-3">{(["instant", "review", "tiered"] as const).map(o => <OptionCard key={o} selected={config.onboarding.accountOpeningMode === o} onClick={() => update("onboarding", { accountOpeningMode: o })} title={o} desc={o === "instant" ? "Tier-1 in 90s" : o === "review" ? "Manual ≤ 24h" : "Tier-up as KYC deepens"} />)}</div>
      </Field>
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Phone Verification"><Select value={config.onboarding.phoneVerificationMethod} onChange={(e) => update("onboarding", { phoneVerificationMethod: e.target.value as BankConfig["onboarding"]["phoneVerificationMethod"] })}>{["otp-sms", "otp-voice", "missed-call"].map(o => <option key={o}>{o}</option>)}</Select></Field>
        <Toggle on={config.onboarding.languageSelectionStep} onChange={(v) => update("onboarding", { languageSelectionStep: v })} label="Language selection step" />
        <Toggle on={config.onboarding.voiceOnboardingEnabled} onChange={(v) => update("onboarding", { voiceOnboardingEnabled: v })} label="Voice onboarding" />
        <Toggle on={config.onboarding.ussdFallbackEnabled} onChange={(v) => update("onboarding", { ussdFallbackEnabled: v })} label="USSD fallback" />
      </div>
    </StepFrame>
  );
}

export function W21_StepSequencer() {
  const { config, update } = useWizard();
  const steps = config.onboarding.stepSequence;
  const move = (i: number, dir: -1 | 1) => { const j = i + dir; if (j < 0 || j >= steps.length) return; const next = [...steps];[next[i], next[j]] = [next[j], next[i]]; update("onboarding", { stepSequence: next }); };
  return (
    <StepFrame eyebrow="W21 · Onboarding" title="Sequence the onboarding steps." lede="Reorder. Toggle required / skippable.">
      <div className="space-y-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-3 p-3 bg-white border border-[var(--line)] rounded-lg">
            <span className="w-7 h-7 rounded bg-[var(--ink)] text-[var(--cream)] grid place-items-center text-[11px] font-mono">{i + 1}</span>
            <span className="flex-1 text-[14px]">{s}</span>
            <button onClick={() => move(i, -1)} className="px-2 text-[var(--ink-soft)]">↑</button>
            <button onClick={() => move(i, 1)} className="px-2 text-[var(--ink-soft)]">↓</button>
            <span className="text-[10px] uppercase tracking-widest text-[var(--teal-deep)]">Required</span>
          </div>
        ))}
      </div>
    </StepFrame>
  );
}

export function W22_Welcome() {
  const { config, update } = useWizard();
  return (
    <StepFrame eyebrow="W22 · Onboarding" title="The welcome experience." lede="Static, video, or AI-personalised.">
      <div className="grid md:grid-cols-3 gap-3">{(["static", "video", "ai-personalised"] as const).map(o => <OptionCard key={o} selected={config.onboarding.welcomeScreenType === o} onClick={() => update("onboarding", { welcomeScreenType: o })} title={o} desc={o === "ai-personalised" ? "Greets by name" : o === "video" ? "MP4 from brand team" : "Pure visual splash"} />)}</div>
      {config.onboarding.welcomeScreenType === "ai-personalised" && (
        <div className="p-5 bg-[var(--ink)] text-[var(--cream)] rounded-xl">
          <div className="text-[10px] uppercase tracking-widest text-[var(--teal)]">Personalisation variables</div>
          <div className="mt-3 font-mono text-[12px] grid grid-cols-2 gap-2 text-white/70">
            <span>{`{customer.firstName}`}</span><span>{`{customer.language}`}</span>
            <span>{`{customer.persona}`}</span><span>{`{bank.shortName}`}</span>
            <span>{`{time.greeting}`}</span><span>{`{location.city}`}</span>
          </div>
        </div>
      )}
    </StepFrame>
  );
}

export function W23_GlobalAI() {
  const { config, update } = useWizard();
  return (
    <StepFrame eyebrow="W23 · AI Setup" title="Global AI behaviour." lede="The defaults every agent inherits." icon={<Bot className="w-3 h-3" />}>
      <div className="space-y-5">
        <div>
          <div className="flex justify-between text-[11px] uppercase tracking-widest"><span>Conversation Memory Depth</span><span>{config.ai.conversationMemoryDepth} turns</span></div>
          <input type="range" min={4} max={32} value={config.ai.conversationMemoryDepth} onChange={(e) => update("ai", { conversationMemoryDepth: +e.target.value })} className="w-full mt-2 accent-[var(--teal-deep)]" />
        </div>
        <div>
          <div className="flex justify-between text-[11px] uppercase tracking-widest"><span>Intent Confidence Threshold</span><span>{config.ai.intentConfidenceThreshold.toFixed(2)}</span></div>
          <input type="range" min={0.4} max={0.95} step={0.01} value={config.ai.intentConfidenceThreshold} onChange={(e) => update("ai", { intentConfidenceThreshold: +e.target.value })} className="w-full mt-2 accent-[var(--teal-deep)]" />
        </div>
        <div>
          <div className="flex justify-between text-[11px] uppercase tracking-widest"><span>Max Turns Before Escalation</span><span>{config.ai.maxTurnsBeforeEscalation}</span></div>
          <input type="range" min={2} max={10} value={config.ai.maxTurnsBeforeEscalation} onChange={(e) => update("ai", { maxTurnsBeforeEscalation: +e.target.value })} className="w-full mt-2 accent-[var(--teal-deep)]" />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Default Tone"><Select value={config.ai.tone} onChange={(e) => update("ai", { tone: e.target.value as BankConfig["ai"]["tone"] })}>{["warm", "direct", "joyful", "formal"].map(o => <option key={o}>{o}</option>)}</Select></Field>
        <Toggle on={config.ai.proactiveMessagingEnabled} onChange={(v) => update("ai", { proactiveMessagingEnabled: v })} label="Proactive messaging" />
      </div>
    </StepFrame>
  );
}

export function W24_Agents() {
  const { config, update } = useWizard();
  const agents = Object.entries(config.ai.agents);
  const toggle = (name: string) => { const next = { ...config.ai.agents, [name]: { ...config.ai.agents[name], enabled: !config.ai.agents[name].enabled } }; update("ai", { agents: next }); };
  return (
    <StepFrame eyebrow="W24 · AI Setup" title="Activate your agent mesh." lede="Twelve specialised agents.">
      <div className="grid md:grid-cols-2 gap-3">
        {agents.map(([name, a]) => {
          const mandatory = name === "Concierge" || name === "Compliance";
          return (
            <div key={name} className={`p-4 border rounded-xl flex items-start gap-3 ${a.enabled ? "bg-white border-[var(--ink)]" : "bg-[var(--ivory)] border-[var(--line)]"}`}>
              <div className="w-9 h-9 shrink-0 rounded-lg bg-[var(--ink)] text-[var(--teal)] grid place-items-center"><Bot className="w-4 h-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="font-medium text-[14px]">{name}</span>{mandatory && <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 bg-[var(--teal)] rounded">Required</span>}</div>
                <div className="text-[11px] text-[var(--ink-soft)] mt-0.5 line-clamp-2">{a.systemPrompt || "Tone: " + a.tone}</div>
              </div>
              <button disabled={mandatory} onClick={() => toggle(name)} className={`shrink-0 relative w-10 h-6 rounded-full transition ${a.enabled ? "bg-[var(--ink)]" : "bg-[var(--line)]"} ${mandatory ? "opacity-50" : ""}`}>
                <span className={`absolute top-0.5 ${a.enabled ? "left-[18px]" : "left-0.5"} w-5 h-5 rounded-full transition-all`} style={{ backgroundColor: a.enabled ? "var(--teal)" : "white" }} />
              </button>
            </div>
          );
        })}
      </div>
    </StepFrame>
  );
}

export function W25_AgentDeep() {
  const { config, update } = useWizard();
  const [pick, setPick] = useState<string>(Object.keys(config.ai.agents)[0]);
  const a = config.ai.agents[pick];
  return (
    <StepFrame eyebrow="W25 · AI Setup" title="Tune each agent's voice." lede="System prompt, response length, escalation.">
      <div className="flex flex-wrap gap-2">
        {Object.keys(config.ai.agents).filter(n => config.ai.agents[n].enabled).map(n => (
          <button key={n} onClick={() => setPick(n)} className={`px-3 py-1.5 text-[12px] rounded-full border ${pick === n ? "bg-[var(--ink)] text-[var(--cream)] border-[var(--ink)]" : "bg-white border-[var(--line)]"}`}>{n}</button>
        ))}
      </div>
      <Field label={`${pick} · System Prompt`}><TextArea rows={5} value={a.systemPrompt} onChange={(e) => update("ai", { agents: { ...config.ai.agents, [pick]: { ...a, systemPrompt: e.target.value } } })} /></Field>
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Tone"><Select value={a.tone} onChange={(e) => update("ai", { agents: { ...config.ai.agents, [pick]: { ...a, tone: e.target.value } } })}>{["warm", "direct", "joyful", "formal", "precise", "empathic", "narrative"].map(o => <option key={o}>{o}</option>)}</Select></Field>
        <Field label="Escalation Target Agent"><Select defaultValue="Concierge">{Object.keys(config.ai.agents).map(o => <option key={o}>{o}</option>)}</Select></Field>
      </div>
    </StepFrame>
  );
}

export function W26_Products() {
  const { config, update } = useWizard();
  const types = ["Savings Account", "Current Account", "Debit Card", "Credit Card", "Micro-Loan", "SME Loan", "Mortgage", "Term Deposit", "Remittance", "Insurance", "Investment"];
  const patch = (i: number, partial: Partial<BankConfig["products"][number]>) => { const n = [...config.products]; n[i] = { ...n[i], ...partial }; update("products", n as unknown as Partial<BankConfig["products"]>); };
  const add = (type = "Savings Account") => update("products", [...config.products, { id: `pr${Date.now()}`, type, name: `New ${type}`, tagline: "", description: "" }] as unknown as Partial<BankConfig["products"]>);
  return (
    <StepFrame eyebrow="W26 · Products" title="Your financial product catalogue." lede="Flows into recommendation logic." icon={<CreditCard className="w-3 h-3" />}>
      <div className="space-y-3">
        {config.products.map((p, i) => (
          <div key={p.id} className="p-4 bg-white border border-[var(--line)] rounded-xl space-y-3">
            <div className="grid md:grid-cols-12 gap-3 items-center">
              <Select className="md:col-span-3" value={p.type} onChange={(e) => patch(i, { type: e.target.value })}>{types.map(o => <option key={o}>{o}</option>)}</Select>
              <TextInput className="md:col-span-4" value={p.name} onChange={(e) => patch(i, { name: e.target.value })} placeholder="Product name" />
              <TextInput className="md:col-span-4" value={p.tagline} placeholder="Tagline" onChange={(e) => patch(i, { tagline: e.target.value })} />
              <button onClick={() => update("products", config.products.filter((_, j) => j !== i) as unknown as Partial<BankConfig["products"]>)} className="md:col-span-1 text-[var(--ink-soft)] hover:text-red-500 justify-self-end"><X className="w-4 h-4" /></button>
            </div>
            <TextArea rows={2} value={p.description} placeholder="Short description." onChange={(e) => patch(i, { description: e.target.value })} />
          </div>
        ))}
        <div className="grid md:grid-cols-4 gap-2">
          {[["Savings Account", "Add account"], ["Debit Card", "Add card"], ["Micro-Loan", "Add loan"], ["Remittance", "Add product"]].map(([t, l]) => (
            <button key={l} onClick={() => add(t)} className="p-3 border-2 border-dashed border-[var(--line)] rounded-xl text-[var(--ink-soft)] hover:border-[var(--ink)]/40 hover:text-[var(--ink)] transition flex items-center justify-center gap-2 text-[13px]"><Plus className="w-4 h-4" /> {l}</button>
          ))}
        </div>
      </div>
    </StepFrame>
  );
}

export function W27_BranchConfig() {
  const { config, update } = useWizard();
  return (
    <StepFrame eyebrow="W27 · Branch" title="Configure your branch network." lede="Skip if digital-only." icon={<Building2 className="w-3 h-3" />}>
      <Toggle on={config.branch.enabled} onChange={(v) => update("branch", { enabled: v })} label="Bank operates physical branches" />
      {config.branch.enabled && (
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Supervisor approval threshold"><TextInput value={config.branch.supervisorThreshold} onChange={(e) => update("branch", { supervisorThreshold: e.target.value })} /></Field>
          <Field label="Staff roles (comma)"><TextInput value={config.branch.staffRoles.join(", ")} onChange={(e) => update("branch", { staffRoles: e.target.value.split(",").map(s => s.trim()) })} /></Field>
          <Field label="Available services (comma)"><TextInput value={config.branch.services.join(", ")} onChange={(e) => update("branch", { services: e.target.value.split(",").map(s => s.trim()) })} /></Field>
        </div>
      )}
    </StepFrame>
  );
}

export function W28_BranchList() {
  const { config, update } = useWizard();
  const add = () => update("branch", { branches: [...config.branch.branches, { id: `b${Date.now()}`, name: "New Branch", address: "", hours: "Mon–Fri 09:00–17:00", services: [] }] });
  return (
    <StepFrame eyebrow="W28 · Branch" title="Add your branches." lede="Map pin or address search.">
      <div className="grid md:grid-cols-3 gap-3">
        {config.branch.branches.map((b, i) => (
          <div key={b.id} className="p-4 bg-white border border-[var(--line)] rounded-xl">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[var(--teal-deep)] mt-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <input className="font-serif text-lg bg-transparent w-full outline-none text-[var(--ink)]" value={b.name} onChange={(e) => { const n = [...config.branch.branches]; n[i] = { ...b, name: e.target.value }; update("branch", { branches: n }); }} />
                <input className="text-[12px] text-[var(--ink-soft)] bg-transparent w-full outline-none mt-1" value={b.address} onChange={(e) => { const n = [...config.branch.branches]; n[i] = { ...b, address: e.target.value }; update("branch", { branches: n }); }} />
                <div className="text-[11px] text-[var(--ink-soft)] mt-2">{b.hours}</div>
              </div>
            </div>
          </div>
        ))}
        <button onClick={add} className="p-4 border-2 border-dashed border-[var(--line)] rounded-xl text-[var(--ink-soft)] hover:border-[var(--ink)]/40 hover:text-[var(--ink)] flex items-center justify-center gap-2 text-[13px]"><Plus className="w-4 h-4" /> Add branch</button>
      </div>
    </StepFrame>
  );
}

export function W29_Reconciliation() {
  const { config, update } = useWizard();
  return (
    <StepFrame eyebrow="W29 · Process AI" title="Reconciliation." lede="Process AI matches CBS entries to channel events." icon={<Workflow className="w-3 h-3" />}>
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Frequency"><Select value={config.process.reconciliationFreq} onChange={(e) => update("process", { reconciliationFreq: e.target.value as BankConfig["process"]["reconciliationFreq"] })}>{["realtime", "hourly", "daily", "weekly"].map(o => <option key={o}>{o}</option>)}</Select></Field>
        <Field label="Matching rule"><TextInput value={config.process.matchingRule} onChange={(e) => update("process", { matchingRule: e.target.value })} /></Field>
      </div>
    </StepFrame>
  );
}

export function W30_Compliance() {
  const { config, update } = useWizard();
  return (
    <StepFrame eyebrow="W30 · Process AI" title="Compliance configuration." lede="AML, CTR, SAR, KYC refresh." icon={<ShieldCheck className="w-3 h-3" />}>
      <Toggle on={config.process.amlEnabled} onChange={(v) => update("process", { amlEnabled: v })} label="Enable AML engine" />
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Rule set"><TextInput value={config.process.amlRuleSet} onChange={(e) => update("process", { amlRuleSet: e.target.value })} /></Field>
        <Field label="CTR threshold"><TextInput value={config.process.ctrThreshold} onChange={(e) => update("process", { ctrThreshold: e.target.value })} /></Field>
        <Field label="SAR workflow"><TextInput value={config.process.sarWorkflow} onChange={(e) => update("process", { sarWorkflow: e.target.value })} /></Field>
        <Field label="KYC refresh (months)"><TextInput type="number" value={String(config.process.kycRefreshMonths)} onChange={(e) => update("process", { kycRefreshMonths: +e.target.value })} /></Field>
      </div>
      <Field label="Sanctions lists">
        <div className="flex flex-wrap gap-2">
          {["UN", "OFAC", "EU", "NBE Domestic", "HMT", "UNSCR 1267"].map(l => {
            const on = config.process.sanctionsLists.includes(l);
            return <button key={l} onClick={() => update("process", { sanctionsLists: on ? config.process.sanctionsLists.filter(x => x !== l) : [...config.process.sanctionsLists, l] })} className={`px-3 py-1.5 text-[12px] rounded-full border ${on ? "bg-[var(--ink)] text-[var(--cream)] border-[var(--ink)]" : "bg-white border-[var(--line)]"}`}>{l}</button>;
          })}
        </div>
      </Field>
    </StepFrame>
  );
}

export function W31_Workflows() {
  const [steps, setSteps] = useState<string[]>(["Customer Request", "Validate Input", "Risk Score", "Decision", "Notify"]);
  const remove = (i: number) => setSteps((s) => s.filter((_, j) => j !== i));
  const addStep = () => { const name = window.prompt("New workflow step name", "New Step"); if (name && name.trim()) setSteps((s) => [...s.slice(0, -1), name.trim(), s[s.length - 1]]); };
  return (
    <StepFrame eyebrow="W31 · Process AI" title="Custom workflows." lede="Drag-and-drop builder.">
      <div className="p-6 bg-white border border-[var(--line)] rounded-xl">
        <div className="flex flex-wrap gap-2 items-center text-[11px] text-center">
          {steps.map((s, i) => (
            <Fragment key={`${s}-${i}`}>
              <div className="relative p-3 bg-[var(--ivory)] rounded-lg border border-[var(--line)] min-w-[110px] group">
                <Workflow className="w-4 h-4 mx-auto text-[var(--teal-deep)] mb-1" /> {s}
                {steps.length > 2 && <button onClick={() => remove(i)} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white border border-[var(--line)] grid place-items-center opacity-0 group-hover:opacity-100 hover:text-red-500"><X className="w-2.5 h-2.5" /></button>}
              </div>
              {i < steps.length - 1 && <ChevronRight className="w-4 h-4 mx-auto text-[var(--ink-soft)]" />}
            </Fragment>
          ))}
        </div>
      </div>
      <button onClick={addStep} className="px-4 py-2 bg-[var(--ink)] text-[var(--cream)] rounded-md text-[12px]">+ Add step</button>
    </StepFrame>
  );
}

export function W32_Fayda() {
  const { config, update } = useWizard();
  return (
    <StepFrame eyebrow="W32 · Ethiopia" title="Fayda national ID integration." lede="Real-time biometric lookup." icon={<FileCheck className="w-3 h-3" />}>
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="API endpoint"><TextInput value={config.ethiopia.fayda.endpoint} onChange={(e) => update("ethiopia", { fayda: { ...config.ethiopia.fayda, endpoint: e.target.value } })} /></Field>
        <Field label="API key"><TextInput type="password" value={config.ethiopia.fayda.apiKey} placeholder="••••••••" onChange={(e) => update("ethiopia", { fayda: { ...config.ethiopia.fayda, apiKey: e.target.value } })} /></Field>
        <Field label={`Match threshold · ${config.ethiopia.fayda.matchThreshold.toFixed(2)}`}>
          <input type="range" min={0.7} max={0.99} step={0.01} value={config.ethiopia.fayda.matchThreshold} onChange={(e) => update("ethiopia", { fayda: { ...config.ethiopia.fayda, matchThreshold: +e.target.value } })} className="w-full accent-[var(--teal-deep)]" />
        </Field>
      </div>
      <button onClick={() => update("ethiopia", { fayda: { ...config.ethiopia.fayda, tested: true } })} className="px-4 py-2.5 bg-[var(--ink)] text-[var(--cream)] rounded-md text-[12px] inline-flex items-center gap-2"><Eye className="w-3.5 h-3.5" />Test connection</button>
    </StepFrame>
  );
}

export function W33_EthSwitch() {
  const { config, update } = useWizard();
  const s = config.ethiopia.ethSwitch;
  return (
    <StepFrame eyebrow="W33 · Ethiopia" title="Eth-Switch & interoperability." lede="Connect to Telebirr, M-Pesa, CBE Birr.">
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Participant code"><TextInput value={s.participantCode} onChange={(e) => update("ethiopia", { ethSwitch: { ...s, participantCode: e.target.value } })} /></Field>
        <Field label="Settlement account"><TextInput value={s.settlementAccount} onChange={(e) => update("ethiopia", { ethSwitch: { ...s, settlementAccount: e.target.value } })} /></Field>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <Toggle on={s.telebirr} onChange={(v) => update("ethiopia", { ethSwitch: { ...s, telebirr: v } })} label="Telebirr" />
        <Toggle on={s.mpesa} onChange={(v) => update("ethiopia", { ethSwitch: { ...s, mpesa: v } })} label="M-Pesa" />
        <Toggle on={s.cbeBirr} onChange={(v) => update("ethiopia", { ethSwitch: { ...s, cbeBirr: v } })} label="CBE Birr" />
      </div>
    </StepFrame>
  );
}

export function W34_Calendar() {
  const { config, update } = useWizard();
  return (
    <StepFrame eyebrow="W34 · Ethiopia" title="Calendar, fiscal year & eQUB." lede="Display dual dates. eQUB enables informal savings circles.">
      <div className="grid md:grid-cols-3 gap-3">{(["ethiopic", "gregorian", "dual"] as const).map(o => <OptionCard key={o} selected={config.ethiopia.calendarMode === o} onClick={() => update("ethiopia", { calendarMode: o })} title={o} />)}</div>
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Fiscal year start"><TextInput value={config.ethiopia.fiscalYearStart} onChange={(e) => update("ethiopia", { fiscalYearStart: e.target.value })} /></Field>
        <Toggle on={config.ethiopia.eQubEnabled} onChange={(v) => update("ethiopia", { eQubEnabled: v })} label="eQUB rotating savings" />
      </div>
    </StepFrame>
  );
}

export function W35_NBE() {
  const { config, update } = useWizard();
  return (
    <StepFrame eyebrow="W35 · Ethiopia" title="NBE report schedule." lede="Pre-populated with NBE defaults." icon={<ScrollText className="w-3 h-3" />}>
      <div className="space-y-2">
        {config.ethiopia.nbeReports.map((r, i) => (
          <div key={r.id} className="p-3 bg-white border border-[var(--line)] rounded-lg flex items-center gap-3">
            <button onClick={() => { const n = [...config.ethiopia.nbeReports]; n[i] = { ...r, enabled: !r.enabled }; update("ethiopia", { nbeReports: n }); }} className={`w-5 h-5 rounded border-2 grid place-items-center ${r.enabled ? "bg-[var(--teal)] border-[var(--teal)]" : "border-[var(--line)]"}`}>{r.enabled && <Check className="w-3 h-3" strokeWidth={3} />}</button>
            <span className="flex-1 text-[14px]">{r.name}</span>
            <span className="text-[11px] text-[var(--ink-soft)] font-mono">{r.schedule}</span>
          </div>
        ))}
      </div>
    </StepFrame>
  );
}

export function W36_Review() {
  const { config, goTo, publish, published } = useWizard();
  const checks = [
    { name: "Identity & Brand", pass: !!config.bank.name && !!config.brand.primaryColor },
    { name: "Languages", pass: config.bank.supportedLanguages.length >= 1 },
    { name: "CX & UX", pass: !!config.ux.navigationStyle && !!config.ux.homeScreenLayout },
    { name: "Personas", pass: config.personas.length >= 2 },
    { name: "KYC & Onboarding", pass: !!config.onboarding.kycMethod && config.onboarding.stepSequence.length > 0 },
    { name: "AI Mesh", pass: Object.values(config.ai.agents).filter(a => a.enabled).length >= 4 },
    { name: "Product Catalogue", pass: config.products.length >= 1 },
    { name: "Branch Network", pass: !config.branch.enabled || config.branch.branches.length >= 1 },
    { name: "Process AI", pass: config.process.amlEnabled },
    { name: "Ethiopia Module", pass: config.bank.country !== "ET" || (!!config.ethiopia.ethSwitch.participantCode) },
  ];
  const score = Math.round((checks.filter(c => c.pass).length / checks.length) * 100);
  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[var(--teal-deep)]"><Rocket className="w-3 h-3" /> W36 · Validation</div>
      <h1 className="mt-3 font-serif text-5xl text-balance">You're ready to go live.</h1>
      <p className="mt-3 max-w-xl text-[15px] text-[var(--ink-soft)]">Final completeness check. When the score reads 100% we publish your BankConfig and the GlobalPay runtime renders your bank to customers.</p>
      <div className="mt-8 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 p-6 bg-[var(--ink)] text-[var(--cream)] rounded-2xl">
          <div className="text-[10px] uppercase tracking-widest text-[var(--teal)]">Completeness</div>
          <div className="mt-3 font-serif text-7xl">{score}<span className="text-2xl text-white/40">%</span></div>
          <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-[var(--teal)]" style={{ width: `${score}%` }} /></div>
          <button id="w36-golive" onClick={async () => { if (score < 100) { const first = checks.findIndex(c => !c.pass); if (first >= 0) goTo(first * 3); return; } await publish(); window.location.href = "/wallet"; }} className={`mt-6 w-full py-3 rounded-lg font-medium text-[14px] transition ${score === 100 ? "bg-[var(--teal)] text-[var(--ink)] hover:opacity-90" : "bg-white/10 text-white/60 hover:text-white cursor-pointer"}`}>
            {published ? "✓ Published & Live · Open Wallet" : score === 100 ? "Publish BankConfig & Go Live" : "Jump to first incomplete"}
          </button>
        </div>
        <div className="md:col-span-2 space-y-2">
          {checks.map(c => (
            <div key={c.name} className="p-4 bg-white border border-[var(--line)] rounded-lg flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full grid place-items-center ${c.pass ? "bg-[var(--teal)]" : "bg-[var(--ivory)] border border-[var(--line)]"}`}>{c.pass ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <AlertCircle className="w-3.5 h-3.5 text-[var(--ink-soft)]" />}</span>
              <span className="flex-1 text-[14px]">{c.name}</span>
              <span className={`text-[11px] uppercase tracking-widest ${c.pass ? "text-[var(--teal-deep)]" : "text-[var(--ink-soft)]"}`}>{c.pass ? "Ready" : "Incomplete"}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 p-6 bg-[var(--ivory)] border border-[var(--line)] rounded-xl flex items-center gap-4 flex-wrap">
        <WifiOff className="w-4 h-4 text-[var(--ink-soft)]" />
        <span className="text-[12px] text-[var(--ink-soft)] flex-1 min-w-[200px]">Sandbox available · open the wallet now to walk a real customer journey.</span>
        <a href="/wallet" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--ink)] text-[var(--cream)] text-[12px] font-medium hover:opacity-90"><Fingerprint className="w-3.5 h-3.5" />Open Wallet Preview</a>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   NEW THEME-FIRST STEPS
   ───────────────────────────────────────────────────────────── */

export function T_Identity() {
  const { config, update } = useWizard();
  return (
    <StepFrame
      eyebrow="W02 · Identity"
      title="Who is the bank?"
      lede="Just the essentials. Name, tagline, monogram, country. The look comes next."
    >
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Legal Name">
          <TextInput value={config.bank.name} onChange={(e) => update("bank", { name: e.target.value })} placeholder="e.g. Awash International Bank S.C." />
        </Field>
        <Field label="Short Name" hint={`${config.bank.shortName.length}/20`}>
          <TextInput maxLength={20} value={config.bank.shortName} onChange={(e) => update("bank", { shortName: e.target.value })} />
        </Field>
        <Field label="Tagline" hint={`${config.bank.tagline.length}/60`}>
          <TextInput maxLength={60} value={config.bank.tagline} onChange={(e) => update("bank", { tagline: e.target.value })} />
        </Field>
        <Field label="Monogram (2 chars)">
          <TextInput maxLength={2} value={config.bank.logoLabel} onChange={(e) => update("bank", { logoLabel: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Country">
          <Select value={config.bank.country} onChange={(e) => update("bank", { country: e.target.value })}>
            {["ET — Ethiopia", "NG — Nigeria", "KE — Kenya", "TZ — Tanzania", "GH — Ghana", "ZA — South Africa"].map(o => (
              <option key={o} value={o.slice(0, 2)}>{o}</option>
            ))}
          </Select>
        </Field>
        <Field label="Currency">
          <Select value={config.bank.currency} onChange={(e) => update("bank", { currency: e.target.value })}>
            {["ETB", "NGN", "KES", "TZS", "GHS", "ZAR", "USD"].map(o => <option key={o}>{o}</option>)}
          </Select>
        </Field>
      </div>
      <div className="p-6 bg-[var(--ink)] text-[var(--cream)] rounded-xl flex items-center gap-4">
        <span className="w-12 h-12 rounded-lg bg-[var(--teal)] text-[var(--ink)] font-serif font-bold text-xl grid place-items-center">
          {config.bank.logoLabel || "AB"}
        </span>
        <div>
          <div className="font-serif text-2xl">{config.bank.shortName || "Bank"}</div>
          <div className="text-[12px] text-white/60 italic font-serif">{config.bank.tagline || "—"}</div>
        </div>
      </div>
    </StepFrame>
  );
}

function ThemeMiniPreview({ themeId }: { themeId: ThemeId }) {
  const t = ABX_THEMES[themeId];
  return (
    <div
      className="aspect-[9/16] w-full rounded-[18px] overflow-hidden relative"
      style={{
        backgroundColor: t.brand.backgroundColor,
        color: t.brand.textPrimary,
        fontFamily: t.brand.fontBody,
      }}
    >
      {/* Status bar */}
      <div className="absolute inset-x-0 top-0 px-3 pt-2 flex items-center justify-between text-[8px]" style={{ color: t.brand.textPrimary }}>
        <span className="font-semibold">9:41</span>
        <div className="flex items-center gap-0.5 opacity-70"><span>●</span><span>●</span><span>●</span></div>
      </div>
      {/* Header */}
      <div className="absolute inset-x-0 top-5 px-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 grid place-items-center font-bold text-[10px]" style={{ background: t.brand.primaryColor, color: t.brand.backgroundColor, borderRadius: t.tokens.radiusPx / 2 }}>B</span>
          <span className="font-bold text-[10px]" style={{ fontFamily: t.brand.fontHeading }}>Bank</span>
        </div>
      </div>
      {/* Hero balance */}
      <div
        className="absolute inset-x-3 top-12 p-3"
        style={{
          background: t.tokens.gradientHero,
          color: "white",
          borderRadius: t.tokens.radiusPx,
          boxShadow: t.tokens.shadowCard,
        }}
      >
        <div className="text-[7px] uppercase tracking-widest opacity-60">Balance</div>
        <div className="mt-0.5 text-[14px] font-bold" style={{ fontFamily: t.brand.fontHeading }}>248,930</div>
        <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
          <div className="h-full w-2/3" style={{ background: t.brand.primaryColor }} />
        </div>
      </div>
      {/* Quick actions */}
      <div className="absolute inset-x-3 top-32 grid grid-cols-4 gap-1.5">
        {["S", "P", "L", "+"].map((a) => (
          <div key={a} className="aspect-square grid place-items-center text-[9px] font-medium"
            style={{ background: t.brand.surfaceColor, color: t.brand.textPrimary, borderRadius: t.tokens.radiusPx / 1.5, boxShadow: t.tokens.shadowCard }}>
            {a}
          </div>
        ))}
      </div>
      {/* Recent list */}
      <div className="absolute inset-x-3 top-52 space-y-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-1.5" style={{ background: t.brand.surfaceColor, color: t.brand.textPrimary, borderRadius: t.tokens.radiusPx / 2 }}>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full" style={{ background: i === 2 ? t.brand.primaryColor : t.brand.secondaryColor }} />
              <span className="text-[8px]">Tx {i}</span>
            </div>
            <span className="text-[7px] font-mono" style={{ color: t.brand.textSecondary }}>−1,200</span>
          </div>
        ))}
      </div>
      {/* Bottom nav */}
      <div className="absolute inset-x-3 bottom-2 flex items-center justify-around py-1.5" style={{ background: t.brand.surfaceColor, borderRadius: 999, boxShadow: t.tokens.shadowCard }}>
        {["H", "P", "AI", "C", "M"].map((n, i) => (
          <span key={n} className="text-[7px]" style={{ color: i === 0 ? t.brand.primaryColor : t.brand.textSecondary, fontWeight: i === 0 ? 700 : 400 }}>{n}</span>
        ))}
      </div>
    </div>
  );
}

export function T_ThemePicker() {
  const { config, applyTheme } = useWizard();
  return (
    <StepFrame
      eyebrow="W03 · Theme"
      title="Pick your design language."
      lede="Choose from four ABX-curated themes. Each is a complete, opinionated design — palette, typography, motion, surface language — proven for African retail banking. You'll tune the accent next."
      icon={<Palette className="w-3 h-3" />}
    >
      <div className="grid md:grid-cols-2 gap-5">
        {THEME_LIST.map((t) => {
          const selected = config.themeId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTheme(t.id)}
              className={`group text-left p-4 rounded-2xl border-2 transition-all ${
                selected ? "border-[var(--ink)] bg-white shadow-soft" : "border-[var(--line)] bg-white/60 hover:border-[var(--ink)]/40"
              }`}
            >
              <div className="flex gap-4">
                <div className="w-[110px] shrink-0">
                  <ThemeMiniPreview themeId={t.id} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-serif text-xl leading-tight">{t.name}</div>
                    {selected && (
                      <span className="w-5 h-5 rounded-full bg-[var(--teal)] grid place-items-center">
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-[var(--ink-soft)] mt-1 leading-snug">{t.tagline}</div>
                  <div className="mt-3 flex items-center gap-1.5">
                    {[t.brand.backgroundColor, t.brand.surfaceColor, t.brand.primaryColor, t.brand.secondaryColor].map((c, i) => (
                      <span key={i} className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-y-1 text-[10px] text-[var(--ink-soft)]">
                    <span>Type · {t.brand.fontHeading.split(" ")[0]}</span>
                    <span>Nav · {t.ux.navigationStyle.replace("-", " ")}</span>
                    <span>Corners · {t.tokens.radiusPx}px</span>
                    <span>Density · {t.ux.density}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="p-4 bg-[var(--ivory)] rounded-lg border border-[var(--line)] text-[12px] text-[var(--ink-soft)] flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-[var(--teal-deep)] mt-0.5 shrink-0" />
        <div>
          Themes are pre-tested for WCAG AA contrast, mobile reachability, and cross-device legibility. You can fine-tune the accent on the next screen, but no theme can be broken.
        </div>
      </div>
    </StepFrame>
  );
}

export function T_AccentTuner() {
  const { config, setAccentShift } = useWizard();
  const t = ABX_THEMES[config.themeId];
  return (
    <StepFrame
      eyebrow="W04 · Theme"
      title="Tune the accent."
      lede="Shift the primary hue within a safe range. Going further would break the theme's harmony."
      icon={<Palette className="w-3 h-3" />}
    >
      <div className="p-6 bg-white border border-[var(--line)] rounded-xl space-y-5">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--ink-soft)]">Active theme</div>
            <div className="font-serif text-2xl">{t.name}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-[var(--ink-soft)]">Live accent</span>
            <span className="w-10 h-10 rounded-full border border-black/10" style={{ backgroundColor: `hsl(var(--primary))` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[11px] uppercase tracking-widest">
            <span>Hue shift</span>
            <span className="font-mono">{config.accentShift > 0 ? "+" : ""}{config.accentShift}°</span>
          </div>
          <input
            type="range"
            min={-30}
            max={30}
            step={1}
            value={config.accentShift}
            onChange={(e) => setAccentShift(+e.target.value)}
            className="w-full mt-2 accent-[var(--teal-deep)]"
          />
          <div className="flex justify-between text-[10px] text-[var(--ink-soft)] mt-1">
            <span>−30° cool</span><span>theme default</span><span>+30° warm</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAccentShift(0)}
          className="text-[12px] text-[var(--teal-deep)] hover:underline"
        >
          Reset to theme default
        </button>
      </div>

      {/* Token surface preview */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Primary", v: "hsl(var(--primary))" },
          { label: "Background", v: "hsl(var(--background))" },
          { label: "Card", v: "hsl(var(--card))" },
        ].map((s) => (
          <div key={s.label} className="p-3 bg-white border border-[var(--line)] rounded-lg">
            <div className="h-16 rounded mb-2" style={{ background: s.v }} />
            <div className="text-[10px] uppercase tracking-widest text-[var(--ink-soft)]">{s.label}</div>
          </div>
        ))}
      </div>
    </StepFrame>
  );
}

export function T_Review() {
  // Reuse the existing review component (renamed for the new flow)
  return <W36_Review />;
}

import { AIMeshStudio } from "./AIMeshStudio";

export const STEP_REGISTRY: Record<string, () => ReactNode> = {
  W01: W01_Welcome,
  W02: T_Identity,
  W03: T_ThemePicker,
  W04: T_AccentTuner,
  W05: W26_Products,
  W06: W23_GlobalAI,
  WAM: AIMeshStudio,
  W07: W19_KYC,
  W08: W34_Calendar,
  W09: T_Review,
};

