/**
 * Council Mode — the "WOW" demo.
 * The user (banker) describes a life scenario (e.g. wedding). All specialist
 * agents deliberate live, each speaks in-persona via ElevenLabs TTS with a
 * real-time waveform on its card. The Concierge synthesizes a final action
 * plan within ~90 seconds.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Mic, Square, Loader2, Languages, Play, RotateCcw, Sparkles,
  CheckCircle2, Crown, Users, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useBankConfig } from "@/contexts/BankConfigContext";
import { startRecording, transcribe } from "./voiceUtils";
import { useCustomAgents } from "./agentBuilderStore";

const FN_URL = (name: string) =>
  `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/${name}`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type Contribution = { agentId: string; addressedTo?: string; opinion: string };
type CouncilResult = {
  opening?: Contribution;
  turns?: Contribution[];
  contributions: Contribution[];
  synthesis: string;
  actionLabel: string;
  conciergeId: string;
  language: "en" | "am";
};

type SpeakingState = {
  agentId: string | null;
  addressedTo?: string | null;
  levels: number[]; // 24 bars, 0..1
  phase: "opening" | "turn" | "synthesis" | "chair" | "specialist" | null;
};

type DialogueTurn = {
  id: string;
  role: "user" | "chair" | "specialist";
  agentId?: string;
  text: string;
};


type CouncilAgentMeta = {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  color: string;
  enabled?: boolean;
  avatarStyle?: "abstract" | "illustrated" | "initial";
  systemPrompt?: string;
};

const BASE_AGENT_ORDER = ["concierge", "onboarding", "savingsCoach", "investmentCoach", "loanAgent", "complaintAgent", "notificationAgent"];

const PRESETS_EN = [
  "My daughter's wedding is in 6 months. Budget is around ETB 350,000. I have ETB 80,000 in savings and earn ETB 45,000/month. How should I plan?",
  "I want to buy a car worth ETB 1.2M next year. I currently save ETB 8,000 a month. What's the smartest path?",
  "My business needs ETB 250,000 working capital for the next 90 days. I have inventory but cash is tight.",
];
const PRESETS_AM = [
  "የልጄ ሰርግ በ6 ወር ውስጥ ነው። በጀቴ 350,000 ብር ነው። 80,000 ብር ቁጠባ አለኝ እና በወር 45,000 ብር አገኛለሁ። እንዴት ላቅድ?",
  "በመጪው ዓመት 1.2 ሚሊዮን ብር መኪና መግዛት እፈልጋለሁ። በወር 8,000 ብር እቆጥባለሁ።",
  "ንግዴ ለ90 ቀናት 250,000 ብር የስራ ካፒታል ያስፈልገዋል።",
];

export function CouncilMode() {
  const cfg = useBankConfig();
  const mesh = cfg.ai.mesh;
  const { customAgents } = useCustomAgents();

  const [lang, setLang] = useState<"en" | "am">("en");
  const [scenario, setScenario] = useState("");
  const [busy, setBusy] = useState<"" | "stt" | "thinking" | "deliberating">("");
  const [result, setResult] = useState<CouncilResult | null>(null);
  const [speaking, setSpeaking] = useState<SpeakingState>({ agentId: null, addressedTo: null, levels: Array(24).fill(0), phase: null });
  const [spoken, setSpoken] = useState<Set<string>>(new Set());
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [actionTaken, setActionTaken] = useState(false);
  const [dialogue, setDialogue] = useState<DialogueTurn[]>([]);
  const [followupQ, setFollowupQ] = useState("");
  const [followupBusy, setFollowupBusy] = useState(false);
  const [followupRec, setFollowupRec] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>("");
  const [consensus, setConsensus] = useState(false);
  const followupRecRef = useRef<{ stop: () => Promise<Blob> } | null>(null);
  const dialogueScrollRef = useRef<HTMLDivElement | null>(null);

  const recRef = useRef<{ stop: () => Promise<Blob> } | null>(null);
  const stopFlag = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const elapsedTimer = useRef<number | null>(null);


  const allAgents = useMemo<CouncilAgentMeta[]>(() => {
    const base = Object.values(mesh.agents as Record<string, any>)
      .map((a) => ({ ...a, id: String(a.id) }));
    const custom = customAgents
      .filter((a) => !base.some((b) => b.id === a.id))
      .map((a) => ({ ...a, enabled: true, avatarStyle: "illustrated" as const, systemPrompt: `${a.name}: ${a.tagline}` }));
    const order = new Map(BASE_AGENT_ORDER.map((id, i) => [id, i]));
    return [...base, ...custom].sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
  }, [mesh.agents, customAgents]);
  const concierge = allAgents.find((a) => a.id === "concierge") ?? (mesh.agents.concierge as CouncilAgentMeta);
  const specialists = allAgents.filter((a) => a.id !== concierge.id);

  useEffect(() => () => {
    stopFlag.current = true;
    audioCtxRef.current?.close().catch(() => {});
    if (elapsedTimer.current) window.clearInterval(elapsedTimer.current);
  }, []);

  async function ttsBlob(text: string, language: "en" | "am"): Promise<Blob> {
    const res = await fetch(FN_URL("elevenlabs-tts"), {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
      body: JSON.stringify({ text, lang: language }),
    });
    if (!res.ok) throw new Error(`TTS ${res.status}`);
    const contentType = res.headers.get("Content-Type") || "";
    if (!contentType.startsWith("audio/")) throw new Error("TTS returned no audio");
    const buf = await res.arrayBuffer();
    return new Blob([buf], { type: "audio/mpeg" });
  }

  async function speakWithWave(
    agentId: string,
    text: string,
    phase: "opening" | "turn" | "synthesis",
    language: "en" | "am",
    addressedTo?: string,
  ): Promise<void> {
    if (stopFlag.current) return;
    let blob: Blob;
    try {
      blob = await ttsBlob(text, language);
    } catch (e) {
      console.warn("Council TTS fallback", e);
      await simulateSpeech(agentId, phase, addressedTo, text);
      return;
    }
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.crossOrigin = "anonymous";

    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") await ctx.resume();
    const src = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    src.connect(analyser);
    analyser.connect(ctx.destination);
    const data = new Uint8Array(analyser.frequencyBinCount);

    setSpeaking({ agentId, addressedTo: addressedTo ?? null, levels: Array(24).fill(0), phase });
    let raf = 0;
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const levels = Array.from({ length: 24 }, (_, i) => {
        const idx = Math.floor((i / 24) * data.length);
        return Math.min(1, data[idx] / 200);
      });
      setSpeaking((s) => ({ ...s, levels }));
      raf = requestAnimationFrame(tick);
    };
    tick();

    await audio.play();
    await new Promise<void>((resolve) => {
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
    });
    cancelAnimationFrame(raf);
    URL.revokeObjectURL(url);
    try { src.disconnect(); analyser.disconnect(); } catch {}
    setSpeaking({ agentId: null, addressedTo: null, levels: Array(24).fill(0), phase: null });
    setSpoken((prev) => new Set(prev).add(agentId + (phase === "synthesis" ? ":syn" : phase === "opening" ? ":open" : "")));
  }

  async function simulateSpeech(agentId: string, phase: "opening" | "turn" | "synthesis", addressedTo: string | undefined, text: string) {
    const duration = Math.min(9000, Math.max(2400, text.split(/\s+/).length * (lang === "am" ? 390 : 310)));
    const started = performance.now();
    setSpeaking({ agentId, addressedTo: addressedTo ?? null, levels: Array(24).fill(0), phase });
    await new Promise<void>((resolve) => {
      const tick = () => {
        const t = performance.now() - started;
        const levels = Array.from({ length: 24 }, (_, i) => 0.22 + Math.abs(Math.sin(t / 115 + i * 0.55)) * 0.72);
        setSpeaking((s) => ({ ...s, levels }));
        if (t >= duration || stopFlag.current) resolve(); else requestAnimationFrame(tick);
      };
      tick();
    });
    setSpeaking({ agentId: null, addressedTo: null, levels: Array(24).fill(0), phase: null });
    setSpoken((prev) => new Set(prev).add(agentId + (phase === "synthesis" ? ":syn" : phase === "opening" ? ":open" : "")));
  }

  async function runCouncil(scenarioText?: string) {
    const text = (scenarioText ?? scenario).trim();
    if (!text) {
      toast({ title: "Describe your scenario", description: "Type or speak the situation first." });
      return;
    }
    stopFlag.current = false;
    setResult(null);
    setSpoken(new Set());
    setActionTaken(false);
    setDialogue([]);
    setConsensus(false);
    setCurrentAction("");
    setElapsed(0);
    setBusy("thinking");
    if (elapsedTimer.current) window.clearInterval(elapsedTimer.current);
    elapsedTimer.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);


    try {
      const { data, error } = await supabase.functions.invoke("council-deliberate", {
        body: {
          scenario: text,
          language: lang,
          bankName: cfg.bank.name,
          customerName: "Ato Bekele",
          agents: allAgents.map((a) => ({ id: a.id, name: a.name, tagline: a.tagline, systemPrompt: a.systemPrompt })),
        },
      });
      if (error) throw error;
      const res = data as CouncilResult;
      const turns = res.turns?.length ? res.turns : res.contributions;
      if (!turns?.length) throw new Error("Council returned no contributions");
      const normalized = { ...res, turns, contributions: turns };
      setResult(normalized);
      setBusy("deliberating");

      if (normalized.opening?.opinion && !stopFlag.current) {
        await speakWithWave(normalized.opening.agentId, normalized.opening.opinion, "opening", normalized.language, normalized.opening.addressedTo);
      }
      for (const c of normalized.turns) {
        if (stopFlag.current) break;
        if (!allAgents.some((a) => a.id === c.agentId)) continue;
        await speakWithWave(c.agentId, c.opinion, "turn", normalized.language, c.addressedTo);
      }
      if (!stopFlag.current && normalized.synthesis) {
        await speakWithWave(normalized.conciergeId, normalized.synthesis, "synthesis", normalized.language);
        setCurrentAction(normalized.actionLabel);
        setDialogue([
          { id: "open-" + Date.now(), role: "chair", agentId: normalized.conciergeId, text: normalized.opening?.opinion ?? "" },
          ...normalized.turns.map((t, i) => ({ id: `t-${i}`, role: "specialist" as const, agentId: t.agentId, text: t.opinion })),
          { id: "syn-" + Date.now(), role: "chair", agentId: normalized.conciergeId, text: normalized.synthesis },
        ]);
      }

    } catch (e: any) {
      console.error(e);
      toast({ title: "Council failed", description: e?.message ?? "Try again", variant: "destructive" });
    } finally {
      setBusy("");
      if (elapsedTimer.current) { window.clearInterval(elapsedTimer.current); elapsedTimer.current = null; }
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
        if (text) {
          setScenario(text);
          await runCouncil(text);
        } else {
          toast({ title: "Didn't catch that" });
        }
      } catch (e: any) {
        toast({ title: "Voice error", description: e?.message, variant: "destructive" });
      } finally {
        setBusy("");
      }
    } else {
      try {
        recRef.current = await startRecording();
        setRecording(true);
      } catch {
        toast({ title: "Microphone blocked", variant: "destructive" });
      }
    }
  }

  function reset() {
    stopFlag.current = true;
    setResult(null);
    setSpoken(new Set());
    setScenario("");
    setElapsed(0);
    setActionTaken(false);
    setDialogue([]);
    setConsensus(false);
    setCurrentAction("");
    setFollowupQ("");
    setSpeaking({ agentId: null, addressedTo: null, levels: Array(24).fill(0), phase: null });
  }

  async function askFollowup(qText?: string) {
    const q = (qText ?? followupQ).trim();
    if (!q || !result) return;
    setFollowupBusy(true);
    const userTurn: DialogueTurn = { id: "u-" + Date.now(), role: "user", text: q };
    setDialogue((d) => [...d, userTurn]);
    setFollowupQ("");
    try {
      const { data, error } = await supabase.functions.invoke("council-followup", {
        body: {
          scenario,
          synthesis: result.synthesis,
          actionLabel: currentAction || result.actionLabel,
          question: q,
          history: [...dialogue, userTurn].map(({ role, agentId, text }) => ({ role, agentId, text })),
          language: lang,
          bankName: cfg.bank.name,
          customerName: "Ato Bekele",
          agents: allAgents.map((a) => ({ id: a.id, name: a.name, tagline: a.tagline, systemPrompt: a.systemPrompt })),
        },
      });
      if (error) throw error;
      const r = data as {
        chairId: string; specialistId: string; chairLine: string;
        specialistReply: string; updatedActionLabel: string; consensusReached: boolean;
      };
      setDialogue((d) => [
        ...d,
        { id: "c-" + Date.now(), role: "chair", agentId: r.chairId, text: r.chairLine },
        { id: "s-" + Date.now() + 1, role: "specialist", agentId: r.specialistId, text: r.specialistReply },
      ]);
      if (r.updatedActionLabel) setCurrentAction(r.updatedActionLabel);
      if (r.consensusReached) setConsensus(true);
      await speakWithWave(r.chairId, r.chairLine, "chair", lang, r.specialistId);
      await speakWithWave(r.specialistId, r.specialistReply, "specialist", lang);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Follow-up failed", description: e?.message ?? "Try again", variant: "destructive" });
    } finally {
      setFollowupBusy(false);
    }
  }

  async function toggleFollowupRecord() {
    if (followupRec) {
      setFollowupRec(false);
      setFollowupBusy(true);
      try {
        const blob = await followupRecRef.current!.stop();
        followupRecRef.current = null;
        const text = await transcribe(blob, lang);
        if (text) await askFollowup(text);
        else toast({ title: "Didn't catch that" });
      } catch (e: any) {
        toast({ title: "Voice error", description: e?.message, variant: "destructive" });
      } finally {
        setFollowupBusy(false);
      }
    } else {
      try {
        followupRecRef.current = await startRecording();
        setFollowupRec(true);
      } catch {
        toast({ title: "Microphone blocked", variant: "destructive" });
      }
    }
  }


  const totalAgents = allAgents.length;
  const totalTurns = specialists.length + 2;
  const progress = result ? spoken.size / totalTurns : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-tesfa-gold/40 bg-gradient-to-br from-tesfa-gold/10 via-transparent to-primary/5 p-4">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="rounded-xl bg-gradient-gold p-2.5 text-tesfa-dark">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-[240px]">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              AI Council Mode <Sparkles className="h-4 w-4 text-tesfa-gold" />
            </h2>
            <p className="text-xs text-muted-foreground">
              {lang === "am"
                ? "ሁሉም የAI ወኪሎች በ90 ሰከንድ ውስጥ ራሳቸው ይመካከራሉ — ውሳኔ እስኪታወጅ ድረስ ምንም ጣልቃ ገብነት የለም።"
                : `All ${totalAgents} AI agents deliberate with each other in one autonomous 90-second council — no user intervention until the decision.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex glass rounded-lg p-0.5">
              {(["en","am"] as const).map((l) => (
                <button key={l} onClick={() => setLang(l)} disabled={!!busy || recording}
                  className={`px-3 py-1 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 ${
                    lang === l ? "bg-gradient-gold text-tesfa-dark" : "text-muted-foreground"
                  }`}>
                  <Languages className="h-3 w-3" />{l === "en" ? "English" : "አማርኛ"}
                </button>
              ))}
            </div>
            {result && !busy && (
              <Button size="sm" variant="outline" onClick={reset}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>

        {/* Scenario input */}
        <div className="mt-4 space-y-2">
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant={recording ? "destructive" : "default"}
              onClick={toggleRecord} disabled={busy === "thinking" || busy === "deliberating" || busy === "stt"}>
              {recording ? <Square className="h-3.5 w-3.5 mr-1" /> :
                busy === "stt" ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> :
                <Mic className="h-3.5 w-3.5 mr-1" />}
              {recording ? (lang === "am" ? "አቁም" : "Stop") : busy === "stt" ? "…" : (lang === "am" ? "ሁኔታዎን ይናገሩ" : "Speak scenario")}
            </Button>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder={lang === "am" ? "ሁኔታዎን ይተይቡ ወይም ይናገሩ…" : "Type or speak your scenario (wedding, car, business, education)…"}
              rows={2}
              className="flex-1 min-w-[260px] rounded-lg border border-border bg-background/60 px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-tesfa-gold"
              disabled={!!busy || recording}
            />
            <Button size="sm" onClick={() => runCouncil()} disabled={!scenario.trim() || !!busy || recording}>
              {busy === "thinking" ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Play className="h-3.5 w-3.5 mr-1" />}
              {busy === "thinking" ? (lang === "am" ? "ምክር ቤት እየተሰበሰበ…" : "Convening…") :
               busy === "deliberating" ? (lang === "am" ? "በውይይት ላይ…" : "Deliberating…") :
               (lang === "am" ? "ምክር ቤት ጥራ" : "Convene Council")}
            </Button>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(lang === "am" ? PRESETS_AM : PRESETS_EN).map((p, i) => (
              <button key={i} onClick={() => setScenario(p)} disabled={!!busy}
                className="text-[10px] rounded-full border border-border bg-background/60 px-2.5 py-1 text-muted-foreground hover:text-foreground hover:border-tesfa-gold/50">
                {p.length > 70 ? p.slice(0, 68) + "…" : p}
              </button>
            ))}
          </div>
        </div>

        {(busy === "deliberating" || result) && (
          <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
            <Badge variant={elapsed > 90 ? "destructive" : "secondary"} className="text-[10px]">
              {elapsed}s / 90s
            </Badge>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-gradient-gold transition-all"
                style={{ width: `${Math.min(100, progress * 100)}%` }} />
            </div>
            <span>{spoken.size} / {totalTurns} {lang === "am" ? "የምክር ቤት ተራዎች" : "council turns"}</span>
          </div>
        )}
      </div>

      {/* Speaker grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {specialists.map((a) => {
          const contrib = result?.contributions.find((c) => c.agentId === a.id);
          const active = speaking.agentId === a.id && speaking.phase === "turn";
          const done = spoken.has(a.id);
          const addressedName = allAgents.find((agent) => agent.id === contrib?.addressedTo)?.name ?? contrib?.addressedTo;
          return (
            <SpeakerCard key={a.id} agent={a} active={active} done={done}
              text={(active || done) ? contrib?.opinion : undefined} addressedTo={(active || done) ? addressedName : undefined} levels={active ? speaking.levels : null} />
          );
        })}
      </div>

      {/* Concierge synthesis card */}
      <div className={`rounded-2xl border-2 p-4 transition-all ${
        speaking.phase === "synthesis" || speaking.phase === "opening" ? "border-tesfa-gold shadow-[0_0_40px_rgba(212,175,55,0.4)] bg-gradient-to-br from-tesfa-gold/10 to-transparent" :
        result?.synthesis ? "border-tesfa-gold/50 bg-background/60" :
        "border-dashed border-border bg-background/30"
      }`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <span className="grid h-10 w-10 place-items-center rounded-xl text-white font-bold"
              style={{ background: concierge.color }}>
              {concierge.avatarStyle === "initial" ? concierge.name[0] : concierge.emoji}
            </span>
            <Crown className="h-4 w-4 text-tesfa-gold absolute -top-1.5 -right-1.5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground flex items-center gap-2">
              {concierge.name}
              <Badge className="text-[9px] bg-gradient-gold text-tesfa-dark border-0">CHAIR · SYNTHESIS</Badge>
            </p>
            <p className="text-[10px] text-muted-foreground">{concierge.tagline}</p>
          </div>
          {spoken.has(concierge.id + ":syn") && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
        </div>
        {(speaking.phase === "synthesis" || speaking.phase === "opening") && <Waveform levels={speaking.levels} color={concierge.color} large />}
        {result?.opening?.opinion && (speaking.phase === "opening" || spoken.has(concierge.id + ":open")) && (
          <p className="text-xs text-muted-foreground leading-relaxed mt-2">
            <span className="font-semibold text-foreground">Opening: </span>{result.opening.opinion}
          </p>
        )}
        {result?.synthesis && (speaking.phase === "synthesis" || spoken.has(concierge.id + ":syn")) ? (
          <p className="text-sm text-foreground leading-relaxed mt-2">{result.synthesis}</p>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            {lang === "am" ? "የምክር ቤት ውጤት እዚህ ይታያል…" : "Final council recommendation will appear here…"}
          </p>
        )}
        {result?.synthesis && spoken.has(concierge.id + ":syn") && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" className="bg-gradient-gold text-tesfa-dark hover:opacity-90"
              disabled={actionTaken}
              onClick={() => {
                setActionTaken(true);
                toast({
                  title: lang === "am" ? "ተግባር ተወስዷል ✓" : "Action taken ✓",
                  description: result.actionLabel,
                });
              }}>
              {actionTaken ? <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
              {actionTaken ? (lang === "am" ? "ተፈጸመ" : "Executed") : result.actionLabel}
            </Button>
            <Button size="sm" variant="outline" onClick={reset}>
              {lang === "am" ? "አዲስ ሁኔታ" : "New scenario"}
            </Button>
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Council pipeline: scenario → Lovable AI orchestrator → {totalAgents}-agent structured deliberation → ElevenLabs TTS ({lang === "am" ? "amh" : "eng"}) → live waveform → Concierge synthesis → bank action.
      </p>
    </div>
  );
}

function SpeakerCard({
  agent, active, done, text, addressedTo, levels,
}: {
  agent: any; active: boolean; done: boolean; text?: string; addressedTo?: string; levels: number[] | null;
}) {
  return (
    <div className={`rounded-xl border p-3 transition-all duration-300 ${
      active ? "border-2 scale-[1.02] shadow-lg" :
      done ? "border-emerald-500/40 bg-background/40" :
      "border-border bg-background/30 opacity-70"
    }`} style={active ? { borderColor: agent.color, boxShadow: `0 0 24px ${agent.color}55` } : undefined}>
      <div className="flex items-center gap-2 mb-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg text-xs font-bold text-white shrink-0"
          style={{ background: agent.color }}>
          {agent.avatarStyle === "initial" ? agent.name[0] : agent.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-foreground truncate">{agent.name}</p>
          <p className="text-[9px] text-muted-foreground truncate">{agent.tagline}</p>
        </div>
        {active && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />}
        {done && !active && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
      </div>
      {active && levels && <Waveform levels={levels} color={agent.color} />}
      {addressedTo && text && (
        <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
          handoff → {addressedTo}
        </p>
      )}
      {text ? (
        <p className={`text-[11px] leading-snug mt-1.5 ${active ? "text-foreground" : "text-muted-foreground"}`}>
          {text}
        </p>
      ) : (
        <p className="text-[10px] text-muted-foreground italic mt-1.5">
          Awaiting turn…
        </p>
      )}
    </div>
  );
}

function Waveform({ levels, color, large = false }: { levels: number[]; color: string; large?: boolean }) {
  return (
    <div className={`flex items-end gap-0.5 ${large ? "h-10" : "h-6"} my-1`}>
      {levels.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm transition-all duration-75"
          style={{
            height: `${Math.max(8, v * 100)}%`,
            background: color,
            opacity: 0.4 + v * 0.6,
          }} />
      ))}
    </div>
  );
}
