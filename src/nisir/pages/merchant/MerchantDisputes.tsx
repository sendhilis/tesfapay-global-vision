import { useState } from 'react';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import MobilePortalLayout from '@nisir/components/MobilePortalLayout';
import { motion } from 'framer-motion';
import {
  Home, QrCode, BarChart3, FileText, MessageSquareWarning,
  AlertCircle, Clock, CheckCircle, ChevronRight, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/merchant' },
  { icon: <QrCode className="h-5 w-5" />, labelKey: 'merchant.qrCodes', path: '/merchant/qr' },
  { icon: <BarChart3 className="h-5 w-5" />, labelKey: 'merchant.sales', path: '/merchant/sales' },
  { icon: <FileText className="h-5 w-5" />, labelKey: 'merchant.settlements', path: '/merchant/settlements' },
  { icon: <MessageSquareWarning className="h-5 w-5" />, labelKey: 'merchant.disputes', path: '/merchant/disputes' },
];

interface Dispute {
  id: string;
  date: string;
  amount: number;
  reason: string;
  customerPhone: string;
  status: 'open' | 'under_review' | 'resolved' | 'rejected';
  txnRef: string;
  resolution?: string;
}

const disputes: Dispute[] = [
  { id: 'DSP-001', date: '2026-03-31', amount: 350, reason: 'Customer claims double charge', customerPhone: '+251911...42', status: 'open', txnRef: 'TXN-abc123' },
  { id: 'DSP-002', date: '2026-03-30', amount: 800, reason: 'Payment not received but debited', customerPhone: '+251922...18', status: 'under_review', txnRef: 'TXN-def456' },
  { id: 'DSP-003', date: '2026-03-28', amount: 120, reason: 'Wrong amount charged', customerPhone: '+251933...55', status: 'resolved', txnRef: 'TXN-ghi789', resolution: 'Refund processed - 120 ETB credited back' },
  { id: 'DSP-004', date: '2026-03-25', amount: 500, reason: 'Fraudulent transaction reported', customerPhone: '+251944...99', status: 'rejected', txnRef: 'TXN-jkl012', resolution: 'Investigation found valid transaction' },
];

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  open: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10', label: 'Open' },
  under_review: { icon: Clock, color: 'text-info', bg: 'bg-info/10', label: 'Under Review' },
  resolved: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Resolved' },
  rejected: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Rejected' },
};

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

const MerchantDisputes = () => {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [response, setResponse] = useState('');

  const openCount = disputes.filter((d) => d.status === 'open' || d.status === 'under_review').length;

  if (selected) {
    const cfg = statusConfig[selected.status];
    const Icon = cfg.icon;

    return (
      <MobilePortalLayout portalName="Nisir Merchant" portalColor="merchant" navItems={navItems} showBack backPath="/merchant">
        <div className="px-4 pt-4 pb-6">
          <button onClick={() => { setSelected(null); setResponse(''); }} className="text-sm text-primary mb-4">← Back</button>

          <div className="flex items-center gap-2 mb-4">
            <div className={`h-10 w-10 rounded-xl ${cfg.bg} flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${cfg.color}`} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">{selected.id}</h2>
              <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 space-y-3 mb-4">
            {[
              ['Date', selected.date],
              ['Amount', `${fmt(selected.amount)} ETB`],
              ['Transaction', selected.txnRef],
              ['Customer', selected.customerPhone],
              ['Reason', selected.reason],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="text-sm font-medium text-foreground">{value}</p>
              </div>
            ))}
          </div>

          {selected.resolution && (
            <div className={`rounded-xl border p-3 mb-4 ${selected.status === 'resolved' ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
              <p className="text-xs font-semibold text-foreground mb-1">Resolution</p>
              <p className="text-sm text-muted-foreground">{selected.resolution}</p>
            </div>
          )}

          {(selected.status === 'open' || selected.status === 'under_review') && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground">Respond to Dispute</p>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="w-full py-3 px-3 rounded-xl border border-border bg-card text-foreground text-sm resize-none"
                rows={3}
                placeholder="Provide evidence or explanation..."
              />
              <Button
                className="w-full gap-1.5"
                disabled={!response.trim()}
                onClick={() => {
                  toast.success('Response submitted!');
                  setSelected(null);
                  setResponse('');
                }}
              >
                <Send className="h-4 w-4" /> Submit Response
              </Button>
            </div>
          )}
        </div>
      </MobilePortalLayout>
    );
  }

  return (
    <MobilePortalLayout portalName="Nisir Merchant" portalColor="merchant" navItems={navItems} showBack backPath="/merchant">
      <div className="px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">{t('merchant.disputes')}</h2>
          {openCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-bold">{openCount} open</span>
          )}
        </div>

        <div className="space-y-2">
          {disputes.map((d) => {
            const cfg = statusConfig[d.status];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelected(d)}
                className="flex items-center justify-between p-3 bg-card rounded-xl border border-border cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{d.reason}</p>
                    <p className="text-[11px] text-muted-foreground">{d.date} · {d.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{fmt(d.amount)}</p>
                    <p className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</p>
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

export default MerchantDisputes;
