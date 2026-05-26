import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@/components/MobilePortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Home, CreditCard, Users, BarChart3, FileText,
  ArrowDownToLine, Loader2, Clock, Check, X
} from 'lucide-react';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/agency' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/agency/payments' },
  { icon: <Users className="h-5 w-5" />, labelKey: 'admin.customers', path: '/agency/customers' },
  { icon: <BarChart3 className="h-5 w-5" />, labelKey: 'agency.reports', path: '/agency/reports' },
  { icon: <FileText className="h-5 w-5" />, labelKey: 'common.profile', path: '/agency/profile' },
];

const AgencyFloatRequest = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [agent, setAgent] = useState<any>(null);
  const [parentAgent, setParentAgent] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: ag } = await supabase.from('agents').select('*').eq('profile_id', user.id).single();
      if (ag) {
        setAgent(ag);
        if (ag.parent_agent_id) {
          const { data: parent } = await supabase.from('agents').select('*').eq('id', ag.parent_agent_id).single();
          setParentAgent(parent);
        }
        const { data: reqs } = await supabase.from('agent_float_requests').select('*')
          .eq('requesting_agent_id', ag.id).order('created_at', { ascending: false }).limit(20);
        setRequests(reqs || []);
      }
    };
    load();
  }, [user]);

  const handleRequest = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter valid amount'); return; }
    if (!agent?.parent_agent_id) { toast.error('No parent agent assigned'); return; }
    setLoading(true);

    const { data: inserted, error } = await supabase.from('agent_float_requests').insert({
      requesting_agent_id: agent.id,
      providing_agent_id: agent.parent_agent_id,
      amount: amt,
      notes,
    }).select().single();

    if (error) {
      toast.error('Failed to submit request');
      setLoading(false);
      return;
    }

    // Auto-approve for demo: deduct from super agent, credit to agent
    const { data: superAgent } = await supabase.from('agents').select('float_balance').eq('id', agent.parent_agent_id).single();
    if (superAgent && superAgent.float_balance >= amt) {
      await supabase.from('agents').update({ float_balance: superAgent.float_balance - amt }).eq('id', agent.parent_agent_id);
      await supabase.from('agents').update({ float_balance: agent.float_balance + amt }).eq('id', agent.id);
      await supabase.from('agent_float_requests').update({
        status: 'completed',
        resolved_at: new Date().toISOString(),
      }).eq('id', inserted.id);
      setAgent({ ...agent, float_balance: agent.float_balance + amt });
      toast.success(`Float of ${amt.toLocaleString()} ETB approved & credited!`);
    } else {
      toast.info('Request submitted - pending super agent approval');
    }

    setAmount('');
    setNotes('');
    const { data: reqs } = await supabase.from('agent_float_requests').select('*')
      .eq('requesting_agent_id', agent.id).order('created_at', { ascending: false }).limit(20);
    setRequests(reqs || []);
    setLoading(false);
  };

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

  return (
    <MobilePortalLayout portalName="Nisir Agent" portalColor="agency" navItems={navItems} showBack backPath="/agency">
      <div className="px-4 pt-4 pb-6 space-y-4">
        <h2 className="text-lg font-bold text-foreground">Float Management</h2>

        {agent && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-success/10 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">Current Float</p>
                  <p className="text-xl font-extrabold text-success">{fmt(agent.float_balance)}</p>
                  <p className="text-[10px] text-muted-foreground">ETB</p>
                </div>
                <div className="bg-primary/10 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">Max Float</p>
                  <p className="text-xl font-extrabold text-primary">{fmt(agent.max_float)}</p>
                  <p className="text-[10px] text-muted-foreground">ETB</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Category: <span className="font-semibold capitalize">{agent.agent_category?.replace('_', ' ')}</span>
              </p>
            </CardContent>
          </Card>
        )}

        {parentAgent && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-bold mb-3">Request Float from {parentAgent.business_name || 'Parent Agent'}</h3>
              <div className="space-y-3">
                <div className="relative">
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" className="h-12 text-lg font-bold pr-12" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ETB</span>
                </div>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" />
                <Button onClick={handleRequest} disabled={loading} className="w-full bg-primary">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Request'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!parentAgent && agent && (
          <Card>
            <CardContent className="p-4 text-center text-sm text-muted-foreground">
              {agent.agent_category === 'super_agent' 
                ? 'As a Super Agent, you manage float for agents below you.'
                : 'No parent agent assigned. Contact admin.'}
            </CardContent>
          </Card>
        )}

        <div>
          <h3 className="text-sm font-bold text-foreground mb-2">Recent Float Requests</h3>
          {requests.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No float requests yet</p>
          ) : (
            <div className="space-y-2">
              {requests.map((req) => (
                <Card key={req.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                        req.status === 'completed' ? 'bg-success/10' : req.status === 'rejected' ? 'bg-destructive/10' : 'bg-amber-500/10'
                      }`}>
                        {req.status === 'completed' ? <Check className="h-4 w-4 text-success" /> :
                         req.status === 'rejected' ? <X className="h-4 w-4 text-destructive" /> :
                         <Clock className="h-4 w-4 text-amber-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{fmt(req.amount)} ETB</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      req.status === 'completed' ? 'bg-success/10 text-success' :
                      req.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                      'bg-amber-500/10 text-amber-600'
                    }`}>{req.status}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobilePortalLayout>
  );
};

export default AgencyFloatRequest;
