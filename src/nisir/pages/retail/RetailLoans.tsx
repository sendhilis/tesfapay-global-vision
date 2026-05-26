import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts } from '@/hooks/useAccounts';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@/components/MobilePortalLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Wallet, CreditCard, HandCoins, HelpCircle,
  Calculator, FileText, Loader2, TrendingUp, Eye, ArrowRight,
  Calendar, AlertTriangle, Clock
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { differenceInDays, format } from 'date-fns';

import CreditScoreGauge from '@/components/loans/CreditScoreGauge';
import LoanProductCards, { type LoanProduct } from '@/components/loans/LoanProductCards';
import LoanCalculator from '@/components/loans/LoanCalculator';
import LoanApplicationFlow from '@/components/loans/LoanApplicationFlow';
import DisbursementSimulation from '@/components/loans/DisbursementSimulation';
import LoanDetailView from '@/components/loans/LoanDetailView';

type Loan = Tables<'loans'>;

interface NextInstallment {
  due_date: string;
  total_due: number;
  amount_paid: number | null;
  status: string;
  installment_number: number;
}

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/retail' },
  { icon: <Wallet className="h-5 w-5" />, labelKey: 'common.accounts', path: '/retail/accounts' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/retail/payments' },
  { icon: <HandCoins className="h-5 w-5" />, labelKey: 'common.loans', path: '/retail/loans' },
  { icon: <HelpCircle className="h-5 w-5" />, labelKey: 'common.support', path: '/retail/support' },
];

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  disbursed: 'bg-primary/10 text-primary',
  active: 'bg-primary/10 text-primary',
  rejected: 'bg-destructive/10 text-destructive',
  closed: 'bg-muted text-muted-foreground',
  defaulted: 'bg-destructive/10 text-destructive',
};

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

type View = 'discover' | 'score' | 'calculator' | 'apply' | 'my_loans' | 'disburse' | 'loan_detail';

const SIMULATED_SCORE = 752;

