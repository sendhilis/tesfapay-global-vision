/**
 * EqubDemo — Nuru's live eQUB Savings Circle onboarding & operations demo.
 *
 * Stage-ready bilingual (Amharic + English) experience for the ABX Roadshow:
 *   • Full eQUB circle visualization (6 members, contributions matrix)
 *   • Scripted beats narrated by Nuru via ElevenLabs multilingual v2
 *   • Live tool actions: mark_contribution, offer_bridge, confirm_bridge,
 *     disburse_pot, celebrate, show_banker_view
 *   • Live Q&A tail after the scripted arc — powered by `nuru-equb` edge
 *     function so any banker question gets a real bilingual reply.
 *
 * Spec source: Nuru_eQUB_Agent_Implementation.docx (Techurate, July 2026).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, Send, Zap, Sparkles, CheckCircle2, AlertTriangle, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/* ── PALETTE (matches Onboarding demo for visual continuity) ────── */
const P = {
  bg: "#0C1318", panel: "#111C24", card: "#16242F",
  teal: "#00C9B1", tealDim: "#00857A",
  amber: "#E8A83E", amberDim: "#A86E1A",
  green: "#1DB97D", red: "#E84040", gold: "#F4D06F",
  white: "#F0EDE8", muted: "#7A9AAF", border: "#1E3040",
};

/* ── MEMBERS (pre-loaded for the demo, matches spec exactly) ────── */
type MemberStatus = "active" | "missed" | "bridge-pending" | "bridge-confirmed" | "received";
interface Member {
  id: string;
  name: string;
  nameAm: string;
  phone: string;
  turnMonth: number;
  status: MemberStatus;
  contributions: ("paid" | "missed" | "bridge" | "pending")[];
  hasReceivedPot: boolean;
  salaryDay?: number;
  salaryAmount?: number;
}

const INITIAL_MEMBERS: Member[] = [
  { id: "abebe",  name: "Abebe Girma",   nameAm: "አቤቤ ግርማ",   phone: "+251 91 111 2233", turnMonth: 1, status: "received", contributions: ["paid","paid","pending"], hasReceivedPot: true,  salaryDay: 5,  salaryAmount: 7200 },
  { id: "meron",  name: "Meron Tadesse", nameAm: "ሜሮን ታደሰ",   phone: "+251 91 222 3344", turnMonth: 2, status: "received", contributions: ["paid","paid","pending"], hasReceivedPot: true,  salaryDay: 7,  salaryAmount: 9000 },
  { id: "selam",  name: "Selam Tesfaye", nameAm: "ሰላም ተስፋዬ",  phone: "+251 91 333 4455", turnMonth: 3, status: "active",   contributions: ["paid","paid","pending"], hasReceivedPot: false, salaryDay: 10, salaryAmount: 11000 },
  { id: "tigist", name: "Tigist Alemu",  nameAm: "ትግስት ዓለሙ",  phone: "+251 91 555 6677", turnMonth: 4, status: "active",   contributions: ["paid","paid","pending"], hasReceivedPot: false, salaryDay: 12, salaryAmount: 13500 },
  { id: "bekele", name: "Bekele Haile",  nameAm: "ቤቀለ ሃይሌ",   phone: "+251 91 444 5566", turnMonth: 5, status: "active",   contributions: ["paid","paid","pending"], hasReceivedPot: false, salaryDay: 14, salaryAmount: 8500 },
  { id: "dawit",  name: "Dawit ከበደ",    nameAm: "ዳዊት ከበደ",   phone: "+251 91 666 7788", turnMonth: 6, status: "active",   contributions: ["paid","paid","pending"], hasReceivedPot: false, salaryDay: 20, salaryAmount: 15000 },
];

const CONTRIBUTION = 1000;
const POT = INITIAL_MEMBERS.length * CONTRIBUTION;

/* ── BEATS (Amharic + English, with tool calls) ─────────────────── */
type Tool =
  | { kind: "noop" }
  | { kind: "mark_all_paid_except_bekele" }
  | { kind: "mark_bekele_missed" }
  | { kind: "offer_bridge" }
  | { kind: "confirm_bridge" }
  | { kind: "disburse_pot"; to: "selam" }
  | { kind: "celebrate"; to: "selam" }
  | { kind: "banker_view" };

