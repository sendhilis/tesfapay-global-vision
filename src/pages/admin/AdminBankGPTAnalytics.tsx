/**
 * AdminBankGPTAnalytics — BankGPT AI Mesh analytics dashboard for bank admin.
 *
 * @route /admin/bankgpt-analytics
 * @module Admin Console · BankGPT
 *
 * @description Agent activation rates, chat volume trends, proactive nudge
 * click-through, conversation outcomes (resolved / handoff / abandoned),
 * latency, and top intents. All data is mocked for the prototype.
 */
import { useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
  Bot, MessageSquare, MousePointerClick, CheckCircle2,
  Clock, ArrowUpRight, ArrowDownRight, Sparkles,
} from "lucide-react";

const AGENTS = [
  { id: "savings_coach",   name: "Savings Coach",      color: "hsl(168 70% 45%)", activation: 78, dau: 4210, sessions: 9840 },
  { id: "credit_score",    name: "Credit Score Agent", color: "hsl(42 90% 52%)",  activation: 65, dau: 3120, sessions: 6420 },
  { id: "wealth_mgmt",     name: "Wealth Manager",     color: "hsl(265 70% 60%)", activation: 41, dau: 1180, sessions: 2210 },
  { id: "fraud_shield",    name: "Fraud Shield",       color: "hsl(0 75% 60%)",   activation: 92, dau: 6800, sessions: 11420 },
  { id: "bill_butler",     name: "Bill Butler",        color: "hsl(195 75% 50%)", activation: 71, dau: 3640, sessions: 7120 },
  { id: "concierge",       name: "Nuru Concierge",     color: "hsl(330 70% 58%)", activation: 88, dau: 7240, sessions: 14820 },
];

const volume14d = [
  { d: "May 13", chats: 4120, voice: 820 },
  { d: "May 14", chats: 4480, voice: 910 },
  { d: "May 15", chats: 3980, voice: 760 },
  { d: "May 16", chats: 5210, voice: 1080 },
  { d: "May 17", chats: 5640, voice: 1140 },
  { d: "May 18", chats: 4980, voice: 980 },
  { d: "May 19", chats: 5320, voice: 1020 },
  { d: "May 20", chats: 6010, voice: 1240 },
  { d: "May 21", chats: 6420, voice: 1320 },
  { d: "May 22", chats: 6180, voice: 1280 },
  { d: "May 23", chats: 6840, voice: 1410 },
  { d: "May 24", chats: 7120, voice: 1520 },
  { d: "May 25", chats: 7480, voice: 1610 },
  { d: "May 26", chats: 7920, voice: 1740 },
];

const nudges = [
  { name: "Move idle cash to savings",  sent: 12400, clicked: 4280, converted: 1820 },
  { name: "Buy 91-day T-Bill",          sent: 8200,  clicked: 2140, converted: 690 },
  { name: "Repay micro-loan early",     sent: 5400,  clicked: 1620, converted: 540 },
  { name: "Set bill reminder",          sent: 9600,  clicked: 3360, converted: 2810 },
  { name: "Credit score check",         sent: 7200,  clicked: 2880, converted: 1240 },
];

const outcomes = [
  { name: "Resolved by AI",    value: 64, color: "hsl(168 70% 45%)" },
  { name: "Action executed",   value: 18, color: "hsl(42 90% 52%)" },
  { name: "Handed to human",   value: 11, color: "hsl(195 75% 50%)" },
  { name: "Abandoned",         value: 7,  color: "hsl(0 70% 55%)" },
];

const topIntents = [
  { intent: "Check balance",         count: 18420 },
  { intent: "Send money",            count: 14210 },
  { intent: "Spend analysis",        count: 11820 },
  { intent: "Savings deposit",       count: 9640 },
  { intent: "Bill payment help",     count: 8210 },
  { intent: "Loan eligibility",      count: 6480 },
  { intent: "T-Bill purchase",       count: 4920 },
];

