import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const useTransactionToasts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('txn-toasts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as { title: string; message: string; metadata: any };
          const isCredit = n.metadata?.direction === 'credit';
          toast(n.title, {
            description: n.message,
            action: {
              label: 'View',
              onClick: () => navigate('/retail/notifications'),
            },
            duration: 5000,
            className: isCredit ? 'border-success/30' : undefined,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);
};
