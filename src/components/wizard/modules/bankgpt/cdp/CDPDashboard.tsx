/**
 * CDP Dashboard — Ethiopian customer data platform for the BankGPT AI Mesh.
 * Mirrors the Tigiverse CDP framework: 5 personas, realtime synthetic event
 * feed, persona-shaped stat cards, search/filter, drill-down detail panel.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from "recharts";
import {
  Users, TrendingUp, AlertTriangle, Search, Bot, Bell, Zap, ArrowUpRight,
  ArrowDownRight, RefreshCw, Clock, Activity, Database, ChevronDown,
  ChevronRight, Wallet, CreditCard, Target, Landmark, Building2,
  Smartphone, Receipt, DollarSign, PiggyBank, Percent, Globe, MapPin,
} from "lucide-react";
import {
  generateCustomersForPersona, generateRandomEvent,
  PERSONA_LABELS, PERSONA_DESCRIPTIONS, cdpStats,
  type AgentPersona, type Customer, type CustomerEvent,
} from "./ethiopiaCustomers";
import { SPEND_CATEGORIES, type SpendProfile } from "./spendCategoriesET";

/* ── helpers ─────────────────────────────────────────────── */

function computeStats(cs: Customer[]) {
  const n = cs.length;
  const sum = (k: (c: Customer) => number) => cs.reduce((s, c) => s + k(c), 0);
  const segCounts: Record<string, number> = {};
  const riskCounts: Record<string, number> = {};
  cs.forEach(c => {
    segCounts[c.segment] = (segCounts[c.segment] || 0) + 1;
    riskCounts[c.riskTier] = (riskCounts[c.riskTier] || 0) + 1;
  });
  return {
    total: n,
    avgCredit: Math.round(sum(c => c.creditScore) / n),
    avgIncome: Math.round(sum(c => c.monthlyIncome) / n),
    avgSpend: Math.round(sum(c => c.monthlySpend) / n),
    avgBalance: Math.round(sum(c => c.balance) / n),
    avgSavings: sum(c => c.savingsRate) / n,
    delinquent: cs.filter(c => c.loanStatus === 'Overdue' || c.missedPayments >= 2).length,
    segmentData: [
      { name: 'Retail',    value: segCounts['Retail']    || 0, fill: 'hsl(45 90% 55%)'  },
      { name: 'Corporate', value: segCounts['Corporate'] || 0, fill: 'hsl(150 60% 45%)' },
      { name: 'Merchant',  value: segCounts['Merchant']  || 0, fill: 'hsl(210 80% 55%)' },
    ].filter(s => s.value > 0),
    riskData: [
      { name: 'Low',    value: riskCounts['Low']    || 0, fill: 'hsl(150 60% 45%)' },
      { name: 'Medium', value: riskCounts['Medium'] || 0, fill: 'hsl(38 92% 50%)'  },
      { name: 'High',   value: riskCounts['High']   || 0, fill: 'hsl(0 84% 60%)'   },
    ].filter(s => s.value > 0),
  };
}

const EVENT_ICONS: Record<CustomerEvent['event_type'], string> = {
  salary_credit: '💰', deposit: '🏦', transfer_in: '➡️', interest_credit: '📈',
  loan_debit: '🔻', bill_payment: '📄', merchant_payment: '🛒',
  withdrawal: '💸', transfer_out: '⬅️', airtime_topup: '📱',
};

