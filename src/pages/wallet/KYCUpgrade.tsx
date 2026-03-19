/**
 * KYCUpgrade — Multi-step KYC Level 1 → Level 2 upgrade wizard.
 *
 * @route /wallet/kyc-upgrade
 * @module Wallet
 *
 * @description 8-step wizard: (1) Intro with benefits, (2) Document type selection
 * (Fayda ID, Passport, Driver's License, Kebele ID), (3) Front capture,
 * (4) Back capture, (5) Selfie capture, (6) Liveness check, (7) Review all,
 * (8) Processing → Success. Unlocks ETB 50,000 daily limit.
 *
 * @api_endpoints
 * - POST /v1/users/me/kyc/upgrade   → multipart: { documentType, documentFront,
 *                                      documentBack, selfieImage, livenessToken }
 * - GET  /v1/users/me/kyc/status    → { kycLevel, status, dailyLimit }
 *
 * @tables kyc_applications, users
 *
 * @mock_data Camera capture simulated with emoji placeholders.
 * Replace with real camera API + file upload to backend.
 */
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Camera, Upload, CheckCircle2,
  Shield, Zap, AlertTriangle, ScanFace, FileText, Eye, RefreshCw
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────── */
type Step = "intro" | "doc-type" | "doc-front" | "doc-back" | "selfie" | "liveness" | "review" | "processing" | "success";

interface DocCapture { label: string; emoji: string; captured: boolean; }

const DOC_TYPES = [
  { id: "fayda", label: "Fayda National ID", icon: "🪪", recommended: true },
  { id: "passport", label: "Passport", icon: "📘" },
  { id: "driving", label: "Driver's License", icon: "🚗" },
  { id: "kebele", label: "Kebele ID", icon: "🏛️" },
];

/* ─── Helpers ───────────────────────────────────────── */
const StepDot = ({ active, done }: { active: boolean; done: boolean }) => (
  <div className={`w-2 h-2 rounded-full transition-all ${done ? "bg-gold" : active ? "bg-gold/60 scale-125" : "bg-muted"}`} />
);

