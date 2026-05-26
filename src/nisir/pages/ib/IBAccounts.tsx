import { useAccounts } from '@nisir/hooks/useAccounts';
import { useTransactions } from '@nisir/hooks/useTransactions';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

const IBAccounts = () => {
  const { accounts, totalBalance, loading } = useAccounts();
  const { transactions } = useTransactions(50);
  const { t } = useLanguage();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground">{t('ib.accounts.myAccounts')}</h1>
        <p className="text-sm text-muted-foreground">{t('ib.accounts.manageAccounts')}</p>
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">{t('ib.accounts.totalAvailable')}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {t('common.etb')}</p>
          <p className="text-xs text-muted-foreground mt-1">{accounts.length} {t('common.accounts').toLowerCase()}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((acc) => (
          <Card key={acc.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                {acc.account_type === 'savings' ? (
                  <Building2 className="h-5 w-5 text-primary" />
                ) : (
                  <Wallet className="h-5 w-5 text-purple-500" />
                )}
                <CardTitle className="text-sm">{acc.product_name}</CardTitle>
              </div>
              <Badge variant={acc.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                {acc.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">{t('accounts.accountNumber')}</p>
                <p className="text-sm font-mono text-foreground">{acc.account_number}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground">{t('retail.available')}</p>
                  <p className="text-sm font-semibold text-foreground">{(acc.available_balance || 0).toLocaleString()} {t('common.etb')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{t('accounts.ledgerBalance')}</p>
                  <p className="text-sm text-foreground">{(acc.balance || 0).toLocaleString()} {t('common.etb')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{t('accounts.blockedBalance')}</p>
                  <p className="text-sm text-foreground">{(acc.blocked_balance || 0).toLocaleString()} {t('common.etb')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>{t('ib.accounts.currency')}: {acc.currency}</span>
                <span>{t('ib.accounts.interest')}: {acc.interest_rate}%</span>
                <span>{t('accounts.dailyLimit')}: {(acc.daily_limit || 0).toLocaleString()}</span>
                <span>{t('accounts.monthlyLimit')}: {(acc.monthly_limit || 0).toLocaleString()}</span>
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-xs font-medium text-foreground mb-2">{t('accounts.miniStatementTitle')}</p>
                {transactions
                  .filter((tx) => tx.account_id === acc.id)
                  .slice(0, 5)
                  .map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        {tx.direction === 'credit' ? (
                          <TrendingDown className="h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingUp className="h-3 w-3 text-red-500" />
                        )}
                        <span className="text-xs text-foreground truncate max-w-[150px]">{tx.description || tx.transaction_type}</span>
                      </div>
                      <span className={`text-xs font-medium ${tx.direction === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                        {tx.direction === 'credit' ? '+' : '-'}{tx.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                {transactions.filter((tx) => tx.account_id === acc.id).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">{t('ib.accounts.noTransactions')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default IBAccounts;
