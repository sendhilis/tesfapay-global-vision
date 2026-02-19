import { useState } from "react";
import { Search, CheckCircle, ArrowDownLeft, Phone, CreditCard } from "lucide-react";

type Step = "lookup" | "amount" | "confirm" | "otp" | "done";

const AgentCashIn = () => {
  const [step, setStep] = useState<Step>("lookup");
  const [searchQuery, setSearchQuery] = useState("");
  const [customer, setCustomer] = useState<{ name: string; phone: string; walletId: string; kycLevel: number } | null>(null);
  const [amount, setAmount] = useState("");
  const [otp, setOtp] = useState("");
  const [ref] = useState(`CI-${Date.now().toString().slice(-8)}`);

  const commission = amount ? Math.max(parseFloat(amount) * 0.003, 2) : 0;

  const mockSearch = () => {
    if (searchQuery.length > 5) {
      setCustomer({ name: "Tigist Alemu", phone: "+251 911 222 333", walletId: "TPY-2024-TIGIST003", kycLevel: 1 });
    }
  };

  if (step === "done") return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center animate-scale-in">
      <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
        <CheckCircle className="w-10 h-10 text-green-400" />
      </div>
      <h2 className="font-display font-bold text-2xl text-foreground mb-1">Cash In Successful! 💰</h2>
      <p className="text-muted-foreground text-sm mb-1">{customer?.name}</p>
      <p className="text-primary font-bold text-2xl mb-6">ETB {parseFloat(amount).toLocaleString()}</p>
      <div className="glass rounded-2xl p-4 w-full mb-4 space-y-2 text-left">
        {[
          { label: "Customer", value: customer?.name },
          { label: "Wallet ID", value: customer?.walletId },
          { label: "Reference", value: ref },
          { label: "Agent Commission", value: `ETB ${commission.toFixed(2)}` },
          { label: "Net to Customer", value: `ETB ${parseFloat(amount).toLocaleString()}` },
          { label: "Time", value: new Date().toLocaleTimeString() },
        ].map(r => (
          <div key={r.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="text-foreground font-semibold">{r.value}</span>
          </div>
        ))}
      </div>
      <div className="glass rounded-2xl p-3 w-full mb-4 text-center">
        <p className="text-xs text-muted-foreground">Your commission</p>
        <p className="text-green-400 font-bold text-xl">+ETB {commission.toFixed(2)}</p>
      </div>
      <button
        onClick={() => { setStep("lookup"); setCustomer(null); setAmount(""); setOtp(""); setSearchQuery(""); }}
        className="w-full py-4 rounded-2xl font-bold text-primary-foreground bg-primary"
      >
        New Cash In Transaction
      </button>
    </div>
  );

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center">
          <ArrowDownLeft className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg text-foreground">Cash In</h2>
          <p className="text-xs text-muted-foreground">Deposit cash to customer wallet</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1 mb-5">
        {(["lookup", "amount", "confirm", "otp"] as Step[]).map((s, i) => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-all ${["lookup", "amount", "confirm", "otp", "done"].indexOf(step) >= i ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      {/* STEP 1: Customer Lookup */}
      {step === "lookup" && (
        <div className="animate-slide-up space-y-4">
          <p className="text-sm font-semibold text-foreground">Find Customer</p>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Search by phone, wallet ID or name</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && mockSearch()}
                placeholder="+251 9XX XXX XXX or TPY-..."
                className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
              />
            </div>
            <button onClick={mockSearch} className="w-full mt-2 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold">
              Search Customer
            </button>
          </div>

          {customer && (
            <div className="animate-slide-up glass rounded-2xl p-4 border border-green-500/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-secondary/30 flex items-center justify-center font-bold text-foreground text-sm">
                  {customer.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">{customer.phone}</p>
                  <p className="text-xs text-primary font-mono">{customer.walletId}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />
              </div>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-muted-foreground" /><span className="text-muted-foreground">KYC Level {customer.kycLevel}</span></div>
                <div className="flex items-center gap-1"><CreditCard className="w-3 h-3 text-muted-foreground" /><span className="text-muted-foreground">Active Wallet</span></div>
              </div>
              <button
                onClick={() => setStep("amount")}
                className="w-full mt-3 py-3 rounded-xl font-bold text-primary-foreground bg-green-600 text-sm"
              >
                Proceed with this Customer →
              </button>
            </div>
          )}

          <div className="glass rounded-2xl p-3">
            <p className="text-xs font-bold text-foreground mb-1">💡 Daily Limits</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>• KYC Level 1: max ETB 10,000/txn, ETB 30,000/day</p>
              <p>• KYC Level 2: max ETB 50,000/txn, ETB 200,000/day</p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Amount */}
      {step === "amount" && customer && (
        <div className="animate-slide-up space-y-4">
          <button onClick={() => setStep("lookup")} className="text-primary text-sm">← Back</button>

          <div className="glass rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/30 flex items-center justify-center font-bold text-foreground text-xs">
              {customer.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{customer.name}</p>
              <p className="text-xs text-muted-foreground">{customer.walletId}</p>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Cash Amount Received (ETB) *</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-muted border border-border rounded-2xl px-4 py-4 text-2xl font-bold text-foreground focus:outline-none focus:border-primary text-center"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {["500", "1000", "2000", "5000"].map(a => (
              <button key={a} onClick={() => setAmount(a)} className={`py-2 rounded-xl text-xs font-bold transition-colors ${amount === a ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                {a}
              </button>
            ))}
          </div>

          {amount && parseFloat(amount) > 0 && (
            <div className="glass rounded-2xl p-3 space-y-1.5">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Cash received</span><span className="font-semibold">ETB {parseFloat(amount).toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Credited to wallet</span><span className="font-semibold text-foreground">ETB {parseFloat(amount).toLocaleString()}</span></div>
              <div className="border-t border-border pt-1.5 flex justify-between text-sm font-bold"><span className="text-green-400">Your Commission</span><span className="text-green-400">+ETB {commission.toFixed(2)}</span></div>
            </div>
          )}

          <button
            onClick={() => setStep("confirm")}
            disabled={!amount || parseFloat(amount) < 50}
            className="w-full py-4 rounded-2xl font-bold text-primary-foreground bg-green-600 disabled:opacity-40"
          >
            Continue →
          </button>
        </div>
      )}

      {/* STEP 3: Confirm */}
      {step === "confirm" && customer && (
        <div className="animate-slide-up space-y-4">
          <button onClick={() => setStep("amount")} className="text-primary text-sm">← Back</button>
          <div className="glass rounded-2xl p-4">
            <p className="text-sm font-bold text-foreground mb-3">Confirm Cash In</p>
            <div className="space-y-2">
              {[
                { label: "Customer", value: customer.name },
                { label: "Wallet", value: customer.walletId },
                { label: "Amount", value: `ETB ${parseFloat(amount).toLocaleString()}` },
                { label: "Agent Commission", value: `ETB ${commission.toFixed(2)}` },
                { label: "Reference", value: ref },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-semibold text-foreground">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-2xl p-3">
            <p className="text-xs text-muted-foreground">Ask the customer to approve this transaction. Both agent and customer will receive an SMS confirmation.</p>
          </div>
          <button onClick={() => setStep("otp")} className="w-full py-4 rounded-2xl font-bold text-primary-foreground bg-green-600">
            Proceed to OTP →
          </button>
        </div>
      )}

      {/* STEP 4: OTP */}
      {step === "otp" && (
        <div className="animate-slide-up space-y-4">
          <button onClick={() => setStep("confirm")} className="text-primary text-sm">← Back</button>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground mb-1">Enter Customer OTP</p>
            <p className="text-xs text-muted-foreground">Customer receives OTP on {customer?.phone}</p>
          </div>
          <div className="flex gap-2 justify-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center text-sm font-bold transition-colors ${i < otp.length ? "border-green-500 bg-green-500/10 text-green-400" : "border-border glass"}`}>
                {i < otp.length ? "●" : ""}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((num) => (
              <button
                key={num}
                onClick={() => {
                  if (num === "⌫") setOtp(otp.slice(0, -1));
                  else if (num !== "" && otp.length < 6) {
                    const newOtp = otp + num;
                    setOtp(newOtp);
                    if (newOtp.length === 6) setTimeout(() => setStep("done"), 400);
                  }
                }}
                className={`h-12 rounded-2xl text-base font-bold glass hover:bg-primary/10 hover:text-primary transition-colors ${num === "" ? "invisible" : ""}`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentCashIn;
