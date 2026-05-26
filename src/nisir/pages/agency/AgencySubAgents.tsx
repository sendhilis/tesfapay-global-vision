import { useState, useEffect } from 'react';
import { useAuth } from '@nisir/hooks/useAuth';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@nisir/components/MobilePortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Home, CreditCard, Users, BarChart3, FileText,
  Network, Send, Loader2, AlertTriangle, Check, MapPin
} from 'lucide-react';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/agency' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/agency/payments' },
  { icon: <Users className="h-5 w-5" />, labelKey: 'admin.customers', path: '/agency/customers' },
  { icon: <BarChart3 className="h-5 w-5" />, labelKey: 'agency.reports', path: '/agency/reports' },
  { icon: <FileText className="h-5 w-5" />, labelKey: 'common.profile', path: '/agency/profile' },
];

const AgencySubAgents = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [agent, setAgent] = useState<any>(null);
  const [subAgents, setSubAgents] = useState<any[]>([]);
  const [fundingAgentId, setFundingAgentId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: ag } = await supabase.from('agents').select('*').eq('profile_id', user.id).single();
      if (ag) {
        setAgent(ag);
        const { data: children } = await supabase.from('agents').select('*').eq('parent_agent_id', ag.id).order('created_at', { ascending: false });
        setSubAgents(children || []);
      }
    };
    load();
  }, [user]);

  const fundSubAgent = async (subAgent: any) => {
    const amt = parseFloat(fundAmount);
    if (!amt || amt <= 0) { toast.error('Enter valid amount'); return; }
    if (agent && amt > agent.float_balance) { toast.error('Insufficient float'); return; }
    setLoading(true);

    await supabase.from('agents').update({ float_balance: agent.float_balance - amt }).eq('id', agent.id);
    await supabase.from('agents').update({ float_balance: subAgent.float_balance + amt }).eq('id', subAgent.id);

    setAgent({ ...agent, float_balance: agent.float_balance - amt });
    setSubAgents(prev => prev.map(sa => sa.id === subAgent.id ? { ...sa, float_balance: sa.float_balance + amt } : sa));
    setFundingAgentId(null);
    setFundAmount('');
    setLoading(false);
    toast.success(`${amt.toLocaleString()} ETB sent to ${subAgent.business_name}`);
  };

  const fmt = (n: number) => n?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00';
  const floatStatus = (sa: any) => {
    const pct = sa.float_balance / sa.max_float;
    return pct > 0.5 ? 'healthy' : pct > 0.2 ? 'watch' : 'critical';
  };
  const statusColor = (s: string) => s === 'healthy' ? 'bg-success text-success' : s === 'watch' ? 'bg-amber-500 text-amber-600' : 'bg-destructive text-destructive';

  return (
    <MobilePortalLayout portalName="Nisir Agent" portalColor="agency" navItems={navItems} showBack backPath="/agency">
      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Network className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Sub-Agent Network</h2>
            <p className="text-xs text-muted-foreground">{subAgents.length} outlet{subAgents.length !== 1 ? 's' : ''} under management</p>
          </div>
        </div>

        {agent && (
          <div className="p-3 bg-primary/10 rounded-xl flex justify-between items-center">
            <div>
              <p className="text-[10px] text-muted-foreground">Your Float Balance</p>
              <p className="text-lg font-extrabold text-primary">{fmt(agent.float_balance)} ETB</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Distributed</p>
              <p className="text-sm font-bold">{fmt(subAgents.reduce((s, sa) => s + sa.float_balance, 0))} ETB</p>
            </div>
          </div>
        )}

        {subAgents.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Network className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No Sub-Agents Yet</p>
              <p className="text-xs text-muted-foreground mt-1">Sub-agents onboarded under your code will appear here</p>
              <p className="text-xs font-mono mt-2 bg-muted px-3 py-1 rounded-lg inline-block">{agent?.agent_code}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {subAgents.map(sa => {
              const status = floatStatus(sa);
              const pct = (sa.float_balance / sa.max_float) * 100;
              return (
                <motion.div key={sa.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={`h-3 w-3 rounded-full mt-1 ${statusColor(status).split(' ')[0]}/20`}>
                          <div className={`h-3 w-3 rounded-full ${statusColor(status).split(' ')[0]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate">{sa.business_name}</p>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <MapPin className="h-2.5 w-2.5" />{sa.location}
                              </div>
                              <p className="text-[10px] font-mono text-muted-foreground">{sa.agent_code}</p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="text-sm font-bold">{fmt(sa.float_balance)}</p>
                              <p className="text-[10px] text-muted-foreground">{pct.toFixed(0)}% of {fmt(sa.max_float)}</p>
                            </div>
                          </div>

                          {status === 'critical' && (
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-destructive">
                              <AlertTriangle className="h-3 w-3" /> Low float — needs funding
                            </div>
                          )}

                          {fundingAgentId === sa.id ? (
                            <div className="mt-2 flex gap-2">
                              <Input type="number" value={fundAmount} onChange={e => setFundAmount(e.target.value)}
                                placeholder="Amount" className="flex-1 h-8 text-sm" />
                              <Button size="sm" onClick={() => fundSubAgent(sa)} disabled={loading} className="h-8">
                                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setFundingAgentId(null)} className="h-8">✕</Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => setFundingAgentId(sa.id)} className="mt-2 h-7 text-xs">
                              <Send className="h-3 w-3 mr-1" /> Fund Agent
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </MobilePortalLayout>
  );
};

export default AgencySubAgents;
