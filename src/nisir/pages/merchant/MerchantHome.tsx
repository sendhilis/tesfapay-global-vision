import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useMerchantWallet } from '@/contexts/MerchantWalletContext';
import MobilePortalLayout from '@/components/MobilePortalLayout';
import { motion } from 'framer-motion';
import {
  Home, QrCode, Wallet, Users, Receipt,
  ArrowLeftRight, TrendingUp, CircleDollarSign, ShoppingBag,
  BarChart3, MessageSquareWarning, FileText
} from 'lucide-react';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/merchant' },
  { icon: <QrCode className="h-5 w-5" />, labelKey: 'merchant.qrReceive', path: '/merchant/qr' },
  { icon: <Users className="h-5 w-5" />, labelKey: 'merchant.vendors', path: '/merchant/vendors' },
  { icon: <Wallet className="h-5 w-5" />, labelKey: 'merchant.wallet', path: '/merchant/wallet' },
  { icon: <Receipt className="h-5 w-5" />, labelKey: 'merchant.transactions', path: '/merchant/transactions' },
];

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

const MerchantHome = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { walletBalance, savingsBalance, transactions } = useMerchantWallet();

  const todayQR = transactions.filter(tx => tx.type === 'qr_received' && tx.date === 'Today');
  const todayRevenue = todayQR.reduce((s, tx) => s + tx.amount, 0);
  const todayCount = todayQR.length;
  const avgTicket = todayCount > 0 ? Math.round(todayRevenue / todayCount) : 0;

  const recentTxs = transactions.slice(0, 5);

  return (
    <MobilePortalLayout portalName="Nisir Merchant" portalColor="merchant" navItems={navItems} showBack backPath="/">
      <div className="px-4 pt-4 pb-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 text-primary-foreground"
          style={{ background: 'linear-gradient(135deg, hsl(25,80%,50%), hsl(30,75%,55%))' }}>
          <p className="text-sm opacity-80 mb-0.5">Habesha Coffee & Spices</p>
          <p className="text-[11px] opacity-60 mb-3">NISIR-MER-0042 · Bole Road #3</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary-foreground/10 rounded-xl p-3 cursor-pointer active:scale-[0.97]" onClick={() => navigate('/merchant/wallet')}>
              <div className="flex items-center gap-1.5 mb-1">
                <Wallet className="h-3 w-3 opacity-70" />
                <p className="text-[10px] opacity-70">Merchant Wallet</p>
              </div>
              <p className="text-xl font-extrabold">{fmt(walletBalance)}</p>
              <p className="text-[10px] opacity-60">ETB · Active</p>
            </div>
            <div className="bg-primary-foreground/10 rounded-xl p-3 cursor-pointer active:scale-[0.97]" onClick={() => navigate('/merchant/wallet')}>
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowLeftRight className="h-3 w-3 opacity-70" />
                <p className="text-[10px] opacity-70">Nisir Savings</p>
              </div>
              <p className="text-xl font-extrabold">{fmt(savingsBalance)}</p>
              <p className="text-[10px] opacity-60">ETB · Connected</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-4 py-3">
        <h3 className="text-sm font-bold text-foreground mb-2">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: QrCode, label: 'Receive Payment', desc: 'QR scan & pay', path: '/merchant/qr', color: 'text-success' },
            { icon: Users, label: 'Pay Vendor', desc: 'Send to supplier', path: '/merchant/vendors', color: 'text-portal-merchant' },
            { icon: ArrowLeftRight, label: 'Transfer Funds', desc: 'Wallet ↔ Savings', path: '/merchant/wallet', color: 'text-primary' },
            { icon: Receipt, label: 'Transactions', desc: 'All activity', path: '/merchant/transactions', color: 'text-warning' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                whileHover={{ y: -4, boxShadow: '0 8px 24px hsl(25 80% 50% / 0.12)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(item.path)}
                className="flex items-start gap-3 p-3 bg-card rounded-xl border border-border transition-colors text-left">
                <motion.div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0"
                  whileHover={{ rotate: [0, -6, 6, 0], scale: 1.1 }}
                  transition={{ duration: 0.4 }}>
                  <Icon className={`h-4.5 w-4.5 ${item.color}`} />
                </motion.div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-3">
        <h3 className="text-sm font-bold text-foreground mb-2">Today's Performance</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: CircleDollarSign, label: 'Revenue', value: fmt(todayRevenue), color: 'text-success' },
            { icon: ShoppingBag, label: 'QR Payments', value: String(todayCount), color: 'text-portal-merchant' },
            { icon: TrendingUp, label: 'Avg. Ticket', value: String(avgTicket), color: 'text-primary' },
          ].map(kpi => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="bg-card rounded-xl border border-border p-3 text-center">
                <Icon className={`h-4 w-4 mx-auto mb-1 ${kpi.color}`} />
                <p className="text-lg font-extrabold text-foreground">{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-3">
        <h3 className="text-sm font-bold text-foreground mb-2">More</h3>
        <div className="space-y-2">
          {[
            { icon: BarChart3, label: 'Sales Analytics', desc: 'Revenue charts & insights', path: '/merchant/sales' },
            { icon: FileText, label: 'Settlements', desc: 'Payout history & schedule', path: '/merchant/settlements' },
            { icon: MessageSquareWarning, label: 'Disputes', desc: 'Open cases', path: '/merchant/disputes' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.05 }}
                whileHover={{ x: 4, boxShadow: '0 4px 16px hsl(160 30% 12% / 0.08)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border cursor-pointer transition-colors">
                <motion.div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center"
                  whileHover={{ scale: 1.1 }} transition={{ duration: 0.2 }}>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </motion.div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-foreground">Recent Activity</h3>
          <button onClick={() => navigate('/merchant/transactions')} className="text-xs font-medium text-primary">View all</button>
        </div>
        <div className="space-y-2">
          {recentTxs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>}
          {recentTxs.map(tx => (
            <div key={tx.id} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">{tx.description}</p>
                <p className="text-[11px] text-muted-foreground">{tx.time} · {tx.date}</p>
              </div>
              <p className={`text-sm font-bold ${tx.direction === 'in' ? 'text-success' : 'text-destructive'}`}>
                {tx.direction === 'in' ? '+' : '-'}{tx.amount.toLocaleString()} ETB
              </p>
            </div>
          ))}
        </div>
      </div>
    </MobilePortalLayout>
  );
};

export default MerchantHome;
