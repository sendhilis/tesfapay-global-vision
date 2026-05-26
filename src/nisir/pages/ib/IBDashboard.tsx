import { useAccounts } from '@nisir/hooks/useAccounts';
import { useTransactions } from '@nisir/hooks/useTransactions';
import { useProfile } from '@nisir/hooks/useProfile';
import { useLoans } from '@nisir/hooks/useLoans';
import { useAuth } from '@nisir/hooks/useAuth';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeftRight, Receipt, Upload, Users, FileText,
  TrendingUp, TrendingDown, Wallet, Eye, EyeOff, Building2,
  CreditCard, Shield, PiggyBank, AlertTriangle, Calendar, BarChart3, MessageSquare
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const IBDashboard = () => {
  const { accounts, totalBalance, loading } = useAccounts();
  const { transactions } = useTransactions(10);
  const { profile } = useProfile();
  const { loans } = useLoans();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const quickActions = [
    { label: t('ib.fundTransfers'), icon: ArrowLeftRight, path: '/ib/transfers', color: 'bg-blue-500' },
    { label: t('ib.billPayments'), icon: Receipt, path: '/ib/bills', color: 'bg-green-500' },
    { label: t('ib.salaryUpload'), icon: Upload, path: '/ib/salary', color: 'bg-purple-500' },
    { label: t('ib.loanRepayments'), icon: CreditCard, path: '/ib/loans', color: 'bg-orange-500' },
    { label: t('ib.vendorPayments'), icon: Building2, path: '/ib/vendors', color: 'bg-teal-500' },
    { label: t('ib.beneficiaries'), icon: Users, path: '/ib/beneficiaries', color: 'bg-indigo-500' },
    { label: t('ib.statements'), icon: FileText, path: '/ib/statements', color: 'bg-slate-500' },
    { label: t('ib.reports'), icon: BarChart3, path: '/ib/reports', color: 'bg-amber-500' },
  ];

  useEffect(() => {
    if (!user) return;
    supabase.from('approval_requests').select('id').eq('profile_id', user.id).eq('status', 'pending')
      .then(({ data }) => { if (data) setPendingApprovals(data.length); });
    supabase.from('secure_messages').select('id').eq('profile_id', user.id).eq('is_read', false).eq('sender_type', 'rm')
      .then(({ data }) => { if (data) setUnreadMessages(data.length); });
  }, [user]);

  const activeLoans = loans.filter(l => ['disbursed', 'active'].includes(l.status || ''));
  const nextEMI = activeLoans.length > 0
    ? activeLoans.reduce((closest, l) => {
        if (!l.next_due_date) return closest;
        if (!closest || new Date(l.next_due_date) < new Date(closest.next_due_date!)) return l;
        return closest;
      }, null as any)
    : null;

  const totalOutstanding = activeLoans.reduce((s, l) => s + (l.outstanding_balance || 0), 0);

  const formatAmount = (amount: number) =>
    showBalance ? `${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${t('common.etb')}` : '••••••';

  const greeting = new Date().getHours() < 12 ? t('ib.goodMorning') : new Date().getHours() < 18 ? t('ib.goodAfternoon') : t('ib.goodEvening');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {profile?.first_name || 'User'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{t('ib.financialOverview')}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground md:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs opacity-90">{t('ib.totalBalance')}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground/80 hover:text-primary-foreground" onClick={() => setShowBalance(!showBalance)}>
                {showBalance ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
            </div>
            <p className="text-2xl font-bold">{formatAmount(totalBalance)}</p>
            <p className="text-[10px] opacity-70 mt-1">{accounts.length} {t('ib.activeAccounts')}</p>
          </CardContent>
        </Card>

        <Card className={nextEMI ? 'border-amber-200 bg-amber-50/30' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">{t('ib.nextEmiDue')}</span>
            </div>
            {nextEMI ? (
              <>
                <p className="text-lg font-bold text-foreground">{(nextEMI.monthly_installment || 0).toLocaleString()} {t('common.etb')}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(nextEMI.next_due_date).toLocaleDateString()} • {nextEMI.product_type}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t('ib.noActiveLoans')}</p>
            )}
          </CardContent>
        </Card>

        <Card className={pendingApprovals > 0 ? 'border-destructive/30 bg-destructive/5' : ''} onClick={() => navigate('/ib/approvals')} role="button">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">{t('ib.pendingApprovals')}</span>
            </div>
            <p className="text-lg font-bold text-foreground">{pendingApprovals}</p>
            {pendingApprovals > 0 && <p className="text-[10px] text-destructive">{t('ib.actionRequired')}</p>}
          </CardContent>
        </Card>

        <Card onClick={() => navigate('/ib/messages')} role="button">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">{t('common.messages')}</span>
            </div>
            <p className="text-lg font-bold text-foreground">{unreadMessages} {t('ib.unread')}</p>
            <p className="text-[10px] text-muted-foreground">{t('ib.rmMessaging')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-3">
          {accounts.slice(0, 3).map((acc) => (
            <Card key={acc.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/ib/accounts')}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {acc.account_type === 'savings' ? (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <PiggyBank className="h-5 w-5 text-primary" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-purple-600" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{acc.product_name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">••••{acc.account_number.slice(-4)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{formatAmount(acc.available_balance || 0)}</p>
                  <Badge variant="default" className="text-[10px]">{acc.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> {t('ib.exchangeRates')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { pair: 'USD/ETB', buy: '126.50', sell: '128.80' },
              { pair: 'EUR/ETB', buy: '141.20', sell: '143.50' },
              { pair: 'GBP/ETB', buy: '161.30', sell: '163.80' },
              { pair: 'SAR/ETB', buy: '33.70', sell: '34.30' },
              { pair: 'AED/ETB', buy: '34.45', sell: '35.00' },
            ].map((rate) => (
              <div key={rate.pair} className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{rate.pair}</span>
                <div className="flex gap-3 text-xs">
                  <span className="text-green-600">B: {rate.buy}</span>
                  <span className="text-red-500">S: {rate.sell}</span>
                </div>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground">NBE indicative rates • {new Date().toLocaleDateString()}</p>
          </CardContent>
        </Card>
      </div>

      {activeLoans.length > 0 && (
        <Card className="border-amber-200/50 bg-amber-50/20 cursor-pointer" onClick={() => navigate('/ib/loans')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-foreground">{t('ib.loanPortfolio')}</span>
              </div>
              <Badge variant="outline" className="text-[10px]">{activeLoans.length} active loan{activeLoans.length > 1 ? 's' : ''}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground">{t('ib.totalOutstanding')}</p>
                <p className="text-sm font-bold text-destructive">{totalOutstanding.toLocaleString()} {t('common.etb')}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">{t('ib.monthlyEmi')}</p>
                <p className="text-sm font-bold text-foreground">{activeLoans.reduce((s, l) => s + (l.monthly_installment || 0), 0).toLocaleString()} {t('common.etb')}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">{t('ib.nextDue')}</p>
                <p className="text-sm font-medium text-foreground">{nextEMI?.next_due_date ? new Date(nextEMI.next_due_date).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">{t('ib.quickActions')}</h3>
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {quickActions.map((action) => (
            <Card
              key={action.path}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(action.path)}
            >
              <CardContent className="p-3 flex flex-col items-center gap-1.5 text-center">
                <div className={`w-9 h-9 rounded-full ${action.color} flex items-center justify-center`}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-[10px] font-medium text-foreground leading-tight">{action.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm">{t('ib.recentTransactions')}</CardTitle>
          <Button variant="link" size="sm" onClick={() => navigate('/ib/statements')}>{t('common.viewAll')}</Button>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t('ib.noRecentTx')}</p>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 8).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.direction === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {tx.direction === 'credit' ? <TrendingDown className="h-4 w-4 text-green-600" /> : <TrendingUp className="h-4 w-4 text-red-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.description || tx.transaction_type}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_at!).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.direction === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.direction === 'credit' ? '+' : '-'}{tx.amount.toLocaleString()} {t('common.etb')}
                    </p>
                    <Badge variant="outline" className="text-[10px]">{tx.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Building2 className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">{t('ib.systemAnnouncement')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('ib.announcementText')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IBDashboard;
