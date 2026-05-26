import { useState, useEffect } from 'react';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@nisir/hooks/useAuth';
import { useAccounts } from '@nisir/hooks/useAccounts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Calendar, Plus, Pause, Play, Trash2, Clock } from 'lucide-react';

const IBScheduledPayments = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const [payments, setPayments] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form
  const [paymentType, setPaymentType] = useState('transfer');
  const [scheduleType, setScheduleType] = useState('one_time');
  const [fromAccount, setFromAccount] = useState('');
  const [toName, setToName] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [toBank, setToBank] = useState('Nisir Microfinance');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [nextRunDate, setNextRunDate] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(false);

  const fetchPayments = async () => {
    if (!user) return;
    const { data } = await supabase.from('scheduled_payments').select('*').eq('profile_id', user.id).order('next_run_date', { ascending: true });
    if (data) setPayments(data);
  };

  useEffect(() => { fetchPayments(); }, [user]);

  const handleCreate = async () => {
    if (!user || !fromAccount || !amount || !nextRunDate || !toName) { toast.error('Fill required fields'); return; }
    setLoading(true);
    const { error } = await supabase.from('scheduled_payments').insert({
      profile_id: user.id,
      payment_type: paymentType,
      schedule_type: scheduleType,
      from_account_id: fromAccount,
      to_account_number: toAccount,
      to_bank: toBank,
      to_name: toName,
      amount: parseFloat(amount),
      description,
      next_run_date: nextRunDate,
      requires_approval: requiresApproval,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Scheduled payment created');
      setShowAdd(false);
      resetForm();
      fetchPayments();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setPaymentType('transfer'); setScheduleType('one_time'); setFromAccount('');
    setToName(''); setToAccount(''); setToBank('Nisir Microfinance');
    setAmount(''); setDescription(''); setNextRunDate(''); setRequiresApproval(false);
  };

  const togglePause = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    await supabase.from('scheduled_payments').update({ status: newStatus, is_active: newStatus === 'active' }).eq('id', id);
    toast.success(`Payment ${newStatus}`);
    fetchPayments();
  };

  const deletePayment = async (id: string) => {
    await supabase.from('scheduled_payments').delete().eq('id', id);
    toast.success('Payment cancelled');
    fetchPayments();
  };

  const executeNow = async (payment: any) => {
    try {
      const { data, error } = await supabase.rpc('process_bill_payment', {
        p_account_id: payment.from_account_id,
        p_biller_name: payment.to_name,
        p_biller_account: payment.to_account_number || 'N/A',
        p_amount: payment.amount,
        p_fee: 5,
      });
      if (error) throw error;
      const result = data as any;
      if (!result.success) throw new Error(result.error);

      // Update last run
      const updates: any = { last_run_date: new Date().toISOString().split('T')[0] };
      if (payment.schedule_type === 'one_time') updates.status = 'completed';
      else if (payment.schedule_type === 'monthly') {
        const next = new Date(payment.next_run_date);
        next.setMonth(next.getMonth() + 1);
        updates.next_run_date = next.toISOString().split('T')[0];
      } else if (payment.schedule_type === 'weekly') {
        const next = new Date(payment.next_run_date);
        next.setDate(next.getDate() + 7);
        updates.next_run_date = next.toISOString().split('T')[0];
      }
      await supabase.from('scheduled_payments').update(updates).eq('id', payment.id);

      toast.success(`Payment of ${payment.amount.toLocaleString()} ETB executed`);
      fetchPayments();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{t('ib.scheduled.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('ib.scheduled.subtitle')}</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> {t('ib.scheduled.newSchedule')}</Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground">{t('common.active')}</p>
          <p className="text-lg font-bold text-foreground">{payments.filter(p => p.status === 'active').length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground">{t('ib.scheduled.paused')}</p>
          <p className="text-lg font-bold text-muted-foreground">{payments.filter(p => p.status === 'paused').length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground">{t('ib.scheduled.monthlyTotal')}</p>
          <p className="text-lg font-bold text-foreground">
            {payments.filter(p => p.status === 'active' && p.schedule_type === 'monthly').reduce((s, p) => s + p.amount, 0).toLocaleString()} {t('common.etb')}
          </p>
        </CardContent></Card>
      </div>

      {/* Payments list */}
      {payments.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{t('ib.scheduled.noScheduled')}</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{t('ib.scheduled.payee')}</TableHead>
                  <TableHead className="text-xs">{t('common.type')}</TableHead>
                  <TableHead className="text-xs">{t('ib.scheduled.frequency')}</TableHead>
                  <TableHead className="text-xs text-right">{t('common.amount')}</TableHead>
                  <TableHead className="text-xs">{t('ib.scheduled.nextRun')}</TableHead>
                  <TableHead className="text-xs">{t('common.status')}</TableHead>
                  <TableHead className="text-xs">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs font-medium">{p.to_name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{p.payment_type}</Badge></TableCell>
                    <TableCell className="text-xs capitalize">{p.schedule_type.replace('_', ' ')}</TableCell>
                    <TableCell className="text-xs text-right font-medium">{p.amount.toLocaleString()} ETB</TableCell>
                    <TableCell className="text-xs">{p.next_run_date ? new Date(p.next_run_date).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'active' ? 'default' : p.status === 'completed' ? 'secondary' : 'outline'} className="text-[10px]">{p.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {p.status !== 'completed' && p.status !== 'cancelled' && (
                          <>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => executeNow(p)} title="Execute now">
                              <Play className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => togglePause(p.id, p.status)} title={p.status === 'active' ? 'Pause' : 'Resume'}>
                              <Pause className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => deletePayment(p.id)} title="Cancel">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t('ib.scheduled.schedulePayment')}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <div><Label className="text-xs">{t('ib.scheduled.paymentType')}</Label>
              <Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">{t('ib.scheduled.fundTransfer')}</SelectItem>
                  <SelectItem value="vendor">{t('ib.vendor.title')}</SelectItem>
                  <SelectItem value="bill">{t('ib.bill.title')}</SelectItem>
                  <SelectItem value="salary">{t('ib.scheduled.salary')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">{t('ib.scheduled.frequency')}</Label>
              <Select value={scheduleType} onValueChange={setScheduleType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">{t('ib.scheduled.oneTime')}</SelectItem>
                  <SelectItem value="weekly">{t('ib.scheduled.weekly')}</SelectItem>
                  <SelectItem value="monthly">{t('ib.scheduled.monthly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">{t('ib.transfer.fromAccount')}</Label>
              <Select value={fromAccount} onValueChange={setFromAccount}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.product_name} — {(a.available_balance || 0).toLocaleString()} ETB</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">{t('ib.scheduled.payeeName')} *</Label><Input value={toName} onChange={e => setToName(e.target.value)} /></div>
            <div><Label className="text-xs">{t('ib.transfer.accountNumber')}</Label><Input value={toAccount} onChange={e => setToAccount(e.target.value)} /></div>
            <div><Label className="text-xs">{t('ib.transfer.bank')}</Label><Input value={toBank} onChange={e => setToBank(e.target.value)} /></div>
            <div><Label className="text-xs">{t('ib.transfer.amountEtb')} *</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
            <div><Label className="text-xs">{t('common.description')}</Label><Input value={description} onChange={e => setDescription(e.target.value)} /></div>
            <div><Label className="text-xs">{t('ib.scheduled.startDate')} *</Label><Input type="date" value={nextRunDate} onChange={e => setNextRunDate(e.target.value)} /></div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">{t('ib.scheduled.requiresApproval')}</Label>
              <Switch checked={requiresApproval} onCheckedChange={setRequiresApproval} />
            </div>
            <Button onClick={handleCreate} disabled={loading} className="w-full">{loading ? t('common.processing') : t('ib.scheduled.createSchedule')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IBScheduledPayments;
