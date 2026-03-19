/**
 * KYCUpgrade — Full KYC Level 1 → Level 2 upgrade simulator
 * with LIVE camera feeds, real-time AI data extraction overlays,
 * and interactive liveness verification.
 *
 * @route /wallet/kyc-upgrade
 * @module Wallet
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Camera, CheckCircle2,
  Shield, Zap, AlertTriangle, ScanFace, FileText, Eye, RefreshCw,
  Loader2
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────── */
type Step = "intro" | "camera-check" | "doc-type" | "doc-front" | "doc-back" | "selfie" | "liveness" | "review" | "processing" | "success";

const DOC_TYPES = [
  { id: "fayda", label: "Fayda National ID", icon: "🪪", recommended: true },
  { id: "passport", label: "Passport", icon: "📘" },
  { id: "driving", label: "Driver's License", icon: "🚗" },
  { id: "kebele", label: "Kebele ID", icon: "🏛️" },
];

const LIVENESS_INSTRUCTIONS = [
  { label: "Look straight at the camera", icon: "👁️", action: "center" },
  { label: "Slowly turn your head LEFT", icon: "⬅️", action: "left" },
  { label: "Slowly turn your head RIGHT", icon: "➡️", action: "right" },
  { label: "Blink your eyes naturally", icon: "😉", action: "blink" },
  { label: "Smile for the camera", icon: "😊", action: "smile" },
];

/* Mock extracted data that appears as if the AI reads the ID */
const MOCK_FRONT_DATA = [
  { label: "Full Name", value: "Abebe Girma Tadesse", delay: 600 },
  { label: "Date of Birth", value: "15 Mar 1990", delay: 1100 },
  { label: "Gender", value: "Male", delay: 1500 },
  { label: "Nationality", value: "Ethiopian", delay: 1900 },
  { label: "Document No.", value: "FND-2847391-7821", delay: 2400 },
  { label: "Issue Date", value: "20 Feb 2023", delay: 2800 },
];

const MOCK_BACK_DATA = [
  { label: "Expiry Date", value: "20 Feb 2030", delay: 600 },
  { label: "Place of Birth", value: "Addis Ababa", delay: 1100 },
  { label: "Address", value: "Bole Sub-city, Woreda 03", delay: 1600 },
  { label: "Issuing Authority", value: "NIDA Ethiopia", delay: 2100 },
  { label: "MRZ Code", value: "P<ETH<<GIRMA<<ABEBE<<<<<<<<<<<<", delay: 2600 },
];

