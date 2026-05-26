import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@nisir/hooks/useAuth';
import { useAccounts } from '@nisir/hooks/useAccounts';
import { useLoans } from '@nisir/hooks/useLoans';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, BarChart3, TrendingUp, TrendingDown, Wallet, CreditCard, Calendar, PieChart } from 'lucide-react';

const IBCashManagement = () => {
  const { user } = useAuth();
  const { accounts, totalBalance } = useAccounts();
  const { loans } = useLoans();
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [salaryBatches, setSalaryBatches] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [scheduledPayments, setScheduledPayments] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (!user) return;
    // Recent transactions for cash flow
    supabase.from('transactions').select('*').eq('profile_id', user.id)
      .order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => { if (data) setRecentTx(data); });

    supabase.from('salary_batches').select('*').eq('profile_id', user.id)
      .order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setSalaryBatches(data); });

    supabase.from('approval_requests').select('id').eq('profile_id', user.id).eq('status', 'pending')
      .then(({ data }) => { if (data) setPendingApprovals(data.length); });

    supabase.from('scheduled_payments').select('*').eq('profile_id', user.id).eq('status', 'active')
      .order('next_run_date', { ascending: true })
      .then(({ data }) => { if (data) setScheduledPayments(data); });
  }, [user]);

  const activeLoans = loans.filter(l => ['disbursed', 'active'].includes(l.status || ''));
  const totalOutstanding = activeLoans.reduce((s, l) => s + (l.outstanding_balance || 0), 0);
  const totalMonthlyEMI = activeLoans.reduce((s, l) => s + (l.monthly_installment || 0), 0);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayCredits = recentTx.filter(t => t.direction === 'credit' && t.created_at?.startsWith(todayStr)).reduce((s, t) => s + t.amount, 0);
  const todayDebits = recentTx.filter(t => t.direction === 'debit' && t.created_at?.startsWith(todayStr)).reduce((s, t) => s + t.amount, 0);

  // Monthly aggregations
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const monthCredits = recentTx.filter(t => t.direction === 'credit' && t.created_at >= monthStart).reduce((s, t) => s + t.amount, 0);
  const monthDebits = recentTx.filter(t => t.direction === 'debit' && t.created_at >= monthStart).reduce((s, t) => s + t.amount, 0);

  // Upcoming scheduled total
  const upcomingScheduledTotal = scheduledPayments.reduce((s, p) => s + p.amount, 0);

  const downloadReport = (type: string) => {
    let csv = '';
    if (type === 'position') {
      csv = 'Account,Type,Balance,Available Balance,Currency\n';
      accounts.forEach(a => {
        csv += `${a.account_number},${a.account_type},${a.balance},${a.available_balance},${a.currency}\n`;
      });
    } else if (type === 'cashflow') {
      csv = 'Date,Reference,Type,Description,Debit,Credit\n';
      recentTx.forEach(t => {
        csv += `${new Date(t.created_at).toLocaleDateString()},${t.reference},${t.transaction_type},${(t.description || '').replace(/,/g, '')},${t.direction === 'debit' ? t.amount : ''},${t.direction === 'credit' ? t.amount : ''}\n`;
      });
    } else if (type === 'payroll') {
      csv = 'Batch Name,Amount,Employees,Status,Date\n';
      salaryBatches.forEach(b => {
        csv += `${b.batch_name},${b.total_amount},${b.total_records},${b.status},${new Date(b.created_at).toLocaleDateString()}\n`;
      });
    } else if (type === 'loans') {
      csv = 'Product,Amount,Outstanding,Rate,Tenor,Next EMI,Status\n';
      activeLoans.forEach(l => {
        csv += `${l.product_type},${l.amount},${l.outstanding_balance},${l.interest_rate}%,${l.tenor_months}m,${l.next_due_date || 'N/A'},${l.status}\n`;
      });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `nisir_${type}_report_${todayStr}.csv`; a.click();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> Cash Management & Reports
        </h1>
        <p className="text-sm text-muted-foreground">Daily position, cash flow analysis, payroll & loan portfolio reports</p>
      </div>

      <Tabs defaultValue="position">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="position"><Wallet className="h-3 w-3 mr-1" /> Daily Position</TabsTrigger>
          <TabsTrigger value="cashflow"><TrendingUp className="h-3 w-3 mr-1" /> Cash Flow</TabsTrigger>
          <TabsTrigger value="payroll"><Calendar className="h-3 w-3 mr-1" /> Payroll</TabsTrigger>
          <TabsTrigger value="loans"><CreditCard className="h-3 w-3 mr-1" /> Loan Portfolio</TabsTrigger>
        </TabsList>

        {/* Daily Position */}
        <TabsContent value="position" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => downloadReport('position')}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-4 text-center">
                <p className="text-[10px] text-muted-foreground">Net Cash Position</p>
                <p className="text-xl font-bold text-foreground">{totalBalance.toLocaleString()} ETB</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-[10px] text-muted-foreground">Today's Credits</p>
                <p className="text-lg font-bold text-green-600">+{todayCredits.toLocaleString()} ETB</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-[10px] text-muted-foreground">Today's Debits</p>
                <p className="text-lg font-bold text-red-500">-{todayDebits.toLocaleString()} ETB</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-[10px] text-muted-foreground">Pending Approvals</p>
                <p className="text-lg font-bold text-foreground">{pendingApprovals}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Account Positions</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Account</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs text-right">Ledger Balance</TableHead>
                    <TableHead className="text-xs text-right">Available Balance</TableHead>
                    <TableHead className="text-xs text-right">Blocked</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs">
                        <p className="font-medium">{a.product_name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">{a.account_number}</p>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] capitalize">{a.account_type}</Badge></TableCell>
                      <TableCell className="text-xs text-right font-medium">{(a.balance || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right font-bold">{(a.available_balance || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right">{(a.blocked_balance || 0).toLocaleString()}</TableCell>
                      <TableCell><Badge variant="default" className="text-[10px]">{a.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Upcoming obligations */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Upcoming Obligations</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-[10px] text-muted-foreground">Monthly EMI (Loans)</p>
                  <p className="text-sm font-bold text-destructive">{totalMonthlyEMI.toLocaleString()} ETB</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-[10px] text-muted-foreground">Scheduled Payments</p>
                  <p className="text-sm font-bold text-foreground">{upcomingScheduledTotal.toLocaleString()} ETB</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-[10px] text-muted-foreground">Net After Obligations</p>
                  <p className="text-sm font-bold text-foreground">
                    {(totalBalance - totalMonthlyEMI - upcomingScheduledTotal).toLocaleString()} ETB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow */}
        <TabsContent value="cashflow" className="space-y-4">
          <div className="flex items-end gap-3">
            <div><Label className="text-xs">From</Label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
            <div><Label className="text-xs">To</Label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
            <Button variant="outline" size="sm" onClick={() => downloadReport('cashflow')}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-5 w-5 mx-auto text-green-600 mb-1" />
                <p className="text-[10px] text-muted-foreground">Month Credits</p>
                <p className="text-lg font-bold text-green-600">+{monthCredits.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingDown className="h-5 w-5 mx-auto text-red-500 mb-1" />
                <p className="text-[10px] text-muted-foreground">Month Debits</p>
                <p className="text-lg font-bold text-red-500">-{monthDebits.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <PieChart className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-[10px] text-muted-foreground">Net Flow</p>
                <p className={`text-lg font-bold ${monthCredits - monthDebits >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {(monthCredits - monthDebits).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Transaction breakdown by type */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Transaction Breakdown (This Month)</CardTitle></CardHeader>
            <CardContent>
              {(() => {
                const byType: Record<string, { count: number; debit: number; credit: number }> = {};
                recentTx.filter(t => t.created_at >= monthStart).forEach(t => {
                  const type = t.transaction_type;
                  if (!byType[type]) byType[type] = { count: 0, debit: 0, credit: 0 };
                  byType[type].count++;
                  if (t.direction === 'debit') byType[type].debit += t.amount;
                  else byType[type].credit += t.amount;
                });
                return (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Transaction Type</TableHead>
                        <TableHead className="text-xs text-right">Count</TableHead>
                        <TableHead className="text-xs text-right">Total Debit</TableHead>
                        <TableHead className="text-xs text-right">Total Credit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(byType).map(([type, data]) => (
                        <TableRow key={type}>
                          <TableCell className="text-xs capitalize">{type.replace('_', ' ')}</TableCell>
                          <TableCell className="text-xs text-right">{data.count}</TableCell>
                          <TableCell className="text-xs text-right text-red-500">{data.debit > 0 ? data.debit.toLocaleString() : '—'}</TableCell>
                          <TableCell className="text-xs text-right text-green-600">{data.credit > 0 ? data.credit.toLocaleString() : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Reports */}
        <TabsContent value="payroll" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => downloadReport('payroll')}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          </div>
          {salaryBatches.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No payroll history</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Batch Name</TableHead>
                      <TableHead className="text-xs text-right">Amount</TableHead>
                      <TableHead className="text-xs text-right">Employees</TableHead>
                      <TableHead className="text-xs text-right">Successful</TableHead>
                      <TableHead className="text-xs text-right">Failed</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaryBatches.map(b => (
                      <TableRow key={b.id}>
                        <TableCell className="text-xs font-medium">{b.batch_name}</TableCell>
                        <TableCell className="text-xs text-right">{b.total_amount.toLocaleString()} ETB</TableCell>
                        <TableCell className="text-xs text-right">{b.total_records}</TableCell>
                        <TableCell className="text-xs text-right text-green-600">{b.successful_records}</TableCell>
                        <TableCell className="text-xs text-right text-red-500">{b.failed_records}</TableCell>
                        <TableCell><Badge variant={b.status === 'completed' ? 'default' : 'secondary'} className="text-[10px] capitalize">{b.status.replace('_', ' ')}</Badge></TableCell>
                        <TableCell className="text-xs">{new Date(b.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Loan Portfolio */}
        <TabsContent value="loans" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => downloadReport('loans')}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-[10px] text-muted-foreground">Total Debt Outstanding</p>
                <p className="text-lg font-bold text-destructive">{totalOutstanding.toLocaleString()} ETB</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-[10px] text-muted-foreground">Monthly EMI Obligation</p>
                <p className="text-lg font-bold text-foreground">{totalMonthlyEMI.toLocaleString()} ETB</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-[10px] text-muted-foreground">Debt-to-Balance Ratio</p>
                <p className={`text-lg font-bold ${totalBalance > 0 ? (totalOutstanding / totalBalance > 0.5 ? 'text-red-500' : 'text-green-600') : 'text-muted-foreground'}`}>
                  {totalBalance > 0 ? ((totalOutstanding / totalBalance) * 100).toFixed(1) + '%' : 'N/A'}
                </p>
              </CardContent>
            </Card>
          </div>

          {activeLoans.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No active loans</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Product</TableHead>
                      <TableHead className="text-xs text-right">Original Amount</TableHead>
                      <TableHead className="text-xs text-right">Outstanding</TableHead>
                      <TableHead className="text-xs">Rate</TableHead>
                      <TableHead className="text-xs">Tenor</TableHead>
                      <TableHead className="text-xs text-right">Monthly EMI</TableHead>
                      <TableHead className="text-xs">Next Due</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeLoans.map(l => (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs font-medium capitalize">{l.product_type}</TableCell>
                        <TableCell className="text-xs text-right">{l.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right font-bold text-destructive">{(l.outstanding_balance || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-xs">{l.interest_rate}%</TableCell>
                        <TableCell className="text-xs">{l.tenor_months}M</TableCell>
                        <TableCell className="text-xs text-right">{(l.monthly_installment || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-xs">{l.next_due_date ? new Date(l.next_due_date).toLocaleDateString() : '—'}</TableCell>
                        <TableCell><Badge variant="default" className="text-[10px] capitalize">{l.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IBCashManagement;
