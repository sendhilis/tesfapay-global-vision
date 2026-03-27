/**
 * AgentCustomers — Customer management and registration for agents.
 *
 * @route /agent/customers
 * @module Agent Portal
 *
 * @description Lists customers served by this agent with search. Allows
 * agent-assisted new customer registration: (1) Customer list, (2) Registration
 * form (name, phone, ID type), (3) Document capture, (4) Success.
 *
 * @api_endpoints
 * - GET  /v1/agent/customers?search=...&page=0  → paginated customer list
 * - POST /v1/agent/customers/register            → { firstName, lastName, phone, documentType, documentNumber }
 *
 * @tables users, agents, kyc_applications
 *
 * @mock_data Customer list hardcoded. Replace with useQuery.
 */
import { useState } from "react";
import { UserPlus, CheckCircle, Camera, Phone, User, MapPin } from "lucide-react";

type Step = "list" | "form" | "doc" | "done";

const registeredCustomers = [
  { name: "Tigist Alemu", phone: "+251 911 222 333", walletId: "TPY-2024-TIGIST003", date: "Today", kycLevel: 1 },
  { name: "Yonas Bekele", phone: "+251 922 444 555", walletId: "TPY-2024-YONAS004", date: "Yesterday", kycLevel: 2 },
  { name: "Meron Tadesse", phone: "+251 933 666 777", walletId: "TPY-2024-MERON005", date: "Feb 17", kycLevel: 1 },
];