/* ─── Step Dot ──────────────────────────────────────── */
const StepDot = ({ active, done }: { active: boolean; done: boolean }) => (
  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${done ? "bg-primary" : active ? "bg-primary/60 scale-125" : "bg-muted"}`} />
);

/* ─── AI Score Bar ──────────────────────────────────── */
const ScoreBar = ({ label, value, delay = 0 }: { label: string; value: number; delay?: number }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-bold ${value >= 80 ? "text-green-400" : value >= 60 ? "text-yellow-400" : "text-red-400"}`}>{value}%</span>
    </div>
    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-1000 ${value >= 80 ? "bg-green-400" : value >= 60 ? "bg-yellow-400" : "bg-red-400"}`}
        style={{ width: `${value}%`, transitionDelay: `${delay}ms` }}
      />
    </div>
  </div>
);

/* ─── Extracted Data Overlay (animated line-by-line reveal) ── */
const ExtractedDataOverlay = ({
  data,
  visible,
}: {
  data: { label: string; value: string; delay: number }[];
  visible: boolean;
}) => {
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    if (!visible) { setRevealedCount(0); return; }
    const timers: ReturnType<typeof setTimeout>[] = [];
    data.forEach((item, i) => {
      timers.push(setTimeout(() => setRevealedCount(i + 1), item.delay));
    });
    return () => timers.forEach(clearTimeout);
  }, [visible, data]);

  if (!visible || revealedCount === 0) return null;

  return (
    <div className="glass rounded-2xl p-4 border border-primary/20 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🤖</span>
        <p className="text-xs font-bold text-primary">AI Data Extraction — Live</p>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[9px] text-green-400 font-mono font-bold">SCANNING</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.slice(0, revealedCount).map((item, i) => (
          <div
            key={item.label}
            className="flex justify-between text-xs items-center animate-in slide-in-from-left-2 fade-in duration-300"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-mono font-semibold text-foreground bg-primary/5 px-2 py-0.5 rounded">
              {item.value}
            </span>
          </div>
        ))}
        {revealedCount < data.length && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin text-primary" />
            <span className="animate-pulse">Reading document…</span>
          </div>
        )}
        {revealedCount >= data.length && (
          <div className="flex items-center gap-1.5 text-xs text-green-400 font-bold mt-1 pt-2 border-t border-border">
            <CheckCircle2 className="w-3.5 h-3.5" />
            All fields extracted successfully
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Simulated Camera Canvas (fallback when no real camera) ── */
const SimulatedCameraCanvas = ({
  facingMode,
  canvasRef,
  onReady,
}: {
  facingMode: "user" | "environment";
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onReady: () => void;
}) => {
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 640;
    canvas.height = 480;

    // Signal ready after a brief "initialization"
    const readyTimer = setTimeout(onReady, 600);

    const draw = (timestamp: number) => {
      timeRef.current = timestamp;
      const w = canvas.width;
      const h = canvas.height;

      // Dark background with subtle noise
      ctx.fillStyle = "#1a1d23";
      ctx.fillRect(0, 0, w, h);

      // Animated subtle gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, `rgba(30,35,45,1)`);
      grad.addColorStop(0.5, `rgba(25,30,40,${0.8 + Math.sin(timestamp / 2000) * 0.2})`);
      grad.addColorStop(1, `rgba(20,25,35,1)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle noise/grain effect
      for (let i = 0; i < 800; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const brightness = Math.random() * 30 + 20;
        ctx.fillStyle = `rgba(${brightness},${brightness},${brightness + 10},0.15)`;
        ctx.fillRect(x, y, 1, 1);
      }

      if (facingMode === "user") {
        // Draw a simulated face/head shape for selfie
        const cx = w / 2 + Math.sin(timestamp / 3000) * 5;
        const cy = h / 2 - 20 + Math.cos(timestamp / 2500) * 3;

        // Head oval
        ctx.beginPath();
        ctx.ellipse(cx, cy, 65, 85, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(180,150,120,0.7)";
        ctx.fill();
        ctx.strokeStyle = "rgba(200,170,140,0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Hair
        ctx.beginPath();
        ctx.ellipse(cx, cy - 50, 70, 45, 0, Math.PI, Math.PI * 2);
        ctx.fillStyle = "rgba(40,30,25,0.8)";
        ctx.fill();

        // Eyes
        const eyeY = cy - 10;
        [-20, 20].forEach((offset) => {
          ctx.beginPath();
          ctx.ellipse(cx + offset, eyeY, 8, 5, 0, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx + offset, eyeY, 3, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(50,35,25,0.9)";
          ctx.fill();
        });

        // Nose
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy + 5);
        ctx.quadraticCurveTo(cx, cy + 18, cx + 5, cy + 5);
        ctx.strokeStyle = "rgba(150,120,90,0.5)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Mouth
        ctx.beginPath();
        ctx.ellipse(cx, cy + 30, 15, 5, 0, 0, Math.PI);
        ctx.fillStyle = "rgba(180,100,90,0.6)";
        ctx.fill();

        // Shoulders
        ctx.beginPath();
        ctx.ellipse(cx, cy + 130, 120, 60, 0, Math.PI, Math.PI * 2);
        ctx.fillStyle = "rgba(60,70,100,0.7)";
        ctx.fill();
      } else {
        // Draw simulated ID card for document scanning
        const cardX = w / 2 - 130 + Math.sin(timestamp / 4000) * 3;
        const cardY = h / 2 - 85 + Math.cos(timestamp / 3500) * 2;
        const cardW = 260;
        const cardH = 170;

        // Card shadow
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(cardX + 4, cardY + 4, cardW, cardH);

        // Card body
        const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
        cardGrad.addColorStop(0, "#e8e4d8");
        cardGrad.addColorStop(1, "#d4d0c4");
        ctx.fillStyle = cardGrad;
        ctx.fillRect(cardX, cardY, cardW, cardH);

        // Card border
        ctx.strokeStyle = "rgba(150,140,120,0.5)";
        ctx.lineWidth = 1;
        ctx.strokeRect(cardX, cardY, cardW, cardH);

        // Header stripe
        ctx.fillStyle = "rgba(0,100,60,0.8)";
        ctx.fillRect(cardX, cardY, cardW, 28);

        // Header text
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "bold 10px monospace";
        ctx.fillText("FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA", cardX + 12, cardY + 18);

        // Photo placeholder
        ctx.fillStyle = "rgba(180,160,140,0.6)";
        ctx.fillRect(cardX + 12, cardY + 38, 55, 70);
        ctx.strokeStyle = "rgba(130,120,100,0.5)";
        ctx.strokeRect(cardX + 12, cardY + 38, 55, 70);

        // Mini face in photo
        ctx.beginPath();
        ctx.ellipse(cardX + 39, cardY + 58, 14, 18, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(160,130,100,0.7)";
        ctx.fill();

        // Text lines
        ctx.fillStyle = "rgba(40,40,40,0.8)";
        ctx.font = "9px monospace";
        const lines = [
          "Name: Abebe Girma Tadesse",
          "DOB: 15/03/1990",
          "Gender: Male",
          "Nationality: Ethiopian",
          "ID No: FND-2847391-7821",
        ];
        lines.forEach((line, i) => {
          ctx.fillText(line, cardX + 78, cardY + 50 + i * 16);
        });

        // MRZ zone
        ctx.fillStyle = "rgba(60,60,60,0.6)";
        ctx.font = "7px monospace";
        ctx.fillText("P<ETH<<GIRMA<<ABEBE<<<<<<<<<<<<<<<<", cardX + 12, cardY + 128);
        ctx.fillText("FND2847391ETH9003152M3002202<<<<<<<", cardX + 12, cardY + 140);

        // Hologram effect
        const holoX = cardX + 180 + Math.sin(timestamp / 1000) * 10;
        const holoY = cardY + 100;
        const holoGrad = ctx.createRadialGradient(holoX, holoY, 0, holoX, holoY, 25);
        holoGrad.addColorStop(0, `rgba(100,200,255,${0.15 + Math.sin(timestamp / 800) * 0.1})`);
        holoGrad.addColorStop(0.5, `rgba(200,100,255,${0.1 + Math.cos(timestamp / 600) * 0.05})`);
        holoGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = holoGrad;
        ctx.fillRect(cardX, cardY, cardW, cardH);
      }

      // Vignette
      const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.4)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(readyTimer);
    };
  }, [facingMode, canvasRef, onReady]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
    />
  );
};

