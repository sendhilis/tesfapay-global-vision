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
 * @api_endpoints
 * - GET /v1/admin/kyc/pending?page=0&size=20                → pending applications
 * - PUT /v1/admin/kyc/{applicationId}/review  → { decision: APPROVED|REJECTED, note }
 *
 * @tables kyc_applications, users
 *
 * @mock_data 5 KYC applications hardcoded. Replace with useQuery.
 */
import { useState } from "react";
import { Check, X, AlertTriangle, Clock, Eye } from "lucide-react";

const kycQueue = [
  { id: "KYC-4421", user: "Meseret Tadesse", phone: "+251911100001", type: "Level 1 → Level 2", submitted: "Feb 18, 2024 09:30", docType: "Fayda National ID", aiScore: 92, aiVerdict: "Approved", risk: "Low", region: "Addis Ababa" },
  { id: "KYC-4422", user: "Bereket Alemu", phone: "+251922200002", type: "New Registration", submitted: "Feb 18, 2024 08:15", docType: "Passport", aiScore: 78, aiVerdict: "Review", risk: "Medium", region: "Dire Dawa" },
  { id: "KYC-4423", user: "Marta Haile", phone: "+251933300003", type: "Level 1 → Level 2", submitted: "Feb 17, 2024 17:45", docType: "Driver's License", aiScore: 45, aiVerdict: "Rejected", risk: "High", region: "Hawassa" },
  { id: "KYC-4424", user: "Seifu Bekele", phone: "+251944400004", type: "New Registration", submitted: "Feb 17, 2024 16:30", docType: "Kebele ID", aiScore: 85, aiVerdict: "Approved", risk: "Low", region: "Bahir Dar" },
  { id: "KYC-4425", user: "Liyu Girma", phone: "+251955500005", type: "Agent KYC", submitted: "Feb 17, 2024 14:00", docType: "Business License + ID", aiScore: 88, aiVerdict: "Approved", risk: "Low", region: "Mekelle" },
];

const verdictColor: Record<string, string> = {
  Approved: "text-green-400 bg-green-500/10 border-green-500/20",
  Review: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  Rejected: "text-red-400 bg-red-500/10 border-red-500/20",
};

const AdminKYC = () => {
  const [selected, setSelected] = useState<typeof kycQueue[0] | null>(null);
  const [filter, setFilter] = useState("All");

  const filtered = kycQueue.filter(k => filter === "All" || k.aiVerdict === filter);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-foreground">KYC Review Queue</h1>
          <p className="text-sm text-muted-foreground">156 pending · AI pre-screened · Manual review required for flagged</p>
        </div>
        <div className="flex items-center gap-2 glass-gold px-3 py-1.5 rounded-xl">
          <span className="text-xs text-gold font-bold">🤖 Global AI Active</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "AI Pre-approved", value: "98", color: "text-green-400", icon: Check },
          { label: "Needs Review", value: "41", color: "text-yellow-400", icon: Clock },
          { label: "AI Rejected", value: "17", color: "text-red-400", icon: X },
          { label: "Liveness Failed", value: "8", color: "text-orange-400", icon: AlertTriangle },
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
        {["All", "Approved", "Review", "Rejected"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${filter === f ? "bg-gradient-gold text-tesfa-dark" : "glass text-muted-foreground"}`}>{f}</button>
        ))}
      </div>

      {/* Queue list */}
      <div className="space-y-3">
        {filtered.map(kyc => (
          <div key={kyc.id} className="glass rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-green flex items-center justify-center text-sm font-bold flex-shrink-0">
              {kyc.user.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-bold text-foreground">{kyc.user}</p>
                <span className="text-xs font-mono text-muted-foreground">{kyc.id}</span>
              </div>
              <p className="text-xs text-muted-foreground">{kyc.phone} · {kyc.region} · {kyc.docType}</p>
              <p className="text-xs text-muted-foreground">{kyc.type} · Submitted: {kyc.submitted}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* AI Score */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">AI Score</p>
                <p className={`text-sm font-bold ${kyc.aiScore >= 80 ? "text-green-400" : kyc.aiScore >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                  {kyc.aiScore}%
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${verdictColor[kyc.aiVerdict]}`}>{kyc.aiVerdict}</span>
              <button onClick={() => setSelected(kyc)} className="p-2 glass rounded-xl hover:bg-muted">
                <Eye className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="glass w-full max-w-lg rounded-3xl p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="font-display font-bold text-xl text-foreground">{selected.user}</h3>
                <p className="text-sm text-muted-foreground">{selected.id} · {selected.type}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 glass rounded-xl">✕</button>
            </div>

            {/* Document preview placeholder */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {["Front ID", "Back ID", "Selfie", "Liveness"].map(doc => (
                <div key={doc} className="glass rounded-2xl aspect-video flex flex-col items-center justify-center gap-2">
                  <span className="text-2xl">{doc === "Selfie" ? "🤳" : doc === "Liveness" ? "🎥" : "📄"}</span>
                  <p className="text-xs text-muted-foreground">{doc}</p>
                  {doc === "Liveness" && <span className="text-[10px] text-green-400 font-bold">✓ Passed</span>}
                </div>
              ))}
            </div>

            {/* AI Analysis */}
            <div className="glass-gold rounded-xl p-3 mb-4">
              <p className="text-xs font-bold text-gold mb-1">🤖 Global AI Analysis</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Document Quality", value: "98%", ok: true },
                  { label: "Face Match", value: "94%", ok: true },
                  { label: "Liveness", value: "Passed", ok: true },
                  { label: "Overall Score", value: `${selected.aiScore}%`, ok: selected.aiScore >= 70 },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={`font-bold ${item.ok ? "text-green-400" : "text-red-400"}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSelected(null)} className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold flex items-center justify-center gap-1">
                <X className="w-3.5 h-3.5" /> Reject
              </button>
              <button onClick={() => setSelected(null)} className="flex-1 py-2.5 rounded-xl glass text-sm font-semibold text-muted-foreground">Request Info</button>
              <button onClick={() => setSelected(null)} className="flex-1 py-2.5 rounded-xl bg-gradient-gold text-tesfa-dark text-sm font-bold flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5" /> Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminKYC;
