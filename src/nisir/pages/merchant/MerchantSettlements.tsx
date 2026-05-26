import { useState } from 'react';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import { useMerchantWallet, Settlement } from '@nisir/contexts/MerchantWalletContext';
import MobilePortalLayout from '@nisir/components/MobilePortalLayout';
import { motion } from 'framer-motion';
import {
  Home, QrCode, Wallet, Users, Receipt,
  Clock, Check, AlertTriangle, ChevronRight, Download, Banknote,
  Settings, Play, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/merchant' },
  { icon: <QrCode className="h-5 w-5" />, labelKey: 'merchant.qrReceive', path: '/merchant/qr' },
  { icon: <Users className="h-5 w-5" />, labelKey: 'merchant.vendors', path: '/merchant/vendors' },
  { icon: <Wallet className="h-5 w-5" />, labelKey: 'merchant.wallet', path: '/merchant/wallet' },
  { icon: <Receipt className="h-5 w-5" />, labelKey: 'merchant.transactions', path: '/merchant/transactions' },
];

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  settled: { icon: Check, color: 'text-success', bg: 'bg-success/10', label: 'Settled' },
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', label: 'Pending' },
  processing: { icon: Clock, color: 'text-primary', bg: 'bg-primary/10', label: 'Processing' },
  failed: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Failed' },
};

const ethiopianBanks = [
  'Nisir Microfinance',
  'Commercial Bank of Ethiopia', 'Awash Bank', 'Dashen Bank', 'Bank of Abyssinia',
  'Wegagen Bank', 'United Bank', 'Nib International Bank', 'Cooperative Bank of Oromia',
  'Lion International Bank', 'Zemen Bank', 'Bunna International Bank', 'Berhan International Bank',
  'Abay Bank', 'Addis International Bank', 'Debub Global Bank',
];

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

