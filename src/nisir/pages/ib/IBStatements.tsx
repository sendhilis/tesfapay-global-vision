import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts } from '@/hooks/useAccounts';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Transaction = Tables<'transactions'>;

const IBStatements = () => {
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const { t } = useLanguage();
  const [selectedAccount, setSelectedAccount] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStatement = async () => {
    if (!user || !selectedAccount) return; setLoading(true);
    let query = supabase.from('transactions').select('*').eq('account_id', selectedAccount).eq('profile_id', user.id).order('created_at', { ascending: false });
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');
    const { data } = await query.limit(500); if (data) setTransactions(data); setLoading(false);
  };

  const totalCredit = transactions.filter((t) => t.direction === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalDebit = transactions.filter((t) => t.direction === 'debit').reduce((s, t) => s + t.amount, 0);

  const downloadCSV = () => {
    const header = `${t('common.date')},${t('common.reference')},${t('common.type')},${t('common.description')},${t('ib.statement.debit')},${t('ib.statement.credit')},${t('common.status')}\n`;
    const rows = transactions.map((tx) => `${new Date(tx.created_at!).toLocaleDateString()},${tx.reference},${tx.transaction_type},${(tx.description || '').replace(/,/g, '')},${tx.direction === 'debit' ? tx.amount : ''},${tx.direction === 'credit' ? tx.amount : ''},${tx.status}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `statement_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div><h1 className="text-xl font-bold text-foreground">{t('ib.statement.title')}</h1><p className="text-sm text-muted-foreground">{t('ib.statement.subtitle')}</p></div>

      <Card><CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div><Label className="text-xs">{t('ib.statement.account')}</Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}><SelectTrigger><SelectValue placeholder={t('accounts.selectAccount')} /></SelectTrigger>
              <SelectContent>{accounts.map((a) => (<SelectItem key={a.id} value={a.id}>{a.product_name} — {a.account_number}</SelectItem>))}</SelectContent></Select>
          </div>
          <div><Label className="text-xs">{t('ib.statement.fromDate')}</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div>
          <div><Label className="text-xs">{t('ib.statement.toDate')}</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></div>
          <div className="flex items-end"><Button onClick={fetchStatement} disabled={!selectedAccount || loading} className="w-full">{loading ? t('common.loading') : t('common.generate')}</Button></div>
        </div>
      </CardContent></Card>

      {transactions.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">{t('ib.statement.totalCredits')}</p><p className="text-lg font-bold text-green-600">+{totalCredit.toLocaleString()} {t('common.etb')}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">{t('ib.statement.totalDebits')}</p><p className="text-lg font-bold text-red-500">-{totalDebit.toLocaleString()} {t('common.etb')}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">{t('ib.statement.transactions')}</p><p className="text-lg font-bold text-foreground">{transactions.length}</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> {t('ib.statements')}</CardTitle>
              <Button variant="outline" size="sm" onClick={downloadCSV}><Download className="h-4 w-4 mr-1" /> {t('ib.statement.exportCsv')}</Button>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-xs">{t('common.date')}</TableHead><TableHead className="text-xs">{t('common.reference')}</TableHead><TableHead className="text-xs">{t('common.description')}</TableHead>
                    <TableHead className="text-xs text-right">{t('ib.statement.debit')}</TableHead><TableHead className="text-xs text-right">{t('ib.statement.credit')}</TableHead><TableHead className="text-xs">{t('common.status')}</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>{transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs">{new Date(tx.created_at!).toLocaleDateString()}</TableCell>
                      <TableCell className="text-xs font-mono">{tx.reference}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{tx.description || tx.transaction_type}</TableCell>
                      <TableCell className="text-xs text-right text-red-500">{tx.direction === 'debit' ? tx.amount.toLocaleString() : ''}</TableCell>
                      <TableCell className="text-xs text-right text-green-600">{tx.direction === 'credit' ? tx.amount.toLocaleString() : ''}</TableCell>
                      <TableCell><Badge variant={tx.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">{tx.status}</Badge></TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {transactions.length === 0 && selectedAccount && !loading && (<p className="text-center text-sm text-muted-foreground py-8">{t('ib.statement.selectAndGenerate')}</p>)}
    </div>
  );
};

export default IBStatements;
