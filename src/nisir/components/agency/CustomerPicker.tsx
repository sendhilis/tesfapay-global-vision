import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, Search, User, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Customer {
  id: string;
  first_name: string;
  father_name: string;
  msisdn: string;
  balance?: number;
  account_id?: string;
}

interface CustomerPickerProps {
  onSelect: (customer: Customer) => void;
  phoneValue: string;
  onPhoneChange: (val: string) => void;
  placeholder?: string;
  label?: string;
}

const CustomerPicker = ({ onSelect, phoneValue, onPhoneChange, placeholder, label }: CustomerPickerProps) => {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showList, setShowList] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingList(true);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, father_name, msisdn')
        .not('msisdn', 'is', null)
        .order('first_name')
        .limit(100);

      if (profiles && profiles.length > 0) {
        // Fetch primary account balances for each
        const profileIds = profiles.map(p => p.id);
        const { data: accounts } = await supabase
          .from('accounts')
          .select('id, profile_id, available_balance')
          .in('profile_id', profileIds)
          .eq('is_primary', true);

        const accountMap = new Map(accounts?.map(a => [a.profile_id, { balance: a.available_balance, account_id: a.id }]) || []);

        const enriched: Customer[] = profiles.map(p => ({
          id: p.id,
          first_name: p.first_name || '',
          father_name: p.father_name || '',
          msisdn: p.msisdn || '',
          balance: accountMap.get(p.id)?.balance ?? 0,
          account_id: accountMap.get(p.id)?.account_id,
        }));

        setCustomers(enriched);
        setFiltered(enriched);
      }
      setLoadingList(false);
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (!phoneValue) {
      setFiltered(customers);
      setShowList(true);
      return;
    }
    const q = phoneValue.toLowerCase();
    const results = customers.filter(c =>
      c.msisdn?.includes(q) ||
      `${c.first_name} ${c.father_name}`.toLowerCase().includes(q)
    );
    setFiltered(results);
    setShowList(true);
  }, [phoneValue, customers]);

  const handleSelect = (customer: Customer) => {
    const shortPhone = customer.msisdn?.replace('+251', '') || '';
    onPhoneChange(shortPhone);
    setShowList(false);
    onSelect(customer);
  };

  const fmt = (n: number) => n?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00';

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground block">
        {label || t('agency.customerPhone') || 'Customer Phone'}
      </label>
      <div className="flex gap-2">
        <span className="flex items-center px-3 bg-muted rounded-lg text-sm font-medium">
          <Phone className="h-4 w-4 mr-1" />+251
        </span>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={phoneValue}
            onChange={e => onPhoneChange(e.target.value)}
            placeholder={placeholder || '9XXXXXXXX or name'}
            className="pl-9"
            onFocus={() => setShowList(true)}
          />
        </div>
      </div>

      {showList && (
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          <div className="px-3 py-1.5 bg-muted/50 border-b border-border">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {t('agency.registeredCustomers') || 'Registered Customers'} ({filtered.length})
            </p>
          </div>
          {loadingList ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              {t('agency.noCustomersFound') || 'No customers found'}
            </p>
          ) : (
            <ScrollArea className="max-h-48">
              <div className="divide-y divide-border">
                {filtered.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {c.first_name} {c.father_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {c.msisdn}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-foreground">{fmt(c.balance || 0)}</p>
                      <p className="text-[9px] text-muted-foreground">ETB</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerPicker;
