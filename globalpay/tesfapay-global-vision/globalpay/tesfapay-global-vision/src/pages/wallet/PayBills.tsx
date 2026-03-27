/**
 * PayBills — Bill payment screen.
 *
 * @route /wallet/pay
 * @module Wallet
 *
 * @description Browse billers by category (Telecom, Utility, Water, TV, Education),
 * select a biller, enter account number + amount, confirm, and pay.
 *
 * @api_endpoints
 * - GET  /v1/billers?category=...             → biller list with categories
 * - POST /v1/billers/{billerId}/validate      → { accountNumber } → validate account
 * - POST /v1/billers/{billerId}/pay           → { accountNumber, amount, pin } → payment result
 *
 * @tables billers, transactions, wallets
 *
 * @mock_data Billers list and categories hardcoded. Replace with useQuery.
 */
import { useState } from "react";
import { Search } from "lucide-react";

const categories = [
  { id: "all", label: "All" },
  { id: "telecom", label: "Telecom" },
  { id: "utility", label: "Utility" },
  { id: "water", label: "Water" },
  { id: "tv", label: "TV" },
  { id: "education", label: "Education" },
];

const billers = [
  { name: "Ethio Telecom", category: "telecom", icon: "📱", desc: "Mobile Airtime & Data", popular: true },
  { name: "Ethiopian Electric Utility", category: "utility", icon: "⚡", desc: "Electricity bill", popular: true },
  { name: "Addis Ababa Water", category: "water", icon: "💧", desc: "Water & sewerage" },
  { name: "EthioSat TV", category: "tv", icon: "📺", desc: "Satellite subscription" },
  { name: "EOTC School Fees", category: "education", icon: "🎓", desc: "School & university fees" },
  { name: "Internet (ETC)", category: "telecom", icon: "🌐", desc: "Fixed broadband" },
  { name: "Addis Gas", category: "utility", icon: "🔥", desc: "LPG gas payment" },
  { name: "Nib Insurance", category: "utility", icon: "🛡️", desc: "Insurance premium" },
];

const PayBills = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedBiller, setSelectedBiller] = useState<typeof billers[0] | null>(null);
  const [accountNum, setAccountNum] = useState("");
  const [amount, setAmount] = useState("");
  const [paid, setPaid] = useState(false);

  const filtered = billers.filter(b =>
    (activeCategory === "all" || b.category === activeCategory) &&
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  if (paid) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center animate-scale-in">
      <div className="w-20 h-20 rounded-full bg-gradient-green flex items-center justify-center mb-4">
        <span className="text-3xl">✓</span>
      </div>
      <h2 className="font-display font-bold text-2xl text-foreground mb-1">Bill Paid! 🎉</h2>
      <p className="text-muted-foreground text-sm mb-4">{selectedBiller?.name} — ETB {parseFloat(amount || "0").toLocaleString()}</p>
      <button onClick={() => { setPaid(false); setSelectedBiller(null); setAmount(""); setAccountNum(""); }} className="w-full max-w-xs py-4 rounded-2xl font-bold text-tesfa-dark bg-gradient-gold">Pay Another Bill</button>
    </div>
  );

  if (selectedBiller) return (
    <div className="px-4 py-4 animate-slide-up">
      <button onClick={() => setSelectedBiller(null)} className="text-gold text-sm mb-4">← Back</button>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-2xl">{selectedBiller.icon}</div>
        <div>
          <h2 className="font-display font-bold text-lg text-foreground">{selectedBiller.name}</h2>
          <p className="text-xs text-muted-foreground">{selectedBiller.desc}</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Account / Meter Number *</label>
          <input className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-tesfa-gold placeholder:text-muted-foreground" placeholder="Enter account number" value={accountNum} onChange={(e) => setAccountNum(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Amount (ETB) *</label>
          <input type="number" className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-tesfa-gold placeholder:text-muted-foreground" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      </div>

      <div className="glass rounded-2xl p-3 mb-4 space-y-2">
        {[{ label: "Service Fee", value: "ETB 1.00" }, { label: "Points Earned", value: "+10 pts 🌟" }].map(r => (
          <div key={r.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="text-gold font-semibold">{r.value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => setPaid(true)}
        disabled={!accountNum || !amount}
        className="w-full py-4 rounded-2xl font-bold text-tesfa-dark bg-gradient-gold shadow-gold disabled:opacity-40"
      >
        Pay Now
      </button>
    </div>
  );

  return (
    <div className="px-4 py-4">
      <h2 className="font-display font-bold text-xl text-foreground mb-4">Pay Bills</h2>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input className="w-full pl-9 pr-4 py-3 bg-muted border border-border rounded-2xl text-sm focus:outline-none focus:border-tesfa-gold placeholder:text-muted-foreground" placeholder="Search billers..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none mb-4">
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${activeCategory === cat.id ? "bg-gradient-gold text-tesfa-dark" : "glass text-muted-foreground"}`}>{cat.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map(biller => (
          <button key={biller.name} onClick={() => setSelectedBiller(biller)} className="glass rounded-2xl p-4 text-left hover-lift relative">
            {biller.popular && <span className="absolute top-2 right-2 text-[9px] bg-gradient-gold text-tesfa-dark px-1.5 py-0.5 rounded-full font-bold">Popular</span>}
            <div className="text-2xl mb-2">{biller.icon}</div>
            <p className="text-xs font-bold text-foreground leading-tight">{biller.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{biller.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PayBills;
