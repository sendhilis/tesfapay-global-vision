/**
 * BankGPT Agent Builder
 * Steps: Persona → Intents → Knowledge → Tools → Guardrails → Sandbox → Deploy → Audit
 */
import { useMemo, useRef, useState } from "react";
import {
  User, Target, BookOpen, Wrench, FlaskConical, LayoutGrid,
  Plus, Check, Upload, FileText, Link as LinkIcon, Trash2, Play,
  Copy, Sparkles, ShieldCheck, X, RotateCw, ShieldAlert, Activity,
  ScrollText, AlertTriangle,
} from "lucide-react";
import { useWizard } from "@/contexts/BankConfigContext";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  useAgentBuilder, useCustomAgents,
  type AgentBuilderConfig, type ToolId, type KbDoc,
} from "./agentBuilderStore";
import { VoiceSandbox } from "./VoiceSandbox";
import { speak } from "./voiceUtils";
import {
  applyCardSpecialistPreset, CARD_AGENT_ID, DEFAULT_CARD_KB_URL,
} from "./cardSpecialistPreset";

const STEPS = [
  { id: "persona",    label: "Persona",     icon: User },
  { id: "intents",    label: "Intents",     icon: Target },
  { id: "kb",         label: "Knowledge",   icon: BookOpen },
  { id: "tools",      label: "Tools",       icon: Wrench },
  { id: "guardrails", label: "Guardrails",  icon: ShieldAlert },
  { id: "sandbox",    label: "Sandbox",     icon: FlaskConical },
  { id: "widget",     label: "Deploy",      icon: LayoutGrid },
  { id: "audit",      label: "Audit",       icon: ScrollText },
] as const;
type StepId = typeof STEPS[number]["id"];

const TOOL_META: Record<ToolId, { label: string; desc: string }> = {
  read_balance:       { label: "Read balance",        desc: "Quote live wallet, savings, loan balances." },
  fetch_transactions: { label: "Fetch transactions",  desc: "Pull recent activity for analysis." },
  move_money:         { label: "Move money",          desc: "Transfer between accounts/goals." },
  open_goal:          { label: "Open savings goal",   desc: "Create new goal with target & date." },
  buy_tbill:          { label: "Buy T-Bill / FD",     desc: "Place investment orders." },
  repay_loan:         { label: "Repay loan",          desc: "Trigger installment or full repayment." },
  raise_complaint:    { label: "Raise complaint",     desc: "Log dispute & assign ticket." },
  send_notification:  { label: "Send notification",   desc: "Push proactive nudges." },
  generate_chart:     { label: "Generate chart",      desc: "Render pie/bar/line visualisations." },
};

