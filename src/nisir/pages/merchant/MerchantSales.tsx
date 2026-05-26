import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import MobilePortalLayout from '@/components/MobilePortalLayout';
import { motion } from 'framer-motion';
import {
  Home, QrCode, BarChart3, FileText, MessageSquareWarning,
  TrendingUp, TrendingDown, CircleDollarSign, Users, ShoppingBag, Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/merchant' },
  { icon: <QrCode className="h-5 w-5" />, labelKey: 'merchant.qrCodes', path: '/merchant/qr' },
  { icon: <BarChart3 className="h-5 w-5" />, labelKey: 'merchant.sales', path: '/merchant/sales' },
  { icon: <FileText className="h-5 w-5" />, labelKey: 'merchant.settlements', path: '/merchant/settlements' },
  { icon: <MessageSquareWarning className="h-5 w-5" />, labelKey: 'merchant.disputes', path: '/merchant/disputes' },
];

const weeklyData = [
  { day: 'Mon', amount: 4200 },
  { day: 'Tue', amount: 6800 },
  { day: 'Wed', amount: 5100 },
  { day: 'Thu', amount: 7500 },
  { day: 'Fri', amount: 9200 },
  { day: 'Sat', amount: 11400 },
  { day: 'Sun', amount: 3600 },
];

const paymentMethods = [
  { name: 'QR Code', value: 62, color: 'hsl(25, 80%, 50%)' },
  { name: 'Wallet', value: 24, color: 'hsl(152, 55%, 35%)' },
  { name: 'Bank', value: 14, color: 'hsl(200, 65%, 45%)' },
];

const topProducts = [
  { name: 'Ethiopian Coffee', qty: 142, revenue: 21300 },
  { name: 'Spice Bundle', qty: 87, revenue: 17400 },
  { name: 'Injera Basket', qty: 64, revenue: 9600 },
  { name: 'Honey Jar', qty: 38, revenue: 7600 },
  { name: 'Teff Flour (5kg)', qty: 29, revenue: 5800 },
];

const fmt = (n: number) => n.toLocaleString('en-US');

const MerchantSales = () => {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');

  const multiplier = period === 'today' ? 0.15 : period === 'week' ? 1 : 4.3;
  const totalSales = Math.round(47800 * multiplier);
  const totalTxns = Math.round(234 * multiplier);
  const avgTicket = Math.round(totalSales / totalTxns);
  const uniqueCustomers = Math.round(totalTxns * 0.72);

  return (
    <MobilePortalLayout portalName="Nisir Merchant" portalColor="merchant" navItems={navItems} showBack backPath="/merchant">
      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Sales Dashboard</h2>
        </div>

        {/* Period selector */}
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {(['today', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors capitalize ${
                period === p ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Sales', value: `${fmt(totalSales)} ETB`, icon: CircleDollarSign, trend: '+12%', up: true },
            { label: 'Transactions', value: fmt(totalTxns), icon: ShoppingBag, trend: '+8%', up: true },
            { label: 'Avg. Ticket', value: `${fmt(avgTicket)} ETB`, icon: TrendingUp, trend: '+3%', up: true },
            { label: 'Customers', value: fmt(uniqueCustomers), icon: Users, trend: '-2%', up: false },
          ].map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl border border-border p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <Icon className="h-4 w-4 text-portal-merchant" />
                  <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${kpi.up ? 'text-success' : 'text-destructive'}`}>
                    {kpi.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {kpi.trend}
                  </span>
                </div>
                <p className="text-lg font-extrabold text-foreground">{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Weekly Sales Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Weekly Sales</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v: number) => [`${fmt(v)} ETB`, 'Sales']} />
              <Bar dataKey="amount" fill="hsl(25, 80%, 50%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Payment Methods Pie */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Payment Methods</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={100} height={100}>
              <PieChart>
                <Pie data={paymentMethods} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={45} paddingAngle={3}>
                  {paymentMethods.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5">
              {paymentMethods.map((m) => (
                <div key={m.name} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="text-xs text-foreground">{m.name}</span>
                  <span className="text-xs font-bold text-foreground ml-auto">{m.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Top Products</h3>
          <div className="space-y-2">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}</span>
                  <span className="text-sm text-foreground">{p.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-foreground">{fmt(p.revenue)}</span>
                  <span className="text-[10px] text-muted-foreground ml-1">({p.qty})</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </MobilePortalLayout>
  );
};

export default MerchantSales;