function timeAgo(d: Date) {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ── stat card ─────────────────────────────────────────── */

function StatCard({ icon: Icon, label, value, sub, warn }: {
  icon: any; label: string; value: string | number; sub?: string; warn?: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-3 border border-border/40">
      <Icon className={`h-4 w-4 mb-1.5 ${warn ? 'text-destructive' : 'text-tesfa-gold'}`} />
      <p className="font-bold text-base text-foreground leading-tight">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      {sub && <p className="text-[9px] text-muted-foreground/60 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

/* ── detail panel ──────────────────────────────────────── */

const SPEND_COLORS = ['hsl(45 90% 55%)','hsl(210 80% 55%)','hsl(150 60% 45%)','hsl(38 92% 50%)','hsl(0 84% 60%)','hsl(280 60% 55%)','hsl(190 80% 45%)','hsl(330 70% 50%)','hsl(60 80% 45%)','hsl(20 90% 55%)'];

function CustomerDetail({ c, persona }: { c: Customer; persona: AgentPersona }) {
  const fmt = (n: number) => `ETB ${n.toLocaleString()}`;
  const langName = { am: 'Amharic', om: 'Oromo', ti: 'Tigrinya', en: 'English' }[c.primaryLanguage];

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
      <div className="p-4 border-t border-border/30 bg-card/40 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-foreground">{c.fullName}</h3>
            <p className="text-[11px] text-muted-foreground">
              {c.customerId} · {c.city}, {c.region} · {c.segment} · {c.occupation} · Age {c.age} · Lang: {langName} · KYC Tier {c.kycTier}
            </p>
          </div>
          <div className="flex gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
              c.riskTier === 'Low' ? 'bg-success/10 text-success'
              : c.riskTier === 'Medium' ? 'bg-warning/10 text-warning'
              : 'bg-destructive/10 text-destructive'
            }`}>{c.riskTier} Risk</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-muted text-foreground">
              Credit {c.creditScore} ({c.scoreTrend >= 0 ? '+' : ''}{c.scoreTrend})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <Metric icon={DollarSign} label="Monthly Income" value={fmt(c.monthlyIncome)} />
          <Metric icon={CreditCard} label="Monthly Spend" value={fmt(c.monthlySpend)} sub={`${((c.monthlySpend/c.monthlyIncome)*100).toFixed(0)}% of income`} />
          <Metric icon={Wallet} label="Balance" value={fmt(c.balance)} />
          <Metric icon={Percent} label="Savings Rate" value={`${(c.savingsRate*100).toFixed(1)}%`} warn={c.savingsRate < 0.05} />
          <Metric icon={PiggyBank} label="Emergency Fund" value={`${c.emergencyFundMonths.toFixed(1)} mo`} warn={c.emergencyFundMonths < 1} />
          <Metric icon={Activity} label="Deposit Growth" value={`${c.depositGrowthRate>=0?'+':''}${c.depositGrowthRate.toFixed(1)}%`} warn={c.depositGrowthRate < 0} />
        </div>

        {(persona === 'savings_coach' || persona === 'financial_advisor') && (
          <div className="rounded-lg bg-muted/30 border border-border/30 p-3">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-muted-foreground">Goal: <span className="text-foreground font-medium">{c.savingsGoalName}</span></span>
              <span className="text-foreground font-medium">{c.goalProgress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${c.goalProgress<30?'bg-destructive':c.goalProgress<60?'bg-warning':'bg-success'}`} style={{ width: `${c.goalProgress}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>{fmt(c.savingsGoalCurrent)}</span><span>{fmt(c.savingsGoalTarget)}</span>
            </div>
          </div>
        )}

        {persona === 'savings_coach' && c.spendProfile && (
          <SpendBreakdown sp={c.spendProfile} />
        )}

        {persona === 'collections_copilot' && c.loanAmount > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            <Metric icon={Landmark}      label="Loan Product"   value={c.loanProduct} />
            <Metric icon={DollarSign}    label="Loan Amount"    value={fmt(c.loanAmount)} />
            <Metric icon={Clock}         label="Tenure"         value={`${c.loanTenureMonths} mo`} />
            <Metric icon={Percent}       label="Interest"       value={`${c.loanInterestRate}%`} />
            <Metric icon={AlertTriangle} label="Delinquency"    value={`${c.delinquencyDays}d`} warn={c.delinquencyDays > 30} />
            <Metric icon={Receipt}       label="Missed"         value={c.missedPayments} warn={c.missedPayments >= 2} />
          </div>
        )}

        {persona === 'merchant_support' && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            <Metric icon={Receipt}    label="Txn Volume"    value={c.merchantTxnVolume.toLocaleString()} sub="per month" />
            <Metric icon={DollarSign} label="Avg Txn Value" value={fmt(c.merchantAvgTxnValue)} />
            <Metric icon={Smartphone} label="Digital Pay"   value={`${c.digitalPaymentAdoption}%`} warn={c.digitalPaymentAdoption < 35} />
            <Metric icon={Activity}   label="Deposit Growth" value={`${c.depositGrowthRate>=0?'+':''}${c.depositGrowthRate.toFixed(1)}%`} warn={c.depositGrowthRate < 0} />
            <Metric icon={Globe}      label="FX Cost"       value={`${c.fxTransactionCostPercent.toFixed(1)}%`} />
            <Metric icon={Wallet}     label="Balance"       value={fmt(c.balance)} />
          </div>
        )}

        {persona === 'corporate_liaison' && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            <Metric icon={Building2}  label="Segment"  value={c.segment} />
            <Metric icon={Clock}      label="DSO"      value={`${c.receivablesDaysOutstanding}d`} warn={c.receivablesDaysOutstanding > 45} />
            <Metric icon={Globe}      label="FX Cost"  value={`${c.fxTransactionCostPercent.toFixed(1)}%`} warn={c.fxTransactionCostPercent > 2} />
            <Metric icon={Receipt}    label="Payroll"  value={c.payrollAutomated ? 'Automated' : 'Manual'} warn={!c.payrollAutomated} />
            <Metric icon={Activity}   label="Growth"   value={`${c.depositGrowthRate>=0?'+':''}${c.depositGrowthRate.toFixed(1)}%`} />
            <Metric icon={Smartphone} label="Digital"  value={`${c.digitalPaymentAdoption}%`} />
          </div>
        )}

        {persona === 'financial_advisor' && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            <Metric icon={TrendingUp} label="Investment Ratio" value={`${(c.investmentToIncomeRatio*100).toFixed(1)}%`} warn={c.investmentToIncomeRatio < 0.05} />
            <Metric icon={Wallet}     label="Idle Cash"        value={`${c.idleCashPercent.toFixed(0)}%`} warn={c.idleCashPercent > 30} />
            <Metric icon={Smartphone} label="Digital"          value={`${c.digitalPaymentAdoption}%`} />
            <Metric icon={Activity}   label="Deposit Growth"   value={`${c.depositGrowthRate>=0?'+':''}${c.depositGrowthRate.toFixed(1)}%`} />
            <Metric icon={Target}     label="Goal Progress"    value={`${c.goalProgress}%`} />
            <Metric icon={Wallet}     label="Balance"          value={fmt(c.balance)} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Metric({ icon: Icon, label, value, sub, warn }: { icon: any; label: string; value: any; sub?: string; warn?: boolean }) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/40">
      <Icon className={`h-3.5 w-3.5 mt-0.5 ${warn ? 'text-destructive' : 'text-tesfa-gold'}`} />
      <div className="min-w-0">
        <p className="text-[9px] text-muted-foreground uppercase">{label}</p>
        <p className={`text-xs font-semibold ${warn ? 'text-destructive' : 'text-foreground'} truncate`}>{value}</p>
        {sub && <p className="text-[9px] text-muted-foreground/70">{sub}</p>}
      </div>
    </div>
  );
}

function SpendBreakdown({ sp }: { sp: SpendProfile }) {
  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/30 border border-border/30 p-3">
          <p className="text-[11px] font-medium text-muted-foreground mb-2">Spend by Category (ETB)</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={sp.categories} layout="vertical" margin={{ left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 8 }} width={85} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {sp.categories.map((_, i) => <Cell key={i} fill={SPEND_COLORS[i % SPEND_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-lg bg-muted/30 border border-border/30 p-3">
          <p className="text-[11px] font-medium text-muted-foreground mb-2">Weekly Spend Trend</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={sp.weeklySpendTrend.map((v, i) => ({ week: `W${i+1}`, spend: v }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="spend" stroke="hsl(45 90% 55%)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      {sp.alerts.length > 0 && (
        <div className="rounded-lg bg-muted/30 border border-border/30 p-3">
          <p className="text-[11px] font-medium text-muted-foreground mb-2">Active Alerts ({sp.alerts.length})</p>
          <div className="space-y-1.5">
            {sp.alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded bg-card/50">
                <div className={`h-2 w-2 mt-1 rounded-full ${a.severity==='critical'?'bg-destructive':a.severity==='warning'?'bg-warning':'bg-primary'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-foreground">{a.message}</p>
                  {a.impactOnSavings > 0 && <p className="text-[10px] text-destructive">Impact: ETB {a.impactOnSavings.toLocaleString()}/mo</p>}
                </div>
                <span className="text-[9px] uppercase text-muted-foreground">{a.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── main component ────────────────────────────────────── */

export function CDPDashboard() {
  const [persona, setPersona] = useState<AgentPersona>('savings_coach');
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [events, setEvents] = useState<CustomerEvent[]>([]);
  const [eventsToday, setEventsToday] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isIngesting, setIsIngesting] = useState(false);

  const customers = useMemo(() => generateCustomersForPersona(persona), [persona]);
  const stats = useMemo(() => computeStats(customers), [customers]);

  // Realtime simulator — 1 event every 4-9s
  const customersRef = useRef(customers);
  useEffect(() => { customersRef.current = customers; }, [customers]);
  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const evt = generateRandomEvent(customersRef.current);
      setEvents(prev => [evt, ...prev].slice(0, 20));
      setEventsToday(n => n + 1);
      setTimeout(tick, 4000 + Math.random() * 5000);
    };
    // seed with 6 events
    const seed = Array.from({ length: 6 }, () => generateRandomEvent(customersRef.current));
    setEvents(seed);
    setEventsToday(seed.length);
    const t = setTimeout(tick, 3000);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  const runIngestion = () => {
    setIsIngesting(true);
    setTimeout(() => {
      const batch = Array.from({ length: 12 }, () => generateRandomEvent(customersRef.current));
      setEvents(prev => [...batch, ...prev].slice(0, 20));
      setEventsToday(n => n + batch.length);
      setLastRefresh(new Date());
      setIsIngesting(false);
    }, 900);
  };

  const filtered = customers.filter(c => {
    if (search && !c.fullName.toLowerCase().includes(search.toLowerCase()) && !c.customerId.toLowerCase().includes(search.toLowerCase())) return false;
    if (regionFilter !== 'all' && c.region !== regionFilter) return false;
    if (segmentFilter !== 'all' && c.segment !== segmentFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Database className="h-5 w-5 text-tesfa-gold" />
            Customer Data Platform — Ethiopia
          </h2>
          <p className="text-[11px] text-muted-foreground">
            {cdpStats.totalCustomers} synthetic customers · {cdpStats.regions.length} regions · ETB · Amharic / Oromo / Tigrinya — the intelligence layer feeding every BankGPT agent.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/40 border border-border text-[10px]">
            <Clock className="h-3 w-3 text-tesfa-gold" />
            Last refresh: <span className="font-medium text-foreground">{timeAgo(lastRefresh)}</span>
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/40 border border-border text-[10px]">
            <Activity className="h-3 w-3 text-success" />
            <span className="font-medium text-foreground">{eventsToday}</span> events today
          </span>
          <button onClick={runIngestion} disabled={isIngesting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-gold text-tesfa-dark text-[11px] font-bold disabled:opacity-50">
            <RefreshCw className={`h-3 w-3 ${isIngesting ? 'animate-spin' : ''}`} />
            {isIngesting ? 'Ingesting…' : 'Run Ingestion'}
          </button>
        </div>
      </div>

      {/* Persona selector */}
      <div className="glass rounded-xl p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Bot className="h-4 w-4 text-tesfa-gold" />
          <span className="text-[11px] font-medium text-muted-foreground mr-1">Agent Persona view:</span>
          {(Object.keys(PERSONA_LABELS) as AgentPersona[]).map(p => (
            <button key={p} onClick={() => { setPersona(p); setExpandedId(null); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition ${
                persona === p ? 'bg-gradient-gold text-tesfa-dark' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}>
              {PERSONA_LABELS[p]}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 ml-6">{PERSONA_DESCRIPTIONS[persona]}</p>
      </div>

      {/* Realtime event feed */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-tesfa-gold" />
            Realtime Event Feed
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          </h3>
          <span className="text-[10px] text-muted-foreground">Streaming from CDP · last 20</span>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-2 pb-1">
            {events.map(evt => {
              const positive = evt.amount > 0;
              return (
                <motion.div key={evt.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  className="min-w-[200px] flex-shrink-0 border border-border rounded-lg p-2.5 bg-card">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-muted-foreground">{evt.customer_id}</span>
                    <span className="text-[9px] text-muted-foreground/70">{timeAgo(new Date(evt.event_date))}</span>
                  </div>
                  <p className="text-[11px] font-medium text-foreground truncate">{EVENT_ICONS[evt.event_type]} {evt.description}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{evt.customer_name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs font-bold ${positive ? 'text-success' : 'text-destructive'}`}>
                      {positive ? '+' : ''}{evt.amount.toLocaleString()} ETB
                    </span>
                    {evt.balance_after !== null && (
                      <span className="text-[9px] text-muted-foreground">Bal {evt.balance_after.toLocaleString()}</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        <StatCard icon={Users}       label="Customers"     value={stats.total} sub={`${cdpStats.regions.length} regions`} />
        <StatCard icon={TrendingUp}  label="Avg Credit"    value={stats.avgCredit} sub={PERSONA_LABELS[persona]} />
        <StatCard icon={DollarSign}  label="Avg Income"    value={`${Math.round(stats.avgIncome/1000)}K`} sub="ETB/month" />
        <StatCard icon={CreditCard}  label="Avg Spend"     value={`${Math.round(stats.avgSpend/1000)}K`} sub="ETB/month" />
        <StatCard icon={PiggyBank}   label="Avg Savings"   value={`${(stats.avgSavings*100).toFixed(1)}%`} />
        <StatCard icon={AlertTriangle} label="Delinquent"  value={stats.delinquent} warn={stats.delinquent > 0} sub="missed≥2 / overdue" />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="glass rounded-xl p-3">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">Segment Mix</p>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={stats.segmentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={{ fontSize: 10 }}>
                {stats.segmentData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="glass rounded-xl p-3">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">Risk Distribution</p>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={stats.riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={{ fontSize: 10 }}>
                {stats.riskData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or ID…"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-muted/40 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-tesfa-gold" />
        </div>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
          className="px-2 py-1.5 rounded-lg bg-muted/40 border border-border text-xs">
          <option value="all">All regions</option>
          {cdpStats.regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={segmentFilter} onChange={e => setSegmentFilter(e.target.value)}
          className="px-2 py-1.5 rounded-lg bg-muted/40 border border-border text-xs">
          <option value="all">All segments</option>
          <option value="Retail">Retail</option>
          <option value="Corporate">Corporate</option>
          <option value="Merchant">Merchant</option>
        </select>
        <span className="text-[10px] text-muted-foreground ml-auto">{filtered.length} of {customers.length}</span>
      </div>

      {/* Customer table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 border-b border-border">
              <tr className="text-[10px] uppercase text-muted-foreground">
                <th className="text-left py-2 px-3 font-medium w-6"></th>
                <th className="text-left py-2 px-3 font-medium">Customer</th>
                <th className="text-left py-2 px-3 font-medium">Region</th>
                <th className="text-left py-2 px-3 font-medium">Segment</th>
                <th className="text-right py-2 px-3 font-medium">Income</th>
                <th className="text-right py-2 px-3 font-medium">Balance</th>
                <th className="text-right py-2 px-3 font-medium">Credit</th>
                <th className="text-right py-2 px-3 font-medium">Save %</th>
                <th className="text-left py-2 px-3 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const open = expandedId === c.customerId;
                return (
                  <React.Fragment key={c.customerId}>
                    <tr onClick={() => setExpandedId(open ? null : c.customerId)}
                      className="border-b border-border/40 hover:bg-muted/30 cursor-pointer transition">
                      <td className="py-2 px-3">{open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}</td>
                      <td className="py-2 px-3">
                        <div className="font-medium text-foreground">{c.fullName}</div>
                        <div className="text-[10px] text-muted-foreground">{c.customerId} · {c.occupation}</div>
                      </td>
                      <td className="py-2 px-3 text-foreground">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{c.city}</span>
                      </td>
                      <td className="py-2 px-3 text-foreground">{c.segment}</td>
                      <td className="py-2 px-3 text-right text-foreground">ETB {c.monthlyIncome.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-foreground">ETB {c.balance.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-foreground">{c.creditScore}</td>
                      <td className={`py-2 px-3 text-right font-medium ${c.savingsRate<0.05?'text-destructive':c.savingsRate<0.1?'text-warning':'text-success'}`}>
                        {(c.savingsRate*100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          c.riskTier==='Low'?'bg-success/10 text-success'
                          :c.riskTier==='Medium'?'bg-warning/10 text-warning'
                          :'bg-destructive/10 text-destructive'
                        }`}>{c.riskTier}</span>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {open && (
                        <tr><td colSpan={9} className="p-0"><CustomerDetail c={c} persona={persona} /></td></tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Synthetic CDP framework · production target: Spring Boot CDP service · 50 customers seeded for agent persona selection
      </p>
    </div>
  );
}

export default CDPDashboard;
