/**
 * AIMeshStudio — The crown jewel of the ABX wizard.
 *
 * Three panes:
 *  • LEFT  — Mesh Canvas: animated SVG node graph of all 7 agents with handoff arrows.
 *  • MIDDLE — Config Panel: every property of the selected agent. Changes are live.
 *  • RIGHT — Live Simulation: a real chat. Admin types as customer, replies come from
 *            the configured agent. Keyword matches trigger animated handoffs that
 *            ripple across all three panes.
 *
 * The same agent identity is consumed by `TesfaAI` (the floating widget) so the
 * customer-facing experience is exactly what the admin rehearsed.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useWizard } from "@/contexts/BankConfigContext";
import type { MeshAgent, MeshAgentId } from "@/contexts/BankConfigContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Diamond } from "./AbxLogo";
import {
  Bot, Send, Sparkles, Lock, Play, RotateCcw, MessageSquare,
  CheckCircle2, Zap, User as UserIcon, Rocket
} from "lucide-react";
import OnboardingDemo from "./onboarding/OnboardingDemo";

/* ------------------------------------------------------------------ */
/*  Routing simulation (keyword-based for prototype fidelity)         */
/* ------------------------------------------------------------------ */
function routeIntent(
  text: string,
  agents: Record<MeshAgentId, MeshAgent>,
): MeshAgentId {
  const t = text.toLowerCase();
  // Skip concierge + notification (concierge is fallback; notification is outbound-only)
  const candidates: MeshAgentId[] = [
    "complaintAgent", "loanAgent", "savingsCoach",
    "investmentCoach", "onboarding",
  ];
  for (const id of candidates) {
    const a = agents[id];
    if (!a.enabled) continue;
    if (a.keywords.some((k) => t.includes(k))) return id;
  }
  return "concierge";
}

const PERSONAS: Record<string, { firstName: string; line: string; avatar: string }> = {
  Selam:  { firstName: "Selam",  line: "Urban hustler, 24, sends money weekly",  avatar: "S" },
  Bekele: { firstName: "Bekele", line: "Market trader, cash-heavy, needs credit", avatar: "B" },
  Tigist: { firstName: "Tigist", line: "Teacher, salaried, saving for school",    avatar: "T" },
  Dawit:  { firstName: "Dawit",  line: "Diaspora son, sends remittances home",    avatar: "D" },
};

const SCRIPTED_TOUR: { text: string; expect: MeshAgentId }[] = [
  { text: "Hi",                                  expect: "concierge" },
  { text: "I want to start saving for a phone",  expect: "savingsCoach" },
  { text: "Can I get a small loan?",             expect: "loanAgent" },
  { text: "Tell me about T-Bills",               expect: "investmentCoach" },
  { text: "My last transaction was wrong",       expect: "complaintAgent" },
];

/* ------------------------------------------------------------------ */
/*  Reusable bits                                                     */
/* ------------------------------------------------------------------ */
function ToneSlider({
  label, value, leftLabel, rightLabel, onChange,
}: { label: string; value: number; leftLabel: string; rightLabel: string; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] uppercase tracking-widest text-[var(--ink-soft)] mb-1.5">
        <span>{label}</span>
        <span className="font-mono">{value}</span>
      </div>
      <input type="range" min={0} max={100} value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full accent-[var(--teal-deep)]" />
      <div className="flex justify-between text-[9px] text-[var(--ink-soft)] mt-0.5">
        <span>{leftLabel}</span><span>{rightLabel}</span>
      </div>
    </div>
  );
}