const MerchantSettlements = () => {
  const { t } = useLanguage();
  const {
    settlements, bankConfig, updateBankConfig,
    triggerSettlement, advanceSettlementStatus, transactions,
  } = useMerchantWallet();

  const [selected, setSelected] = useState<Settlement | null>(null);
  const [showBankConfig, setShowBankConfig] = useState(false);
  const [editBank, setEditBank] = useState(bankConfig);

  // Count unsettled QR txs
  const settledTxIds = new Set(settlements.flatMap(s => s.txIds));
  const unsettledQR = transactions.filter(
    tx => tx.type === 'qr_received' && tx.status === 'completed' && !settledTxIds.has(tx.id)
  );
  const unsettledGross = unsettledQR.reduce((s, tx) => s + tx.amount, 0);

  const totalPending = settlements.filter(s => s.status === 'pending' || s.status === 'processing').reduce((a, s) => a + s.netAmount, 0);
  const totalSettled = settlements.filter(s => s.status === 'settled').reduce((a, s) => a + s.netAmount, 0);

  const handleSettle = () => {
    if (unsettledQR.length === 0) {
      toast.info('No unsettled QR payments to batch');
      return;
    }
    triggerSettlement();
    toast.success(`Settlement created for ${unsettledQR.length} transactions (${fmt(unsettledGross)} ETB)`);
  };

  const handleSaveBank = () => {
    updateBankConfig(editBank);
    setShowBankConfig(false);
    toast.success('Settlement bank account updated');
  };

  // Detail view
  if (selected) {
    const cfg = statusConfig[selected.status];
    const Icon = cfg.icon;
    return (
      <MobilePortalLayout portalName="Nisir Merchant" portalColor="merchant" navItems={navItems} showBack backPath="/merchant">
        <div className="px-4 pt-4 pb-6">
          <button onClick={() => setSelected(null)} className="text-sm text-primary mb-4">← Back</button>

          <div className="text-center mb-4">
            <div className={`h-14 w-14 mx-auto rounded-full ${cfg.bg} flex items-center justify-center mb-2`}>
              <Icon className={`h-7 w-7 ${cfg.color}`} />
            </div>
            <h2 className="text-lg font-bold text-foreground">{selected.id}</h2>
            <span className={`text-xs font-semibold capitalize ${cfg.color}`}>{cfg.label}</span>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 space-y-3 mb-4">
            {[
              ['Settlement Date', selected.date],
              ['Gross Amount', `${fmt(selected.grossAmount)} ETB`],
              ['Transactions', String(selected.transactionCount)],
              [`Platform Fee (${(selected.feePercent * 100).toFixed(1)}%)`, `- ${fmt(selected.feeAmount)} ETB`],
              ['Net Settlement', `${fmt(selected.netAmount)} ETB`],
              ['Bank Account', selected.bankAccount],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-medium text-foreground ${label === 'Net Settlement' ? 'font-bold' : ''}`}>{value}</span>
              </div>
            ))}
          </div>

          {selected.status === 'pending' && (
            <Button onClick={() => { advanceSettlementStatus(selected.id); setSelected({ ...selected, status: 'processing' }); toast.info('Settlement sent to bank — processing...'); }}
              className="w-full gap-1.5 text-sm bg-primary text-primary-foreground mb-2">
              <Play className="h-4 w-4" /> Send to Bank
            </Button>
          )}
          {selected.status === 'settled' && (
            <Button variant="outline" className="w-full gap-1.5 text-sm">
              <Download className="h-4 w-4" /> Download Receipt
            </Button>
          )}
        </div>
      </MobilePortalLayout>
    );
  }

  // Bank config view
  if (showBankConfig) {
    return (
      <MobilePortalLayout portalName="Nisir Merchant" portalColor="merchant" navItems={navItems} showBack backPath="/merchant">
        <div className="px-4 pt-4 pb-6">
          <button onClick={() => setShowBankConfig(false)} className="text-sm text-primary mb-4">← Back</button>
          <h2 className="text-lg font-bold text-foreground mb-4">Settlement Bank Account</h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Bank</label>
              <select value={editBank.bankName} onChange={e => setEditBank({ ...editBank, bankName: e.target.value })}
                className="w-full rounded-lg border border-border bg-card p-3 text-sm text-foreground">
                {ethiopianBanks.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Account Number</label>
              <Input value={editBank.accountNumber} onChange={e => setEditBank({ ...editBank, accountNumber: e.target.value })}
                placeholder="Enter account number" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Account Holder Name</label>
              <Input value={editBank.accountHolder} onChange={e => setEditBank({ ...editBank, accountHolder: e.target.value })}
                placeholder="Account holder name" />
            </div>
            <Button onClick={handleSaveBank} className="w-full bg-primary text-primary-foreground">Save Bank Account</Button>
          </div>
        </div>
      </MobilePortalLayout>
    );
  }

  // Main list view
  return (
    <MobilePortalLayout portalName="Nisir Merchant" portalColor="merchant" navItems={navItems} showBack backPath="/merchant">
      <div className="px-4 pt-4 pb-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Settlements</h2>

        {/* Unsettled banner */}
        {unsettledQR.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-portal-merchant/5 border border-portal-merchant/20 rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-bold text-foreground">{unsettledQR.length} unsettled QR payments</p>
                <p className="text-xs text-muted-foreground">Gross: {fmt(unsettledGross)} ETB · Fee: {fmt(unsettledGross * PLATFORM_FEE)} ETB</p>
              </div>
            </div>
            <Button onClick={handleSettle} size="sm" className="w-full bg-portal-merchant text-white text-xs gap-1.5">
              <Banknote className="h-3.5 w-3.5" /> Batch & Settle Now
            </Button>
          </motion.div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-warning/5 rounded-xl border border-warning/20 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-3.5 w-3.5 text-warning" />
              <span className="text-[10px] text-warning font-semibold">Pending</span>
            </div>
            <p className="text-lg font-extrabold text-foreground">{fmt(totalPending)}</p>
            <p className="text-[10px] text-muted-foreground">ETB</p>
          </div>
          <div className="bg-success/5 rounded-xl border border-success/20 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Check className="h-3.5 w-3.5 text-success" />
              <span className="text-[10px] text-success font-semibold">Settled</span>
            </div>
            <p className="text-lg font-extrabold text-foreground">{fmt(totalSettled)}</p>
            <p className="text-[10px] text-muted-foreground">ETB</p>
          </div>
        </div>

        {/* Bank Config */}
        <div onClick={() => { setEditBank(bankConfig); setShowBankConfig(true); }}
          className="bg-card rounded-xl border border-border p-3 mb-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]">
          <div className="h-9 w-9 rounded-lg bg-portal-merchant/10 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-portal-merchant" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{bankConfig.bankName}</p>
            <p className="text-[11px] text-muted-foreground">Acct: {bankConfig.accountNumber} · T+1 auto-settlement</p>
          </div>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Settlement List */}
        <h3 className="text-sm font-bold text-foreground mb-2">Settlement History</h3>
        {settlements.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No settlements yet. Receive QR payments to generate settlements.</p>
        )}
        <div className="space-y-2">
          {settlements.map((s) => {
            const cfg = statusConfig[s.status];
            const Icon = cfg.icon;
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelected(s)}
                className="flex items-center justify-between p-3 bg-card rounded-xl border border-border cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{s.date}</p>
                    <p className="text-[11px] text-muted-foreground">{s.transactionCount} txns · {s.id}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-1">
                  <div>
                    <p className="text-sm font-bold text-foreground">{fmt(s.netAmount)}</p>
                    <p className={`text-[10px] font-semibold capitalize ${cfg.color}`}>{cfg.label}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </MobilePortalLayout>
  );
};

const PLATFORM_FEE = 0.015;

export default MerchantSettlements;
