import { useState } from 'react';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import { useMerchantWallet } from '@nisir/contexts/MerchantWalletContext';
import MobilePortalLayout from '@nisir/components/MobilePortalLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, QrCode, Wallet, Users, Receipt, ArrowLeftRight, ArrowDownToLine, ArrowUpFromLine,
  CheckCircle, Loader2
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

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

const MerchantWallet = () => {
  const { t } = useLanguage();
  const { walletBalance, savingsBalance, transactions, transferToSavings, transferToWallet } = useMerchantWallet();
  const [view, setView] = useState<'main' | 'transfer' | 'success'>('main');
  const [amount, setAmount] = useState('');
  const [transferType, setTransferType] = useState<'to-savings' | 'to-wallet'>('to-savings');
  const [processing, setProcessing] = useState(false);
  const [lastAmount, setLastAmount] = useState(0);

  const handleTransfer = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) { toast.error('Enter a valid amount'); return; }

    setProcessing(true);
    await new Promise(r => setTimeout(r, 1500));

    const ok = transferType === 'to-savings' ? transferToSavings(numAmount) : transferToWallet(numAmount);
    setProcessing(false);

    if (!ok) { toast.error('Insufficient balance'); return; }
    setLastAmount(numAmount);
    setView('success');
  };

  const resetFlow = () => { setView('main'); setAmount(''); };

  const recentWalletTxs = transactions.filter(tx =>
    tx.type === 'qr_received' || tx.type === 'vendor_payment' || tx.type === 'wallet_transfer'
  ).slice(0, 5);

  return (
    <MobilePortalLayout portalName="Nisir Merchant" portalColor="merchant" navItems={navItems} showBack backPath="/merchant">
      <AnimatePresence mode="wait">
        {view === 'main' && (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 pt-4 pb-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground">Merchant Wallet</h2>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 text-primary-foreground"
              style={{ background: 'linear-gradient(135deg, hsl(25,80%,50%), hsl(30,75%,55%))' }}>
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 opacity-80" />
                <p className="text-xs opacity-80">Merchant Wallet</p>
              </div>
              <p className="text-3xl font-extrabold">{fmt(walletBalance)}</p>
              <p className="text-xs opacity-60 mt-1">ETB · Active</p>
            </motion.div>

            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Connected Savings</p>
                  <p className="text-xl font-extrabold text-foreground mt-1">{fmt(savingsBalance)} <span className="text-xs font-normal text-muted-foreground">ETB</span></p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Nisir Savings · NIS-****4521</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ArrowLeftRight className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                onClick={() => { setTransferType('to-savings'); setView('transfer'); }}
                className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border hover:shadow-md transition-shadow active:scale-[0.98]">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ArrowUpFromLine className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">To Savings</span>
                <span className="text-[10px] text-muted-foreground">Wallet → Savings</span>
              </motion.button>
              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                onClick={() => { setTransferType('to-wallet'); setView('transfer'); }}
                className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border hover:shadow-md transition-shadow active:scale-[0.98]">
                <div className="h-11 w-11 rounded-xl bg-portal-merchant/10 flex items-center justify-center">
                  <ArrowDownToLine className="h-5 w-5 text-portal-merchant" />
                </div>
                <span className="text-sm font-semibold text-foreground">To Wallet</span>
                <span className="text-[10px] text-muted-foreground">Savings → Wallet</span>
              </motion.button>
            </div>

            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">Recent Wallet Activity</h3>
              <div className="space-y-2">
                {recentWalletTxs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>}
                {recentWalletTxs.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.description}</p>
                      <p className="text-[11px] text-muted-foreground">{tx.time}</p>
                    </div>
                    <p className={`text-sm font-bold ${tx.direction === 'in' ? 'text-success' : 'text-destructive'}`}>
                      {tx.direction === 'in' ? '+' : '-'}{tx.amount.toLocaleString()} ETB
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {view === 'transfer' && (
          <motion.div key="transfer" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4 pt-4 pb-6">
            <button onClick={resetFlow} className="text-sm text-primary mb-4">← Back</button>
            <h2 className="text-lg font-bold text-foreground mb-1">
              {transferType === 'to-savings' ? 'Wallet → Savings' : 'Savings → Wallet'}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Available: {fmt(transferType === 'to-savings' ? walletBalance : savingsBalance)} ETB
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Amount (ETB)</label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                  className="text-2xl font-bold h-14 text-center" />
              </div>
              <div className="flex gap-2">
                {[1000, 5000, 10000, 25000].map(v => (
                  <button key={v} onClick={() => setAmount(String(v))}
                    className="flex-1 py-2 rounded-lg bg-muted text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors">
                    {v / 1000}k
                  </button>
                ))}
              </div>
              {amount && parseFloat(amount) > 0 && (
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">From</span>
                    <span className="font-medium text-foreground">{transferType === 'to-savings' ? 'Merchant Wallet' : 'Nisir Savings'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">To</span>
                    <span className="font-medium text-foreground">{transferType === 'to-savings' ? 'Nisir Savings' : 'Merchant Wallet'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-bold text-foreground">{fmt(parseFloat(amount))} ETB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fee</span>
                    <span className="font-medium text-success">Free</span>
                  </div>
                </div>
              )}
              <Button onClick={handleTransfer} className="w-full" disabled={!amount || parseFloat(amount) <= 0 || processing}>
                {processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : 'Confirm Transfer'}
              </Button>
            </div>
          </motion.div>
        )}

        {view === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-4 pt-8 pb-6 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
              className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-success" />
            </motion.div>
            <h2 className="text-xl font-bold text-foreground mb-1">Transfer Successful!</h2>
            <p className="text-sm text-muted-foreground mb-2">{fmt(lastAmount)} ETB moved {transferType === 'to-savings' ? 'to Savings' : 'to Wallet'}</p>
            <div className="bg-card rounded-xl border border-border p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Wallet Balance</span>
                <span className="font-bold text-foreground">{fmt(walletBalance)} ETB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Savings Balance</span>
                <span className="font-bold text-foreground">{fmt(savingsBalance)} ETB</span>
              </div>
            </div>
            <Button onClick={resetFlow} className="w-full">Done</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </MobilePortalLayout>
  );
};

export default MerchantWallet;
