/**
 * TesfaAI — The live customer-facing widget (Amara).
 *
 * Routes every message through the same `agent-sandbox-chat` edge function
 * that powers the Agent Builder Sandbox, using the concierge's live config
 * from BankConfigContext + the AgentBuilder store. This keeps the widget
 * in lock-step with whatever the admin tweaks in the wizard — persona,
 * system prompt, tone, KB, tools, guardrails — with no rebuild required.
 */
import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Mic, ChevronDown } from "lucide-react";
import { useBankConfig } from "@/contexts/BankConfigContext";
import { useAgentBuilder } from "@/components/wizard/modules/bankgpt/agentBuilderStore";
import { sandboxChat } from "@/components/wizard/modules/bankgpt/voiceUtils";

const FALLBACK_SUGGESTIONS = [
  "Check my balance",
  "I want to start saving",
  "Can I get a small loan?",
  "Tell me about T-Bills",
  "I have a complaint",
];

type Msg =
  | { kind: "agent"; text: string }
  | { kind: "user"; text: string };

const TesfaAI = () => {
  const cfg = useBankConfig();
  const concierge = cfg.ai.mesh.agents.concierge;
  const { config: builder } = useAgentBuilder("concierge");
  const firstName = "Selam";

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const sessionIdRef = useRef<string>(`widget_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Seed greeting from the configured concierge
  useEffect(() => {
    if (messages.length === 0) {
      const greet = (concierge.sampleReplies?.[0] || `Hi {firstName}! I'm ${concierge.name}.`)
        .replace(/{firstName}/g, firstName);
      setMessages([{ kind: "agent", text: greet }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concierge.name]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open, typing]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || typing) return;
    setInput("");
    const next: Msg[] = [...messages, { kind: "user", text: msg }];
    setMessages(next);
    setTyping(true);

    try {
      const tools = Object.entries(builder.tools)
        .filter(([, t]: any) => t.enabled)
        .map(([id, t]: any) => ({ id, label: id.replace(/_/g, " "), approval: t.approval, dailyLimit: t.dailyLimit }));

      const res = await sandboxChat({
        agent: {
          name: concierge.name,
          tagline: concierge.tagline,
          systemPrompt: concierge.systemPrompt,
          tone: concierge.tone,
          usesEmoji: concierge.usesEmoji,
          bankName: cfg.bank?.name,
        },
        kb: { docs: builder.kb.docs as any, topK: builder.kb.topK },
        tools,
        guardrails: builder.guardrails as any,
        messages: next.map((m) => ({ role: m.kind === "user" ? "user" : "assistant", content: m.text })),
        language: "en",
        sessionId: sessionIdRef.current,
        agentId: "concierge",
      } as any);

      setMessages((m) => [...m, { kind: "agent", text: res.reply || "(no reply)" }]);
    } catch (e) {
      console.warn("[TesfaAI] sandboxChat failed", e);
      setMessages((m) => [...m, { kind: "agent", text: "I'm having trouble reaching the AI right now. Please try again in a moment." }]);
    } finally {
      setTyping(false);
    }
  };

  const active = concierge;

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

      {open && (
        <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-md z-50 animate-slide-up" style={{ bottom: "72px" }}>
          <div className="glass border border-border rounded-t-3xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "70dvh" }}>
            <div className="flex items-center gap-3 p-4 border-b border-border flex-shrink-0"
              style={{ background: `${active.color}18`, borderLeft: `3px solid ${active.color}` }}>
              <div className="w-9 h-9 rounded-xl grid place-items-center font-bold text-white text-sm" style={{ background: active.color }}>
                {active.avatarStyle === "initial" ? active.name[0] : active.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{active.name}</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-[10px] text-muted-foreground truncate">{active.tagline}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close"
                className="p-2 glass rounded-xl min-w-[36px] min-h-[36px] flex items-center justify-center">
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-none min-h-0">
              {messages.map((m, i) => {
                if (m.kind === "user") {
                  return (
                    <div key={i} className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl rounded-br-sm px-3 py-2 text-xs text-white" style={{ background: concierge.color }}>
                        {m.text}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={i} className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl rounded-bl-sm px-3 py-2 text-xs leading-relaxed glass text-foreground border whitespace-pre-wrap"
                      style={{ borderLeft: `3px solid ${active.color}` }}>
                      <div className="text-[9px] uppercase tracking-widest mb-0.5 font-semibold" style={{ color: active.color }}>{active.name}</div>
                      {renderText(m.text)}
                    </div>
                  </div>
                );
              })}
              {typing && (
                <div className="flex justify-start">
                  <div className="glass rounded-2xl rounded-bl-sm px-4 py-3 border" style={{ borderLeft: `3px solid ${active.color}` }}>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: active.color, animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: active.color, animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: active.color, animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="px-4 pb-2 flex-shrink-0">
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                {FALLBACK_SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)} disabled={typing}
                    className="flex-shrink-0 glass text-xs px-3 py-1.5 rounded-xl text-muted-foreground hover:text-foreground border border-border transition-colors min-h-[36px] disabled:opacity-50">
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-3 border-t border-border flex-shrink-0">
              <input
                ref={inputRef}
                className="flex-1 bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none placeholder:text-muted-foreground min-h-[44px]"
                placeholder={`Ask ${concierge.name} anything…`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                disabled={typing}
              />
              <button aria-label="Voice" className="p-2.5 glass rounded-xl text-muted-foreground min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Mic className="w-4 h-4" />
              </button>
              <button onClick={() => send()} aria-label="Send" disabled={typing}
                className="p-2.5 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center text-white disabled:opacity-50"
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
