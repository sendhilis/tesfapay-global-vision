import { useState, useEffect } from 'react';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import { useAuth } from '@nisir/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@nisir/components/MobilePortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Home, CreditCard, Users, BarChart3, FileText,
  Search, Phone, Eye, Loader2, ArrowDownToLine, ArrowUpFromLine, Receipt
} from 'lucide-react';
import CustomerPicker from '@nisir/components/agency/CustomerPicker';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/agency' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/agency/payments' },
  { icon: <Users className="h-5 w-5" />, labelKey: 'admin.customers', path: '/agency/customers' },
  { icon: <BarChart3 className="h-5 w-5" />, labelKey: 'agency.reports', path: '/agency/reports' },
  { icon: <FileText className="h-5 w-5" />, labelKey: 'common.profile', path: '/agency/profile' },
];

const AgencyBalanceInquiry = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [statementCount, setStatementCount] = useState(5);

  const handleSearch = async () => {
    if (!customerPhone || customerPhone.length < 9) { toast.error('Enter valid phone'); return; }
    setLoading(true);
    const phone = customerPhone.startsWith('+') ? customerPhone : `+251${customerPhone.replace(/^0/, '')}`;
    const { data: profile } = await supabase.from('profiles').select('id, first_name, father_name, msisdn')
      .eq('msisdn', phone).single();

    if (!profile) { toast.error('Customer not found'); setLoading(false); return; }

    const { data: accounts } = await supabase.from('accounts').select('*')
      .eq('profile_id', profile.id).order('is_primary', { ascending: false });

    const { data: txns } = await supabase.from('transactions').select('*')
      .eq('profile_id', profile.id).order('created_at', { ascending: false }).limit(statementCount);

    setCustomerData({ profile, accounts: accounts || [] });
    setTransactions(txns || []);
    setLoading(false);
  };

  const fmt = (n: number) => n?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00';

  return (
    <MobilePortalLayout portalName="Nisir Agent" portalColor="agency" navItems={navItems} showBack backPath="/agency/payments">
      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-info/10 flex items-center justify-center">
            <Eye className="h-5 w-5 text-info" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{t('agency.balanceInquiry') || 'Balance Inquiry'}</h2>
            <p className="text-xs text-muted-foreground">{t('agency.miniStatement') || 'Balance & Mini Statement'}</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <CustomerPicker
              phoneValue={customerPhone}
              onPhoneChange={setCustomerPhone}
              label="Customer Phone"
              onSelect={(c) => {
                const phone = c.msisdn?.replace('+251', '') || '';
                setCustomerPhone(phone);
                handleSearch();
              }}
            />
            <Button onClick={handleSearch} disabled={loading} className="w-full bg-info hover:bg-info/90 text-primary-foreground">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-2" />Search</>}
            </Button>
          </CardContent>
        </Card>

        <AnimatePresence>
          {customerData && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-bold text-foreground">{customerData.profile.first_name} {customerData.profile.father_name}</p>
                  <p className="text-xs text-muted-foreground">{customerData.profile.msisdn}</p>
                  <div className="mt-3 space-y-2">
                    {customerData.accounts.map((acc: any) => (
                      <div key={acc.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-xl">
                        <div>
                          <p className="text-xs font-medium">{acc.product_name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{acc.account_number}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">{fmt(acc.available_balance)}</p>
                          <p className="text-[10px] text-muted-foreground">Available</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-foreground">Mini Statement (Last {statementCount})</h3>
                  <div className="flex gap-1">
                    {[5, 10, 20].map(n => (
                      <button key={n} onClick={() => { setStatementCount(n); handleSearch(); }}
                        className={`text-[10px] px-2 py-0.5 rounded-full ${statementCount === n ? 'bg-info text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                {transactions.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No transactions</p>
                ) : (
                  <div className="space-y-1.5">
                    {transactions.map(txn => (
                      <div key={txn.id} className="flex items-center gap-2 p-2.5 bg-card rounded-lg border border-border">
                        <div className={`h-7 w-7 rounded-md flex items-center justify-center ${txn.direction === 'credit' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                          {txn.direction === 'credit' ? <ArrowDownToLine className="h-3.5 w-3.5 text-success" /> : <ArrowUpFromLine className="h-3.5 w-3.5 text-destructive" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{txn.description || txn.transaction_type}</p>
                          <p className="text-[9px] text-muted-foreground">{new Date(txn.created_at).toLocaleDateString()}</p>
                        </div>
                        <p className={`text-xs font-bold ${txn.direction === 'credit' ? 'text-success' : 'text-destructive'}`}>
                          {txn.direction === 'credit' ? '+' : '-'}{fmt(txn.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobilePortalLayout>
  );
};

export default AgencyBalanceInquiry;
