import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, ScatterChart, Scatter, ZAxis } from "recharts";

const customer360 = [
  { metric: "Engagement", score: 85 },
  { metric: "Loyalty", score: 72 },
  { metric: "Credit Risk", score: 30 },
  { metric: "Fraud Risk", score: 15 },
  { metric: "Lifetime Value", score: 90 },
  { metric: "Digital Savvy", score: 78 },
];

const onboardingTrend = [
  { week: "W1", customers: 840, agents: 12, merchants: 35 },
  { week: "W2", customers: 1240, agents: 18, merchants: 52 },
  { week: "W3", customers: 980, agents: 9, merchants: 28 },
  { week: "W4", customers: 1580, agents: 24, merchants: 68 },
  { week: "W5", customers: 2100, agents: 31, merchants: 89 },
  { week: "W6", customers: 1920, agents: 22, merchants: 76 },
];

const channelUsage = [
  { channel: "Mobile App", value: 58 },
  { channel: "USSD", value: 22 },
  { channel: "Agent", value: 14 },
  { channel: "Web", value: 4 },
  { channel: "IVR/Voice", value: 2 },
];

const loyaltyData = [
  { tier: "Bronze", count: 38200, points: 120 },
  { tier: "Silver", count: 21800, points: 340 },
  { tier: "Gold", count: 6400, points: 820 },
  { tier: "Platinum", count: 1350, points: 2400 },
];

const profitability = [
  { month: "Sep", fee: 2.4, commission: 1.8, total: 4.2 },
  { month: "Oct", fee: 3.1, commission: 2.2, total: 5.3 },
  { month: "Nov", fee: 3.8, commission: 2.9, total: 6.7 },
  { month: "Dec", fee: 5.2, commission: 3.8, total: 9.0 },
  { month: "Jan", fee: 4.6, commission: 3.2, total: 7.8 },
  { month: "Feb", fee: 6.1, commission: 4.4, total: 10.5 },
];

