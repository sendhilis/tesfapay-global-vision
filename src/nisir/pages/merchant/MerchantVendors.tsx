import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMerchantWallet } from '@/contexts/MerchantWalletContext';
import MobilePortalLayout from '@/components/MobilePortalLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, QrCode, Wallet, Users, Receipt, Plus, Send, CheckCircle,
  Loader2, Building2, Trash2
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

const banks = [
  'CBE', 'Awash Bank', 'Dashen Bank', 'Bank of Abyssinia', 'Wegagen Bank',
  'United Bank', 'Nib Bank', 'Cooperative Bank', 'Berhan Bank', 'Abay Bank',
  'Zemen Bank', 'Oromia Bank', 'Bunna Bank', 'Enat Bank', 'Hibret Bank'
];

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

const MerchantVendors = () => {
  const { t } = useLanguage();
  const { walletBalance, vendors, payVendor, addVendor, removeVendor } = useMerchantWallet();
  const [view, setView] = useState<'list' | 'add' | 'pay' | 'success'>('list');
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [processing, setProcessing] = useState(false);
  const [lastAmount, setLastAmount] = useState(0);

  const [newName, setNewName] = useState('');
  const [newBusiness, setNewBusiness] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAccount, setNewAccount] = useState('');
  const [newBank, setNewBank] = useState('CBE');

  const selectedVendor = vendors.find(v => v.id === selectedVendorId);

  const handleAddVendor = () => {
    if (!newName.trim() || !newPhone.trim() || !newAccount.trim()) {
      toast.error('Name, phone, and account number are required'); return;
    }
    addVendor({ name: newName.trim(), business: newBusiness.trim() || newName.trim(), phone: newPhone.trim(), accountNumber: newAccount.trim(), bank: newBank });
    toast.success('Vendor added!');
    setNewName(''); setNewBusiness(''); setNewPhone(''); setNewAccount(''); setNewBank('CBE');
    setView('list');
  };

  const handlePay = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) { toast.error('Enter a valid amount'); return; }
    if (numAmount + 15 > walletBalance) { toast.error('Insufficient wallet balance'); return; }
    if (!selectedVendorId) return;

    setProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    payVendor(selectedVendorId, numAmount, 15, description);
    setProcessing(false);
    setLastAmount(numAmount);
    setView('success');
  };

  const resetFlow = () => { setView('list'); setSelectedVendorId(null); setAmount(''); setDescription(''); };

  return (
    <MobilePortalLayout portalName="Nisir Merchant" portalColor="merchant" navItems={navItems} showBack backPath="/merchant">
      <AnimatePresence mode="wait">
        {view === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 pt-4 pb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-foreground">Vendors</h2>
              <Button size="sm" onClick={() => setView('add')} className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Add Vendor</Button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Wallet: <span className="font-bold text-foreground">{fmt(walletBalance)} ETB</span></p>
            <div className="space-y-2">
              {vendors.map((v, i) => (
                <motion.div key={v.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-xl border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-portal-merchant/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-portal-merchant" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{v.business}</p>
                      <p className="text-[11px] text-muted-foreground">{v.name} · {v.bank}</p>
                      <p className="text-[10px] text-muted-foreground">Total paid: {fmt(v.totalPaid)} ETB</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="flex-1 gap-1 text-xs h-8" onClick={() => { setSelectedVendorId(v.id); setView('pay'); }}>
                      <Send className="h-3 w-3" /> Pay
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-8 text-destructive" onClick={() => { removeVendor(v.id); toast.success('Vendor removed'); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {view === 'add' && (
          <motion.div key="add" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4 pt-4 pb-6">
            <button onClick={() => setView('list')} className="text-sm text-primary mb-4">← Back</button>
            <h2 className="text-lg font-bold text-foreground mb-4">Add New Vendor</h2>
            <div className="space-y-4">
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Contact Name *</label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Abebe Teshome" /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Business Name</label><Input value={newBusiness} onChange={e => setNewBusiness(e.target.value)} placeholder="e.g. Addis Spice Traders" /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Phone *</label><Input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+251..." /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Bank</label>
                <select value={newBank} onChange={e => setNewBank(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {banks.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Account Number *</label><Input value={newAccount} onChange={e => setNewAccount(e.target.value)} placeholder="Account number" /></div>
              <Button onClick={handleAddVendor} className="w-full" disabled={!newName.trim() || !newPhone.trim() || !newAccount.trim()}>Add Vendor</Button>
            </div>
          </motion.div>
        )}

        {view === 'pay' && selectedVendor && (
          <motion.div key="pay" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4 pt-4 pb-6">
            <button onClick={resetFlow} className="text-sm text-primary mb-4">← Back</button>
            <h2 className="text-lg font-bold text-foreground mb-1">Pay Vendor</h2>
            <div className="bg-card rounded-xl border border-border p-3 mb-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-portal-merchant/10 flex items-center justify-center"><Building2 className="h-5 w-5 text-portal-merchant" /></div>
              <div>
                <p className="text-sm font-bold text-foreground">{selectedVendor.business}</p>
                <p className="text-[11px] text-muted-foreground">{selectedVendor.bank} · ****{selectedVendor.accountNumber.slice(-4)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Wallet: <span className="font-bold text-foreground">{fmt(walletBalance)} ETB</span></p>
            <div className="space-y-4">
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Amount (ETB)</label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="text-2xl font-bold h-14 text-center" /></div>
              <div className="flex gap-2">
                {[500, 1000, 5000, 10000].map(v => (
                  <button key={v} onClick={() => setAmount(String(v))} className="flex-1 py-2 rounded-lg bg-muted text-xs font-semibold text-foreground">{v >= 1000 ? `${v/1000}k` : v}</button>
                ))}
              </div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Description (optional)</label><Input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Weekly spice order" /></div>
              {amount && parseFloat(amount) > 0 && (
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">To</span><span className="font-medium text-foreground">{selectedVendor.business}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount</span><span className="font-bold text-foreground">{fmt(parseFloat(amount))} ETB</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Fee</span><span className="font-medium text-foreground">15.00 ETB</span></div>
                  <div className="border-t border-border pt-2 flex justify-between text-sm"><span className="font-semibold text-foreground">Total Debit</span><span className="font-bold text-foreground">{fmt(parseFloat(amount) + 15)} ETB</span></div>
                </div>
              )}
              <Button onClick={handlePay} className="w-full" disabled={!amount || parseFloat(amount) <= 0 || processing}>
                {processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : 'Confirm Payment'}
              </Button>
            </div>
          </motion.div>
        )}

        {view === 'success' && selectedVendor && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-4 pt-8 pb-6 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
              className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-success" />
            </motion.div>
            <h2 className="text-xl font-bold text-foreground mb-1">Payment Sent!</h2>
            <p className="text-sm text-muted-foreground mb-4">{fmt(lastAmount)} ETB sent to {selectedVendor.business}</p>
            <div className="bg-card rounded-xl border border-border p-4 mb-6 space-y-2 text-left">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Reference</span><span className="font-mono text-xs text-foreground">VP-{Date.now().toString().slice(-8)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Wallet Balance</span><span className="font-bold text-foreground">{fmt(walletBalance)} ETB</span></div>
            </div>
            <Button onClick={resetFlow} className="w-full">Done</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </MobilePortalLayout>
  );
};

export default MerchantVendors;
