import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts } from '@/hooks/useAccounts';
import { useLoans } from '@/hooks/useLoans';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { CreditCard, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';

const IBLoanRepayments = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { loans, loading: loansLoading, refetch: refetchLoans } = useLoans();
  const { accounts, refetch: refetchAccounts } = useAccounts();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [showRepay, setShowRepay] = useState(false);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayFrom, setRepayFrom] = useState('');
  const [repayScheduleId, setRepayScheduleId] = useState('');
  const [processing, setProcessing] = useState(false);

  const activeLoans = loans.filter(l => ['disbursed', 'active'].includes(l.status || ''));

  const fetchSchedules = async (loanId: string) => {
    const { data } = await supabase.from('loan_schedules').select('*').eq('loan_id', loanId).order('installment_number', { ascending: true });
    if (data) setSchedules(data);
  };

  const handleSelectLoan = (loan: any) => {
    setSelectedLoan(loan);
    fetchSchedules(loan.id);
  };

  const handleRepay = async () => {
    if (!user || !selectedLoan || !repayAmount || !repayFrom) return;
    setProcessing(true);
    const amount = parseFloat(repayAmount);

    try {
      const account = accounts.find(a => a.id === repayFrom);
      if (!account || (account.available_balance || 0) < amount) throw new Error('Insufficient balance');

      // Debit account
      await supabase.from('accounts').update({
        balance: (account.balance || 0) - amount,
        available_balance: (account.available_balance || 0) - amount,
      }).eq('id', repayFrom);

      // Record transaction
      await supabase.from('transactions').insert({
        account_id: repayFrom,
        profile_id: user.id,
        transaction_type: 'transfer',
        amount,
        fee: 0,
        direction: 'debit',
        status: 'completed',
        description: `Loan repayment — ${selectedLoan.product_type}`,
        reference: 'LRPY-' + Date.now().toString(36).toUpperCase(),
      });

      // Update loan outstanding
      await supabase.from('loans').update({
        outstanding_balance: Math.max(0, (selectedLoan.outstanding_balance || 0) - amount),
      }).eq('id', selectedLoan.id);

      // Update schedule if specific installment
      if (repayScheduleId) {
        const sched = schedules.find(s => s.id === repayScheduleId);
        if (sched) {
          await supabase.from('loan_schedules').update({
            amount_paid: (sched.amount_paid || 0) + amount,
            status: (sched.amount_paid || 0) + amount >= sched.total_due ? 'paid' : 'partial',
            paid_at: new Date().toISOString(),
          }).eq('id', repayScheduleId);
        }
      }

      // Log event
      await supabase.from('loan_events').insert({
        loan_id: selectedLoan.id,
        profile_id: user.id,
        event_type: 'repayment',
        amount,
        description: `IB repayment of ${amount.toLocaleString()} ETB`,
      });

      toast.success(`Repayment of ${amount.toLocaleString()} ETB processed`);
      setShowRepay(false);
      setRepayAmount(''); setRepayScheduleId('');
      refetchLoans();
      refetchAccounts();
      fetchSchedules(selectedLoan.id);
      setSelectedLoan({ ...selectedLoan, outstanding_balance: Math.max(0, (selectedLoan.outstanding_balance || 0) - amount) });
    } catch (err: any) {
      toast.error(err.message);
    }
    setProcessing(false);
  };

  const paidPct = (loan: any) => {
    if (!loan.total_payable || loan.total_payable === 0) return 0;
    return Math.min(100, ((loan.total_payable - (loan.outstanding_balance || 0)) / loan.total_payable) * 100);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground">{t('ib.loan.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('ib.loan.subtitle')}</p>
      </div>

      {activeLoans.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{t('ib.loan.noActiveLoans')}</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {activeLoans.map(loan => (
            <Card key={loan.id} className={`cursor-pointer transition-all ${selectedLoan?.id === loan.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`} onClick={() => handleSelectLoan(loan)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">{loan.product_type} Loan</p>
                    <p className="text-xs text-muted-foreground">{loan.tenor_months} months @ {loan.interest_rate}%</p>
                  </div>
                  <Badge variant={loan.status === 'disbursed' ? 'default' : 'secondary'}>{loan.status}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground">{t('ib.loan.loanAmount')}</p>
                    <p className="text-sm font-bold text-foreground">{loan.amount.toLocaleString()} {t('common.etb')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">{t('ib.loan.outstanding')}</p>
                    <p className="text-sm font-bold text-destructive">{(loan.outstanding_balance || 0).toLocaleString()} {t('common.etb')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">{t('ib.loan.dueDate')}</p>
                    <p className="text-sm font-medium text-foreground">{loan.next_due_date ? new Date(loan.next_due_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
                <Progress value={paidPct(loan)} className="h-2" />
                <p className="text-[10px] text-muted-foreground mt-1">{paidPct(loan).toFixed(0)}% {t('ib.loan.repaid')}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule table for selected loan */}
      {selectedLoan && schedules.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">{t('ib.loan.repaymentSchedule')} — {selectedLoan.product_type}</CardTitle>
            <Button size="sm" onClick={() => setShowRepay(true)}>
              <CreditCard className="h-3 w-3 mr-1" /> {t('ib.loan.makePayment')}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead className="text-xs">#</TableHead>
                     <TableHead className="text-xs">{t('ib.loan.dueDate')}</TableHead>
                     <TableHead className="text-xs text-right">{t('ib.loan.principal')}</TableHead>
                     <TableHead className="text-xs text-right">{t('ib.loan.interest')}</TableHead>
                     <TableHead className="text-xs text-right">{t('common.total')}</TableHead>
                     <TableHead className="text-xs text-right">{t('ib.loan.paid')}</TableHead>
                     <TableHead className="text-xs">{t('common.status')}</TableHead>
                     <TableHead className="text-xs">{t('common.action')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map(s => {
                    const isOverdue = new Date(s.due_date) < new Date() && s.status !== 'paid';
                    return (
                      <TableRow key={s.id} className={isOverdue ? 'bg-destructive/5' : ''}>
                        <TableCell className="text-xs">{s.installment_number}</TableCell>
                        <TableCell className="text-xs">{new Date(s.due_date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs text-right">{s.principal.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right">{s.interest.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right font-medium">{s.total_due.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right">{(s.amount_paid || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={s.status === 'paid' ? 'default' : isOverdue ? 'destructive' : 'secondary'} className="text-[10px]">
                            {isOverdue && s.status !== 'paid' ? t('ib.loan.overdue') : s.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {s.status !== 'paid' && (
                            <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={(e) => {
                              e.stopPropagation();
                              setRepayScheduleId(s.id);
                              setRepayAmount(String(s.total_due - (s.amount_paid || 0)));
                              setShowRepay(true);
                             }}>
                               {t('ib.loan.pay')}
                             </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Repay Dialog */}
      <Dialog open={showRepay} onOpenChange={setShowRepay}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('ib.loan.loanRepayment')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Loan</p>
              <p className="text-sm font-medium text-foreground capitalize">{selectedLoan?.product_type} — Outstanding: {(selectedLoan?.outstanding_balance || 0).toLocaleString()} ETB</p>
            </div>
            <div><Label className="text-xs">{t('ib.transfer.fromAccount')}</Label>
              <Select value={repayFrom} onValueChange={setRepayFrom}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.product_name} — {(a.available_balance || 0).toLocaleString()} ETB</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">{t('ib.transfer.amountEtb')}</Label><Input type="number" value={repayAmount} onChange={e => setRepayAmount(e.target.value)} /></div>
            <Button onClick={handleRepay} disabled={processing} className="w-full">{processing ? t('common.processing') : t('ib.loan.confirmRepayment')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IBLoanRepayments;
