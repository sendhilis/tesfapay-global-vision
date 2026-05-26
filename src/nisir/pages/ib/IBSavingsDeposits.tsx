import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts } from '@/hooks/useAccounts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Landmark, PiggyBank, Plus, Download, TrendingUp, Calendar, Lock, Unlock } from 'lucide-react';

const fdTenures = [
  { months: 3, rate: 6.5, label: '3 Months' },
  { months: 6, rate: 7.0, label: '6 Months' },
  { months: 12, rate: 8.0, label: '1 Year' },
  { months: 24, rate: 9.0, label: '2 Years' },
  { months: 36, rate: 9.5, label: '3 Years' },
];

const maturityOptions = [
  { value: 'auto_renew', label: 'Auto-Renew (same tenure & rate)' },
  { value: 'transfer_current', label: 'Transfer to Savings/Current Account' },
  { value: 'partial_renew', label: 'Renew 50%, transfer rest' },
];

const IBSavingsDeposits = () => {
  const { user } = useAuth();
  const { accounts, refetch: refetchAccounts } = useAccounts();
  const [fds, setFds] = useState<any[]>([]);
  const [showNewFD, setShowNewFD] = useState(false);
  const [loading, setLoading] = useState(false);

  // FD form
  const [fdAmount, setFdAmount] = useState('');
  const [fdTenure, setFdTenure] = useState('12');
  const [fdFromAccount, setFdFromAccount] = useState('');
  const [fdMaturityInstruction, setFdMaturityInstruction] = useState('auto_renew');

  const savingsAccounts = accounts.filter(a => a.account_type === 'savings');
  const walletAccounts = accounts.filter(a => a.account_type === 'wallet');

  const fetchFDs = async () => {
    if (!user) return;
    const { data } = await supabase.from('fixed_deposits').select('*').eq('profile_id', user.id).order('created_at', { ascending: false });
    if (data) setFds(data);
  };

  useEffect(() => { fetchFDs(); }, [user]);

  const selectedTenure = fdTenures.find(t => t.months === parseInt(fdTenure));
  const fdInterestAmount = selectedTenure && fdAmount
    ? (parseFloat(fdAmount) * selectedTenure.rate / 100 * selectedTenure.months / 12)
    : 0;
  const fdMaturityAmount = parseFloat(fdAmount || '0') + fdInterestAmount;

  const handlePlaceFD = async () => {
    if (!user || !fdAmount || !fdFromAccount || !selectedTenure) return;
    setLoading(true);
    try {
      const amount = parseFloat(fdAmount);
      const account = accounts.find(a => a.id === fdFromAccount);
      if (!account || (account.available_balance || 0) < amount) throw new Error('Insufficient balance');

      const maturityDate = new Date();
      maturityDate.setMonth(maturityDate.getMonth() + selectedTenure.months);

      // Debit source account
      await supabase.from('accounts').update({
        balance: (account.balance || 0) - amount,
        available_balance: (account.available_balance || 0) - amount,
      }).eq('id', fdFromAccount);

      // Record transaction
      await supabase.from('transactions').insert({
        account_id: fdFromAccount,
        profile_id: user.id,
        transaction_type: 'transfer',
        amount,
        fee: 0,
        direction: 'debit',
        status: 'completed',
        description: `Fixed Deposit placement — ${selectedTenure.label} @ ${selectedTenure.rate}%`,
        reference: 'FD-' + Date.now().toString(36).toUpperCase(),
      });

      // Create FD record
      await supabase.from('fixed_deposits').insert({
        profile_id: user.id,
        linked_account_id: fdFromAccount,
        amount,
        tenure_months: selectedTenure.months,
        interest_rate: selectedTenure.rate,
        maturity_date: maturityDate.toISOString().split('T')[0],
        maturity_instruction: fdMaturityInstruction,
      });

      toast.success(`Fixed Deposit of ${amount.toLocaleString()} ETB placed for ${selectedTenure.label}`);
      setShowNewFD(false);
      setFdAmount(''); setFdTenure('12');
      fetchFDs();
      refetchAccounts();
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  const totalFDValue = fds.filter(f => f.status === 'active').reduce((s, f) => s + f.amount, 0);
  const totalInterestEarned = fds.filter(f => f.status === 'active').reduce((s, f) => s + (f.accrued_interest || 0), 0);
  const totalSavingsBalance = savingsAccounts.reduce((s, a) => s + (a.available_balance || 0), 0);

  const daysToMaturity = (maturityDate: string) => {
    const diff = new Date(maturityDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const maturityProgress = (fd: any) => {
    const totalDays = fd.tenure_months * 30;
    const elapsed = totalDays - daysToMaturity(fd.maturity_date);
    return Math.min(100, (elapsed / totalDays) * 100);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-primary" /> Savings & Fixed Deposits
          </h1>
          <p className="text-sm text-muted-foreground">Manage savings accounts and term deposits</p>
        </div>
        <Button size="sm" onClick={() => setShowNewFD(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Fixed Deposit
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <PiggyBank className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-[10px] text-muted-foreground">Total Savings</p>
            <p className="text-lg font-bold text-foreground">{totalSavingsBalance.toLocaleString()} ETB</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Lock className="h-5 w-5 mx-auto text-amber-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">Fixed Deposits</p>
            <p className="text-lg font-bold text-foreground">{totalFDValue.toLocaleString()} ETB</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <p className="text-[10px] text-muted-foreground">Interest Earned</p>
            <p className="text-lg font-bold text-green-600">{totalInterestEarned.toLocaleString()} ETB</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Landmark className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-[10px] text-muted-foreground">Active FDs</p>
            <p className="text-lg font-bold text-foreground">{fds.filter(f => f.status === 'active').length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="savings">
        <TabsList>
          <TabsTrigger value="savings"><PiggyBank className="h-3 w-3 mr-1" /> Savings Accounts</TabsTrigger>
          <TabsTrigger value="fd"><Lock className="h-3 w-3 mr-1" /> Fixed Deposits ({fds.filter(f => f.status === 'active').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="savings" className="space-y-4">
          {savingsAccounts.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No savings accounts</CardContent></Card>
          ) : savingsAccounts.map(acc => (
            <Card key={acc.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{acc.product_name}</p>
                    <p className="text-xs font-mono text-muted-foreground">{acc.account_number}</p>
                  </div>
                  <Badge variant="default" className="text-[10px]">{acc.status}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Available Balance</p>
                    <p className="text-lg font-bold text-foreground">{(acc.available_balance || 0).toLocaleString()} ETB</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Interest Rate</p>
                    <p className="text-sm font-medium text-foreground">{acc.interest_rate}% p.a.</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Month-to-Date Interest</p>
                    <p className="text-sm font-medium text-green-600">
                      +{((acc.available_balance || 0) * (acc.interest_rate || 0) / 100 / 12 * (new Date().getDate() / 30)).toFixed(2)} ETB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="fd" className="space-y-4">
          {fds.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Lock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">No Fixed Deposits</p>
                <p className="text-xs text-muted-foreground mt-1">Place a Fixed Deposit to earn higher interest on your savings.</p>
                <Button size="sm" className="mt-3" onClick={() => setShowNewFD(true)}>Place FD Now</Button>
              </CardContent>
            </Card>
          ) : fds.map(fd => (
            <Card key={fd.id} className={fd.status === 'matured' ? 'border-amber-300 bg-amber-50/30' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Fixed Deposit — {fd.tenure_months} Months
                    </p>
                    <p className="text-xs font-mono text-muted-foreground">{fd.certificate_number}</p>
                  </div>
                  <Badge variant={fd.status === 'active' ? 'default' : fd.status === 'matured' ? 'secondary' : 'outline'} className="text-[10px] capitalize">
                    {fd.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Principal</p>
                    <p className="text-sm font-bold text-foreground">{fd.amount.toLocaleString()} ETB</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Interest Rate</p>
                    <p className="text-sm font-medium text-foreground">{fd.interest_rate}% p.a.</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Accrued Interest</p>
                    <p className="text-sm font-medium text-green-600">+{(fd.accrued_interest || 0).toLocaleString()} ETB</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Maturity Date</p>
                    <p className="text-sm font-medium text-foreground">{new Date(fd.maturity_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Days Remaining</p>
                    <p className="text-sm font-medium text-foreground">{daysToMaturity(fd.maturity_date)} days</p>
                  </div>
                </div>
                <Progress value={maturityProgress(fd)} className="h-1.5 mb-1" />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Placed: {new Date(fd.placement_date).toLocaleDateString()}</span>
                  <span>Maturity: {fd.maturity_instruction.replace('_', ' ')}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* New FD Dialog */}
      <Dialog open={showNewFD} onOpenChange={setShowNewFD}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Lock className="h-4 w-4" /> Place Fixed Deposit</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">From Account *</Label>
              <Select value={fdFromAccount} onValueChange={setFdFromAccount}>
                <SelectTrigger><SelectValue placeholder="Select source account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.product_name} — {(a.available_balance || 0).toLocaleString()} ETB</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Amount (ETB) *</Label>
              <Input type="number" value={fdAmount} onChange={e => setFdAmount(e.target.value)} placeholder="Minimum 1,000 ETB" />
            </div>

            <div>
              <Label className="text-xs">Tenure *</Label>
              <div className="grid grid-cols-5 gap-2 mt-1">
                {fdTenures.map(t => (
                  <button
                    key={t.months}
                    onClick={() => setFdTenure(String(t.months))}
                    className={`p-2 rounded-lg border text-center transition-colors ${
                      parseInt(fdTenure) === t.months ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <p className="text-xs font-medium">{t.label}</p>
                    <p className="text-[10px] text-muted-foreground">{t.rate}%</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">Maturity Instruction *</Label>
              <Select value={fdMaturityInstruction} onValueChange={setFdMaturityInstruction}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {maturityOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {fdAmount && selectedTenure && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Principal</span>
                    <span className="font-medium text-foreground">{parseFloat(fdAmount).toLocaleString()} ETB</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Interest ({selectedTenure.rate}% × {selectedTenure.months}M)</span>
                    <span className="font-medium text-green-600">+{fdInterestAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1 border-t border-border">
                    <span className="font-medium text-foreground">Maturity Value</span>
                    <span className="font-bold text-foreground">{fdMaturityAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button onClick={handlePlaceFD} disabled={loading || !fdAmount || !fdFromAccount} className="w-full">
              {loading ? 'Processing...' : 'Place Fixed Deposit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IBSavingsDeposits;