type Phase = "intro" | "members" | "contributions" | "default" | "bridge" | "pot" | "celebrate" | "banker" | "qa";
interface Beat {
  phase: Phase;
  am: string;
  en: string;
  tool: Tool;
  /** seconds to hold after audio ends, before auto-advancing (when autoplay) */
  hold?: number;
}

const BEATS: Beat[] = [
  {
    phase: "intro",
    am: "ሰላም ጓደኞቼ! እኔ ኑሩ ነኝ — የእኛን eQUB ክበብ እንጀምር።",
    en: "Hello friends! I am Nuru. Let us open our savings circle together.",
    tool: { kind: "noop" }, hold: 0.6,
  },
  {
    phase: "members",
    am: "ይህ \"የጓደኞች ቤት\" የተባለው eQUB ነው — ስድስት አባላት፣ እያንዳንዱ በወር አንድ ሺ ብር።",
    en: "This is the Friends' House eQUB — six members, each contributing ETB 1,000 every month.",
    tool: { kind: "noop" }, hold: 0.4,
  },
  {
    phase: "members",
    am: "የክብደቱ ድምር በወር ስድስት ሺ ብር ነው። ዛሬ ሦስተኛ ወር ላይ ነን።",
    en: "The total pot is ETB 6,000 per cycle. Today we are in Month 3.",
    tool: { kind: "noop" }, hold: 0.4,
  },
  {
    phase: "contributions",
    am: "ከስድስት አባላት አምስቱ የዚህ ወር መዋጮ ከፍለዋል። ላስታውቅላችሁ።",
    en: "Five of six members have paid this month's contribution. Let me mark them now.",
    tool: { kind: "mark_all_paid_except_bekele" }, hold: 1.2,
  },
  {
    phase: "default",
    am: "ሕይወት አንዳንዴ አስደናቂ ነገሮችን ታመጣለች። ቤቀለ የዚህን ወር መዋጮ አላስገባም።",
    en: "Life brings surprises sometimes. Bekele has not paid this month's contribution.",
    tool: { kind: "mark_bekele_missed" }, hold: 1.0,
  },
  {
    phase: "bridge",
    am: "ግን ክበባችንን ለመጠበቅ መንገድ አግኝቻለሁ።",
    en: "But I have found a way to protect our circle.",
    tool: { kind: "noop" }, hold: 0.4,
  },
  {
    phase: "bridge",
    am: "ABX ለቤቀለ አንድ ሺ ብር ድልድይ ብድር ያቀርባል — በሚቀጥለው ደሞዙ መስከረም አሥራ አራት ቀን ይመለሳል።",
    en: "ABX will advance ETB 1,000 as a bridge for Bekele — recovered from his next salary on the 14th of Meskerem.",
    tool: { kind: "offer_bridge" }, hold: 1.4,
  },
  {
    phase: "bridge",
    am: "ቤቀለ ተስማምቷል። ክበቡ ሙሉ ነው። እምነታችን ተጠብቋል።",
    en: "Bekele has confirmed. The circle is complete. Trust is preserved.",
    tool: { kind: "confirm_bridge" }, hold: 1.0,
  },
  {
    phase: "pot",
    am: "ሰላም ለሦስት ወራት በታማኝነት መዋጥራለች። የእሷ ድርሻ ጊዜ አሁን ነው።",
    en: "Selam has contributed faithfully for three months. Her turn for the pot is now.",
    tool: { kind: "noop" }, hold: 0.6,
  },
  {
    phase: "pot",
    am: "ስድስት ሺ ብር ድርሻዋ ወደ ኪሷ እየገባ ነው።",
    en: "Her pot of ETB 6,000 is being deposited into her wallet now.",
    tool: { kind: "disburse_pot", to: "selam" }, hold: 1.6,
  },
  {
    phase: "celebrate",
    am: "እንኳን ደስ አለሽ ሰላም! ትግስት፣ የሚቀጥለው ወር ድርሻ የአንቺ ነው።",
    en: "Congratulations Selam! Tigist, you are next in Month 4.",
    tool: { kind: "celebrate", to: "selam" }, hold: 1.2,
  },
  {
    phase: "banker",
    am: "ለባንኩ ምን አስገኘ? ስድስት የቁጠባ መለያዎች፣ በወር ስድስት ሺ ብር ተቀማጭ፣ ምንም ኪሳራ አልነበረም።",
    en: "For the bank: six savings accounts, ETB 6,000 of monthly deposits, zero net defaults.",
    tool: { kind: "banker_view" }, hold: 0.8,
  },
  {
    phase: "banker",
    am: "አንድ አዲስ የብድር ግንኙነት ተፈጥሯል፣ እና በዓመት ሰባ ሁለት ሺ ብር የክበብ እሴት።",
    en: "One new credit relationship created, and ETB 72,000 of annual circle value.",
    tool: { kind: "noop" }, hold: 1.0,
  },
  {
    phase: "qa",
    am: "አሁን ጥያቄዎች ካሉዎት ይጠይቁኝ — በአማርኛም በእንግሊዝኛም መልስ እሰጣለሁ።",
    en: "Now ask me anything — I will answer in both Amharic and English.",
    tool: { kind: "noop" }, hold: 0,
  },
];

