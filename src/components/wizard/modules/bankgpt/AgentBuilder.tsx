/**
 * BankGPT Agent Builder
 * Six-step wizard for defining or refining any AI Mesh agent:
 *   1. Persona  2. Intents  3. Knowledge Base (RAG)
 *   4. Tools    5. Sandbox  6. Widget & Deployment
 */
import { useMemo, useState } from "react";
import {
  User, Target, BookOpen, Wrench, FlaskConical, LayoutGrid,
  Plus, Check, Upload, FileText, Link as LinkIcon, Trash2, Play,
  Copy, Sparkles, ShieldCheck, X, RotateCw,
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
  useAgentBuilder, useCustomAgents, defaultBuilderConfig,
  type AgentBuilderConfig, type ToolId, type KbDoc,
} from "./agentBuilderStore";

const STEPS = [
  { id: "persona", label: "Persona",    icon: User },
  { id: "intents", label: "Intents",    icon: Target },
  { id: "kb",      label: "Knowledge",  icon: BookOpen },
  { id: "tools",   label: "Tools",      icon: Wrench },
  { id: "sandbox", label: "Sandbox",    icon: FlaskConical },
  { id: "widget",  label: "Deploy",     icon: LayoutGrid },
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
  const { config: bankCfg } = useWizard();
  const { customAgents, add: addCustom, remove: removeCustom } = useCustomAgents();
  const roster = useMemo(() => {
    const base = Object.values(bankCfg.ai.mesh.agents).map((a) => ({
      id: a.id, name: a.name, tagline: a.tagline, color: a.color, emoji: a.emoji, custom: false,
    }));
    return [...base, ...customAgents.map((a) => ({ ...a, custom: true }))];
  }, [bankCfg.ai.mesh.agents, customAgents]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [step, setStep] = useState<StepId>("persona");

  if (!activeId) {
    return (
      <RosterPicker
        roster={roster}
        onPick={(id) => { setActiveId(id); setStep("persona"); }}
        onNew={() => {
          const id = addCustom({
            name: "New Agent",
            tagline: "Describe what this agent does.",
            color: "#6366F1",
            emoji: "✨",
          });
          setActiveId(id); setStep("persona");
          toast({ title: "New agent created", description: "Configure its persona to begin." });
        }}
        onDelete={removeCustom}
      />
    );
  }

  const agentMeta = roster.find((a) => a.id === activeId)!;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between glass rounded-xl p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg text-base font-bold text-white"
               style={{ background: agentMeta.color }}>
            {agentMeta.emoji}
          </div>
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
                <button
                  key={s.id}
                  onClick={() => setStep(s.id)}
                  className={`flex w-full items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    active ? "bg-gradient-gold text-tesfa-dark" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
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

function RosterPicker({ roster, onPick, onNew, onDelete }: {
  roster: { id: string; name: string; tagline: string; color: string; emoji: string; custom: boolean }[];
  onPick: (id: string) => void; onNew: () => void; onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="glass rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-tesfa-gold mt-0.5" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground mb-1">Agent Builder — full lifecycle control</p>
            Define persona, ground in your own docs (RAG), wire bank tools with approval policies,
            test in a sandbox, then deploy as a widget into any host-app screen.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          onClick={onNew}
          className="glass rounded-xl p-4 border-2 border-dashed border-tesfa-gold/40 hover:border-tesfa-gold transition flex flex-col items-center justify-center gap-2 min-h-[140px] text-tesfa-gold"
        >
          <Plus className="h-6 w-6" />
          <span className="text-sm font-bold">New Agent</span>
          <span className="text-[10px] text-muted-foreground">Start from a blank persona</span>
        </button>

        {roster.map((a) => (
          <div key={a.id} className="glass rounded-xl p-4 hover:bg-white/[0.02] transition group">
            <button onClick={() => onPick(a.id)} className="w-full text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg text-base font-bold text-white shrink-0"
                     style={{ background: a.color }}>
                  {a.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{a.tagline}</p>
                </div>
              </div>
            </button>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <Badge variant="secondary" className="text-[9px]">
                {a.custom ? "Custom" : "Built-in"}
              </Badge>
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
  const { config, update } = useAgentBuilder(agentId);

  switch (step) {
    case "persona":  return <StepPersona agentMeta={agentMeta} config={config} update={update} />;
    case "intents":  return <StepIntents config={config} update={update} />;
    case "kb":       return <StepKB config={config} update={update} />;
    case "tools":    return <StepTools config={config} update={update} />;
    case "sandbox":  return <StepSandbox agentMeta={agentMeta} config={config} update={update} />;
    case "widget":   return <StepWidget agentMeta={agentMeta} config={config} update={update} />;
  }
}

/* ── 1. Persona ── */
function StepPersona({ agentMeta, config, update }: any) {
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
        ai: {
          ...bankCfg.ai,
          mesh: {
            ...bankCfg.ai.mesh,
            agents: {
              ...bankCfg.ai.mesh.agents,
              [agentMeta.id]: { ...baseAgent, ...draft },
            },
          },
        },
      });
    }
    update({ goLive: { ...config.goLive, personaComplete: true } });
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
function StepIntents({ config, update }: { config: AgentBuilderConfig; update: (p: any) => void }) {
  const [kw, setKw] = useState("");
  const [utter, setUtter] = useState("");

  return (
    <Card title="Intent & Routing" desc="What triggers this agent, and when to escalate.">
      <Field label="Trigger keywords (press Enter to add)" full>
        <div className="flex gap-2 mb-2 flex-wrap">
          {config.intents.keywords.map((k) => (
            <Badge key={k} variant="secondary" className="cursor-pointer" onClick={() =>
              update({ intents: { ...config.intents, keywords: config.intents.keywords.filter((x) => x !== k) } })
            }>{k} <X className="h-3 w-3 ml-1" /></Badge>
          ))}
        </div>
        <Input value={kw} onChange={(e) => setKw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && kw.trim()) {
              update({ intents: { ...config.intents, keywords: [...config.intents.keywords, kw.trim().toLowerCase()] } });
              setKw("");
            }
          }} placeholder="loan, borrow, credit…" />
      </Field>

      <Field label="Sample utterances (one per line)" full>
        <Textarea rows={4} value={config.intents.sampleUtterances.join("\n")}
          onChange={(e) => update({ intents: { ...config.intents, sampleUtterances: e.target.value.split("\n").filter(Boolean) } })}
          placeholder="I need money urgently\nCan I get a small loan?\nHow much can I borrow?" />
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

/* ── 3. Knowledge Base ── */
function StepKB({ config, update }: { config: AgentBuilderConfig; update: (p: any) => void }) {
  function addDoc(type: KbDoc["type"]) {
    const name = type === "url"
      ? prompt("Document URL?") ?? ""
      : prompt(`Filename (.${type})?`) ?? "";
    if (!name) return;
    const doc: KbDoc = {
      id: `doc-${Date.now()}`, name, type,
      size: type === "url" ? "—" : `${Math.floor(Math.random() * 400 + 50)} KB`,
      status: "pending", enabled: true,
    };
    update({ kb: { ...config.kb, docs: [...config.kb.docs, doc] } });
  }

  function reindex(id?: string) {
    update((c: AgentBuilderConfig) => ({
      ...c,
      kb: {
        ...c.kb,
        docs: c.kb.docs.map((d) => (id && d.id !== id) ? d : ({ ...d, status: "indexing" })),
      },
    }));
    setTimeout(() => {
      update((c: AgentBuilderConfig) => ({
        ...c,
        kb: {
          ...c.kb,
          lastIndexedAt: new Date().toISOString(),
          docs: c.kb.docs.map((d) => (id && d.id !== id) ? d : ({
            ...d, status: "indexed",
            chunks: Math.floor(Math.random() * 80 + 20),
            tokens: Math.floor(Math.random() * 18000 + 4000),
            indexedAt: new Date().toISOString(),
          })),
        },
        goLive: { ...c.goLive, kbIndexed: true },
      }));
      toast({ title: "Indexing complete", description: "Vector store refreshed." });
    }, 1400);
  }

  return (
    <Card title="Knowledge Base (RAG)" desc="Ground the agent in your bank's own docs.">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => addDoc("pdf")}><Upload className="h-3.5 w-3.5 mr-1" /> Add PDF</Button>
        <Button size="sm" variant="outline" onClick={() => addDoc("docx")}><FileText className="h-3.5 w-3.5 mr-1" /> Add DOCX</Button>
        <Button size="sm" variant="outline" onClick={() => addDoc("txt")}><FileText className="h-3.5 w-3.5 mr-1" /> Add TXT</Button>
        <Button size="sm" variant="outline" onClick={() => addDoc("url")}><LinkIcon className="h-3.5 w-3.5 mr-1" /> Add URL</Button>
        <Button size="sm" className="ml-auto" onClick={() => reindex()} disabled={!config.kb.docs.length}>
          <RotateCw className="h-3.5 w-3.5 mr-1" /> Index all
        </Button>
      </div>

      <div className="space-y-2 mt-3">
        {config.kb.docs.length === 0 && (
          <p className="text-[11px] text-muted-foreground italic">No documents yet. Add PDFs, DOCX, TXT or URLs to ground replies in your own content.</p>
        )}
        {config.kb.docs.map((d) => (
          <div key={d.id} className="flex items-center gap-2 rounded-lg border border-border p-2 text-xs">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{d.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {d.type.toUpperCase()} · {d.size}
                {d.chunks ? ` · ${d.chunks} chunks · ${d.tokens?.toLocaleString()} tokens` : ""}
              </p>
            </div>
            <StatusPill status={d.status} />
            <Switch checked={d.enabled} onCheckedChange={(v) =>
              update({ kb: { ...config.kb, docs: config.kb.docs.map((x) => x.id === d.id ? { ...x, enabled: v } : x) } })
            } />
            <button onClick={() => reindex(d.id)} className="text-muted-foreground hover:text-foreground"><RotateCw className="h-3 w-3" /></button>
            <button onClick={() =>
              update({ kb: { ...config.kb, docs: config.kb.docs.filter((x) => x.id !== d.id) } })
            } className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
          </div>
        ))}
      </div>

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
        <p className="text-[10px] text-muted-foreground mt-2">
          Last indexed {new Date(config.kb.lastIndexedAt).toLocaleString()}
        </p>
      )}
    </Card>
  );
}

/* ── 4. Tools ── */
function StepTools({ config, update }: { config: AgentBuilderConfig; update: (p: any) => void }) {
  return (
    <Card title="Tools & Actions" desc="What the agent is allowed to do, and under what policy.">
      <div className="space-y-2">
        {(Object.keys(TOOL_META) as ToolId[]).map((id) => {
          const t = config.tools[id];
          const meta = TOOL_META[id];
          return (
            <div key={id} className="rounded-lg border border-border p-3">
              <div className="flex items-start gap-3">
                <Switch checked={t.enabled} onCheckedChange={(v) =>
                  update({ tools: { ...config.tools, [id]: { ...t, enabled: v } } })
                } />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                  <p className="text-[11px] text-muted-foreground">{meta.desc}</p>
                </div>
              </div>
              {t.enabled && (
                <div className="grid grid-cols-2 gap-2 mt-3 pl-12">
                  <Field label="Approval policy">
                    <select value={t.approval} className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
                      onChange={(e) => update({ tools: { ...config.tools, [id]: { ...t, approval: e.target.value as any } } })}>
                      <option value="auto">Auto-execute</option>
                      <option value="confirm">Confirm with user</option>
                      <option value="admin">Admin-only</option>
                    </select>
                  </Field>
                  {(id === "move_money" || id === "buy_tbill" || id === "repay_loan") && (
                    <NumField label="Daily limit (ETB)" value={t.dailyLimit ?? 0} onChange={(v) =>
                      update({ tools: { ...config.tools, [id]: { ...t, dailyLimit: v } } })} />
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

/* ── 5. Sandbox ── */
function StepSandbox({ agentMeta, config, update }: any) {
  const [prompt, setPrompt] = useState("");
  const [expected, setExpected] = useState("");
  const [running, setRunning] = useState(false);

  function run() {
    if (!prompt) return;
    setRunning(true);
    setTimeout(() => {
      const actual = `[${agentMeta.name}] Simulated reply for "${prompt.slice(0, 60)}". (Real run uses live mesh-chat function.)`;
      const passed = expected ? actual.toLowerCase().includes(expected.toLowerCase()) : true;
      update({
        sandbox: { runs: [{ id: `run-${Date.now()}`, prompt, expected, actual, passed, timestamp: new Date().toISOString() }, ...config.sandbox.runs].slice(0, 20) },
        goLive: { ...config.goLive, sandboxPassed: passed || config.goLive.sandboxPassed },
      });
      setRunning(false);
      setPrompt(""); setExpected("");
    }, 700);
  }

  return (
    <Card title="Sandbox Testing" desc="Try the agent in isolation. Save runs as regression cases.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Field label="Test prompt" full><Textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} /></Field>
          <Field label="Expected (substring match — optional)" full><Input value={expected} onChange={(e) => setExpected(e.target.value)} /></Field>
          <Button size="sm" onClick={run} disabled={running || !prompt}>
            <Play className="h-3.5 w-3.5 mr-1" /> {running ? "Running…" : "Run test"}
          </Button>
        </div>
        <div className="rounded-lg border border-border p-3 bg-background/30">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Agent inspector</p>
          <ul className="text-[11px] space-y-1 text-muted-foreground">
            <li>• Intent: <span className="text-foreground">{prompt ? "auto-routed" : "—"}</span></li>
            <li>• KB chunks matched: <span className="text-foreground">{config.kb.docs.filter((d: any) => d.status === "indexed").length ? config.kb.topK : 0}</span></li>
            <li>• Enabled tools: <span className="text-foreground">{Object.values(config.tools).filter((t: any) => t.enabled).length}</span></li>
            <li>• Latency target: <span className="text-foreground">&lt; 900ms</span></li>
          </ul>
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Run history</p>
        {config.sandbox.runs.length === 0 && <p className="text-[11px] text-muted-foreground italic">No runs yet.</p>}
        {config.sandbox.runs.map((r: any) => (
          <div key={r.id} className="rounded-lg border border-border p-2 text-xs">
            <div className="flex items-center gap-2">
              {r.passed ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <X className="h-3.5 w-3.5 text-destructive" />}
              <p className="font-medium text-foreground flex-1 truncate">{r.prompt}</p>
              <span className="text-[10px] text-muted-foreground">{new Date(r.timestamp).toLocaleTimeString()}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 pl-5">{r.actual}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── 6. Widget & Deploy ── */
function StepWidget({ agentMeta, config, update }: any) {
  const surfaces = ["home", "wallet", "loans", "cards", "investments"];
  const triggers = ["manual", "idle", "low_balance", "post_txn", "salary_credit"];
  const checks = [
    { ok: config.goLive.personaComplete, label: "Persona saved" },
    { ok: config.goLive.kbIndexed,       label: "KB indexed" },
    { ok: config.goLive.sandboxPassed,   label: "Sandbox passed" },
    { ok: config.widget.surfaces.length > 0, label: "Widget placed" },
  ];
  const allGo = checks.every((c) => c.ok);

  const snippet = `<script src="https://cdn.globalpay.et/bankgpt.js"
  data-agent="${agentMeta.id}"
  data-style="${config.widget.style}"
  data-surfaces="${config.widget.surfaces.join(",")}"></script>`;

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
                  <button key={s} onClick={() => update({
                    widget: { ...config.widget, surfaces: on ? config.widget.surfaces.filter((x: string) => x !== s) : [...config.widget.surfaces, s] },
                    goLive: { ...config.goLive, widgetPlaced: true },
                  })} className={`px-2.5 py-1 rounded-full text-[11px] capitalize ${
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
                  <button key={t} onClick={() => update({
                    widget: { ...config.widget, triggers: on ? config.widget.triggers.filter((x: string) => x !== t) : [...config.widget.triggers, t] },
                  })} className={`px-2.5 py-1 rounded-full text-[11px] ${
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
  const map = {
    pending:  "bg-muted text-muted-foreground",
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
