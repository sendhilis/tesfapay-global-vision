import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@nisir/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Calendar, CreditCard, ChevronRight, Clock, Bell } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';

interface UpcomingInstallment {
  id: string;
  loan_id: string;
  installment_number: number;
  due_date: string;
  total_due: number;
  amount_paid: number | null;
  status: string;
  product_type?: string;
}

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

const LoanRepaymentTracker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [installments, setInstallments] = useState<UpcomingInstallment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      // Get all active/disbursed loans
      const { data: loans } = await supabase
        .from('loans')
        .select('id, product_type')
        .eq('profile_id', user.id)
        .in('status', ['active', 'disbursed']);

      if (!loans || loans.length === 0) { setLoading(false); return; }

      const loanIds = loans.map(l => l.id);
      const loanMap = Object.fromEntries(loans.map(l => [l.id, l.product_type]));

      // Get ALL pending/overdue/partial installments (not just 5)
      const { data: schedules } = await supabase
        .from('loan_schedules')
        .select('id, loan_id, installment_number, due_date, total_due, amount_paid, status')
        .in('loan_id', loanIds)
        .in('status', ['pending', 'overdue', 'partial'])
        .order('due_date', { ascending: true });

      if (schedules) {
        // Show the next upcoming installment per loan + all overdue ones
        const overdue = schedules.filter(s => s.status === 'overdue');
        const pendingByLoan: Record<string, typeof schedules[0]> = {};
        schedules.filter(s => s.status !== 'overdue').forEach(s => {
          if (!pendingByLoan[s.loan_id]) pendingByLoan[s.loan_id] = s;
        });
        const combined = [...overdue, ...Object.values(pendingByLoan)];
        // Sort: overdue first, then by due_date
        combined.sort((a, b) => {
          if (a.status === 'overdue' && b.status !== 'overdue') return -1;
          if (a.status !== 'overdue' && b.status === 'overdue') return 1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });
        setInstallments(combined.map(s => ({ ...s, product_type: loanMap[s.loan_id] })));
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading || installments.length === 0) return null;

  const overdueItems = installments.filter(i => i.status === 'overdue');
  const upcomingItems = installments.filter(i => i.status !== 'overdue');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Loan Repayments</h3>
        </div>
        <button onClick={() => navigate('/retail/loans')} className="text-xs text-primary font-medium flex items-center gap-0.5">
          View all <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Overdue alert */}
      {overdueItems.length > 0 && (
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 space-y-2"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <p className="text-xs font-bold text-destructive">
              {overdueItems.length} Overdue Payment{overdueItems.length > 1 ? 's' : ''}
            </p>
          </div>
          {overdueItems.map(item => {
            const daysOver = differenceInDays(new Date(), new Date(item.due_date));
            const remaining = item.total_due - (item.amount_paid || 0);
            return (
              <button
                key={item.id}
                onClick={() => navigate('/retail/loans')}
                className="w-full flex items-center justify-between bg-background/60 rounded-lg p-2.5 text-left"
              >
                <div>
                  <p className="text-[11px] font-semibold text-foreground capitalize">
                    {item.product_type} Loan — #{item.installment_number}
                  </p>
                  <p className="text-[10px] text-destructive font-medium">
                    {daysOver} day{daysOver > 1 ? 's' : ''} overdue
                  </p>
                </div>
                <p className="text-xs font-extrabold text-destructive">{fmt(remaining)} ETB</p>
              </button>
            );
          })}
        </motion.div>
      )}

      {/* Upcoming installments */}
      {upcomingItems.slice(0, 3).map((item, i) => {
        const daysUntil = differenceInDays(new Date(item.due_date), new Date());
        const remaining = item.total_due - (item.amount_paid || 0);
        const isUrgent = daysUntil <= 3;

        return (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            onClick={() => navigate('/retail/loans')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
              isUrgent
                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30'
                : 'bg-card border-border'
            }`}
          >
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
              isUrgent ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-muted'
            }`}>
              {isUrgent ? (
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <Calendar className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-foreground capitalize truncate">
                {item.product_type} Loan — #{item.installment_number}
              </p>
              <p className={`text-[10px] font-medium ${isUrgent ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                {isUrgent ? `Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}` : `Due ${format(new Date(item.due_date), 'dd MMM yyyy')}`}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-extrabold text-foreground">{fmt(remaining)}</p>
              <p className="text-[9px] text-muted-foreground">ETB</p>
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
};

export default LoanRepaymentTracker;