const Kpi = ({ icon: Icon, label, value, delta, trend = "up", hint }: any) => (
  <div className="glass rounded-2xl p-4">
    <div className="flex items-center justify-between mb-2">
      <div className="w-9 h-9 rounded-xl bg-gradient-gold/20 border border-tesfa-gold/30 flex items-center justify-center">
        <Icon className="w-4 h-4 text-gold" />
      </div>
      {delta && (
        <span className={`flex items-center gap-0.5 text-[11px] font-bold ${trend === "up" ? "text-green-400" : "text-red-400"}`}>
          {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {delta}
        </span>
      )}
    </div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-xl font-display font-bold text-foreground">{value}</p>
    {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
  </div>
);

const RANGES = ["24h", "7d", "14d", "30d"] as const;

const AdminBankGPTAnalytics = () => {
  const [range, setRange] = useState<typeof RANGES[number]>("14d");

  const totals = useMemo(() => {
    const chats = volume14d.reduce((s, r) => s + r.chats, 0);
    const voice = volume14d.reduce((s, r) => s + r.voice, 0);
    const nudgeSent = nudges.reduce((s, n) => s + n.sent, 0);
    const nudgeClicks = nudges.reduce((s, n) => s + n.clicked, 0);
    const ctr = ((nudgeClicks / nudgeSent) * 100).toFixed(1);
    const conv = nudges.reduce((s, n) => s + n.converted, 0);
    const convRate = ((conv / nudgeClicks) * 100).toFixed(1);
    return { chats, voice, ctr, convRate, nudgeClicks };
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-3 justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-gold" />
            <h1 className="font-display font-bold text-xl text-foreground">BankGPT — AI Mesh Analytics</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Agent activation · Chat volume · Proactive nudges · Conversation outcomes
          </p>
        </div>
        <div className="flex gap-1 glass rounded-xl p-1">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                range === r ? "bg-gradient-gold text-tesfa-dark" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={MessageSquare} label="Total chat sessions" value={totals.chats.toLocaleString()} delta="+18%" trend="up" hint={`${range} window`} />
        <Kpi icon={Bot} label="Voice sessions" value={totals.voice.toLocaleString()} delta="+24%" trend="up" hint="ElevenLabs STT/TTS" />
        <Kpi icon={MousePointerClick} label="Nudge click-through" value={`${totals.ctr}%`} delta="+3.2pp" trend="up" hint={`${totals.nudgeClicks.toLocaleString()} clicks`} />
        <Kpi icon={CheckCircle2} label="Auto-resolution rate" value="82%" delta="+5pp" trend="up" hint="AI resolved + executed" />
      </div>

      {/* Volume + Outcomes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <p className="font-display font-bold text-sm text-foreground mb-1">Conversation volume</p>
          <p className="text-xs text-muted-foreground mb-4">Daily chat & voice sessions across all agents</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={volume14d}>
              <defs>
                <linearGradient id="gChats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(42 90% 52%)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="hsl(42 90% 52%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gVoice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(168 70% 45%)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(168 70% 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="d" tick={{ fill: "hsl(215 20% 60%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215 20% 60%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(220 28% 13%)", border: "1px solid hsl(220 28% 22%)", borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="chats" stroke="hsl(42 90% 52%)" strokeWidth={2} fill="url(#gChats)" name="Chat" />
              <Area type="monotone" dataKey="voice" stroke="hsl(168 70% 45%)" strokeWidth={2} fill="url(#gVoice)" name="Voice" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-2xl p-5">
          <p className="font-display font-bold text-sm text-foreground mb-1">Conversation outcomes</p>
          <p className="text-xs text-muted-foreground mb-4">How sessions ended</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={outcomes} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                {outcomes.map(o => <Cell key={o.name} fill={o.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(220 28% 13%)", border: "1px solid hsl(220 28% 22%)", borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {outcomes.map(o => (
              <div key={o.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: o.color }} />
                  <span className="text-muted-foreground">{o.name}</span>
                </div>
                <span className="font-bold text-foreground">{o.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent activation */}
      <div className="glass rounded-2xl p-5">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="font-display font-bold text-sm text-foreground">Agent activation & engagement</p>
            <p className="text-xs text-muted-foreground">% of eligible customers who used each agent in {range}</p>
          </div>
          <p className="text-[11px] text-muted-foreground">DAU · sessions</p>
        </div>
        <div className="space-y-3">
          {AGENTS.map(a => (
            <div key={a.id} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-3 flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: a.color }} />
                <span className="text-xs font-semibold text-foreground truncate">{a.name}</span>
              </div>
              <div className="col-span-6">
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${a.activation}%`, background: a.color }}
                  />
                </div>
              </div>
              <div className="col-span-1 text-right">
                <span className="text-xs font-bold text-foreground">{a.activation}%</span>
              </div>
              <div className="col-span-2 text-right text-[11px] text-muted-foreground">
                {a.dau.toLocaleString()} · {a.sessions.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nudges + Intents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass rounded-2xl p-5">
          <p className="font-display font-bold text-sm text-foreground mb-1">Proactive nudge performance</p>
          <p className="text-xs text-muted-foreground mb-4">Sent vs clicked vs converted</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={nudges} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" tick={{ fill: "hsl(215 20% 60%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "hsl(215 20% 70%)", fontSize: 10 }} width={150} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(220 28% 13%)", border: "1px solid hsl(220 28% 22%)", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="sent"      name="Sent"      fill="hsl(220 28% 30%)" radius={[0, 4, 4, 0]} />
              <Bar dataKey="clicked"   name="Clicked"   fill="hsl(42 90% 52%)"  radius={[0, 4, 4, 0]} />
              <Bar dataKey="converted" name="Converted" fill="hsl(168 70% 45%)" radius={[0, 4, 4, 0]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 glass-gold rounded-xl px-3 py-2">
            <p className="text-[11px] text-gold">
              Avg CTR <span className="font-bold">{totals.ctr}%</span> · Avg conversion <span className="font-bold">{totals.convRate}%</span> of clicks
            </p>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <p className="font-display font-bold text-sm text-foreground mb-1">Top conversation intents</p>
          <p className="text-xs text-muted-foreground mb-4">What customers ask BankGPT</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topIntents} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" tick={{ fill: "hsl(215 20% 60%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="intent" tick={{ fill: "hsl(215 20% 70%)", fontSize: 10 }} width={140} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(220 28% 13%)", border: "1px solid hsl(220 28% 22%)", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="count" fill="hsl(195 75% 50%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Latency / quality strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={Clock} label="Median response latency" value="1.4s" delta="-0.3s" trend="up" hint="p50 first token" />
        <Kpi icon={Clock} label="p95 response latency"    value="3.8s" delta="-0.5s" trend="up" hint="p95 full reply" />
        <Kpi icon={CheckCircle2} label="Action success rate" value="96.4%" delta="+1.1pp" trend="up" hint="Wallet/savings actions" />
        <Kpi icon={Bot} label="CSAT (post-chat)"            value="4.6 / 5" delta="+0.2" trend="up" hint="14,820 ratings" />
      </div>

      {/* AI insights */}
      <div className="glass rounded-2xl p-5">
        <p className="font-display font-bold text-sm text-foreground mb-3">Recommendations</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { title: "Wealth Manager under-activated", desc: "Only 41% of Gold+ tier customers used Wealth Manager. Trigger an in-app spotlight for balances > ETB 50,000.", tone: "border-yellow-500/30 bg-yellow-500/5", tc: "text-yellow-400" },
            { title: "Savings nudge is your best ROI",  desc: "“Move idle cash” drives 34.5% CTR and 42% conversion. Expand to weekly cadence for Bronze tier.",            tone: "border-green-500/30 bg-green-500/5",  tc: "text-green-400" },
            { title: "Voice growing faster than chat",  desc: "Voice sessions up 24% vs 18% for chat. Allocate more ElevenLabs concurrency headroom.",                        tone: "border-blue-500/30 bg-blue-500/5",    tc: "text-blue-400" },
          ].map(i => (
            <div key={i.title} className={`border rounded-2xl p-4 ${i.tone}`}>
              <p className={`text-xs font-bold mb-1 ${i.tc}`}>{i.title}</p>
              <p className="text-xs text-muted-foreground">{i.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminBankGPTAnalytics;