function AgentChip({ a, size = 36 }: { a: MeshAgent; size?: number }) {
  return (
    <span
      className="grid place-items-center font-bold rounded-xl shrink-0"
      style={{
        width: size, height: size, background: a.color, color: "#fff",
        fontSize: size * 0.42, boxShadow: `0 4px 12px ${a.color}55`,
      }}
      aria-label={a.name}
    >
      {a.avatarStyle === "initial" ? a.name[0] : a.emoji}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Mesh Canvas (left pane)                                           */
/* ------------------------------------------------------------------ */
function MeshCanvas({
  agents, selected, onSelect, activeHandoff,
}: {
  agents: Record<MeshAgentId, MeshAgent>;
  selected: MeshAgentId;
  onSelect: (id: MeshAgentId) => void;
  activeHandoff: { from: MeshAgentId; to: MeshAgentId; at: number } | null;
}) {
  // Edges: concierge connects to every enabled non-concierge non-notification agent.
  // Notification stands alone (outbound). Complaint can also receive from any.
  const edges = useMemo(() => {
    const list: { from: MeshAgentId; to: MeshAgentId }[] = [];
    (Object.keys(agents) as MeshAgentId[]).forEach((id) => {
      if (id === "concierge" || id === "notificationAgent") return;
      if (!agents[id].enabled) return;
      list.push({ from: "concierge", to: id });
    });
    return list;
  }, [agents]);

  // SVG coordinate space 1000x600
  const W = 1000, H = 600;
  const toPx = (p: { x: number; y: number }) => ({ x: p.x * W, y: p.y * H });

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B1538] via-[#0E1A45] to-[#0B1538]">
      {/* dotted grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(rgba(45,212,191,0.25) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="absolute top-3 left-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--teal)]/90 font-mono">
        <Diamond className="w-3 h-3 diamond-spin" /> Mesh Canvas
      </div>
      <div className="absolute top-3 right-3 text-[10px] uppercase tracking-widest text-white/40 font-mono">
        {Object.values(agents).filter(a => a.enabled).length} / 7 agents · live
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full">
        <defs>
          {edges.map((e, i) => {
            const a = agents[e.from], b = agents[e.to];
            return (
              <linearGradient key={i} id={`edge-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={a.color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={b.color} stopOpacity="0.6" />
              </linearGradient>
            );
          })}
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="rgba(255,255,255,0.55)" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((e, i) => {
          const a = toPx(agents[e.from].position);
          const b = toPx(agents[e.to].position);
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2 - 30;
          const d = `M${a.x},${a.y} Q${midX},${midY} ${b.x},${b.y}`;
          const live = activeHandoff &&
            activeHandoff.from === e.from && activeHandoff.to === e.to;
          return (
            <g key={`${e.from}-${e.to}`}>
              <path d={d} fill="none" stroke={`url(#edge-${i})`}
                strokeWidth={live ? 3 : 1.2}
                strokeDasharray={live ? "0" : "5 6"}
                strokeLinecap="round"
                markerEnd="url(#arrow)"
                style={{
                  filter: live ? `drop-shadow(0 0 10px ${agents[e.from].color})` : undefined,
                  transition: "stroke-width 250ms",
                }}
              />
              {live && (
                <circle r="6" fill={agents[e.from].color}>
                  <animateMotion dur="0.9s" repeatCount="1" path={d} />
                </circle>
              )}
            </g>
          );
        })}
      </svg>

      {/* Nodes */}
      {(Object.keys(agents) as MeshAgentId[]).map((id) => {
        const a = agents[id];
        const p = toPx(a.position);
        const isSel = selected === id;
        const glow = activeHandoff && activeHandoff.to === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className="absolute group focus:outline-none"
            style={{
              left: `${(p.x / W) * 100}%`,
              top: `${(p.y / H) * 100}%`,
              transform: "translate(-50%, -50%)",
              opacity: a.enabled ? 1 : 0.35,
            }}
            aria-label={`Configure ${a.name}`}
          >
            <div
              className={`relative w-[148px] rounded-2xl backdrop-blur-md transition-all
                ${isSel ? "scale-105" : "group-hover:scale-105"}`}
              style={{
                background: `linear-gradient(180deg, ${a.color}22 0%, rgba(11,21,56,0.85) 100%)`,
                border: `1.5px solid ${isSel || glow ? a.color : "rgba(255,255,255,0.12)"}`,
                boxShadow: glow
                  ? `0 0 0 4px ${a.color}33, 0 12px 30px ${a.color}55`
                  : isSel
                  ? `0 10px 24px ${a.color}40`
                  : "0 6px 16px rgba(0,0,0,0.35)",
              }}
            >
              <div className="h-1 rounded-t-2xl" style={{ background: a.color }} />
              <div className="p-2.5">
                <div className="flex items-center gap-2">
                  <AgentChip a={a} size={32} />
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold text-white truncate">
                      {a.name}
                    </div>
                    <div className="text-[9px] uppercase tracking-widest text-white/50 truncate">
                      {a.id === "concierge" ? "Router" :
                       a.id === "notificationAgent" ? "Outbound" : "Specialist"}
                    </div>
                  </div>
                </div>
                {a.locked && (
                  <div className="absolute top-1.5 right-1.5">
                    <Lock className="w-3 h-3 text-white/45" />
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Config Panel (middle)                                             */
/* ------------------------------------------------------------------ */
function ConfigPanel({
  agent, onChange,
}: { agent: MeshAgent; onChange: (patch: Partial<MeshAgent>) => void }) {
  return (
    <div className="h-full overflow-y-auto bg-white border border-[var(--line)] rounded-2xl">
      <div className="sticky top-0 z-10 bg-white border-b border-[var(--line)] px-4 py-3 flex items-center gap-3">
        <AgentChip a={agent} size={40} />
        <div className="min-w-0 flex-1">
          <div className="font-serif text-lg leading-tight truncate">{agent.name}</div>
          <div className="text-[11px] text-[var(--ink-soft)] truncate">{agent.tagline}</div>
        </div>
        {!agent.locked ? (
          <button
            onClick={() => onChange({ enabled: !agent.enabled })}
            className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border transition
              ${agent.enabled
                ? "bg-[var(--teal)]/15 border-[var(--teal)]/40 text-[var(--teal-deep)]"
                : "bg-white border-[var(--line)] text-[var(--ink-soft)]"}`}
          >
            {agent.enabled ? "Enabled" : "Disabled"}
          </button>
        ) : (
          <span className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-[var(--ink)] text-[var(--cream)] inline-flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" /> Always on
          </span>
        )}
      </div>

      <div className="p-4 space-y-5">
        {/* Identity */}
        <section className="space-y-3">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--teal-deep)] font-mono">
            Identity
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-[var(--ink-soft)]">Name</span>
              <input value={agent.name}
                onChange={(e) => onChange({ name: e.target.value })}
                className="mt-1 w-full px-2.5 py-2 text-[13px] border border-[var(--line)] rounded-lg outline-none focus:border-[var(--ink)]" />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-[var(--ink-soft)]">Colour</span>
              <div className="mt-1 flex items-center gap-2 px-2 py-1.5 border border-[var(--line)] rounded-lg">
                <label className="relative w-7 h-7 rounded shrink-0 cursor-pointer" style={{ background: agent.color }}>
                  <input type="color" value={agent.color}
                    onChange={(e) => onChange({ color: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer" />
                </label>
                <input value={agent.color}
                  onChange={(e) => onChange({ color: e.target.value })}
                  className="flex-1 text-[12px] font-mono bg-transparent outline-none" />
              </div>
            </label>
          </div>
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-[var(--ink-soft)]">Tagline</span>
            <input value={agent.tagline}
              onChange={(e) => onChange({ tagline: e.target.value })}
              className="mt-1 w-full px-2.5 py-2 text-[13px] border border-[var(--line)] rounded-lg outline-none focus:border-[var(--ink)]" />
          </label>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--ink-soft)] mb-1.5">Avatar style</div>
            <div className="grid grid-cols-3 gap-1.5">
              {(["initial", "illustrated", "abstract"] as const).map(s => (
                <button key={s}
                  onClick={() => onChange({ avatarStyle: s })}
                  className={`text-[11px] py-1.5 rounded-lg border capitalize transition
                    ${agent.avatarStyle === s
                      ? "bg-[var(--ink)] text-[var(--cream)] border-[var(--ink)]"
                      : "bg-white border-[var(--line)] hover:border-[var(--ink)]/40"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Tone — three sliders */}
        <section className="space-y-3">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--teal-deep)] font-mono">
            Personality — moves live
          </div>
          <ToneSlider label="Register" value={agent.tone.formal_casual}
            leftLabel="formal" rightLabel="casual"
            onChange={(n) => onChange({ tone: { ...agent.tone, formal_casual: n } })} />
          <ToneSlider label="Length" value={agent.tone.terse_verbose}
            leftLabel="terse" rightLabel="verbose"
            onChange={(n) => onChange({ tone: { ...agent.tone, terse_verbose: n } })} />
          <ToneSlider label="Expressiveness" value={agent.tone.reserved_expressive}
            leftLabel="reserved" rightLabel="expressive"
            onChange={(n) => onChange({ tone: { ...agent.tone, reserved_expressive: n } })} />
          <label className="flex items-center justify-between p-2.5 bg-[var(--ivory)] rounded-lg">
            <span className="text-[12px]">Uses emoji</span>
            <button
              onClick={() => onChange({ usesEmoji: !agent.usesEmoji })}
              className={`relative w-9 h-5 rounded-full transition ${agent.usesEmoji ? "bg-[var(--ink)]" : "bg-[var(--line)]"}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${agent.usesEmoji ? "left-[18px]" : "left-0.5"}`}
                style={{ backgroundColor: agent.usesEmoji ? "var(--teal)" : "white" }} />
            </button>
          </label>
        </section>

        {/* Routing — only for non-concierge / non-notification */}
        {agent.id !== "concierge" && agent.id !== "notificationAgent" && (
          <section className="space-y-2">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--teal-deep)] font-mono">
              Handoff triggers
            </div>
            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-[var(--ink-soft)]">Keywords (comma-separated)</span>
              <textarea value={agent.keywords.join(", ")}
                onChange={(e) => onChange({
                  keywords: e.target.value.split(",").map(s => s.trim().toLowerCase()).filter(Boolean),
                })}
                rows={2}
                className="mt-1 w-full px-2.5 py-2 text-[12px] font-mono border border-[var(--line)] rounded-lg outline-none focus:border-[var(--ink)]" />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-[var(--ink-soft)]">Concierge handoff line</span>
              <input value={agent.handoffMessage}
                onChange={(e) => onChange({ handoffMessage: e.target.value })}
                className="mt-1 w-full px-2.5 py-2 text-[12px] italic border border-[var(--line)] rounded-lg outline-none focus:border-[var(--ink)]" />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-[var(--ink-soft)]">Agent's first message</span>
              <input value={agent.greetingOnHandoff}
                onChange={(e) => onChange({ greetingOnHandoff: e.target.value })}
                className="mt-1 w-full px-2.5 py-2 text-[12px] border border-[var(--line)] rounded-lg outline-none focus:border-[var(--ink)]" />
            </label>
          </section>
        )}

        {/* System prompt */}
        <section className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--teal-deep)] font-mono">
            System prompt
          </div>
          <textarea value={agent.systemPrompt}
            onChange={(e) => onChange({ systemPrompt: e.target.value })}
            rows={3}
            className="w-full px-2.5 py-2 text-[12px] font-mono border border-[var(--line)] rounded-lg outline-none focus:border-[var(--ink)]" />
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Live Simulation (right)                                            */
/* ------------------------------------------------------------------ */
type ChatMsg =
  | { kind: "user"; text: string }
  | { kind: "agent"; agentId: MeshAgentId; text: string }
  | { kind: "handoff"; from: MeshAgentId; to: MeshAgentId; text: string };

function pickReply(a: MeshAgent, firstName: string): string {
  const raw = a.sampleReplies[Math.floor(Math.random() * a.sampleReplies.length)];
  return raw.replace(/{firstName}/g, firstName);
}

function Simulation({
  agents, persona, setPersona, onSelectAgent, onHandoffFire, bankName, onLaunchOnboarding,
}: {
  agents: Record<MeshAgentId, MeshAgent>;
  persona: string;
  setPersona: (p: string) => void;
  onSelectAgent: (id: MeshAgentId) => void;
  onHandoffFire: (from: MeshAgentId, to: MeshAgentId) => void;
  bankName: string;
  onLaunchOnboarding: () => void;
}) {
  const p = PERSONAS[persona] ?? PERSONAS.Selam;
  const [messages, setMessages] = useState<ChatMsg[]>([
    { kind: "agent", agentId: "concierge",
      text: agents.concierge.sampleReplies[0].replace(/{firstName}/g, p.firstName) },
  ]);
  const [input, setInput] = useState("");
  const [currentAgent, setCurrentAgent] = useState<MeshAgentId>("concierge");
  const [typing, setTyping] = useState<MeshAgentId | null>(null);
  const [tourRunning, setTourRunning] = useState(false);
  const [tourResults, setTourResults] = useState<{ ok: boolean; expected: MeshAgentId; got: MeshAgentId }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  // Reset greeting when persona changes so the agent addresses the new user by name
  useEffect(() => {
    setMessages([{ kind: "agent", agentId: "concierge",
      text: agents.concierge.sampleReplies[0].replace(/{firstName}/g, p.firstName) }]);
    setCurrentAgent("concierge");
    setTyping(null);
    setTourResults([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona]);

  const reset = () => {
    setMessages([{ kind: "agent", agentId: "concierge",
      text: agents.concierge.sampleReplies[0].replace(/{firstName}/g, p.firstName) }]);
    setCurrentAgent("concierge");
    setTyping(null);
    setTourResults([]);
  };

  const callMesh = async (history: ChatMsg[], fromAgent: MeshAgentId) => {
    const payloadMessages = history
      .filter((m) => m.kind === "user" || m.kind === "agent")
      .map((m) =>
        m.kind === "user"
          ? { role: "user" as const, content: m.text }
          : { role: "assistant" as const, content: m.text, agentName: agents[m.agentId].name },
      );

    const { data, error } = await supabase.functions.invoke("mesh-chat", {
      body: {
        agents,
        currentAgentId: fromAgent,
        persona: { firstName: p.firstName, line: p.line },
        bankName,
        messages: payloadMessages,
      },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data as { targetAgentId: MeshAgentId; handoff: { to: MeshAgentId; text: string } | null; reply: string };
  };

  const submit = async (text: string) => {
    if (!text.trim() || typing) return;
    const userMsg: ChatMsg = { kind: "user", text };
    const next = [...messages, userMsg];
    setMessages(next);

    // Show typing on best-guess target immediately for snappier UX
    const guess = routeIntent(text, agents);
    setTyping(guess);

    try {
      const res = await callMesh(next, currentAgent);
      const target = (res.targetAgentId || guess) as MeshAgentId;
      const handingOff = target !== currentAgent && target !== "concierge";

      setMessages((m) => {
        const out = [...m];
        if (res.handoff && handingOff) {
          out.push({ kind: "handoff", from: "concierge", to: target, text: res.handoff.text });
          onHandoffFire("concierge", target);
        } else if (target !== "concierge" && target !== currentAgent) {
          onHandoffFire(currentAgent, target);
        }
        out.push({ kind: "agent", agentId: target, text: res.reply });
        return out;
      });
      setCurrentAgent(target);
      onSelectAgent(target);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to reach the AI mesh";
      toast.error(msg);
      setMessages((m) => [...m, {
        kind: "agent", agentId: currentAgent,
        text: `⚠️ Couldn't reach the AI gateway: ${msg}`,
      }]);
    } finally {
      setTyping(null);
    }
  };

  const runTour = async () => {
    setTourRunning(true);
    setTourResults([]);
    reset();
    await new Promise(r => setTimeout(r, 300));
    for (const step of SCRIPTED_TOUR) {
      await submit(step.text);
      const got = routeIntent(step.text, agents);
      setTourResults((rs) => [...rs, { ok: got === step.expect, expected: step.expect, got }]);
      await new Promise(r => setTimeout(r, 300));
    }
    setTourRunning(false);
  };

  const active = agents[currentAgent];

  return (
    <div className="h-full flex flex-col rounded-2xl bg-white border border-[var(--line)] overflow-hidden">
      {/* Persona bar */}
      <div className="px-3 py-2 border-b border-[var(--line)] bg-[var(--ivory)] flex items-center gap-2">
        <span className="text-[9px] uppercase tracking-widest text-[var(--ink-soft)] font-mono">Acting as</span>
        <div className="flex gap-1">
          {Object.keys(PERSONAS).map((k) => (
            <button key={k} onClick={() => { setPersona(k); reset(); }}
              className={`text-[11px] px-2 py-0.5 rounded-full border transition
                ${persona === k
                  ? "bg-[var(--ink)] text-[var(--cream)] border-[var(--ink)]"
                  : "bg-white border-[var(--line)] hover:border-[var(--ink)]/40"}`}>
              {k}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[10px] text-[var(--ink-soft)] truncate hidden md:inline">{p.line}</span>
      </div>

      {/* Active agent strip */}
      <div className="px-3 py-2 border-b border-[var(--line)] flex items-center gap-2"
        style={{ background: `${active.color}10`, borderLeft: `3px solid ${active.color}` }}>
        <AgentChip a={active} size={26} />
        <div className="min-w-0">
          <div className="text-[12px] font-semibold leading-tight truncate">{active.name}</div>
          <div className="text-[9px] uppercase tracking-widest text-[var(--ink-soft)]">talking now</div>
        </div>
        <button
          onClick={runTour}
          disabled={tourRunning}
          className="ml-auto text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-[var(--ink)] text-[var(--cream)] inline-flex items-center gap-1 disabled:opacity-50"
          title="Pre-scripted run-through that hits every handoff path"
        >
          <Play className="w-2.5 h-2.5" /> {tourRunning ? "Running…" : "Test all handoffs"}
        </button>
        <button onClick={reset} title="Reset chat"
          className="text-[10px] px-2 py-1 rounded-full border border-[var(--line)] hover:border-[var(--ink)]/40">
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[var(--ivory)]/40">
        {messages.map((m, i) => {
          if (m.kind === "handoff") {
            const to = agents[m.to];
            return (
              <div key={i} className="my-2">
                <div className="mx-auto max-w-[85%] px-3 py-2 rounded-xl text-center text-[11px] flex items-center justify-center gap-2"
                  style={{ background: `${to.color}18`, color: to.color, border: `1px dashed ${to.color}55` }}>
                  <Zap className="w-3 h-3" />
                  <span className="italic">{m.text}</span>
                </div>
              </div>
            );
          }
          if (m.kind === "user") {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[78%] px-3 py-2 rounded-2xl rounded-br-sm text-[12.5px] bg-[var(--ink)] text-[var(--cream)]">
                  {m.text}
                </div>
              </div>
            );
          }
          const a = agents[m.agentId];
          return (
            <div key={i} className="flex items-end gap-2">
              <AgentChip a={a} size={22} />
              <div className="max-w-[78%] px-3 py-2 rounded-2xl rounded-bl-sm text-[12.5px] bg-white border"
                style={{ borderLeft: `3px solid ${a.color}` }}>
                <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: a.color }}>{a.name}</div>
                {m.text}
              </div>
            </div>
          );
        })}
        {typing && (
          <div className="flex items-end gap-2">
            <AgentChip a={agents[typing]} size={22} />
            <div className="px-3 py-2 rounded-2xl rounded-bl-sm bg-white border" style={{ borderLeft: `3px solid ${agents[typing].color}` }}>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink-soft)] animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink-soft)] animate-bounce" style={{ animationDelay: "120ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink-soft)] animate-bounce" style={{ animationDelay: "240ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Tour results */}
      {tourResults.length > 0 && (
        <div className="px-3 py-2 border-t border-[var(--line)] bg-white">
          <div className="text-[9px] uppercase tracking-widest text-[var(--ink-soft)] mb-1">Handoff validation</div>
          <div className="flex flex-wrap gap-1.5">
            {tourResults.map((r, i) => (
              <span key={i}
                className={`text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1
                  ${r.ok ? "bg-[var(--teal)]/15 text-[var(--teal-deep)]" : "bg-red-50 text-red-600"}`}>
                <CheckCircle2 className="w-2.5 h-2.5" />
                {agents[r.got].name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => { e.preventDefault(); submit(input); setInput(""); }}
        className="flex items-center gap-2 p-2 border-t border-[var(--line)] bg-white">
        <UserIcon className="w-4 h-4 text-[var(--ink-soft)] ml-1" />
        <input value={input} onChange={(e) => setInput(e.target.value)}
          placeholder={`Type as ${p.firstName}…`}
          className="flex-1 px-2 py-2 text-[13px] outline-none placeholder:text-[var(--ink-soft)]" />
        <button type="submit"
          className="px-3 py-2 rounded-lg bg-[var(--ink)] text-[var(--cream)] inline-flex items-center gap-1.5 text-[12px]">
          <Send className="w-3.5 h-3.5" /> Send
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shell                                                              */
/* ------------------------------------------------------------------ */
export function AIMeshStudio() {
  const { config, setConfig } = useWizard();
  const mesh = config.ai.mesh;
  const [selected, setSelected] = useState<MeshAgentId>("concierge");
  const [persona, setPersona] = useState<string>(mesh.defaultPersona);
  const [activeHandoff, setActiveHandoff] = useState<{ from: MeshAgentId; to: MeshAgentId; at: number } | null>(null);
  const [activePane, setActivePane] = useState<"canvas" | "config" | "sim">("canvas");

  const patchAgent = (id: MeshAgentId, patch: Partial<MeshAgent>) => {
    setConfig({
      ...config,
      ai: {
        ...config.ai,
        mesh: {
          ...mesh,
          agents: {
            ...mesh.agents,
            [id]: { ...mesh.agents[id], ...patch },
          },
        },
      },
    });
  };

  const fireHandoff = (from: MeshAgentId, to: MeshAgentId) => {
    setActiveHandoff({ from, to, at: Date.now() });
    window.setTimeout(() => setActiveHandoff(null), 1400);
  };

  const enabledCount = Object.values(mesh.agents).filter((a) => a.enabled).length;

  const PaneTab = ({ id, label }: { id: "canvas" | "config" | "sim"; label: string }) => (
    <button
      onClick={() => setActivePane(id)}
      className={`flex-1 text-[11px] uppercase tracking-widest px-3 py-2 rounded-lg border transition truncate
        ${activePane === id
          ? "bg-[var(--ink)] text-[var(--cream)] border-[var(--ink)]"
          : "bg-white border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--ink)]/40"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="-mx-8 md:-mx-14 -my-14 px-4 md:px-6 py-6 min-h-[calc(100vh-140px)] bg-[var(--ivory)]/40">
      {/* Title strip */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[var(--teal-deep)]">
            <Diamond className="w-3 h-3 diamond-spin" /> WAM · AI Mesh Studio
          </div>
          <h1 className="mt-1.5 font-serif text-2xl md:text-3xl leading-[1.05] text-balance">
            Configure your agents by <em className="not-italic text-[var(--teal-deep)]">talking to them</em>.
          </h1>
          <p className="mt-1.5 text-[12px] text-[var(--ink-soft)] max-w-2xl">
            Switch between the mesh canvas, agent config, and live simulation below.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-mono">
          <span className="px-2.5 py-1 rounded-full bg-[var(--ink)] text-[var(--cream)] inline-flex items-center gap-1">
            <Bot className="w-3 h-3" /> {enabledCount}/7 live
          </span>
          <span className="px-2.5 py-1 rounded-full border border-[var(--line)] bg-white inline-flex items-center gap-1 text-[var(--ink-soft)]">
            <MessageSquare className="w-3 h-3" /> {persona}
          </span>
        </div>
      </div>

      {/* Pane switcher */}
      <div className="flex gap-2 mb-3 sticky top-0 z-20 bg-[var(--ivory)]/80 backdrop-blur-sm py-2 rounded-lg">
        <PaneTab id="canvas" label="Mesh Canvas" />
        <PaneTab id="config" label={`Config · ${mesh.agents[selected].name}`} />
        <PaneTab id="sim" label="Live Sim" />
      </div>

      {/* Active pane — full width */}
      <div className="h-[calc(100vh-280px)] min-h-[520px]">
        {activePane === "canvas" && (
          <MeshCanvas
            agents={mesh.agents}
            selected={selected}
            onSelect={(id) => { setSelected(id); setActivePane("config"); }}
            activeHandoff={activeHandoff}
          />
        )}
        {activePane === "config" && (
          <ConfigPanel
            agent={mesh.agents[selected]}
            onChange={(patch) => patchAgent(selected, patch)}
          />
        )}
        {activePane === "sim" && (
          <Simulation
            bankName={config.bank.name}
            agents={mesh.agents}
            persona={persona}
            setPersona={(p) => setPersona(p)}
            onSelectAgent={setSelected}
            onHandoffFire={(from, to) => fireHandoff(from, to)}
          />
        )}
      </div>

      {/* Footnote */}
      <div className="mt-4 p-3 rounded-xl bg-white border border-[var(--line)] flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-[var(--teal-deep)] mt-0.5 shrink-0" />
        <div className="text-[12px] text-[var(--ink-soft)] leading-relaxed">
          <strong className="text-[var(--ink)]">Every change goes live.</strong> The floating Global AI widget reads from this config — agent name, colour, tone, handoff lines. Rehearse here; ship unchanged.
        </div>
      </div>
    </div>
  );
}

export default AIMeshStudio;
