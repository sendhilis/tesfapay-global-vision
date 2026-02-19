import { useState } from "react";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

type Step = "form" | "confirm" | "done";

const AgentFloat = () => {
  const [step, setStep] = useState<Step>("form");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const floatBalance = 7500;
  const floatLimit = 50000;
  const maxRequest = floatLimit - floatBalance;
  const ref = `FLT-${Date.now().toString().slice(-8)}`;

  if (step === "done") return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center animate-scale-in">
      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
        <CheckCircle className="w-10 h-10 text-primary" />
      </div>
      <h2 className="font-display font-bold text-2xl text-foreground mb-2">Float Request Submitted!</h2>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">
        Your super agent will review and approve within 30 minutes during business hours.
      </p>
      <div className="glass rounded-2xl p-4 w-full mb-6 space-y-2 text-left">
        {[
          { label: "Requested Amount", value: `ETB ${parseFloat(amount).toLocaleString()}` },
          { label: "From Super Agent", value: "Bole Super Agent Hub" },
          { label: "Reference", value: ref },
          { label: "Status", value: "🟡 Pending Approval" },
          { label: "Expected ETA", value: "Within 30 minutes" },
        ].map(r => (
          <div key={r.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="text-foreground font-semibold">{r.value}</span>
          </div>
        ))}
      </div>
      <button onClick={() => { setStep("form"); setAmount(""); setReason(""); }} className="w-full py-4 rounded-2xl font-bold text-primary-foreground bg-primary">
        Done
      </button>
    </div>
  );

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-foreground" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg text-foreground">Request Float Top-Up</h2>
          <p className="text-xs text-muted-foreground">Request working capital from your super agent</p>
        </div>
      </div>

      {/* Current float status */}
      <div className={`glass rounded-2xl p-4 mb-5 border ${floatBalance < floatLimit * 0.3 ? "border-red-500/30" : "border-transparent"}`}>
        <div className="flex items-center gap-2 mb-2">
          {floatBalance < floatLimit * 0.3 && <AlertCircle className="w-4 h-4 text-red-400" />}
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Current Float Balance</p>
        </div>
        <p className="font-display font-bold text-2xl text-primary mb-1">ETB {floatBalance.toLocaleString()}</p>
        <div className="h-1.5 bg-muted rounded-full mb-1">
          <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${(floatBalance / floatLimit) * 100}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">
          {Math.round((floatBalance / floatLimit) * 100)}% of ETB {floatLimit.toLocaleString()} limit — max top-up: ETB {maxRequest.toLocaleString()}
        </p>
      </div>

      {step === "form" && (
        <div className="animate-slide-up space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-semibold uppercase tracking-wide">Request Amount (ETB) *</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {["10000", "20000", "30000", String(maxRequest)].map(a => (
                <button key={a} onClick={() => setAmount(a)} className={`py-2 rounded-xl text-[10px] font-bold transition-colors ${amount === a ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                  {parseInt(a) >= 1000 ? `${(parseInt(a)/1000).toFixed(0)}K` : a}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              max={maxRequest}
              placeholder="Custom amount..."
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary"
            />
            {amount && parseFloat(amount) > maxRequest && (
              <p className="text-xs text-red-400 mt-1">Exceeds available top-up limit of ETB {maxRequest.toLocaleString()}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. High customer demand this morning..."
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary resize-none h-20 placeholder:text-muted-foreground"
            />
          </div>

          <div className="glass rounded-2xl p-3">
            <p className="text-xs font-bold text-foreground mb-1">📋 Float Top-Up Info</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>• Super Agent: <span className="text-foreground">Bole Super Agent Hub (SA-001)</span></p>
              <p>• Approval time: Within 30 minutes (business hours)</p>
              <p>• Float is credited to your agent wallet instantly on approval</p>
            </div>
          </div>

          <button
            onClick={() => setStep("confirm")}
            disabled={!amount || parseFloat(amount) < 100 || parseFloat(amount) > maxRequest}
            className="w-full py-4 rounded-2xl font-bold text-primary-foreground bg-primary disabled:opacity-40"
          >
            Request Float →
          </button>
        </div>
      )}

      {step === "confirm" && (
        <div className="animate-slide-up space-y-4">
          <button onClick={() => setStep("form")} className="text-primary text-sm">← Back</button>
          <div className="glass rounded-2xl p-4">
            <p className="text-sm font-bold text-foreground mb-3">Confirm Float Request</p>
            <div className="space-y-2">
              {[
                { label: "Requesting from", value: "Bole Super Agent Hub" },
                { label: "Amount", value: `ETB ${parseFloat(amount).toLocaleString()}` },
                { label: "Current Float", value: `ETB ${floatBalance.toLocaleString()}` },
                { label: "Float after approval", value: `ETB ${(floatBalance + parseFloat(amount)).toLocaleString()}` },
                { label: "Reference", value: ref },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-semibold text-foreground">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setStep("done")} className="w-full py-4 rounded-2xl font-bold text-primary-foreground bg-primary">
            Submit Request 🚀
          </button>
        </div>
      )}
    </div>
  );
};

export default AgentFloat;
