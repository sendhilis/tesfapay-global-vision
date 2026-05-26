import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@/components/MobilePortalLayout';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import {
  Home, CreditCard, Users, BarChart3, FileText,
  Search, Phone, ArrowDownToLine, ArrowUpFromLine, User
} from 'lucide-react';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/agency' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/agency/payments' },
  { icon: <Users className="h-5 w-5" />, labelKey: 'admin.customers', path: '/agency/customers' },
  { icon: <BarChart3 className="h-5 w-5" />, labelKey: 'agency.reports', path: '/agency/reports' },
  { icon: <FileText className="h-5 w-5" />, labelKey: 'common.profile', path: '/agency/profile' },
];

interface CustomerTxn {
  customer_name: string | null;
  customer_msisdn: string | null;
  total_cash_in: number;
  total_cash_out: number;
  txn_count: number;
  last_txn: string | null;
}

const AgencyCustomers = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<CustomerTxn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: ag } = await supabase.from('agents').select('id').eq('profile_id', user.id).single();
      if (!ag) { setLoading(false); return; }
      const { data: txns } = await supabase.from('agent_transactions').select('*').eq('agent_id', ag.id);
      if (txns) {
        const map = new Map<string, CustomerTxn>();
        txns.forEach(t => {
          const key = t.customer_msisdn || t.customer_name || 'Unknown';
          const existing = map.get(key) || { customer_name: t.customer_name, customer_msisdn: t.customer_msisdn, total_cash_in: 0, total_cash_out: 0, txn_count: 0, last_txn: null };
          if (t.transaction_type === 'cash_in') existing.total_cash_in += t.amount;
          else existing.total_cash_out += t.amount;
          existing.txn_count++;
          if (!existing.last_txn || (t.created_at && t.created_at > existing.last_txn)) existing.last_txn = t.created_at;
          map.set(key, existing);
        });
        setCustomers(Array.from(map.values()).sort((a, b) => (b.last_txn || '').localeCompare(a.last_txn || '')));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0 });
  const filtered = customers.filter(c =>
    (c.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.customer_msisdn || '').includes(search)
  );

  return (
    <MobilePortalLayout portalName="Nisir Agent" portalColor="agency" navItems={navItems} showBack backPath="/agency">
      <div className="px-4 pt-4 pb-6 space-y-4">
        <h2 className="text-lg font-bold text-foreground">{t('agency.customers')}</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone" className="pl-10" />
        </div>

        <p className="text-xs text-muted-foreground">{filtered.length} customers served</p>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <User className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No customers found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="p-3 bg-card rounded-xl border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{c.customer_name || 'Unknown'}</p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {c.customer_msisdn || 'N/A'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground">{c.txn_count} txns</p>
                  </div>
                </div>
                <div className="flex gap-4 mt-2 text-[10px]">
                  <span className="flex items-center gap-1 text-success"><ArrowDownToLine className="h-3 w-3" />{fmt(c.total_cash_in)} in</span>
                  <span className="flex items-center gap-1 text-portal-merchant"><ArrowUpFromLine className="h-3 w-3" />{fmt(c.total_cash_out)} out</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </MobilePortalLayout>
  );
};

export default AgencyCustomers;
