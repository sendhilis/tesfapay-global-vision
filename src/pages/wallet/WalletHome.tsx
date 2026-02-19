import { useState } from "react";
import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft, Zap, MoreHorizontal, Bell, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const quickActions = [
  { label: "Send Money", icon: "💸", color: "bg-tesfa-gold/15 border-tesfa-gold/20", to: "/wallet/send" },
  { label: "Pay Bills", icon: "📄", color: "bg-blue-500/15 border-blue-500/20", to: "/wallet/pay" },
  { label: "Request", icon: "🤝", color: "bg-orange-500/15 border-orange-500/20", to: "/wallet/request" },
  { label: "Airtime", icon: "📱", color: "bg-purple-500/15 border-purple-500/20", to: "/wallet/airtime" },
  { label: "Cash In/Out", icon: "🏧", color: "bg-green-500/15 border-green-500/20", to: "/wallet/cashinout" },
  { label: "Merchant Pay", icon: "🏪", color: "bg-pink-500/15 border-pink-500/20", to: "/wallet/merchant" },
  { label: "Micro-Loan", icon: "💳", color: "bg-red-500/15 border-red-500/20", to: "/wallet/loan" },
  { label: "Rewards", icon: "🌟", color: "bg-yellow-500/15 border-yellow-500/20", to: "/wallet/loyalty" },
  { label: "Savings", icon: "🏦", color: "bg-teal-500/15 border-teal-500/20", to: "/wallet/savings" },
];

const recentTxns = [
  { name: "Tigist Alemu", type: "sent", amount: -250, time: "2 min ago", avatar: "TA" },
  { name: "Ethio Telecom", type: "bill", amount: -100, time: "1 hr ago", avatar: "ET" },
  { name: "Cash In - Agent", type: "received", amount: 2000, time: "Yesterday", avatar: "CA" },
  { name: "Selam Bekele", type: "received", amount: 500, time: "Yesterday", avatar: "SB" },
  { name: "Addis Power", type: "bill", amount: -350, time: "2 days ago", avatar: "AP" },
];

const WalletHome = () => {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Balance Card */}
      <div className="relative rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-green opacity-90" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `repeating-linear-gradient(45deg, hsl(42 90% 52%) 0px, hsl(42 90% 52%) 1px, transparent 1px, transparent 15px),
            repeating-linear-gradient(-45deg, hsl(168 70% 32%) 0px, hsl(168 70% 32%) 1px, transparent 1px, transparent 15px)`,
        }} />
        <div className="relative p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-white/70 mb-0.5">Main Wallet Balance</p>
              <div className="flex items-center gap-2">
                <p className="font-display font-bold text-3xl text-white">
                  {showBalance ? "ETB 12,450.00" : "ETB ••••••"}
                </p>
                <button onClick={() => setShowBalance(!showBalance)} className="text-white/70 hover:text-white">
                  {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 rounded-full bg-white/10 hover:bg-white/20">
                <Bell className="w-4 h-4 text-white" />
              </button>
              <button className="p-2 rounded-full bg-white/10 hover:bg-white/20">
                <MoreHorizontal className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Sub wallets */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-white/10 rounded-2xl p-3">
              <p className="text-xs text-white/60">Savings Wallet</p>
              <p className="text-sm font-bold text-white">{showBalance ? "ETB 5,200" : "ETB ••••"}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3">
              <p className="text-xs text-white/60">Tesfa Points</p>
              <p className="text-sm font-bold text-gold">{showBalance ? "🌟 1,240 pts" : "🌟 ••••"}</p>
            </div>
          </div>

          {/* Quick in/out */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/wallet/history")}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25 rounded-2xl py-2.5 transition-colors"
            >
              <ArrowDownLeft className="w-4 h-4 text-white" />
              <span className="text-xs text-white font-semibold">Cash In</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25 rounded-2xl py-2.5 transition-colors">
              <ArrowUpRight className="w-4 h-4 text-white" />
              <span className="text-xs text-white font-semibold">Cash Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tesfa AI Insight */}
      <div className="glass-gold rounded-2xl p-3.5 flex gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-gold flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-tesfa-dark" />
        </div>
        <div>
          <p className="text-xs font-bold text-gold mb-0.5">Tesfa AI Insight</p>
          <p className="text-xs text-foreground">You spend 35% less on bills this month. Consider moving ETB 500 to your savings goal. 📈</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-sm font-bold text-foreground mb-3">Quick Actions</p>
        <div className="grid grid-cols-3 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              className={`glass border ${action.color} rounded-2xl p-3 flex flex-col items-center gap-2 hover-lift`}
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-xs font-medium text-foreground text-center leading-tight">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-bold text-foreground">Recent Transactions</p>
          <button onClick={() => navigate("/wallet/history")} className="text-xs text-gold">View all</button>
        </div>
        <div className="space-y-2">
          {recentTxns.map((txn) => (
            <div key={txn.name + txn.time} className="glass rounded-2xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0">
                {txn.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{txn.name}</p>
                <p className="text-xs text-muted-foreground">{txn.time}</p>
              </div>
              <p className={`text-sm font-bold ${txn.amount > 0 ? "text-green-400" : "text-foreground"}`}>
                {txn.amount > 0 ? "+" : ""}ETB {Math.abs(txn.amount).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Promo Banner */}
      <div className="glass-gold rounded-2xl p-4 flex gap-3 items-center">
        <Zap className="w-8 h-8 text-gold flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-gold">Double Points Weekend!</p>
          <p className="text-xs text-muted-foreground">Earn 2x Tesfa Points on all transactions this weekend. Ends Sunday.</p>
        </div>
      </div>
    </div>
  );
};

export default WalletHome;
