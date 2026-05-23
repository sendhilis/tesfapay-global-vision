/**
 * OnboardingDemo — The 90-second Fayda-verified, voice-guided ABX
 * onboarding journey. Launched from the AI Mesh when the user asks
 * the Onboarding agent to start a new service.
 *
 * Voice: ElevenLabs multilingual v2 — speaks Amharic + English in
 * the same warm voice ("Amara"). User can answer with voice at the
 * interactive checkpoints (phone capture, goal selection).
 *
 * Spec source: ABX_Onboarding_Demo_Spec.docx (Techurate, July 2026).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, Mic, MicOff, Play, Pause, RotateCcw, Volume2, VolumeX, Languages } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/* ── DEMO DATA ──────────────────────────────────────────────────── */
const CUSTOMER = {
  name: "Selam Tesfaye",
  firstName: "Selam",
  phone: "+251 91 234 5678",
  fayadaId: "ETH-FYD-2024-88234",
  accountNumber: "1000 4821 9923",
  dob: "14 Meskerem 1991",
  region: "Addis Ababa",
  kebele: "Bole 05",
};

type LangMode = "am" | "en" | "both";
type StepId =
  | "welcome" | "phone" | "idScan" | "faceScan"
  | "liveness" | "details" | "goal" | "done";

interface Script { am: string; en: string }

const SCRIPTS: Record<string, Script> = {
  welcome:     { am: "እንኳን ደህና መጡ! ወደ ABX ባንክ እንኳን ደህና መጡ።", en: "Welcome! Let's get you set up in about 90 seconds." },
  phone:       { am: "ስልክ ቁጥርዎን ያስገቡ", en: "Enter your phone number to get started." },
  otpSent:     { am: "የማረጋገጫ ኮድ ተልኳል!", en: "We sent a 6-digit code to your phone." },
  otpOk:       { am: "ስልክ ቁጥር ተረጋግጧል", en: "Phone verified! Great start, Selam." },
  idScan:      { am: "የፋይዳ መታወቂያ ካርድዎን ይቃኙ", en: "Hold your Fayda ID card steady in the frame." },
  idDetecting: { am: "ካርዱን እየለያሁ ነው…", en: "Detecting your ID card..." },
  idOk:        { am: "መታወቂያ ተነቧል!", en: "ID verified with Fayda National Database." },
  faceScan:    { am: "ካሜራ ሳጥኑ ውስጥ ፊትዎን ያቀርቡ", en: "Look straight at the camera. Centre your face." },
  faceMatch:   { am: "ፊትዎን ከ ID ጋር እያነጻጸርኩ ነው…", en: "Matching your face to your Fayda ID..." },
  faceOk:      { am: "ፊት ማረጋገጫ ተሳካ", en: "Face matched! You're almost there." },
  liveness1:   { am: "ቀስ ብለው ቀኝ ይዙሩ", en: "Slowly turn your head to the right." },
  liveness2:   { am: "ቀስ ብለው ግራ ይዙሩ", en: "Now slowly turn to the left." },
  liveness3:   { am: "አንድ ጊዜ ዓይኖችዎን ይዝጉ", en: "Blink once, naturally." },
  livenessOk:  { am: "እርስዎ እውነተኛ ሰው ናቸው", en: "Liveness confirmed. You're real!" },
  details:     { am: "ዝርዝሮችዎ ከFAYDA ተሞልተዋል", en: "Your details are pre-filled from Fayda. Just confirm." },
  detailsOk:   { am: "ዝርዝሮች ተረጋግጠዋል", en: "Details confirmed!" },
  goal:        { am: "የቅርቡ ገንዘብ ዓላማዎ ምንድን ነው?", en: "What would you like to save for first?" },
  goalOk:      { am: "ዓላማ ተቀናብሯል", en: "Perfect! Let's make that happen." },
  creating:    { am: "መለያዎን እየፈጠርኩ ነው…", en: "Creating your account..." },
  done:        { am: "እንኳን ደስ አላቸው, Selam!", en: "Welcome to ABX, Selam! Your account is ready." },
};

const STEPS: { id: StepId; label: string; icon: string; seconds: number }[] = [
  { id: "welcome",  label: "Welcome",     icon: "👋", seconds: 4  },
  { id: "phone",    label: "Phone",       icon: "📱", seconds: 14 },
  { id: "idScan",   label: "Fayda ID",    icon: "🪪", seconds: 14 },
  { id: "faceScan", label: "Face Match",  icon: "👤", seconds: 10 },
  { id: "liveness", label: "Liveness",    icon: "👁", seconds: 14 },
  { id: "details",  label: "Confirm",     icon: "✅", seconds: 10 },
  { id: "goal",     label: "Goal",        icon: "🎯", seconds: 12 },
  { id: "done",     label: "Account",     icon: "🏦", seconds: 12 },
];

const P = {
  bg: "#0C1318", panel: "#111C24", card: "#16242F",
  teal: "#00C9B1", tealDim: "#00857A",
  amber: "#E8A83E", amberDim: "#A86E1A",
  green: "#1DB97D", red: "#E84040",
  white: "#F0EDE8", muted: "#7A9AAF", border: "#1E3040",
};

