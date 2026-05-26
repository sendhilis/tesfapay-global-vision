import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@/components/MobilePortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Home, CreditCard, Users, BarChart3, FileText,
  UserPlus, Building2, MapPin, Phone, Check, Loader2, Crown, Shield, User
} from 'lucide-react';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/agency' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/agency/payments' },
  { icon: <Users className="h-5 w-5" />, labelKey: 'admin.customers', path: '/agency/customers' },
  { icon: <BarChart3 className="h-5 w-5" />, labelKey: 'agency.reports', path: '/agency/reports' },
  { icon: <FileText className="h-5 w-5" />, labelKey: 'common.profile', path: '/agency/profile' },
];

const categoryInfo = {
  super_agent: { label: 'Super Agent', icon: Crown, maxFloat: 500000, dailyCashIn: 500000, dailyCashOut: 500000, commission: 1.0, color: 'text-amber-500', desc: 'Manages agents. Highest float. Distributes float to agents.' },
  agent: { label: 'Agent', icon: Shield, maxFloat: 200000, dailyCashIn: 200000, dailyCashOut: 200000, commission: 0.5, color: 'text-primary', desc: 'Standard agent. Handles cash in/out. Requests float from super agent.' },
  sub_agent: { label: 'Sub Agent', icon: User, maxFloat: 50000, dailyCashIn: 50000, dailyCashOut: 50000, commission: 0.3, color: 'text-muted-foreground', desc: 'Entry level. Limited float. Requests float from agent.' },
};

type Step = 'category' | 'details' | 'review' | 'success';

const AgencyOnboarding = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<'super_agent' | 'agent' | 'sub_agent'>('agent');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [parentCode, setParentCode] = useState('');
  const [loading, setLoading] = useState(false);

  const info = categoryInfo[category];

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    let parentAgentId: string | null = null;
    if (category !== 'super_agent' && parentCode) {
      const { data: parent } = await supabase.from('agents').select('id')
        .eq('agent_code', parentCode).single();
      if (parent) parentAgentId = parent.id;
    }

    const payload = {
      profile_id: user.id,
      agent_category: category,
      business_name: businessName,
      location,
      phone,
      parent_agent_id: parentAgentId,
      max_float: info.maxFloat,
      daily_cash_in_limit: info.dailyCashIn,
      daily_cash_out_limit: info.dailyCashOut,
      commission_rate: info.commission,
      float_balance: category === 'super_agent' ? 500000 : category === 'agent' ? 200000 : 50000,
      status: 'active' as const,
      onboarded_at: new Date().toISOString(),
    };

    // Upsert on profile_id (UNIQUE constraint) — re-onboarding updates the existing agent record
    const { error } = await supabase
      .from('agents')
      .upsert(payload, { onConflict: 'profile_id' });

    if (!error) {
      setStep('success');
      toast.success('Agent onboarded successfully!');
    } else if (error.code === '23505') {
      toast.error('An agent record already exists for this account. Please contact admin to modify.');
    } else {
      toast.error(error.message || 'Onboarding failed');
    }
    setLoading(false);
  };

  const fmt = (n: number) => n.toLocaleString();

  return (
    <MobilePortalLayout portalName="Nisir Agent" portalColor="agency" navItems={navItems} showBack backPath="/agency">
      <div className="px-4 pt-4 pb-6">
        <AnimatePresence mode="wait">
          {step === 'category' && (
            <motion.div key="cat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-lg font-bold text-foreground mb-1">Agent Onboarding</h2>
              <p className="text-xs text-muted-foreground mb-4">Choose agent category</p>
              <div className="space-y-3">
                {(Object.entries(categoryInfo) as [keyof typeof categoryInfo, typeof categoryInfo[keyof typeof categoryInfo]][]).map(([key, val]) => {
                  const Icon = val.icon;
                  return (
                    <button key={key} onClick={() => { setCategory(key); }}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        category === key ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl bg-card border flex items-center justify-center`}>
                          <Icon className={`h-5 w-5 ${val.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm">{val.label}</p>
                          <p className="text-[11px] text-muted-foreground">{val.desc}</p>
                          <div className="flex gap-3 mt-1">
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">Float: {fmt(val.maxFloat)} ETB</span>
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">Commission: {val.commission}%</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <Button onClick={() => setStep('details')} className="w-full mt-4">Continue</Button>
            </motion.div>
          )}

          {step === 'details' && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-lg font-bold text-foreground mb-4">Business Details</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Business Name</label>
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Merkato Express" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Location</label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bole, Addis Ababa" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251..." />
                </div>
                {category !== 'super_agent' && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      {category === 'agent' ? 'Super Agent Code (optional)' : 'Agent Code (optional)'}
                    </label>
                    <Input value={parentCode} onChange={(e) => setParentCode(e.target.value)} placeholder="AGT-XXXXXXXX" />
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setStep('category')} className="flex-1">{t('common.back')}</Button>
                <Button onClick={() => { if (!businessName || !location) { toast.error('Fill required fields'); return; } setStep('review'); }} className="flex-1">Review</Button>
              </div>
            </motion.div>
          )}

          {step === 'review' && (
            <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-lg font-bold text-foreground mb-4">Review & Submit</h2>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Category</span><span className="font-bold capitalize">{info.label}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Business</span><span className="font-semibold">{businessName}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Location</span><span>{location}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Phone</span><span>{phone}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Max Float</span><span className="font-bold">{fmt(info.maxFloat)} ETB</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Commission Rate</span><span>{info.commission}%</span></div>
                </CardContent>
              </Card>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setStep('details')} className="flex-1">{t('common.back')}</Button>
                <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-success hover:bg-success/90">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="text-center py-8">
                <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-success" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-1">Onboarding Complete!</h2>
                <p className="text-sm text-muted-foreground">{businessName} is now registered as a {info.label}</p>
              </div>
              <Button onClick={() => navigate('/agency')} className="w-full">Go to Dashboard</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobilePortalLayout>
  );
};

export default AgencyOnboarding;
