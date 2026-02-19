import { TrendingUp, ArrowDownLeft, ArrowUpRight, Download } from "lucide-react";

const monthlyData = [
  { month: "Sep", commission: 3200 },
  { month: "Oct", commission: 4100 },
  { month: "Nov", commission: 3800 },
  { month: "Dec", commission: 5200 },
  { month: "Jan", commission: 4800 },
  { month: "Feb*", commission: 6200 },
];

const transactions = [
  { type: "cashin", customer: "Tigist Alemu", amount: 2000, commission: 6, ref: "CI-928371", time: "09:14 AM, Today" },
  { type: "cashout", customer: "Yonas Bekele", amount: 5000, commission: 20, ref: "CO-928340", time: "08:55 AM, Today" },
  { type: "cashin", customer: "Meron Tadesse", amount: 1500, commission: 4.5, ref: "CI-928299", time: "08:30 AM, Today" },
  { type: "cashout", customer: "Abel Girma", amount: 3000, commission: 12, ref: "CO-928101", time: "Yesterday" },
  { type: "cashin", customer: "Hana Solomon", amount: 4000, commission: 12, ref: "CI-927990", time: "Yesterday" },
  { type: "cashout", customer: "Kedir Mohammed", amount: 8000, commission: 32, ref: "CO-927750", time: "Feb 17" },
];

const AgentCommission = () => {
  const maxCommission = Math.max(...monthlyData.map(m => m.commission));
  const totalToday = transactions
    .filter(t => t.time.includes("Today"))
    .reduce((sum, t) => sum + t.commission, 0);

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg text-foreground">Commission & Earnings</h2>
          <p className="text-xs text-muted-foreground">Track your agent income</p>
        </div>
        <button className="glass rounded-xl p-2">
          <Download className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Today", value: `ETB ${totalToday.toFixed(2)}`, sub: `${transactions.filter(t => t.time.includes("Today")).length} transactions`, color: "text-green-400" },
          { label: "This Month", value: "ETB 6,200", sub: "Feb 2026 (MTD)", color: "text-primary" },
          { label: "Last Month", value: "ETB 4,800", sub: "January 2026", color: "text-foreground" },
          { label: "Lifetime Total", value: "ETB 27.3K", sub: "Since Jun 2024", color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-base font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground/70">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Commission rate info */}
      <div className="glass rounded-2xl p-3 flex gap-3">
        <div className="flex-1 glass rounded-xl p-2 text-center">
          <ArrowDownLeft className="w-4 h-4 text-green-400 mx-auto mb-0.5" />
          <p className="text-xs font-bold text-foreground">Cash In</p>
          <p className="text-[10px] text-muted-foreground">0.3% per txn</p>
          <p className="text-[10px] text-green-400">min ETB 2</p>
        </div>
        <div className="flex-1 glass rounded-xl p-2 text-center">
          <ArrowUpRight className="w-4 h-4 text-primary mx-auto mb-0.5" />
          <p className="text-xs font-bold text-foreground">Cash Out</p>
          <p className="text-[10px] text-muted-foreground">0.4% per txn</p>
          <p className="text-[10px] text-primary">min ETB 3</p>
        </div>
        <div className="flex-1 glass rounded-xl p-2 text-center">
          <TrendingUp className="w-4 h-4 text-primary mx-auto mb-0.5" />
          <p className="text-xs font-bold text-foreground">Settlement</p>
          <p className="text-[10px] text-muted-foreground">Daily at</p>
          <p className="text-[10px] text-primary">11:59 PM</p>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="glass rounded-2xl p-4">
        <p className="text-sm font-bold text-foreground mb-3">Monthly Commission (ETB)</p>
        <div className="flex items-end gap-2 h-24">
          {monthlyData.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <p className="text-[9px] text-primary font-semibold">{m.commission >= 1000 ? `${(m.commission/1000).toFixed(1)}K` : m.commission}</p>
              <div
                className={`w-full rounded-t-sm transition-all ${m.month === "Feb*" ? "bg-primary" : "bg-muted"}`}
                style={{ height: `${(m.commission / maxCommission) * 80}px` }}
              />
              <p className="text-[8px] text-muted-foreground">{m.month}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 text-center">* Feb 2026 month-to-date</p>
      </div>

      {/* Transaction Ledger */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide">Transaction Ledger</p>
        <div className="space-y-2">
          {transactions.map(txn => (
            <div key={txn.ref} className="glass rounded-2xl p-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${txn.type === "cashin" ? "bg-green-500/20" : "bg-primary/20"}`}>
                {txn.type === "cashin"
                  ? <ArrowDownLeft className="w-3.5 h-3.5 text-green-400" />
                  : <ArrowUpRight className="w-3.5 h-3.5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{txn.customer}</p>
                <p className="text-[10px] text-muted-foreground">{txn.ref} · {txn.time}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-foreground">ETB {txn.amount.toLocaleString()}</p>
                <p className="text-[10px] text-green-400">+{txn.commission}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-4" />
    </div>
  );
};

export default AgentCommission;
