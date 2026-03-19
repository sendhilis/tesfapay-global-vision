/**
 * SavingsGoals — Savings goal management screen.
 *
 * @route /wallet/savings
 * @module Wallet
 *
 * @description Displays total saved across all goals, lists individual goals
 * with progress bars, and provides deposit/withdraw actions per goal.
 * Includes AI suggestion for optimal savings pace.
 *
 * @api_endpoints
 * - GET  /v1/savings/goals                       → goals list with totals
 * - POST /v1/savings/goals                       → { name, targetAmount, deadline } → create goal
 * - POST /v1/savings/goals/{goalId}/deposit      → { amount, pin } → deposit
 * - POST /v1/savings/goals/{goalId}/withdraw     → { amount, pin } → withdraw
 *
 * @tables savings_goals, wallets, transactions
 *
 * @mock_data Goals list hardcoded. Replace with useQuery/useMutation.
 */
import { useState } from "react";
import { Plus, Target, TrendingUp } from "lucide-react";

const mockGoals = [
  { id: 1, name: "School Fees", target: 15000, saved: 8500, deadline: "Aug 2025", icon: "🎓", color: "bg-blue-500/15 border-blue-400/30" },
  { id: 2, name: "Emergency Fund", target: 20000, saved: 12000, deadline: "Dec 2024", icon: "🏥", color: "bg-red-500/15 border-red-400/30" },
  { id: 3, name: "Business Float", target: 50000, saved: 5200, deadline: "Mar 2026", icon: "🏪", color: "bg-green-500/15 border-green-400/30" },
];

const SavingsGoals = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: "", target: "", deadline: "" });

  return (
    <div className="px-4 py-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display font-bold text-xl text-foreground">Savings Goals</h2>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 bg-gradient-gold text-tesfa-dark px-3 py-1.5 rounded-xl text-xs font-bold">
          <Plus className="w-3 h-3" /> New Goal
        </button>
      </div>

      {/* Summary */}
      <div className="glass-gold rounded-2xl p-4 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-muted-foreground">Total Saved</p>
            <p className="font-display font-bold text-2xl text-gold">ETB 25,700</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Active Goals</p>
            <p className="font-display font-bold text-2xl text-foreground">{mockGoals.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-2">
          <TrendingUp className="w-3 h-3 text-green-400" />
          <p className="text-xs text-green-400">+ETB 2,000 this month</p>
        </div>
      </div>

      {/* AI suggestion */}
      <div className="glass rounded-2xl p-3 mb-4 flex gap-2">
        <span className="text-lg">🤖</span>
        <div>
          <p className="text-xs font-bold text-gold">Global AI</p>
          <p className="text-xs text-muted-foreground">At your current pace, you'll reach your School Fees goal in 4 months. Add ETB 300/month to meet the deadline.</p>
        </div>
      </div>

      {/* Goals list */}
      <div className="space-y-3 mb-4">
        {mockGoals.map((goal) => {
          const pct = Math.round((goal.saved / goal.target) * 100);
          return (
            <div key={goal.id} className={`glass border ${goal.color} rounded-2xl p-4`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{goal.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{goal.name}</p>
                    <p className="text-xs text-muted-foreground">By {goal.deadline}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gold">{pct}%</p>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                <div className="h-full bg-gradient-gold rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>ETB {goal.saved.toLocaleString()} saved</span>
                <span>ETB {goal.target.toLocaleString()} target</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="flex-1 py-2 rounded-xl text-xs font-bold bg-gradient-gold text-tesfa-dark">Deposit</button>
                <button className="flex-1 py-2 rounded-xl text-xs font-semibold glass text-muted-foreground">Withdraw</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Micro-loan CTA */}
      <div className="glass-green rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-6 h-6 text-tesfa-green-light" />
          <div>
            <p className="text-sm font-bold text-foreground">Global Micro-Loan</p>
            <p className="text-xs text-muted-foreground">AI-powered instant credit up to ETB 10,000</p>
          </div>
        </div>
        <button className="w-full py-2.5 rounded-xl text-xs font-bold glass-green border border-tesfa-green/30 text-tesfa-green-light">Check My Eligibility →</button>
      </div>

      {/* Create Goal Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="glass w-full max-w-md rounded-3xl p-6 animate-slide-up">
            <h3 className="font-display font-bold text-lg text-foreground mb-4">Create Savings Goal</h3>
            <div className="space-y-3 mb-4">
              <input className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-tesfa-gold placeholder:text-muted-foreground" placeholder="Goal name (e.g., Family Vacation)" value={newGoal.name} onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })} />
              <input type="number" className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-tesfa-gold placeholder:text-muted-foreground" placeholder="Target amount (ETB)" value={newGoal.target} onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })} />
              <input type="date" className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-tesfa-gold" value={newGoal.deadline} onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-2xl glass text-sm font-semibold text-muted-foreground">Cancel</button>
              <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-2xl bg-gradient-gold text-tesfa-dark text-sm font-bold">Create Goal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingsGoals;
