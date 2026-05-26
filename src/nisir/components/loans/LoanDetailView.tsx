import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Calendar, FileText, AlertTriangle, CreditCard,
  ChevronDown, ChevronUp, CheckCircle2, Clock, XCircle, Loader2,
  Receipt, TrendingDown, Banknote
} from 'lucide-react';
import { useLoanSchedule, useLoanEvents, useLoanStatements, useLoanPenalties } from '@/hooks/useLoans';
import type { Tables } from '@/integrations/supabase/types';
import LoanRepaymentFlow from './LoanRepaymentFlow';
import EarlyRepaymentCalculator from './EarlyRepaymentCalculator';

type Loan = Tables<'loans'>;
const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
  paid: <CheckCircle2 className="h-3.5 w-3.5 text-success" />,
  partial: <TrendingDown className="h-3.5 w-3.5 text-amber-500" />,
  overdue: <AlertTriangle className="h-3.5 w-3.5 text-destructive" />,
  waived: <XCircle className="h-3.5 w-3.5 text-muted-foreground" />,
};

type Tab = 'schedule' | 'statements' | 'penalties' | 'events';

interface Props {
  loan: Loan;
  onBack: () => void;
  onRepaymentDone: () => void;
}

const LoanDetailView = ({ loan, onBack, onRepaymentDone }: Props) => {
  const [tab, setTab] = useState<Tab>('schedule');
  const [showRepay, setShowRepay] = useState(false);
  const [showEarlyRepay, setShowEarlyRepay] = useState(false);
  const [expandedInstallment, setExpandedInstallment] = useState<number | null>(null);

  const { schedule, loading: scheduleLoading } = useLoanSchedule(loan.id);
  const { events, loading: eventsLoading } = useLoanEvents(loan.id);
  const { statements, loading: statementsLoading } = useLoanStatements(loan.id);
  const { penalties, loading: penaltiesLoading } = useLoanPenalties(loan.id);

  const paidCount = schedule.filter(s => s.status === 'paid').length;
  const overdueCount = schedule.filter(s => s.status === 'overdue').length;
  const totalPenalties = penalties.reduce((s: number, p: any) => s + (p.is_waived ? 0 : p.amount), 0);

  if (showRepay) {
    return (
      <LoanRepaymentFlow
        loan={loan}
        schedule={schedule}
        onBack={() => setShowRepay(false)}
        onComplete={() => { setShowRepay(false); onRepaymentDone(); }}
      />
    );
  }

  if (showEarlyRepay) {
    return (
      <EarlyRepaymentCalculator
        loan={loan}
        schedule={schedule}
        onBack={() => setShowEarlyRepay(false)}
      />
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'schedule', label: 'Schedule', icon: <Calendar className="h-3.5 w-3.5" /> },
    { key: 'statements', label: 'Statements', icon: <FileText className="h-3.5 w-3.5" />, count: statements.length },
    { key: 'penalties', label: 'Penalties', icon: <AlertTriangle className="h-3.5 w-3.5" />, count: penalties.length },
    { key: 'events', label: 'Events', icon: <Receipt className="h-3.5 w-3.5" />, count: events.length },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground capitalize">{loan.product_type} Loan</p>
          <p className="text-[10px] text-muted-foreground">ID: {loan.id.slice(0, 8)}...</p>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${
          loan.status === 'active' || loan.status === 'disbursed' ? 'bg-primary/10 text-primary' :
          loan.status === 'defaulted' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
        }`}>{loan.status?.replace('_', ' ')}</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-3 border border-primary/20">
          <p className="text-[9px] text-muted-foreground">Outstanding</p>
          <p className="text-base font-extrabold text-foreground">{fmt(loan.outstanding_balance || 0)}</p>
          <p className="text-[9px] text-muted-foreground">ETB</p>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border">
          <p className="text-[9px] text-muted-foreground">Monthly</p>
          <p className="text-base font-extrabold text-primary">{fmt(loan.monthly_installment || 0)}</p>
          <p className="text-[9px] text-muted-foreground">ETB</p>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border">
          <p className="text-[9px] text-muted-foreground">Paid / Total</p>
          <p className="text-sm font-bold text-foreground">{paidCount}/{schedule.length}</p>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border">
          <p className="text-[9px] text-muted-foreground">Overdue / Penalties</p>
          <p className="text-sm font-bold text-destructive">{overdueCount} / {fmt(totalPenalties)}</p>
        </div>
      </div>

      {/* Progress bar */}
      {schedule.length > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Repayment progress</span>
            <span>{Math.round((paidCount / schedule.length) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(paidCount / schedule.length) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Action buttons */}
      {(loan.status === 'active' || loan.status === 'disbursed') && (
        <div className="flex gap-2">
          <button onClick={() => setShowRepay(true)}
            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-1.5">
            <CreditCard className="h-4 w-4" /> Pay Installment
          </button>
          <button onClick={() => setShowEarlyRepay(true)}
            className="py-3 px-4 rounded-xl bg-accent/10 text-accent-foreground font-semibold text-sm border border-accent/20">
            <Banknote className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-semibold transition-colors ${
              tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}>
            {t.icon}
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="bg-primary/10 text-primary px-1 rounded text-[8px]">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {tab === 'schedule' && (
          <motion.div key="schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1.5">
            {scheduleLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : schedule.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No amortization schedule generated yet</p>
            ) : schedule.map((s: any, i: number) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <button
                  onClick={() => setExpandedInstallment(expandedInstallment === s.installment_number ? null : s.installment_number)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${
                    s.status === 'overdue' ? 'bg-destructive/5 border-destructive/20' :
                    s.status === 'paid' ? 'bg-success/5 border-success/20' :
                    'bg-card border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {statusIcons[s.status] || statusIcons.pending}
                      <div>
                        <p className="text-xs font-semibold text-foreground">Installment #{s.installment_number}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(s.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-foreground">{fmt(s.total_due)} ETB</p>
                      {expandedInstallment === s.installment_number ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </div>
                  </div>
                </button>
                <AnimatePresence>
                  {expandedInstallment === s.installment_number && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden">
                      <div className="p-3 space-y-1 text-[10px]">
                        {[
                          ['Opening Balance', fmt(s.opening_balance)],
                          ['Principal', fmt(s.principal)],
                          ['Interest', fmt(s.interest)],
                          ['Penalty', fmt(s.penalty_amount || 0)],
                          ['Total Due', fmt(s.total_due)],
                          ['Amount Paid', fmt(s.amount_paid || 0)],
                          ['Closing Balance', fmt(s.closing_balance)],
                        ].map(([l, v]) => (
                          <div key={l} className="flex justify-between">
                            <span className="text-muted-foreground">{l}</span>
                            <span className="font-semibold text-foreground">{v} ETB</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}

        {tab === 'statements' && (
          <motion.div key="statements" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {statementsLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : statements.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No statements generated yet</p>
            ) : statements.map((st: any) => (
              <div key={st.id} className="bg-card rounded-xl border border-border p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-foreground">
                    {new Date(st.statement_period_start).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                  </p>
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                {[
                  ['Opening Balance', fmt(st.opening_balance)],
                  ['Repayments', fmt(st.repayments)],
                  ['Interest Charged', fmt(st.interest_charged)],
                  ['Penalties', fmt(st.penalties_charged)],
                  ['Waivers Applied', `-${fmt(st.waivers_applied)}`],
                  ['Closing Balance', fmt(st.closing_balance)],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">{l}</span>
                    <span className="font-semibold text-foreground">{v} ETB</span>
                  </div>
                ))}
              </div>
            ))}
          </motion.div>
        )}

        {tab === 'penalties' && (
          <motion.div key="penalties" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {penaltiesLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : penalties.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No penalties — keep up the good work!</p>
              </div>
            ) : penalties.map((p: any) => (
              <div key={p.id} className={`rounded-xl border p-3 space-y-1 ${p.is_waived ? 'bg-muted/30 border-border' : 'bg-destructive/5 border-destructive/20'}`}>
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold capitalize text-foreground">{p.penalty_type.replace('_', ' ')}</p>
                  {p.is_waived && <span className="text-[9px] bg-success/10 text-success px-2 py-0.5 rounded-full font-semibold">Waived</span>}
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Amount</span>
                  <span className={`font-bold ${p.is_waived ? 'line-through text-muted-foreground' : 'text-destructive'}`}>{fmt(p.amount)} ETB</span>
                </div>
                {p.days_overdue > 0 && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Days overdue</span>
                    <span className="font-semibold text-foreground">{p.days_overdue}</span>
                  </div>
                )}
                {p.waiver_reason && (
                  <p className="text-[10px] text-muted-foreground italic">Waiver: {p.waiver_reason}</p>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {tab === 'events' && (
          <motion.div key="events" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1.5">
            {eventsLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : events.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No events recorded</p>
            ) : events.map((e: any, i: number) => (
              <motion.div key={e.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-start gap-3 p-2.5 rounded-lg bg-card border border-border">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${e.posted_to_cbs ? 'bg-success' : 'bg-amber-400'}`} />
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-foreground">{e.event_type.replace(/_/g, ' ')}</p>
                  {e.description && <p className="text-[9px] text-muted-foreground">{e.description}</p>}
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    {new Date(e.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {e.posted_to_cbs && <span className="ml-1 text-success">• CBS Posted</span>}
                  </p>
                </div>
                {e.amount > 0 && <p className="text-[10px] font-bold text-foreground">{fmt(e.amount)}</p>}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoanDetailView;