/* ─── Live Camera Component ─────────────────────────── */
const LiveCamera = ({
  facingMode = "environment",
  onCapture,
  capturedImage,
  onRetake,
  overlay,
  capturing,
}: {
  facingMode?: "user" | "environment";
  onCapture: (dataUrl: string) => void;
  capturedImage: string | null;
  onRetake: () => void;
  overlay?: React.ReactNode;
  capturing?: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [useSimulation, setUseSimulation] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);
  const [scanLineY, setScanLineY] = useState(0);

  const startCamera = useCallback(async () => {
    try {
      setCameraReady(false);
      setUseSimulation(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
        };
      }
    } catch {
      // Fallback to simulation mode
      console.log("Camera unavailable, using simulation mode");
      setUseSimulation(true);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!capturedImage) {
      startCamera();
    }
    return () => stopCamera();
  }, [capturedImage, startCamera, stopCamera]);

  // Animated scan line
  useEffect(() => {
    if ((!cameraReady && !useSimulation) || capturedImage) return;
    let raf: number;
    let y = 0;
    const animate = () => {
      y = (y + 0.5) % 100;
      setScanLineY(y);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [cameraReady, useSimulation, capturedImage]);

  const takeSnapshot = () => {
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 400);

    const canvas = canvasRef.current || document.createElement("canvas");

    if (useSimulation && simCanvasRef.current) {
      // Capture from simulation canvas
      canvas.width = simCanvasRef.current.width;
      canvas.height = simCanvasRef.current.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(simCanvasRef.current, 0, 0);
    } else if (videoRef.current) {
      // Capture from real camera
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      if (facingMode === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0);
    } else {
      return;
    }

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    stopCamera();
    onCapture(dataUrl);
  };

  const isReady = cameraReady || (useSimulation && cameraReady);
  const showFeed = cameraReady || useSimulation;

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="relative aspect-[4/3] bg-card overflow-hidden">
        {capturedImage ? (
          <>
            <img src={capturedImage} alt="Captured" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
            <div
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent z-10 transition-all"
              style={{ top: `${scanLineY}%`, opacity: capturing ? 1 : 0 }}
            />
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400 font-bold">Captured Successfully</span>
            </div>
          </>
        ) : (
          <>
            {/* Real camera video */}
            {!useSimulation && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
              />
            )}
            {/* Simulated camera canvas */}
            {useSimulation && (
              <SimulatedCameraCanvas
                facingMode={facingMode}
                canvasRef={simCanvasRef}
                onReady={() => setCameraReady(true)}
              />
            )}
            {!showFeed && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/90 z-10">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-xs text-muted-foreground">Initializing camera…</p>
                <p className="text-[10px] text-muted-foreground/60">Please allow camera access when prompted</p>
              </div>
            )}
            {flashEffect && <div className="absolute inset-0 bg-white z-30 animate-pulse" />}
            {showFeed && (
              <div
                className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent z-10 pointer-events-none"
                style={{ top: `${scanLineY}%` }}
              />
            )}
            {showFeed && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 glass rounded-full px-3 py-1 pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] text-foreground font-bold tracking-widest">
                  {useSimulation ? "DEMO" : "LIVE"}
                </span>
              </div>
            )}
            {showFeed && overlay}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="p-3 flex gap-2">
        {capturedImage ? (
          <button onClick={onRetake} className="flex-1 py-2.5 glass rounded-xl text-xs text-muted-foreground font-semibold flex items-center justify-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Retake Photo
          </button>
        ) : (
          <button
            onClick={takeSnapshot}
            disabled={!showFeed || capturing}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {capturing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
            ) : (
              <><Camera className="w-4 h-4" /> 📸 Capture Now</>
            )}
          </button>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

/* ─── Liveness Camera Component ─────────────────────── */
const LivenessCamera = ({ onComplete }: { onComplete: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const simCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [useSimulation, setUseSimulation] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(LIVENESS_INSTRUCTIONS.map(() => false));
  const [analysisPhase, setAnalysisPhase] = useState<"scanning" | "landmarks" | "depth" | "antispoof" | "done">("scanning");
  const [biometricScores, setBiometricScores] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setCameraReady(true);
          };
        }
      } catch {
        // Fallback to simulation
        console.log("Camera unavailable for liveness, using simulation");
        setUseSimulation(true);
        setCameraReady(true);
      }
    };
    startCamera();
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  // Liveness steps sequence
  useEffect(() => {
    if (!cameraReady) return;
    let stepIdx = 0;
    let cancelled = false;

    const runStep = () => {
      if (cancelled || stepIdx >= LIVENESS_INSTRUCTIONS.length) {
        if (!cancelled) {
          // Run analysis phases
          setAnalysisPhase("landmarks");
          setTimeout(() => {
            setBiometricScores(prev => [...prev, { label: "Facial Landmarks", value: 98 }]);
            setAnalysisPhase("depth");
          }, 800);
          setTimeout(() => {
            setBiometricScores(prev => [...prev, { label: "3D Depth Map", value: 96 }]);
            setAnalysisPhase("antispoof");
          }, 1600);
          setTimeout(() => {
            setBiometricScores(prev => [...prev, { label: "Anti-Spoof Check", value: 99 }]);
            setAnalysisPhase("done");
          }, 2400);
          setTimeout(() => {
            setBiometricScores(prev => [...prev, { label: "Liveness Score", value: 100 }]);
          }, 3000);
          setTimeout(() => {
            streamRef.current?.getTracks().forEach((t) => t.stop());
            onComplete();
          }, 3800);
        }
        return;
      }

      setCurrentStep(stepIdx);
      setStepProgress(0);
      let pct = 0;
      const interval = setInterval(() => {
        if (cancelled) { clearInterval(interval); return; }
        pct += 2;
        setStepProgress(Math.min(pct, 100));
        if (pct >= 100) {
          clearInterval(interval);
          setCompletedSteps(prev => { const n = [...prev]; n[stepIdx] = true; return n; });
          stepIdx++;
          setTimeout(runStep, 400);
        }
      }, 40);
    };

    const timeout = setTimeout(runStep, 800);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [cameraReady, onComplete]);

  const currentInstruction = LIVENESS_INSTRUCTIONS[Math.min(currentStep, LIVENESS_INSTRUCTIONS.length - 1)];
  const allStepsDone = completedSteps.every(Boolean);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display font-bold text-xl text-foreground">Liveness Verification</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Follow instructions — AI is watching in real time</p>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="relative aspect-square bg-card overflow-hidden">
            <>
              {/* Real camera video */}
              {!useSimulation && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                />
              )}
              {/* Simulated camera canvas */}
              {useSimulation && (
                <SimulatedCameraCanvas
                  facingMode="user"
                  canvasRef={simCanvasRef}
                  onReady={() => {}}
                />
              )}
              {!cameraReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/90 z-10">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-xs text-muted-foreground">Starting front camera…</p>
                </div>
              )}

              {/* Face oval guide */}
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className={`w-52 h-64 border-[3px] rounded-[50%] transition-all duration-700 ${
                  allStepsDone ? "border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.3)]" : "border-primary/70"
                }`} />
              </div>

              {/* Corner markers */}
              {cameraReady && (
                <>
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg z-10" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg z-10" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg z-10" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg z-10" />
                </>
              )}

              {/* AI landmark mesh overlay (appears during analysis) */}
              {(analysisPhase === "landmarks" || analysisPhase === "depth" || analysisPhase === "antispoof" || analysisPhase === "done") && (
                <div className="absolute inset-0 z-20 pointer-events-none animate-in fade-in duration-500">
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                    <ellipse cx="50" cy="45" rx="18" ry="24" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.3" opacity="0.7" />
                    <circle cx="42" cy="38" r="1.5" fill="hsl(var(--primary))" opacity="0.9"><animate attributeName="r" values="1.5;2;1.5" dur="1s" repeatCount="indefinite"/></circle>
                    <circle cx="58" cy="38" r="1.5" fill="hsl(var(--primary))" opacity="0.9"><animate attributeName="r" values="1.5;2;1.5" dur="1s" repeatCount="indefinite"/></circle>
                    <circle cx="50" cy="47" r="1" fill="hsl(var(--primary))" opacity="0.7" />
                    <path d="M44 54 Q50 58 56 54" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.4" opacity="0.7" />
                    <line x1="42" y1="38" x2="50" y2="47" stroke="hsl(var(--primary))" strokeWidth="0.2" opacity="0.4" />
                    <line x1="58" y1="38" x2="50" y2="47" stroke="hsl(var(--primary))" strokeWidth="0.2" opacity="0.4" />
                    <line x1="42" y1="38" x2="58" y2="38" stroke="hsl(var(--primary))" strokeWidth="0.2" opacity="0.4" />
                    {[[38,35],[62,35],[35,45],[65,45],[40,55],[60,55],[50,30],[50,62],[45,42],[55,42],[48,50],[52,50]].map(([cx,cy], i) => (
                      <circle key={i} cx={cx} cy={cy} r="0.5" fill="hsl(var(--primary))" opacity="0.5" />
                    ))}
                  </svg>
                </div>
              )}

              {/* Analysis badges */}
              {(analysisPhase === "depth" || analysisPhase === "antispoof" || analysisPhase === "done") && (
                <div className="absolute top-3 right-3 z-20 glass rounded-lg px-2 py-1 animate-in slide-in-from-right-2">
                  <p className="text-[9px] text-green-400 font-mono font-bold">3D DEPTH ✓</p>
                </div>
              )}
              {(analysisPhase === "antispoof" || analysisPhase === "done") && (
                <div className="absolute top-3 left-3 z-20 glass rounded-lg px-2 py-1 animate-in slide-in-from-left-2">
                  <p className="text-[9px] text-green-400 font-mono font-bold">ANTI-SPOOF ✓</p>
                </div>
              )}
              {analysisPhase === "done" && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 glass rounded-lg px-3 py-1 animate-in slide-in-from-bottom-2">
                  <p className="text-[9px] text-green-400 font-mono font-bold">✅ LIVENESS CONFIRMED</p>
                </div>
              )}

              {/* LIVE/DEMO indicator */}
              {cameraReady && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 glass rounded-full px-3 py-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] text-foreground font-bold tracking-widest">{useSimulation ? "DEMO" : "LIVE"}</span>
                </div>
              )}
            </>
        </div>

        {/* Current instruction panel */}
        {!allStepsDone && (
          <div className="p-4 text-center border-t border-border">
            <div className="text-3xl mb-2">{currentInstruction.icon}</div>
            <p className="text-sm font-bold text-foreground">{currentInstruction.label}</p>
            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-75"
                style={{ width: `${stepProgress}%`, background: "var(--gradient-gold, hsl(var(--primary)))" }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Step {Math.min(currentStep + 1, LIVENESS_INSTRUCTIONS.length)} of {LIVENESS_INSTRUCTIONS.length}
            </p>
          </div>
        )}

        {/* Steps checklist */}
        <div className="p-3 grid grid-cols-5 gap-1.5">
          {LIVENESS_INSTRUCTIONS.map((inst, i) => (
            <div
              key={i}
              className={`rounded-xl py-2 px-1 text-center transition-all ${
                completedSteps[i]
                  ? "bg-green-500/10 border border-green-500/20"
                  : i === currentStep
                  ? "glass border border-primary/30"
                  : "glass opacity-40"
              }`}
            >
              <span className="text-sm">{completedSteps[i] ? "✅" : inst.icon}</span>
              <p className="text-[8px] text-muted-foreground mt-0.5 leading-tight">
                {completedSteps[i] ? "Done" : inst.action}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Biometric scores appearing in real-time */}
      {biometricScores.length > 0 && (
        <div className="glass rounded-2xl p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🧬</span>
            <p className="text-xs font-bold text-primary">Biometric Analysis — Live</p>
          </div>
          <div className="space-y-2">
            {biometricScores.map((score, i) => (
              <div key={i} className="flex justify-between items-center text-xs animate-in slide-in-from-left-2 fade-in duration-300">
                <span className="text-muted-foreground">{score.label}</span>
                <span className="font-mono font-bold text-green-400">{score.value}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-3 flex gap-2 items-center">
        <Shield className="w-4 h-4 text-primary flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Anti-spoofing AI active · 3D depth analysis · Facial landmark tracking · Video is not stored
        </p>
      </div>
    </div>
  );
};

/* ─── Camera Pre-Check Component ────────────────────── */
const CameraPreCheck = ({ onPass }: { onPass: () => void }) => {
  const [status, setStatus] = useState<"idle" | "checking" | "granted" | "denied" | "unavailable">("idle");
  const [showInstructions, setShowInstructions] = useState(false);

  const checkCamera = useCallback(async () => {
    setStatus("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stream.getTracks().forEach((t) => t.stop());
      setStatus("granted");
      setTimeout(onPass, 1200);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setStatus("denied");
        setShowInstructions(true);
      } else if (err.name === "NotFoundError" || err.name === "NotReadableError") {
        setStatus("unavailable");
      } else {
        // Likely in iframe without camera — allow demo mode
        setStatus("granted");
        setTimeout(onPass, 1200);
      }
    }
  }, [onPass]);

  const browserInstructions = [
    {
      browser: "Chrome (Desktop)",
      icon: "🌐",
      steps: [
        "Click the 🔒 lock icon in the address bar",
        "Find \"Camera\" in site permissions",
        "Change to \"Allow\"",
        "Reload the page",
      ],
    },
    {
      browser: "Chrome (Android)",
      icon: "📱",
      steps: [
        "Tap ⋮ menu → Settings → Site Settings",
        "Tap \"Camera\" → Enable",
        "Or tap the 🔒 icon in address bar",
        "Toggle Camera to \"Allow\"",
      ],
    },
    {
      browser: "Safari (iPhone/iPad)",
      icon: "🍎",
      steps: [
        "Open Settings → Safari",
        "Scroll to \"Camera\" under Privacy",
        "Set to \"Allow\" or \"Ask\"",
        "Return and reload this page",
      ],
    },
    {
      browser: "Firefox",
      icon: "🦊",
      steps: [
        "Click the 🔒 icon in the address bar",
        "Click \"Clear permissions\" for camera",
        "Reload and click \"Allow\" when prompted",
      ],
    },
    {
      browser: "Samsung Internet",
      icon: "📲",
      steps: [
        "Tap ☰ menu → Settings → Sites and downloads",
        "Tap \"Camera\" and enable access",
        "Reload this page",
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display font-bold text-xl text-foreground">📷 Camera Access Check</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          We need your camera for document scanning, selfie, and liveness verification
        </p>
      </div>

      {/* Visual camera status card */}
      <div className="glass-gold rounded-3xl p-6 text-center">
        <div className={`w-24 h-24 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 ${
          status === "granted" ? "bg-green-500/20" : status === "denied" || status === "unavailable" ? "bg-destructive/20" : "gradient-green"
        }`}>
          {status === "checking" ? (
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          ) : status === "granted" ? (
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          ) : status === "denied" || status === "unavailable" ? (
            <AlertTriangle className="w-12 h-12 text-destructive" />
          ) : (
            <Camera className="w-12 h-12 text-primary" />
          )}
        </div>
        <h3 className="font-display font-bold text-lg text-foreground mb-1">
          {status === "idle" && "Camera Permission Required"}
          {status === "checking" && "Checking Camera Access…"}
          {status === "granted" && "Camera Ready! ✅"}
          {status === "denied" && "Camera Access Denied"}
          {status === "unavailable" && "No Camera Detected"}
        </h3>
        <p className="text-xs text-muted-foreground">
          {status === "idle" && "Tap below to test your camera before we begin"}
          {status === "checking" && "Please allow camera access when your browser prompts you"}
          {status === "granted" && "Proceeding to document verification…"}
          {status === "denied" && "Camera is blocked. Follow the instructions below to enable it."}
          {status === "unavailable" && "Connect a camera or try from a device with a built-in camera."}
        </p>
      </div>

      {/* What we'll use the camera for */}
      {(status === "idle" || status === "denied") && (
        <div className="glass rounded-2xl p-4">
          <p className="text-xs font-bold text-primary mb-3">What we'll use your camera for</p>
          <div className="space-y-3">
            {[
              { icon: "🪪", title: "Document Scanning", desc: "Capture front & back of your ID using the rear camera" },
              { icon: "🤳", title: "Selfie Capture", desc: "Take a selfie with the front camera for face matching" },
              { icon: "👁️", title: "Liveness Check", desc: "Follow prompts to prove you're a real person, not a photo" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{icon}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{title}</p>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Privacy assurance */}
      {(status === "idle" || status === "denied") && (
        <div className="glass rounded-2xl p-3 flex gap-2 items-start">
          <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-primary">Your Privacy is Protected</p>
            <p className="text-[10px] text-muted-foreground">
              Camera feed is processed locally on your device. No video is recorded or stored. Only final snapshots are securely transmitted for verification.
            </p>
          </div>
        </div>
      )}

      {/* Browser-specific instructions (shown when denied) */}
      {showInstructions && (
        <div className="glass rounded-2xl p-4 border border-destructive/20 animate-in slide-in-from-bottom-2 duration-300">
          <p className="text-xs font-bold text-foreground mb-3">🔧 How to Enable Camera Access</p>
          <div className="space-y-3">
            {browserInstructions.map(({ browser, icon, steps }) => (
              <details key={browser} className="group">
                <summary className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground py-2 px-3 glass rounded-xl hover:bg-muted/50 transition-colors">
                  <span className="text-base">{icon}</span>
                  {browser}
                  <ChevronRight className="w-3 h-3 ml-auto transition-transform group-open:rotate-90 text-muted-foreground" />
                </summary>
                <ol className="mt-2 ml-8 space-y-1.5 pb-2">
                  {steps.map((s, i) => (
                    <li key={i} className="text-[11px] text-muted-foreground flex gap-2 items-start">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {status === "idle" && (
        <button onClick={checkCamera} className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2">
          <Camera className="w-4 h-4" /> Check Camera Access
        </button>
      )}
      {status === "denied" && (
        <div className="space-y-2">
          <button onClick={checkCamera} className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <button onClick={onPass} className="w-full py-3 rounded-2xl glass text-sm text-muted-foreground font-semibold flex items-center justify-center gap-2">
            Continue in Demo Mode →
          </button>
        </div>
      )}
      {status === "unavailable" && (
        <div className="space-y-2">
          <button onClick={checkCamera} className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry Detection
          </button>
          <button onClick={onPass} className="w-full py-3 rounded-2xl glass text-sm text-muted-foreground font-semibold flex items-center justify-center gap-2">
            Continue in Demo Mode →
          </button>
        </div>
      )}
      {status === "granted" && (
        <div className="glass rounded-2xl p-4 flex items-center gap-3 border border-green-500/20">
          <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
          <p className="text-sm text-green-400 font-bold">Camera verified — starting KYC flow…</p>
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ────────────────────────────────── */
const KYCUpgrade = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("intro");
  const [docType, setDocType] = useState("fayda");
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [processingPct, setProcessingPct] = useState(0);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [showFrontData, setShowFrontData] = useState(false);
  const [showBackData, setShowBackData] = useState(false);
  const [selfieMatch, setSelfieMatch] = useState(false);

  const aiScores = { docQuality: 97, faceMatch: 93, liveness: 100, dataExtract: 99 };
  const overall = Math.round(Object.values(aiScores).reduce((a, b) => a + b) / 4);

  const STEPS: Step[] = ["intro", "camera-check", "doc-type", "doc-front", "doc-back", "selfie", "liveness", "review", "processing", "success"];
  const stepIdx = STEPS.indexOf(step);

  const handleFrontCapture = (dataUrl: string) => {
    setAiAnalyzing(true);
    setTimeout(() => {
      setFrontImage(dataUrl);
      setAiAnalyzing(false);
      setShowFrontData(true);
    }, 1500);
  };

  const handleBackCapture = (dataUrl: string) => {
    setAiAnalyzing(true);
    setTimeout(() => {
      setBackImage(dataUrl);
      setAiAnalyzing(false);
      setShowBackData(true);
    }, 1500);
  };

  const handleSelfieCapture = (dataUrl: string) => {
    setAiAnalyzing(true);
    setTimeout(() => {
      setSelfieImage(dataUrl);
      setAiAnalyzing(false);
      setSelfieMatch(true);
    }, 1800);
  };

  const startProcessing = () => {
    setStep("processing");
    let p = 0;
    const t = setInterval(() => {
      p += 1;
      setProcessingPct(p);
      if (p >= 100) { clearInterval(t); setTimeout(() => setStep("success"), 500); }
    }, 40);
  };

  const docOverlay = (
    <>
      <div className="absolute inset-6 border-2 border-dashed border-primary/50 rounded-xl z-10 pointer-events-none" />
      {["top-3 left-3", "top-3 right-3", "bottom-3 left-3", "bottom-3 right-3"].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-8 h-8 border-2 border-primary rounded-sm z-10 pointer-events-none`} />
      ))}
      <div className="absolute bottom-3 left-0 right-0 text-center z-10 pointer-events-none">
        <span className="glass rounded-full px-3 py-1.5 text-[10px] text-muted-foreground font-semibold">
          📐 Align document within the frame
        </span>
      </div>
    </>
  );

  const selfieOverlay = (
    <>
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="w-48 h-56 border-[3px] border-dashed border-primary/60 rounded-[50%]" />
      </div>
      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg z-10 pointer-events-none" />
      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg z-10 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg z-10 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg z-10 pointer-events-none" />
      <div className="absolute bottom-4 left-0 right-0 text-center z-10 pointer-events-none">
        <span className="glass rounded-full px-3 py-1.5 text-[10px] text-muted-foreground font-semibold">
          🤳 Align your face within the oval
        </span>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="glass border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => step === "intro" ? navigate(-1) : setStep(STEPS[Math.max(0, stepIdx - 1)])}
          className="p-2 glass rounded-xl">
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="font-display font-bold text-sm text-foreground">KYC Level 2 Upgrade</h1>
          <p className="text-[10px] text-muted-foreground">Secured by Global AI · NBE Compliant</p>
        </div>
        <div className="flex gap-1">
          {STEPS.slice(0, -2).map((s, i) => (
            <StepDot key={s} active={STEPS.indexOf(step) === i} done={STEPS.indexOf(step) > i} />
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">

        {/* ── INTRO ── */}
        {step === "intro" && (
          <div className="space-y-4">
            <div className="glass-gold rounded-3xl p-6 text-center">
              <div className="w-20 h-20 mx-auto gradient-green rounded-2xl flex items-center justify-center mb-4">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-display font-bold text-2xl text-foreground mb-1">Upgrade to Level 2</h2>
              <p className="text-sm text-muted-foreground">Unlock higher limits and premium features</p>
            </div>

            <div className="glass rounded-2xl p-4">
              <p className="text-xs font-bold text-primary mb-3">What you'll unlock instantly</p>
              <div className="space-y-2.5">
                {[
                  { icon: "💸", label: "Daily Limit", from: "ETB 10,000", to: "ETB 50,000" },
                  { icon: "📤", label: "Send per Transaction", from: "ETB 5,000", to: "ETB 25,000" },
                  { icon: "🏦", label: "Bank Transfer", from: "Disabled", to: "Enabled" },
                  { icon: "💳", label: "Micro-Loan Eligibility", from: "Basic", to: "Up to ETB 15,000" },
                  { icon: "🌍", label: "International Remittance", from: "Restricted", to: "Full Access" },
                ].map(({ icon, label, from, to }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-lg w-7">{icon}</span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-foreground">{label}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-muted-foreground line-through">{from}</span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-green-400 font-bold">{to}</span>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-3 flex gap-2 items-start">
              <span className="text-lg">📷</span>
              <div>
                <p className="text-xs font-bold text-primary">Live Camera Required</p>
                <p className="text-xs text-muted-foreground">This process uses your <strong>real device camera</strong> for live document scanning, selfie capture, and liveness verification. Please allow camera access when prompted.</p>
              </div>
            </div>

            <div className="glass rounded-2xl p-3 border border-primary/20">
              <p className="text-xs font-bold text-foreground mb-2">📱 What you'll need</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: "🪪", label: "Valid ID document" },
                  { icon: "📷", label: "Working camera" },
                  { icon: "💡", label: "Good lighting" },
                  { icon: "⏱️", label: "2–3 minutes" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{icon}</span>{label}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setStep("camera-check")} className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" /> Start Live Verification
            </button>
          </div>
        )}

        {/* ── CAMERA PRE-CHECK ── */}
        {step === "camera-check" && <CameraPreCheck onPass={() => setStep("doc-type")} />}

        {/* ── DOCUMENT TYPE ── */}
        {step === "doc-type" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">Choose Document Type</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Select your primary identity document</p>
            </div>
            <div className="space-y-2.5">
              {DOC_TYPES.map(dt => (
                <button key={dt.id} onClick={() => setDocType(dt.id)}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${docType === dt.id ? "glass-gold border-primary/40" : "glass border-border"}`}>
                  <span className="text-2xl">{dt.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{dt.label}</p>
                    {dt.recommended && <span className="text-[10px] bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-2 py-0.5 rounded-full font-bold">Recommended · Fastest</span>}
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${docType === dt.id ? "border-primary bg-primary" : "border-muted"}`}>
                    {docType === dt.id && <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />}
                  </div>
                </button>
              ))}
            </div>
            <div className="glass rounded-2xl p-3 flex gap-2 items-center">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">Ensure document is valid, not expired, and clearly visible.</p>
            </div>
            <button onClick={() => setStep("doc-front")} className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── DOCUMENT FRONT (Live Camera) ── */}
        {step === "doc-front" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">📄 Scan Front Side</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Hold your ID steady — camera will capture it live</p>
            </div>
            <div className="glass rounded-2xl p-3 flex gap-2 items-center">
              <Eye className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-xs text-muted-foreground">All 4 corners visible · Avoid glare · Good lighting</p>
            </div>
            <LiveCamera
              facingMode="environment"
              capturedImage={frontImage}
              onCapture={handleFrontCapture}
              onRetake={() => { setFrontImage(null); setShowFrontData(false); }}
              overlay={docOverlay}
              capturing={aiAnalyzing}
            />
            {aiAnalyzing && !frontImage && (
              <div className="glass rounded-xl p-3 flex items-center gap-2 border border-primary/20">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <p className="text-xs text-primary font-bold">AI analyzing document quality…</p>
              </div>
            )}
            {/* Show extracted data from front side */}
            <ExtractedDataOverlay data={MOCK_FRONT_DATA} visible={showFrontData} />
            <button disabled={!frontImage || !showFrontData} onClick={() => setStep("doc-back")}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              Continue to Back Side <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── DOCUMENT BACK (Live Camera) ── */}
        {step === "doc-back" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">📄 Scan Back Side</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Flip document and hold steady for the camera</p>
            </div>
            <LiveCamera
              facingMode="environment"
              capturedImage={backImage}
              onCapture={handleBackCapture}
              onRetake={() => { setBackImage(null); setShowBackData(false); }}
              overlay={docOverlay}
              capturing={aiAnalyzing}
            />
            {aiAnalyzing && !backImage && (
              <div className="glass rounded-xl p-3 flex items-center gap-2 border border-primary/20">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <p className="text-xs text-primary font-bold">AI reading document data…</p>
              </div>
            )}
            {/* Show extracted data from back side */}
            <ExtractedDataOverlay data={MOCK_BACK_DATA} visible={showBackData} />
            <button disabled={!backImage || !showBackData} onClick={() => setStep("selfie")}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              Continue to Selfie <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── SELFIE (Live Front Camera) ── */}
        {step === "selfie" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">🤳 Take Selfie</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Look straight at the front camera</p>
            </div>
            <div className="glass rounded-2xl p-3 flex gap-2 items-center">
              <ScanFace className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-xs text-muted-foreground">Remove glasses · Good lighting · Neutral expression</p>
            </div>
            <LiveCamera
              facingMode="user"
              capturedImage={selfieImage}
              onCapture={handleSelfieCapture}
              onRetake={() => { setSelfieImage(null); setSelfieMatch(false); }}
              overlay={selfieOverlay}
              capturing={aiAnalyzing}
            />
            {aiAnalyzing && !selfieImage && (
              <div className="glass rounded-xl p-3 flex items-center gap-2 border border-primary/20">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <p className="text-xs text-primary font-bold">AI matching face to document photo…</p>
              </div>
            )}
            {/* Selfie face match result */}
            {selfieMatch && (
              <div className="glass rounded-2xl p-4 border border-green-500/20 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🧬</span>
                  <p className="text-xs font-bold text-primary">Face Match Analysis</p>
                  <span className="ml-auto text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-lg font-bold">93% Match</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Face Geometry", value: "96%", ok: true },
                    { label: "Photo vs ID Match", value: "93%", ok: true },
                    { label: "Image Quality", value: "98%", ok: true },
                    { label: "Lighting Score", value: "91%", ok: true },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className={`font-mono font-bold ${item.ok ? "text-green-400" : "text-red-400"}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-green-400 font-bold mt-2 pt-2 border-t border-border">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Face verified — matches document photo
                </div>
              </div>
            )}
            <button disabled={!selfieImage || !selfieMatch} onClick={() => setStep("liveness")}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              Proceed to Liveness Check <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── LIVENESS (Real-time Camera + Instructions) ── */}
        {step === "liveness" && (
          <LivenessCamera onComplete={() => setStep("review")} />
        )}

        {/* ── REVIEW ── */}
        {step === "review" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">Review & Submit</h2>
              <p className="text-sm text-muted-foreground mt-0.5">AI has pre-screened your documents</p>
            </div>

            {/* Captured docs with real thumbnails */}
            <div className="glass rounded-2xl p-4">
              <p className="text-xs font-bold text-primary mb-3">Captured Documents</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Front ID", img: frontImage },
                  { label: "Back ID", img: backImage },
                  { label: "Selfie", img: selfieImage },
                ].map(d => (
                  <div key={d.label} className="glass rounded-xl overflow-hidden border border-border">
                    <div className="aspect-video relative">
                      {d.img ? (
                        <img src={d.img} alt={d.label} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-2xl bg-muted/30">📄</div>
                      )}
                    </div>
                    <div className="p-1.5 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                      <p className="text-[10px] text-muted-foreground">{d.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Pre-screening */}
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🤖</span>
                <p className="text-xs font-bold text-primary">Global AI Pre-screening</p>
                <span className="ml-auto text-xs bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-lg font-bold">
                  {overall}% Score
                </span>
              </div>
              <div className="space-y-3">
                <ScoreBar label="Document Quality" value={aiScores.docQuality} delay={0} />
                <ScoreBar label="Face Match" value={aiScores.faceMatch} delay={200} />
                <ScoreBar label="Liveness Check" value={aiScores.liveness} delay={400} />
                <ScoreBar label="Data Extraction" value={aiScores.dataExtract} delay={600} />
              </div>
            </div>

            {/* Extracted data summary */}
            <div className="glass rounded-2xl p-4">
              <p className="text-xs font-bold text-foreground mb-3">📋 Extracted Information</p>
              <div className="space-y-2">
                {[...MOCK_FRONT_DATA, ...MOCK_BACK_DATA].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold text-foreground font-mono">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-3">
              <p className="text-[10px] text-muted-foreground text-center">
                By submitting, you consent to Global Bank Ethiopia processing your biometric data for identity verification per PDPO Ethiopia and NBE directives.
              </p>
            </div>

            <button onClick={startProcessing} className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" /> Submit for Verification
            </button>
          </div>
        )}

        {/* ── PROCESSING ── */}
        {step === "processing" && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 text-center">
            <div className="w-28 h-28 gradient-green rounded-3xl flex items-center justify-center animate-pulse">
              <Shield className="w-14 h-14 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl text-foreground">Verifying…</h2>
              <p className="text-sm text-muted-foreground mt-1">Global AI is processing your documents</p>
            </div>
            <div className="w-full glass rounded-2xl p-5 space-y-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="text-primary font-bold">{processingPct}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-100" style={{ width: `${processingPct}%`, background: "var(--gradient-gold, hsl(var(--primary)))" }} />
              </div>
              <div className="space-y-1.5 mt-2">
                {[
                  { label: "Document authenticity check", threshold: 20 },
                  { label: "Face match verification", threshold: 45 },
                  { label: "Liveness analysis", threshold: 65 },
                  { label: "Database cross-reference", threshold: 85 },
                  { label: "Account upgrade provisioning", threshold: 99 },
                ].map(({ label, threshold }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${processingPct >= threshold ? "bg-green-500" : "bg-muted"}`}>
                      {processingPct >= threshold && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <p className={`text-xs transition-colors ${processingPct >= threshold ? "text-foreground" : "text-muted-foreground"}`}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-5 text-center">
            <div className="w-28 h-28 gradient-green rounded-3xl flex items-center justify-center">
              <CheckCircle2 className="w-14 h-14 text-primary" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-3">
                <CheckCircle2 className="w-3 h-3" /> KYC Level 2 Approved
              </div>
              <h2 className="font-display font-bold text-2xl text-foreground">You're Verified!</h2>
              <p className="text-sm text-muted-foreground mt-1">Your limits have been updated instantly</p>
            </div>
            <div className="w-full glass-gold rounded-2xl p-4">
              <p className="text-xs font-bold text-primary mb-3 text-left">🎉 New Limits Active Now</p>
              <div className="space-y-2">
                {[
                  { icon: "💸", label: "Daily Limit", value: "ETB 50,000" },
                  { icon: "📤", label: "Per Transaction", value: "ETB 25,000" },
                  { icon: "🏦", label: "Bank Transfer", value: "Enabled" },
                  { icon: "💳", label: "Micro-Loan", value: "Up to ETB 15,000" },
                  { icon: "🌍", label: "International Remittance", value: "Full Access" },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><span>{icon}</span>{label}</span>
                    <span className="font-bold text-green-400">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full glass rounded-2xl p-3 flex gap-3 items-center">
              <span className="text-2xl">⭐</span>
              <div className="text-left">
                <p className="text-xs font-bold text-primary">500 Bonus Tesfa Points Awarded!</p>
                <p className="text-xs text-muted-foreground">For completing KYC Level 2 verification</p>
              </div>
            </div>
            <div className="w-full space-y-2.5">
              <button onClick={() => navigate("/wallet")} className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm">
                Return to Wallet
              </button>
              <button onClick={() => navigate("/wallet/profile")} className="w-full py-3 rounded-2xl glass text-sm text-muted-foreground font-semibold">
                View Profile
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">Verification ID: KYC2-{Date.now().toString().slice(-8)} · Global Bank Ethiopia</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KYCUpgrade;
