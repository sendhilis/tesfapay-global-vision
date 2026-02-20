import { useState } from "react";
import { Search, ArrowUpRight, ArrowDownLeft, Receipt } from "lucide-react";

const transactions = [
  { id: 1, name: "Tigist Alemu", type: "sent", amount: -250, date: "Today, 10:22 AM", ref: "TXN001", status: "completed" },
  { id: 2, name: "Ethio Telecom", type: "bill", amount: -100, date: "Today, 8:05 AM", ref: "TXN002", status: "completed" },
  { id: 3, name: "Cash In - Dawit Agent", type: "received", amount: 2000, date: "Yesterday", ref: "TXN003", status: "completed" },
  { id: 4, name: "Selam Bekele", type: "received", amount: 500, date: "Yesterday", ref: "TXN004", status: "completed" },
  { id: 5, name: "Addis Power", type: "bill", amount: -350, date: "Feb 15", ref: "TXN005", status: "completed" },
  { id: 6, name: "Yonas Tesfaye", type: "sent", amount: -1200, date: "Feb 14", ref: "TXN006", status: "completed" },
  { id: 7, name: "Global Savings Goal", type: "savings", amount: -500, date: "Feb 13", ref: "TXN007", status: "completed" },
  { id: 8, name: "Loan Disbursement", type: "received", amount: 3000, date: "Feb 12", ref: "TXN008", status: "completed" },
];

const filters = ["All", "Sent", "Received", "Bills", "Savings"];

const typeIcon = (type: string, amount: number) => {
  if (amount > 0) return <ArrowDownLeft className="w-4 h-4 text-green-400" />;
  if (type === "bill") return <Receipt className="w-4 h-4 text-blue-400" />;
  return <ArrowUpRight className="w-4 h-4 text-red-400" />;
};

const TransactionHistory = () => {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = transactions.filter(t => {
    const matchesFilter =
      filter === "All" ||
      (filter === "Sent" && t.type === "sent") ||
      (filter === "Received" && t.type === "received") ||
      (filter === "Bills" && t.type === "bill") ||
      (filter === "Savings" && t.type === "savings");
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.ref.includes(search);
    return matchesFilter && matchesSearch;
  });

  const total = filtered.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="px-4 py-4">
      <h2 className="font-display font-bold text-xl text-foreground mb-4">Transaction History</h2>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input className="w-full pl-9 pr-4 py-3 bg-muted border border-border rounded-2xl text-sm focus:outline-none focus:border-tesfa-gold placeholder:text-muted-foreground" placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none mb-4">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${filter === f ? "bg-gradient-gold text-tesfa-dark" : "glass text-muted-foreground"}`}>{f}</button>
        ))}
      </div>

      {/* Summary */}
      <div className="glass rounded-2xl p-3 mb-4 flex justify-between items-center">
        <div>
          <p className="text-xs text-muted-foreground">{filtered.length} transactions</p>
          <p className={`text-sm font-bold ${total >= 0 ? "text-green-400" : "text-foreground"}`}>
            Net: {total >= 0 ? "+" : ""}ETB {Math.abs(total).toLocaleString()}
          </p>
        </div>
        <button className="glass-gold px-3 py-1.5 rounded-xl text-xs text-gold font-semibold">Export PDF</button>
      </div>

      <div className="space-y-2">
        {filtered.map((txn) => (
          <div key={txn.id} className="glass rounded-2xl p-3.5 flex items-center gap-3 hover-lift">
            <div className="w-10 h-10 rounded-xl glass flex items-center justify-center flex-shrink-0">
              {typeIcon(txn.type, txn.amount)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{txn.name}</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">{txn.date}</p>
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                <p className="text-xs font-mono text-muted-foreground">{txn.ref}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${txn.amount > 0 ? "text-green-400" : "text-foreground"}`}>
                {txn.amount > 0 ? "+" : ""}ETB {Math.abs(txn.amount).toLocaleString()}
              </p>
              <p className="text-[10px] text-green-400/70 font-semibold">✓ {txn.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionHistory;
