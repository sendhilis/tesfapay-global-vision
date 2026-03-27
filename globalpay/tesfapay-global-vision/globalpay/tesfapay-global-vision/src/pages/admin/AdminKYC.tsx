/**
 * AdminKYC — KYC document review queue.
 *
 * @route /admin/kyc
 * @module Admin Console
 *
 * @description Queue of pending KYC Level 2 applications. Each entry shows:
 * user info, document type, AI verification score, AI verdict, risk level.
 * Actions: View documents, Approve, Reject with note.
 *
 * Now connected to the shared KycApplicationContext so wallet-submitted
 * applications appear in real time alongside mock data.
 *
 * @api_endpoints
 * - GET /v1/admin/kyc/pending?page=0&size=20                → pending applications
 * - PUT /v1/admin/kyc/{applicationId}/review  → { decision: APPROVED|REJECTED, note }
 *
 * @tables kyc_applications, users
 */
import { useState } from "react";
import { Check, X, AlertTriangle, Clock, Eye, ScanFace, FileText, Loader2 } from "lucide-react";
import { useKycApplications, type KycApplication } from "@/contexts/KycApplicationContext";

/* ─── Static mock data (pre-existing queue) ─── */
const staticQueue: KycApplication[] = [
  {
    id: "KYC-4421", user: "Meseret Tadesse", phone: "+251911100001", type: "Level 1 → Level 2",
    submitted: "Feb 18, 2024 09:30", docType: "Fayda National ID", aiScore: 92,
    aiVerdict: "Approved", risk: "Low", region: "Addis Ababa",
    frontImage: null, backImage: null, selfieImage: null,
    scores: { docQuality: 95, faceMatch: 91, liveness: 100, dataExtract: 82 },
    extractedData: [
      { label: "Full Name", value: "Meseret Tadesse" },
      { label: "Date of Birth", value: "08 Jun 1988" },
      { label: "Document No.", value: "FND-1129384-4561" },
    ],
    status: "pending",
  },
  {
    id: "KYC-4422", user: "Bereket Alemu", phone: "+251922200002", type: "New Registration",
    submitted: "Feb 18, 2024 08:15", docType: "Passport", aiScore: 78,
    aiVerdict: "Review", risk: "Medium", region: "Dire Dawa",
    frontImage: null, backImage: null, selfieImage: null,
    scores: { docQuality: 82, faceMatch: 74, liveness: 88, dataExtract: 68 },
    extractedData: [
      { label: "Full Name", value: "Bereket Alemu" },
      { label: "Date of Birth", value: "22 Nov 1995" },
      { label: "Document No.", value: "EP-8827163" },
    ],
    status: "pending",
  },
  {
    id: "KYC-4423", user: "Marta Haile", phone: "+251933300003", type: "Level 1 → Level 2",
    submitted: "Feb 17, 2024 17:45", docType: "Driver's License", aiScore: 45,
    aiVerdict: "Rejected", risk: "High", region: "Hawassa",
    frontImage: null, backImage: null, selfieImage: null,
    scores: { docQuality: 40, faceMatch: 38, liveness: 62, dataExtract: 40 },
    extractedData: [
      { label: "Full Name", value: "Marta Haile" },
      { label: "Date of Birth", value: "03 Jan 1992" },
    ],
    status: "pending",
  },
  {
    id: "KYC-4424", user: "Seifu Bekele", phone: "+251944400004", type: "New Registration",
    submitted: "Feb 17, 2024 16:30", docType: "Kebele ID", aiScore: 85,
    aiVerdict: "Approved", risk: "Low", region: "Bahir Dar",
    frontImage: null, backImage: null, selfieImage: null,
    scores: { docQuality: 88, faceMatch: 84, liveness: 92, dataExtract: 76 },
    extractedData: [
      { label: "Full Name", value: "Seifu Bekele" },
      { label: "Date of Birth", value: "19 Sep 1987" },
      { label: "Document No.", value: "KBL-443291" },
    ],
    status: "pending",
  },
  {
    id: "KYC-4425", user: "Liyu Girma", phone: "+251955500005", type: "Agent KYC",
    submitted: "Feb 17, 2024 14:00", docType: "Business License + ID", aiScore: 88,
    aiVerdict: "Approved", risk: "Low", region: "Mekelle",
    frontImage: null, backImage: null, selfieImage: null,
    scores: { docQuality: 90, faceMatch: 86, liveness: 94, dataExtract: 82 },
    extractedData: [
      { label: "Full Name", value: "Liyu Girma" },
      { label: "Date of Birth", value: "11 Apr 1990" },
      { label: "Document No.", value: "BL-998271 / FND-7782910-3321" },
    ],
    status: "pending",
  },
];

