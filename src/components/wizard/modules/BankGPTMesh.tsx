/**
 * BankGPTMesh — the live AI Mesh experience
 * ─────────────────────────────────────────────────────────────
 * What the bank's customer sees when BankGPT is enabled and the
 * module goes live. Shows the active agents in the left rail
 * (with the customer 360 underneath), a chat surface in the
 * centre, and proactive nudges streamed in by the relevant agent
 * the moment the screen opens.
 *
 * Routing + replies are powered by the `mesh-chat` edge function
 * which reads the customer snapshot from our synthetic CDP. Voice
 * playback uses the `elevenlabs-tts` function — Sarah multilingual
 * speaks English and Amharic with the same voice.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Volume2, Languages, Sparkles, Zap, User2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBankConfig, type MeshAgentId } from "@/contexts/BankConfigContext";
import {
  SYNTHETIC_CUSTOMERS,
  customerSnapshot,
  detectLang,
  nudgesForAgent,
  type CustomerProfile,
} from "@/platform/customerDataPlatform";

const AGENT_ORDER: MeshAgentId[] = [
  "concierge", "onboarding", "savingsCoach", "investmentCoach",
  "loanAgent", "complaintAgent", "notificationAgent",
];

type Msg =
  | { kind: "agent"; agentId: MeshAgentId; text: string; lang: "en" | "am" }
  | { kind: "user"; text: string }
  | { kind: "handoff"; to: MeshAgentId; text: string };

const SUGGESTIONS_EN = [
  "How is my spending this month?",
  "I want to save for a trip",
  "Can I get a small loan?",
  "Tell me about T-Bills",
  "There's a wrong charge on my card",
];
const SUGGESTIONS_AM = [
  "የዚህ ወር ወጪዬ እንዴት ነው?",
  "ለጉዞ ቁጠባ መጀመር እፈልጋለሁ",
  "ትንሽ ብድር ማግኘት እችላለሁ?",
  "ስለ T-Bills ንገረኝ",
  "የተሳሳተ ክፍያ አለ",
];

export function BankGPTMesh() {
  const cfg = useBankConfig();
  const mesh = cfg.ai.mesh;

  const [customer, setCustomer] = useState<CustomerProfile>(SYNTHETIC_CUSTOMERS[0]);
  const [lang, setLang] = useState<"en" | "am">(customer.language);
  const [currentAgent, setCurrentAgent] = useState<MeshAgentId>("concierge");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const enabledAgents = useMemo(
    () => AGENT_ORDER.filter((id) => mesh.agents[id].enabled),
    [mesh.agents],
  );

  // Seed proactive nudges + greeting when customer / lang changes
  useEffect(() => {
    const concierge = mesh.agents.concierge;
    const greet = (lang === "am"
      ? `ሰላም ${customer.firstName}! እኔ ${concierge.name} ነኝ — BankGPT።`
      : `Hi ${customer.firstName}! I'm ${concierge.name} — your BankGPT concierge.`);
    const seed: Msg[] = [{ kind: "agent", agentId: "concierge", text: greet, lang }];

    // Pick the most relevant proactive nudge from any enabled specialist
    for (const id of enabledAgents) {
      if (id === "concierge" || id === "notificationAgent") continue;
      const nudges = nudgesForAgent(id, customer, lang);
      if (nudges.length) {
        seed.push({
          kind: "handoff", to: id,
          text: lang === "am"
            ? `${mesh.agents[id].name} ጠቃሚ ምክር አለው…`
            : `${mesh.agents[id].name} has a tip for you…`,
        });
        seed.push({ kind: "agent", agentId: id, text: nudges[0], lang });
        break;
      }
    }
    setMessages(seed);
    setCurrentAgent("concierge");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.customerId, lang]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  async function send(textArg?: string) {
    const text = (textArg ?? input).trim();
    if (!text || busy) return;
    setInput("");
    const detected = detectLang(text);
    if (detected !== lang) setLang(detected);

    const userMsg: Msg = { kind: "user", text };
    setMessages((m) => [...m, userMsg]);
    setBusy(true);

    try {
      const payloadMessages = [
        ...messages
          .filter((m) => m.kind === "user" || m.kind === "agent")
          .map((m) =>
            m.kind === "user"
              ? { role: "user" as const, content: m.text }
              : { role: "assistant" as const, content: m.text, agentName: mesh.agents[m.agentId].name },
          ),
        { role: "user" as const, content: text },
      ];

      const { data, error } = await supabase.functions.invoke("mesh-chat", {
        body: {
          agents: mesh.agents,
          currentAgentId: currentAgent,
          persona: { firstName: customer.firstName, line: `${customer.persona}, ${customer.city}` },
          bankName: cfg.bank.name,
          messages: payloadMessages,
          customer: customerSnapshot(customer),
          language: detected,
        },
      });

      if (error) throw error;
      const reply = (data as { reply: string; targetAgentId: MeshAgentId; handoff?: { to: MeshAgentId; text: string } | null });
      const targetId = (reply.targetAgentId ?? "concierge") as MeshAgentId;

      setMessages((m) => {
        const out: Msg[] = [...m];
        if (reply.handoff) {
          out.push({ kind: "handoff", to: reply.handoff.to as MeshAgentId, text: reply.handoff.text });
        }
        out.push({ kind: "agent", agentId: targetId, text: reply.reply, lang: detected });
        return out;
      });
      setCurrentAgent(targetId);
    } catch (e) {
      console.error("BankGPT send failed", e);
      setMessages((m) => [...m, {
        kind: "agent", agentId: "concierge", lang,
        text: lang === "am"
          ? "ይቅርታ፣ መልስ ለማግኘት ችግር አለ። እንደገና ይሞክሩ።"
          : "Sorry — I couldn't reach the AI Mesh right now. Please try again.",
      }]);
    } finally {
      setBusy(false);
    }
  }

  async function speak(idx: number, text: string, language: "en" | "am") {
    try {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      setSpeakingIdx(idx);
      const { data, error } = await supabase.functions.invoke("elevenlabs-tts", {
        body: { text, lang: language },
      });
      if (error) throw error;
      const blob = data instanceof Blob ? data : new Blob([data as ArrayBuffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setSpeakingIdx(null); URL.revokeObjectURL(url); };
      await audio.play();
    } catch (e) {
      console.error("TTS failed", e);
      setSpeakingIdx(null);
    }
  }

  const suggestions = lang === "am" ? SUGGESTIONS_AM : SUGGESTIONS_EN;

  return (
    <div className="w-full">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-primary to-secondary p-2.5 text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">BankGPT · AI Mesh</h2>
            <p className="text-xs text-muted-foreground">
              {enabledAgents.length} agents live · grounded in customer CDP · EN + አማ
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={customer.customerId}
            onChange={(e) =>
              setCustomer(SYNTHETIC_CUSTOMERS.find((c) => c.customerId === e.target.value) ?? SYNTHETIC_CUSTOMERS[0])
            }
            className="rounded-md border border-border bg-card px-2 py-1 text-xs"
          >
            {SYNTHETIC_CUSTOMERS.map((c) => (
              <option key={c.customerId} value={c.customerId}>
                {c.firstName} · {c.persona}
              </option>
            ))}
          </select>
          <button
            onClick={() => setLang(lang === "en" ? "am" : "en")}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground"
          >
            <Languages className="h-3.5 w-3.5" /> {lang === "en" ? "English" : "አማርኛ"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px,1fr,260px]">
        {/* Roster */}
        <aside className="rounded-2xl border border-border bg-card/60 p-3">
          <h3 className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Agent roster</h3>
          <ul className="space-y-1.5">
            {enabledAgents.map((id) => {
              const a = mesh.agents[id];
              const active = id === currentAgent;
              return (
                <li
                  key={id}
                  className={
                    "flex items-center gap-2 rounded-lg p-2 transition " +
                    (active ? "bg-primary/10 ring-1 ring-primary/40" : "hover:bg-muted/50")
                  }
                >
                  <span
                    className="grid h-7 w-7 place-items-center rounded-md text-xs font-bold text-white"
                    style={{ background: a.color }}
                  >
                    {a.avatarStyle === "initial" ? a.name[0] : a.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">{a.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{a.tagline}</p>
                  </div>
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Chat */}
        <section className="rounded-2xl border border-border bg-card/60 flex flex-col" style={{ minHeight: 520 }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {messages.map((m, i) => {
              if (m.kind === "handoff") {
                const to = mesh.agents[m.to];
                return (
                  <div key={i} className="my-1.5">
                    <div
                      className="mx-auto max-w-[80%] flex items-center justify-center gap-2 rounded-xl px-3 py-1.5 text-center text-[11px] italic text-foreground"
                      style={{ background: `${to.color}33`, border: `1px dashed ${to.color}` }}
                    >
                      <Zap className="h-3 w-3" style={{ color: to.color }} /> {m.text}
                    </div>
                  </div>
                );
              }
              if (m.kind === "user") {
                return (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                      {m.text}
                    </div>
                  </div>
                );
              }
              const a = mesh.agents[m.agentId];
              return (
                <div key={i} className="flex justify-start">
                  <div
                    className="max-w-[80%] rounded-2xl rounded-bl-sm border bg-background px-3 py-2 text-sm text-foreground"
                    style={{ borderLeft: `3px solid ${a.color}` }}
                  >
                    <div className="mb-0.5 flex items-center justify-between gap-2">
                      <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: a.color }}>
                        {a.name}
                      </span>
                      <button
                        onClick={() => speak(i, m.text, m.lang)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Play voice"
                      >
                        <Volume2 className={"h-3 w-3 " + (speakingIdx === i ? "animate-pulse text-primary" : "")} />
                      </button>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              );
            })}
            {busy && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-border bg-background px-3 py-2">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border px-3 py-2">
            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="shrink-0 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={lang === "am" ? "መልዕክት ይጻፉ…" : "Ask anything about your money…"}
                className="flex-1 rounded-lg bg-muted px-3 py-2 text-sm text-foreground focus:outline-none"
              />
              <button
                onClick={() => send()}
                disabled={busy || !input.trim()}
                className="rounded-lg bg-primary p-2 text-primary-foreground disabled:opacity-50"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Customer 360 */}
        <aside className="rounded-2xl border border-border bg-card/60 p-3 space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
                <User2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{customer.fullName}</p>
                <p className="text-[10px] text-muted-foreground">{customer.customerId} · {customer.persona}</p>
              </div>
            </div>
          </div>

          <Stat label="Wallet" value={`ETB ${customer.walletBalanceETB.toLocaleString()}`} />
          <Stat label="Savings" value={`ETB ${customer.savingsBalanceETB.toLocaleString()}`} />
          <Stat label="Credit score" value={String(customer.creditScore)} sub={customer.riskTier + " risk"} />
          <Stat label="Engagement" value={`${customer.engagementScore}/100`} />
          <Stat label="Active loans" value={String(customer.loans.length)} />
          <Stat label="Cards" value={String(customer.cards.length)} />
          <Stat label="Investments" value={String(customer.investments.length)} />

          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Last activity</p>
            <ul className="space-y-1">
              {customer.recentTransactions.slice(0, 4).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="truncate text-foreground">{t.merchant}</span>
                  <span className={t.amount < 0 ? "text-rose-500" : "text-emerald-500"}>
                    {t.amount < 0 ? "−" : "+"}{Math.abs(t.amount).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-border/60 pb-1.5 last:border-0">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">
        {value}
        {sub && <span className="ml-1 text-[10px] font-normal text-muted-foreground">({sub})</span>}
      </span>
    </div>
  );
}