/* ── ELEVENLABS TTS (serialized, never overlapping) ─────────────── */
async function fetchTtsBlobUrl(text: string, lang: "en" | "am" | "both"): Promise<string | null> {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token || anonKey;
  const res = await fetch(
    `https://${projectId}.supabase.co/functions/v1/elevenlabs-tts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "apikey": anonKey,
      },
      body: JSON.stringify({ text, lang }),
    },
  );
  const ct = res.headers.get("Content-Type") || "";
  if (!res.ok || !ct.includes("audio")) {
    const details = await res.text().catch(() => "");
    console.warn("TTS unavailable", res.status, details);
    return null;
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

function useVoice(enabled: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());
  const enabledRef = useRef(enabled);
  const stopTokenRef = useRef(0);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => {
    const a = new Audio();
    a.preload = "auto";
    audioRef.current = a;
    return () => {
      try { a.pause(); } catch { /* noop */ }
      audioRef.current = null;
      cacheRef.current.forEach((u) => URL.revokeObjectURL(u));
      cacheRef.current.clear();
    };
  }, []);

  /** Play one clip end-to-end. Resolves when finished or aborted. */
  const speak = useCallback(async (text: string, lang: "en" | "am" | "both" = "both") => {
    if (!enabledRef.current || !text) return;
    const token = stopTokenRef.current;
    const key = `${lang}:${text}`;
    let url = cacheRef.current.get(key);
    if (!url) {
      const got = await fetchTtsBlobUrl(text, lang);
      if (token !== stopTokenRef.current) return;
      if (!got) return;
      url = got;
      cacheRef.current.set(key, url);
    }
    const a = audioRef.current;
    if (!a) return;
    a.src = url;
    a.currentTime = 0;
    await new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        a.removeEventListener("ended", finish);
        a.removeEventListener("error", finish);
        a.removeEventListener("pause", finish);
        resolve();
      };
      a.addEventListener("ended", finish, { once: true });
      a.addEventListener("error", finish, { once: true });
      a.addEventListener("pause", finish, { once: true });
      a.play().catch(() => finish());
    });
  }, []);

  const stop = useCallback(() => {
    stopTokenRef.current += 1;
    try { audioRef.current?.pause(); } catch { /* noop */ }
  }, []);

  return { speak, stop };
}

/* ── ATOMS ──────────────────────────────────────────────────────── */
const NuruAvatar = ({ speaking, size = 56 }: { speaking: boolean; size?: number }) => (
  <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
    {speaking && (
      <span style={{
        position: "absolute", inset: -4, borderRadius: "50%",
        boxShadow: `0 0 0 2px ${P.teal}55, 0 0 24px ${P.teal}66`,
        animation: "nuruPulse 1.2s ease-out infinite",
      }} />
    )}
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${P.teal}, ${P.tealDim})`,
      display: "grid", placeItems: "center",
      color: P.bg, fontWeight: 900, fontSize: size * 0.42,
      boxShadow: `0 6px 18px ${P.teal}55`,
    }}>
      N
    </div>
    <style>{`@keyframes nuruPulse { 0%{opacity:.9;transform:scale(1)} 100%{opacity:0;transform:scale(1.35)} }`}</style>
  </div>
);

