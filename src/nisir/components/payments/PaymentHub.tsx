import { useLanguage } from '@nisir/contexts/LanguageContext';
import { motion } from 'framer-motion';
import {
  ArrowLeftRight, Building2, Smartphone, Receipt,
  Send, Download, Globe, Wallet, Phone
} from 'lucide-react';

type PaymentMode = 'nisir-transfer' | 'bank-deposit' | 'mno-send' | 'mno-receive' | 'send' | 'bills' | 'airtime';

interface Props {
  onSelect: (mode: PaymentMode) => void;
}

const sections = [
  {
    title: 'transfer.walletTransfers',
    items: [
      { key: 'nisir-transfer' as PaymentMode, icon: ArrowLeftRight, labelKey: 'transfer.nisirToNisir', desc: 'transfer.nisirToNisirDesc', color: 'bg-primary' },
      { key: 'send' as PaymentMode, icon: Send, labelKey: 'retail.sendMoney', desc: 'transfer.p2pDesc', color: 'bg-primary/80' },
    ],
  },
  {
    title: 'transfer.bankServices',
    items: [
      { key: 'bank-deposit' as PaymentMode, icon: Building2, labelKey: 'transfer.bankDeposit', desc: 'transfer.bankDepositDesc', color: 'bg-accent' },
    ],
  },
  {
    title: 'transfer.mnoWallets',
    items: [
      { key: 'mno-send' as PaymentMode, icon: Globe, labelKey: 'transfer.sendToMno', desc: 'transfer.sendToMnoDesc', color: 'bg-portal-agency' },
      { key: 'mno-receive' as PaymentMode, icon: Download, labelKey: 'transfer.receiveFromMno', desc: 'transfer.receiveFromMnoDesc', color: 'bg-success' },
    ],
  },
  {
    title: 'transfer.billsAndTopup',
    items: [
      { key: 'bills' as PaymentMode, icon: Receipt, labelKey: 'retail.payBills', desc: 'transfer.billsDesc', color: 'bg-portal-merchant' },
      { key: 'airtime' as PaymentMode, icon: Phone, labelKey: 'retail.buyAirtime', desc: 'transfer.airtimeDesc', color: 'bg-warning' },
    ],
  },
];

const PaymentHub = ({ onSelect }: Props) => {
  const { t } = useLanguage();

  return (
    <div className="px-4 pt-4 pb-6 space-y-5">
      <h2 className="text-lg font-bold text-foreground">{t('common.payments')}</h2>

      {sections.map((section, si) => (
        <div key={si}>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t(section.title)}
          </p>
          <div className="space-y-2">
            {section.items.map((item, ii) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (si * 2 + ii) * 0.04 }}
                  onClick={() => onSelect(item.key)}
                  className="w-full flex items-center gap-3.5 p-3.5 bg-card rounded-xl border border-border hover:shadow-md transition-shadow text-left active:scale-[0.98]"
                >
                  <div className={`h-11 w-11 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">{t(item.labelKey)}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{t(item.desc)}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PaymentHub;
