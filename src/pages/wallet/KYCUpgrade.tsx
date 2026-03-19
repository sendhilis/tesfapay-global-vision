/**
 * KYCUpgrade — Full-fledged KYC Level 1 → Level 2 upgrade simulator
 * with LIVE camera feeds for document capture, selfie, and liveness detection.
 *
 * @route /wallet/kyc-upgrade
 * @module Wallet
 *
 * @description 8-step wizard with real camera:
 * (1) Intro with benefits, (2) Document type selection,
 * (3) Front capture via rear camera, (4) Back capture via rear camera,
 * (5) Selfie via front camera, (6) Liveness check with real-time instructions,
 * (7) Review with AI scoring, (8) Processing → Success.
 *
 * Uses navigator.mediaDevices.getUserMedia for live camera feeds.
 * Canvas-based snapshot capture. Simulated AI analysis overlays.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Camera, CheckCircle2,
  Shield, Zap, AlertTriangle, ScanFace, FileText, Eye, RefreshCw,
  Video, X, Loader2
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────── */
type Step = "intro" | "doc-type" | "doc-front" | "doc-back" | "selfie" | "liveness" | "review" | "processing" | "success";

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

/* ─── Live Camera Component ─────────────────────────── */
const LiveCamera = ({
  facingMode = "environment",
  onCapture,
  capturedImage,
  onRetake,
  overlay,
  capturing,
  children,
}: {
  facingMode?: "user" | "environment";
  onCapture: (dataUrl: string) => void;
  capturedImage: string | null;
  onRetake: () => void;
  overlay?: React.ReactNode;
  capturing?: boolean;
  children?: React.ReactNode;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flashEffect, setFlashEffect] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setCameraReady(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
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
    } catch (err: any) {
      console.error("Camera error:", err);
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access."
          : err.name === "NotFoundError"
          ? "No camera found on this device."
          : "Unable to access camera. Please try again."
      );
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  useEffect(() => {
    if (!capturedImage) {
      startCamera();
    }
    return () => stopCamera();
  }, [capturedImage, startCamera, stopCamera]);

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 300);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror for front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    stopCamera();
    onCapture(dataUrl);
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="relative aspect-[4/3] bg-card overflow-hidden">
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
            <AlertTriangle className="w-10 h-10 text-destructive" />
            <p className="text-xs text-center text-muted-foreground">{cameraError}</p>
            <button onClick={startCamera} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
              Retry
            </button>
          </div>
        ) : capturedImage ? (
          <>
            <img src={capturedImage} alt="Captured" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400 font-bold">Captured Successfully</span>
            </div>
            {/* Simulated scan line */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-green-400/60 animate-[scan_2s_ease-in-out_infinite]" />
          </>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
            />
            {!cameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/80 z-10">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-xs text-muted-foreground">Starting camera…</p>
              </div>
            )}
            {/* Flash effect */}
            {flashEffect && <div className="absolute inset-0 bg-white z-30 animate-pulse" />}
            {/* Overlay (guides, face oval, etc.) */}
            {cameraReady && overlay}
            {/* Scan line */}
            {cameraReady && (
              <div className="absolute inset-x-4 top-4 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-[scan_2s_ease-in-out_infinite]" />
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="p-3 flex gap-2">
        {capturedImage ? (
          <button onClick={onRetake} className="flex-1 py-2.5 glass rounded-xl text-xs text-muted-foreground font-semibold flex items-center justify-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Retake
          </button>
        ) : (
          <button
            onClick={takeSnapshot}
            disabled={!cameraReady || capturing}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            {capturing ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…</>
            ) : (
              <><Camera className="w-3.5 h-3.5" /> Capture</>
            )}
          </button>
        )}
      </div>

      {children}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

/* ─── Liveness Camera Component ─────────────────────── */
const LivenessCamera = ({
  onComplete,
}: {
  onComplete: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(
    LIVENESS_INSTRUCTIONS.map(() => false)
  );
  const [analysisOverlay, setAnalysisOverlay] = useState<{
    landmarks: boolean;
    depthMap: boolean;
    antiSpoof: boolean;
  }>({ landmarks: false, depthMap: false, antiSpoof: false });

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
      } catch (err: any) {
        setCameraError("Camera access required for liveness verification.");
      }
    };
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Run liveness sequence once camera is ready
  useEffect(() => {
    if (!cameraReady) return;

    let stepIdx = 0;
    let cancelled = false;

    const runStep = () => {
      if (cancelled || stepIdx >= LIVENESS_INSTRUCTIONS.length) {
        if (!cancelled) {
          // Show analysis overlays sequentially
          setTimeout(() => setAnalysisOverlay((a) => ({ ...a, landmarks: true })), 0);
          setTimeout(() => setAnalysisOverlay((a) => ({ ...a, depthMap: true })), 600);
          setTimeout(() => setAnalysisOverlay((a) => ({ ...a, antiSpoof: true })), 1200);
          setTimeout(() => {
            streamRef.current?.getTracks().forEach((t) => t.stop());
            onComplete();
          }, 2200);
        }
        return;
      }

      setCurrentStep(stepIdx);
      setStepProgress(0);

      let pct = 0;
      const interval = setInterval(() => {
        if (cancelled) { clearInterval(interval); return; }
        pct += 2.5;
        setStepProgress(Math.min(pct, 100));
        if (pct >= 100) {
          clearInterval(interval);
          setCompletedSteps((prev) => {
            const next = [...prev];
            next[stepIdx] = true;
            return next;
          });
          stepIdx++;
          setTimeout(runStep, 500);
        }
      }, 50);
    };

    const timeout = setTimeout(runStep, 1000);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [cameraReady, onComplete]);

  const currentInstruction = LIVENESS_INSTRUCTIONS[Math.min(currentStep, LIVENESS_INSTRUCTIONS.length - 1)];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display font-bold text-xl text-foreground">Liveness Verification</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Follow instructions — AI is watching in real time</p>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {/* Camera view */}
        <div className="relative aspect-square bg-card overflow-hidden">
          {cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
              <AlertTriangle className="w-10 h-10 text-destructive" />
              <p className="text-xs text-center text-muted-foreground">{cameraError}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/80 z-10">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-xs text-muted-foreground">Initializing camera…</p>
                </div>
              )}

              {/* Face oval guide */}
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className={`w-52 h-64 border-[3px] rounded-[50%] transition-colors duration-500 ${
                  completedSteps.every(Boolean) ? "border-green-400" : "border-primary/70"
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

              {/* Scan line */}
              {cameraReady && (
                <div className="absolute inset-x-4 top-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-[scan_1.5s_ease-in-out_infinite] z-10" />
              )}

              {/* AI Analysis overlays */}
              {analysisOverlay.landmarks && (
                <div className="absolute inset-0 z-20 pointer-events-none">
                  {/* Simulated landmark dots */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                    {/* Face outline */}
                    <ellipse cx="50" cy="45" rx="18" ry="24" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.3" opacity="0.6" />
                    {/* Eyes */}
                    <circle cx="42" cy="38" r="1.5" fill="hsl(var(--primary))" opacity="0.8" />
                    <circle cx="58" cy="38" r="1.5" fill="hsl(var(--primary))" opacity="0.8" />
                    {/* Nose */}
                    <circle cx="50" cy="47" r="1" fill="hsl(var(--primary))" opacity="0.6" />
                    {/* Mouth */}
                    <path d="M44 54 Q50 58 56 54" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.4" opacity="0.6" />
                    {/* Connecting lines */}
                    <line x1="42" y1="38" x2="50" y2="47" stroke="hsl(var(--primary))" strokeWidth="0.15" opacity="0.4" />
                    <line x1="58" y1="38" x2="50" y2="47" stroke="hsl(var(--primary))" strokeWidth="0.15" opacity="0.4" />
                    <line x1="42" y1="38" x2="58" y2="38" stroke="hsl(var(--primary))" strokeWidth="0.15" opacity="0.4" />
                    {/* Additional landmark points */}
                    {[[38,35],[62,35],[35,45],[65,45],[40,55],[60,55],[50,30],[50,62]].map(([cx,cy], i) => (
                      <circle key={i} cx={cx} cy={cy} r="0.6" fill="hsl(var(--primary))" opacity="0.5" />
                    ))}
                  </svg>
                </div>
              )}

              {analysisOverlay.depthMap && (
                <div className="absolute top-3 right-3 z-20 glass rounded-lg px-2 py-1">
                  <p className="text-[9px] text-green-400 font-mono font-bold">3D DEPTH ✓</p>
                </div>
              )}

              {analysisOverlay.antiSpoof && (
                <div className="absolute top-3 left-3 z-20 glass rounded-lg px-2 py-1">
                  <p className="text-[9px] text-green-400 font-mono font-bold">ANTI-SPOOF ✓</p>
                </div>
              )}

              {/* LIVE indicator */}
              {cameraReady && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 glass rounded-full px-3 py-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] text-foreground font-bold tracking-wider">LIVE</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Current instruction panel */}
        <div className="p-4 text-center" style={{ background: "var(--glass-gold-bg)" }}>
          <div className="text-4xl mb-2">{currentInstruction.icon}</div>
          <p className="text-sm font-bold text-foreground">{currentInstruction.label}</p>
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-75"
              style={{
                width: `${stepProgress}%`,
                background: "var(--gradient-gold)",
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Step {Math.min(currentStep + 1, LIVENESS_INSTRUCTIONS.length)} of {LIVENESS_INSTRUCTIONS.length}
          </p>
        </div>

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

      {/* Security note */}
      <div className="glass rounded-2xl p-3 flex gap-2 items-center">
        <Shield className="w-4 h-4 text-primary flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Anti-spoofing AI active · 3D depth analysis · Facial landmark tracking · Video is not stored
        </p>
      </div>
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

  const aiScores = { docQuality: 97, faceMatch: 93, liveness: 100, dataExtract: 99 };
  const overall = Math.round(Object.values(aiScores).reduce((a, b) => a + b) / 4);

  const STEPS: Step[] = ["intro", "doc-type", "doc-front", "doc-back", "selfie", "liveness", "review", "processing", "success"];
  const stepIdx = STEPS.indexOf(step);

  const handleCapture = (setter: (img: string | null) => void) => (dataUrl: string) => {
    setAiAnalyzing(true);
    // Simulate AI analysis delay
    setTimeout(() => {
      setter(dataUrl);
      setAiAnalyzing(false);
    }, 1200);
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
      {/* Document frame guides */}
      <div className="absolute inset-6 border-2 border-dashed border-primary/50 rounded-xl z-10 pointer-events-none" />
      {["top-3 left-3", "top-3 right-3", "bottom-3 left-3", "bottom-3 right-3"].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-6 h-6 border-2 border-primary rounded-sm z-10 pointer-events-none`} />
      ))}
      <div className="absolute bottom-3 left-0 right-0 text-center z-10 pointer-events-none">
        <span className="glass rounded-full px-3 py-1 text-[10px] text-muted-foreground">
          Align document within the frame
        </span>
      </div>
    </>
  );

  const selfieOverlay = (
    <>
      {/* Oval face guide */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="w-48 h-56 border-[3px] border-dashed border-primary/60 rounded-[50%]" />
      </div>
      {/* Corner markers */}
      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg z-10 pointer-events-none" />
      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg z-10 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg z-10 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg z-10 pointer-events-none" />
      <div className="absolute bottom-4 left-0 right-0 text-center z-10 pointer-events-none">
        <span className="glass rounded-full px-3 py-1 text-[10px] text-muted-foreground">
          Align your face within the oval
        </span>
      </div>
      {/* LIVE badge */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 glass rounded-full px-3 py-1 pointer-events-none">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] text-foreground font-bold tracking-wider">LIVE</span>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="glass border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => step === "intro" ? navigate(-1) : setStep(STEPS[stepIdx - 1])}
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
              <span className="text-lg">🤖</span>
              <div>
                <p className="text-xs font-bold text-primary">Global AI Verification</p>
                <p className="text-xs text-muted-foreground">This process uses your device camera for real-time document scanning, selfie capture, and liveness verification. Data is encrypted and processed per NBE and PDPO Ethiopia guidelines.</p>
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

            <button onClick={() => setStep("doc-type")} className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" /> Start Live Verification
            </button>
          </div>
        )}

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
              <h2 className="font-display font-bold text-xl text-foreground">Scan Front Side</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Hold document steady within the frame</p>
            </div>
            <div className="glass rounded-2xl p-3 flex gap-2 items-center">
              <Eye className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-xs text-muted-foreground">All 4 corners visible · Avoid glare · Good lighting</p>
            </div>
            <LiveCamera
              facingMode="environment"
              capturedImage={frontImage}
              onCapture={handleCapture(setFrontImage)}
              onRetake={() => setFrontImage(null)}
              overlay={docOverlay}
              capturing={aiAnalyzing}
            />
            {aiAnalyzing && (
              <div className="glass-gold rounded-xl p-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <p className="text-xs text-primary font-bold">AI analyzing document quality…</p>
              </div>
            )}
            <button disabled={!frontImage} onClick={() => setStep("doc-back")}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              Continue to Back Side <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── DOCUMENT BACK (Live Camera) ── */}
        {step === "doc-back" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">Scan Back Side</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Flip document and scan the back</p>
            </div>
            <LiveCamera
              facingMode="environment"
              capturedImage={backImage}
              onCapture={handleCapture(setBackImage)}
              onRetake={() => setBackImage(null)}
              overlay={docOverlay}
              capturing={aiAnalyzing}
            />
            {aiAnalyzing && (
              <div className="glass-gold rounded-xl p-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <p className="text-xs text-primary font-bold">AI reading document data…</p>
              </div>
            )}
            <button disabled={!backImage} onClick={() => setStep("selfie")}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              Continue to Selfie <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── SELFIE (Live Front Camera) ── */}
        {step === "selfie" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">Take Selfie</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Look straight at the front camera</p>
            </div>
            <div className="glass rounded-2xl p-3 flex gap-2 items-center">
              <ScanFace className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-xs text-muted-foreground">Remove glasses · Good lighting · Neutral expression</p>
            </div>
            <LiveCamera
              facingMode="user"
              capturedImage={selfieImage}
              onCapture={handleCapture(setSelfieImage)}
              onRetake={() => setSelfieImage(null)}
              overlay={selfieOverlay}
              capturing={aiAnalyzing}
            />
            {aiAnalyzing && (
              <div className="glass-gold rounded-xl p-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <p className="text-xs text-primary font-bold">AI matching face to document…</p>
              </div>
            )}
            <button disabled={!selfieImage} onClick={() => setStep("liveness")}
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
                  <div key={d.label} className="glass-gold rounded-xl overflow-hidden">
                    <div className="aspect-video relative">
                      {d.img ? (
                        <img src={d.img} alt={d.label} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-2xl">📄</div>
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

            {/* Extracted data */}
            <div className="glass rounded-2xl p-4">
              <p className="text-xs font-bold text-foreground mb-3">Extracted Information</p>
              <div className="space-y-2">
                {[
                  { label: "Full Name", value: "Abebe Girma" },
                  { label: "Date of Birth", value: "15 Mar 1990" },
                  { label: "Document No.", value: "FND-••••••7821" },
                  { label: "Expiry", value: "20 Feb 2030" },
                  { label: "Nationality", value: "Ethiopian" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold text-foreground">{value}</span>
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
                <div className="h-full rounded-full transition-all duration-100" style={{ width: `${processingPct}%`, background: "var(--gradient-gold)" }} />
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
