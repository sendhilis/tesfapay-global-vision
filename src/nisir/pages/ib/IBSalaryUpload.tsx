import { useState, useEffect, useRef } from 'react';
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
import { toast } from 'sonner';
import { Upload, FileText, CheckCircle, XCircle, Download, Play, Clock, Shield, Eye, Users } from 'lucide-react';

interface SalaryItem {
  employee_id: string;
  employee_name: string;
  department: string;
  designation: string;
  account_number: string;
  bank_name: string;
  basic_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  overtime: number;
  bonus: number;
  gross_pay: number;
  income_tax: number;
  pension_employee: number;
  pension_employer: number;
  other_deductions: number;
  net_pay: number;
  status?: 'pending' | 'completed' | 'failed';
}

interface BatchRecord {
  id: string;
  batch_name: string;
  total_amount: number;
  total_records: number;
  successful_records: number;
  failed_records: number;
  status: string;
  created_at: string;
}

const IBSalaryUpload = () => {
  const { user } = useAuth();
  const { accounts, refetch: refetchAccounts } = useAccounts();
  const fileRef = useRef<HTMLInputElement>(null);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [items, setItems] = useState<SalaryItem[]>([]);
  const [batchName, setBatchName] = useState('');
  const [payrollMonth, setPayrollMonth] = useState('');
  const [debitAccount, setDebitAccount] = useState('');
  const [step, setStep] = useState<'upload' | 'review' | 'history'>('history');
  const [processing, setProcessing] = useState(false);
  const [submittedForApproval, setSubmittedForApproval] = useState(false);

  const fetchBatches = async () => {
    if (!user) return;
    const { data } = await supabase.from('salary_batches').select('*').eq('profile_id', user.id).order('created_at', { ascending: false });
    if (data) setBatches(data as BatchRecord[]);
  };

  useEffect(() => { fetchBatches(); }, [user]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim());
      const parsed: SalaryItem[] = [];
      for (let i = 1; i < lines.length; i++) {
        const c = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
        if (c.length >= 14) {
          const basic = parseFloat(c[5]) || 0;
          const housing = parseFloat(c[6]) || 0;
          const transport = parseFloat(c[7]) || 0;
          const overtime = parseFloat(c[8]) || 0;
          const bonus = parseFloat(c[9]) || 0;
          const gross = basic + housing + transport + overtime + bonus;
          const tax = parseFloat(c[10]) || 0;
          const penEmp = parseFloat(c[11]) || 0;
          const penEr = parseFloat(c[12]) || 0;
          const otherDed = parseFloat(c[13]) || 0;
          const net = gross - tax - penEmp - otherDed;
          parsed.push({
            employee_id: c[0],
            employee_name: c[1],
            department: c[2],
            designation: c[3],
            account_number: c[4],
            bank_name: c[14] || 'Nisir Microfinance',
            basic_salary: basic,
            housing_allowance: housing,
            transport_allowance: transport,
            overtime, bonus, gross_pay: gross,
            income_tax: tax,
            pension_employee: penEmp,
            pension_employer: penEr,
            other_deductions: otherDed,
            net_pay: net,
            status: 'pending',
          });
        }
      }
      if (parsed.length === 0) { toast.error('No valid records found. Ensure CSV matches template format.'); return; }
      setItems(parsed);
      setStep('review');
      toast.success(`${parsed.length} employee records loaded`);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const header = 'Employee ID,Employee Name,Department,Designation,Account Number,Basic Salary,Housing Allowance,Transport Allowance,Overtime,Bonus,Income Tax,Pension (Employee 7%),Pension (Employer 11%),Other Deductions,Bank Name';
    const rows = [
      'EMP-001,Abebe Kebede Tessema,Engineering,Senior Software Engineer,1000234567890,28000,5600,2000,3500,0,5765,1960,3080,500,Commercial Bank of Ethiopia',
      'EMP-002,Sara Tesfaye Alemu,Finance,Chief Accountant,NIS-4a8b3c9d1e2f,32000,6400,2000,0,5000,7140,2240,3520,1200,Nisir Microfinance',
      'EMP-003,Dawit Hailu Gebremedhin,Operations,Operations Manager,1000345678901,25000,5000,2000,4200,0,5262,1750,2750,0,Dashen Bank',
      'EMP-004,Tigist Mengistu Wolde,HR,HR Director,1000456789012,35000,7000,2500,0,8000,9425,2450,3850,800,Awash Bank',
      'EMP-005,Yonas Bekele Tadesse,Marketing,Marketing Lead,NIS-5b9c4d2e3f1a,22000,4400,1500,2800,0,4102,1540,2420,350,Nisir Microfinance',
      'EMP-006,Hiwot Dereje Asfaw,Engineering,DevOps Engineer,1000567890123,26000,5200,2000,5100,0,5508,1820,2860,0,Bank of Abyssinia',
      'EMP-007,Mulugeta Girma Kebede,Sales,Regional Sales Manager,1000678901234,24000,4800,2500,0,3000,4590,1680,2640,200,Commercial Bank of Ethiopia',
      'EMP-008,Bethlehem Sisay Haile,Finance,Junior Accountant,NIS-6c1d5e3f4a2b,15000,3000,1500,1200,0,2172,1050,1650,0,Nisir Microfinance',
      'EMP-009,Tewodros Assefa Negash,Engineering,QA Lead,1000789012345,27000,5400,2000,2600,0,5190,1890,2970,500,Wegagen Bank',
      'EMP-010,Rahel Worku Demissie,Admin,Office Manager,1000890123456,18000,3600,1500,0,0,2694,1260,1980,150,Cooperative Bank of Oromia',
      'EMP-011,Solomon Tadesse Bekele,Engineering,Frontend Developer,NIS-7d2e6f4a5b3c,24000,4800,2000,3800,0,4602,1680,2640,0,Nisir Microfinance',
      'EMP-012,Meron Alem Gebreyesus,Legal,Legal Counsel,1000901234567,30000,6000,2500,0,0,5700,2100,3300,1000,Abyssinia Bank',
    ];
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'nisir_payroll_template.csv'; a.click();
  };

  const totalGross = items.reduce((s, i) => s + i.gross_pay, 0);
  const totalNet = items.reduce((s, i) => s + i.net_pay, 0);
  const totalTax = items.reduce((s, i) => s + i.income_tax, 0);
  const totalPensionEmp = items.reduce((s, i) => s + i.pension_employee, 0);
  const totalPensionEr = items.reduce((s, i) => s + i.pension_employer, 0);

  const handleSubmitForApproval = async () => {
    if (!user || !debitAccount || !batchName || items.length === 0) {
      toast.error('Please fill all required fields');
      return;
    }
    setProcessing(true);
    try {
      const selectedAcc = accounts.find((a) => a.id === debitAccount);
      if (!selectedAcc || (selectedAcc.available_balance || 0) < totalNet) {
        throw new Error('Insufficient balance for salary batch');
      }

      // Create batch in draft status
      const { data: batch, error: batchErr } = await supabase.from('salary_batches').insert({
        profile_id: user.id,
        batch_name: batchName,
        total_amount: totalNet,
        total_records: items.length,
        status: 'pending_approval',
        debit_account_id: debitAccount,
        remarks: `Payroll: ${payrollMonth || batchName}`,
      }).select().single();
      if (batchErr) throw batchErr;

      // Insert items
      const batchItems = items.map((item) => ({
        batch_id: batch.id,
        profile_id: user.id,
        employee_name: item.employee_name,
        account_number: item.account_number,
        bank_name: item.bank_name,
        amount: item.net_pay,
        status: 'pending',
      }));
      await supabase.from('salary_batch_items').insert(batchItems);

      // Create approval request (maker-checker)
      await supabase.from('approval_requests').insert({
        profile_id: user.id,
        request_type: 'salary_batch',
        submitted_by: user.email || user.id,
        payload: {
          batch_id: batch.id,
          batch_name: batchName,
          payroll_month: payrollMonth,
          total_employees: items.length,
          total_net_pay: totalNet,
          total_gross_pay: totalGross,
          total_tax: totalTax,
          total_pension: totalPensionEmp + totalPensionEr,
          from_account_id: debitAccount,
          from_account_name: selectedAcc.product_name,
          description: `Salary batch: ${batchName} — ${items.length} employees — Net: ${totalNet.toLocaleString()} ETB`,
          amount: totalNet,
        },
      });

      setSubmittedForApproval(true);
      toast.success('Salary batch submitted for approval');
      fetchBatches();
    } catch (err: any) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDirectProcess = async () => {
    if (!user || !debitAccount || !batchName || items.length === 0) {
      toast.error('Please fill all fields');
      return;
    }
    setProcessing(true);
    try {
      const selectedAcc = accounts.find((a) => a.id === debitAccount);
      if (!selectedAcc || (selectedAcc.available_balance || 0) < totalNet) {
        throw new Error('Insufficient balance for salary batch');
      }

      const { data: batch, error: batchErr } = await supabase.from('salary_batches').insert({
        profile_id: user.id,
        batch_name: batchName,
        total_amount: totalNet,
        total_records: items.length,
        status: 'processing',
        debit_account_id: debitAccount,
      }).select().single();
      if (batchErr) throw batchErr;

      const batchItems = items.map((item) => ({
        batch_id: batch.id,
        profile_id: user.id,
        employee_name: item.employee_name,
        account_number: item.account_number,
        bank_name: item.bank_name,
        amount: item.net_pay,
        status: 'completed',
      }));
      await supabase.from('salary_batch_items').insert(batchItems);

      await supabase.from('accounts').update({
        balance: (selectedAcc.balance || 0) - totalNet,
        available_balance: (selectedAcc.available_balance || 0) - totalNet,
      }).eq('id', debitAccount);

      await supabase.from('transactions').insert({
        account_id: debitAccount,
        profile_id: user.id,
        transaction_type: 'transfer',
        amount: totalNet,
        fee: 0,
        direction: 'debit',
        status: 'completed',
        reference: 'SAL-' + Date.now().toString(36).toUpperCase(),
        description: `Payroll: ${batchName} (${items.length} employees)`,
      });

      await supabase.from('salary_batches').update({
        status: 'completed',
        successful_records: items.length,
        processed_at: new Date().toISOString(),
      }).eq('id', batch.id);

      toast.success('Salary batch processed!');
      setStep('history');
      setItems([]);
      setBatchName('');
      setPayrollMonth('');
      fetchBatches();
      refetchAccounts();
    } catch (err: any) {
      toast.error(err.message || 'Processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default', processing: 'secondary', pending_approval: 'outline', failed: 'destructive', draft: 'secondary',
    };
    return <Badge variant={map[status] || 'secondary'} className="text-[10px] capitalize">{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Payroll & Salary Disbursement
          </h1>
          <p className="text-sm text-muted-foreground">Upload payroll CSV for bulk salary processing with maker-checker authorization</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-1" /> Payroll Template
          </Button>
          <Button size="sm" onClick={() => { setStep('upload'); setItems([]); setSubmittedForApproval(false); }}>
            <Upload className="h-4 w-4 mr-1" /> New Payroll
          </Button>
        </div>
      </div>

      {step === 'upload' && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Upload Payroll File</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label className="text-xs">Batch / Payroll Name *</Label>
                <Input value={batchName} onChange={(e) => setBatchName(e.target.value)} placeholder="e.g. April 2026 Payroll" />
              </div>
              <div><Label className="text-xs">Payroll Month</Label>
                <Input type="month" value={payrollMonth} onChange={(e) => setPayrollMonth(e.target.value)} />
              </div>
              <div><Label className="text-xs">Debit Account *</Label>
                <Select value={debitAccount} onValueChange={setDebitAccount}>
                  <SelectTrigger><SelectValue placeholder="Select corporate account" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.product_name} — {(a.available_balance || 0).toLocaleString()} ETB</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">Click to upload payroll CSV</p>
              <p className="text-xs text-muted-foreground mt-1">
                Columns: Employee ID, Name, Department, Designation, Account No., Basic, Housing, Transport, Overtime, Bonus, Tax, Pension (Emp), Pension (Er), Other Deductions, Bank
              </p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </div>
            <Button variant="outline" onClick={() => setStep('history')}>Cancel</Button>
          </CardContent>
        </Card>
      )}

      {step === 'review' && !submittedForApproval && (
        <div className="space-y-4">
          {/* Payroll Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card><CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Employees</p>
              <p className="text-lg font-bold text-foreground">{items.length}</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Gross Pay</p>
              <p className="text-lg font-bold text-foreground">{totalGross.toLocaleString()}</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Total Tax</p>
              <p className="text-lg font-bold text-destructive">{totalTax.toLocaleString()}</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Total Pension</p>
              <p className="text-lg font-bold text-foreground">{(totalPensionEmp + totalPensionEr).toLocaleString()}</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Net Disbursement</p>
              <p className="text-lg font-bold text-primary">{totalNet.toLocaleString()} ETB</p>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Payroll Review — {items.length} Employees</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {payrollMonth || batchName}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto mb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] sticky top-0 bg-background">ID</TableHead>
                      <TableHead className="text-[10px] sticky top-0 bg-background">Employee</TableHead>
                      <TableHead className="text-[10px] sticky top-0 bg-background">Dept</TableHead>
                      <TableHead className="text-[10px] sticky top-0 bg-background">Designation</TableHead>
                      <TableHead className="text-[10px] sticky top-0 bg-background">Account</TableHead>
                      <TableHead className="text-[10px] sticky top-0 bg-background">Bank</TableHead>
                      <TableHead className="text-[10px] text-right sticky top-0 bg-background">Basic</TableHead>
                      <TableHead className="text-[10px] text-right sticky top-0 bg-background">Gross</TableHead>
                      <TableHead className="text-[10px] text-right sticky top-0 bg-background">Tax</TableHead>
                      <TableHead className="text-[10px] text-right sticky top-0 bg-background">Pension</TableHead>
                      <TableHead className="text-[10px] text-right sticky top-0 bg-background font-bold">Net Pay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-[10px] font-mono">{item.employee_id}</TableCell>
                        <TableCell className="text-[10px] font-medium">{item.employee_name}</TableCell>
                        <TableCell className="text-[10px]">{item.department}</TableCell>
                        <TableCell className="text-[10px]">{item.designation}</TableCell>
                        <TableCell className="text-[10px] font-mono">{item.account_number}</TableCell>
                        <TableCell className="text-[10px]">{item.bank_name}</TableCell>
                        <TableCell className="text-[10px] text-right">{item.basic_salary.toLocaleString()}</TableCell>
                        <TableCell className="text-[10px] text-right">{item.gross_pay.toLocaleString()}</TableCell>
                        <TableCell className="text-[10px] text-right text-destructive">{item.income_tax.toLocaleString()}</TableCell>
                        <TableCell className="text-[10px] text-right">{item.pension_employee.toLocaleString()}</TableCell>
                        <TableCell className="text-[10px] text-right font-bold">{item.net_pay.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {/* Totals row */}
                    <TableRow className="border-t-2 font-bold bg-muted/30">
                      <TableCell colSpan={6} className="text-[10px]">TOTALS</TableCell>
                      <TableCell className="text-[10px] text-right">{items.reduce((s, i) => s + i.basic_salary, 0).toLocaleString()}</TableCell>
                      <TableCell className="text-[10px] text-right">{totalGross.toLocaleString()}</TableCell>
                      <TableCell className="text-[10px] text-right text-destructive">{totalTax.toLocaleString()}</TableCell>
                      <TableCell className="text-[10px] text-right">{totalPensionEmp.toLocaleString()}</TableCell>
                      <TableCell className="text-[10px] text-right text-primary">{totalNet.toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="bg-muted/30 rounded-lg p-3 mb-4 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground flex items-center gap-1"><Shield className="h-3 w-3" /> Authorization Required</p>
                <p>This salary batch requires maker-checker approval before funds are disbursed. A second authorized officer must approve this batch in the Approvals module.</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setStep('upload'); setItems([]); }} className="flex-1">Back</Button>
                <Button onClick={handleSubmitForApproval} disabled={processing} className="flex-1" variant="default">
                  <Shield className="h-4 w-4 mr-1" /> {processing ? 'Submitting...' : 'Submit for Approval'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'review' && submittedForApproval && (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Clock className="h-10 w-10 mx-auto text-primary" />
            <h2 className="text-lg font-bold text-foreground">Batch Submitted for Approval</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Your salary batch "<strong>{batchName}</strong>" with {items.length} employees totaling <strong>{totalNet.toLocaleString()} ETB</strong> has been submitted.
              An authorized checker must approve before disbursement.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" onClick={() => { setStep('history'); setItems([]); setSubmittedForApproval(false); }}>
                View History
              </Button>
              <Button onClick={() => { setStep('upload'); setItems([]); setSubmittedForApproval(false); }}>
                New Upload
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'history' && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Payroll Batch History</CardTitle></CardHeader>
          <CardContent>
            {batches.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No payroll batches yet. Upload your first payroll CSV to get started.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Batch Name</TableHead>
                    <TableHead className="text-xs">Records</TableHead>
                    <TableHead className="text-xs">Net Amount</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="text-xs font-medium">{b.batch_name}</TableCell>
                      <TableCell className="text-xs">{b.successful_records}/{b.total_records}</TableCell>
                      <TableCell className="text-xs font-mono">{b.total_amount.toLocaleString()} ETB</TableCell>
                      <TableCell>{statusBadge(b.status)}</TableCell>
                      <TableCell className="text-xs">{new Date(b.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IBSalaryUpload;
