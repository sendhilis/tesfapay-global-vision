/**
 * VoiceSandbox — bilingual (English / Amharic) voice-enabled test
 * panel for the BankGPT Agent Builder Sandbox step.
 *
 * Flow: tap mic → record → ElevenLabs STT → agent-sandbox-chat (Lovable AI)
 * → ElevenLabs TTS playback. Falls back to typed input.
 */
import { useEffect, useRef, useState } from "react";
import { Mic, Square, Volume2, Loader2, Send, Sparkles, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { speak, transcribe, sandboxChat, startRecording } from "./voiceUtils";
import { useWizard } from "@/contexts/BankConfigContext";
import type { AgentBuilderConfig } from "./agentBuilderStore";

type Msg = { role: "user" | "assistant"; content: string; lang?: "en" | "am" };

function bankNameFromKbUrl(config: AgentBuilderConfig): string | null {
  const urlDoc = config.kb.docs.find((d) => d.enabled && d.type === "url" && (d.source || d.name));
  const raw = urlDoc?.source || urlDoc?.name;
  if (!raw) return null;
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "");
    const label = host.split(".")[0]
      .replace(/[-_]+/g, " ")
      .replace(/([a-z])bank\b/i, "$1 bank")
      .replace(/\s+/g, " ")
      .trim();
    return label ? label.split(" ").map((w) => w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : null;
  } catch { return null; }
}

export function VoiceSandbox({
  agentMeta, config, logAudit,
}: {
  agentMeta: { id: string; name: string; tagline: string; emoji: string; color: string };
  config: AgentBuilderConfig;
  logAudit: (a: string, t?: string, d?: any) => void;
}) {
  const { config: bankCfg } = useWizard();
  const baseAgent: any = (bankCfg.ai.mesh.agents as any)[agentMeta.id];
  const bankName = bankNameFromKbUrl(config) || bankCfg.bank?.name || "the bank";

  const [lang, setLang] = useState<"en" | "am">("en");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typed, setTyped] = useState("");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState<"" | "stt" | "chat" | "tts">("");
  const recRef = useRef<{ stop: () => Promise<Blob> } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  function buildAgentPayload() {
    return {
      agent: {
        name: baseAgent?.name ?? agentMeta.name,
        tagline: baseAgent?.tagline ?? agentMeta.tagline,
        systemPrompt: baseAgent?.systemPrompt ?? "",
        tone: baseAgent?.tone ?? { formal_casual: 50, terse_verbose: 40, reserved_expressive: 60 },
        usesEmoji: baseAgent?.usesEmoji ?? true,
        bankName,
      },
      kb: { docs: config.kb.docs, topK: config.kb.topK },
      tools: (Object.entries(config.tools) as [string, any][])
        .filter(([, t]) => t.enabled)
        .map(([id, t]) => ({ id, label: id.replace(/_/g, " "), approval: t.approval, dailyLimit: t.dailyLimit })),
    };
  }

  async function sendText(text: string) {
    if (!text.trim()) return;
    const userMsg: Msg = { role: "user", content: text, lang };
    const next = [...messages, userMsg];
    setMessages(next);
    setBusy("chat");
    try {
      const { reply } = await sandboxChat({
        ...buildAgentPayload(),
        language: lang,
        messages: next.map((m) => ({ role: m.role, content: m.content })),
      });
      setMessages([...next, { role: "assistant", content: reply, lang }]);
      logAudit("sandbox.voice.run", agentMeta.id, { lang, hasReply: !!reply });
      setBusy("tts");
      await speak(reply, lang);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Sandbox error", description: e?.message ?? "Chat failed", variant: "destructive" });
    } finally {
      setBusy("");
    }
  }

  async function toggleRecord() {
    if (recording) {
      setRecording(false);
      setBusy("stt");
      try {
        const blob = await recRef.current!.stop();
        recRef.current = null;
        const text = await transcribe(blob, lang);
        if (!text) {
          toast({ title: "Didn't catch that", description: "Try speaking again." });
          setBusy("");
          return;
        }
        setTyped("");
        await sendText(text);
      } catch (e: any) {
        toast({ title: "Voice failed", description: e?.message ?? "STT error", variant: "destructive" });
        setBusy("");
      }
    } else {
      try {
        recRef.current = await startRecording();
        setRecording(true);
      } catch (e: any) {
        toast({ title: "Microphone blocked", description: "Allow mic access to use the voice demo.", variant: "destructive" });
      }
    }
  }

  return (
    <div className="rounded-xl border border-tesfa-gold/30 bg-gradient-to-br from-tesfa-gold/5 to-transparent p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-tesfa-gold" />
          <p className="text-sm font-bold text-foreground">Voice Sandbox</p>
          <Badge variant="secondary" className="text-[9px]">
            ElevenLabs · {config.kb.docs.filter((d) => d.status === "indexed" && d.enabled).length} KB docs
          </Badge>
        </div>
        <div className="inline-flex glass rounded-lg p-0.5">
          {(["en", "am"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 ${
                lang === l ? "bg-gradient-gold text-tesfa-dark" : "text-muted-foreground"
              }`}>
              <Languages className="h-3 w-3" />{l === "en" ? "English" : "አማርኛ"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-background/60 border border-border min-h-[200px] max-h-[320px] overflow-y-auto p-3 space-y-2 text-xs">
        {messages.length === 0 && (
          <p className="text-muted-foreground italic">
            {lang === "am"
              ? `ማይክሮፎኑን ይንኩ እና ${agentMeta.name}ን ስለ ካርዶች ይጠይቁ።`
              : `Tap the mic and ask ${agentMeta.name} anything about cards — limits, fees, lost-card, EMI, rewards.`}
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${
              m.role === "user"
                ? "bg-gradient-gold text-tesfa-dark rounded-br-sm"
                : "glass text-foreground rounded-bl-sm"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-muted-foreground italic">
            <Loader2 className="h-3 w-3 animate-spin" />
            {busy === "stt" ? "Transcribing…" : busy === "chat" ? `${agentMeta.name} is thinking…` : "Speaking…"}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant={recording ? "destructive" : "default"}
          onClick={toggleRecord} disabled={busy === "chat" || busy === "stt"}>
          {recording ? <Square className="h-3.5 w-3.5 mr-1" /> : <Mic className="h-3.5 w-3.5 mr-1" />}
          {recording ? "Stop" : "Speak"}
        </Button>
        <Input value={typed} onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && typed.trim()) { sendText(typed); setTyped(""); } }}
          placeholder={lang === "am" ? "ወይም በጽሁፍ ይተይቡ…" : "…or type a message"}
          disabled={!!busy || recording} />
        <Button size="sm" variant="outline" onClick={() => { if (typed.trim()) { sendText(typed); setTyped(""); } }}
          disabled={!typed.trim() || !!busy}>
          <Send className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost"
          onClick={() => speak(lang === "am" ? "የቪዛ ጎልድ ካርድ ዕለታዊ ገደብ 20,000 ብር ነው።" : "Hi! I'm your card concierge. Try asking me about credit card limits or how to block a lost card.", lang)}>
          <Volume2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Voice flow: mic → ElevenLabs STT ({lang === "am" ? "amh" : "eng"}) → Lovable AI grounded in {config.kb.docs.filter((d) => d.enabled).length} KB sources → ElevenLabs TTS.
      </p>
    </div>
  );
}
