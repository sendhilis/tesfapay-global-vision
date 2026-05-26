import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@/components/MobilePortalLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Home, CreditCard, Users, BarChart3, FileText,
  User, MapPin, Phone, Shield, LogOut, Star
} from 'lucide-react';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/agency' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/agency/payments' },
  { icon: <Users className="h-5 w-5" />, labelKey: 'admin.customers', path: '/agency/customers' },
  { icon: <BarChart3 className="h-5 w-5" />, labelKey: 'agency.reports', path: '/agency/reports' },
  { icon: <FileText className="h-5 w-5" />, labelKey: 'common.profile', path: '/agency/profile' },
];

const AgencyProfile = () => {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: ag }, { data: prof }] = await Promise.all([
        supabase.from('agents').select('*').eq('profile_id', user.id).single(),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ]);
      setAgent(ag);
      setProfile(prof);
    };
    load();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    toast.success('Logged out');
  };

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

  return (
    <MobilePortalLayout portalName="Nisir Agent" portalColor="agency" navItems={navItems} showBack backPath="/agency">
      <div className="px-4 pt-4 pb-6 space-y-4">
        {/* Agent Identity */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-2">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <User className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">{agent?.business_name || 'Agent'}</h2>
          <p className="text-xs text-muted-foreground font-mono">{agent?.agent_code}</p>
          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-medium capitalize">
            {agent?.status}
          </span>
        </motion.div>

        {/* Agent Details */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground">{t('common.profile')}</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Category</span>
                <span className="ml-auto font-semibold capitalize">{agent?.agent_category?.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Phone</span>
                <span className="ml-auto font-semibold">{agent?.phone || profile?.msisdn || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Location</span>
                <span className="ml-auto font-semibold">{agent?.location || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Star className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Commission Rate</span>
                <span className="ml-auto font-semibold">{agent?.commission_rate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Float & Limits */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground">{t('agency.float')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-success/10 rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground">Current Float</p>
                <p className="text-lg font-extrabold text-success">{fmt(agent?.float_balance || 0)}</p>
              </div>
              <div className="bg-primary/10 rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground">Max Float</p>
                <p className="text-lg font-extrabold text-primary">{fmt(agent?.max_float || 0)}</p>
              </div>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Daily Cash-In Limit</span><span className="font-medium">{fmt(agent?.daily_cash_in_limit || 0)} ETB</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Daily Cash-Out Limit</span><span className="font-medium">{fmt(agent?.daily_cash_out_limit || 0)} ETB</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <h3 className="text-sm font-bold text-foreground">Account</h3>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="ml-auto font-medium text-xs">{user?.email || profile?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Joined</span>
              <span className="ml-auto font-medium text-xs">{agent?.onboarded_at ? new Date(agent.onboarded_at).toLocaleDateString() : 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        <Button variant="destructive" onClick={handleLogout} className="w-full">
          <LogOut className="h-4 w-4 mr-2" /> {t('common.signOut')}
        </Button>
      </div>
    </MobilePortalLayout>
  );
};

export default AgencyProfile;
