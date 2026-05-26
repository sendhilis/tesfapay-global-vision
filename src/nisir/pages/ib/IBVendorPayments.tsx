import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Send, CheckCircle, XCircle, Clock, Building2, Users } from 'lucide-react';
import OtpVerificationDialog from '@/components/OtpVerificationDialog';

interface Vendor {
  id: string;
  name: string;
  business: string;
  phone: string;
  account_number: string;
  bank: string;
  total_paid: number;
  created_at: string;
}

const ethiopianBanks = [
  'Nisir Microfinance', 'Commercial Bank of Ethiopia', 'Dashen Bank',
  'Awash Bank', 'Bank of Abyssinia', 'Wegagen Bank', 'United Bank',
  'Nib International Bank', 'Cooperative Bank of Oromia', 'Lion International Bank',
  'Zemen Bank', 'Bunna International Bank', 'Berhan International Bank',
  'Abay Bank', 'Addis International Bank', 'Enat Bank',
];

const IBVendorPayments = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { accounts, refetch: refetchAccounts } = useAccounts();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showPayVendor, setShowPayVendor] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  // Add vendor form
  const [vName, setVName] = useState('');
  const [vBusiness, setVBusiness] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vAccount, setVAccount] = useState('');
  const [vBank, setVBank] = useState('');

  // Payment form
  const [payAmount, setPayAmount] = useState('');
  const [payFromAccount, setPayFromAccount] = useState('');
  const [payDescription, setPayDescription] = useState('');
  const [payRequireApproval, setPayRequireApproval] = useState(false);
  const [payScheduleDate, setPayScheduleDate] = useState('');

  const fetchVendors = async () => {
    if (!user) return;
    const { data } = await supabase.from('merchant_vendors').select('*').eq('profile_id', user.id).order('created_at', { ascending: false });
    if (data) setVendors(data as Vendor[]);
  };

  const fetchApprovals = async () => {
    if (!user) return;
    const { data } = await supabase.from('approval_requests').select('*').eq('profile_id', user.id).eq('request_type', 'vendor_payment').order('created_at', { ascending: false });
    if (data) setApprovals(data);
  };

  useEffect(() => { fetchVendors(); fetchApprovals(); }, [user]);

  const handleAddVendor = async () => {
    if (!user || !vName || !vAccount || !vBank) { toast.error('Fill required fields'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from('merchant_vendors').insert({
        profile_id: user.id, name: vName, business: vBusiness, phone: vPhone,
        account_number: vAccount, bank: vBank,
      }).select();
      if (error) throw error;
      toast.success('Vendor added');
      setShowAddVendor(false);
      setVName(''); setVBusiness(''); setVPhone(''); setVAccount(''); setVBank('');
      fetchVendors();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add vendor');
    }
    setLoading(false);
  };

  const handlePayVendor = async () => {
    if (!user || !selectedVendor || !payAmount || !payFromAccount) { toast.error('Fill all fields'); return; }
    setLoading(true);
    const amount = parseFloat(payAmount);
    const fee = 10;

    try {
      if (payRequireApproval) {
        // Create approval request (maker-checker)
        await supabase.from('approval_requests').insert({
          profile_id: user.id,
          request_type: 'vendor_payment',
          submitted_by: user.email || user.id,
          payload: {
            vendor_id: selectedVendor.id,
            vendor_name: selectedVendor.name,
            vendor_bank: selectedVendor.bank,
            vendor_account: selectedVendor.account_number,
            amount, fee,
            from_account_id: payFromAccount,
            description: payDescription,
            schedule_date: payScheduleDate || null,
          },
        });
        toast.success('Payment submitted for approval');
      } else if (payScheduleDate) {
        // Create scheduled payment
        await supabase.from('scheduled_payments').insert({
          profile_id: user.id,
          payment_type: 'vendor',
          schedule_type: 'one_time',
          from_account_id: payFromAccount,
          to_account_number: selectedVendor.account_number,
          to_bank: selectedVendor.bank,
          to_name: selectedVendor.name,
          amount,
          description: payDescription || `Payment to ${selectedVendor.name}`,
          next_run_date: payScheduleDate,
        });
        toast.success('Payment scheduled');
      } else {
        // Immediate payment via process_transfer or direct
        const { data, error } = await supabase.rpc('process_bill_payment', {
          p_account_id: payFromAccount,
          p_biller_name: selectedVendor.name,
          p_biller_account: selectedVendor.account_number,
          p_amount: amount,
          p_fee: fee,
        });
        if (error) throw error;
        const result = data as any;
        if (!result.success) throw new Error(result.error);

        // Update vendor total_paid
        await supabase.from('merchant_vendors').update({
          total_paid: (selectedVendor.total_paid || 0) + amount,
        }).eq('id', selectedVendor.id);

        toast.success(`Paid ${amount.toLocaleString()} ETB to ${selectedVendor.name}`);
        refetchAccounts();
      }

      setShowPayVendor(false);
      setPayAmount(''); setPayDescription(''); setPayScheduleDate('');
      setPayRequireApproval(false);
      fetchVendors();
      fetchApprovals();
    } catch (err: any) {
      toast.error(err.message || 'Payment failed');
    }
    setLoading(false);
  };

  const handleApproval = async (id: string, action: 'approved' | 'rejected') => {
    const approval = approvals.find(a => a.id === id);
    if (!approval) return;

    if (action === 'approved') {
      const payload = approval.payload as any;
      try {
        const { data, error } = await supabase.rpc('process_bill_payment', {
          p_account_id: payload.from_account_id,
          p_biller_name: payload.vendor_name,
          p_biller_account: payload.vendor_account,
          p_amount: payload.amount,
          p_fee: payload.fee || 10,
        });
        if (error) throw error;
        const result = data as any;
        if (!result.success) throw new Error(result.error);
        refetchAccounts();
      } catch (err: any) {
        toast.error(err.message);
        return;
      }
    }

    await supabase.from('approval_requests').update({
      status: action,
      approved_by: user?.email || user?.id,
      approved_at: new Date().toISOString(),
    }).eq('id', id);

    toast.success(`Request ${action}`);
    fetchApprovals();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{t('ib.vendor.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('ib.vendor.subtitle')}</p>
        </div>
        <Button size="sm" onClick={() => setShowAddVendor(true)}>
          <Plus className="h-4 w-4 mr-1" /> {t('ib.vendor.addVendor')}
        </Button>
      </div>

      <Tabs defaultValue="vendors">
        <TabsList>
          <TabsTrigger value="vendors"><Building2 className="h-3 w-3 mr-1" /> {t('ib.vendor.vendors')}</TabsTrigger>
          <TabsTrigger value="approvals">
            <Clock className="h-3 w-3 mr-1" /> {t('ib.vendor.approvals')}
            {approvals.filter(a => a.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 text-[10px]">
                {approvals.filter(a => a.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vendors" className="space-y-4">
          {vendors.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{t('ib.vendor.noVendors')}</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">{t('ib.vendor.vendorName')}</TableHead>
                      <TableHead className="text-xs">{t('ib.vendor.business')}</TableHead>
                      <TableHead className="text-xs">{t('ib.transfer.bank')}</TableHead>
                      <TableHead className="text-xs">{t('common.accounts')}</TableHead>
                      <TableHead className="text-xs text-right">{t('ib.vendor.totalPaid')}</TableHead>
                      <TableHead className="text-xs">{t('common.action')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="text-xs font-medium">{v.name}</TableCell>
                        <TableCell className="text-xs">{v.business}</TableCell>
                        <TableCell className="text-xs">{v.bank}</TableCell>
                        <TableCell className="text-xs font-mono">{v.account_number}</TableCell>
                        <TableCell className="text-xs text-right">{(v.total_paid || 0).toLocaleString()} ETB</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setSelectedVendor(v); setShowPayVendor(true); }}>
                            <Send className="h-3 w-3 mr-1" /> {t('ib.loan.pay')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          {approvals.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{t('ib.vendor.noApprovals')}</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {approvals.map((a) => {
                const p = a.payload as any;
                return (
                  <Card key={a.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Payment to {p.vendor_name}</p>
                          <p className="text-xs text-muted-foreground">{p.vendor_bank} • {p.vendor_account}</p>
                          <p className="text-lg font-bold text-foreground mt-1">{(p.amount || 0).toLocaleString()} ETB</p>
                          <p className="text-xs text-muted-foreground">{t('ib.vendor.submittedBy')}: {a.submitted_by}</p>
                          {p.description && <p className="text-xs text-muted-foreground mt-1">{p.description}</p>}
                        </div>
                        <div className="text-right space-y-2">
                          <Badge variant={a.status === 'approved' ? 'default' : a.status === 'rejected' ? 'destructive' : 'secondary'}>
                            {a.status}
                          </Badge>
                          {a.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => handleApproval(a.id, 'approved')}>
                                <CheckCircle className="h-3 w-3 mr-1" /> {t('ib.vendor.approve')}
                              </Button>
                              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleApproval(a.id, 'rejected')}>
                                <XCircle className="h-3 w-3 mr-1" /> {t('ib.vendor.reject')}
                              </Button>
                            </div>
                          )}
                          {a.approved_by && <p className="text-[10px] text-muted-foreground">By: {a.approved_by}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Vendor Dialog */}
      <Dialog open={showAddVendor} onOpenChange={setShowAddVendor}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('ib.vendor.addVendor')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">{t('ib.vendor.vendorName')} *</Label><Input value={vName} onChange={e => setVName(e.target.value)} placeholder="Company name" /></div>
            <div><Label className="text-xs">{t('ib.vendor.businessType')}</Label><Input value={vBusiness} onChange={e => setVBusiness(e.target.value)} placeholder="e.g. Supplier" /></div>
            <div><Label className="text-xs">{t('common.phone')}</Label><Input value={vPhone} onChange={e => setVPhone(e.target.value)} placeholder="+251..." /></div>
            <div><Label className="text-xs">{t('ib.transfer.bank')} *</Label>
              <Select value={vBank} onValueChange={setVBank}>
                <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
                <SelectContent>{ethiopianBanks.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">{t('ib.transfer.accountNumber')} *</Label><Input value={vAccount} onChange={e => setVAccount(e.target.value)} placeholder="Account number" /></div>
            <Button onClick={handleAddVendor} disabled={loading} className="w-full">{loading ? t('common.processing') : t('ib.vendor.addVendor')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay Vendor Dialog */}
      <Dialog open={showPayVendor} onOpenChange={setShowPayVendor}>
        <DialogContent>
          <DialogHeader><DialogTitle>Pay {selectedVendor?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">{t('ib.vendor.payingTo')}</p>
              <p className="text-sm font-medium text-foreground">{selectedVendor?.name} — {selectedVendor?.bank}</p>
              <p className="text-xs font-mono text-muted-foreground">{selectedVendor?.account_number}</p>
            </div>
            <div><Label className="text-xs">{t('ib.transfer.fromAccount')}</Label>
              <Select value={payFromAccount} onValueChange={setPayFromAccount}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.product_name} — {(a.available_balance || 0).toLocaleString()} ETB</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">{t('ib.transfer.amountEtb')}</Label><Input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0.00" /></div>
            <div><Label className="text-xs">{t('common.description')}</Label><Textarea value={payDescription} onChange={e => setPayDescription(e.target.value)} placeholder="Invoice #, PO reference..." rows={2} /></div>
            <div><Label className="text-xs">{t('ib.vendor.scheduleDate')}</Label><Input type="date" value={payScheduleDate} onChange={e => setPayScheduleDate(e.target.value)} /></div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">{t('ib.vendor.requireApproval')}</Label>
              <Switch checked={payRequireApproval} onCheckedChange={setPayRequireApproval} />
            </div>
            <p className="text-xs text-muted-foreground">Service fee: 10 ETB</p>
            <Button onClick={() => payRequireApproval ? handlePayVendor() : setShowOtp(true)} disabled={loading} className="w-full">
              {loading ? t('common.processing') : payRequireApproval ? t('ib.vendor.submitForApproval') : payScheduleDate ? t('ib.vendor.schedulePayment') : t('ib.transfer.verifyAndSend')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <OtpVerificationDialog
        open={showOtp}
        onOpenChange={setShowOtp}
        onVerified={handlePayVendor}
        amount={parseFloat(payAmount || '0')}
        transactionType="Vendor Payment"
        recipientInfo={selectedVendor?.name || ''}
      />
    </div>
  );
};

export default IBVendorPayments;