const AdminAnalytics = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display font-bold text-xl text-foreground">Analytics & AI Insights</h1>
          <p className="text-sm text-muted-foreground">Powered by Tesfa AI · Customer 360 · BI Dashboards</p>
        </div>
        <div className="glass-gold px-3 py-1.5 rounded-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-tesfa-gold animate-pulse" />
          <span className="text-xs text-gold font-bold">AI Engine Online</span>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Monthly Revenue", value: "ETB 10.5M", change: "+24%", color: "text-gold" },
          { label: "Avg Transaction", value: "ETB 2,140", change: "+8%", color: "text-green-400" },
          { label: "AI Fraud Saved", value: "ETB 4.2M", change: "YTD", color: "text-blue-400" },
          { label: "Loyalty Redeemed", value: "ETB 840K", change: "+31%", color: "text-purple-400" },
        ].map(m => (
          <div key={m.label} className="glass rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
            <p className={`text-xl font-display font-bold ${m.color}`}>{m.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{m.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Onboarding Trend */}
        <div className="glass rounded-2xl p-5">
          <p className="font-display font-bold text-sm text-foreground mb-1">Onboarding Performance</p>
          <p className="text-xs text-muted-foreground mb-4">Weekly new user registration by type</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={onboardingTrend}>
              <XAxis dataKey="week" tick={{ fill: "hsl(215 20% 60%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215 20% 60%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(220 28% 13%)", border: "1px solid hsl(220 28% 22%)", borderRadius: "12px", fontSize: 12 }} />
              <Bar dataKey="customers" name="Customers" fill="hsl(42 90% 52%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="agents" name="Agents" fill="hsl(168 70% 40%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="merchants" name="Merchants" fill="hsl(185 72% 45%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue/Profitability */}
        <div className="glass rounded-2xl p-5">
          <p className="font-display font-bold text-sm text-foreground mb-1">Revenue Breakdown</p>
          <p className="text-xs text-muted-foreground mb-4">Fees & Commissions (ETB M)</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={profitability}>
              <XAxis dataKey="month" tick={{ fill: "hsl(215 20% 60%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215 20% 60%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(220 28% 13%)", border: "1px solid hsl(220 28% 22%)", borderRadius: "12px", fontSize: 12 }} />
              <Line type="monotone" dataKey="total" name="Total Revenue" stroke="hsl(42 90% 52%)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="fee" name="Fees" stroke="hsl(168 70% 40%)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              <Line type="monotone" dataKey="commission" name="Commission" stroke="hsl(185 72% 45%)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Customer 360 Radar */}
        <div className="glass rounded-2xl p-5">
          <p className="font-display font-bold text-sm text-foreground mb-1">Customer 360 Profile</p>
          <p className="text-xs text-muted-foreground mb-3">Average user scoring</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={customer360}>
              <PolarGrid stroke="hsl(220 28% 22%)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(215 20% 60%)", fontSize: 10 }} />
              <Radar name="Score" dataKey="score" stroke="hsl(42 90% 52%)" fill="hsl(42 90% 52%)" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Channel Distribution */}
        <div className="glass rounded-2xl p-5">
          <p className="font-display font-bold text-sm text-foreground mb-1">Channel Usage</p>
          <p className="text-xs text-muted-foreground mb-4">Transaction share by channel</p>
          <div className="space-y-2.5">
            {channelUsage.map(ch => (
              <div key={ch.channel}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{ch.channel}</span>
                  <span className="font-bold text-gold">{ch.value}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-gold rounded-full transition-all" style={{ width: `${ch.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loyalty Tiers */}
        <div className="glass rounded-2xl p-5">
          <p className="font-display font-bold text-sm text-foreground mb-1">Loyalty Program</p>
          <p className="text-xs text-muted-foreground mb-4">Users by tier</p>
          <div className="space-y-3">
            {loyaltyData.map((tier, i) => {
              const colors = ["text-orange-400", "text-gray-300", "text-yellow-400", "text-cyan-300"];
              const icons = ["🥉", "🥈", "🥇", "💎"];
              return (
                <div key={tier.tier} className="flex items-center gap-3 glass rounded-xl px-3 py-2">
                  <span className="text-xl">{icons[i]}</span>
                  <div className="flex-1">
                    <p className={`text-xs font-bold ${colors[i]}`}>{tier.tier}</p>
                    <p className="text-[10px] text-muted-foreground">Avg {tier.points} pts</p>
                  </div>
                  <p className="text-sm font-bold text-foreground">{tier.count.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
          <div className="glass-gold rounded-xl p-2.5 mt-3">
            <p className="text-xs text-gold">🤖 AI: 3,240 Bronze users are close to Silver tier. Targeted campaign recommended.</p>
          </div>
        </div>
      </div>

      {/* AI Anomaly Detection */}
      <div className="glass rounded-2xl p-5">
        <p className="font-display font-bold text-sm text-foreground mb-4">🤖 Tesfa AI — Anomaly Detection & Recommendations</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { title: "Fraud Prevention", desc: "12 accounts flagged for unusual velocity (3+ transactions under 60s). Recommend step-up auth.", severity: "High", action: "Review Now" },
            { title: "EMoney Reconciliation", desc: "Feb 17 closing balance differs by ETB 12,400 from trust account. Auto-investigation initiated.", severity: "Medium", action: "Investigate" },
            { title: "Growth Opportunity", desc: "8,400 Level 1 users with consistent 90-day activity are eligible for Level 2 upgrade. Campaign ready.", severity: "Info", action: "Launch Campaign" },
          ].map(alert => {
            const sc = { High: "border-red-500/30 bg-red-500/5", Medium: "border-yellow-500/30 bg-yellow-500/5", Info: "border-blue-500/30 bg-blue-500/5" }[alert.severity];
            const tc = { High: "text-red-400", Medium: "text-yellow-400", Info: "text-blue-400" }[alert.severity];
            return (
              <div key={alert.title} className={`border rounded-2xl p-4 ${sc}`}>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-bold text-foreground">{alert.title}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-current/10 ${tc}`}>{alert.severity}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{alert.desc}</p>
                <button className={`w-full py-2 rounded-xl text-xs font-bold border ${sc} ${tc}`}>{alert.action}</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