const AgentCustomers = () => {
  const [step, setStep] = useState<Step>("list");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [kebele, setKebele] = useState("");
  const [idType, setIdType] = useState<"fayda" | "passport" | "kebele">("fayda");
  const [idCaptured, setIdCaptured] = useState(false);
  const [selfieCaptured, setSelfieCaptured] = useState(false);
  const [newWalletId] = useState(`TPY-2024-${Date.now().toString().slice(-6)}`);

  if (step === "done") return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center animate-scale-in">
      <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
        <CheckCircle className="w-10 h-10 text-green-400" />
      </div>
      <h2 className="font-display font-bold text-2xl text-foreground mb-1">Customer Registered! 🎉</h2>
      <p className="text-muted-foreground text-sm mb-1">{fullName}</p>
      <p className="text-primary font-mono text-sm mb-6">{newWalletId}</p>
      <div className="glass rounded-2xl p-4 w-full mb-6 space-y-2 text-left">
        {[
          { label: "Full Name", value: fullName },
          { label: "Phone", value: phone },
          { label: "Wallet ID", value: newWalletId },
          { label: "KYC Level", value: "Level 1 (Active)" },
          { label: "Daily Limit", value: "ETB 10,000" },
          { label: "Registered By", value: "Dawit H. · AGT-001" },
        ].map(r => (
          <div key={r.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="text-foreground font-semibold">{r.value}</span>
          </div>
        ))}
      </div>
      <div className="glass rounded-2xl p-3 w-full mb-4 text-center border border-green-500/30">
        <p className="text-xs text-green-400">📱 Customer will receive activation SMS on {phone}</p>
      </div>
      <button onClick={() => { setStep("list"); setFullName(""); setPhone(""); setIdCaptured(false); setSelfieCaptured(false); }}
        className="w-full py-4 rounded-2xl font-bold text-primary-foreground bg-primary">
        Register Another Customer
      </button>
    </div>
  );

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display font-bold text-lg text-foreground">Customer Registration</h2>
          <p className="text-xs text-muted-foreground">Onboard new GlobalPay wallet users</p>
        </div>
        {step === "list" && (
          <button onClick={() => setStep("form")} className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-xl">
            <UserPlus className="w-3.5 h-3.5" /> Register
          </button>
        )}
      </div>

      {/* STEP: Customer List */}
      {step === "list" && (
        <div className="animate-slide-up space-y-3">
          <div className="glass rounded-2xl p-3 flex items-center gap-2 mb-2">
            <span className="text-base">📊</span>
            <div>
              <p className="text-xs font-bold text-foreground">Your Registered Customers</p>
              <p className="text-xs text-muted-foreground">{registeredCustomers.length} customers registered this month</p>
            </div>
          </div>

          {registeredCustomers.map(c => (
            <div key={c.walletId} className="glass rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/30 flex items-center justify-center font-bold text-foreground text-sm flex-shrink-0">
                {c.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.phone}</p>
                <p className="text-[10px] text-primary font-mono">{c.walletId}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold">KYC L{c.kycLevel}</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">{c.date}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STEP: Registration Form */}
      {step === "form" && (
        <div className="animate-slide-up space-y-4">
          <button onClick={() => setStep("list")} className="text-primary text-sm">← Back</button>
          <p className="text-sm font-bold text-foreground">New Customer Details</p>

          {[
            { label: "Full Name *", value: fullName, set: setFullName, placeholder: "As on ID document", icon: User },
            { label: "Phone Number *", value: phone, set: setPhone, placeholder: "+251 9XX XXX XXX", icon: Phone },
            { label: "Kebele / Woreda", value: kebele, set: setKebele, placeholder: "Customer's residential kebele", icon: MapPin },
          ].map(({ label, value, set, placeholder, icon: Icon }) => (
            <div key={label}>
              <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={value}
                  onChange={e => set(e.target.value)}
                  placeholder={placeholder}
                  className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                />
              </div>
            </div>
          ))}

          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-semibold uppercase tracking-wide">ID Type *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "fayda", label: "Fayda ID", emoji: "🪪" },
                { value: "passport", label: "Passport", emoji: "📘" },
                { value: "kebele", label: "Kebele ID", emoji: "📄" },
              ].map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => setIdType(value as typeof idType)}
                  className={`glass rounded-xl p-2.5 text-center border-2 transition-colors ${idType === value ? "border-primary bg-primary/10" : "border-transparent"}`}
                >
                  <span className="text-xl">{emoji}</span>
                  <p className="text-[10px] text-foreground font-semibold mt-1">{label}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep("doc")}
            disabled={!fullName || !phone}
            className="w-full py-4 rounded-2xl font-bold text-primary-foreground bg-primary disabled:opacity-40"
          >
            Continue → Capture Documents
          </button>
        </div>
      )}

      {/* STEP: Document & Selfie Capture */}
      {step === "doc" && (
        <div className="animate-slide-up space-y-4">
          <button onClick={() => setStep("form")} className="text-primary text-sm">← Back</button>
          <p className="text-sm font-bold text-foreground">Capture Customer ID & Selfie</p>

          {/* ID capture */}
          <button
            onClick={() => !idCaptured && setTimeout(() => setIdCaptured(true), 800)}
            className={`w-full glass rounded-2xl overflow-hidden border-2 transition-all ${idCaptured ? "border-green-500/40" : "border-dashed border-border"}`}
          >
            <div className="relative h-36 bg-muted flex items-center justify-center">
              {idCaptured ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                  <p className="text-xs text-green-400 font-semibold">ID Captured ✓</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Camera className="w-10 h-10 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Tap to capture {idType === "fayda" ? "Fayda" : idType === "passport" ? "Passport" : "Kebele"} ID</p>
                  <p className="text-[10px] text-muted-foreground/60">Front side — lay flat, ensure all corners visible</p>
                </div>
              )}
            </div>
          </button>

          {/* Selfie capture */}
          <button
            onClick={() => !selfieCaptured && setTimeout(() => setSelfieCaptured(true), 800)}
            className={`w-full glass rounded-2xl overflow-hidden border-2 transition-all ${selfieCaptured ? "border-green-500/40" : "border-dashed border-border"}`}
          >
            <div className="relative h-36 bg-muted flex items-center justify-center">
              {selfieCaptured ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                  <p className="text-xs text-green-400 font-semibold">Selfie Captured ✓</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">🤳</span>
                  <p className="text-xs text-muted-foreground">Tap to capture customer selfie</p>
                  <p className="text-[10px] text-muted-foreground/60">Clear face, good lighting, no glasses</p>
                </div>
              )}
            </div>
          </button>

          <div className="glass rounded-2xl p-3 text-xs text-muted-foreground">
            <p className="text-foreground font-semibold mb-1">📋 KYC Level 1 Grants:</p>
            <p>• ETB 10,000 daily transaction limit</p>
            <p>• ETB 30,000 maximum wallet balance</p>
            <p>• Upgrade to Level 2 in-app for higher limits</p>
          </div>

          <button
            onClick={() => setStep("done")}
            disabled={!idCaptured || !selfieCaptured}
            className="w-full py-4 rounded-2xl font-bold text-primary-foreground bg-primary disabled:opacity-40"
          >
            Register Customer 🚀
          </button>
        </div>
      )}
    </div>
  );
};

export default AgentCustomers;
