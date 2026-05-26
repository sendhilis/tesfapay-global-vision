import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useCorporateRole } from '@/hooks/useCorporateRole';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import TechurateABXFooter from '@/components/TechurateABXFooter';
import {
  LayoutDashboard, ArrowLeftRight, Receipt, Users, FileText,
  Upload, Settings, LogOut, ChevronLeft, ChevronRight, Bell,
  Building2, Menu, X, CreditCard, Calendar, Shield, Store,
  PiggyBank, BarChart3, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const IBLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { role, companyName, isCorporateUser } = useCorporateRole();
  const { t } = useLanguage();

  const navItems = [
    { path: '/ib', icon: LayoutDashboard, label: t('ib.dashboard'), exact: true },
    { path: '/ib/accounts', icon: Building2, label: t('ib.accounts') },
    { path: '/ib/transfers', icon: ArrowLeftRight, label: t('ib.fundTransfers') },
    { path: '/ib/beneficiaries', icon: Users, label: t('ib.beneficiaries') },
    { path: '/ib/vendors', icon: Store, label: t('ib.vendorPayments') },
    { path: '/ib/bills', icon: Receipt, label: t('ib.billPayments') },
    { path: '/ib/salary', icon: Upload, label: t('ib.salaryUpload') },
    { path: '/ib/loans', icon: CreditCard, label: t('ib.loanRepayments') },
    { path: '/ib/savings', icon: PiggyBank, label: t('ib.savingsFd') },
    { path: '/ib/scheduled', icon: Calendar, label: t('ib.scheduledPayments') },
    { path: '/ib/approvals', icon: Shield, label: t('ib.approvals') },
    { path: '/ib/reports', icon: BarChart3, label: t('ib.reports') },
    { path: '/ib/statements', icon: FileText, label: t('ib.statements') },
    { path: '/ib/messages', icon: MessageSquare, label: t('ib.messages') },
    { path: '/ib/settings', icon: Settings, label: t('ib.settings') },
  ];

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const initials = profile ? `${(profile.first_name || '')[0] || ''}${(profile.father_name || '')[0] || ''}`.toUpperCase() : 'IB';
  const currentPage = navItems.find(item => isActive(item.path, item.exact)) || navItems[0];

  return (
    <div className="flex h-screen bg-muted/30">
      <aside className={cn(
        "hidden md:flex flex-col bg-background border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}>
        <div className="flex items-center gap-3 p-4 border-b border-border h-16">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-sm text-foreground">Nisir IB</h1>
              <p className="text-[10px] text-muted-foreground">{t('ib.internetBanking')}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                isActive(item.path, item.exact)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span>{t('common.collapse')}</span>}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full bg-background border-r border-border flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-bold text-foreground">Nisir IB</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="flex-1 p-2 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors",
                    isActive(item.path, item.exact)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  {t('ib.welcomeUser')}, {profile?.first_name || 'User'}
                </h2>
                <span className="text-xs text-muted-foreground hidden sm:inline">›</span>
                <span className="text-xs text-muted-foreground hidden sm:inline">{currentPage.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('common.lastLogin')}: {new Date().toLocaleDateString('en-ET', { dateStyle: 'medium' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button variant="ghost" size="icon" onClick={() => navigate('/ib/messages')} title={t('common.messages')}>
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/ib/settings')} title={t('common.settings')}>
              <Bell className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="hidden sm:block">
                  <p className="text-xs font-medium text-foreground">{profile?.first_name} {profile?.father_name}</p>
                  <Badge variant="outline" className="text-[10px] h-4">
                    {isCorporateUser ? (role || 'user').replace('_', ' ').toUpperCase() : (profile?.business_type ? t('common.corporate') : t('common.individual'))}
                  </Badge>
                  {companyName && <p className="text-[10px] text-muted-foreground">{companyName}</p>}
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} title={t('common.signOut')}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
          <TechurateABXFooter />
        </main>
      </div>
    </div>
  );
};

export default IBLayout;
