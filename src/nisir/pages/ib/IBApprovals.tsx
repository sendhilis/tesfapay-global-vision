import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@nisir/hooks/useAuth';
import { useAccounts } from '@nisir/hooks/useAccounts';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Shield } from 'lucide-react';

const IBApprovals = () => {
  const { user } = useAuth();
  const { refetch: refetchAccounts } = useAccounts();
  const { t } = useLanguage();
  const [approvals, setApprovals] = useState<any[]>([]);
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  const fetchApprovals = async () => { if (!user) return; const { data } = await supabase.from('approval_requests').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }); if (data) setApprovals(data); };
  useEffect(() => { fetchApprovals(); }, [user]);
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`approvals-${user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'approval_requests', filter: `profile_id=eq.${user.id}` }, () => fetchApprovals()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    const approval = approvals.find(a => a.id === id); if (!approval) return;
    if (action === 'approved') {
      const payload = approval.payload as any;
      try {
        if (approval.request_type === 'vendor_payment' || approval.request_type === 'transfer') {
          const { data, error } = await supabase.rpc('process_bill_payment', { p_account_id: payload.from_account_id, p_biller_name: payload.vendor_name || payload.to_name || 'Transfer', p_biller_account: payload.vendor_account || payload.to_account || 'N/A', p_amount: payload.amount, p_fee: payload.fee || 5 });
          if (error) throw error; const result = data as any; if (!result.success) throw new Error(result.error); refetchAccounts();
        }
      } catch (err: any) { toast.error(err.message); return; }
    }
    await supabase.from('approval_requests').update({ status: action, approved_by: user?.email || user?.id, approved_at: new Date().toISOString(), remarks: remarks[id] || null }).eq('id', id);
    toast.success(`${t('common.status')}: ${action}`); fetchApprovals();
  };

  const pending = approvals.filter(a => a.status === 'pending');
  const processed = approvals.filter(a => a.status !== 'pending');

  const renderRequest = (a: any, showActions: boolean) => {
    const p = a.payload as any;
    return (
      <Card key={a.id}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] capitalize">{a.request_type.replace('_', ' ')}</Badge>
                <Badge variant={a.status === 'approved' ? 'default' : a.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[10px]">{a.status}</Badge>
              </div>
              <p className="text-sm font-medium text-foreground">{p.vendor_name || p.to_name || p.batch_name || t('common.payments')}</p>
              <p className="text-lg font-bold text-foreground">{(p.amount || p.total_amount || 0).toLocaleString()} {t('common.etb')}</p>
              {p.description && <p className="text-xs text-muted-foreground mt-1">{p.description}</p>}
              <p className="text-[10px] text-muted-foreground mt-1">{t('ib.approval.submitted')}: {new Date(a.created_at).toLocaleString()} — {a.submitted_by}</p>
              {a.approved_by && <p className="text-[10px] text-muted-foreground">{a.status === 'approved' ? t('ib.approval.approvedBy') : t('ib.approval.rejectedBy')} {a.approved_by}</p>}
              {a.remarks && <p className="text-xs text-muted-foreground italic mt-1">"{a.remarks}"</p>}
            </div>
            {showActions && (
              <div className="space-y-2 shrink-0">
                <Textarea placeholder={t('ib.approval.remarks')} value={remarks[a.id] || ''} onChange={e => setRemarks(prev => ({ ...prev, [a.id]: e.target.value }))} rows={2} className="text-xs w-48" />
                <div className="flex gap-1">
                  <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => handleAction(a.id, 'approved')}><CheckCircle className="h-3 w-3 mr-1" /> {t('ib.vendor.approve')}</Button>
                  <Button size="sm" variant="destructive" className="flex-1 h-7 text-xs" onClick={() => handleAction(a.id, 'rejected')}><XCircle className="h-3 w-3 mr-1" /> {t('ib.vendor.reject')}</Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-xl font-bold text-foreground">{t('ib.approval.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('ib.approval.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center"><Clock className="h-5 w-5 mx-auto text-accent-foreground mb-1" /><p className="text-lg font-bold text-foreground">{pending.length}</p><p className="text-[10px] text-muted-foreground">{t('ib.approval.pending')}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><CheckCircle className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-lg font-bold text-foreground">{processed.filter(a => a.status === 'approved').length}</p><p className="text-[10px] text-muted-foreground">{t('common.approved')}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><XCircle className="h-5 w-5 mx-auto text-destructive mb-1" /><p className="text-lg font-bold text-foreground">{processed.filter(a => a.status === 'rejected').length}</p><p className="text-[10px] text-muted-foreground">{t('common.rejected')}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">{t('ib.approval.pending')} {pending.length > 0 && <Badge variant="destructive" className="ml-1 h-4 text-[10px]">{pending.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="history">{t('ib.approval.history')}</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="space-y-3">
          {pending.length === 0 ? (<Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{t('ib.approval.noPending')}</CardContent></Card>) : pending.map(a => renderRequest(a, true))}
        </TabsContent>
        <TabsContent value="history" className="space-y-3">
          {processed.length === 0 ? (<Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{t('ib.approval.noHistory')}</CardContent></Card>) : processed.map(a => renderRequest(a, false))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IBApprovals;