/* ── VOICE (ElevenLabs) ─────────────────────────────────────────── */
function useVoice(enabled: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());
  const playingRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    return () => {
      audioRef.current?.pause();
      cacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      cacheRef.current.clear();
    };
  }, []);

  const speak = useCallback(async (text: string, lang: "en" | "am") => {
    if (!enabled || !text) return;
    const key = `${lang}:${text}`;
    try {
      let url = cacheRef.current.get(key);
      if (!url) {
        const { data, error } = await supabase.functions.invoke("elevenlabs-tts", {
          body: { text, lang },
        });
        if (error) throw error;
        // data is a Blob when content-type is audio/mpeg
        const blob = data instanceof Blob ? data : new Blob([data as ArrayBuffer], { type: "audio/mpeg" });
        url = URL.createObjectURL(blob);
        cacheRef.current.set(key, url);
      }
      const a = audioRef.current!;
      a.src = url;
      a.currentTime = 0;
      await a.play();
      await new Promise<void>((resolve) => {
        const done = () => { a.removeEventListener("ended", done); a.removeEventListener("error", done); resolve(); };
        a.addEventListener("ended", done);
        a.addEventListener("error", done);
      });
    } catch (e) {
      console.warn("TTS failed", e);
    }
  }, [enabled]);

  const speakBoth = useCallback(async (s: Script, mode: LangMode) => {
    // Cancel any in-flight playback to avoid overlap
    if (audioRef.current) audioRef.current.pause();
    const run = (async () => {
      if (mode === "am" || mode === "both") await speak(s.am, "am");
      if (mode === "en" || mode === "both") await speak(s.en, "en");
    })();
    playingRef.current = run;
    await run;
  }, [speak]);

  const stop = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  return { speakBoth, stop };
}

/* ── MIC CAPTURE ────────────────────────────────────────────────── */
function useMicCapture() {
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream, { mimeType: "audio/webm" });
    chunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.start();
    recRef.current = rec;
    setRecording(true);
  }, []);

  const stop = useCallback(async (language: "eng" | "amh" = "eng"): Promise<string> => {
    const rec = recRef.current;
    if (!rec) return "";
    return new Promise((resolve) => {
      rec.onstop = async () => {
        rec.stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        try {
          const form = new FormData();
          form.append("audio", blob, "clip.webm");
          form.append("language", language);
          const projectId = (import.meta.env.VITE_SUPABASE_PROJECT_ID as string) || "sgjfidsnyxhjxkevjgje";
          const res = await fetch(`https://${projectId}.supabase.co/functions/v1/elevenlabs-stt`, {
            method: "POST",
            headers: { "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string },
            body: form,
          });
          const json = await res.json();
          resolve(json.text || "");
        } catch (e) {
          console.warn("STT failed", e);
          resolve("");
        }
      };
      rec.stop();
    });
  }, []);

  return { recording, start, stop };
}

/* ── ATOMS ──────────────────────────────────────────────────────── */
const AgentAvatar = ({ speaking, size = 56 }: { speaking: boolean; size?: number }) => {
  const r = size / 2;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: "absolute" }}>
        {speaking && (
          <>
            <circle cx={r} cy={r} r={r - 2} fill="none" stroke={P.teal} strokeWidth={1.5}
              style={{ animation: "abxPing 1.2s ease-out infinite", opacity: 0.4 }} />
            <circle cx={r} cy={r} r={r - 8} fill="none" stroke={P.teal} strokeWidth={1}
              style={{ animation: "abxPing 1.2s ease-out infinite 0.3s", opacity: 0.25 }} />
          </>
        )}
      </svg>
      <div style={{
        position: "absolute", inset: speaking ? 10 : 4, borderRadius: "50%",
        background: `linear-gradient(135deg, ${P.teal}22, ${P.amber}33)`,
        border: `2px solid ${speaking ? P.teal : P.border}`,
        display: "grid", placeItems: "center",
        fontSize: size * 0.38, transition: "border-color 0.4s, inset 0.3s",
        color: P.teal,
      }}>✦</div>
    </div>
  );
};

const SpeechBubble = ({ amharic, english, speaking, mode }:
  { amharic: string; english: string; speaking: boolean; mode: LangMode }) => (
  <div style={{
    background: P.card, border: `1px solid ${P.border}`,
    borderRadius: 16, padding: "12px 16px", flex: 1,
    borderLeft: `3px solid ${speaking ? P.teal : P.border}`,
    transition: "border-color 0.4s",
  }}>
    {(mode === "am" || mode === "both") && (
      <div style={{ fontSize: 15, fontWeight: 600, color: P.teal, marginBottom: 4, lineHeight: 1.4 }}>{amharic}</div>
    )}
    {(mode === "en" || mode === "both") && (
      <div style={{ fontSize: 12.5, color: P.muted, lineHeight: 1.5 }}>{english}</div>
    )}
  </div>
);