const RetailLoans = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const [view, setView] = useState<View>('discover');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextInstallments, setNextInstallments] = useState<Record<string, NextInstallment>>({});
  const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null);
  const [applyAmount, setApplyAmount] = useState(0);
  const [applyTenor, setApplyTenor] = useState(6);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  const fetchLoans = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('loans').select('*').eq('profile_id', user.id).order('created_at', { ascending: false });
    if (data) {
      setLoans(data);
      // Fetch next pending/overdue installment for each active loan
      const activeIds = data.filter(l => l.status === 'active' || l.status === 'disbursed').map(l => l.id);
      if (activeIds.length > 0) {
        const { data: schedules } = await supabase
          .from('loan_schedules')
          .select('loan_id, due_date, total_due, amount_paid, status, installment_number')
          .in('loan_id', activeIds)
          .in('status', ['pending', 'overdue', 'partial'])
          .order('due_date', { ascending: true });
        if (schedules) {
          const map: Record<string, NextInstallment> = {};
          schedules.forEach(s => {
            if (!map[s.loan_id]) map[s.loan_id] = s;
          });
          setNextInstallments(map);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchLoans(); }, [user]);

  const handleProductSelect = (product: LoanProduct) => {
    setSelectedProduct(product);
    setView('calculator');
  };

  const handleApplyFromCalc = (product: LoanProduct, amount: number, tenor: number) => {
    setSelectedProduct(product);
    setApplyAmount(amount);
    setApplyTenor(tenor);
    setView('apply');
  };

  const handleApplicationComplete = () => {
    setView('disburse');
    fetchLoans();
  };

  const handleLoanClick = (loan: Loan) => {
    setSelectedLoan(loan);
    setView('loan_detail');
  };

  const navChips = [
    { key: 'discover' as View, label: 'Discover', icon: TrendingUp },
    { key: 'score' as View, label: 'Credit Score', icon: Eye },
    { key: 'calculator' as View, label: 'Calculator', icon: Calculator },
    { key: 'my_loans' as View, label: 'My Loans', icon: FileText },
  ];

  return (
    <MobilePortalLayout portalName="Nisir" portalColor="retail" navItems={navItems} showBack backPath="/retail">
      <div className="px-4 pt-3 pb-6">
        {/* Navigation chips for non-detail views */}
        {view !== 'apply' && view !== 'disburse' && view !== 'loan_detail' && (
          <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
            {navChips.map((item) => (
              <button key={item.key} onClick={() => setView(item.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  view === item.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* DISCOVER */}
          {view === 'discover' && (
            <motion.div key="discover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.button onClick={() => setView('score')} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="w-full bg-gradient-to-r from-primary/15 to-accent/15 rounded-2xl p-4 border border-primary/20 mb-5 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Your Credit Score</p>
                    <p className="text-2xl font-extrabold text-foreground mt-0.5">{SIMULATED_SCORE}<span className="text-sm font-medium text-muted-foreground">/900</span></p>
                    <p className="text-xs text-success font-semibold mt-0.5">Very Good — Pre-approved</p>
                  </div>
                  <div className="w-14 h-14 rounded-full border-4 border-success/30 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-success" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-primary font-medium">
                  <span>View full breakdown</span><ArrowRight className="h-3 w-3" />
                </div>
              </motion.button>
              <LoanProductCards onSelect={handleProductSelect} />
              {loans.length > 0 && (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                  onClick={() => setView('my_loans')}
                  className="w-full mt-4 bg-card rounded-xl border border-border p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">{loans.length} Active Application{loans.length > 1 ? 's' : ''}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </motion.button>
              )}
            </motion.div>
          )}

          {view === 'score' && (
            <motion.div key="score" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CreditScoreGauge score={SIMULATED_SCORE} />
              <button onClick={() => setView('discover')} className="w-full mt-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
                Explore Loan Products
              </button>
            </motion.div>
          )}

          {view === 'calculator' && (
            <motion.div key="calc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoanCalculator initialProduct={selectedProduct || undefined} onApply={handleApplyFromCalc} />
            </motion.div>
          )}

          {view === 'apply' && selectedProduct && (
            <motion.div key="apply" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoanApplicationFlow product={selectedProduct} amount={applyAmount} tenor={applyTenor}
                creditScore={SIMULATED_SCORE} onBack={() => setView('calculator')} onComplete={handleApplicationComplete} />
            </motion.div>
          )}

          {view === 'disburse' && (
            <motion.div key="disburse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DisbursementSimulation amount={applyAmount} accountName={accounts.find(a => a.is_primary)?.product_name || 'Nisir Savings'} onComplete={() => {}} />
              <button onClick={() => setView('my_loans')} className="w-full mt-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
                View My Loans
              </button>
            </motion.div>
          )}

          {view === 'loan_detail' && selectedLoan && (
            <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoanDetailView loan={selectedLoan} onBack={() => setView('my_loans')} onRepaymentDone={() => { fetchLoans(); setView('my_loans'); }} />
            </motion.div>
          )}

          {view === 'my_loans' && (
            <motion.div key="myloans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : loans.length === 0 ? (
                <div className="text-center py-10">
                  <HandCoins className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No loan applications yet</p>
                  <button onClick={() => setView('discover')} className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold">
                    Explore Loans
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {loans.map((loan, i) => (
                    <motion.button key={loan.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      onClick={() => handleLoanClick(loan)}
                      className="w-full text-left bg-card rounded-2xl border border-border p-4 space-y-3 hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-foreground capitalize">{loan.product_type} Loan</p>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${statusColors[loan.status || 'draft']}`}>
                          {loan.status?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-[9px] text-muted-foreground">Amount</p>
                          <p className="text-xs font-extrabold text-foreground">{fmt(loan.amount)}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-[9px] text-muted-foreground">Monthly</p>
                          <p className="text-xs font-bold text-primary">{fmt(loan.monthly_installment || 0)}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-[9px] text-muted-foreground">Tenor</p>
                          <p className="text-xs font-bold text-foreground">{loan.tenor_months}m</p>
                        </div>
                      </div>
                      {(loan.status === 'active' || loan.status === 'disbursed') && loan.outstanding_balance && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Outstanding</span>
                            <span className="font-bold text-foreground">{fmt(loan.outstanding_balance)} ETB</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(5, ((loan.total_payable || 0) - loan.outstanding_balance) / (loan.total_payable || 1) * 100)}%` }} />
                          </div>
                        </div>
                      )}
                      {/* Next repayment info */}
                      {(loan.status === 'active' || loan.status === 'disbursed') && nextInstallments[loan.id] && (() => {
                        const inst = nextInstallments[loan.id];
                        const remaining = inst.total_due - (inst.amount_paid || 0);
                        const daysUntil = differenceInDays(new Date(inst.due_date), new Date());
                        const isOverdue = inst.status === 'overdue';
                        const isUrgent = daysUntil <= 3 && !isOverdue;
                        return (
                          <div className={`flex items-center gap-2 p-2 rounded-lg text-[10px] ${
                            isOverdue ? 'bg-destructive/10 border border-destructive/20' :
                            isUrgent ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30' :
                            'bg-muted/50'
                          }`}>
                            {isOverdue ? <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" /> :
                             isUrgent ? <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" /> :
                             <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                            <div className="flex-1">
                              <span className={`font-semibold ${isOverdue ? 'text-destructive' : isUrgent ? 'text-amber-600' : 'text-foreground'}`}>
                                #{inst.installment_number} — {isOverdue ? `${Math.abs(daysUntil)}d overdue` : isUrgent ? `Due in ${daysUntil}d` : `Due ${format(new Date(inst.due_date), 'dd MMM')}`}
                              </span>
                            </div>
                            <span className={`font-extrabold ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>{fmt(remaining)} ETB</span>
                          </div>
                        );
                      })()}
                      <div className="flex items-center gap-1 text-[10px] text-primary font-medium">
                        <span>View details</span><ArrowRight className="h-3 w-3" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobilePortalLayout>
  );
};

export default RetailLoans;
