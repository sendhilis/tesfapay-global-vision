import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMerchantWallet } from '@/contexts/MerchantWalletContext';
import MobilePortalLayout from '@/components/MobilePortalLayout';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, QrCode, Wallet, Users, Receipt,
  Plus, Copy, Download, Check, Loader2, Trash2, Bell, Smartphone
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

interface QRCodeItem {
  id: string;
  label: string;
  amount: number | null;
  merchantId: string;
  createdAt: string;
}

const MerchantQR = () => {
  const { t } = useLanguage();
  const { receivePayment } = useMerchantWallet();
  const [view, setView] = useState<'list' | 'create' | 'detail' | 'receive' | 'waiting' | 'received'>('list');
  const [selectedQR, setSelectedQR] = useState<QRCodeItem | null>(null);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [isDynamic, setIsDynamic] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);

  const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([
    { id: 'qr-001', label: 'Counter 1 — Main', amount: null, merchantId: 'NISIR-MER-0042', createdAt: '2026-03-28' },
    { id: 'qr-002', label: 'Takeaway Window', amount: null, merchantId: 'NISIR-MER-0042', createdAt: '2026-03-29' },
    { id: 'qr-003', label: 'Coffee Special', amount: 150, merchantId: 'NISIR-MER-0042', createdAt: '2026-03-30' },
  ]);

  const generateQRPayload = (qr: QRCodeItem, overrideAmount?: number) =>
    JSON.stringify({
      type: 'nisir_pay',
      merchant: qr.merchantId,
      qr_id: qr.id,
      label: qr.label,
      amount: overrideAmount ?? qr.amount,
      currency: 'ETB',
    });

  const handleCreate = () => {
    if (!label.trim()) { toast.error('Label is required'); return; }
    const newQR: QRCodeItem = {
      id: `qr-${Date.now()}`,
      label: label.trim(),
      amount: isDynamic ? null : parseFloat(amount) || null,
      merchantId: 'NISIR-MER-0042',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setQrCodes(prev => [newQR, ...prev]);
    toast.success('QR code created!');
    setLabel(''); setAmount('');
    setView('list');
  };

  const handleDelete = (id: string) => {
    setQrCodes(prev => prev.filter(q => q.id !== id));
    toast.success('QR code deleted');
    setView('list');
  };

  const handleCopyPayload = (qr: QRCodeItem) => {
    navigator.clipboard.writeText(generateQRPayload(qr));
    toast.success('QR data copied!');
  };

  const handleDownload = (qr: QRCodeItem) => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 400; canvas.height = 400;
      ctx?.drawImage(img, 0, 0, 400, 400);
      const a = document.createElement('a');
      a.download = `nisir-qr-${qr.label.replace(/\s+/g, '-')}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  // Simulate a customer scanning and paying
  const startReceiveFlow = (qr: QRCodeItem) => {
    setSelectedQR(qr);
    if (qr.amount) {
      setReceiveAmount(String(qr.amount));
    } else {
      setReceiveAmount('');
    }
    setView('receive');
  };

  const simulateWaiting = () => {
    const amt = parseFloat(receiveAmount);
    if (!amt || amt <= 0) { toast.error('Enter an amount'); return; }
    setView('waiting');
    // Simulate customer scanning and paying after 3 seconds
    const names = ['Kidist Alem', 'Yonas Tadesse', 'Meron Haile', 'Bereket Girma', 'Tigist Bekele'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    setCustomerName(randomName);
    setTimeout(() => {
      receivePayment(amt, selectedQR?.label || 'QR', randomName);
      setView('received');
      toast.success(`Payment of ${amt.toLocaleString()} ETB received!`);
    }, 3000);
  };

  return (
    <MobilePortalLayout portalName="Nisir Merchant" portalColor="merchant" navItems={navItems} showBack backPath="/merchant">
      <AnimatePresence mode="wait">
        {view === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 pt-4 pb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">QR Receive Payments</h2>
              <Button size="sm" onClick={() => setView('create')} className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> New QR
              </Button>
            </div>

            {/* How it works */}
            <div className="bg-primary/5 rounded-xl border border-primary/20 p-3 mb-4">
              <p className="text-xs font-bold text-foreground mb-1">How QR Payments Work</p>
              <div className="space-y-1">
                {['Select a QR code or create one', 'Show QR to customer or tap "Receive Payment"', 'Customer scans with Nisir/Telebirr/M-PESA app', 'Payment credited instantly to Merchant Wallet'].map((step, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground flex items-start gap-2">
                    <span className="h-4 w-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </p>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {qrCodes.map(qr => (
                <motion.div key={qr.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl border border-border p-3">
                  <div className="flex items-center gap-3 mb-3" onClick={() => { setSelectedQR(qr); setView('detail'); }}>
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <QRCodeSVG value={generateQRPayload(qr)} size={40} level="L" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{qr.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {qr.amount ? `Fixed: ${qr.amount.toLocaleString()} ETB` : 'Dynamic amount'}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" className="w-full gap-1.5 text-xs" onClick={() => startReceiveFlow(qr)}>
                    <Smartphone className="h-3.5 w-3.5" /> Receive Payment
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {view === 'create' && (
          <motion.div key="create" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4 pt-4 pb-6">
            <button onClick={() => setView('list')} className="text-sm text-primary mb-4">← Back</button>
            <h2 className="text-lg font-bold text-foreground mb-4">Create QR Code</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Label / Outlet Name</label>
                <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Counter 2, Delivery" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Amount Type</label>
                <div className="flex gap-2">
                  {[true, false].map(dyn => (
                    <button key={String(dyn)} onClick={() => setIsDynamic(dyn)}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors ${
                        isDynamic === dyn ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border'
                      }`}>
                      {dyn ? 'Dynamic' : 'Fixed Amount'}
                    </button>
                  ))}
                </div>
              </div>
              {!isDynamic && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Fixed Amount (ETB)</label>
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                </div>
              )}
              <div className="bg-muted/50 rounded-xl p-4 flex flex-col items-center">
                <p className="text-xs text-muted-foreground mb-2">Preview</p>
                <QRCodeSVG value={JSON.stringify({ type: 'nisir_pay', merchant: 'NISIR-MER-0042', label: label || 'New QR', amount: isDynamic ? null : parseFloat(amount) || null, currency: 'ETB' })} size={160} level="M" includeMargin />
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={!label.trim()}>Create QR Code</Button>
            </div>
          </motion.div>
        )}

        {view === 'detail' && selectedQR && (
          <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4 pt-4 pb-6">
            <button onClick={() => setView('list')} className="text-sm text-primary mb-4">← Back</button>
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-foreground">{selectedQR.label}</h2>
              <p className="text-sm text-muted-foreground">{selectedQR.amount ? `Fixed: ${selectedQR.amount.toLocaleString()} ETB` : 'Customer enters amount'}</p>
            </div>
            <div ref={qrRef} className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center mb-4">
              <QRCodeSVG value={generateQRPayload(selectedQR)} size={220} level="H" includeMargin />
              <p className="text-[11px] text-muted-foreground mt-3">{selectedQR.merchantId}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => handleCopyPayload(selectedQR)}><Copy className="h-3.5 w-3.5" /> Copy</Button>
              <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => handleDownload(selectedQR)}><Download className="h-3.5 w-3.5" /> Save</Button>
              <Button variant="outline" size="sm" className="gap-1 text-xs text-destructive" onClick={() => handleDelete(selectedQR.id)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
            </div>
            <Button className="w-full gap-1.5" onClick={() => startReceiveFlow(selectedQR)}>
              <Smartphone className="h-4 w-4" /> Receive Payment via This QR
            </Button>
          </motion.div>
        )}

        {view === 'receive' && selectedQR && (
          <motion.div key="receive" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4 pt-4 pb-6">
            <button onClick={() => setView('list')} className="text-sm text-primary mb-4">← Back</button>
            <h2 className="text-lg font-bold text-foreground mb-1">Receive Payment</h2>
            <p className="text-sm text-muted-foreground mb-4">QR: {selectedQR.label}</p>

            <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center mb-4">
              <QRCodeSVG
                value={generateQRPayload(selectedQR, parseFloat(receiveAmount) || undefined)}
                size={180} level="H" includeMargin
              />
              <p className="text-xs text-muted-foreground mt-2">Show this to customer</p>
            </div>

            {!selectedQR.amount && (
              <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Amount to Receive (ETB)</label>
                <Input type="number" value={receiveAmount} onChange={e => setReceiveAmount(e.target.value)}
                  placeholder="Enter amount" className="text-xl font-bold h-14 text-center" />
              </div>
            )}

            <Button onClick={simulateWaiting} className="w-full gap-1.5" disabled={!receiveAmount || parseFloat(receiveAmount) <= 0}>
              <Bell className="h-4 w-4" /> Wait for Payment
            </Button>
          </motion.div>
        )}

        {view === 'waiting' && selectedQR && (
          <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-12 pb-6 text-center">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}
              className="h-24 w-24 rounded-full bg-portal-merchant/10 flex items-center justify-center mx-auto mb-6">
              <Smartphone className="h-12 w-12 text-portal-merchant" />
            </motion.div>
            <h2 className="text-xl font-bold text-foreground mb-2">Waiting for Payment...</h2>
            <p className="text-sm text-muted-foreground mb-1">Amount: {parseFloat(receiveAmount).toLocaleString()} ETB</p>
            <p className="text-xs text-muted-foreground mb-6">Customer scanning QR code...</p>

            <motion.div className="flex gap-1 justify-center mb-6">
              {[0, 1, 2].map(i => (
                <motion.div key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }}
                  className="h-2.5 w-2.5 rounded-full bg-portal-merchant"
                />
              ))}
            </motion.div>

            <Button variant="outline" onClick={() => setView('list')}>Cancel</Button>
          </motion.div>
        )}

        {view === 'received' && selectedQR && (
          <motion.div key="received" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-4 pt-8 pb-6 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
              className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Check className="h-10 w-10 text-success" />
            </motion.div>
            <h2 className="text-xl font-bold text-foreground mb-1">Payment Received!</h2>
            <p className="text-3xl font-extrabold text-success mb-2">+{parseFloat(receiveAmount).toLocaleString()} ETB</p>
            <p className="text-sm text-muted-foreground mb-6">from {customerName}</p>

            <div className="bg-card rounded-xl border border-border p-4 mb-6 space-y-2 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono text-xs text-foreground">QR-{Date.now().toString().slice(-8)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">QR Point</span>
                <span className="font-medium text-foreground">{selectedQR.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium text-foreground">{customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Credited to</span>
                <span className="font-medium text-foreground">Merchant Wallet</span>
              </div>
            </div>
            <Button onClick={() => { setView('list'); setReceiveAmount(''); }} className="w-full">Done</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </MobilePortalLayout>
  );
};

export default MerchantQR;