const ProgressStrip = ({ currentIdx, completedIds }: { currentIdx: number; completedIds: StepId[] }) => (
  <div style={{ display: "flex", gap: 4 }}>
    {STEPS.map((s, i) => {
      const done = completedIds.includes(s.id);
      const active = i === currentIdx;
      return (
        <div key={s.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div style={{
            height: 3, width: "100%", borderRadius: 2,
            background: done ? P.teal : active ? P.amber : P.border,
            transition: "background 0.5s",
          }} />
          <div style={{ fontSize: 9, color: done ? P.teal : active ? P.amber : P.border }}>{s.icon}</div>
        </div>
      );
    })}
  </div>
);

const CameraFrame = ({ mode, status }: { mode: "id" | "face"; status: "idle" | "scanning" | "success" }) => {
  const isId = mode === "id";
  const frameW = isId ? 260 : 180;
  const frameH = isId ? 165 : 220;
  const borderColor = status === "success" ? P.green : status === "scanning" ? P.teal : P.amber;
  const cornerSize = 20;
  const cornerStyles: React.CSSProperties[] = [
    { top: 0, left: 0, borderTop: `2px solid ${borderColor}`, borderLeft: `2px solid ${borderColor}`, borderRadius: "4px 0 0 0" },
    { top: 0, right: 0, borderTop: `2px solid ${borderColor}`, borderRight: `2px solid ${borderColor}`, borderRadius: "0 4px 0 0" },
    { bottom: 0, left: 0, borderBottom: `2px solid ${borderColor}`, borderLeft: `2px solid ${borderColor}`, borderRadius: "0 0 0 4px" },
    { bottom: 0, right: 0, borderBottom: `2px solid ${borderColor}`, borderRight: `2px solid ${borderColor}`, borderRadius: "0 0 4px 0" },
  ];
  return (
    <div style={{ position: "relative", width: frameW, height: frameH, margin: "0 auto" }}>
      <div style={{
        width: "100%", height: "100%",
        background: status === "success"
          ? `linear-gradient(135deg, ${P.green}18, ${P.teal}18)`
          : `linear-gradient(135deg, ${P.bg}, #0A1820)`,
        borderRadius: isId ? 8 : "50% / 40%",
        display: "grid", placeItems: "center", overflow: "hidden",
      }}>
        {isId && (
          <div style={{
            width: "90%", height: "80%",
            background: status === "success" ? "#1A3A2A" : "#0E2030",
            borderRadius: 6, padding: "10px 14px",
            border: `1px solid ${status === "success" ? P.green : P.border}`,
          }}>
            {status === "success" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ height: 8, width: "60%", background: P.teal, borderRadius: 4, opacity: 0.8 }} />
                <div style={{ height: 6, width: "80%", background: P.muted, borderRadius: 3, opacity: 0.5 }} />
                <div style={{ height: 6, width: "70%", background: P.muted, borderRadius: 3, opacity: 0.4 }} />
                <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                  <div style={{ width: 32, height: 38, background: P.card, borderRadius: 3, border: `1px solid ${P.green}40` }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ height: 5, width: "90%", background: P.amber, borderRadius: 2, opacity: 0.7 }} />
                    <div style={{ height: 5, width: "70%", background: P.muted, borderRadius: 2, opacity: 0.4 }} />
                    <div style={{ height: 5, width: "80%", background: P.muted, borderRadius: 2, opacity: 0.3 }} />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", placeItems: "center", height: "100%", color: P.border, fontSize: 28 }}>🪪</div>
            )}
          </div>
        )}
        {!isId && (
          <div style={{ width: 80, height: 100, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: status === "success" ? `${P.green}25` : `${P.teal}15`,
              border: `2px solid ${status === "success" ? P.green : P.teal}40`,
              display: "grid", placeItems: "center", fontSize: 28,
            }}>{status === "success" ? "😊" : "🙂"}</div>
            <div style={{
              width: 60, height: 30, marginTop: 4,
              background: status === "success" ? `${P.green}15` : `${P.teal}10`,
              borderRadius: "0 0 30px 30px",
            }} />
          </div>
        )}
      </div>
      {cornerStyles.map((s, i) => (
        <div key={i} style={{ position: "absolute", width: cornerSize, height: cornerSize, transition: "border-color 0.4s", ...s }} />
      ))}
      {status === "scanning" && (
        <div style={{
          position: "absolute", left: 8, right: 8, height: 2, top: "50%",
          background: `linear-gradient(90deg, transparent, ${P.teal}, transparent)`,
          borderRadius: 1, animation: "abxScanline 1.5s ease-in-out infinite",
        }} />
      )}
      {status === "success" && (
        <div style={{
          position: "absolute", inset: 0, display: "grid", placeItems: "center",
          background: `${P.green}18`, borderRadius: isId ? 8 : "50% / 40%",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: P.green,
            display: "grid", placeItems: "center", fontSize: 18, color: P.bg, fontWeight: 700,
            animation: "abxPopIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          }}>✓</div>
        </div>
      )}
    </div>
  );
};

const OTPInput = ({ verified }: { verified: boolean }) => {
  const digits = verified ? ["2","4","8","9","1","3"] : ["","","","","",""];
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {digits.map((d, i) => (
        <div key={i} style={{
          width: 36, height: 44, borderRadius: 8,
          background: verified ? P.green + "22" : P.bg,
          border: `1.5px solid ${verified ? P.green : i === 0 ? P.teal : P.border}`,
          display: "grid", placeItems: "center",
          fontSize: 20, fontWeight: 700, color: verified ? P.green : P.teal,
          transition: "all 0.4s", transitionDelay: verified ? `${i * 80}ms` : "0ms",
        }}>{d}</div>
      ))}
    </div>
  );
};

const LivenessChallenge = ({ challenge, done }: { challenge: number; done: boolean }) => {
  const items = [{ icon: "→" }, { icon: "←" }, { icon: "👁" }];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <CameraFrame mode="face" status={done ? "success" : "scanning"} />
      <div style={{ display: "flex", gap: 8 }}>
        {items.map((c, i) => (
          <div key={i} style={{
            width: 52, height: 52, borderRadius: 12,
            background: i < challenge ? P.green + "33" : i === challenge ? P.teal + "22" : P.border + "44",
            border: `1.5px solid ${i < challenge ? P.green : i === challenge ? P.teal : P.border}`,
            display: "grid", placeItems: "center",
            fontSize: i === challenge ? 22 : 16, color: i < challenge ? P.green : P.white,
            transition: "all 0.4s",
          }}>{i < challenge ? "✓" : c.icon}</div>
        ))}
      </div>
      {done && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: P.green, fontWeight: 600, fontSize: 13 }}>
          <span>✓</span><span>Anti-spoofing passed — You're human!</span>
        </div>
      )}
    </div>
  );
};

