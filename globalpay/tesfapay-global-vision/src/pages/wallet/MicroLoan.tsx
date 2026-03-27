/**
 * MicroLoan — AI-driven micro-loan application screen.
 *
 * @route /wallet/loan
 * @module Wallet
 *
 * @description Multi-stage flow: (1) View AI credit score + eligibility with
 * factor breakdown, (2) Select loan amount + repayment term (1/3/6 months),
 * (3) Confirm loan details, (4) Disbursement success with repayment schedule.
 * Interest rates: 2% (1mo), 5% (3mo), 10% (6mo).
 *
 * @api_endpoints
 * - GET  /v1/loans/eligibility     → { aiCreditScore, maxLoanAmount, factors[] }
 * - GET  /v1/loans/plans?amount=X  → repayment plan options
 * - POST /v1/loans/apply           → { amount, termMonths, purpose, pin } → disbursement
 * - GET  /v1/loans/active          → active loan details
 * - POST /v1/loans/{loanId}/repay  → { amount, pin } → repayment
 *
 * @tables loans, loan_repayments, credit_scores, wallets, transactions
 *
 * @mock_data Credit score (78/100), max loan (ETB 8,000) hardcoded.
 * Replace with useQuery to /loans/eligibility.
 */
import { useState, useMemo } from "react";
import { Sparkles, CheckCircle, TrendingUp, AlertCircle } from "lucide-react";

const eligibilityScore = 78;
const maxLoan = 8000;

const REPAYMENT_OPTIONS = [
  { months: 1, interestRate: 0.02, interest: "2%" },
  { months: 3, interestRate: 0.05, interest: "5%" },
  { months: 6, interestRate: 0.10, interest: "10%" },
];

