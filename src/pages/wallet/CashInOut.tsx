/**
 * CashInOut — Agent-assisted cash deposit/withdrawal screen.
 *
 * @route /wallet/cashinout
 * @module Wallet
 *
 * @description Toggle between Cash In / Cash Out. Steps: (1) Browse nearby agents
 * with distance/rating, (2) Select agent, enter amount, (3) Enter OTP for
 * agent confirmation, (4) Success receipt with fee (ETB 5.00).
 *
 * @api_endpoints
 * - GET  /v1/agents/nearby?lat=...&lng=...  → nearby agents with distance
 * - POST /v1/cash/in                         → { agentCode, amount, pin } → OTP issued
 * - POST /v1/cash/out                        → { agentCode, amount, pin } → OTP issued
 *
 * @tables agents, transactions, wallets, otp_verifications
 *
 * @mock_data Agent list hardcoded. Replace with geolocation + useQuery.
 */
import { useState } from "react";
import { MapPin, CheckCircle, ArrowDownLeft, ArrowUpRight } from "lucide-react";

const agents = [
  { name: "Dawit Haile Agent", code: "AGT-001", distance: "0.3 km", address: "Bole Road, Addis Ababa", rating: 4.8 },
  { name: "Merkato Hub", code: "AGT-002", distance: "0.7 km", address: "Merkato Area, Addis Ababa", rating: 4.6 },
  { name: "CMC Branch Agent", code: "AGT-003", distance: "1.2 km", address: "CMC, Addis Ababa", rating: 4.9 },
];