/* ─── Fake camera capture card ──────────────────────── */
const CaptureCard = ({
  doc, onCapture, capturing, retake
}: {
  doc: DocCapture; onCapture: () => void; capturing: boolean; retake: () => void;
}) => (
  <div className="glass rounded-2xl overflow-hidden">
    <div className="relative aspect-[4/3] flex flex-col items-center justify-center bg-tesfa-dark/40">
      {doc.captured ? (
        <>
          {/* Simulated captured document */}
          <div className="absolute inset-0 bg-gradient-to-br from-tesfa-green/20 to-tesfa-gold/10 flex items-center justify-center">
            <div className="text-center">
              <span className="text-5xl">{doc.emoji}</span>
              <div className="mt-3 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-400 font-bold">Captured</span>
              </div>
            </div>
          </div>
          {/* Scan lines animation */}
          <div className="absolute inset-x-0 top-0 h-0.5 bg-green-400/60 animate-[scan_2s_ease-in-out_infinite]" />
        </>
      ) : (
        <>
          {/* Viewfinder overlay */}
          <div className="absolute inset-4 border-2 border-dashed border-tesfa-gold/40 rounded-xl flex items-center justify-center">
            <div className="text-center space-y-2">
              <Camera className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground">{doc.label}</p>
            </div>
          </div>
          {/* Corner guides */}
          {["top-3 left-3", "top-3 right-3", "bottom-3 left-3", "bottom-3 right-3"].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-5 h-5 border-2 border-tesfa-gold rounded-sm`} />
          ))}
        </>
      )}
    </div>
    <div className="p-3 flex gap-2">
      {doc.captured ? (
        <button onClick={retake} className="flex-1 py-2.5 glass rounded-xl text-xs text-muted-foreground font-semibold flex items-center justify-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Retake
        </button>
      ) : (
        <button onClick={onCapture} disabled={capturing} className="flex-1 py-2.5 rounded-xl bg-gradient-gold text-tesfa-dark text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60">
          {capturing ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Capturing…</> : <><Camera className="w-3.5 h-3.5" /> Capture {doc.label}</>}
        </button>
      )}
    </div>
  </div>
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

/* ─── Main Component ────────────────────────────────── */
const KYCUpgrade = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("intro");
  const [docType, setDocType] = useState("fayda");
  const [front, setFront] = useState<DocCapture>({ label: "Front Side", emoji: "🪪", captured: false });
  const [back, setBack] = useState<DocCapture>({ label: "Back Side", emoji: "📋", captured: false });
  const [selfie, setSelfie] = useState<DocCapture>({ label: "Selfie", emoji: "🤳", captured: false });
  const [capturing, setCapturing] = useState(false);
  const [livenessStep, setLivenessStep] = useState(0);
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [processingPct, setProcessingPct] = useState(0);

  const livenessInstructions = [
    { label: "Look straight at the camera", icon: "👁️" },
    { label: "Turn your head slightly left", icon: "←" },
    { label: "Turn your head slightly right", icon: "→" },
    { label: "Blink naturally", icon: "😉" },
    { label: "Smile briefly", icon: "😊" },
  ];

  const aiScores = { docQuality: 97, faceMatch: 93, liveness: 100, dataExtract: 99 };
  const overall = Math.round(Object.values(aiScores).reduce((a, b) => a + b) / 4);

  const STEPS: Step[] = ["intro", "doc-type", "doc-front", "doc-back", "selfie", "liveness", "review", "processing", "success"];
  const stepIdx = STEPS.indexOf(step);

  const fakeCapture = (setter: React.Dispatch<React.SetStateAction<DocCapture>>) => {
    setCapturing(true);
    setTimeout(() => { setter(p => ({ ...p, captured: true })); setCapturing(false); }, 1800);
  };

  const startLiveness = () => {
    setLivenessStep(0);
    setLivenessProgress(0);
    let idx = 0;
    const tick = () => {
      if (idx >= livenessInstructions.length) { setStep("review"); return; }
      setLivenessStep(idx);
      let pct = 0;
      const prog = setInterval(() => {
        pct += 4;
        setLivenessProgress(pct);
        if (pct >= 100) {
          clearInterval(prog);
          idx++;
          setTimeout(tick, 400);
        }
      }, 60);
    };
    tick();
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

  /* ─── Render ──────────────────────────────────────── */
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
                <Shield className="w-10 h-10 text-gold" />
              </div>
              <h2 className="font-display font-bold text-2xl text-foreground mb-1">Upgrade to Level 2</h2>
              <p className="text-sm text-muted-foreground">Unlock higher limits and premium features</p>
            </div>

            <div className="glass rounded-2xl p-4">
              <p className="text-xs font-bold text-gold mb-3">What you'll unlock instantly</p>
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
                <p className="text-xs font-bold text-gold">Global AI</p>
                <p className="text-xs text-muted-foreground">This process takes approximately 2–3 minutes. Your documents are encrypted and processed securely by Global AI. Data is stored per NBE and PDPO Ethiopia guidelines.</p>
              </div>
            </div>

            <div className="glass rounded-2xl p-3">
              <p className="text-xs font-bold text-foreground mb-2">What you'll need</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: "🪪", label: "Fayda / National ID" },
                  { icon: "🤳", label: "Clear selfie lighting" },
                  { icon: "📶", label: "Stable internet" },
                  { icon: "⏱️", label: "2–3 minutes" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{icon}</span>{label}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setStep("doc-type")} className="w-full py-4 rounded-2xl bg-gradient-gold text-tesfa-dark font-bold text-sm flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" /> Start Verification
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
                  className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${docType === dt.id ? "glass-gold border-tesfa-gold/40" : "glass border-border"}`}>
                  <span className="text-2xl">{dt.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{dt.label}</p>
                    {dt.recommended && <span className="text-[10px] bg-gradient-gold text-tesfa-dark px-2 py-0.5 rounded-full font-bold">Recommended · Fastest</span>}
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${docType === dt.id ? "border-tesfa-gold bg-tesfa-gold" : "border-muted"}`}>
                    {docType === dt.id && <div className="w-2.5 h-2.5 rounded-full bg-tesfa-dark" />}
                  </div>
                </button>
              ))}
            </div>

            <div className="glass rounded-2xl p-3 flex gap-2 items-center">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">Ensure document is valid, not expired, and clearly visible. Damaged or blurry documents will be rejected.</p>
            </div>

            <button onClick={() => setStep("doc-front")} className="w-full py-4 rounded-2xl bg-gradient-gold text-tesfa-dark font-bold text-sm flex items-center justify-center gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── DOCUMENT FRONT ── */}
        {step === "doc-front" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">Capture Front Side</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Place document flat on a dark surface</p>
            </div>

            <div className="glass rounded-2xl p-3 flex gap-2 items-center">
              <Eye className="w-4 h-4 text-gold flex-shrink-0" />
              <p className="text-xs text-muted-foreground">Ensure all 4 corners are visible · Avoid glare · Good lighting required</p>
            </div>

            <CaptureCard doc={front} capturing={capturing} onCapture={() => fakeCapture(setFront)} retake={() => setFront(p => ({ ...p, captured: false }))} />

            <button disabled={!front.captured} onClick={() => setStep("doc-back")}
              className="w-full py-4 rounded-2xl bg-gradient-gold text-tesfa-dark font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              Continue to Back Side <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── DOCUMENT BACK ── */}
        {step === "doc-back" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">Capture Back Side</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Flip document and capture the back</p>
            </div>

            <CaptureCard doc={back} capturing={capturing} onCapture={() => fakeCapture(setBack)} retake={() => setBack(p => ({ ...p, captured: false }))} />

            <button disabled={!back.captured} onClick={() => setStep("selfie")}
              className="w-full py-4 rounded-2xl bg-gradient-gold text-tesfa-dark font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              Continue to Selfie <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── SELFIE ── */}
        {step === "selfie" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">Capture Selfie</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Look straight into the front camera</p>
            </div>

            <div className="glass rounded-2xl p-3 flex gap-2 items-center">
              <ScanFace className="w-4 h-4 text-gold flex-shrink-0" />
              <p className="text-xs text-muted-foreground">Remove glasses, ensure good lighting, keep a neutral expression</p>
            </div>

            {/* Selfie frame */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="relative aspect-square flex items-center justify-center bg-tesfa-dark/40">
                {selfie.captured ? (
                  <div className="absolute inset-0 bg-gradient-to-br from-tesfa-green/20 to-tesfa-gold/10 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-6xl">🤳</span>
                      <div className="mt-3 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-400 font-bold">Selfie Captured</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Oval face guide */}
                    <div className="w-48 h-56 border-2 border-dashed border-tesfa-gold/50 rounded-full flex items-center justify-center">
                      <span className="text-4xl opacity-30">👤</span>
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <p className="text-xs text-muted-foreground">Align your face within the oval</p>
                    </div>
                  </>
                )}
              </div>
              <div className="p-3">
                {selfie.captured ? (
                  <button onClick={() => setSelfie(p => ({ ...p, captured: false }))} className="w-full py-2.5 glass rounded-xl text-xs text-muted-foreground font-semibold flex items-center justify-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" /> Retake Selfie
                  </button>
                ) : (
                  <button onClick={() => fakeCapture(setSelfie)} disabled={capturing} className="w-full py-2.5 rounded-xl bg-gradient-gold text-tesfa-dark text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60">
                    {capturing ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Capturing…</> : <><Camera className="w-3.5 h-3.5" /> Take Selfie</>}
                  </button>
                )}
              </div>
            </div>

            <button disabled={!selfie.captured} onClick={() => { setStep("liveness"); setTimeout(startLiveness, 800); }}
              className="w-full py-4 rounded-2xl bg-gradient-gold text-tesfa-dark font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              Proceed to Liveness Check <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── LIVENESS ── */}
        {step === "liveness" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">Liveness Verification</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Follow the on-screen instructions</p>
            </div>

            <div className="glass rounded-2xl overflow-hidden">
              {/* Camera view */}
              <div className="relative aspect-square bg-tesfa-dark/50 flex items-center justify-center">
                <div className="w-52 h-60 border-2 border-tesfa-gold/60 rounded-full flex items-center justify-center">
                  <span className="text-6xl animate-pulse">👤</span>
                </div>
                {/* Scanning effect */}
                <div className="absolute inset-x-4 top-4 h-0.5 bg-gradient-to-r from-transparent via-tesfa-gold to-transparent animate-[scan_1.5s_ease-in-out_infinite]" />
              </div>

              {/* Current instruction */}
              <div className="p-4 text-center glass-gold">
                <div className="text-4xl mb-2">{livenessInstructions[Math.min(livenessStep, livenessInstructions.length - 1)].icon}</div>
                <p className="text-sm font-bold text-foreground">
                  {livenessInstructions[Math.min(livenessStep, livenessInstructions.length - 1)].label}
                </p>
                <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-gold rounded-full transition-all duration-75" style={{ width: `${livenessProgress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Step {Math.min(livenessStep + 1, livenessInstructions.length)} of {livenessInstructions.length}</p>
              </div>

              {/* Steps checklist */}
              <div className="p-3 grid grid-cols-5 gap-1">
                {livenessInstructions.map((inst, i) => (
                  <div key={i} className={`rounded-lg py-1.5 px-1 text-center transition-all ${i < livenessStep ? "glass-gold" : i === livenessStep ? "glass border border-tesfa-gold/30" : "glass opacity-40"}`}>
                    <span className="text-xs">{i < livenessStep ? "✓" : inst.icon}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-3 flex gap-2 items-center">
              <Shield className="w-4 h-4 text-gold flex-shrink-0" />
              <p className="text-xs text-muted-foreground">Anti-spoofing AI active · Video is not stored · NBE compliant</p>
            </div>
          </div>
        )}

        {/* ── REVIEW ── */}
        {step === "review" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">Review & Submit</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Tesfa AI has pre-screened your documents</p>
            </div>

            {/* Captured docs summary */}
            <div className="glass rounded-2xl p-4">
              <p className="text-xs font-bold text-gold mb-3">Captured Documents</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Front ID", emoji: "🪪", ok: true },
                  { label: "Back ID", emoji: "📋", ok: true },
                  { label: "Selfie", emoji: "🤳", ok: true },
                ].map(d => (
                  <div key={d.label} className="glass-gold rounded-xl aspect-video flex flex-col items-center justify-center gap-1">
                    <span className="text-2xl">{d.emoji}</span>
                    <p className="text-[10px] text-muted-foreground">{d.label}</p>
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* AI Pre-screening */}
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🤖</span>
                <p className="text-xs font-bold text-gold">Tesfa AI Pre-screening Results</p>
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

            <button onClick={startProcessing} className="w-full py-4 rounded-2xl bg-gradient-gold text-tesfa-dark font-bold text-sm flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" /> Submit for Verification
            </button>
          </div>
        )}

        {/* ── PROCESSING ── */}
        {step === "processing" && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 text-center">
            <div className="w-28 h-28 gradient-green rounded-3xl flex items-center justify-center animate-pulse">
              <Shield className="w-14 h-14 text-gold" />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl text-foreground">Verifying…</h2>
              <p className="text-sm text-muted-foreground mt-1">Tesfa AI is processing your documents</p>
            </div>

            {/* Progress ring simulation */}
            <div className="w-full glass rounded-2xl p-5 space-y-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="text-gold font-bold">{processingPct}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-gold rounded-full transition-all duration-100" style={{ width: `${processingPct}%` }} />
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
              <CheckCircle2 className="w-14 h-14 text-gold" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-3">
                <CheckCircle2 className="w-3 h-3" /> KYC Level 2 Approved
              </div>
              <h2 className="font-display font-bold text-2xl text-foreground">You're Verified!</h2>
              <p className="text-sm text-muted-foreground mt-1">Your limits have been updated instantly</p>
            </div>

            {/* Updated limits card */}
            <div className="w-full glass-gold rounded-2xl p-4">
              <p className="text-xs font-bold text-gold mb-3 text-left">🎉 New Limits Active Now</p>
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

            {/* Loyalty bonus */}
            <div className="w-full glass rounded-2xl p-3 flex gap-3 items-center">
              <span className="text-2xl">⭐</span>
              <div className="text-left">
                <p className="text-xs font-bold text-gold">500 Bonus Tesfa Points Awarded!</p>
                <p className="text-xs text-muted-foreground">For completing KYC Level 2 verification</p>
              </div>
            </div>

            <div className="w-full space-y-2.5">
              <button onClick={() => navigate("/wallet")} className="w-full py-4 rounded-2xl bg-gradient-gold text-tesfa-dark font-bold text-sm">
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