function PhaseTag({ phase }: { phase: Phase }) {
  const labels: Record<Phase, string> = {
    intro: "Intro", members: "Circle", contributions: "Contributions",
    default: "Default", bridge: "Bridge", pot: "Pot",
    celebrate: "Celebration", banker: "Banker View", qa: "Live Q&A",
  };
  return (
    <span style={{
      fontSize: 10, letterSpacing: 2, textTransform: "uppercase",
      color: P.teal, padding: "3px 8px", borderRadius: 999,
      border: `1px solid ${P.teal}44`, background: `${P.teal}11`,
    }}>
      {labels[phase]}
    </span>
  );
}

function StatusBadge({ status, isNextPot }: { status: MemberStatus; isNextPot: boolean }) {
  if (status === "missed")
    return <span style={{ color: P.amber, fontSize: 10, fontWeight: 700 }}><AlertTriangle className="w-3 h-3 inline mr-0.5" />MISSED</span>;
  if (status === "bridge-pending")
    return <span style={{ color: P.gold, fontSize: 10, fontWeight: 700 }}>BRIDGE PENDING</span>;
  if (status === "bridge-confirmed")
    return <span style={{ color: P.green, fontSize: 10, fontWeight: 700 }}><CheckCircle2 className="w-3 h-3 inline mr-0.5" />BRIDGE</span>;
  if (status === "received")
    return <span style={{ color: P.muted, fontSize: 10, fontWeight: 700 }}>RECEIVED</span>;
  if (isNextPot)
    return <span style={{ color: P.teal, fontSize: 10, fontWeight: 700 }}>NEXT POT</span>;
  return <span style={{ color: P.green, fontSize: 10, fontWeight: 700 }}>ACTIVE</span>;
}

