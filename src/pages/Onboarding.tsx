import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, User, Phone, Shield, Camera } from "lucide-react";
import tesfaLogo from "@/assets/tesfa-logo.png";

const steps = [
  { id: 1, title: "Welcome", subtitle: "Let's get you started" },
  { id: 2, title: "Personal Info", subtitle: "Tell us about yourself" },
  { id: 3, title: "Phone & ID", subtitle: "Verify your identity" },
  { id: 4, title: "Security", subtitle: "Set your MPIN" },
  { id: 5, title: "All Set!", subtitle: "Your wallet is ready" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [mpin, setMpin] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    gender: "",
    phone: "",
    idType: "",
    idNumber: "",
    language: "Amharic",
    aiConsent: true,
  });

  const progress = ((step - 1) / (steps.length - 1)) * 100;

  const handleNext = () => {
    if (step < steps.length) setStep(step + 1);
    else navigate("/wallet");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="px-5 pt-safe pt-5 pb-4">
        <div className="flex items-center gap-3 mb-6">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="p-2 glass rounded-xl">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <img src={tesfaLogo} alt="TesfaPay" className="w-8 h-8 rounded-lg" />
          <div>
            <p className="text-xs text-muted-foreground">Step {step} of {steps.length}</p>
            <p className="font-display font-bold text-sm text-gold">{steps[step - 1].title}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-gold transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 px-5 py-4 overflow-y-auto scrollbar-none">
        {step === 1 && (
          <div className="animate-slide-up">
            <h2 className="font-display font-bold text-2xl text-foreground mb-2">
              ወደ TesfaPay ይቀላቀሉ
            </h2>
            <p className="text-muted-foreground text-sm mb-6">Join millions of Ethiopians managing money smarter</p>

            <div className="glass-gold rounded-2xl p-4 mb-4">
              <p className="text-gold font-semibold text-sm mb-2">🤖 Tesfa AI says:</p>
              <p className="text-sm text-foreground">
                "Hello! I'll guide you through each step. This takes about 3 minutes. 
                Your information is encrypted and secure."
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: "🔒", text: "Bank-grade encryption" },
                { icon: "⚡", text: "Instant account activation" },
                { icon: "🎁", text: "500 Tesfa Points welcome bonus" },
                { icon: "🌍", text: "Send money anywhere in Ethiopia" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 glass rounded-xl p-3">
                  <span className="text-xl">{item.icon}</span>
                  <p className="text-sm font-medium">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up space-y-4">
            <h2 className="font-display font-bold text-xl text-foreground">Personal Information</h2>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Full Name (as on ID) *</label>
              <input
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-tesfa-gold placeholder:text-muted-foreground"
                placeholder="e.g. Abebe Girma"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date of Birth *</label>
              <input
                type="date"
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-tesfa-gold"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Gender *</label>
              <div className="flex gap-3">
                {["Male", "Female"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setFormData({ ...formData, gender: g })}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-colors ${
                      formData.gender === g
                        ? "border-tesfa-gold bg-tesfa-gold/10 text-gold"
                        : "border-border glass text-muted-foreground"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Preferred Language</label>
              <select
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-tesfa-gold"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              >
                <option>Amharic</option>
                <option>English</option>
                <option>Oromiffa</option>
                <option>Tigrinya</option>
              </select>
            </div>
            <div className="flex items-start gap-3 glass rounded-xl p-3">
              <input
                type="checkbox"
                checked={formData.aiConsent}
                onChange={(e) => setFormData({ ...formData, aiConsent: e.target.checked })}
                className="mt-0.5"
              />
              <p className="text-xs text-muted-foreground">
                I consent to Tesfa AI using my data for personalized financial recommendations and fraud protection
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-slide-up space-y-4">
            <h2 className="font-display font-bold text-xl text-foreground">Phone & ID Verification</h2>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Mobile Number *</label>
              <div className="flex gap-2">
                <div className="glass border border-border rounded-xl px-3 py-3 text-sm text-muted-foreground">+251</div>
                <input
                  className="flex-1 bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-tesfa-gold"
                  placeholder="9XXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">ID Type *</label>
              <select
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-tesfa-gold"
                value={formData.idType}
                onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
              >
                <option value="">Select ID type</option>
                <option>National ID (Fayda)</option>
                <option>Passport</option>
                <option>Driver's License</option>
                <option>Kebele ID</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">ID Number *</label>
              <input
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-tesfa-gold"
                placeholder="Enter ID number"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
              />
            </div>

            {/* Document capture areas */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">ID Document Photos *</label>
              <div className="grid grid-cols-2 gap-3">
                {["Front Side", "Back Side"].map((side) => (
                  <button key={side} className="glass border border-dashed border-border rounded-2xl py-8 flex flex-col items-center gap-2 hover:border-tesfa-gold/50 transition-colors">
                    <Camera className="w-6 h-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{side}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-gold rounded-xl p-3">
              <p className="text-xs text-gold">🤖 Tesfa AI: "Please ensure the photo is clear, well-lit, and all text is visible. I'll auto-validate your document quality."</p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-slide-up text-center">
            <Shield className="w-16 h-16 text-gold mx-auto mb-4" />
            <h2 className="font-display font-bold text-xl text-foreground mb-2">Set Your MPIN</h2>
            <p className="text-sm text-muted-foreground mb-6">Choose a 6-digit PIN to secure your wallet</p>

            <div className="flex gap-3 justify-center mb-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-bold transition-colors ${
                    i < mpin.length
                      ? "border-tesfa-gold bg-tesfa-gold/10 text-gold"
                      : "border-border glass"
                  }`}
                >
                  {i < mpin.length ? "●" : ""}
                </div>
              ))}
            </div>

            {/* Number pad */}
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
              {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    if (num === "⌫") setMpin(mpin.slice(0, -1));
                    else if (num !== "" && mpin.length < 6) setMpin(mpin + num);
                  }}
                  className={`h-14 rounded-2xl text-lg font-bold glass hover:bg-tesfa-gold/10 hover:text-gold transition-colors ${
                    num === "" ? "invisible" : ""
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              You can also enable biometric authentication after setup
            </p>
          </div>
        )}

        {step === 5 && (
          <div className="animate-slide-up text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-green flex items-center justify-center animate-glow-gold">
              <Check className="w-10 h-10 text-foreground" />
            </div>
            <h2 className="font-display font-bold text-2xl text-gold mb-2">Welcome to TesfaPay! 🎉</h2>
            <p className="text-foreground font-semibold mb-1">Abebe Girma</p>
            <p className="text-muted-foreground text-sm mb-6">Your KYC Level 1 wallet is activated</p>

            <div className="glass-gold rounded-2xl p-4 mb-4 text-left">
              <p className="text-gold font-semibold mb-2">🎁 Welcome Bonus!</p>
              <p className="text-sm text-foreground">500 Tesfa Points credited to your account</p>
            </div>

            <div className="space-y-2 mb-6">
              {[
                { label: "Wallet ID", value: "TPY-2024-ABEBE001" },
                { label: "KYC Level", value: "Level 1 (Upgrade available)" },
                { label: "Daily Limit", value: "ETB 5,000" },
                { label: "Monthly Limit", value: "ETB 50,000" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center glass rounded-xl px-4 py-2.5">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="text-xs font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="px-5 pb-safe pb-6 pt-4">
        <button
          onClick={handleNext}
          disabled={step === 4 && mpin.length < 6}
          className="w-full py-4 rounded-2xl font-display font-bold text-tesfa-dark bg-gradient-gold shadow-gold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {step === steps.length ? "Go to My Wallet" : "Continue"} <ArrowRight className="w-4 h-4" />
        </button>
        {step === 1 && (
          <button onClick={() => navigate("/login")} className="w-full py-3 text-muted-foreground text-sm text-center">
            Already have an account? Sign In
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
