import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface BriefingData {
  totalBalance: number;
  accountCount: number;
  pendingLoans: { product_type: string; next_due: string; amount: number }[];
  recentNotifications: number;
  failedTransactions: number;
}

export const useDailyBriefing = () => {
  const { user } = useAuth();
  const [briefingContext, setBriefingContext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchBriefingData = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const threeDaysOut = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

      const [accountsRes, loansRes, notifsRes, failedTxRes] = await Promise.all([
        supabase.from('accounts').select('balance, product_name, status').eq('profile_id', user.id).eq('status', 'active'),
        supabase.from('loans').select('product_type, status, outstanding_balance').eq('profile_id', user.id).in('status', ['active', 'disbursed']),
        supabase.from('notifications').select('id').eq('profile_id', user.id).eq('is_read', false),
        supabase.from('transactions').select('id').eq('profile_id', user.id).eq('status', 'failed').gte('created_at', new Date(Date.now() - 86400000).toISOString()),
      ]);

      const accounts = accountsRes.data || [];
      const loans = loansRes.data || [];
      const unreadNotifs = notifsRes.data?.length || 0;
      const failedTx = failedTxRes.data?.length || 0;

      const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

      // Build context string for AI
      let ctx = `USER BRIEFING CONTEXT (today: ${today}):\n`;
      ctx += `- ${accounts.length} active account(s), total balance: ETB ${totalBalance.toLocaleString()}\n`;
      
      if (loans.length > 0) {
        const overdueLoans = loans.filter(l => l.status === 'defaulted');
        ctx += `- ${loans.length} active loan(s), ${overdueLoans.length} overdue\n`;
        loans.forEach(l => {
          ctx += `  • ${l.product_type}: outstanding ETB ${(l.outstanding_balance || 0).toLocaleString()}, status: ${l.status}\n`;
        });
      } else {
        ctx += `- No active loans\n`;
      }

      if (failedTx > 0) ctx += `- ⚠️ ${failedTx} failed transaction(s) in last 24h\n`;
      if (unreadNotifs > 0) ctx += `- ${unreadNotifs} unread notification(s)\n`;

      setBriefingContext(ctx);
      setHasFetched(true);
      return ctx;
    } catch (e) {
      console.error('Briefing fetch error:', e);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !hasFetched) {
      fetchBriefingData();
    }
  }, [user, hasFetched, fetchBriefingData]);

  return { briefingContext, loading, fetchBriefingData };
};
