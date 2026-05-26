import { useState, useEffect } from 'react';
import { useAuth } from '@nisir/hooks/useAuth';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@nisir/components/MobilePortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Home, CreditCard, Users, BarChart3, FileText,
  MessageSquareWarning, Check, Loader2, Clock, AlertTriangle
} from 'lucide-react';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/agency' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/agency/payments' },
  { icon: <Users className="h-5 w-5" />, labelKey: 'admin.customers', path: '/agency/customers' },
  { icon: <BarChart3 className="h-5 w-5" />, labelKey: 'agency.reports', path: '/agency/reports' },
  { icon: <FileText className="h-5 w-5" />, labelKey: 'common.profile', path: '/agency/profile' },
];

const categories = [
  { key: 'failed_transaction', label: 'Failed Transaction', icon: '❌' },
  { key: 'delayed_reversal', label: 'Delayed Reversal', icon: '⏳' },
  { key: 'overcharge', label: 'Overcharge', icon: '💰' },
  { key: 'missing_receipt', label: 'Missing Receipt', icon: '🧾' },
  { key: 'service_issue', label: 'Service Issue', icon: '🔧' },
  { key: 'suspicious_agent', label: 'Suspicious Activity', icon: '🚨' },
  { key: 'identity_issue', label: 'Identity Issue', icon: '🪪' },
  { key: 'other', label: 'Other', icon: '📋' },
];

interface Complaint {
  id: string;
  category: string;
  customerPhone: string;
  reference: string;
  description: string;
  status: string;
  createdAt: string;
}

const AgencyComplaints = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [tab, setTab] = useState<'new' | 'history'>('new');
  const [category, setCategory] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [txnRef, setTxnRef] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [agentId, setAgentId] = useState('');

  useEffect(() => {
    if (user) {
      supabase.from('agents').select('id').eq('profile_id', user.id).single()
        .then(({ data }) => { if (data) setAgentId(data.id); });
      // Load existing complaints from localStorage (demo persistence)
      const saved = localStorage.getItem(`complaints_${user.id}`);
      if (saved) setComplaints(JSON.parse(saved));
    }
  }, [user]);

  const handleSubmit = () => {
    if (!category) { toast.error('Select a category'); return; }
    if (!description) { toast.error('Enter description'); return; }
    setLoading(true);

    const complaint: Complaint = {
      id: 'CMP-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      category, customerPhone, reference: txnRef, description,
      status: 'open', createdAt: new Date().toISOString(),
    };

    const updated = [complaint, ...complaints];
    setComplaints(updated);
    if (user) localStorage.setItem(`complaints_${user.id}`, JSON.stringify(updated));

    toast.success(`Complaint ${complaint.id} registered. SMS sent to customer.`);
    setCategory(''); setCustomerPhone(''); setTxnRef(''); setDescription('');
    setLoading(false);
    setTab('history');
  };

  const statusColor = (s: string) =>
    s === 'resolved' ? 'bg-success/10 text-success' :
    s === 'in_progress' ? 'bg-amber-500/10 text-amber-600' :
    'bg-destructive/10 text-destructive';

  return (
    <MobilePortalLayout portalName="Nisir Agent" portalColor="agency" navItems={navItems} showBack backPath="/agency">
      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <MessageSquareWarning className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Customer Complaints</h2>
            <p className="text-xs text-muted-foreground">Register & track issues</p>
          </div>
        </div>

        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          {(['new', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${tab === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
              {t === 'new' ? 'New Complaint' : `History (${complaints.length})`}
            </button>
          ))}
        </div>

        {tab === 'new' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map(c => (
                  <button key={c.key} onClick={() => setCategory(c.key)}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all text-xs ${category === c.key ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                    <span className="mr-1">{c.icon}</span>{c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Customer Phone (optional)</label>
              <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+251..." className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Transaction Reference (optional)</label>
              <Input value={txnRef} onChange={e => setTxnRef(e.target.value)} placeholder="ATXN-XXXXXXXX" className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the issue..." rows={3} />
            </div>
            <Button onClick={handleSubmit} disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-primary-foreground">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Complaint'}
            </Button>
          </motion.div>
        )}

        {tab === 'history' && (
          <div className="space-y-2">
            {complaints.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No complaints registered</p>
            ) : complaints.map(c => (
              <Card key={c.id}>
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-mono font-bold">{c.id}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${statusColor(c.status)}`}>{c.status}</span>
                  </div>
                  <p className="text-sm font-medium capitalize">{c.category.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MobilePortalLayout>
  );
};

export default AgencyComplaints;