const DetailsConfirm = ({ confirmed }: { confirmed: boolean }) => {
  const fields: [string, string][] = [
    ["Full Name", CUSTOMER.name],
    ["Date of Birth", CUSTOMER.dob],
    ["Region", CUSTOMER.region],
    ["Kebele", CUSTOMER.kebele],
    ["Fayda ID", CUSTOMER.fayadaId],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
      {fields.map(([k, v]) => (
        <div key={k} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 12px", background: P.bg, borderRadius: 8,
          border: `1px solid ${confirmed ? P.green + "60" : P.border}`,
          transition: "border-color 0.5s",
        }}>
          <span style={{ fontSize: 11, color: P.muted }}>{k}</span>
          <span style={{ fontSize: 13, color: P.white, fontWeight: 500 }}>{v}</span>
        </div>
      ))}
      {confirmed && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 8, padding: 10, borderRadius: 8,
          background: P.green + "22", border: `1px solid ${P.green}60`,
          color: P.green, fontSize: 13, fontWeight: 600,
          animation: "abxPopIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        }}>✓ Confirmed via Fayda National Database</div>
      )}
    </div>
  );
};

const GOALS = [
  { id: "school", icon: "🎓", label: "School Fees",    am: "የትምህርት ቤት ክፍያ", keywords: ["school","trumphirt","education","fees","ትምህርት"] },
  { id: "biz",    icon: "🏪", label: "Business",       am: "ንግድ",            keywords: ["business","biz","ንግድ"] },
  { id: "emerg",  icon: "🛡", label: "Emergency Fund", am: "ድንገተኛ ፈንድ",       keywords: ["emergency","safety","ድንገተኛ"] },
  { id: "home",   icon: "🏠", label: "Home",           am: "ቤት",             keywords: ["home","house","ቤት"] },
] as const;
type GoalId = typeof GOALS[number]["id"];

const GoalSelector = ({ selected, onSelect }: { selected: GoalId | null; onSelect: (id: GoalId) => void }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%" }}>
    {GOALS.map((g) => (
      <button key={g.id} onClick={() => onSelect(g.id)} style={{
        background: selected === g.id ? P.teal + "22" : P.bg,
        border: `1.5px solid ${selected === g.id ? P.teal : P.border}`,
        borderRadius: 12, padding: "12px 8px", cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        transition: "all 0.3s",
      }}>
        <span style={{ fontSize: 22 }}>{g.icon}</span>
        <span style={{ fontSize: 12, color: P.teal, fontWeight: 600 }}>{g.am}</span>
        <span style={{ fontSize: 11, color: P.muted }}>{g.label}</span>
      </button>
    ))}
  </div>
);

const WelcomeCard = () => (
  <div style={{
    width: "100%", background: `linear-gradient(135deg, ${P.teal}18, ${P.amber}18)`,
    border: `1px solid ${P.teal}60`, borderRadius: 16, padding: "18px 14px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
    animation: "abxSlideUp 0.6s cubic-bezier(0.34,1.2,0.64,1)",
  }}>
    <div style={{ fontSize: 32 }}>🎉</div>
    <div style={{ fontSize: 17, fontWeight: 700, color: P.white, textAlign: "center" }}>
      እንኳን ደስ አላቸው, {CUSTOMER.firstName}!
    </div>
    <div style={{ fontSize: 12, color: P.muted, textAlign: "center" }}>Welcome to ABX — your account is live</div>
    <div style={{
      background: P.bg, borderRadius: 12, padding: "12px 20px",
      border: `1px solid ${P.teal}40`, width: "100%", textAlign: "center",
    }}>
      <div style={{ fontSize: 10, color: P.muted, marginBottom: 4 }}>Account Number</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: P.teal, letterSpacing: "0.15em" }}>{CUSTOMER.accountNumber}</div>
      <div style={{ fontSize: 10, color: P.muted, marginTop: 4 }}>ABX · Powered by Fayda</div>
    </div>
    <div style={{ display: "flex", gap: 8, width: "100%" }}>
      {[["💰","Wallet Active"],["🎯","Goal Set"],["🛡","Fayda Verified"]].map(([icon, label]) => (
        <div key={label} style={{
          flex: 1, background: P.card, borderRadius: 8, padding: "8px 4px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          border: `1px solid ${P.border}`,
        }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontSize: 9, color: P.muted, textAlign: "center" }}>{label}</span>
        </div>
      ))}
    </div>
  </div>
);

const TimerRing = ({ progress, label }: { progress: number; label: string }) => {
  const r = 22, c = 2 * Math.PI * r;
  const dash = c * (1 - progress);
  return (
    <div style={{ position: "relative", width: 60, height: 60, flexShrink: 0 }}>
      <svg width={60} height={60} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={30} cy={30} r={r} fill="none" stroke={P.border} strokeWidth={3} />
        <circle cx={30} cy={30} r={r} fill="none" stroke={P.teal} strokeWidth={3}
          strokeDasharray={c} strokeDashoffset={dash} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.1s linear" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: P.white, fontSize: 11, fontWeight: 700 }}>
        {label}
      </div>
    </div>
  );
};

/* ── MAIN COMPONENT ─────────────────────────────────────────────── */
export interface OnboardingDemoProps {
  onClose: () => void;
}