const verdictColor: Record<string, string> = {
  Approved: "text-green-400 bg-green-500/10 border-green-500/20",
  Review: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  Rejected: "text-red-400 bg-red-500/10 border-red-500/20",
};

const statusBadge: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  approved: "text-green-400 bg-green-500/10 border-green-500/20",
  rejected: "text-red-400 bg-red-500/10 border-red-500/20",
};

/* ─── Score Bar ─── */
const ScoreBar = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-bold ${value >= 80 ? "text-green-400" : value >= 60 ? "text-yellow-400" : "text-red-400"}`}>{value}%</span>
    </div>
    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${value >= 80 ? "bg-green-400" : value >= 60 ? "bg-yellow-400" : "bg-red-400"}`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

const AdminKYC = () => {
  const { applications: liveApps, reviewApplication } = useKycApplications();
  const [selected, setSelected] = useState<KycApplication | null>(null);
  const [filter, setFilter] = useState("All");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewedStatic, setReviewedStatic] = useState<Record<string, { status: string; note?: string }>>({});

  // Merge live submissions (newest first) with static mock queue
  const allApps: KycApplication[] = [...liveApps, ...staticQueue];

  // Apply review overrides for static items
  const withReviews = allApps.map(app => {
    const override = reviewedStatic[app.id];
    if (override) return { ...app, status: override.status as KycApplication["status"], reviewNote: override.note };
    return app;
  });

  const filtered = withReviews.filter(k => {
    if (filter === "All") return true;
    if (filter === "Pending") return k.status === "pending";
    if (filter === "Reviewed") return k.status !== "pending";
    return k.aiVerdict === filter;
  });

  const pendingCount = withReviews.filter(a => a.status === "pending").length;
  const approvedCount = withReviews.filter(a => a.aiVerdict === "Approved").length;
  const reviewCount = withReviews.filter(a => a.aiVerdict === "Review").length;
  const rejectedCount = withReviews.filter(a => a.aiVerdict === "Rejected").length;
  const liveCount = liveApps.length;

  const handleReview = (id: string, decision: "approved" | "rejected") => {
    // Check if it's a live app
    const isLive = liveApps.some(a => a.id === id);
    if (isLive) {
      reviewApplication(id, decision, reviewNote);
    } else {
      setReviewedStatic(prev => ({ ...prev, [id]: { status: decision, note: reviewNote } }));
    }
    setReviewNote("");
    setSelected(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-foreground">KYC Review Queue</h1>
          <p className="text-sm text-muted-foreground">
            {pendingCount} pending · AI pre-screened · Manual review required for flagged
          </p>
        </div>
        <div className="flex items-center gap-3">
          {liveCount > 0 && (
            <div className="flex items-center gap-2 glass rounded-xl px-3 py-1.5 border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-primary font-bold">{liveCount} New Submission{liveCount > 1 ? "s" : ""}</span>
            </div>
          )}
          <div className="flex items-center gap-2 glass-gold px-3 py-1.5 rounded-xl">
            <span className="text-xs text-gold font-bold">🤖 Global AI Active</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "AI Pre-approved", value: String(approvedCount), color: "text-green-400", icon: Check },
          { label: "Needs Review", value: String(reviewCount), color: "text-yellow-400", icon: Clock },
          { label: "AI Rejected", value: String(rejectedCount), color: "text-red-400", icon: X },
          { label: "Live Submissions", value: String(liveCount), color: "text-primary", icon: ScanFace },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="glass rounded-2xl p-3">
            <Icon className={`w-4 h-4 ${color} mb-2`} />
            <p className={`text-xl font-display font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {["All", "Pending", "Approved", "Review", "Rejected", "Reviewed"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${filter === f ? "bg-gradient-gold text-tesfa-dark" : "glass text-muted-foreground"}`}>{f}</button>
        ))}
      </div>

      {/* Queue list */}
      <div className="space-y-3">
        {filtered.map(kyc => {
          const isLive = liveApps.some(a => a.id === kyc.id);
          const hasImages = !!(kyc.frontImage || kyc.selfieImage);
          return (
            <div key={kyc.id} className={`glass rounded-2xl p-4 flex items-center gap-4 transition-all ${isLive ? "border border-primary/30" : ""}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden ${isLive ? "border-2 border-primary/40" : "gradient-green"}`}>
                {kyc.selfieImage ? (
                  <img src={kyc.selfieImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  kyc.user.split(" ").map(n => n[0]).join("")
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold text-foreground">{kyc.user}</p>
                  <span className="text-xs font-mono text-muted-foreground">{kyc.id}</span>
                  {isLive && (
                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold border border-primary/20">LIVE</span>
                  )}
                  {hasImages && (
                    <span className="text-[9px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded-full font-bold border border-green-500/20">📷 DOCS</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{kyc.phone} · {kyc.region} · {kyc.docType}</p>
                <p className="text-xs text-muted-foreground">{kyc.type} · Submitted: {kyc.submitted}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Status badge if reviewed */}
                {kyc.status !== "pending" && (
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${statusBadge[kyc.status]}`}>
                    {kyc.status === "approved" ? "✅ Approved" : "❌ Rejected"}
                  </span>
                )}
                {/* AI Score */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">AI Score</p>
                  <p className={`text-sm font-bold ${kyc.aiScore >= 80 ? "text-green-400" : kyc.aiScore >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                    {kyc.aiScore}%
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${verdictColor[kyc.aiVerdict]}`}>{kyc.aiVerdict}</span>
                <button onClick={() => { setSelected(kyc); setReviewNote(""); }} className="p-2 glass rounded-xl hover:bg-muted">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-muted-foreground text-sm">No applications match this filter</p>
          </div>
        )}
      </div>

      {/* ─── Detail Modal ─── */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="glass w-full max-w-lg rounded-3xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="font-display font-bold text-xl text-foreground">{selected.user}</h3>
                <p className="text-sm text-muted-foreground">{selected.id} · {selected.type}</p>
                {selected.status !== "pending" && (
                  <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-lg text-xs font-bold border ${statusBadge[selected.status]}`}>
                    {selected.status === "approved" ? "✅ Already Approved" : "❌ Already Rejected"}
                  </span>
                )}
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 glass rounded-xl">✕</button>
            </div>

            {/* Document preview — real images or placeholders */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: "Front ID", img: selected.frontImage, emoji: "📄" },
                { label: "Back ID", img: selected.backImage, emoji: "📄" },
                { label: "Selfie", img: selected.selfieImage, emoji: "🤳" },
              ].map(doc => (
                <div key={doc.label} className="glass rounded-2xl overflow-hidden border border-border">
                  <div className="aspect-video relative">
                    {doc.img ? (
                      <img src={doc.img} alt={doc.label} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-muted/20">
                        <span className="text-xl">{doc.emoji}</span>
                        <p className="text-[9px] text-muted-foreground">No image</p>
                      </div>
                    )}
                  </div>
                  <div className="p-1.5 text-center">
                    <p className="text-[10px] text-muted-foreground">{doc.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Analysis Scores */}
            <div className="glass-gold rounded-xl p-3 mb-4">
              <p className="text-xs font-bold text-gold mb-2">🤖 Global AI Analysis</p>
              <div className="space-y-2">
                <ScoreBar label="Document Quality" value={selected.scores.docQuality} />
                <ScoreBar label="Face Match" value={selected.scores.faceMatch} />
                <ScoreBar label="Liveness Check" value={selected.scores.liveness} />
                <ScoreBar label="Data Extraction" value={selected.scores.dataExtract} />
              </div>
              <div className="mt-2 pt-2 border-t border-border flex justify-between text-xs">
                <span className="text-muted-foreground">Overall Score</span>
                <span className={`font-bold ${selected.aiScore >= 80 ? "text-green-400" : selected.aiScore >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                  {selected.aiScore}%
                </span>
              </div>
            </div>

            {/* Extracted Data */}
            {selected.extractedData.length > 0 && (
              <div className="glass rounded-xl p-3 mb-4">
                <p className="text-xs font-bold text-foreground mb-2">📋 Extracted Information</p>
                <div className="space-y-1.5">
                  {selected.extractedData.map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-mono font-semibold text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review note input */}
            {selected.status === "pending" && (
              <div className="mb-4">
                <label className="text-xs font-bold text-foreground block mb-1.5">Review Note (optional)</label>
                <textarea
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  placeholder="Add a note for the audit trail…"
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none h-16"
                />
              </div>
            )}

            {/* Action buttons */}
            {selected.status === "pending" ? (
              <div className="flex gap-3">
                <button onClick={() => handleReview(selected.id, "rejected")} className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold flex items-center justify-center gap-1">
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
                <button onClick={() => setSelected(null)} className="flex-1 py-2.5 rounded-xl glass text-sm font-semibold text-muted-foreground">Request Info</button>
                <button onClick={() => handleReview(selected.id, "approved")} className="flex-1 py-2.5 rounded-xl bg-gradient-gold text-tesfa-dark text-sm font-bold flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>
              </div>
            ) : (
              <div className="glass rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  This application has been <strong className="text-foreground">{selected.status}</strong>
                  {selected.reviewNote && <> — "{selected.reviewNote}"</>}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminKYC;
