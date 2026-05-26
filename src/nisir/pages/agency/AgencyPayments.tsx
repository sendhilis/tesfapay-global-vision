import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import MobilePortalLayout from '@/components/MobilePortalLayout';
import { motion } from 'framer-motion';
import {
  Home, CreditCard, Users, BarChart3, FileText,
  ArrowDownToLine, ArrowUpFromLine, Receipt, Smartphone,
  Send, Zap, Droplets, Wifi, GraduationCap, Eye, PiggyBank,
  RotateCcw, MessageSquareWarning, ClipboardCheck, Trophy
} from 'lucide-react';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/agency' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/agency/payments' },
  { icon: <Users className="h-5 w-5" />, labelKey: 'admin.customers', path: '/agency/customers' },
  { icon: <BarChart3 className="h-5 w-5" />, labelKey: 'agency.reports', path: '/agency/reports' },
  { icon: <FileText className="h-5 w-5" />, labelKey: 'common.profile', path: '/agency/profile' },
];

const AgencyPayments = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const services = [
    { icon: ArrowDownToLine, label: t('agency.cashIn'), desc: t('agency.cashInTotal'), color: 'bg-success', path: '/agency/cash-in' },
    { icon: ArrowUpFromLine, label: t('agency.cashOut'), desc: t('agency.cashOutTotal'), color: 'bg-portal-merchant', path: '/agency/cash-out' },
    { icon: Send, label: 'Transfer', desc: 'Customer to customer', color: 'bg-primary', path: '/agency/transfer' },
    { icon: Eye, label: 'Balance Inquiry', desc: 'Check balance & statement', color: 'bg-info', path: '/agency/balance-inquiry' },
    { icon: Receipt, label: t('agency.billPay'), desc: t('retail.payBills'), color: 'bg-amber-500', path: '/agency/bill-pay' },
    { icon: Smartphone, label: t('agency.airtime'), desc: t('retail.buyAirtime'), color: 'bg-sky-500', path: '/agency/airtime' },
    { icon: Send, label: t('agency.loanRepay'), desc: t('agency.loanRepay'), color: 'bg-portal-agency', path: '/agency/loan-repay' },
    { icon: PiggyBank, label: 'Savings Collection', desc: 'Group/recurring deposits', color: 'bg-teal-500', path: '/agency/savings-collection' },
    { icon: RotateCcw, label: 'Reversal', desc: 'Reverse transactions', color: 'bg-destructive', path: '/agency/reversal' },
    { icon: MessageSquareWarning, label: 'Complaints', desc: 'Register issues', color: 'bg-amber-600', path: '/agency/complaints' },
    { icon: ClipboardCheck, label: 'EOD Recon', desc: 'End of day balancing', color: 'bg-slate-500', path: '/agency/eod' },
    { icon: Trophy, label: 'Performance', desc: 'Scorecard & badges', color: 'bg-purple-500', path: '/agency/performance' },
  ];

  const billers = [
    { icon: Zap, name: 'Ethiopian Electric', category: 'Electricity' },
    { icon: Droplets, name: 'Addis Water', category: 'Water' },
    { icon: Wifi, name: 'Ethio Telecom', category: 'Telecom' },
    { icon: GraduationCap, name: 'School Fee', category: 'Education' },
  ];

  return (
    <MobilePortalLayout portalName="Nisir Agent" portalColor="agency" navItems={navItems} showBack backPath="/agency">
      <div className="px-4 pt-4 pb-6 space-y-5">
        <h2 className="text-lg font-bold text-foreground">{t('common.payments')}</h2>

        <div className="grid grid-cols-2 gap-3">
          {services.map((svc, i) => {
            const Icon = svc.icon;
            return (
              <motion.button
                key={svc.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(svc.path)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:shadow-md transition-shadow"
              >
                <div className={`h-12 w-12 rounded-xl ${svc.color} flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-sm font-semibold text-foreground">{svc.label}</span>
                <span className="text-[10px] text-muted-foreground">{svc.desc}</span>
              </motion.button>
            );
          })}
        </div>

        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">Quick Bill Pay</h3>
          <div className="space-y-2">
            {billers.map((b) => {
              const Icon = b.icon;
              return (
                <motion.button
                  key={b.name}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/agency/bill-pay')}
                  className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border border-border text-left"
                >
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{b.name}</p>
                    <p className="text-[10px] text-muted-foreground">{b.category}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </MobilePortalLayout>
  );
};

export default AgencyPayments;