const CashInOut = () => {
  const [mode, setMode] = useState<"cashin" | "cashout">("cashin");
  const [step, setStep] = useState<"agents" | "amount" | "confirm" | "done">("agents");
  const [selected, setSelected] = useState<typeof agents[0] | null>(null);
  const [amount, setAmount] = useState("");
  const [otp, setOtp] = useState("");

  const handleAgentSelect = (agent: typeof agents[0]) => {
    setSelected(agent);
    setStep("amount");
  };

  if (step === "done") return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center animate-scale-in">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${mode === "cashin" ? "bg-gradient-green" : "bg-gradient-gold"}`}>
        <CheckCircle className="w-10 h-10 text-white" />
      </div>
      <h2 className="font-display font-bold text-2xl text-foreground mb-1">
        {mode === "cashin" ? "Cash In Successful! 💰" : "Cash Out Initiated! 🏧"}
      </h2>
      <p className="text-muted-foreground text-sm mb-2">{selected?.name}</p>
      <p className="text-gold font-bold text-2xl mb-6">ETB {parseFloat(amount || "0").toLocaleString()}</p>
      <div className="glass rounded-2xl p-4 w-full mb-6 space-y-2 text-left">
        {[
          { label: "Agent", value: selected?.name },
          { label: "Agent Code", value: selected?.code },
          { label: "Reference", value: `${mode === "cashin" ? "CI" : "CO"}-${Date.now().toString().slice(-6)}` },
          { label: "Service Fee", value: "ETB 5.00" },
          { label: "Net Amount", value: `ETB ${(parseFloat(amount || "0") - 5).toLocaleString()}` },
        ].map(r => (
          <div key={r.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="text-foreground font-semibold">{r.value}</span>
          </div>
        ))}
      </div>
      <button onClick={() => { setStep("agents"); setSelected(null); setAmount(""); setOtp(""); }} className="w-full py-4 rounded-2xl font-bold text-tesfa-dark bg-gradient-gold">
        Done
      </button>
    </div>
  );

  return (
    <div className="px-4 py-4">
      <h2 className="font-display font-bold text-xl text-foreground mb-4">Cash In / Cash Out</h2>

      {/* Toggle */}
      <div className="flex gap-3 mb-6 glass rounded-2xl p-1">
        <button
          onClick={() => { setMode("cashin"); setStep("agents"); setSelected(null); setAmount(""); }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === "cashin" ? "bg-gradient-green text-white" : "text-muted-foreground"}`}
        >
          <ArrowDownLeft className="w-4 h-4" /> Cash In
        </button>
        <button
          onClick={() => { setMode("cashout"); setStep("agents"); setSelected(null); setAmount(""); }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === "cashout" ? "bg-gradient-gold text-tesfa-dark" : "text-muted-foreground"}`}
        >
          <ArrowUpRight className="w-4 h-4" /> Cash Out
        </button>
      </div>

      {step === "agents" && (
        <div className="animate-slide-up">
          <div className="flex items-center gap-2 glass rounded-xl px-3 py-2.5 mb-4">
            <MapPin className="w-4 h-4 text-gold" />
            <p className="text-xs text-muted-foreground">Showing agents near <span className="text-foreground font-semibold">Bole, Addis Ababa</span></p>
          </div>

          <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wide">Nearby Agents</p>
          <div className="space-y-2">
            {agents.map((agent) => (
              <button key={agent.code} onClick={() => handleAgentSelect(agent)} className="w-full glass rounded-2xl p-4 flex items-center gap-3 hover-lift text-left">
                <div className="w-10 h-10 rounded-xl bg-gradient-green flex items-center justify-center font-bold text-foreground text-xs flex-shrink-0">
                  {agent.code.slice(-1)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">{agent.address}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gold">⭐ {agent.rating}</span>
                    <span className="text-[10px] text-muted-foreground">· {agent.distance}</span>
                    <span className="text-[10px] bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded-full font-semibold">Open</span>
                  </div>
                </div>
                <span className="text-xs text-gold font-semibold">Select →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "amount" && selected && (
        <div className="animate-slide-up space-y-4">
          <button onClick={() => setStep("agents")} className="text-gold text-sm mb-2">← Back</button>
          <div className="glass rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-green flex items-center justify-center font-bold text-foreground text-xs">{selected.code.slice(-1)}</div>
            <div>
              <p className="text-sm font-bold text-foreground">{selected.name}</p>
              <p className="text-xs text-muted-foreground">{selected.code} · {selected.distance}</p>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Amount (ETB) *</label>
            <input
              type="number"
              className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-tesfa-gold placeholder:text-muted-foreground"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Quick amounts */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Quick select</p>
            <div className="flex gap-2 flex-wrap">
              {["500", "1000", "2000", "5000"].map(a => (
                <button key={a} onClick={() => setAmount(a)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${amount === a ? "bg-gradient-gold text-tesfa-dark" : "glass text-muted-foreground"}`}>
                  ETB {a}
                </button>
              ))}
            </div>
          </div>

          {amount && (
            <div className="glass rounded-2xl p-3 space-y-1.5">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">{mode === "cashin" ? "Depositing" : "Withdrawing"}</span><span className="text-foreground font-semibold">ETB {parseFloat(amount).toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Agent Commission Fee</span><span className="text-foreground font-semibold">ETB 5.00</span></div>
              <div className="flex justify-between text-sm font-bold"><span className="text-foreground">Net to Wallet</span><span className="text-gold">ETB {(parseFloat(amount) - 5).toLocaleString()}</span></div>
            </div>
          )}

          <button
            onClick={() => setStep("confirm")}
            disabled={!amount || parseFloat(amount) < 10}
            className="w-full py-4 rounded-2xl font-bold text-tesfa-dark bg-gradient-gold shadow-gold disabled:opacity-40"
          >
            Continue →
          </button>
        </div>
      )}

      {step === "confirm" && (
        <div className="animate-slide-up space-y-4">
          <button onClick={() => setStep("amount")} className="text-gold text-sm mb-2">← Back</button>
          <div className="glass-gold rounded-2xl p-4">
            <p className="text-sm font-bold text-foreground mb-3">Confirm {mode === "cashin" ? "Cash In" : "Cash Out"}</p>
            <div className="space-y-2">
              {[
                { label: "Agent", value: selected?.name },
                { label: "Amount", value: `ETB ${parseFloat(amount).toLocaleString()}` },
                { label: "Fee", value: "ETB 5.00" },
                { label: "Net Amount", value: `ETB ${(parseFloat(amount) - 5).toLocaleString()}` },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="text-foreground font-semibold">{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Enter OTP sent to your phone</label>
            <div className="flex gap-2 justify-center">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center text-sm font-bold transition-colors ${i < otp.length ? "border-tesfa-gold bg-tesfa-gold/10 text-gold" : "border-border glass"}`}>
                  {i < otp.length ? "●" : ""}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mt-3">
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
                  className={`h-12 rounded-2xl text-base font-bold glass hover:bg-tesfa-gold/10 hover:text-gold transition-colors ${num === "" ? "invisible" : ""}`}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2">OTP sent to +251 912-345-678</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashInOut;
