import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, MapPin, FileText, Camera, CheckCircle,
  ChevronRight, User, Phone, CreditCard, Shield
} from "lucide-react";
import tesfaLogo from "@/assets/tesfa-logo.png";

type Step = "welcome" | "personal" | "business" | "zone" | "documents" | "review" | "pending";

const zones = [
  "Addis Ababa – Bole", "Addis Ababa – Kirkos", "Addis Ababa – Yeka",
  "Addis Ababa – Lideta", "Addis Ababa – Gulele", "Addis Ababa – Kolfe",
  "Oromia – Adama", "Oromia – Jimma", "Amhara – Bahir Dar",
  "Amhara – Gondar", "Tigray – Mekelle", "SNNP – Hawassa",
];

const superAgents = [
  { id: "SA-001", name: "Bole Super Agent Hub", zone: "Addis Ababa – Bole" },
  { id: "SA-002", name: "Kirkos Financial Center", zone: "Addis Ababa – Kirkos" },
  { id: "SA-003", name: "Yeka Distribution Point", zone: "Addis Ababa – Yeka" },
];

const docTypes = [
  { id: "business_reg", label: "Business Registration Certificate", required: true },
  { id: "trade_license", label: "Trade License", required: true },
  { id: "tin_cert", label: "TIN Certificate", required: true },
  { id: "bank_statement", label: "Bank Statement (3 months)", required: false },
];

