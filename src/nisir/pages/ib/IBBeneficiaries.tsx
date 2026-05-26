import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@nisir/hooks/useAuth';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Users, Trash2, Edit, Search } from 'lucide-react';

interface Beneficiary { id: string; beneficiary_name: string; bank_name: string; account_number: string; transfer_type: string; nickname: string | null; phone: string | null; is_active: boolean; }

const ethiopianBanks = ['Nisir Microfinance', 'Commercial Bank of Ethiopia', 'Awash International Bank', 'Dashen Bank', 'Bank of Abyssinia', 'Wegagen Bank', 'United Bank', 'Nib International Bank', 'Cooperative Bank of Oromia', 'Lion International Bank', 'Zemen Bank'];

const IBBeneficiaries = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ beneficiary_name: '', bank_name: 'Nisir Microfinance', account_number: '', transfer_type: 'internal', nickname: '', phone: '' });

  const fetchBeneficiaries = async () => { if (!user) return; const { data } = await supabase.from('beneficiaries').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }); if (data) setBeneficiaries(data as Beneficiary[]); setLoading(false); };
  useEffect(() => { fetchBeneficiaries(); }, [user]);

  const handleSave = async () => {
    if (!user || !form.beneficiary_name || !form.account_number) { toast.error(t('common.failed')); return; }
    if (editingId) { await supabase.from('beneficiaries').update({ ...form, nickname: form.nickname || null, phone: form.phone || null }).eq('id', editingId); toast.success(t('common.update')); }
    else { await supabase.from('beneficiaries').insert({ ...form, profile_id: user.id, nickname: form.nickname || null, phone: form.phone || null }); toast.success(t('common.completed')); }
    setDialogOpen(false); setEditingId(null); setForm({ beneficiary_name: '', bank_name: 'Nisir Microfinance', account_number: '', transfer_type: 'internal', nickname: '', phone: '' }); fetchBeneficiaries();
  };

  const handleDelete = async (id: string) => { await supabase.from('beneficiaries').delete().eq('id', id); toast.success(t('common.delete')); fetchBeneficiaries(); };
  const openEdit = (b: Beneficiary) => { setEditingId(b.id); setForm({ beneficiary_name: b.beneficiary_name, bank_name: b.bank_name, account_number: b.account_number, transfer_type: b.transfer_type, nickname: b.nickname || '', phone: b.phone || '' }); setDialogOpen(true); };

  const filtered = beneficiaries.filter((b) => b.beneficiary_name.toLowerCase().includes(search.toLowerCase()) || b.account_number.includes(search) || (b.nickname || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{t('ib.beneficiary.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('ib.beneficiary.subtitle')}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingId(null); setForm({ beneficiary_name: '', bank_name: 'Nisir Microfinance', account_number: '', transfer_type: 'internal', nickname: '', phone: '' }); } }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> {t('ib.beneficiary.add')}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? t('ib.beneficiary.edit') : t('ib.beneficiary.add')}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">{t('common.name')} *</Label><Input value={form.beneficiary_name} onChange={(e) => setForm({ ...form, beneficiary_name: e.target.value })} /></div>
              <div><Label className="text-xs">{t('ib.beneficiary.nickname')}</Label><Input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} /></div>
              <div><Label className="text-xs">{t('ib.beneficiary.transferType')}</Label>
                <Select value={form.transfer_type} onValueChange={(v) => setForm({ ...form, transfer_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">{t('ib.transfer.withinNisir')}</SelectItem>
                    <SelectItem value="rtgs">{t('ib.transfer.rtgs')}</SelectItem>
                    <SelectItem value="ach">{t('ib.transfer.ach')}</SelectItem>
                    <SelectItem value="mobile">{t('ib.transfer.mobileWallet')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">{t('ib.transfer.bank')}</Label>
                <Select value={form.bank_name} onValueChange={(v) => setForm({ ...form, bank_name: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ethiopianBanks.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">{t('ib.transfer.accountNumber')} *</Label><Input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} /></div>
              <div><Label className="text-xs">{t('common.phone')}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+251..." /></div>
              <Button onClick={handleSave} className="w-full">{editingId ? t('common.update') : t('common.save')}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t('ib.beneficiary.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((b) => (
          <Card key={b.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{b.beneficiary_name}</p>
                    {b.nickname && <p className="text-xs text-muted-foreground">{b.nickname}</p>}
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{b.account_number}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(b)}><Edit className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-[10px]">{b.bank_name}</Badge>
                <Badge variant="secondary" className="text-[10px]">{b.transfer_type}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && !loading && (<p className="text-center text-sm text-muted-foreground py-8">{t('ib.beneficiary.noResults')}</p>)}
    </div>
  );
};

export default IBBeneficiaries;
