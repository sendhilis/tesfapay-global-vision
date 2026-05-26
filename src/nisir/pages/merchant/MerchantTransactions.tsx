import { useState } from 'react';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import { useMerchantWallet } from '@nisir/contexts/MerchantWalletContext';
import MobilePortalLayout from '@nisir/components/MobilePortalLayout';
import { motion } from 'framer-motion';
import {
  Home, QrCode, Wallet, Users, Receipt, ArrowDownLeft, ArrowUpRight, Building2
} from 'lucide-react';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/merchant' },
  { icon: <QrCode className="h-5 w-5" />, labelKey: 'merchant.qrReceive', path: '/merchant/qr' },
  { icon: <Users className="h-5 w-5" />, labelKey: 'merchant.vendors', path: '/merchant/vendors' },
  { icon: <Wallet className="h-5 w-5" />, labelKey: 'merchant.wallet', path: '/merchant/wallet' },
  { icon: <Receipt className="h-5 w-5" />, labelKey: 'merchant.transactions', path: '/merchant/transactions' },
];

const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
  qr_received: { icon: QrCode, label: 'QR Payment', color: 'bg-success/10 text-success' },
  vendor_payment: { icon: Building2, label: 'Vendor Payment', color: 'bg-portal-merchant/10 text-portal-merchant' },
  wallet_transfer: { icon: Wallet, label: 'Wallet Transfer', color: 'bg-primary/10 text-primary' },
  settlement: { icon: Receipt, label: 'Settlement', color: 'bg-warning/10 text-warning' },
};

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

const MerchantTransactions = () => {
  const { t } = useLanguage();
  const { transactions } = useMerchantWallet();
  const [filter, setFilter] = useState<'all' | 'qr_received' | 'vendor_payment' | 'wallet_transfer' | 'settlement'>('all');

  const filtered = filter === 'all' ? transactions : transactions.filter(tx => tx.type === filter);

  const grouped: Record<string, typeof transactions> = {};
  filtered.forEach(tx => {
    if (!grouped[tx.date]) grouped[tx.date] = [];
    grouped[tx.date].push(tx);
  });

  const totalIn = filtered.filter(t => t.direction === 'in').reduce((s, t) => s + t.amount, 0);
  const totalOut = filtered.filter(t => t.direction === 'out').reduce((s, t) => s + t.amount, 0);

  return (
    <MobilePortalLayout portalName="Nisir Merchant" portalColor="merchant" navItems={navItems} showBack backPath="/merchant">
      <div className="px-4 pt-4 pb-6 space-y-4">
        <h2 className="text-lg font-bold text-foreground">Transaction History</h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-success/5 rounded-xl border border-success/20 p-3">
            <div className="flex items-center gap-1.5 mb-1"><ArrowDownLeft className="h-3.5 w-3.5 text-success" /><span className="text-[10px] text-success font-semibold">Money In</span></div>
            <p className="text-lg font-extrabold text-foreground">{fmt(totalIn)}</p>
            <p className="text-[10px] text-muted-foreground">ETB</p>
          </div>
          <div className="bg-destructive/5 rounded-xl border border-destructive/20 p-3">
            <div className="flex items-center gap-1.5 mb-1"><ArrowUpRight className="h-3.5 w-3.5 text-destructive" /><span className="text-[10px] text-destructive font-semibold">Money Out</span></div>
            <p className="text-lg font-extrabold text-foreground">{fmt(totalOut)}</p>
            <p className="text-[10px] text-muted-foreground">ETB</p>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { key: 'all', label: 'All' },
            { key: 'qr_received', label: 'QR Payments' },
            { key: 'vendor_payment', label: 'Vendors' },
            { key: 'wallet_transfer', label: 'Transfers' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>{f.label}</button>
          ))}
        </div>

        {Object.entries(grouped).map(([date, txs]) => (
          <div key={date}>
            <p className="text-xs font-bold text-muted-foreground mb-2 uppercase">{date}</p>
            <div className="space-y-2">
              {txs.map((tx, i) => {
                const cfg = typeConfig[tx.type];
                const Icon = cfg.icon;
                return (
                  <motion.div key={tx.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${cfg.color.split(' ')[0]}`}>
                        <Icon className={`h-4 w-4 ${cfg.color.split(' ')[1]}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                        <p className="text-[10px] text-muted-foreground">{tx.time} · {tx.reference}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${tx.direction === 'in' ? 'text-success' : 'text-destructive'}`}>
                        {tx.direction === 'in' ? '+' : '-'}{fmt(tx.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">ETB</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No transactions found</p>}
      </div>
    </MobilePortalLayout>
  );
};

export default MerchantTransactions;