const StepIndicator = ({ current, total }: { current: number; total: number }) => (
  <div className="flex items-center gap-1 justify-center mb-6">
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i < current ? "bg-primary w-6" : i === current ? "bg-primary w-8" : "bg-muted w-3"}`} />
    ))}
  </div>
);

const AgentOnboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("welcome");

  // Personal info
  const [fullName, setFullName] = useState("Dawit Haile");
  const [phone, setPhone] = useState("+251 912 345 678");
  const [walletId, setWalletId] = useState("TPY-2024-DAWIT002");

  // Business info
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState<"sub_agent" | "merchant" | "">("sub_agent");
  const [tinNumber, setTinNumber] = useState("");
  const [address, setAddress] = useState("");

  // Zone
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedSuperAgent, setSelectedSuperAgent] = useState("");
  const [floatLimit, setFloatLimit] = useState("50000");

  // Documents
  const [capturedDocs, setCapturedDocs] = useState<string[]>([]);

  const stepIndex: Record<Step, number> = {
    welcome: 0, personal: 1, business: 2, zone: 3, documents: 4, review: 5, pending: 6,
  };

  const filteredSuperAgents = superAgents.filter(sa =>
    !selectedZone || sa.zone === selectedZone
  );

  const allDocsRequired = docTypes.filter(d => d.required).every(d => capturedDocs.includes(d.id));

  // ── WELCOME ──────────────────────────────────────────────────────────────
  if (step === "welcome") return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md text-center animate-scale-in">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src={tesfaLogo} alt="GlobalPay" className="w-12 h-12 rounded-xl" />
          <span className="font-display font-bold text-xl text-primary">GlobalPay</span>
        </div>

        <div className="glass rounded-3xl p-8 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-secondary/30 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">Become a GlobalPay Agent</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            As an authorized GlobalPay agent, you'll earn commissions on every Cash In / Cash Out transaction while providing essential financial services to your community.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { icon: "💰", label: "Earn Commissions", sub: "Up to 0.5% per txn" },
            { icon: "🏪", label: "Serve Customers", sub: "Cash In & Out" },
            { icon: "📱", label: "Agent App", sub: "Dedicated dashboard" },
            { icon: "🛡️", label: "NBE Licensed", sub: "Fully regulated" },
          ].map(({ icon, label, sub }) => (
            <div key={label} className="glass rounded-2xl p-3 text-left">
              <span className="text-2xl">{icon}</span>
              <p className="text-xs font-bold text-foreground mt-1">{label}</p>
              <p className="text-[10px] text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          You are applying as an existing GlobalPay wallet user.<br />
          Wallet ID: <span className="text-primary font-mono font-semibold">{walletId}</span>
        </p>

        <button
          onClick={() => setStep("personal")}
          className="w-full py-4 rounded-2xl font-bold text-primary-foreground bg-primary shadow-md text-sm"
        >
          Start Agent Application →
        </button>
        <button
          onClick={() => navigate("/wallet")}
          className="w-full py-3 mt-2 text-muted-foreground text-sm"
        >
          Back to My Wallet
        </button>
      </div>
    </div>
  );

  // ── PENDING ──────────────────────────────────────────────────────────────
  if (step === "pending") return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10 text-center animate-scale-in">
      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
        <Shield className="w-10 h-10 text-primary" />
      </div>
      <h2 className="font-display font-bold text-2xl text-foreground mb-2">Application Submitted!</h2>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">
        Your agent application is under review by Global Bank Ethiopia. You'll receive an SMS confirmation within 24–48 hours.
      </p>
      <div className="glass rounded-2xl p-4 w-full max-w-sm mb-6 space-y-2 text-left">
        {[
          { label: "Applicant", value: fullName },
          { label: "Business", value: businessName || "Dawit Haile Agent" },
          { label: "Zone", value: selectedZone || "Addis Ababa – Bole" },
          { label: "Agent Type", value: businessType === "sub_agent" ? "Sub Agent" : "Merchant" },
          { label: "Float Limit", value: `ETB ${parseFloat(floatLimit).toLocaleString()}` },
          { label: "Reference", value: `AGT-APP-${Date.now().toString().slice(-8)}` },
          { label: "Status", value: "🟡 Pending KYC Review" },
        ].map(r => (
          <div key={r.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="text-foreground font-semibold">{r.value}</span>
          </div>
        ))}
      </div>
      <button onClick={() => navigate("/wallet")} className="w-full py-4 rounded-2xl font-bold text-primary-foreground bg-primary">
        Back to My Wallet
      </button>
      <button onClick={() => navigate("/agent")} className="w-full py-3 mt-2 text-primary text-sm font-semibold">
        Go to Agent Portal →
      </button>
    </div>
  );

  const totalSteps = 5;
  const currentStepIndex = stepIndex[step] - 1;

  return (
    <div className="min-h-screen bg-background px-4 py-8 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => {
            const prev: Record<Step, Step> = {
              welcome: "welcome", personal: "welcome", business: "personal",
              zone: "business", documents: "zone", review: "documents", pending: "review",
            };
            setStep(prev[step]);
          }}
          className="text-primary text-sm"
        >← Back</button>
        <div className="flex-1 text-center">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Agent Application</span>
        </div>
      </div>

      <StepIndicator current={currentStepIndex} total={totalSteps} />

      {/* ── STEP 1: Personal Info ── */}
      {step === "personal" && (
        <div className="animate-slide-up space-y-4">
          <div className="mb-4">
            <h2 className="font-display font-bold text-xl text-foreground">Personal Details</h2>
            <p className="text-xs text-muted-foreground mt-1">Pre-filled from your GlobalPay wallet profile</p>
          </div>

          <div className="glass-gold rounded-2xl p-4 flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">DH</div>
            <div>
              <p className="text-sm font-bold text-foreground">{fullName}</p>
              <p className="text-xs text-muted-foreground">{phone}</p>
              <p className="text-xs text-primary font-mono">{walletId}</p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />
          </div>

          {[
            { label: "Full Name", value: fullName, set: setFullName, icon: User },
            { label: "Phone Number", value: phone, set: setPhone, icon: Phone },
            { label: "Wallet ID", value: walletId, set: setWalletId, icon: CreditCard, disabled: true },
          ].map(({ label, value, set, icon: Icon, disabled }) => (
            <div key={label}>
              <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={value}
                  onChange={e => !disabled && set(e.target.value)}
                  disabled={disabled}
                  className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                />
              </div>
            </div>
          ))}

          <button
            onClick={() => setStep("business")}
            className="w-full py-4 rounded-2xl font-bold text-primary-foreground bg-primary mt-4"
          >
            Continue → Business Info
          </button>
        </div>
      )}

      {/* ── STEP 2: Business Info ── */}
      {step === "business" && (
        <div className="animate-slide-up space-y-4">
          <div className="mb-4">
            <h2 className="font-display font-bold text-xl text-foreground">Business Information</h2>
            <p className="text-xs text-muted-foreground mt-1">Tell us about your agent business</p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-semibold uppercase tracking-wide">Agent Type *</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "sub_agent", label: "Sub Agent", desc: "Cash In/Out + Customer registration", icon: "🏪" },
                { value: "merchant", label: "Merchant", desc: "Accept payments at your business", icon: "🛒" },
              ].map(({ value, label, desc, icon }) => (
                <button
                  key={value}
                  onClick={() => setBusinessType(value as typeof businessType)}
                  className={`glass rounded-2xl p-3 text-left border-2 transition-colors ${businessType === value ? "border-primary bg-primary/10" : "border-transparent"}`}
                >
                  <span className="text-2xl">{icon}</span>
                  <p className="text-xs font-bold text-foreground mt-1">{label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {[
            { label: "Business Name *", value: businessName, set: setBusinessName, placeholder: "e.g. Dawit General Store" },
            { label: "TIN Number *", value: tinNumber, set: setTinNumber, placeholder: "10-digit Tax ID Number" },
            { label: "Business Address *", value: address, set: setAddress, placeholder: "Full address with kebele/woreda" },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label}>
              <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
              <input
                type="text"
                value={value}
                onChange={e => set(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
              />
            </div>
          ))}

          <button
            onClick={() => setStep("zone")}
            disabled={!businessName || !tinNumber || !address || !businessType}
            className="w-full py-4 rounded-2xl font-bold text-primary-foreground bg-primary mt-2 disabled:opacity-40"
          >
            Continue → Zone Assignment
          </button>
        </div>
      )}

      {/* ── STEP 3: Zone & Super Agent ── */}
      {step === "zone" && (
        <div className="animate-slide-up space-y-4">
          <div className="mb-4">
            <h2 className="font-display font-bold text-xl text-foreground">Zone & Float Setup</h2>
            <p className="text-xs text-muted-foreground mt-1">Select your operating zone and initial float limit</p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-semibold uppercase tracking-wide">Operating Zone *</label>
            <div className="glass rounded-xl border border-border overflow-hidden">
              <select
                value={selectedZone}
                onChange={e => { setSelectedZone(e.target.value); setSelectedSuperAgent(""); }}
                className="w-full bg-transparent px-4 py-3 text-sm text-foreground focus:outline-none"
              >
                <option value="">Select your zone...</option>
                {zones.map(z => <option key={z} value={z} className="bg-muted">{z}</option>)}
              </select>
            </div>
          </div>

          {selectedZone && (
            <div className="animate-slide-up">
              <label className="text-xs text-muted-foreground mb-2 block font-semibold uppercase tracking-wide">Assign Super Agent *</label>
              <div className="space-y-2">
                {filteredSuperAgents.length > 0 ? filteredSuperAgents.map(sa => (
                  <button
                    key={sa.id}
                    onClick={() => setSelectedSuperAgent(sa.id)}
                    className={`w-full glass rounded-2xl p-3 flex items-center gap-3 border-2 transition-colors ${selectedSuperAgent === sa.id ? "border-primary bg-primary/10" : "border-transparent"}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-secondary/30 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {sa.id.slice(-1)}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-foreground">{sa.name}</p>
                      <p className="text-xs text-muted-foreground">{sa.id} · {sa.zone}</p>
                    </div>
                    {selectedSuperAgent === sa.id && <CheckCircle className="w-4 h-4 text-primary ml-auto" />}
                  </button>
                )) : (
                  <div className="glass rounded-2xl p-4 text-center">
                    <p className="text-xs text-muted-foreground">No super agent found in this zone. Bank will assign one.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-semibold uppercase tracking-wide">Requested Float Limit (ETB) *</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {["25000", "50000", "100000", "200000"].map(a => (
                <button
                  key={a}
                  onClick={() => setFloatLimit(a)}
                  className={`py-2 rounded-xl text-xs font-bold transition-colors ${floatLimit === a ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}
                >
                  {parseInt(a) >= 1000 ? `${parseInt(a) / 1000}K` : a}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={floatLimit}
              onChange={e => setFloatLimit(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary"
              placeholder="Custom amount..."
            />
          </div>

          <div className="glass rounded-2xl p-3 text-xs text-muted-foreground space-y-1">
            <p className="text-foreground font-semibold text-sm">📋 Float & Commission Info</p>
            <p>• Commission: 0.3% per Cash In, 0.4% per Cash Out</p>
            <p>• Float limit approved subject to bank review</p>
            <p>• Max float per Sub Agent: ETB 500,000</p>
          </div>

          <button
            onClick={() => setStep("documents")}
            disabled={!selectedZone || !floatLimit}
            className="w-full py-4 rounded-2xl font-bold text-primary-foreground bg-primary mt-2 disabled:opacity-40"
          >
            Continue → Upload Documents
          </button>
        </div>
      )}

      {/* ── STEP 4: Document Upload ── */}
      {step === "documents" && (
        <div className="animate-slide-up space-y-4">
          <div className="mb-4">
            <h2 className="font-display font-bold text-xl text-foreground">Business Documents</h2>
            <p className="text-xs text-muted-foreground mt-1">Upload clear photos of your business documents</p>
          </div>

          <div className="space-y-3">
            {docTypes.map(doc => {
              const captured = capturedDocs.includes(doc.id);
              return (
                <button
                  key={doc.id}
                  onClick={() => {
                    if (!captured) {
                      setTimeout(() => setCapturedDocs(prev => [...prev, doc.id]), 600);
                    }
                  }}
                  className={`w-full glass rounded-2xl p-4 flex items-center gap-3 border-2 transition-all ${captured ? "border-green-500/40 bg-green-500/5" : "border-transparent"}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${captured ? "bg-green-500/20" : "bg-muted"}`}>
                    {captured ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Camera className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-semibold text-foreground">{doc.label}</p>
                    <p className="text-xs text-muted-foreground">{captured ? "✅ Uploaded successfully" : doc.required ? "Required" : "Optional"}</p>
                  </div>
                  {!captured && <span className="text-xs text-primary font-semibold">Upload</span>}
                </button>
              );
            })}
          </div>

          <div className="glass rounded-2xl p-3 flex items-start gap-2">
            <span className="text-base">📸</span>
            <p className="text-xs text-muted-foreground">Ensure documents are clear, fully visible, and not expired. Images are encrypted and processed by our AI verification system.</p>
          </div>

          <button
            onClick={() => setStep("review")}
            disabled={!allDocsRequired}
            className="w-full py-4 rounded-2xl font-bold text-primary-foreground bg-primary disabled:opacity-40"
          >
            Continue → Review Application
          </button>
        </div>
      )}

      {/* ── STEP 5: Review ── */}
      {step === "review" && (
        <div className="animate-slide-up space-y-4">
          <div className="mb-4">
            <h2 className="font-display font-bold text-xl text-foreground">Review & Submit</h2>
            <p className="text-xs text-muted-foreground mt-1">Review your application before submitting</p>
          </div>

          <div className="glass rounded-2xl p-4 space-y-3">
            <p className="text-sm font-bold text-primary mb-2">📋 Application Summary</p>
            {[
              { label: "Applicant", value: fullName },
              { label: "Phone", value: phone },
              { label: "Wallet ID", value: walletId },
              { label: "Business Name", value: businessName },
              { label: "Agent Type", value: businessType === "sub_agent" ? "Sub Agent" : "Merchant" },
              { label: "TIN Number", value: tinNumber },
              { label: "Zone", value: selectedZone },
              { label: "Super Agent", value: filteredSuperAgents.find(s => s.id === selectedSuperAgent)?.name || "Bank will assign" },
              { label: "Requested Float", value: `ETB ${parseFloat(floatLimit).toLocaleString()}` },
              { label: "Documents", value: `${capturedDocs.length}/${docTypes.length} uploaded` },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="text-foreground font-semibold text-right max-w-[55%]">{r.value}</span>
              </div>
            ))}
          </div>

          <div className="glass rounded-2xl p-3 border border-primary/20">
            <p className="text-xs text-muted-foreground leading-relaxed">
              By submitting, you agree to the GlobalPay Agent Agreement and acknowledge that your application will be reviewed by Global Bank Ethiopia compliance officers within 24–48 hours. An NBE-issued agent code will be assigned upon approval.
            </p>
          </div>

          <button
            onClick={() => setStep("pending")}
            className="w-full py-4 rounded-2xl font-bold text-primary-foreground bg-primary shadow-md"
          >
            Submit Agent Application 🚀
          </button>
        </div>
      )}
    </div>
  );
};

export default AgentOnboarding;
