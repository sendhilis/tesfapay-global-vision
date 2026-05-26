import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface BDPSnapshot {
  id: string;
  snapshot_date: string;
  snapshot_type: string;
  metric_category: string;
  metrics: Record<string, any>;
  created_at: string;
}

export interface BDPIngestionLog {
  id: string;
  batch_id: string;
  source_system: string;
  entity_type: string;
  records_received: number;
  records_processed: number;
  records_failed: number;
  duration_ms: number | null;
  status: string;
  triggered_by: string;
  created_at: string;
}

export function useBDPSnapshots(category?: string) {
  const [snapshots, setSnapshots] = useState<BDPSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('bdp_snapshots').select('*').order('snapshot_date', { ascending: false }).limit(90);
    if (category) query = query.eq('metric_category', category);
    const { data } = await query;
    if (data) setSnapshots(data as unknown as BDPSnapshot[]);
    setLoading(false);
  }, [category]);

  useEffect(() => { fetch(); }, [fetch]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`bdp-snapshots-${category || 'all'}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bdp_snapshots' }, (payload) => {
        const newRow = payload.new as unknown as BDPSnapshot;
        if (!category || newRow.metric_category === category) {
          setSnapshots(prev => [newRow, ...prev].slice(0, 90));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [category]);

  return { snapshots, loading, refetch: fetch };
}

export function useBDPTransactions(days = 30) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const { data: txns } = await supabase.from('bdp_fact_transactions')
      .select('transaction_date, transaction_type, channel, direction, amount, fee, status')
      .gte('transaction_date', fromDate.toISOString().split('T')[0])
      .order('transaction_date', { ascending: false })
      .limit(1000);
    if (txns) setData(txns);
    setLoading(false);
  }, [days]);

  useEffect(() => { fetch(); }, [fetch]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('bdp-txn-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bdp_fact_transactions' }, (payload) => {
        setData(prev => [payload.new, ...prev].slice(0, 1000));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return { data, loading, refetch: fetch };
}

export function useBDPLoanPortfolio() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const { data: loans } = await supabase.from('bdp_fact_loans')
      .select('*, bdp_dim_customers(region, gender, customer_segment, kyc_tier), bdp_dim_products(product_name, product_type)')
      .eq('snapshot_date', today)
      .limit(1000);
    if (loans) setData(loans);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    const channel = supabase
      .channel('bdp-loans-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bdp_fact_loans' }, (payload) => {
        setData(prev => [payload.new, ...prev].slice(0, 1000));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return { data, loading, refetch: fetch };
}

export function useBDPAgentPerformance(days = 30) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const { data: agents } = await supabase.from('bdp_fact_agents')
      .select('*')
      .gte('report_date', fromDate.toISOString().split('T')[0])
      .order('report_date', { ascending: false })
      .limit(1000);
    if (agents) setData(agents);
    setLoading(false);
  }, [days]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    const channel = supabase
      .channel('bdp-agents-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bdp_fact_agents' }, (payload) => {
        setData(prev => [payload.new, ...prev].slice(0, 1000));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return { data, loading, refetch: fetch };
}

export function useBDPCustomers() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: customers } = await supabase.from('bdp_dim_customers')
      .select('region, gender, kyc_tier, customer_segment, is_active, account_open_date')
      .limit(1000);
    if (customers) setData(customers);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
}

export function useBDPIngestionLogs() {
  const [logs, setLogs] = useState<BDPIngestionLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('bdp_ingestion_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setLogs(data as unknown as BDPIngestionLog[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { logs, loading, refetch: fetch };
}

/**
 * Triggers the DEMO seed function — development/UAT only.
 * Production pipelines should use useTriggerIngest() which calls bdp-ingest.
 */
export function useTriggerSync() {
  const [syncing, setSyncing] = useState(false);

  const triggerSync = useCallback(async (params?: { customer_count?: number; transaction_days?: number; agent_days?: number }) => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('bdp-seed-demo', {
        body: { customer_count: 1000, transaction_days: 30, agent_days: 30, triggered_by: 'admin_ui', ...params },
      });
      if (error) throw error;
      return data;
    } finally {
      setSyncing(false);
    }
  }, []);

  return { triggerSync, syncing };
}

export function useTriggerIngest() {
  const [ingesting, setIngesting] = useState(false);

  const triggerIngest = useCallback(async (params?: { snapshot_date?: string; force?: boolean }) => {
    setIngesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('bdp-ingest', {
        body: { snapshot_date: params?.snapshot_date || new Date().toISOString().split('T')[0], force: params?.force ?? false },
      });
      if (error) throw error;
      return data;
    } finally {
      setIngesting(false);
    }
  }, []);

  return { triggerIngest, ingesting };
}
