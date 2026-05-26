import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Tables } from '@/integrations/supabase/types';

type Loan = Tables<'loans'>;

export const useLoans = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLoans = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('loans')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setLoans(data);
    setLoading(false);
  };

  useEffect(() => { fetchLoans(); }, [user]);

  return { loans, loading, refetch: fetchLoans };
};

export const useLoanSchedule = (loanId: string | null) => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loanId) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('loan_schedules')
        .select('*')
        .eq('loan_id', loanId)
        .order('installment_number', { ascending: true });
      if (data) setSchedule(data);
      setLoading(false);
    };
    fetch();
  }, [loanId]);

  return { schedule, loading };
};

export const useLoanEvents = (loanId: string | null) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loanId) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('loan_events')
        .select('*')
        .eq('loan_id', loanId)
        .order('created_at', { ascending: false });
      if (data) setEvents(data);
      setLoading(false);
    };
    fetch();
  }, [loanId]);

  return { events, loading };
};

export const useLoanStatements = (loanId: string | null) => {
  const [statements, setStatements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loanId) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('loan_statements')
        .select('*')
        .eq('loan_id', loanId)
        .order('statement_period_start', { ascending: false });
      if (data) setStatements(data);
      setLoading(false);
    };
    fetch();
  }, [loanId]);

  return { statements, loading };
};

export const useLoanPenalties = (loanId: string | null) => {
  const [penalties, setPenalties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loanId) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('loan_penalties')
        .select('*')
        .eq('loan_id', loanId)
        .order('created_at', { ascending: false });
      if (data) setPenalties(data);
      setLoading(false);
    };
    fetch();
  }, [loanId]);

  return { penalties, loading };
};

export const useLoanConfigurations = () => {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('loan_configurations')
        .select('*');
      if (data) setConfigs(data);
      setLoading(false);
    };
    fetch();
  }, []);

  return { configs, loading, refetch: () => {} };
};
