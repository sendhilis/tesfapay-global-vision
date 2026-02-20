import { useState } from "react";
import { Star, TrendingUp, Gift } from "lucide-react";

const tiers = [
  { name: "Bronze", min: 0, max: 999, icon: "🥉", color: "border-orange-700/30 bg-orange-900/10" },
  { name: "Silver", min: 1000, max: 4999, icon: "🥈", color: "border-slate-400/30 bg-slate-500/10" },
  { name: "Gold", min: 5000, max: 19999, icon: "🥇", color: "border-tesfa-gold/30 bg-tesfa-gold/10" },
  { name: "Platinum", min: 20000, max: Infinity, icon: "💎", color: "border-blue-400/30 bg-blue-500/10" },
];

const currentPoints = 1240;
const currentTier = tiers.find(t => currentPoints >= t.min && currentPoints <= t.max)!;
const nextTier = tiers[tiers.indexOf(currentTier) + 1];
const pctToNext = nextTier ? Math.round(((currentPoints - currentTier.min) / (nextTier.min - currentTier.min)) * 100) : 100;

const redemptions = [
  { name: "ETB 10 Cashback", points: 200, icon: "💵" },
  { name: "1 GB Data Bundle", points: 500, icon: "📱" },
  { name: "ETB 50 Cashback", points: 1000, icon: "💰" },
  { name: "Free Bill Payment", points: 800, icon: "📄" },
  { name: "0% Loan Discount", points: 2000, icon: "🏦" },
  { name: "Priority Support", points: 3000, icon: "⭐" },
];

const history = [
  { label: "P2P Transfer — Tigist", points: +25, date: "Today" },
  { label: "Bill Payment — ETC", points: +10, date: "Today" },
  { label: "Airtime Bundle", points: +50, date: "Yesterday" },
  { label: "Cashback Redemption", points: -200, date: "Feb 15" },
  { label: "Savings Deposit", points: +30, date: "Feb 14" },
];

const LoyaltyRewards = () => {
  const [tab, setTab] = useState<"overview" | "redeem" | "history">("overview");
  const [redeemed, setRedeemed] = useState<string | null>(null);

  return (
    <div className="px-4 py-4">
      <h2 className="font-display font-bold text-xl text-foreground mb-4">Global Rewards</h2>

      {/* Points card */}
      <div className="relative rounded-3xl overflow-hidden mb-4">
        <div className="absolute inset-0 bg-gradient-gold opacity-90" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `repeating-linear-gradient(45deg, hsl(168 70% 22%) 0px, hsl(168 70% 22%) 1px, transparent 1px, transparent 20px)`,
        }} />
        <div className="relative p-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs text-tesfa-dark/70 font-semibold">Total Points</p>
              <p className="font-display font-bold text-4xl text-tesfa-dark">{currentPoints.toLocaleString()}</p>
              <p className="text-xs text-tesfa-dark/70">≈ ETB {(currentPoints * 0.05).toFixed(2)} value</p>
            </div>
            <div className="text-center">
              <span className="text-3xl">{currentTier.icon}</span>
              <p className="text-xs font-bold text-tesfa-dark mt-0.5">{currentTier.name} Tier</p>
            </div>
          </div>

          {nextTier && (
            <div>
              <div className="flex justify-between text-xs text-tesfa-dark/70 mb-1">
                <span>{currentTier.name}</span>
                <span>{nextTier.name} in {(nextTier.min - currentPoints).toLocaleString()} pts</span>
              </div>
              <div className="h-2 rounded-full bg-tesfa-dark/20 overflow-hidden">
                <div className="h-full rounded-full bg-tesfa-dark/70 transition-all" style={{ width: `${pctToNext}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tier benefits */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none mb-4">
        {tiers.map(t => (
          <div key={t.name} className={`flex-shrink-0 glass border ${t.color} rounded-2xl px-3 py-2 text-center ${t.name === currentTier.name ? "ring-1 ring-tesfa-gold" : ""}`}>
            <span className="text-lg">{t.icon}</span>
            <p className="text-[10px] font-bold text-foreground mt-0.5">{t.name}</p>
            <p className="text-[10px] text-muted-foreground">{t.min >= 20000 ? "20K+" : `${t.min.toLocaleString()}+`} pts</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(["overview", "redeem", "history"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${tab === t ? "bg-gradient-gold text-tesfa-dark" : "glass text-muted-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-3">
          <div className="glass-gold rounded-2xl p-3">
            <p className="text-xs text-gold font-bold mb-1">🤖 Global AI</p>
            <p className="text-xs text-foreground">You earn 10 pts per ETB 100 transaction. Pay 2 more bills this month to reach Silver tier!</p>
          </div>

          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Ways to Earn</p>
          {[
            { label: "P2P Transfers", pts: "10 pts / ETB 100" },
            { label: "Bill Payments", pts: "10 pts per bill" },
            { label: "Airtime Top-up", pts: "1 pt per ETB" },
            { label: "Savings Deposit", pts: "30 pts per deposit" },
            { label: "Merchant Payment", pts: "1 pt per ETB 10" },
            { label: "Refer a Friend", pts: "500 pts per referral" },
          ].map(item => (
            <div key={item.label} className="glass rounded-xl px-4 py-3 flex justify-between">
              <span className="text-sm text-foreground">{item.label}</span>
              <span className="text-sm text-gold font-semibold">{item.pts}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "redeem" && (
        <div className="grid grid-cols-2 gap-3">
          {redemptions.map(item => (
            <button
              key={item.name}
              onClick={() => setRedeemed(item.name)}
              disabled={currentPoints < item.points}
              className={`glass rounded-2xl p-4 text-left hover-lift ${currentPoints < item.points ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span className="text-2xl mb-2 block">{item.icon}</span>
              <p className="text-xs font-bold text-foreground">{item.name}</p>
              <p className="text-xs text-gold font-semibold mt-1">🌟 {item.points.toLocaleString()} pts</p>
              {currentPoints >= item.points && (
                <span className="text-[10px] text-green-400 font-semibold">Available</span>
              )}
            </button>
          ))}

          {redeemed && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <div className="glass w-full max-w-sm rounded-3xl p-6 text-center animate-scale-in">
                <Gift className="w-12 h-12 text-gold mx-auto mb-3" />
                <h3 className="font-display font-bold text-lg text-foreground mb-1">Redeemed!</h3>
                <p className="text-sm text-muted-foreground mb-4">{redeemed} will be applied to your account within minutes.</p>
                <button onClick={() => setRedeemed(null)} className="w-full py-3 rounded-2xl font-bold text-tesfa-dark bg-gradient-gold">Done</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-2">
          {history.map((item, i) => (
            <div key={i} className="glass rounded-2xl px-4 py-3 flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.date}</p>
              </div>
              <p className={`text-sm font-bold ${item.points > 0 ? "text-gold" : "text-red-400"}`}>
                {item.points > 0 ? "+" : ""}{item.points} pts
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LoyaltyRewards;
