/**
 * LoginPage — User authentication screen with MPIN.
 *
 * @route /login
 * @module Public
 *
 * @description Two-step login: (1) Enter phone number with +251 prefix,
 * (2) Enter 6-digit MPIN via numeric keypad. Auto-submits on 6th digit.
 * Also offers biometric login shortcut and link to registration.
 *
 * @api_endpoints
 * - POST /v1/auth/login            → { phone, pin } → JWT tokens + user profile
 * - POST /v1/auth/login/biometric  → { userId, biometricToken } → JWT tokens
 *
 * @tables users, user_sessions
 *
 * @mock_data No real auth — navigates directly to /wallet on PIN entry.
 * Replace with useMutation to /auth/login, store JWT in secure storage.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import tesfaLogo from "@/assets/tesfa-logo.png";

const LoginPage = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [mpin, setMpin] = useState("");
  const [step, setStep] = useState<"phone" | "mpin">("phone");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 max-w-md mx-auto">
      <div className="w-full animate-slide-up">
        <div className="text-center mb-8">
          <img src={tesfaLogo} alt="GlobalPay" className="w-16 h-16 mx-auto mb-4 rounded-2xl shadow-gold animate-float" />
          <h1 className="font-display font-bold text-2xl text-foreground">Sign In</h1>
          <p className="text-muted-foreground text-sm">Welcome back to GlobalPay</p>
        </div>

        {step === "phone" ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Mobile Number</label>
              <div className="flex gap-2">
                <div className="glass border border-border rounded-xl px-4 py-3.5 text-sm text-muted-foreground">🇪🇹 +251</div>
                <input
                  className="flex-1 bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-tesfa-gold placeholder:text-muted-foreground"
                  placeholder="9XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <button
              onClick={() => setStep("mpin")}
              className="w-full py-4 rounded-2xl font-display font-bold text-tesfa-dark bg-gradient-gold shadow-gold flex items-center justify-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">Enter your 6-digit MPIN for</p>
            <p className="text-gold font-bold">+251 {phone}</p>

            <div className="flex gap-3 justify-center my-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-bold ${
                  i < mpin.length ? "border-tesfa-gold bg-tesfa-gold/10 text-gold" : "border-border glass"
                }`}>
                  {i < mpin.length ? "●" : ""}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
              {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    if (num === "⌫") setMpin(mpin.slice(0, -1));
                    else if (num !== "" && mpin.length < 6) {
                      const newMpin = mpin + num;
                      setMpin(newMpin);
                      if (newMpin.length === 6) setTimeout(() => navigate("/wallet"), 400);
                    }
                  }}
                  className={`h-14 rounded-2xl text-lg font-bold glass hover:bg-tesfa-gold/10 hover:text-gold transition-colors ${num === "" ? "invisible" : ""}`}
                >
                  {num}
                </button>
              ))}
            </div>

            <button onClick={() => navigate("/wallet")} className="text-xs text-tesfa-gold underline">
              Use Biometrics Instead
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <button onClick={() => navigate("/onboarding")} className="text-xs text-muted-foreground">
            New user? <span className="text-gold">Create account</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
