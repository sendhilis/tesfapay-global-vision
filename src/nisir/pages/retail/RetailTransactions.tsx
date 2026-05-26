import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTransactions } from '@/hooks/useTransactions';
import MobilePortalLayout from '@/components/MobilePortalLayout';
import NisirAIWidget from '@/components/NisirAIWidget';
import {
  Home, Wallet, CreditCard, HandCoins, HelpCircle,
  Send, Receipt, Smartphone, FileText, CircleDollarSign,
  ArrowUpRight, Loader2, MessageCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/retail' },
  { icon: <Wallet className="h-5 w-5" />, labelKey: 'common.accounts', path: '/retail/accounts' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/retail/payments' },
  { icon: <HandCoins className="h-5 w-5" />, labelKey: 'common.loans', path: '/retail/loans' },
  { icon: <HelpCircle className="h-5 w-5" />, labelKey: 'common.support', path: '/retail/support' },
];

const iconMap: Record<string, any> = {
  transfer: Send,
  bill_payment: Receipt,
  airtime: Smartphone,
  loan_repayment: FileText,
  deposit: CircleDollarSign,
  withdrawal: ArrowUpRight,
};

const RetailTransactions = () => {
  const { t } = useLanguage();
  const { transactions, loading } = useTransactions(100);
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });
  const [txnContext, setTxnContext] = useState<any>(null);

  return (
    <MobilePortalLayout portalName="Nisir" portalColor="retail" navItems={navItems} showBack backPath="/retail">
      <div className="px-4 pt-4 pb-6">
        <h2 className="text-lg font-bold text-foreground mb-4">{t('retail.transactions')}</h2>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : transactions.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">{t('retail.noTransactions') || 'No transactions yet'}</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const Icon = iconMap[tx.transaction_type] || CircleDollarSign;
              const isCredit = tx.direction === 'credit';
              const timeAgo = tx.created_at
                ? formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })
                : '';
              return (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isCredit ? 'bg-success/10' : 'bg-muted'}`}>
                      <Icon className={`h-4 w-4 ${isCredit ? 'text-success' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{tx.description || tx.transaction_type}</p>
                      <p className="text-[11px] text-muted-foreground">{timeAgo} · {tx.reference}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTxnContext({
                        type: tx.transaction_type,
                        amount: tx.amount,
                        direction: tx.direction,
                        description: tx.description || tx.transaction_type,
                        reference: tx.reference || 'N/A',
                        date: tx.created_at || '',
                        fee: tx.fee,
                      })}
                      className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20"
                      title="Explain this transaction"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-primary" />
                    </button>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isCredit ? 'text-success' : 'text-foreground'}`}>
                        {isCredit ? '+' : '-'}{fmt(tx.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{t('common.etb')}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <NisirAIWidget
        portal="retail"
        transactionContext={txnContext}
        onClearTransactionContext={() => setTxnContext(null)}
      />
    </MobilePortalLayout>
  );
};

export default RetailTransactions;