const MicroLoan = () => {
  const [stage, setStage] = useState<"eligibility" | "apply" | "confirm" | "disbursed">("eligibility");
  const [loanAmount, setLoanAmount] = useState("3000");
  const [selectedMonths, setSelectedMonths] = useState(3);
  const [purpose, setPurpose] = useState("");

  const repaymentPlans = useMemo(() => {
    const amount = parseFloat(loanAmount) || 0;
    return REPAYMENT_OPTIONS.map(o => {
      const total = Math.round(amount * (1 + o.interestRate));
      const monthly = Math.round(total / o.months);
      return { months: o.months, amount: total, monthly, interest: o.interest };
    });
  }, [loanAmount]);

  const plan = repaymentPlans.find(p => p.months === selectedMonths) ?? repaymentPlans[1];

  const scoreColor = eligibilityScore >= 70 ? "text-green-400" : eligibilityScore >= 50 ? "text-gold" : "text-red-400";
  const scoreLabel = eligibilityScore >= 70 ? "Excellent" : eligibilityScore >= 50 ? "Good" : "Fair";

  if (stage === "disbursed") return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center animate-scale-in">
      <div className="w-20 h-20 rounded-full bg-gradient-green flex items-center justify-center mb-4">
        <CheckCircle className="w-10 h-10 text-white" />
      </div>
      <h2 className="font-display font-bold text-2xl text-foreground mb-1">Loan Disbursed! 🎉</h2>
      <p className="text-muted-foreground text-sm mb-2">Funds added to your Main Wallet</p>
      <p className="text-gold font-bold text-3xl mb-6">ETB {parseFloat(loanAmount).toLocaleString()}</p>
      <div className="glass rounded-2xl p-4 w-full mb-6 space-y-2 text-left">
        {[
          { label: "Loan Ref", value: `LNS-${Date.now().toString().slice(-6)}` },
          { label: "Monthly Payment", value: `ETB ${plan.monthly.toLocaleString()}` },
          { label: "Term", value: `${plan.months} month${plan.months > 1 ? "s" : ""}` },
          { label: "Total Repayment", value: `ETB ${plan.amount.toLocaleString()}` },
          { label: "Next Due Date", value: "March 19, 2026" },
        ].map(r => (
          <div key={r.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="text-foreground font-semibold">{r.value}</span>
          </div>
        ))}
      </div>
      <div className="glass-gold rounded-2xl p-3 w-full mb-4 text-left">
        <p className="text-xs text-gold">🤖 Global AI: Repay on time to boost your credit score and unlock higher loan limits. Set up auto-repay in your profile.</p>
      </div>
      <button onClick={() => setStage("eligibility")} className="w-full py-4 rounded-2xl font-bold text-tesfa-dark bg-gradient-gold">
        View Loan Details
      </button>
    </div>
  );

  return (
    <div className="px-4 py-4">
      <h2 className="font-display font-bold text-xl text-foreground mb-4">Global Micro-Loan</h2>

      {stage === "eligibility" && (
        <div className="animate-slide-up space-y-4">
          {/* AI Score Card */}
          <div className="glass-gold rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-tesfa-dark" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Global AI Credit Score</p>
                <p className={`text-2xl font-display font-bold ${scoreColor}`}>{eligibilityScore}/100</p>
              </div>
              <div className="ml-auto">
                <span className={`text-xs font-bold px-2 py-1 rounded-lg glass ${scoreColor}`}>{scoreLabel}</span>
              </div>
            </div>

            {/* Score bar */}
            <div className="h-3 bg-muted rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full bg-gradient-gold transition-all"
                style={{ width: `${eligibilityScore}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Based on transaction history, savings behaviour & KYC level</p>
          </div>

          {/* Eligibility summary */}
          <div className="glass rounded-2xl p-4 space-y-3">
            <p className="text-sm font-bold text-foreground">You're eligible for:</p>
            <div className="text-center py-3">
              <p className="text-3xl font-display font-bold text-gold">ETB {maxLoan.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Maximum loan amount</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Min Amount", value: "ETB 500" },
                { label: "Max Term", value: "6 months" },
                { label: "Interest", value: "From 2%" },
              ].map(item => (
                <div key={item.label} className="glass rounded-xl p-2">
                  <p className="text-xs text-gold font-bold">{item.value}</p>
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Score factors */}
          <div className="glass rounded-2xl p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Score Factors</p>
            <div className="space-y-2">
              {[
                { label: "Transaction History", score: 85, status: "positive" },
                { label: "Savings Regularity", score: 72, status: "positive" },
                { label: "KYC Level", score: 60, status: "neutral" },
                { label: "Outstanding Loans", score: 100, status: "positive" },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <p className="text-xs text-foreground">{f.label}</p>
                      <p className="text-xs text-gold">{f.score}%</p>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${f.status === "positive" ? "bg-green-400" : "bg-tesfa-gold"}`} style={{ width: `${f.score}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-3 flex gap-2">
            <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">Upgrade to KYC Level 2 to unlock up to ETB 50,000 in loan eligibility</p>
          </div>

          <button onClick={() => setStage("apply")} className="w-full py-4 rounded-2xl font-bold text-tesfa-dark bg-gradient-gold shadow-gold">
            Apply for Loan →
          </button>
        </div>
      )}

      {stage === "apply" && (
        <div className="animate-slide-up space-y-4">
          <div className="glass-gold rounded-2xl p-3">
            <p className="text-xs text-gold">🤖 Global AI suggests ETB 3,000 based on your repayment capacity</p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Loan Amount (ETB)</label>
            <input
              type="number"
              className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-tesfa-gold text-center text-xl font-bold"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              min={500}
              max={maxLoan}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
              <span>Min: ETB 500</span>
              <span>Max: ETB {maxLoan.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Loan Purpose</label>
            <select
              className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-tesfa-gold"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            >
              <option value="">Select purpose</option>
              <option>Business Working Capital</option>
              <option>School Fees</option>
              <option>Medical Emergency</option>
              <option>Agricultural Input</option>
              <option>Home Improvement</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Repayment Plan</label>
            <div className="space-y-2">
              {repaymentPlans.map(p => (
                <button
                  key={p.months}
                  onClick={() => setSelectedMonths(p.months)}
                  className={`w-full glass rounded-2xl p-3.5 flex items-center justify-between border-2 transition-all ${
                    selectedMonths === p.months ? "border-tesfa-gold bg-tesfa-gold/10" : "border-transparent"
                  }`}
                >
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">{p.months} Month{p.months > 1 ? "s" : ""}</p>
                    <p className="text-xs text-muted-foreground">{p.interest} total interest</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gold">ETB {p.monthly.toLocaleString()}/mo</p>
                    <p className="text-xs text-muted-foreground">Total: ETB {p.amount.toLocaleString()}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStage("eligibility")} className="flex-1 py-3 rounded-2xl glass text-sm font-semibold text-muted-foreground">Back</button>
            <button onClick={() => setStage("confirm")} disabled={!loanAmount || !purpose} className="flex-1 py-3 rounded-2xl font-bold text-tesfa-dark bg-gradient-gold disabled:opacity-40">
              Review →
            </button>
          </div>
        </div>
      )}

      {stage === "confirm" && (
        <div className="animate-slide-up space-y-4">
          <div className="glass rounded-2xl p-5">
            <p className="font-display font-bold text-sm text-foreground mb-4">Loan Summary</p>
            <div className="space-y-3">
              {[
                { label: "Loan Amount", value: `ETB ${parseFloat(loanAmount).toLocaleString()}`, highlight: true },
                { label: "Purpose", value: purpose },
                { label: "Repayment Term", value: `${plan.months} month${plan.months > 1 ? "s" : ""}` },
                { label: "Monthly Payment", value: `ETB ${plan.monthly.toLocaleString()}` },
                { label: "Total Repayment", value: `ETB ${plan.amount.toLocaleString()}` },
                { label: "Interest", value: plan.interest },
                { label: "First Due Date", value: "March 19, 2026" },
              ].map(r => (
                <div key={r.label} className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{r.label}</span>
                  <span className={`text-sm font-bold ${r.highlight ? "text-gold text-base" : "text-foreground"}`}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-3 flex gap-2">
            <AlertCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">By confirming, you agree to the Global Micro-Loan terms and authorize automatic repayments from your wallet on due dates.</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStage("apply")} className="flex-1 py-3 rounded-2xl glass text-sm font-semibold text-muted-foreground">Edit</button>
            <button onClick={() => setStage("disbursed")} className="flex-1 py-3 rounded-2xl font-bold text-tesfa-dark bg-gradient-gold">
              Confirm & Receive
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MicroLoan;
