// Maps AI-detected intents to portal routes
export interface IntentRoute {
  intent: string;
  route: string;
  portal: 'retail' | 'merchant' | 'agency';
  description: string;
}

export const INTENT_ROUTES: IntentRoute[] = [
  // Retail intents
  { intent: 'check_balance', route: '/retail/accounts', portal: 'retail', description: 'View account balances' },
  { intent: 'send_money', route: '/retail/payments', portal: 'retail', description: 'Send money to someone' },
  { intent: 'pay_bill', route: '/retail/payments', portal: 'retail', description: 'Pay a bill' },
  { intent: 'buy_airtime', route: '/retail/payments', portal: 'retail', description: 'Buy airtime' },
  { intent: 'apply_loan', route: '/retail/loans', portal: 'retail', description: 'Apply for a loan' },
  { intent: 'repay_loan', route: '/retail/loans', portal: 'retail', description: 'Repay a loan' },
  { intent: 'view_transactions', route: '/retail/transactions', portal: 'retail', description: 'View transaction history' },
  { intent: 'upgrade_kyc', route: '/retail/kyc', portal: 'retail', description: 'Upgrade KYC level' },
  { intent: 'open_account', route: '/retail/open-account', portal: 'retail', description: 'Open a new account' },
  { intent: 'transfer_own', route: '/retail/own-transfer', portal: 'retail', description: 'Transfer between own accounts' },
  { intent: 'cash_in', route: '/retail/agent/cash-in', portal: 'retail', description: 'Agent cash in' },
  { intent: 'cash_out', route: '/retail/agent/cash-out', portal: 'retail', description: 'Agent cash out' },
  { intent: 'view_notifications', route: '/retail/notifications', portal: 'retail', description: 'Check notifications' },
  { intent: 'account_settings', route: '/retail/settings', portal: 'retail', description: 'Account settings' },
  { intent: 'get_support', route: '/retail/support', portal: 'retail', description: 'Get help & support' },
  
  // Merchant intents
  { intent: 'view_sales', route: '/merchant/sales', portal: 'merchant', description: 'View sales data' },
  { intent: 'manage_qr', route: '/merchant/qr', portal: 'merchant', description: 'Manage QR code' },
  { intent: 'check_settlements', route: '/merchant/settlements', portal: 'merchant', description: 'View settlements' },
  { intent: 'manage_vendors', route: '/merchant/vendors', portal: 'merchant', description: 'Manage vendors' },
  { intent: 'view_disputes', route: '/merchant/disputes', portal: 'merchant', description: 'View disputes' },
  { intent: 'merchant_wallet', route: '/merchant/wallet', portal: 'merchant', description: 'Wallet operations' },
  { intent: 'merchant_transactions', route: '/merchant/transactions', portal: 'merchant', description: 'Transaction history' },
];

export const getRouteForIntent = (intent: string, portal: 'retail' | 'merchant' | 'agency'): IntentRoute | undefined => {
  return INTENT_ROUTES.find(r => r.intent === intent && (r.portal === portal || (portal === 'agency' && r.portal === 'retail')));
};

export const INTENT_LIST = INTENT_ROUTES.map(r => `${r.intent}: ${r.description}`).join('\n');