export function AgentBuilder() {
  const { config: bankCfg, setConfig } = useWizard();
  const { customAgents, add: addCustom, remove: removeCustom } = useCustomAgents();
  const roster = useMemo(() => {
    const base = Object.values(bankCfg.ai.mesh.agents).map((a) => ({
      id: a.id, name: a.name, tagline: a.tagline, color: a.color, emoji: a.emoji, custom: false,
    }));
    return [...base, ...customAgents.map((a) => ({ ...a, custom: true }))];
  }, [bankCfg.ai.mesh.agents, customAgents]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [step, setStep] = useState<StepId>("persona");

  function loadCardDemo(kbUrl: string) {
    applyCardSpecialistPreset(bankCfg, setConfig, kbUrl || DEFAULT_CARD_KB_URL);
    setActiveId(CARD_AGENT_ID);
    setStep("sandbox");
    toast({
      title: "Card Specialist loaded",
      description: "Persona, KB, tools and guardrails are pre-configured. Jump to the Voice Sandbox to demo.",
    });
    setTimeout(() => {
      speak("Card Concierge is ready. Tap the microphone in the Voice Sandbox to start the demo in English or Amharic.", "en");
    }, 500);
  }

  if (!activeId) {
    return (
      <RosterPicker
        roster={roster}
        onPick={(id) => { setActiveId(id); setStep("persona"); }}
        onNew={() => {
          const id = addCustom({ name: "New Agent", tagline: "Describe what this agent does.", color: "#6366F1", emoji: "✨" });
          setActiveId(id); setStep("persona");
          toast({ title: "New agent created", description: "Configure its persona to begin." });
        }}
        onDelete={removeCustom}
        onLoadCardDemo={loadCardDemo}
      />
    );
  }

  const agentMeta = roster.find((a) => a.id === activeId)!;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between glass rounded-xl p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg text-base font-bold text-white"
               style={{ background: agentMeta.color }}>{agentMeta.emoji}</div>
          <div>
            <p className="text-sm font-semibold text-foreground">{agentMeta.name}</p>
            <p className="text-[11px] text-muted-foreground">{agentMeta.tagline}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setActiveId(null)}>
          <X className="h-3.5 w-3.5 mr-1" /> Close
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <aside className="col-span-12 md:col-span-3">
          <div className="glass rounded-xl p-2 space-y-1">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = step === s.id;
              return (
                <button key={s.id} onClick={() => setStep(s.id)}
                  className={`flex w-full items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    active ? "bg-gradient-gold text-tesfa-dark" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}>
                  <span className="text-[10px] opacity-60 w-4">{i + 1}</span>
                  <Icon className="h-3.5 w-3.5" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </aside>

        <section className="col-span-12 md:col-span-9">
          <StepRenderer step={step} agentId={activeId} agentMeta={agentMeta} />
        </section>
      </div>
    </div>
  );
}

/* ───────────────────────── Roster picker ───────────────────────── */

function RosterPicker({ roster, onPick, onNew, onDelete, onLoadCardDemo }: {
  roster: { id: string; name: string; tagline: string; color: string; emoji: string; custom: boolean }[];
  onPick: (id: string) => void; onNew: () => void; onDelete: (id: string) => void;
  onLoadCardDemo: (kbUrl: string) => void;
}) {
  const [kbUrl, setKbUrl] = useState(DEFAULT_CARD_KB_URL);
  return (
    <div className="space-y-4">
      <div className="glass rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-tesfa-gold mt-0.5" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground mb-1">Agent Builder — full lifecycle control</p>
            Define persona, ground in your own docs (RAG), wire bank tools with approval policies,
            enforce guardrails, test in a sandbox, watch observability, then deploy as a widget.
            Every change is recorded in the audit trail.
          </div>
        </div>
      </div>

      {/* Featured demo: Credit & Debit Card Specialist */}
      <div className="rounded-xl border-2 border-tesfa-gold/50 bg-gradient-to-br from-tesfa-gold/10 via-tesfa-gold/5 to-transparent p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl shrink-0"
               style={{ background: "linear-gradient(135deg,#7C3AED,#3B82F6)" }}>💳</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-foreground">Credit & Debit Card Specialist — Live Demo</p>
              <Badge className="text-[9px] bg-tesfa-gold text-tesfa-dark">Voice · EN + አማ</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              One-click preset: persona, KB (bank cards URL + fee schedule + cardholder T&Cs),
              tools and guardrails — ready to demo end-to-end via ElevenLabs voice.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Bank cards knowledge URL</label>
            <Input value={kbUrl} onChange={(e) => setKbUrl(e.target.value)}
              placeholder="https://www.yourbank.com/cards" className="h-9 text-xs" />
          </div>
          <Button onClick={() => onLoadCardDemo(kbUrl)} className="bg-gradient-gold text-tesfa-dark hover:opacity-90">
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Load demo & go to Voice Sandbox
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <button onClick={onNew}
          className="glass rounded-xl p-4 border-2 border-dashed border-tesfa-gold/40 hover:border-tesfa-gold transition flex flex-col items-center justify-center gap-2 min-h-[140px] text-tesfa-gold">
          <Plus className="h-6 w-6" />
          <span className="text-sm font-bold">New Agent</span>
          <span className="text-[10px] text-muted-foreground">Start from a blank persona</span>
        </button>

        {roster.map((a) => (
          <div key={a.id} className="glass rounded-xl p-4 hover:bg-white/[0.02] transition group">
            <button onClick={() => onPick(a.id)} className="w-full text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg text-base font-bold text-white shrink-0"
                     style={{ background: a.color }}>{a.emoji}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{a.tagline}</p>
                </div>
              </div>
            </button>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <Badge variant="secondary" className="text-[9px]">{a.custom ? "Custom" : "Built-in"}</Badge>
              {a.custom && (
                <button onClick={() => onDelete(a.id)} className="text-[10px] text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── Step renderer ───────────────────────── */

function StepRenderer({ step, agentId, agentMeta }: {
  step: StepId; agentId: string;
  agentMeta: { id: string; name: string; tagline: string; color: string; emoji: string; custom: boolean };
}) {
  const { config, update, logAudit } = useAgentBuilder(agentId);

  switch (step) {
    case "persona":    return <StepPersona agentMeta={agentMeta} config={config} update={update} logAudit={logAudit} />;
    case "intents":    return <StepIntents config={config} update={update} logAudit={logAudit} />;
    case "kb":         return <StepKB config={config} update={update} logAudit={logAudit} />;
    case "tools":      return <StepTools config={config} update={update} logAudit={logAudit} />;
    case "guardrails": return <StepGuardrails config={config} update={update} logAudit={logAudit} />;
    case "sandbox":    return <StepSandbox agentMeta={agentMeta} config={config} update={update} logAudit={logAudit} />;
    case "widget":     return <StepWidget agentMeta={agentMeta} config={config} update={update} logAudit={logAudit} />;
    case "audit":      return <StepAudit config={config} />;
  }
}

/* ── 1. Persona ── */
function StepPersona({ agentMeta, config, update, logAudit }: any) {
  const { config: bankCfg, setConfig } = useWizard();
  const baseAgent = bankCfg.ai.mesh.agents[agentMeta.id as keyof typeof bankCfg.ai.mesh.agents];

  const [draft, setDraft] = useState({
    name: baseAgent?.name ?? agentMeta.name,
    tagline: baseAgent?.tagline ?? agentMeta.tagline,
    color: baseAgent?.color ?? agentMeta.color,
    emoji: baseAgent?.emoji ?? agentMeta.emoji,
    systemPrompt: baseAgent?.systemPrompt ?? "",
    handoffMessage: baseAgent?.handoffMessage ?? "",
    greetingOnHandoff: baseAgent?.greetingOnHandoff ?? "",
    usesEmoji: baseAgent?.usesEmoji ?? true,
    tone: baseAgent?.tone ?? { formal_casual: 50, terse_verbose: 50, reserved_expressive: 50 },
  });

  function save() {
    if (baseAgent) {
      setConfig({
        ...bankCfg,
        ai: { ...bankCfg.ai, mesh: { ...bankCfg.ai.mesh,
          agents: { ...bankCfg.ai.mesh.agents, [agentMeta.id]: { ...baseAgent, ...draft } } } },
      });
    }
    update({ goLive: { ...config.goLive, personaComplete: true } });
    logAudit("persona.saved", agentMeta.id, { name: draft.name });
    toast({ title: "Persona saved", description: `${draft.name} updated.` });
  }

  return (
    <Card title="Identity & Persona" desc="Voice, look and tone of your agent.">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Name"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
        <Field label="Emoji / Initial"><Input value={draft.emoji} maxLength={2} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} /></Field>
        <Field label="Tagline" full><Input value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} /></Field>
        <Field label="Brand color">
          <div className="flex items-center gap-2">
            <input type="color" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} className="h-9 w-12 rounded border border-border bg-transparent" />
            <Input value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} />
          </div>
        </Field>
        <Field label="Use emoji in replies">
          <div className="flex items-center h-9"><Switch checked={draft.usesEmoji} onCheckedChange={(v) => setDraft({ ...draft, usesEmoji: v })} /></div>
        </Field>
      </div>

      <Field label="System prompt" full>
        <Textarea rows={4} value={draft.systemPrompt} onChange={(e) => setDraft({ ...draft, systemPrompt: e.target.value })}
          placeholder="You are…  Describe role, constraints, escalation rules." />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Greeting on handoff" full><Input value={draft.greetingOnHandoff} onChange={(e) => setDraft({ ...draft, greetingOnHandoff: e.target.value })} /></Field>
        <Field label="Concierge handoff line" full><Input value={draft.handoffMessage} onChange={(e) => setDraft({ ...draft, handoffMessage: e.target.value })} /></Field>
      </div>

      <div className="space-y-3 pt-2">
        <ToneSlider label="Formal ↔ Casual"      value={draft.tone.formal_casual}      onChange={(v) => setDraft({ ...draft, tone: { ...draft.tone, formal_casual: v } })} />
        <ToneSlider label="Terse ↔ Verbose"      value={draft.tone.terse_verbose}      onChange={(v) => setDraft({ ...draft, tone: { ...draft.tone, terse_verbose: v } })} />
        <ToneSlider label="Reserved ↔ Expressive" value={draft.tone.reserved_expressive} onChange={(v) => setDraft({ ...draft, tone: { ...draft.tone, reserved_expressive: v } })} />
      </div>

      <Footer onSave={save} saveLabel="Save persona" />
    </Card>
  );
}

/* ── 2. Intents ── */
function StepIntents({ config, update, logAudit }: any) {
  const [kw, setKw] = useState("");

  return (
    <Card title="Intent & Routing" desc="What triggers this agent, and when to escalate.">
      <Field label="Trigger keywords (press Enter to add)" full>
        <div className="flex gap-2 mb-2 flex-wrap">
          {config.intents.keywords.map((k: string) => (
            <Badge key={k} variant="secondary" className="cursor-pointer" onClick={() => {
              update({ intents: { ...config.intents, keywords: config.intents.keywords.filter((x: string) => x !== k) } });
              logAudit("intents.keyword.removed", undefined, { keyword: k });
            }}>{k} <X className="h-3 w-3 ml-1" /></Badge>
          ))}
        </div>
        <Input value={kw} onChange={(e) => setKw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && kw.trim()) {
              update({ intents: { ...config.intents, keywords: [...config.intents.keywords, kw.trim().toLowerCase()] } });
              logAudit("intents.keyword.added", undefined, { keyword: kw.trim().toLowerCase() });
              setKw("");
            }
          }} placeholder="loan, borrow, credit…" />
      </Field>

      <Field label="Sample utterances (one per line)" full>
        <Textarea rows={4} value={config.intents.sampleUtterances.join("\n")}
          onChange={(e) => update({ intents: { ...config.intents, sampleUtterances: e.target.value.split("\n").filter(Boolean) } })}
          placeholder={"I need money urgently\nCan I get a small loan?\nHow much can I borrow?"} />
      </Field>

      <Field label={`Confidence threshold: ${config.intents.confidenceThreshold.toFixed(2)}`} full>
        <Slider value={[config.intents.confidenceThreshold * 100]} min={30} max={95} step={1}
          onValueChange={(v) => update({ intents: { ...config.intents, confidenceThreshold: v[0] / 100 } })} />
      </Field>

      <Field label="Handoff / escalation rule" full>
        <Textarea rows={2} value={config.intents.handoffRule}
          onChange={(e) => update({ intents: { ...config.intents, handoffRule: e.target.value } })} />
      </Field>
    </Card>
  );
}

/* ── 3. Knowledge Base — inline forms, auto-index ── */

const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
function inferType(name: string): KbDoc["type"] {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "pdf";
  if (n.endsWith(".docx") || n.endsWith(".doc")) return "docx";
  if (n.endsWith(".md") || n.endsWith(".markdown") || n.endsWith(".mdx")) return "md";
  return "txt";
}
function fakeChecksum(s: string): string {
  let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).padStart(8, "0").slice(0, 8);
}

function StepKB({ config, update, logAudit }: { config: AgentBuilderConfig; update: (p: any) => void; logAudit: (a: string, t?: string, d?: any) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlValue, setUrlValue] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  function indexDoc(docId: string) {
    update((c: AgentBuilderConfig) => ({
      ...c, kb: { ...c.kb, docs: c.kb.docs.map((d) => d.id === docId ? { ...d, status: "indexing" } : d) },
    }));
    setTimeout(() => {
      update((c: AgentBuilderConfig) => {
        const docs = c.kb.docs.map((d) => d.id === docId ? ({
          ...d, status: "indexed" as const,
          chunks: Math.floor(Math.random() * 80 + 20),
          tokens: Math.floor(Math.random() * 18000 + 4000),
          indexedAt: new Date().toISOString(),
        }) : d);
        return {
          ...c, kb: { ...c.kb, docs, lastIndexedAt: new Date().toISOString() },
          goLive: { ...c.goLive, kbIndexed: docs.some((d) => d.status === "indexed") },
        };
      });
      const target = config.kb.docs.find((d) => d.id === docId);
      logAudit("kb.doc.indexed", docId, { name: target?.name });
    }, 1200);
  }

  function addFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const newDocs: KbDoc[] = Array.from(files).map((f) => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: f.name, type: inferType(f.name),
      size: `${(f.size / 1024).toFixed(0)} KB`,
      status: "pending", enabled: true,
      source: "upload", checksum: fakeChecksum(f.name + f.size),
    }));
    update({ kb: { ...config.kb, docs: [...config.kb.docs, ...newDocs] } });
    newDocs.forEach((d) => {
      logAudit("kb.doc.added", d.id, { name: d.name, type: d.type, source: "upload", checksum: d.checksum });
      indexDoc(d.id);
    });
    toast({ title: `${newDocs.length} document${newDocs.length > 1 ? "s" : ""} added`, description: "Indexing started…" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function addUrl() {
    const v = urlValue.trim();
    if (!URL_RE.test(v)) { setUrlError("Enter a valid http(s):// URL"); return; }
    setUrlError(null);
    const doc: KbDoc = {
      id: `doc-${Date.now()}`, name: v, type: "url", size: "—",
      status: "checking", enabled: true, source: v, checksum: fakeChecksum(v),
    };
    update({ kb: { ...config.kb, docs: [...config.kb.docs, doc] } });
    logAudit("kb.url.added", doc.id, { url: v });
    setUrlValue("");
    // Simulate reachability check, then index.
    setTimeout(() => {
      const reachable = !/blocked|forbidden|invalid/i.test(v);
      if (!reachable) {
        update((c: AgentBuilderConfig) => ({
          ...c, kb: { ...c.kb, docs: c.kb.docs.map((d) => d.id === doc.id ? { ...d, status: "error", error: "URL not reachable" } : d) },
        }));
        logAudit("kb.url.check_failed", doc.id, { url: v });
        toast({ title: "URL check failed", description: v });
        return;
      }
      logAudit("kb.url.check_passed", doc.id, { url: v });
      indexDoc(doc.id);
    }, 800);
    toast({ title: "URL queued", description: "Checking reachability…" });
  }

  function removeDoc(id: string, name: string) {
    update({ kb: { ...config.kb, docs: config.kb.docs.filter((x) => x.id !== id) } });
    logAudit("kb.doc.removed", id, { name });
  }
  function toggleDoc(id: string, v: boolean) {
    update({ kb: { ...config.kb, docs: config.kb.docs.map((x) => x.id === id ? { ...x, enabled: v } : x) } });
    logAudit(v ? "kb.doc.enabled" : "kb.doc.disabled", id);
  }

  const indexedCount = config.kb.docs.filter((d) => d.status === "indexed").length;
  const totalTokens = config.kb.docs.reduce((sum, d) => sum + (d.tokens ?? 0), 0);

  return (
    <Card title="Knowledge Base (RAG)" desc="Ground the agent in your bank's own docs. Indexed instantly on add.">
      {/* Inline add: files + URL, both on-screen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* File drop / pick */}
        <div className="rounded-lg border border-dashed border-border p-4 text-center">
          <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
          <p className="text-xs font-semibold text-foreground">Upload documents</p>
          <p className="text-[10px] text-muted-foreground mb-3">PDF · DOCX · TXT · MD · max 20 MB</p>
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.doc,.txt,.md,.markdown,.mdx,text/markdown"
            className="hidden" onChange={(e) => addFiles(e.target.files)} />
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Choose files
          </Button>
        </div>

        {/* URL form */}
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-semibold text-foreground">Add URL to knowledge base</p>
          </div>
          <Input value={urlValue} placeholder="https://docs.globalbank.et/terms"
            onChange={(e) => { setUrlValue(e.target.value); setUrlError(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") addUrl(); }} />
          {urlError && <p className="text-[10px] text-destructive mt-1">{urlError}</p>}
          <Button size="sm" className="mt-2 w-full" onClick={addUrl} disabled={!urlValue.trim()}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Check & index URL
          </Button>
          <p className="text-[10px] text-muted-foreground mt-2">URL is fetched, validated, chunked and added to the registry automatically.</p>
        </div>
      </div>

      {/* Registry summary */}
      <div className="grid grid-cols-3 gap-2 pt-3">
        <MiniStat label="Documents" value={String(config.kb.docs.length)} />
        <MiniStat label="Indexed" value={`${indexedCount}/${config.kb.docs.length || 0}`} />
        <MiniStat label="Tokens" value={totalTokens.toLocaleString()} />
      </div>

      {/* Doc list */}
      <div className="space-y-2 mt-3">
        {config.kb.docs.length === 0 && (
          <p className="text-[11px] text-muted-foreground italic">No documents yet. Add files or URLs above — they index immediately.</p>
        )}
        {config.kb.docs.map((d) => (
          <div key={d.id} className="flex items-center gap-2 rounded-lg border border-border p-2 text-xs">
            {d.type === "url" ? <LinkIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              : <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{d.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {d.type.toUpperCase()} · {d.size}
                {d.checksum ? ` · #${d.checksum}` : ""}
                {d.chunks ? ` · ${d.chunks} chunks · ${d.tokens?.toLocaleString()} tokens` : ""}
                {d.error ? ` · ${d.error}` : ""}
              </p>
            </div>
            <StatusPill status={d.status} />
            <Switch checked={d.enabled} onCheckedChange={(v) => toggleDoc(d.id, v)} />
            <button onClick={() => indexDoc(d.id)} className="text-muted-foreground hover:text-foreground" title="Re-index">
              <RotateCw className="h-3 w-3" />
            </button>
            <button onClick={() => removeDoc(d.id, d.name)} className="text-muted-foreground hover:text-destructive" title="Remove">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Retrieval params */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5 mt-3">
        <NumField label="Chunk size" value={config.kb.chunkSize} onChange={(v) => update({ kb: { ...config.kb, chunkSize: v } })} />
        <NumField label="Overlap" value={config.kb.overlap} onChange={(v) => update({ kb: { ...config.kb, overlap: v } })} />
        <NumField label="Top-K" value={config.kb.topK} onChange={(v) => update({ kb: { ...config.kb, topK: v } })} />
        <Field label={`Similarity ≥ ${config.kb.similarityThreshold.toFixed(2)}`}>
          <Slider value={[config.kb.similarityThreshold * 100]} min={50} max={95} step={1}
            onValueChange={(v) => update({ kb: { ...config.kb, similarityThreshold: v[0] / 100 } })} />
        </Field>
        <div className="col-span-2 flex items-center justify-between rounded-lg border border-border p-2">
          <div>
            <p className="text-xs font-semibold text-foreground">Hybrid retrieval (BM25 + vector)</p>
            <p className="text-[10px] text-muted-foreground">Better recall for short queries and acronyms.</p>
          </div>
          <Switch checked={config.kb.hybrid} onCheckedChange={(v) => update({ kb: { ...config.kb, hybrid: v } })} />
        </div>
      </div>

      {config.kb.lastIndexedAt && (
        <p className="text-[10px] text-muted-foreground mt-2">Last indexed {new Date(config.kb.lastIndexedAt).toLocaleString()}</p>
      )}
    </Card>
  );
}

/* ── 4. Tools ── */
function StepTools({ config, update, logAudit }: any) {
  return (
    <Card title="Tools & Actions" desc="What the agent is allowed to do, and under what policy.">
      <div className="space-y-2">
        {(Object.keys(TOOL_META) as ToolId[]).map((id) => {
          const t = config.tools[id]; const meta = TOOL_META[id];
          return (
            <div key={id} className="rounded-lg border border-border p-3">
              <div className="flex items-start gap-3">
                <Switch checked={t.enabled} onCheckedChange={(v) => {
                  update({ tools: { ...config.tools, [id]: { ...t, enabled: v } } });
                  logAudit(v ? "tool.enabled" : "tool.disabled", id);
                }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                  <p className="text-[11px] text-muted-foreground">{meta.desc}</p>
                </div>
              </div>
              {t.enabled && (
                <div className="grid grid-cols-2 gap-2 mt-3 pl-12">
                  <Field label="Approval policy">
                    <select value={t.approval} className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
                      onChange={(e) => {
                        update({ tools: { ...config.tools, [id]: { ...t, approval: e.target.value as any } } });
                        logAudit("tool.policy.changed", id, { approval: e.target.value });
                      }}>
                      <option value="auto">Auto-execute</option>
                      <option value="confirm">Confirm with user</option>
                      <option value="admin">Admin-only</option>
                    </select>
                  </Field>
                  {(id === "move_money" || id === "buy_tbill" || id === "repay_loan") && (
                    <NumField label="Daily limit (ETB)" value={t.dailyLimit ?? 0} onChange={(v) => {
                      update({ tools: { ...config.tools, [id]: { ...t, dailyLimit: v } } });
                      logAudit("tool.limit.changed", id, { dailyLimit: v });
                    }} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── 5. Guardrails ── */
function StepGuardrails({ config, update, logAudit }: any) {
  const g = config.guardrails;
  const [topic, setTopic] = useState("");

  function setG(patch: Partial<typeof g>, action: string) {
    update({ guardrails: { ...g, ...patch } });
    logAudit(action, undefined, patch as any);
  }

  return (
    <Card title="Guardrails & Safety" desc="Policy enforcement applied to every reply before it leaves the agent.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ToggleRow label="PII redaction" desc="Mask account numbers, phones, IDs in logs and replies."
          checked={g.piiRedaction} onChange={(v) => setG({ piiRedaction: v }, "guardrail.pii.toggled")} />
        <ToggleRow label="Profanity filter" desc="Block offensive language in input and output."
          checked={g.profanityFilter} onChange={(v) => setG({ profanityFilter: v }, "guardrail.profanity.toggled")} />
        <ToggleRow label="Jailbreak detection" desc="Detect prompt-injection / role-escape attempts."
          checked={g.jailbreakDetection} onChange={(v) => setG({ jailbreakDetection: v }, "guardrail.jailbreak.toggled")} />
        <ToggleRow label="Require grounded answers" desc="Refuse if no KB chunk meets similarity threshold."
          checked={g.requireGroundedAnswers} onChange={(v) => setG({ requireGroundedAnswers: v }, "guardrail.grounded.toggled")} />
        <ToggleRow label="Human handoff on low confidence" desc="Escalate when intent confidence < threshold."
          checked={g.humanHandoffOnLowConfidence} onChange={(v) => setG({ humanHandoffOnLowConfidence: v }, "guardrail.handoff.toggled")} />
      </div>

      <Field label="Blocked topics (Enter to add)" full>
        <div className="flex gap-1.5 mb-2 flex-wrap">
          {g.blockedTopics.map((t: string) => (
            <Badge key={t} variant="destructive" className="cursor-pointer"
              onClick={() => setG({ blockedTopics: g.blockedTopics.filter((x: string) => x !== t) }, "guardrail.topic.removed")}>
              {t} <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
        </div>
        <Input value={topic} onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && topic.trim()) {
              setG({ blockedTopics: [...g.blockedTopics, topic.trim()] }, "guardrail.topic.added");
              setTopic("");
            }
          }} placeholder="e.g. political opinions" />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <NumField label="Max tokens / reply" value={g.maxTokensPerReply}
          onChange={(v) => setG({ maxTokensPerReply: v }, "guardrail.maxTokens.changed")} />
        <NumField label="Max turns / session" value={g.maxTurnsPerSession}
          onChange={(v) => setG({ maxTurnsPerSession: v }, "guardrail.maxTurns.changed")} />
        <NumField label="Rate limit / minute / user" value={g.rateLimitPerMinute}
          onChange={(v) => setG({ rateLimitPerMinute: v }, "guardrail.rateLimit.changed")} />
        <Field label={`Min grounding similarity: ${g.minGroundingSimilarity.toFixed(2)}`}>
          <Slider value={[g.minGroundingSimilarity * 100]} min={40} max={95} step={1}
            onValueChange={(v) => setG({ minGroundingSimilarity: v[0] / 100 }, "guardrail.minGrounding.changed")} />
        </Field>
      </div>

      <Field label="Refusal message" full>
        <Textarea rows={2} value={g.refusalMessage}
          onChange={(e) => update({ guardrails: { ...g, refusalMessage: e.target.value } })}
          onBlur={() => logAudit("guardrail.refusalMessage.changed")} />
      </Field>

      <div className="flex justify-end pt-3 border-t border-white/5">
        <Button size="sm" onClick={() => {
          update({ goLive: { ...config.goLive, guardrailsReviewed: true } });
          logAudit("guardrails.reviewed");
          toast({ title: "Guardrails reviewed", description: "Policy snapshot recorded." });
        }}>
          <Check className="h-3.5 w-3.5 mr-1" /> Mark reviewed
        </Button>
      </div>
    </Card>
  );
}

/* ── 6. Sandbox + Observability ── */
function StepSandbox({ agentMeta, config, update, logAudit }: any) {
  const [promptText, setPromptText] = useState("");
  const [expected, setExpected] = useState("");
  const [running, setRunning] = useState(false);

  function detectBlock(p: string): string | null {
    const lower = p.toLowerCase();
    if (config.guardrails.profanityFilter && /\b(damn|shit|fuck)\b/i.test(p)) return "profanity";
    if (config.guardrails.jailbreakDetection && /ignore (all )?previous|system prompt|jailbreak/i.test(p)) return "jailbreak";
    for (const t of config.guardrails.blockedTopics) if (lower.includes(t.toLowerCase())) return `blocked:${t}`;
    return null;
  }

  function run() {
    if (!promptText) return;
    setRunning(true);
    const start = Date.now();
    setTimeout(() => {
      const blockedBy = detectBlock(promptText);
      const indexed = config.kb.docs.filter((d: any) => d.status === "indexed" && d.enabled).length;
      const grounded = indexed > 0 ? Math.min(config.kb.topK, indexed) : 0;
      const actual = blockedBy
        ? config.guardrails.refusalMessage
        : `[${agentMeta.name}] Simulated reply for "${promptText.slice(0, 60)}". (${grounded} grounded citations)`;
      const passed = blockedBy ? false : (expected ? actual.toLowerCase().includes(expected.toLowerCase()) : true);
      const latencyMs = Date.now() - start + Math.floor(Math.random() * 400);
      const run = {
        id: `run-${Date.now()}`, prompt: promptText, expected, actual, passed,
        timestamp: new Date().toISOString(),
        latencyMs, tokensIn: Math.floor(promptText.length / 4), tokensOut: Math.floor(actual.length / 4),
        groundedCitations: grounded, blockedBy: blockedBy ?? undefined,
      };
      update({
        sandbox: { runs: [run, ...config.sandbox.runs].slice(0, 30) },
        goLive: { ...config.goLive, sandboxPassed: passed || config.goLive.sandboxPassed },
      });
      logAudit("sandbox.run", run.id, { passed, blockedBy, latencyMs });
      setRunning(false); setPromptText(""); setExpected("");
    }, 700);
  }

  const runs = config.sandbox.runs;
  const avgLatency = runs.length ? Math.round(runs.reduce((s: number, r: any) => s + (r.latencyMs ?? 0), 0) / runs.length) : 0;
  const passRate = runs.length ? Math.round(runs.filter((r: any) => r.passed).length / runs.length * 100) : 0;
  const blockedRate = runs.length ? Math.round(runs.filter((r: any) => r.blockedBy).length / runs.length * 100) : 0;
  const totalTokens = runs.reduce((s: number, r: any) => s + (r.tokensIn ?? 0) + (r.tokensOut ?? 0), 0);

  return (
    <Card title="Sandbox + Observability" desc="Test in isolation by voice or text. Live metrics, guardrail hits and latency are captured.">
      <VoiceSandbox agentMeta={agentMeta} config={config} logAudit={logAudit} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Text-only regression test</p>
          <Field label="Test prompt" full><Textarea rows={3} value={promptText} onChange={(e) => setPromptText(e.target.value)} /></Field>
          <Field label="Expected (substring match — optional)" full><Input value={expected} onChange={(e) => setExpected(e.target.value)} /></Field>
          <Button size="sm" onClick={run} disabled={running || !promptText}>
            <Play className="h-3.5 w-3.5 mr-1" /> {running ? "Running…" : "Run test"}
          </Button>
        </div>
        <div className="rounded-lg border border-border p-3 bg-background/30">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
            <Activity className="h-3 w-3" /> Live observability
          </p>
          <div className="grid grid-cols-2 gap-2">
            <MiniStat label="Avg latency" value={`${avgLatency} ms`} />
            <MiniStat label="Pass rate" value={`${passRate}%`} />
            <MiniStat label="Blocked" value={`${blockedRate}%`} />
            <MiniStat label="Tokens used" value={totalTokens.toLocaleString()} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Alerting at p95 &gt; {config.observability.alerts.latencyP95Ms} ms / errors &gt; {config.observability.alerts.errorRatePct}%
          </p>
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Run history</p>
        {runs.length === 0 && <p className="text-[11px] text-muted-foreground italic">No runs yet.</p>}
        {runs.map((r: any) => (
          <div key={r.id} className="rounded-lg border border-border p-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {r.passed ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <X className="h-3.5 w-3.5 text-destructive" />}
              <p className="font-medium text-foreground flex-1 truncate">{r.prompt}</p>
              {r.blockedBy && <Badge variant="destructive" className="text-[9px]">blocked: {r.blockedBy}</Badge>}
              <span className="text-[10px] text-muted-foreground">{r.latencyMs}ms · {(r.tokensIn ?? 0) + (r.tokensOut ?? 0)}t</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 pl-5">{r.actual}</p>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-white/5 mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <NumField label="Latency p95 alert (ms)" value={config.observability.alerts.latencyP95Ms}
          onChange={(v) => update({ observability: { ...config.observability, alerts: { ...config.observability.alerts, latencyP95Ms: v } } })} />
        <NumField label="Error rate alert (%)" value={config.observability.alerts.errorRatePct}
          onChange={(v) => update({ observability: { ...config.observability, alerts: { ...config.observability.alerts, errorRatePct: v } } })} />
        <NumField label="Log retention (days)" value={config.observability.retentionDays}
          onChange={(v) => update({ observability: { ...config.observability, retentionDays: v } })} />
      </div>
    </Card>
  );
}

/* ── 7. Widget & Deploy ── */
function StepWidget({ agentMeta, config, update, logAudit }: any) {
  const { config: bankCfg } = useWizard();
  const baseAgent: any = bankCfg.ai?.mesh?.agents?.[agentMeta.id as keyof typeof bankCfg.ai.mesh.agents];
  const [publishState, setPublishState] = useState<"idle" | "publishing" | "published" | "error">("idle");
  const [publishedAt, setPublishedAt] = useState<string | null>(null);

  const surfaces = ["home", "wallet", "loans", "cards", "investments"];
  const triggers = ["manual", "idle", "low_balance", "post_txn", "salary_credit"];
  const checks = [
    { ok: config.goLive.personaComplete, label: "Persona saved" },
    { ok: config.goLive.kbIndexed,       label: "KB indexed" },
    { ok: config.goLive.guardrailsReviewed, label: "Guardrails reviewed" },
    { ok: config.goLive.sandboxPassed,   label: "Sandbox passed" },
    { ok: config.widget.surfaces.length > 0, label: "Widget placed" },
  ];
  const allGo = checks.every((c) => c.ok);

  const loaderOrigin =
    (typeof window !== "undefined" && window.location.origin) ||
    "https://abxwallet.techurate.world";
  const supaUrl =
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    "https://sgjfidsnyxhjxkevjgje.supabase.co";
  const supaKey = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || "<anon-key>";
  // Minimal embed snippet — the loader sends only the agent id; the chat
  // function resolves persona, KB, and tools from public.bankgpt_agents.
  const snippet = `<script async src="${loaderOrigin}/embed/bankgpt.js"
  data-agent="${agentMeta.id}"
  data-style="${config.widget.style}"
  data-api="${supaUrl}"
  data-key="${supaKey}"
  data-language="en"></script>`;

  async function publishToRegistry() {
    setPublishState("publishing");
    try {
      const payload = {
        agentId: agentMeta.id,
        bankName: baseAgent?.bankName || agentMeta.bankName || bankCfg.bankName || "",
        name: baseAgent?.name || agentMeta.name,
        tagline: baseAgent?.tagline || agentMeta.tagline || "",
        systemPrompt: baseAgent?.systemPrompt || "",
        tone: baseAgent?.tone || { formal_casual: 50, terse_verbose: 50, reserved_expressive: 50 },
        usesEmoji: baseAgent?.usesEmoji ?? true,
        kb: { docs: config.kb.docs, topK: config.kb.topK },
        tools: Object.entries(config.tools)
          .filter(([, p]: any) => p.enabled)
          .map(([id, p]: any) => ({ id, label: id.replace(/_/g, " "), approval: p.approval, dailyLimit: p.dailyLimit })),
        widget: { style: config.widget.style, surfaces: config.widget.surfaces },
        guardrails: config.guardrails,
        published: true,
      };
      const res = await fetch(`${supaUrl}/functions/v1/bankgpt-publish-agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supaKey,
          Authorization: `Bearer ${supaKey}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setPublishState("published");
      setPublishedAt(data.agent?.published_at || new Date().toISOString());
      logAudit("agent.published_to_registry", agentMeta.id, { kbDocs: payload.kb.docs.length, tools: payload.tools.length });
      toast({ title: "Published for embed", description: `${agentMeta.name} is now resolvable by data-agent="${agentMeta.id}".` });
    } catch (e: any) {
      console.error("publish failed", e);
      setPublishState("error");
      toast({ title: "Publish failed", description: e?.message || "Could not reach the registry.", variant: "destructive" });
    }
  }

  return (
    <Card title="Widget & Deployment" desc="Where customers meet this agent inside the bank host app.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Field label="Widget style" full>
            <div className="grid grid-cols-3 gap-2">
              {(["bubble", "inline", "fullscreen"] as const).map((s) => (
                <button key={s} onClick={() => update({ widget: { ...config.widget, style: s } })}
                  className={`px-2 py-3 rounded-lg border text-xs capitalize ${
                    config.widget.style === s ? "border-tesfa-gold bg-tesfa-gold/10 text-tesfa-gold" : "border-border text-muted-foreground"
                  }`}>{s}</button>
              ))}
            </div>
          </Field>

          <Field label="Host surfaces" full>
            <div className="flex flex-wrap gap-1.5">
              {surfaces.map((s) => {
                const on = config.widget.surfaces.includes(s);
                return (
                  <button key={s} onClick={() => {
                    const next = on ? config.widget.surfaces.filter((x: string) => x !== s) : [...config.widget.surfaces, s];
                    update({ widget: { ...config.widget, surfaces: next }, goLive: { ...config.goLive, widgetPlaced: next.length > 0 } });
                    logAudit(on ? "widget.surface.removed" : "widget.surface.added", s);
                  }} className={`px-2.5 py-1 rounded-full text-[11px] capitalize ${
                    on ? "bg-tesfa-gold text-tesfa-dark" : "bg-white/5 text-muted-foreground"
                  }`}>{s}</button>
                );
              })}
            </div>
          </Field>

          <Field label="Triggers" full>
            <div className="flex flex-wrap gap-1.5">
              {triggers.map((t) => {
                const on = config.widget.triggers.includes(t);
                return (
                  <button key={t} onClick={() => {
                    const next = on ? config.widget.triggers.filter((x: string) => x !== t) : [...config.widget.triggers, t];
                    update({ widget: { ...config.widget, triggers: next } });
                    logAudit(on ? "widget.trigger.removed" : "widget.trigger.added", t);
                  }} className={`px-2.5 py-1 rounded-full text-[11px] ${
                    on ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground"
                  }`}>{t.replace(/_/g, " ")}</button>
                );
              })}
            </div>
          </Field>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-border p-3 bg-background/30">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Go-live checklist</p>
            <ul className="space-y-1">
              {checks.map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-xs">
                  {c.ok ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground" />}
                  <span className={c.ok ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Embed snippet</p>
              <button className="text-[10px] text-tesfa-gold hover:underline flex items-center gap-1"
                onClick={() => { navigator.clipboard.writeText(snippet); toast({ title: "Snippet copied" }); }}>
                <Copy className="h-3 w-3" /> Copy
              </button>
            </div>
            <pre className="text-[10px] leading-relaxed text-muted-foreground whitespace-pre-wrap break-all">{snippet}</pre>
          </div>

          <Button className="w-full" disabled={!allGo}
            onClick={() => {
              update({ widget: { ...config.widget, enabled: true }, goLive: { ...config.goLive, activated: true } });
              logAudit("agent.activated", agentMeta.id, { surfaces: config.widget.surfaces });
              toast({ title: "Agent activated", description: `${agentMeta.name} is now live on selected surfaces.` });
            }}>
            <ShieldCheck className="h-4 w-4 mr-1" />
            {allGo ? "Activate agent" : "Complete checklist to activate"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ── 8. Audit trail ── */
function StepAudit({ config }: { config: AgentBuilderConfig }) {
  function exportJson() {
    const blob = new Blob([JSON.stringify(config.audit, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `bankgpt-audit-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card title="Audit Trail" desc="Immutable log of every change to this agent. Newest first, last 200 entries.">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">{config.audit.length} entries</p>
        <Button size="sm" variant="outline" onClick={exportJson} disabled={!config.audit.length}>
          <Copy className="h-3 w-3 mr-1" /> Export JSON
        </Button>
      </div>
      <div className="space-y-1.5 max-h-[480px] overflow-auto pr-1">
        {config.audit.length === 0 && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground italic">
            <AlertTriangle className="h-3.5 w-3.5" /> No audit entries yet — interactions are recorded automatically.
          </div>
        )}
        {config.audit.map((e) => (
          <div key={e.id} className="rounded-md border border-border px-2 py-1.5 text-[11px] flex items-start gap-2">
            <ScrollText className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-tesfa-gold font-mono">{e.action}</code>
                {e.target && <span className="text-muted-foreground truncate">→ {e.target}</span>}
              </div>
              {e.details && Object.keys(e.details).length > 0 && (
                <p className="text-[10px] text-muted-foreground truncate">{JSON.stringify(e.details)}</p>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">{new Date(e.timestamp).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ───────────────────── shared atoms ───────────────────── */
function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );
}
function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "col-span-full space-y-1" : "space-y-1"}>
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <Field label={label}>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
    </Field>
  );
}
function ToneSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span><span className="text-foreground">{value}</span>
      </div>
      <Slider value={[value]} min={0} max={100} step={1} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}
function StatusPill({ status }: { status: KbDoc["status"] }) {
  const map: Record<KbDoc["status"], string> = {
    pending:  "bg-muted text-muted-foreground",
    checking: "bg-sky-500/20 text-sky-400 animate-pulse",
    indexing: "bg-amber-500/20 text-amber-400 animate-pulse",
    indexed:  "bg-emerald-500/20 text-emerald-400",
    error:    "bg-destructive/20 text-destructive",
  };
  return <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider ${map[status]}`}>{status}</span>;
}
function Footer({ onSave, saveLabel }: { onSave: () => void; saveLabel: string }) {
  return (
    <div className="flex justify-end pt-3 border-t border-white/5">
      <Button size="sm" onClick={onSave}><Check className="h-3.5 w-3.5 mr-1" /> {saveLabel}</Button>
    </div>
  );
}
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-2">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  );
}
function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-border p-3 gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
