import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownLeft, ArrowUpRight, Users, BarChart3,
  TrendingUp, AlertCircle, RefreshCw, ChevronRight
} from "lucide-react";

const recentTxns = [
  { type: "cashin", customer: "Tigist Alemu", phone: "+251 911 222 333", amount: 2000, commission: 6, time: "09:14 AM", ref: "CI-928371" },
  { type: "cashout", customer: "Yonas Bekele", phone: "+251 922 444 555", amount: 5000, commission: 20, time: "08:55 AM", ref: "CO-928340" },
  { type: "cashin", customer: "Meron Tadesse", phone: "+251 933 666 777", amount: 1500, commission: 4.5, time: "08:30 AM", ref: "CI-928299" },
  { type: "cashout", customer: "Abel Girma", phone: "+251 944 888 999", amount: 3000, commission: 12, time: "Yesterday", ref: "CO-928101" },
];

const AgentHome = () => {
  const navigate = useNavigate();
  const [floatBalance] = useState(42500);
  const [floatLimit] = useState(50000);
  const floatPct = Math.round((floatBalance / floatLimit) * 100);
  const floatWarning = floatPct < 30;

  return (
    <div className="px-4 py-4 space-y-4">

      {/* Float Balance Card */}
      <div className="glass rounded-3xl p-5 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">Float Balance</p>
        <p className="font-display font-bold text-3xl text-primary mb-1">
          ETB {floatBalance.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground mb-3">Limit: ETB {floatLimit.toLocaleString()}</p>

        {/* Float usage bar */}
        <div className="h-2 bg-muted rounded-full mb-1.5">
          <div
            className={`h-2 rounded-full transition-all ${floatPct > 60 ? "bg-green-500" : floatPct > 30 ? "bg-primary" : "bg-red-500"}`}
            style={{ width: `${floatPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{floatPct}% remaining</span>
          <span>ETB {(floatLimit - floatBalance).toLocaleString()} used</span>
        </div>

        {floatWarning && (
          <div className="mt-3 flex items-center gap-2 bg-red-500/10 rounded-xl p-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-400">Low float! Request top-up to continue serving customers.</p>
          </div>
        )}
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Today's Txns", value: "12", sub: "+3 vs yesterday", color: "text-primary" },
          { label: "Commission", value: "ETB 284", sub: "Today earned", color: "text-green-400" },
          { label: "This Month", value: "ETB 6.2K", sub: "Commission total", color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-3 text-center">
            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
            <p className="text-[8px] text-muted-foreground/60 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide">Agent Actions</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: ArrowDownLeft, label: "Cash In", sub: "Deposit for customer", color: "bg-green-500/20 text-green-400", route: "/agent/cashin" },
            { icon: ArrowUpRight, label: "Cash Out", sub: "Withdraw for customer", color: "bg-primary/20 text-primary", route: "/agent/cashout" },
            { icon: Users, label: "Register Customer", sub: "New wallet onboarding", color: "bg-secondary/30 text-foreground", route: "/agent/customers" },
            { icon: RefreshCw, label: "Request Float", sub: "Top up from super agent", color: "bg-accent/20 text-accent-foreground", route: "/agent/float" },
          ].map(({ icon: Icon, label, sub, color, route }) => (
            <button
              key={label}
              onClick={() => navigate(route)}
              className="glass rounded-2xl p-4 text-left hover-lift"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-foreground">{label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* AI Nudge */}
      <div className="glass rounded-2xl p-3 flex gap-2 items-start">
        <span className="text-base">🤖</span>
        <div>
          <p className="text-xs font-bold text-primary">Tesfa AI Agent Advisor</p>
          <p className="text-xs text-muted-foreground">
            Your busiest Cash Out hour is 8–10 AM. Consider starting with full float each morning to maximize commission earnings.
          </p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Recent Transactions</p>
          <button onClick={() => navigate("/agent/commission")} className="text-xs text-primary">View all →</button>
        </div>
        <div className="space-y-2">
          {recentTxns.map(txn => (
            <div key={txn.ref} className="glass rounded-2xl p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${txn.type === "cashin" ? "bg-green-500/20" : "bg-primary/20"}`}>
                {txn.type === "cashin" ? <ArrowDownLeft className="w-4 h-4 text-green-400" /> : <ArrowUpRight className="w-4 h-4 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{txn.customer}</p>
                <p className="text-[10px] text-muted-foreground">{txn.type === "cashin" ? "Cash In" : "Cash Out"} · {txn.time}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-foreground">ETB {txn.amount.toLocaleString()}</p>
                <p className="text-[10px] text-green-400">+ETB {txn.commission} commission</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance widget */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-foreground">Monthly Performance</p>
          <TrendingUp className="w-4 h-4 text-green-400" />
        </div>
        <div className="flex items-end gap-1 h-14">
          {[60, 45, 80, 55, 90, 70, 85, 100, 75, 95, 88, floatPct].map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-sm transition-all ${i === 11 ? "bg-primary" : "bg-muted"}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
          <span>Jan</span><span>Feb (MTD)</span>
        </div>
      </div>

      <div className="h-4" />
    </div>
  );
};

export default AgentHome;
