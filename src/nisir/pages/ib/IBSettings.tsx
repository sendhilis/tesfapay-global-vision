import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { User, Lock, Bell, Shield, LogOut } from 'lucide-react';

const IBSettings = () => {
  const { profile, updateProfile } = useProfile();
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [profileForm, setProfileForm] = useState({ first_name: profile?.first_name || '', father_name: profile?.father_name || '', email: profile?.email || '', msisdn: profile?.msisdn || '', alternate_phone: profile?.alternate_phone || '' });

  const handleProfileUpdate = async () => { setSaving(true); const { error } = await updateProfile(profileForm); if (error) toast.error(t('common.failed')); else toast.success(t('common.completed')); setSaving(false); };
  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) { toast.error(t('common.failed')); return; }
    if (passwords.new.length < 6) { toast.error(t('common.failed')); return; }
    const { error } = await supabase.auth.updateUser({ password: passwords.new });
    if (error) toast.error(error.message); else { toast.success(t('common.completed')); setPasswords({ current: '', new: '', confirm: '' }); }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div><h1 className="text-xl font-bold text-foreground">{t('ib.settings.title')}</h1><p className="text-sm text-muted-foreground">{t('ib.settings.subtitle')}</p></div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile"><User className="h-3 w-3 mr-1" /> {t('common.profile')}</TabsTrigger>
          <TabsTrigger value="security"><Lock className="h-3 w-3 mr-1" /> {t('admin.security')}</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-3 w-3 mr-1" /> {t('common.notifications')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle className="text-sm">{t('ib.settings.personalInfo')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">{t('auth.firstName')}</Label><Input value={profileForm.first_name} onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })} /></div>
                <div><Label className="text-xs">{t('auth.fatherName')}</Label><Input value={profileForm.father_name} onChange={(e) => setProfileForm({ ...profileForm, father_name: e.target.value })} /></div>
              </div>
              <div><Label className="text-xs">{t('common.email')}</Label><Input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">{t('common.phone')}</Label><Input value={profileForm.msisdn || ''} onChange={(e) => setProfileForm({ ...profileForm, msisdn: e.target.value })} /></div>
                <div><Label className="text-xs">{t('ib.settings.alternatePhone')}</Label><Input value={profileForm.alternate_phone || ''} onChange={(e) => setProfileForm({ ...profileForm, alternate_phone: e.target.value })} /></div>
              </div>
              <Button onClick={handleProfileUpdate} disabled={saving}>{saving ? t('common.processing') : t('ib.settings.updateProfile')}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader><CardTitle className="text-sm">{t('ib.settings.changePassword')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label className="text-xs">{t('ib.settings.currentPassword')}</Label><Input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} /></div>
              <div><Label className="text-xs">{t('ib.settings.newPassword')}</Label><Input type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} /></div>
              <div><Label className="text-xs">{t('ib.settings.confirmPassword')}</Label><Input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} /></div>
              <Button onClick={handlePasswordChange}>{t('ib.settings.changePassword')}</Button>
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> {t('ib.settings.sessionSecurity')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">{t('ib.settings.sessionStarted')}: {new Date().toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{t('ib.settings.autoLogout')}</p>
              <Button variant="destructive" size="sm" onClick={signOut}><LogOut className="h-4 w-4 mr-1" /> {t('ib.settings.signOutAll')}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader><CardTitle className="text-sm">{t('ib.settings.notifPrefs')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: t('ib.settings.txAlerts'), desc: t('ib.settings.txAlertsDesc') },
                { label: t('ib.settings.loginAlerts'), desc: t('ib.settings.loginAlertsDesc') },
                { label: t('ib.settings.billReminders'), desc: t('ib.settings.billRemindersDesc') },
                { label: t('ib.settings.salaryStatus'), desc: t('ib.settings.salaryStatusDesc') },
                { label: t('ib.settings.promos'), desc: t('ib.settings.promosDesc') },
              ].map((pref) => (
                <div key={pref.label} className="flex items-center justify-between">
                  <div><p className="text-sm font-medium text-foreground">{pref.label}</p><p className="text-xs text-muted-foreground">{pref.desc}</p></div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IBSettings;
