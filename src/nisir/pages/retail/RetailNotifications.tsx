import { useLanguage } from '@nisir/contexts/LanguageContext';
import { useNotifications } from '@nisir/hooks/useNotifications';
import MobilePortalLayout from '@nisir/components/MobilePortalLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Wallet, CreditCard, HandCoins, HelpCircle,
  Bell, Send, Receipt, Smartphone, CircleDollarSign,
  ArrowUpRight, CheckCheck, Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/retail' },
  { icon: <Wallet className="h-5 w-5" />, labelKey: 'common.accounts', path: '/retail/accounts' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/retail/payments' },
  { icon: <HandCoins className="h-5 w-5" />, labelKey: 'common.loans', path: '/retail/loans' },
  { icon: <HelpCircle className="h-5 w-5" />, labelKey: 'common.support', path: '/retail/support' },
];

const typeIcons: Record<string, any> = {
  'Transfer Sent': Send,
  'Money Received': CircleDollarSign,
  'Bill Payment': Receipt,
  'Airtime Purchase': Smartphone,
  'Deposit Received': CircleDollarSign,
  'Withdrawal': ArrowUpRight,
};

const RetailNotifications = () => {
  const { t } = useLanguage();
  const { notifications, loading, unreadCount, markAsRead, markAllRead } = useNotifications();

  return (
    <MobilePortalLayout
      portalName="Nisir"
      portalColor="retail"
      navItems={navItems}
      showBack
      backPath="/retail"
    >
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">{t('common.notifications')}</h2>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {unreadCount} {t('notifications.unread')}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-xs font-medium text-primary"
          >
            <CheckCheck className="h-4 w-4" />
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      <div className="px-4 pb-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">{t('notifications.empty')}</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-2">
              {notifications.map((n, i) => {
                const Icon = typeIcons[n.title] || Bell;
                const timeAgo = n.created_at
                  ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true })
                  : '';
                const meta = n.metadata as Record<string, any> | null;
                const isCredit = meta?.direction === 'credit';

                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      n.is_read
                        ? 'bg-card border-border'
                        : 'bg-primary/5 border-primary/20'
                    }`}
                  >
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isCredit ? 'bg-success/10' : 'bg-muted'
                    }`}>
                      <Icon className={`h-4 w-4 ${isCredit ? 'text-success' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                        {!n.is_read && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </MobilePortalLayout>
  );
};

export default RetailNotifications;
