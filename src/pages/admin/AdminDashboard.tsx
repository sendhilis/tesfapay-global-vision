import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Users, ArrowLeftRight, Shield, Zap } from "lucide-react";

const txnData = [
  { month: "Sep", volume: 42, value: 8.2 },
  { month: "Oct", volume: 58, value: 11.4 },
  { month: "Nov", volume: 65, value: 13.1 },
  { month: "Dec", volume: 80, value: 15.8 },
  { month: "Jan", volume: 74, value: 14.2 },
  { month: "Feb", volume: 92, value: 18.6 },
];

const kycPie = [
  { name: "Level 1", value: 45230, color: "hsl(42 90% 52%)" },
  { name: "Level 2", value: 18420, color: "hsl(168 70% 40%)" },
  { name: "Pending", value: 3210, color: "hsl(185 72% 45%)" },
  { name: "Rejected", value: 890, color: "hsl(0 72% 51%)" },
];

const agentPerf = [
  { name: "Addis Central", txns: 4200, volume: 840 },
  { name: "Bole Agent", txns: 3800, volume: 720 },
  { name: "Merkato Hub", txns: 3100, volume: 620 },
  { name: "Piassa Zone", txns: 2900, volume: 580 },
  { name: "CMC Branch", txns: 2400, volume: 480 },
];

const alerts = [
  { type: "fraud", msg: "Suspicious velocity detected — Account TPY-09423", time: "2 min ago", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  { type: "kyc", msg: "156 KYC documents awaiting review", time: "15 min ago", color: "text-gold bg-tesfa-gold/10 border-tesfa-gold/20" },
  { type: "system", msg: "EMoney reconciliation completed — ETB 2.4B matched", time: "1 hr ago", color: "text-green-400 bg-green-500/10 border-green-500/20" },
  { type: "ai", msg: "Global AI flagged 12 high-risk accounts for review", time: "2 hr ago", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
];

const StatCard = ({ title, value, sub, icon: Icon, trend, color }: any) => (
  <div className="glass rounded-2xl p-4 hover-lift">
    <div className="flex justify-between items-start mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>
        {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(trend)}%
      </div>
    </div>
    <p className="text-2xl font-display font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
    {sub && <p className="text-xs text-gold mt-1">{sub}</p>}
  </div>
);

const AdminDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value="67,750" sub="+1,240 this week" icon={Users} trend={8.4} color="bg-blue-500/15 text-blue-400" />
        <StatCard title="Today's Transactions" value="ETB 18.6M" sub="92,340 transactions" icon={ArrowLeftRight} trend={12.1} color="bg-tesfa-gold/15 text-gold" />
        <StatCard title="Active Agents" value="3,842" sub="Across 11 regions" icon={Zap} trend={3.2} color="bg-green-500/15 text-green-400" />
        <StatCard title="Fraud Alerts" value="24" sub="7 critical · 17 medium" icon={Shield} trend={-18.5} color="bg-red-500/15 text-red-400" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Transaction volume chart */}
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="font-display font-bold text-sm text-foreground">Transaction Volume & Value</p>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-tesfa-gold inline-block" />Volume (K)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Value (ETB M)</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={txnData}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(42 90% 52%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(42 90% 52%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(158 46% 48%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(158 46% 48%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: "hsl(215 20% 60%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215 20% 60%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(220 28% 13%)", border: "1px solid hsl(220 28% 22%)", borderRadius: "12px", fontSize: 12 }}
                labelStyle={{ color: "hsl(210 40% 96%)" }}
              />
              <Area type="monotone" dataKey="volume" stroke="hsl(42 90% 52%)" fill="url(#volGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="value" stroke="hsl(158 46% 48%)" fill="url(#valGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* KYC distribution */}
        <div className="glass rounded-2xl p-5">
          <p className="font-display font-bold text-sm text-foreground mb-1">KYC Distribution</p>
          <p className="text-xs text-muted-foreground mb-4">Total: 67,750 users</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={kycPie} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {kycPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(220 28% 13%)", border: "1px solid hsl(220 28% 22%)", borderRadius: "12px", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {kycPie.map((item) => (
              <div key={item.name} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-semibold text-foreground">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Agent Performance */}
        <div className="glass rounded-2xl p-5">
          <p className="font-display font-bold text-sm text-foreground mb-4">Top Performing Agents</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={agentPerf} layout="vertical">
              <XAxis type="number" tick={{ fill: "hsl(215 20% 60%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: "hsl(215 20% 60%)", fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ background: "hsl(220 28% 13%)", border: "1px solid hsl(220 28% 22%)", borderRadius: "12px", fontSize: 12 }} />
              <Bar dataKey="txns" fill="hsl(42 90% 52%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* System Alerts */}
        <div className="glass rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <p className="font-display font-bold text-sm text-foreground">System Alerts</p>
            <button className="text-xs text-gold">View all</button>
          </div>
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div key={i} className={`border rounded-xl p-3 ${alert.color}`}>
                <p className="text-xs font-semibold">{alert.msg}</p>
                <p className="text-[10px] opacity-70 mt-0.5">{alert.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EMoney Summary */}
      <div className="glass-gold rounded-2xl p-5">
        <p className="font-display font-bold text-sm text-foreground mb-4">EMoney Summary (Live)</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total EMoney Issued", value: "ETB 2.41B", sub: "↑ 3.2% vs last week" },
            { label: "Trust Account Balance", value: "ETB 2.39B", sub: "99.1% backed" },
            { label: "Today's Cash In", value: "ETB 142M", sub: "28,400 transactions" },
            { label: "Today's Cash Out", value: "ETB 98M", sub: "19,600 transactions" },
          ].map((item) => (
            <div key={item.label} className="glass rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
              <p className="text-lg font-display font-bold text-gold">{item.value}</p>
              <p className="text-[10px] text-green-400 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
