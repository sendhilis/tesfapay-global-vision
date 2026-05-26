import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@/components/MobilePortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import {
  Home, CreditCard, Users, BarChart3, FileText,
  Trophy, Star, Target, TrendingUp, Zap, Shield, Award, Flame
} from 'lucide-react';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/agency' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/agency/payments' },
  { icon: <Users className="h-5 w-5" />, labelKey: 'admin.customers', path: '/agency/customers' },
  { icon: <BarChart3 className="h-5 w-5" />, labelKey: 'agency.reports', path: '/agency/reports' },
  { icon: <FileText className="h-5 w-5" />, labelKey: 'common.profile', path: '/agency/profile' },
];

const badges = [
  { name: 'First 100', icon: '🎯', desc: '100 transactions completed', earned: true },
  { name: 'Liquidity Pro', icon: '💧', desc: 'Maintained healthy float 30 days', earned: true },
  { name: 'Zero Variance', icon: '✅', desc: 'Perfect EOD reconciliation', earned: true },
  { name: 'Top Performer', icon: '🏆', desc: 'Top 10% in region', earned: false },
  { name: 'Customer Star', icon: '⭐', desc: 'Zero complaints in 60 days', earned: false },
  { name: '1000 Club', icon: '🔥', desc: '1000 transactions milestone', earned: false },
];

const AgencyPerformance = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [agent, setAgent] = useState<any>(null);
  const [txnCount, setTxnCount] = useState(0);
  const [activeDays, setActiveDays] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: ag } = await supabase.from('agents').select('*').eq('profile_id', user.id).single();
      if (ag) {
        setAgent(ag);
        const { count } = await supabase.from('agent_transactions').select('*', { count: 'exact', head: true }).eq('agent_id', ag.id);
        setTxnCount(count || 0);
        const { data: days } = await supabase.from('agent_transactions').select('created_at').eq('agent_id', ag.id);
        const uniqueDays = new Set((days || []).map(d => d.created_at?.split('T')[0]));
        setActiveDays(uniqueDays.size);
      }
    };
    load();
  }, [user]);

  const successRate = 98.5;
  const floatHealth = agent ? Math.min((agent.float_balance / agent.max_float) * 100, 100) : 0;
  const customerGrowth = 12;
  const complaintRatio = 0.5;

  const scorecardMetrics = [
    { label: 'Transaction Success', value: `${successRate}%`, progress: successRate, color: 'bg-success', icon: Target },
    { label: 'Float Discipline', value: `${floatHealth.toFixed(0)}%`, progress: floatHealth, color: floatHealth > 50 ? 'bg-success' : floatHealth > 25 ? 'bg-amber-500' : 'bg-destructive', icon: Shield },
    { label: 'Active Days (30d)', value: `${Math.min(activeDays, 30)}/30`, progress: (Math.min(activeDays, 30) / 30) * 100, color: 'bg-primary', icon: Flame },
    { label: 'Customer Growth', value: `+${customerGrowth}`, progress: Math.min(customerGrowth * 5, 100), color: 'bg-info', icon: TrendingUp },
    { label: 'Complaint Ratio', value: `${complaintRatio}%`, progress: 100 - complaintRatio * 10, color: 'bg-success', icon: Star },
    { label: 'KYC Quality', value: '95%', progress: 95, color: 'bg-primary', icon: Zap },
  ];

  const overallScore = Math.round(scorecardMetrics.reduce((s, m) => s + m.progress, 0) / scorecardMetrics.length);

  return (
    <MobilePortalLayout portalName="Nisir Agent" portalColor="agency" navItems={navItems} showBack backPath="/agency">
      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Performance Scorecard</h2>
            <p className="text-xs text-muted-foreground">{agent?.business_name || 'Agent'}</p>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 text-center text-primary-foreground"
          style={{ background: overallScore >= 80 ? 'linear-gradient(135deg, hsl(140,50%,35%), hsl(140,40%,45%))' : overallScore >= 60 ? 'linear-gradient(135deg, hsl(43,75%,45%), hsl(43,65%,55%))' : 'linear-gradient(135deg, hsl(0,50%,45%), hsl(0,40%,55%))' }}>
          <p className="text-sm opacity-80 mb-1">Overall Performance Score</p>
          <p className="text-5xl font-extrabold">{overallScore}</p>
          <p className="text-sm opacity-70 mt-1">
            {overallScore >= 80 ? '🏆 Excellent' : overallScore >= 60 ? '👍 Good' : '⚠️ Needs Improvement'}
          </p>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-primary-foreground/10 rounded-xl p-2">
              <p className="text-[10px] opacity-70">Total Transactions</p>
              <p className="text-lg font-bold">{txnCount}</p>
            </div>
            <div className="bg-primary-foreground/10 rounded-xl p-2">
              <p className="text-[10px] opacity-70">Rank</p>
              <p className="text-lg font-bold">#3 <span className="text-xs font-normal">/ 45</span></p>
            </div>
          </div>
        </motion.div>

        <div>
          <h3 className="text-sm font-bold text-foreground mb-2">Scorecard Metrics</h3>
          <div className="space-y-2">
            {scorecardMetrics.map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div key={m.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium flex-1">{m.label}</span>
                        <span className="text-sm font-bold">{m.value}</span>
                      </div>
                      <Progress value={m.progress} className="h-1.5" />
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-foreground mb-2">Badges & Achievements</h3>
          <div className="grid grid-cols-3 gap-2">
            {badges.map(b => (
              <div key={b.name} className={`p-3 rounded-xl border text-center transition-all ${b.earned ? 'bg-amber-500/5 border-amber-500/20' : 'bg-muted/50 border-border opacity-50'}`}>
                <span className="text-2xl block">{b.icon}</span>
                <p className="text-[10px] font-bold mt-1">{b.name}</p>
                <p className="text-[8px] text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-1"><TrendingUp className="h-4 w-4 text-info" /> What to Improve</h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2"><span className="text-amber-500">•</span>Increase active days to earn "30-Day Streak" badge</li>
              <li className="flex items-start gap-2"><span className="text-amber-500">•</span>Process 50 more bill payments for "Service Champion" badge</li>
              <li className="flex items-start gap-2"><span className="text-amber-500">•</span>Maintain zero complaints for 30 more days</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </MobilePortalLayout>
  );
};

export default AgencyPerformance;
