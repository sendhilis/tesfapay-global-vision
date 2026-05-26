import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Tables } from '@/integrations/supabase/types';

type Account = Tables<'accounts'>;

export const useAccounts = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);

  const fetchAccounts = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('profile_id', user.id)
      .order('is_primary', { ascending: false });

    if (!error && data) {
      setAccounts(data);
      setTotalBalance(data.reduce((sum, acc) => sum + (acc.available_balance || 0), 0));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  // Real-time subscription for balance updates
  useEffect(() => {
    if (!user) return;

    const channelName = `accounts-realtime-${user.id}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'accounts',
          filter: `profile_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setAccounts((prev) => {
              const updated = prev.map((acc) =>
                acc.id === (payload.new as Account).id ? (payload.new as Account) : acc
              );
              setTotalBalance(updated.reduce((sum, a) => sum + (a.available_balance || 0), 0));
              return updated;
            });
          } else if (payload.eventType === 'INSERT') {
            setAccounts((prev) => [...prev, payload.new as Account]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { accounts, loading, totalBalance, refetch: fetchAccounts };
};
