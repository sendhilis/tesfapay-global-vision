/**
 * AdminEMoney — E-money trust account management dashboard.
 *
 * @route /admin/emoney
 * @module Admin Console
 *
 * @description Regulatory compliance view: total e-money issued vs trust account
 * balance, reconciliation status, float distribution breakdown (user wallets,
 * agent float, merchant holdings, system reserve). Includes charts for
 * e-money growth trend and distribution.
 *
 * @api_endpoints
 * - GET /v1/admin/emoney  → { totalEMoneyIssued, trustAccountBalance,
 *                             reconciliationStatus, floatDistribution[] }
 *
 * @tables emoney_trust_account, emoney_distribution
 *
 * @mock_data All e-money data hardcoded. Replace with useQuery.
 */
import { useState } from "react";
import { ArrowUpRight, Users, Banknote, AlertTriangle, CheckCircle, TrendingUp, Download, Filter } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const emoneyData = [
  { day: "Mon", issued: 142, withdrawn: 98 },
  { day: "Tue", issued: 165, withdrawn: 112 },
  { day: "Wed", issued: 138, withdrawn: 95 },
  { day: "Thu", issued: 190, withdrawn: 128 },
  { day: "Fri", issued: 220, withdrawn: 150 },
  { day: "Sat", issued: 175, withdrawn: 132 },
  { day: "Sun", issued: 140, withdrawn: 89 },
];

const trustMovements = [
  { id: "TM-001", type: "EMoney Creation", amount: "ETB 50,000,000", by: "Finance User — Kebede A.", status: "approved", time: "Today 09:12" },
  { id: "TM-002", type: "EMoney Addition", amount: "ETB 12,000,000", by: "Finance User — Mekdes T.", status: "pending", time: "Today 10:45" },
  { id: "TM-003", type: "EMoney Withdrawal", amount: "ETB 8,500,000", by: "Finance Supervisor — Haile G.", status: "approved", time: "Yesterday" },
  { id: "TM-004", type: "Trust Settlement", amount: "ETB 2,390,000,000", by: "System (Auto)", status: "completed", time: "Yesterday" },
];

const AdminEMoney = () => {
  const [tab, setTab] = useState<"overview" | "movements" | "reconciliation">("overview");

  const statusColor: Record<string, string> = {
    approved: "text-green-400 bg-green-500/10",
    pending: "text-gold bg-tesfa-gold/10",
    completed: "text-blue-400 bg-blue-500/10",
    rejected: "text-red-400 bg-red-500/10",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-foreground">EMoney Management</h2>
          <p className="text-xs text-muted-foreground">Trust account & EMoney lifecycle management</p>
        </div>
        <button className="flex items-center gap-2 bg-gradient-gold text-tesfa-dark px-4 py-2 rounded-xl text-xs font-bold">
          <ArrowUpRight className="w-3 h-3" /> New Request
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total EMoney Issued", value: "ETB 2.41B", sub: "↑ 3.2% this week", icon: Banknote, color: "bg-tesfa-gold/15 text-gold" },
          { label: "Trust Account Balance", value: "ETB 2.39B", sub: "99.1% backed", icon: CheckCircle, color: "bg-green-500/15 text-green-400" },
          { label: "Pending Approvals", value: "3", sub: "2 creation, 1 withdrawal", icon: AlertTriangle, color: "bg-orange-500/15 text-orange-400" },
          { label: "Settlement Status", value: "Matched", sub: "Last: 1 hr ago", icon: TrendingUp, color: "bg-blue-500/15 text-blue-400" },
        ].map(card => (
          <div key={card.label} className="glass rounded-2xl p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon className="w-4 h-4" />
            </div>
            <p className="font-display font-bold text-lg text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="text-xs text-green-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["overview", "movements", "reconciliation"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${tab === t ? "bg-gradient-gold text-tesfa-dark" : "glass text-muted-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <p className="font-display font-bold text-sm text-foreground mb-4">Daily Cash In vs Cash Out (ETB M)</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={emoneyData}>
                <defs>
                  <linearGradient id="issuedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(42 90% 52%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(42 90% 52%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="withdrawnGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(168 70% 40%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(168 70% 40%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: "hsl(215 20% 60%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(215 20% 60%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(220 28% 13%)", border: "1px solid hsl(220 28% 22%)", borderRadius: "12px", fontSize: 12 }} />
                <Area type="monotone" dataKey="issued" stroke="hsl(42 90% 52%)" fill="url(#issuedGrad)" strokeWidth={2} name="Cash In" />
                <Area type="monotone" dataKey="withdrawn" stroke="hsl(168 70% 40%)" fill="url(#withdrawnGrad)" strokeWidth={2} name="Cash Out" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-gold rounded-2xl p-4">
            <p className="text-sm font-bold text-foreground mb-3">Trust Account Position</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Opening Balance", value: "ETB 2.38B" },
                { label: "Total Issued Today", value: "+ ETB 142M" },
                { label: "Total Withdrawn Today", value: "- ETB 98M" },
                { label: "Closing Balance", value: "ETB 2.42B" },
              ].map(item => (
                <div key={item.label} className="glass rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-bold text-gold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "movements" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">EMoney Movement Log</p>
            <button className="flex items-center gap-1 glass px-3 py-1.5 rounded-xl text-xs text-muted-foreground">
              <Filter className="w-3 h-3" /> Filter
            </button>
          </div>
          {trustMovements.map(item => (
            <div key={item.id} className="glass rounded-2xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-bold text-foreground">{item.type}</p>
                  <p className="text-xs text-muted-foreground">{item.by}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${statusColor[item.status]}`}>
                  {item.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-lg font-display font-bold text-gold">{item.amount}</p>
                <div className="flex gap-2">
                  <p className="text-[10px] text-muted-foreground">{item.time}</p>
                  {item.status === "pending" && (
                    <>
                      <button className="text-[10px] text-green-400 font-bold glass px-2 py-1 rounded-lg">Approve</button>
                      <button className="text-[10px] text-red-400 font-bold glass px-2 py-1 rounded-lg">Reject</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "reconciliation" && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-bold text-foreground">Daily Reconciliation Report</p>
              <button className="flex items-center gap-1 glass px-3 py-1.5 rounded-xl text-xs text-gold">
                <Download className="w-3 h-3" /> Export
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: "System EMoney Balance", value: "ETB 2,410,382,440", status: "match" },
                { label: "Trust Account Balance", value: "ETB 2,410,382,440", status: "match" },
                { label: "Variance", value: "ETB 0.00", status: "match" },
                { label: "Last Reconciliation", value: "Today 06:00 AM", status: "info" },
                { label: "Next Scheduled", value: "Today 06:00 PM", status: "info" },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{row.value}</span>
                    {row.status === "match" && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-gold rounded-2xl p-4">
            <p className="text-xs text-gold font-bold mb-1">🤖 Global AI Anomaly Detection</p>
            <p className="text-xs text-muted-foreground">No reconciliation anomalies detected in the last 24 hours. EMoney positions are fully balanced. ✅</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEMoney;
