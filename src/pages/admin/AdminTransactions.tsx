import { useState } from "react";
import { Search, ArrowUpRight, ArrowDownLeft, Receipt, Download } from "lucide-react";

const transactions = [
  { id: "TXN-2024-001", from: "Abebe Girma", to: "Tigist Alemu", type: "P2P", amount: 500, fee: 2.50, status: "Completed", date: "Feb 18, 2024 10:22", ref: "NBE-REF-001", channel: "Mobile App", aiFlag: null },
  { id: "TXN-2024-002", from: "Ethio Telecom", to: "System", type: "Bill Pay", amount: 100, fee: 1, status: "Completed", date: "Feb 18, 2024 09:15", ref: "NBE-REF-002", channel: "Mobile App", aiFlag: null },
  { id: "TXN-2024-003", from: "Agent - Dawit", to: "Yonas Tesfaye", type: "Cash In", amount: 5000, fee: 0, status: "Completed", date: "Feb 18, 2024 08:40", ref: "NBE-REF-003", channel: "Agent App", aiFlag: null },
  { id: "TXN-2024-004", from: "Fekadu Worku", to: "Unknown-Acct", type: "P2P", amount: 9800, fee: 49, status: "Flagged", date: "Feb 18, 2024 07:55", ref: "NBE-REF-004", channel: "USSD", aiFlag: "Velocity Alert" },
  { id: "TXN-2024-005", from: "Selam Bekele", to: "Merchant-042", type: "Merchant Pay", amount: 2300, fee: 23, status: "Pending", date: "Feb 17, 2024 18:30", ref: "NBE-REF-005", channel: "QR Code", aiFlag: null },
  { id: "TXN-2024-006", from: "Enterprise-GBE", to: "1250 Workers", type: "Bulk Disburse", amount: 1250000, fee: 2500, status: "Completed", date: "Feb 17, 2024 15:00", ref: "NBE-REF-006", channel: "Web Portal", aiFlag: null },
];

const statusColor: Record<string, string> = {
  Completed: "text-green-400 bg-green-500/10 border-green-500/20",
  Pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  Flagged: "text-red-400 bg-red-500/10 border-red-500/20",
  Reversed: "text-muted-foreground bg-muted border-border",
};

const typeIcon: Record<string, any> = {
  "P2P": ArrowUpRight,
  "Cash In": ArrowDownLeft,
  "Bill Pay": Receipt,
  "Merchant Pay": Receipt,
  "Bulk Disburse": ArrowUpRight,
};

const AdminTransactions = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<typeof transactions[0] | null>(null);

  const filtered = transactions.filter(t =>
    (filter === "All" || t.type === filter || t.status === filter) &&
    (t.id.includes(search) || t.from.toLowerCase().includes(search.toLowerCase()) || t.to.toLowerCase().includes(search.toLowerCase()))
  );

  const totalVolume = filtered.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-foreground">Transaction Monitor</h1>
          <p className="text-sm text-muted-foreground">Real-time · ETB {totalVolume.toLocaleString()} shown</p>
        </div>
        <button className="flex items-center gap-2 glass px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Today", value: "ETB 18.6M", color: "text-gold" },
          { label: "Completed", value: "92,210", color: "text-green-400" },
          { label: "Pending", value: "128", color: "text-yellow-400" },
          { label: "AI Flagged", value: "24", color: "text-red-400" },
        ].map(card => (
          <div key={card.label} className="glass rounded-2xl p-3">
            <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
            <p className={`text-lg font-display font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input className="w-full pl-9 pr-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:border-tesfa-gold placeholder:text-muted-foreground" placeholder="Search by ID, name..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {["All", "P2P", "Cash In", "Bill Pay", "Flagged"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${filter === f ? "bg-gradient-gold text-tesfa-dark" : "glass text-muted-foreground"}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Transaction ID", "From → To", "Type", "Amount (ETB)", "Fee", "Status", "Channel", "AI Flag", "Date"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(txn => {
                const Icon = typeIcon[txn.type] || ArrowUpRight;
                return (
                  <tr key={txn.id} className="hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setSelected(txn)}>
                    <td className="px-4 py-3 font-mono text-xs text-gold">{txn.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-foreground font-medium">{txn.from}</p>
                      <p className="text-xs text-muted-foreground">→ {txn.to}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs">{txn.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground">{txn.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{txn.fee}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold border ${statusColor[txn.status]}`}>{txn.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{txn.channel}</td>
                    <td className="px-4 py-3">
                      {txn.aiFlag ? (
                        <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-lg font-semibold">⚠ {txn.aiFlag}</span>
                      ) : (
                        <span className="text-xs text-green-400">✓ Clear</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{txn.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-3 flex justify-between items-center text-xs text-muted-foreground">
          <span>Showing {filtered.length} transactions</span>
          <div className="flex gap-2">
            <button className="glass px-3 py-1 rounded-lg">Previous</button>
            <button className="bg-gradient-gold text-tesfa-dark px-3 py-1 rounded-lg font-bold">1</button>
            <button className="glass px-3 py-1 rounded-lg">Next</button>
          </div>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="glass w-full max-w-md rounded-3xl p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">{selected.type}</h3>
                <p className="text-xs font-mono text-gold">{selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 glass rounded-xl text-muted-foreground">✕</button>
            </div>
            <div className="space-y-2 mb-4">
              {[
                { label: "From", value: selected.from },
                { label: "To", value: selected.to },
                { label: "Amount", value: `ETB ${selected.amount.toLocaleString()}` },
                { label: "Fee", value: `ETB ${selected.fee}` },
                { label: "Status", value: selected.status },
                { label: "Channel", value: selected.channel },
                { label: "NBE Reference", value: selected.ref },
                { label: "Timestamp", value: selected.date },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center text-sm glass rounded-xl px-3 py-2">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-semibold text-foreground text-right">{row.value}</span>
                </div>
              ))}
            </div>
            {selected.aiFlag && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                <p className="text-xs text-red-400 font-bold">⚠ AI Alert: {selected.aiFlag}</p>
                <p className="text-xs text-muted-foreground mt-1">Flagged by Global AI fraud model. Requires manual review.</p>
              </div>
            )}
            <div className="flex gap-3">
              {selected.status === "Flagged" ? (
                <>
                  <button className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold">Block & Reverse</button>
                  <button className="flex-1 py-2.5 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-semibold">Approve</button>
                </>
              ) : (
                <button className="flex-1 py-2.5 rounded-xl glass text-sm font-semibold text-muted-foreground">Download Receipt</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
