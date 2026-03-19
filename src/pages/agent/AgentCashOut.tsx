/**
 * AgentCashOut — Agent-side cash withdrawal processing.
 *
 * @route /agent/cashout
 * @module Agent Portal
 *
 * @description Mirror of AgentCashIn for withdrawals. Steps: (1) Customer lookup,
 * (2) Enter withdrawal amount (validates against customer balance + agent float),
 * (3) Confirm, (4) OTP verification, (5) Success with commission receipt.
 *
 * @api_endpoints
 * - POST /v1/agent/customers/lookup  → { query } → customer details
 * - POST /v1/agent/cashout           → { customerPhone, amount, otp, agentPin } → result
 *
 * @tables agents, users, transactions, agent_commissions, agent_float_history, otp_verifications
 *
 * @mock_data Customer lookup hardcoded. Replace with API call.
 */
import { useState } from "react";
import { Search, CheckCircle, ArrowUpRight } from "lucide-react";

type Step = "lookup" | "amount" | "confirm" | "otp" | "done";

const AgentCashOut = () => {
  const [step, setStep] = useState<Step>("lookup");
  const [searchQuery, setSearchQuery] = useState("");
  const [customer, setCustomer] = useState<{ name: string; phone: string; walletId: string; balance: number } | null>(null);
  const [amount, setAmount] = useState("");
  const [otp, setOtp] = useState("");
  const [ref] = useState(`CO-${Date.now().toString().slice(-8)}`);

  const commission = amount ? Math.max(parseFloat(amount) * 0.004, 3) : 0;

  const mockSearch = () => {
    if (searchQuery.length > 5) {
      setCustomer({ name: "Yonas Bekele", phone: "+251 922 444 555", walletId: "TPY-2024-YONAS004", balance: 12500 });
    }
  };

  if (step === "done") return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center animate-scale-in">
      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
        <CheckCircle className="w-10 h-10 text-primary" />
      </div>
      <h2 className="font-display font-bold text-2xl text-foreground mb-1">Cash Out Complete! 🏧</h2>
      <p className="text-muted-foreground text-sm mb-1">{customer?.name}</p>
      <p className="text-primary font-bold text-2xl mb-6">ETB {parseFloat(amount).toLocaleString()}</p>
      <div className="glass rounded-2xl p-4 w-full mb-4 space-y-2 text-left">
        {[
          { label: "Customer", value: customer?.name },
          { label: "Wallet ID", value: customer?.walletId },
          { label: "Reference", value: ref },
          { label: "Cash Paid Out", value: `ETB ${parseFloat(amount).toLocaleString()}` },
          { label: "Agent Commission", value: `ETB ${commission.toFixed(2)}` },
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
        New Cash Out Transaction
      </button>
    </div>
  );

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
          <ArrowUpRight className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg text-foreground">Cash Out</h2>
          <p className="text-xs text-muted-foreground">Pay out cash from customer wallet</p>
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
            <div className="animate-slide-up glass rounded-2xl p-4 border border-primary/30">
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
              <div className="glass rounded-xl p-2 mb-3 text-center">
                <p className="text-xs text-muted-foreground">Available Balance</p>
                <p className="text-primary font-bold text-lg">ETB {customer.balance.toLocaleString()}</p>
              </div>
              <button onClick={() => setStep("amount")} className="w-full py-3 rounded-xl font-bold text-primary-foreground bg-primary text-sm">
                Proceed →
              </button>
            </div>
          )}

          <div className="glass rounded-2xl p-3">
            <p className="text-xs font-bold text-foreground mb-1">⚠️ Cash Out Rules</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>• Verify customer identity before paying out</p>
              <p>• Customer must approve with OTP on their phone</p>
              <p>• Do not pay out to third parties</p>
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
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{customer.name}</p>
              <p className="text-xs text-muted-foreground">{customer.walletId}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Balance</p>
              <p className="text-xs font-bold text-primary">ETB {customer.balance.toLocaleString()}</p>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Withdrawal Amount (ETB) *</label>
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
              <button key={a} onClick={() => setAmount(a)} className={`py-2 rounded-xl text-xs font-bold ${amount === a ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                {a}
              </button>
            ))}
          </div>

          {amount && parseFloat(amount) > 0 && (
            <div className="glass rounded-2xl p-3 space-y-1.5">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Deducted from wallet</span><span className="font-semibold">ETB {parseFloat(amount).toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Cash to pay customer</span><span className="font-semibold text-foreground">ETB {parseFloat(amount).toLocaleString()}</span></div>
              <div className="border-t border-border pt-1.5 flex justify-between text-sm font-bold"><span className="text-green-400">Your Commission</span><span className="text-green-400">+ETB {commission.toFixed(2)}</span></div>
            </div>
          )}

          {amount && parseFloat(amount) > customer.balance && (
            <div className="bg-red-500/10 rounded-xl p-3 text-xs text-red-400">
              ⚠️ Amount exceeds customer's wallet balance.
            </div>
          )}

          <button
            onClick={() => setStep("confirm")}
            disabled={!amount || parseFloat(amount) < 50 || parseFloat(amount) > customer.balance}
            className="w-full py-4 rounded-2xl font-bold text-primary-foreground bg-primary disabled:opacity-40"
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
            <p className="text-sm font-bold text-foreground mb-3">Confirm Cash Out</p>
            <div className="space-y-2">
              {[
                { label: "Customer", value: customer.name },
                { label: "Wallet", value: customer.walletId },
                { label: "Cash Payout", value: `ETB ${parseFloat(amount).toLocaleString()}` },
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
            <p className="text-xs text-muted-foreground">Verify the customer's identity (ID card or biometric) before proceeding. Customer will approve via OTP.</p>
          </div>
          <button onClick={() => setStep("otp")} className="w-full py-4 rounded-2xl font-bold text-primary-foreground bg-primary">
            Proceed to OTP →
          </button>
        </div>
      )}

      {/* STEP 4: OTP */}
      {step === "otp" && (
        <div className="animate-slide-up space-y-4">
          <button onClick={() => setStep("confirm")} className="text-primary text-sm">← Back</button>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground mb-1">Customer OTP Verification</p>
            <p className="text-xs text-muted-foreground">Customer receives OTP on {customer?.phone}</p>
          </div>
          <div className="flex gap-2 justify-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center text-sm font-bold transition-colors ${i < otp.length ? "border-primary bg-primary/10 text-primary" : "border-border glass"}`}>
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

export default AgentCashOut;
