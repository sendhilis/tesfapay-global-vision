import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import { useAuth } from '@nisir/hooks/useAuth';
import LanguageToggle from './LanguageToggle';
import TechurateABXFooter from './TechurateABXFooter';
import { ArrowLeft, Bell, LogOut } from 'lucide-react';

interface NavItem {
  icon: React.ReactNode;
  labelKey: string;
  path: string;
}

interface MobilePortalLayoutProps {
  children: React.ReactNode;
  portalName: string;
  portalColor: string;
  navItems: NavItem[];
  showBack?: boolean;
  backPath?: string;
}

const MobilePortalLayout: React.FC<MobilePortalLayoutProps> = ({
  children,
  portalName,
  portalColor,
  navItems,
  showBack = false,
  backPath = '/',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { signOut } = useAuth();

  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh] max-w-md mx-auto bg-background" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          {showBack && (
            <button onClick={() => navigate(backPath)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
          )}
          <h1 className="text-lg font-bold" style={{ color: `hsl(var(--portal-${portalColor}))` }}>
            {portalName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <button onClick={() => navigate('/retail/notifications')} className="p-2 rounded-lg hover:bg-muted relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
          </button>
          <button onClick={async () => { await signOut(); navigate('/auth'); }} className="p-2 rounded-lg hover:bg-muted" title={t('common.logout')}>
            <LogOut className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
        <TechurateABXFooter />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur-lg border-t border-border z-50">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl min-w-[60px] transition-all duration-300 ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span
                  className={`flex items-center justify-center h-8 w-8 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-primary/15 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)] scale-110'
                      : 'text-muted-foreground hover:bg-muted hover:shadow-[0_0_8px_hsl(var(--primary)/0.15)]'
                  }`}
                  style={{ WebkitFontSmoothing: 'antialiased' }}
                >
                  {item.icon}
                </span>
                <span className={`text-[10px] font-semibold leading-tight transition-colors duration-300 ${
                  isActive ? 'text-primary' : ''
                }`}>{t(item.labelKey)}</span>
                {isActive && (
                  <span className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.5)]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MobilePortalLayout;