export default function OnboardingDemo({ onClose }: OnboardingDemoProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [subState, setSubState] = useState("idle");
  const [completed, setCompleted] = useState<StepId[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [totalMs, setTotalMs] = useState(0);
  const [livenessChallenge, setLivenessChallenge] = useState(0);
  const [goalSelected, setGoalSelected] = useState<GoalId | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [lang, setLang] = useState<LangMode>("both");
  const [voiceOn, setVoiceOn] = useState(true);
  const [voiceStatus, setVoiceStatus] = useState<string>("");
  const [capturedPhone, setCapturedPhone] = useState<string | null>(null);

  const step = STEPS[stepIdx];
  const stepMs = step.seconds * 1000;
  const totalDemoMs = STEPS.reduce((a, s) => a + s.seconds * 1000, 0);

  const { speakBoth, stop: stopVoice } = useVoice(voiceOn);
  const mic = useMicCapture();

  /* Auto-advance timer */
  useEffect(() => {
    if (!autoPlay) return;
    const t = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 100 / stepMs;
        if (next >= 1) {
          if (stepIdx < STEPS.length - 1) {
            setCompleted((c) => [...c, step.id]);
            setStepIdx((s) => s + 1);
            setSubState("idle");
            setElapsed(0);
          } else {
            setAutoPlay(false);
          }
          return 0;
        }
        const pct = next * 100;
        if (step.id === "welcome" && pct > 30 && subState === "idle") setSubState("greeting");
        if (step.id === "phone") {
          if (pct > 20 && subState === "idle") setSubState("enter");
          if (pct > 55 && subState === "enter") setSubState("sent");
          if (pct > 80 && subState === "sent") setSubState("verified");
        }
        if (step.id === "idScan") {
          if (pct > 15 && subState === "idle") setSubState("guide");
          if (pct > 40 && subState === "guide") setSubState("scanning");
          if (pct > 80 && subState === "scanning") setSubState("success");
        }
        if (step.id === "faceScan") {
          if (pct > 20 && subState === "idle") setSubState("guide");
          if (pct > 50 && subState === "guide") setSubState("matching");
          if (pct > 82 && subState === "matching") setSubState("success");
        }
        if (step.id === "liveness") {
          if (pct > 10 && livenessChallenge === 0) setLivenessChallenge(1);
          if (pct > 40 && livenessChallenge === 1) setLivenessChallenge(2);
          if (pct > 68 && livenessChallenge === 2) setLivenessChallenge(3);
          if (pct > 90 && subState !== "success") setSubState("success");
        }
        if (step.id === "details") {
          if (pct > 30 && subState === "idle") setSubState("reviewing");
          if (pct > 75 && subState === "reviewing") setSubState("confirmed");
        }
        if (step.id === "goal") {
          if (pct > 40 && !goalSelected) setGoalSelected("school");
          if (pct > 70 && subState !== "confirmed") setSubState("confirmed");
        }
        if (step.id === "done") {
          if (pct > 25 && subState === "idle") setSubState("creating");
          if (pct > 65 && subState === "creating") setSubState("revealed");
        }
        return next;
      });
      setTotalMs((t) => t + 100);
    }, 100);
    return () => clearInterval(t);
  }, [autoPlay, stepMs, stepIdx, step.id, subState, livenessChallenge, goalSelected]);

  /* Pick script for the current beat */
  const script: Script = useMemo(() => {
    const s = step.id;
    if (s === "phone" && subState === "sent") return SCRIPTS.otpSent;
    if (s === "phone" && subState === "verified") return SCRIPTS.otpOk;
    if (s === "idScan" && subState === "scanning") return SCRIPTS.idDetecting;
    if (s === "idScan" && subState === "success") return SCRIPTS.idOk;
    if (s === "faceScan" && subState === "matching") return SCRIPTS.faceMatch;
    if (s === "faceScan" && subState === "success") return SCRIPTS.faceOk;
    if (s === "liveness" && livenessChallenge === 1) return SCRIPTS.liveness1;
    if (s === "liveness" && livenessChallenge === 2) return SCRIPTS.liveness2;
    if (s === "liveness" && livenessChallenge === 3) return SCRIPTS.liveness3;
    if (s === "liveness" && subState === "success") return SCRIPTS.livenessOk;
    if (s === "details" && subState === "confirmed") return SCRIPTS.detailsOk;
    if (s === "goal" && subState === "confirmed") return SCRIPTS.goalOk;
    if (s === "done" && subState === "revealed") return SCRIPTS.done;
    if (s === "done") return SCRIPTS.creating;
    return SCRIPTS[s] || SCRIPTS.welcome;
  }, [step.id, subState, livenessChallenge]);

  /* Speak the current script whenever it changes */
  const lastSpokenRef = useRef<string>("");
  useEffect(() => {
    const key = `${script.am}|${script.en}|${lang}`;
    if (!voiceOn || key === lastSpokenRef.current) return;
    lastSpokenRef.current = key;
    speakBoth(script, lang);
  }, [script, lang, voiceOn, speakBoth]);

  /* Voice capture handlers */
  const onMicPhone = async () => {
    if (mic.recording) {
      setVoiceStatus("Transcribing…");
      const text = await mic.stop("eng");
      if (text) {
        const digits = text.replace(/\D/g, "");
        setCapturedPhone(digits ? `+251 ${digits.slice(-9)}` : CUSTOMER.phone);
        setVoiceStatus(`Heard: "${text.slice(0, 40)}"`);
      } else {
        setVoiceStatus("Didn't catch that — using demo number.");
        setCapturedPhone(CUSTOMER.phone);
      }
      setSubState("sent");
      setTimeout(() => setSubState("verified"), 1800);
    } else {
      setVoiceStatus("Listening… say your phone number");
      try { await mic.start(); } catch { setVoiceStatus("Mic blocked — using demo."); setCapturedPhone(CUSTOMER.phone); }
    }
  };

  const onMicGoal = async () => {
    if (mic.recording) {
      const text = (await mic.stop("eng")).toLowerCase();
      const match = GOALS.find((g) => g.keywords.some((k) => text.includes(k)));
      const chosen = match?.id || "school";
      setGoalSelected(chosen);
      setVoiceStatus(`Heard: "${text.slice(0, 40)}"`);
      setTimeout(() => setSubState("confirmed"), 600);
    } else {
      setVoiceStatus("Listening… what are you saving for?");
      try { await mic.start(); } catch { setVoiceStatus("Mic blocked."); }
    }
  };

  const handleStart = () => {
    setStepIdx(0); setSubState("idle"); setCompleted([]);
    setElapsed(0); setTotalMs(0); setLivenessChallenge(0);
    setGoalSelected(null); setCapturedPhone(null); setAutoPlay(true);
  };
  const handleReset = () => {
    stopVoice();
    setAutoPlay(false); setStepIdx(0); setSubState("idle");
    setCompleted([]); setElapsed(0); setTotalMs(0);
    setLivenessChallenge(0); setGoalSelected(null);
    setCapturedPhone(null); lastSpokenRef.current = "";
  };

  const totalSecs = Math.round(totalMs / 1000);
  const totalProgress = totalMs / totalDemoMs;
  const isFinal = stepIdx === STEPS.length - 1 && subState === "revealed";

  /* Step content */
  const renderStepContent = () => {
    switch (step.id) {
      case "welcome":
        return (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🏦</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: P.teal, marginBottom: 8 }}>ABX</div>
            <div style={{ fontSize: 12, color: P.muted }}>Alpha Banking Experience</div>
            <div style={{ marginTop: 16, fontSize: 11, color: P.muted }}>Powered by Fayda · Secured by ABX</div>
          </div>
        );

      case "phone":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
            <div style={{
              background: P.bg, borderRadius: 10, padding: "10px 14px",
              border: `1.5px solid ${subState === "verified" ? P.green : P.teal}`,
              fontSize: 16, fontWeight: 600, color: P.white, textAlign: "center",
              letterSpacing: "0.08em",
            }}>{capturedPhone || CUSTOMER.phone}</div>
            <OTPInput verified={subState === "verified"} />
            <button onClick={onMicPhone} style={{
              alignSelf: "center", padding: "8px 14px", borderRadius: 999,
              background: mic.recording ? P.red + "22" : P.teal + "22",
              border: `1px solid ${mic.recording ? P.red : P.teal}`,
              color: mic.recording ? P.red : P.teal, fontWeight: 600, fontSize: 12,
              display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
            }}>
              {mic.recording ? <MicOff size={14} /> : <Mic size={14} />}
              {mic.recording ? "Tap to stop & verify" : "Say your phone number"}
            </button>
            {subState === "verified" && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: P.green, fontSize: 13, fontWeight: 600, animation: "abxPopIn 0.4s" }}>
                <span>✓</span><span>Phone Verified</span>
              </div>
            )}
          </div>
        );

      case "idScan":
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <CameraFrame mode="id" status={subState === "success" ? "success" : subState === "scanning" ? "scanning" : "idle"} />
            {subState === "success" && (
              <div style={{
                background: P.card, borderRadius: 10, padding: "10px 14px",
                border: `1px solid ${P.teal}50`, width: "100%",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 11, color: P.muted }}>Fayda ID</span>
                <span style={{ fontSize: 12, color: P.teal, fontWeight: 600 }}>{CUSTOMER.fayadaId}</span>
              </div>
            )}
            <div style={{ fontSize: 11, color: P.muted, textAlign: "center" }}>
              {subState === "scanning" ? "Scanning for Fayda ID markers…"
                : subState === "success" ? "Verified against NIDP Database ✓"
                : "Position your Fayda ID card in the frame"}
            </div>
          </div>
        );

      case "faceScan":
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <CameraFrame mode="face" status={subState === "success" ? "success" : subState === "matching" ? "scanning" : "idle"} />
            {subState === "matching" && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 14px",
                background: P.bg, borderRadius: 8, border: `1px solid ${P.border}`,
                fontSize: 12, color: P.muted,
              }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", borderTop: `2px solid ${P.teal}`, animation: "abxSpin 0.8s linear infinite" }} />
                Comparing with Fayda portrait…
              </div>
            )}
            {subState === "success" && (
              <div style={{
                padding: "8px 16px", background: P.green + "22",
                border: `1px solid ${P.green}60`, borderRadius: 8,
                fontSize: 12, color: P.green, fontWeight: 600, animation: "abxPopIn 0.4s",
              }}>✓ Face match score: 99.2% — Fayda confirmed</div>
            )}
          </div>
        );

      case "liveness":
        return <LivenessChallenge challenge={livenessChallenge} done={subState === "success"} />;

      case "details":
        return <DetailsConfirm confirmed={subState === "confirmed"} />;

      case "goal":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
            <GoalSelector selected={goalSelected} onSelect={(id) => { setGoalSelected(id); setTimeout(() => setSubState("confirmed"), 500); }} />
            <button onClick={onMicGoal} style={{
              alignSelf: "center", padding: "6px 12px", borderRadius: 999,
              background: mic.recording ? P.red + "22" : P.teal + "22",
              border: `1px solid ${mic.recording ? P.red : P.teal}`,
              color: mic.recording ? P.red : P.teal, fontWeight: 600, fontSize: 11,
              display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
            }}>
              {mic.recording ? <MicOff size={12} /> : <Mic size={12} />}
              {mic.recording ? "Stop & choose" : "Say your goal"}
            </button>
            {goalSelected && subState === "confirmed" && (
              <div style={{
                display: "flex", justifyContent: "space-between", padding: "8px 14px",
                background: P.teal + "18", border: `1px solid ${P.teal}60`, borderRadius: 8,
                animation: "abxPopIn 0.4s",
              }}>
                <span style={{ fontSize: 12, color: P.muted }}>First savings goal</span>
                <span style={{ fontSize: 12, color: P.teal, fontWeight: 600 }}>
                  {GOALS.find((g) => g.id === goalSelected)?.label} {GOALS.find((g) => g.id === goalSelected)?.icon}
                </span>
              </div>
            )}
          </div>
        );

      case "done":
        if (subState === "revealed") return <WelcomeCard />;
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "16px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", border: `3px solid ${P.teal}`, borderTopColor: "transparent", animation: "abxSpin 1s linear infinite" }} />
            <div style={{ fontSize: 13, color: P.muted }}>Setting up your account…</div>
            {["Linking Fayda ID","Creating wallet","Activating services"].map((l, i) => (
              <div key={l} style={{
                display: "flex", alignItems: "center", gap: 8, fontSize: 12,
                color: P.green, opacity: subState === "creating" ? 1 : 0,
                transition: `opacity 0.4s ${i * 0.3 + 0.2}s`,
              }}>
                <span>✓</span><span>{l}</span>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100, background: "rgba(4,8,12,0.92)",
      backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-start",
      justifyContent: "center", padding: "16px", overflowY: "auto",
      fontFamily: "'Figtree','Inter',system-ui,sans-serif",
    }}>
      <style>{`
        @keyframes abxPing { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.35);opacity:0} }
        @keyframes abxScanline { 0%,100%{transform:translateY(-60px);opacity:0} 10%{opacity:1} 90%{opacity:1} 50%{transform:translateY(60px)} }
        @keyframes abxPopIn { 0%{transform:scale(0.7);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes abxSlideUp { 0%{transform:translateY(20px);opacity:0} 100%{transform:translateY(0);opacity:1} }
        @keyframes abxSpin { to{transform:rotate(360deg)} }
        @keyframes abxGlow { 0%,100%{box-shadow:0 0 12px ${P.teal}40} 50%{box-shadow:0 0 28px ${P.teal}80} }
      `}</style>

      <button onClick={() => { stopVoice(); onClose(); }} style={{
        position: "fixed", top: 16, right: 16, zIndex: 101,
        background: P.panel, border: `1px solid ${P.border}`, borderRadius: 999,
        width: 40, height: 40, display: "grid", placeItems: "center",
        color: P.muted, cursor: "pointer",
      }} aria-label="Close demo"><X size={18} /></button>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap", justifyContent: "center" }}>
        {/* Phone */}
        <div style={{
          width: 340, background: P.panel, borderRadius: 36,
          border: `1.5px solid ${P.border}`, overflow: "hidden", position: "relative",
          boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px #FFFFFF08",
        }}>
          <div style={{
            height: 36, background: P.bg, display: "flex",
            alignItems: "center", justifyContent: "space-between",
            padding: "0 20px", fontSize: 11, color: P.muted,
          }}>
            <span>9:41 AM</span>
            <div style={{ width: 80, height: 20, borderRadius: 10, background: "#0A1018", border: `1px solid ${P.border}` }} />
            <span>●●●</span>
          </div>

          <div style={{ padding: "0 0 20px", minHeight: 640 }}>
            <div style={{ padding: "12px 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: P.teal }}>ABX</span>
                <span style={{ fontSize: 10, color: P.muted }}>✦</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 10, color: P.amber, fontWeight: 600, background: P.amber + "22", padding: "2px 8px", borderRadius: 8 }}>LIVE</div>
                {autoPlay && (
                  <div style={{ fontSize: 10, fontWeight: 700, color: P.teal, background: P.teal + "22", padding: "2px 8px", borderRadius: 8, animation: "abxGlow 1.5s ease-in-out infinite" }}>RUNNING</div>
                )}
              </div>
            </div>

            <div style={{ padding: "0 16px 12px" }}>
              <ProgressStrip currentIdx={stepIdx} completedIds={completed} />
            </div>

            <div style={{ padding: "0 16px 12px" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <AgentAvatar speaking={autoPlay} size={56} />
                <SpeechBubble amharic={script.am} english={script.en} speaking={autoPlay} mode={lang} />
              </div>
              {voiceStatus && (
                <div style={{ marginTop: 6, fontSize: 10, color: P.amber, fontStyle: "italic" }}>{voiceStatus}</div>
              )}
            </div>

            <div style={{ padding: "0 16px", minHeight: 220, display: "flex", flexDirection: "column" }}>
              {renderStepContent()}
            </div>

            {autoPlay && (
              <div style={{
                margin: "12px 16px 0", padding: "10px 14px",
                background: P.bg, borderRadius: 12, border: `1px solid ${P.border}`,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <TimerRing progress={elapsed} label={`${Math.max(0, Math.round((1 - elapsed) * step.seconds))}s`} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: P.white, fontWeight: 600, marginBottom: 2 }}>
                    {step.icon} {step.label}
                  </div>
                  <div style={{ fontSize: 10, color: P.muted }}>
                    Total: {totalSecs}s elapsed · {Math.round(totalProgress * 100)}% complete
                  </div>
                </div>
                <button onClick={() => setAutoPlay(false)} style={{
                  background: "none", border: `1px solid ${P.border}`, borderRadius: 8,
                  color: P.muted, cursor: "pointer", padding: "4px 10px", fontSize: 11,
                }}>Pause</button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ width: 240, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: P.panel, borderRadius: 16, padding: 16, border: `1px solid ${P.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: P.teal, marginBottom: 12 }}>✦ DEMO CONTROLS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {!autoPlay && (
                <button onClick={handleStart} style={{
                  background: P.teal, border: "none", borderRadius: 10,
                  color: P.bg, fontWeight: 700, fontSize: 14, padding: "10px 0",
                  cursor: "pointer", width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}><Play size={14} /> Start Demo</button>
              )}
              {autoPlay && (
                <button onClick={() => setAutoPlay(false)} style={{
                  background: P.amber + "33", border: `1px solid ${P.amber}80`,
                  borderRadius: 10, color: P.amber, fontWeight: 600, fontSize: 13,
                  padding: "8px 0", cursor: "pointer", width: "100%",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}><Pause size={13} /> Pause</button>
              )}
              {!autoPlay && stepIdx > 0 && !isFinal && (
                <button onClick={() => setAutoPlay(true)} style={{
                  background: P.teal + "22", border: `1px solid ${P.teal}60`,
                  borderRadius: 10, color: P.teal, fontWeight: 600, fontSize: 13,
                  padding: "8px 0", cursor: "pointer", width: "100%",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}><Play size={13} /> Resume</button>
              )}
              <button onClick={handleReset} style={{
                background: "none", border: `1px solid ${P.border}`, borderRadius: 10,
                color: P.muted, fontSize: 12, padding: "7px 0", cursor: "pointer",
                width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}><RotateCcw size={12} /> Reset</button>
            </div>

            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${P.border}` }}>
              <div style={{ fontSize: 10, color: P.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>Voice</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setVoiceOn((v) => !v)} title={voiceOn ? "Mute Amara" : "Unmute Amara"} style={{
                  flex: 1, padding: "6px 0", borderRadius: 8, fontSize: 11,
                  background: voiceOn ? P.teal + "22" : P.bg,
                  border: `1px solid ${voiceOn ? P.teal : P.border}`,
                  color: voiceOn ? P.teal : P.muted, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
                }}>
                  {voiceOn ? <Volume2 size={12} /> : <VolumeX size={12} />}
                  {voiceOn ? "On" : "Off"}
                </button>
                <button onClick={() => setLang(lang === "both" ? "am" : lang === "am" ? "en" : "both")} style={{
                  flex: 1, padding: "6px 0", borderRadius: 8, fontSize: 11,
                  background: P.bg, border: `1px solid ${P.border}`, color: P.amber, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
                }}><Languages size={12} /> {lang === "both" ? "AM+EN" : lang === "am" ? "AM" : "EN"}</button>
              </div>
            </div>
          </div>

          <div style={{ background: P.panel, borderRadius: 16, padding: 16, border: `1px solid ${P.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: P.muted, marginBottom: 10 }}>STEPS · 90 SECONDS</div>
            {STEPS.map((s, i) => {
              const done = completed.includes(s.id);
              const active = i === stepIdx;
              return (
                <div key={s.id} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "5px 0",
                  borderBottom: i < STEPS.length - 1 ? `1px solid ${P.border}` : "none",
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", fontSize: 10, flexShrink: 0,
                    display: "grid", placeItems: "center",
                    background: done ? P.green + "33" : active ? P.teal + "22" : P.bg,
                    border: `1.5px solid ${done ? P.green : active ? P.teal : P.border}`,
                    color: done ? P.green : active ? P.teal : P.muted,
                  }}>{done ? "✓" : s.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: done ? P.green : active ? P.white : P.muted, fontWeight: active ? 600 : 400 }}>{s.label}</div>
                    <div style={{ fontSize: 9, color: P.border }}>{s.seconds}s</div>
                  </div>
                </div>
              );
            })}
          </div>

          {(autoPlay || totalMs > 0) && (
            <div style={{ background: P.panel, borderRadius: 16, padding: 16, border: `1px solid ${P.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: P.muted, marginBottom: 10 }}>LIVE METRICS</div>
              {([
                ["Time", `${totalSecs}s / 90s`],
                ["Step", `${stepIdx + 1} / ${STEPS.length}`],
                ["Progress", `${Math.round(totalProgress * 100)}%`],
                ["Status", isFinal ? "✓ Done" : autoPlay ? "Running" : "Paused"],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11 }}>
                  <span style={{ color: P.muted }}>{k}</span>
                  <span style={{ color: isFinal && k === "Status" ? P.green : P.white, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {isFinal && (
            <div style={{
              background: P.green + "18", borderRadius: 16, padding: 16,
              border: `1px solid ${P.green}60`, textAlign: "center", animation: "abxPopIn 0.5s",
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: P.green }}>Onboarding Complete!</div>
              <div style={{ fontSize: 11, color: P.muted, marginTop: 4 }}>{totalSecs} seconds total</div>
              <button onClick={onClose} style={{
                marginTop: 10, padding: "8px 16px", borderRadius: 999, border: "none",
                background: P.green, color: P.bg, fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
