/**
 * TesfaAI — The live customer-facing widget.
 *
 * Reads agent identity, color, tone and handoff rules straight from
 * `config.ai.mesh` (configured in the AI Mesh Studio wizard step).
 * Every change the admin makes in the wizard is reflected here on next render —
 * no rebuild, no republish needed.
 */
import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Mic, ChevronDown, Sparkles, Zap } from "lucide-react";
import { useBankConfig } from "@/contexts/BankConfigContext";
import type { MeshAgent, MeshAgentId } from "@/contexts/BankConfigContext";

function routeIntent(text: string, agents: Record<MeshAgentId, MeshAgent>): MeshAgentId {
  const t = text.toLowerCase();
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

const FALLBACK_SUGGESTIONS = [
  "Check my balance",
  "I want to start saving",
  "Can I get a small loan?",
  "Tell me about T-Bills",
  "I have a complaint",
];

function pickReply(a: MeshAgent, firstName: string): string {
  const raw = a.sampleReplies[Math.floor(Math.random() * a.sampleReplies.length)];
  return raw.replace(/{firstName}/g, firstName);
}

type Msg =
  | { kind: "agent"; agentId: MeshAgentId; text: string }
  | { kind: "user"; text: string }
  | { kind: "handoff"; to: MeshAgentId; text: string };

const TesfaAI = () => {
  const cfg = useBankConfig();
  const mesh = cfg.ai.mesh;
  const concierge = mesh.agents.concierge;
  const firstName = "Selam";

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState<MeshAgentId | null>(null);
  const [currentAgent, setCurrentAgent] = useState<MeshAgentId>("concierge");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Seed greeting from the configured concierge
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        kind: "agent", agentId: "concierge",
        text: (concierge.sampleReplies[0] || `Hi {firstName}! I'm ${concierge.name}.`).replace(/{firstName}/g, firstName),
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concierge.name]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open, typing]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);

  const send = (text?: string) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput("");
    setMessages((m) => [...m, { kind: "user", text: msg }]);

    const target = routeIntent(msg, mesh.agents);
    const handingOff = target !== currentAgent && target !== "concierge";
    setTyping(target);

    window.setTimeout(() => {
      setMessages((m) => {
        const out = [...m];
        if (handingOff) {
          out.push({
            kind: "handoff", to: target,
            text: (mesh.agents[target].handoffMessage || `Connecting you to ${mesh.agents[target].name}…`),
          });
        }
        const greet = handingOff
          ? mesh.agents[target].greetingOnHandoff.replace(/{firstName}/g, firstName)
          : pickReply(mesh.agents[target], firstName);
        out.push({ kind: "agent", agentId: target, text: greet });
        return out;
      });
      setCurrentAgent(target);
      setTyping(null);
    }, 700);
  };

  const active = mesh.agents[currentAgent];

  const renderText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i} style={{ color: active.color }}>{part}</strong> : part,
    );
  };

  const conciergeBadge = useMemo(() => {
    if (concierge.avatarStyle === "initial") return concierge.name[0];
    return concierge.emoji || "✦";
  }, [concierge.avatarStyle, concierge.name, concierge.emoji]);

  return (
    <>
      {/* Floating button — colour = concierge colour */}
      <button
        onClick={() => setOpen(true)}
        aria-label={`Open ${concierge.name}`}
        className={`fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center transition-transform active:scale-95 hover:scale-110 text-white font-bold text-lg ${open ? "hidden" : ""}`}
        style={{
          background: `linear-gradient(135deg, ${concierge.color}, ${active.color})`,
          boxShadow: `0 8px 24px ${concierge.color}55`,
        }}
      >
        {conciergeBadge}
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold">1</span>
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed left-1/2 -translate-x-1/2 w-full max-w-md z-50 animate-slide-up"
          style={{ bottom: "72px" }}
        >
          <div className="glass border border-border rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "70dvh" }}>
            {/* Header — shows currently-talking agent */}
            <div className="flex items-center gap-3 p-4 border-b border-border flex-shrink-0"
              style={{ background: `${active.color}18`, borderLeft: `3px solid ${active.color}` }}>
              <div className="w-9 h-9 rounded-xl grid place-items-center font-bold text-white text-sm"
                style={{ background: active.color }}>
                {active.avatarStyle === "initial" ? active.name[0] : active.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{active.name}</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-[10px] text-muted-foreground truncate">{active.tagline}</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="p-2 glass rounded-xl min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-none min-h-0">
              {messages.map((m, i) => {
                if (m.kind === "handoff") {
                  const to = mesh.agents[m.to];
                  return (
                    <div key={i} className="my-1.5">
                      <div className="mx-auto max-w-[88%] px-3 py-2 rounded-xl text-center text-[11px] italic flex items-center justify-center gap-2"
                        style={{ background: `${to.color}1c`, color: to.color, border: `1px dashed ${to.color}55` }}>
                        <Zap className="w-3 h-3" />
                        {m.text}
                      </div>
                    </div>
                  );
                }
                if (m.kind === "user") {
                  return (
                    <div key={i} className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl rounded-br-sm px-3 py-2 text-xs text-white"
                        style={{ background: concierge.color }}>
                        {m.text}
                      </div>
                    </div>
                  );
                }
                const a = mesh.agents[m.agentId];
                return (
                  <div key={i} className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl rounded-bl-sm px-3 py-2 text-xs leading-relaxed glass text-foreground border"
                      style={{ borderLeft: `3px solid ${a.color}` }}>
                      <div className="text-[9px] uppercase tracking-widest mb-0.5 font-semibold" style={{ color: a.color }}>{a.name}</div>
                      {renderText(m.text)}
                    </div>
                  </div>
                );
              })}
              {typing && (
                <div className="flex justify-start">
                  <div className="glass rounded-2xl rounded-bl-sm px-4 py-3 border"
                    style={{ borderLeft: `3px solid ${mesh.agents[typing].color}` }}>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: mesh.agents[typing].color, animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: mesh.agents[typing].color, animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: mesh.agents[typing].color, animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            <div className="px-4 pb-2 flex-shrink-0">
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                {FALLBACK_SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    className="flex-shrink-0 glass text-xs px-3 py-1.5 rounded-xl text-muted-foreground hover:text-foreground border border-border transition-colors min-h-[36px]">
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-border flex-shrink-0">
              <input
                ref={inputRef}
                className="flex-1 bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none placeholder:text-muted-foreground min-h-[44px]"
                placeholder={`Ask ${concierge.name} anything…`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button aria-label="Voice"
                className="p-2.5 glass rounded-xl text-muted-foreground min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Mic className="w-4 h-4" />
              </button>
              <button onClick={() => send()} aria-label="Send"
                className="p-2.5 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center text-white"
                style={{ background: concierge.color }}>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TesfaAI;