function MemberCard({ m, isNextPot, justDisbursed, justBridged, justMissed }: {
  m: Member; isNextPot: boolean; justDisbursed: boolean; justBridged: boolean; justMissed: boolean;
}) {
  const accent =
    m.status === "missed" ? P.amber :
    m.status === "bridge-confirmed" ? P.green :
    isNextPot ? P.teal : P.border;

  return (
    <div style={{
      background: P.card, border: `1px solid ${accent}`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: 12, padding: 12, color: P.white,
      transition: "all 0.3s ease",
      boxShadow: justDisbursed ? `0 0 24px ${P.teal}` : justBridged ? `0 0 18px ${P.green}88` : justMissed ? `0 0 18px ${P.amber}88` : "none",
      transform: justDisbursed ? "scale(1.04)" : "scale(1)",
    }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="font-mono text-[10px]" style={{ color: P.muted }}>M{m.turnMonth}</div>
        <StatusBadge status={m.status} isNextPot={isNextPot} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 13 }}>{m.nameAm}</div>
      <div style={{ color: P.muted, fontSize: 11 }}>{m.name}</div>
      <div className="mt-2 flex gap-1">
        {m.contributions.map((c, i) => (
          <div key={i} title={`Month ${i+1}`} style={{
            flex: 1, height: 4, borderRadius: 2,
            background:
              c === "paid" ? P.green :
              c === "bridge" ? P.gold :
              c === "missed" ? P.amber : P.border,
          }} />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px]" style={{ color: P.muted }}>
        <span>ETB {CONTRIBUTION.toLocaleString()}/mo</span>
        {m.hasReceivedPot && <span>✓ pot received</span>}
      </div>
    </div>
  );
}

/* ── MAIN COMPONENT ─────────────────────────────────────────────── */
interface Props { onClose: () => void }

export default function EqubDemo({ onClose }: Props) {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [beatIdx, setBeatIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [transcript, setTranscript] = useState<{ from: "nuru" | "user"; am?: string; en: string }[]>([]);
  const [bankerVisible, setBankerVisible] = useState(false);
  const [potTo, setPotTo] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<{ id: string; kind: "disburse" | "bridge" | "missed" } | null>(null);
  const [qaInput, setQaInput] = useState("");
  const [qaPending, setQaPending] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const { speak, stop } = useVoice(voiceOn);
  const runTokenRef = useRef(0);

  const beat = BEATS[beatIdx];
  const inQa = beat?.phase === "qa";
  const selam = members.find((m) => m.id === "selam")!;

  /* Tool execution — mutates UI state */
  const applyTool = useCallback((tool: Tool) => {
    switch (tool.kind) {
      case "mark_all_paid_except_bekele":
        setMembers((ms) => ms.map((m) =>
          m.id === "bekele" ? m : { ...m, contributions: ["paid", "paid", "paid"] }
        ));
        break;
      case "mark_bekele_missed":
        setMembers((ms) => ms.map((m) =>
          m.id === "bekele" ? { ...m, status: "missed", contributions: ["paid","paid","missed"] } : m
        ));
        setFlashId({ id: "bekele", kind: "missed" });
        setTimeout(() => setFlashId(null), 1500);
        break;
      case "offer_bridge":
        setMembers((ms) => ms.map((m) =>
          m.id === "bekele" ? { ...m, status: "bridge-pending" } : m
        ));
        break;
      case "confirm_bridge":
        setMembers((ms) => ms.map((m) =>
          m.id === "bekele" ? { ...m, status: "bridge-confirmed", contributions: ["paid","paid","bridge"] } : m
        ));
        setFlashId({ id: "bekele", kind: "bridge" });
        setTimeout(() => setFlashId(null), 1800);
        break;
      case "disburse_pot":
        setPotTo(tool.to);
        setFlashId({ id: tool.to, kind: "disburse" });
        setMembers((ms) => ms.map((m) =>
          m.id === tool.to ? { ...m, hasReceivedPot: true, status: "received" } : m
        ));
        setTimeout(() => setFlashId(null), 2200);
        break;
      case "celebrate":
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 3500);
        break;
      case "banker_view":
        setBankerVisible(true);
        break;
    }
  }, []);

  /* Push to transcript when beat changes */
  useEffect(() => {
    if (!beat) return;
    setTranscript((t) => [...t, { from: "nuru", am: beat.am, en: beat.en }]);
  }, [beatIdx]); // eslint-disable-line

  /* Autoplay loop */
  useEffect(() => {
    if (!running) return;
    const token = ++runTokenRef.current;
    (async () => {
      while (token === runTokenRef.current && beatIdx < BEATS.length) {
        const b = BEATS[beatIdx];
        applyTool(b.tool);
        if (voiceOn) {
          await speak(`${b.am} ${b.en}`, "both");
        } else {
          await new Promise((r) => setTimeout(r, 2200));
        }
        if (token !== runTokenRef.current) return;
        await new Promise((r) => setTimeout(r, (b.hold ?? 0.5) * 1000));
        if (token !== runTokenRef.current) return;
        if (beatIdx >= BEATS.length - 1) { setRunning(false); return; }
        setBeatIdx((i) => i + 1);
      }
    })();
    return () => { runTokenRef.current++; };
  }, [running, beatIdx, voiceOn, speak, applyTool]);

  /* Manual next */
  const next = useCallback(async () => {
    if (beatIdx >= BEATS.length - 1) return;
    const b = BEATS[beatIdx];
    applyTool(b.tool);
    if (voiceOn) await speak(`${b.am} ${b.en}`, "both");
    setBeatIdx((i) => i + 1);
  }, [beatIdx, voiceOn, speak, applyTool]);

  const reset = useCallback(() => {
    runTokenRef.current++;
    stop();
    setRunning(false);
    setMembers(INITIAL_MEMBERS);
    setBeatIdx(0);
    setTranscript([]);
    setBankerVisible(false);
    setPotTo(null);
    setFlashId(null);
    setCelebrate(false);
  }, [stop]);

  /* Keyboard shortcuts: Ctrl+D = jump to default, Space = play/pause */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        const idx = BEATS.findIndex((b) => b.phase === "default");
        if (idx >= 0) { setBeatIdx(idx); applyTool(BEATS[idx].tool); if (voiceOn) void speak(`${BEATS[idx].am} ${BEATS[idx].en}`, "both"); }
      }
      if (e.code === "Space" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        setRunning((r) => !r);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [applyTool, voiceOn, speak]);

  /* Live Q&A */
  const sendQa = useCallback(async (text: string) => {
    if (!text.trim() || qaPending) return;
    setTranscript((t) => [...t, { from: "user", en: text }]);
    setQaInput("");
    setQaPending(true);
    try {
      const history = transcript
        .filter((m) => m.from === "user" || m.from === "nuru")
        .map((m) => ({
          role: (m.from === "user" ? "user" : "assistant") as "user" | "assistant",
          content: m.from === "nuru" ? `${m.am ?? ""}\n${m.en}`.trim() : m.en,
        }));
      history.push({ role: "user", content: text });

      const { data, error } = await supabase.functions.invoke("nuru-equb", {
        body: { messages: history },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const am: string = data.am || "";
      const en: string = data.en || data.reply || "";
      setTranscript((t) => [...t, { from: "nuru", am, en }]);
      if (voiceOn) await speak(`${am} ${en}`.trim(), "both");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Couldn't reach Nuru";
      setTranscript((t) => [...t, { from: "nuru", en: `⚠️ ${msg}` }]);
    } finally {
      setQaPending(false);
    }
  }, [qaPending, transcript, voiceOn, speak]);

  /* Pre-cache first beat audio for crisp opening */
  useEffect(() => {
    if (voiceOn) {
      void fetchTtsBlobUrl(`${BEATS[0].am} ${BEATS[0].en}`, "both");
    }
  }, [voiceOn]);

  const progress = ((beatIdx + 1) / BEATS.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(8,14,18,0.92)" }}>
      <div className="relative w-full max-w-[1200px] h-[92vh] rounded-2xl overflow-hidden flex flex-col" style={{ background: P.bg, border: `1px solid ${P.border}` }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: P.border, background: P.panel }}>
          <NuruAvatar speaking={running || qaPending} size={42} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-bold text-[15px]" style={{ color: P.white }}>Nuru · የቁጠባ አሰልጣኝ</div>
              <PhaseTag phase={beat?.phase ?? "intro"} />
            </div>
            <div className="text-[11px]" style={{ color: P.muted }}>
              Friends' House eQUB · 6 members · ETB {POT.toLocaleString()} pot · Month 3
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setVoiceOn((v) => !v)} title="Voice" className="p-2 rounded-lg" style={{ background: P.card, color: voiceOn ? P.teal : P.muted, border: `1px solid ${P.border}` }}>
              {voiceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button onClick={reset} title="Reset" className="p-2 rounded-lg" style={{ background: P.card, color: P.muted, border: `1px solid ${P.border}` }}>
              <RotateCcw className="w-4 h-4" />
            </button>
            {!inQa && (
              <>
                <button onClick={() => setRunning((r) => !r)} title="Autoplay (Space)" className="p-2 rounded-lg flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ background: running ? P.amber : P.teal, color: P.bg }}>
                  {running ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Autoplay</>}
                </button>
                <button onClick={next} disabled={beatIdx >= BEATS.length - 1} title="Next beat" className="p-2 rounded-lg text-[11px] font-bold uppercase tracking-widest disabled:opacity-40" style={{ background: P.card, color: P.white, border: `1px solid ${P.border}` }}>
                  Next →
                </button>
              </>
            )}
            <button onClick={() => { stop(); onClose(); }} className="p-2 rounded-lg" style={{ background: P.card, color: P.white, border: `1px solid ${P.border}` }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="h-1 w-full" style={{ background: P.border }}>
          <div style={{ width: `${progress}%`, height: "100%", background: `linear-gradient(90deg, ${P.teal}, ${P.gold})`, transition: "width 0.4s ease" }} />
        </div>

        {/* Body: left = circle, right = chat */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-0 min-h-0">

          {/* LEFT — Circle visualisation */}
          <div className="p-5 overflow-y-auto" style={{ background: P.bg }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] uppercase tracking-widest" style={{ color: P.muted }}>The Circle · ክበቡ</div>
              <div className="font-mono text-[11px]" style={{ color: P.muted }}>{INITIAL_MEMBERS.length} members</div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map((m) => (
                <MemberCard
                  key={m.id}
                  m={m}
                  isNextPot={!m.hasReceivedPot && m.id === "selam" && beatIdx < BEATS.findIndex(b => b.phase === "celebrate")}
                  justDisbursed={flashId?.id === m.id && flashId.kind === "disburse"}
                  justBridged={flashId?.id === m.id && flashId.kind === "bridge"}
                  justMissed={flashId?.id === m.id && flashId.kind === "missed"}
                />
              ))}
            </div>

            {/* Pot disbursement animation */}
            {potTo && (
              <div className="mt-5 p-4 rounded-xl flex items-center justify-between" style={{ background: P.card, border: `1px solid ${P.teal}66` }}>
                <div>
                  <div className="text-[10px] uppercase tracking-widest" style={{ color: P.teal }}>Pot disbursed</div>
                  <div className="font-bold mt-0.5" style={{ color: P.white }}>ETB {POT.toLocaleString()} → {selam.nameAm} ({selam.name})</div>
                </div>
                <Sparkles className="w-6 h-6" style={{ color: P.gold }} />
              </div>
            )}

            {/* Banker view */}
            {bankerVisible && (
              <div className="mt-4 p-4 rounded-xl" style={{ background: P.panel, border: `1px solid ${P.gold}44` }}>
                <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: P.gold }}>For the Bank</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  {[
                    { k: "Savings accounts", v: "6" },
                    { k: "Deposits / cycle", v: "ETB 6,000" },
                    { k: "Net defaults", v: "0" },
                    { k: "Annual circle value", v: "ETB 72,000" },
                  ].map((s) => (
                    <div key={s.k}>
                      <div className="text-[18px] font-bold" style={{ color: P.gold }}>{s.v}</div>
                      <div className="text-[10px]" style={{ color: P.muted }}>{s.k}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {celebrate && (
              <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
                <div className="text-[64px]" style={{ animation: "celebrate 2.4s ease-out" }}>🎉</div>
                <style>{`@keyframes celebrate { 0%{transform:scale(0);opacity:0} 30%{transform:scale(1.3);opacity:1} 100%{transform:scale(1);opacity:0} }`}</style>
              </div>
            )}
          </div>

          {/* RIGHT — Nuru chat / transcript */}
          <div className="flex flex-col min-h-0 border-l" style={{ borderColor: P.border, background: P.panel }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {transcript.length === 0 && (
                <div className="text-[12px] italic" style={{ color: P.muted }}>
                  Press <strong>Autoplay</strong> to begin. Nuru will narrate every step in Amharic + English.
                </div>
              )}
              {transcript.map((m, i) => m.from === "nuru" ? (
                <div key={i} className="flex items-start gap-2">
                  <NuruAvatar speaking={false} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: P.teal }}>Nuru</div>
                    {m.am && (
                      <div className="text-[13.5px] leading-snug mb-1" style={{ color: P.white }}>{m.am}</div>
                    )}
                    <div className="text-[12.5px] leading-snug" style={{ color: P.muted }}>{m.en}</div>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-br-sm text-[12.5px]" style={{ background: P.teal, color: P.bg, fontWeight: 600 }}>
                    {m.en}
                  </div>
                </div>
              ))}
              {qaPending && (
                <div className="flex items-center gap-2 text-[11px]" style={{ color: P.muted }}>
                  <Zap className="w-3 h-3" style={{ color: P.teal }} /> Nuru is thinking…
                </div>
              )}
            </div>

            {/* Q&A composer — always visible, becomes primary once reached */}
            <form
              onSubmit={(e) => { e.preventDefault(); void sendQa(qaInput); }}
              className="flex items-center gap-2 p-3 border-t"
              style={{ borderColor: P.border, background: P.bg }}
            >
              <Mic className="w-4 h-4" style={{ color: P.muted }} />
              <input
                value={qaInput}
                onChange={(e) => setQaInput(e.target.value)}
                placeholder={inQa ? "Ask Nuru anything…" : "Live Q&A unlocks at the end — or ask now"}
                className="flex-1 px-2 py-2 text-[13px] outline-none bg-transparent"
                style={{ color: P.white }}
              />
              <button
                type="submit"
                disabled={qaPending || !qaInput.trim()}
                className="px-3 py-2 rounded-lg inline-flex items-center gap-1.5 text-[12px] font-bold disabled:opacity-40"
                style={{ background: P.teal, color: P.bg }}
              >
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </form>
          </div>
        </div>

        {/* Footer help strip */}
        <div className="px-5 py-2 border-t flex items-center justify-between text-[10px]" style={{ borderColor: P.border, background: P.panel, color: P.muted }}>
          <span>Beat {beatIdx + 1} / {BEATS.length}</span>
          <span>Shortcuts: <kbd>Space</kbd> autoplay · <kbd>Ctrl+D</kbd> trigger default · <kbd>Esc</kbd> close</span>
          <span>ElevenLabs multilingual v2 · {voiceOn ? "Voice on" : "Voice muted"}</span>
        </div>
      </div>
    </div>
  );
}
