import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setProfile(data);
    }
    setLoading(false);
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Not authenticated' };
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    if (!error) await fetchProfile();
    return { error };
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  // Re-fetch when window regains focus (e.g. navigating back from KYC)
  useEffect(() => {
    const onFocus = () => fetchProfile();
    window.addEventListener('focus', onFocus);
    // Also listen for route-triggered visibility
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') fetchProfile();
    });
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [user]);

  return { profile, loading, updateProfile, refetch: fetchProfile };
};
