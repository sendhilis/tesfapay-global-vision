import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface MerchantTransaction {
  id: string;
  type: 'qr_received' | 'vendor_payment' | 'wallet_transfer' | 'settlement';
  description: string;
  amount: number;
  direction: 'in' | 'out';
  time: string;
  date: string;
  status: 'completed' | 'pending';
  reference: string;
}

interface Vendor {
  id: string;
  name: string;
  business: string;
  phone: string;
  accountNumber: string;
  bank: string;
  totalPaid: number;
}

export interface Settlement {
  id: string;
  date: string;
  grossAmount: number;
  transactionCount: number;
  feePercent: number;
  feeAmount: number;
  netAmount: number;
  status: 'pending' | 'processing' | 'settled' | 'failed';
  bankAccount: string;
  createdAt: number;
  txIds: string[];
}

interface BankConfig {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface MerchantWalletContextType {
  walletBalance: number;
  savingsBalance: number;
  transactions: MerchantTransaction[];
  vendors: Vendor[];
  settlements: Settlement[];
  bankConfig: BankConfig;
  loading: boolean;
  receivePayment: (amount: number, qrLabel: string, customerName: string) => void;
  payVendor: (vendorId: string, amount: number, fee: number, description: string) => void;
  transferToSavings: (amount: number) => boolean;
  transferToWallet: (amount: number) => boolean;
  addVendor: (vendor: Omit<Vendor, 'id' | 'totalPaid'>) => void;
  removeVendor: (id: string) => void;
  updateBankConfig: (config: BankConfig) => void;
  triggerSettlement: () => void;
  advanceSettlementStatus: (id: string) => void;
}

const MerchantWalletContext = createContext<MerchantWalletContextType | null>(null);

const PLATFORM_FEE = 0.015;

function formatTxTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch { return ''; }
}

function formatTxDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

function mapDbTx(row: any): MerchantTransaction {
  return {
    id: row.id,
    type: row.type,
    description: row.description,
    amount: Number(row.amount),
    direction: row.direction,
    time: formatTxTime(row.created_at),
    date: formatTxDate(row.created_at),
    status: row.status,
    reference: row.reference,
  };
}

function mapDbSettlement(row: any): Settlement {
  return {
    id: row.id,
    date: row.settlement_date,
    grossAmount: Number(row.gross_amount),
    transactionCount: Number(row.transaction_count),
    feePercent: Number(row.fee_percent),
    feeAmount: Number(row.fee_amount),
    netAmount: Number(row.net_amount),
    status: row.status,
    bankAccount: row.bank_account,
    createdAt: new Date(row.created_at).getTime(),
    txIds: row.tx_ids || [],
  };
}

function mapDbVendor(row: any): Vendor {
  return {
    id: row.id,
    name: row.name,
    business: row.business,
    phone: row.phone,
    accountNumber: row.account_number,
    bank: row.bank,
    totalPaid: Number(row.total_paid),
  };
}

export const MerchantWalletProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const profileId = user?.id;

  const [walletBalance, setWalletBalance] = useState(0);
  const [savingsBalance, setSavingsBalance] = useState(0);
  const [transactions, setTransactions] = useState<MerchantTransaction[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankConfig, setBankConfig] = useState<BankConfig>({
    bankName: 'Nisir Microfinance',
    accountNumber: '****4521',
    accountHolder: 'Nisir Merchant',
  });

  // Load all data on mount
  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      try {
        // Load wallet (upsert if not exists)
        let { data: wallet } = await supabase
          .from('merchant_wallets')
          .select('*')
          .eq('profile_id', profileId)
          .maybeSingle();

        if (!wallet) {
          const { data: newWallet } = await supabase
            .from('merchant_wallets')
            .insert({ profile_id: profileId, wallet_balance: 45200, savings_balance: 128500 })
            .select()
            .single();
          wallet = newWallet;
        }

        if (wallet && !cancelled) {
          setWalletBalance(Number(wallet.wallet_balance));
          setSavingsBalance(Number(wallet.savings_balance));
          setBankConfig({
            bankName: wallet.bank_name,
            accountNumber: wallet.bank_account_number,
            accountHolder: wallet.bank_account_holder,
          });
        }

        // Load transactions
        const { data: txData } = await supabase
          .from('merchant_transactions')
          .select('*')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false })
          .limit(200);

        if (txData && !cancelled) {
          setTransactions(txData.map(mapDbTx));
        }

        // Load vendors
        const { data: vendorData } = await supabase
          .from('merchant_vendors')
          .select('*')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false });

        if (vendorData && !cancelled) {
          setVendors(vendorData.map(mapDbVendor));
        }

        // Load settlements
        const { data: settlementData } = await supabase
          .from('merchant_settlements')
          .select('*')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false });

        if (settlementData && !cancelled) {
          setSettlements(settlementData.map(mapDbSettlement));
        }
      } catch (e) {
        console.error('Error loading merchant data:', e);
      }
      if (!cancelled) setLoading(false);
    };

    loadData();
    return () => { cancelled = true; };
  }, [profileId]);

  // Helper: update wallet balances in DB
  const syncWallet = useCallback(async (newWallet: number, newSavings: number) => {
    if (!profileId) return;
    await supabase
      .from('merchant_wallets')
      .update({ wallet_balance: newWallet, savings_balance: newSavings, updated_at: new Date().toISOString() })
      .eq('profile_id', profileId);
  }, [profileId]);

  // Helper: insert transaction to DB and local state
  const insertTx = useCallback(async (tx: Omit<MerchantTransaction, 'id' | 'time' | 'date'>): Promise<string> => {
    if (!profileId) return '';
    const { data } = await supabase
      .from('merchant_transactions')
      .insert({
        profile_id: profileId,
        type: tx.type,
        description: tx.description,
        amount: tx.amount,
        direction: tx.direction,
        status: tx.status,
        reference: tx.reference,
      })
      .select()
      .single();

    if (data) {
      setTransactions(prev => [mapDbTx(data), ...prev]);
      return data.id;
    }
    return '';
  }, [profileId]);

  const receivePayment = useCallback(async (amount: number, qrLabel: string, customerName: string) => {
    const newWallet = walletBalance + amount;
    setWalletBalance(newWallet);
    await syncWallet(newWallet, savingsBalance);
    await insertTx({
      type: 'qr_received',
      description: `QR Payment — ${qrLabel}`,
      amount,
      direction: 'in',
      status: 'completed',
      reference: `QR-${Date.now().toString().slice(-8)}`,
    });
  }, [walletBalance, savingsBalance, syncWallet, insertTx]);

  const payVendor = useCallback(async (vendorId: string, amount: number, fee: number, description: string) => {
    const total = amount + fee;
    const newWallet = walletBalance - total;
    setWalletBalance(newWallet);
    await syncWallet(newWallet, savingsBalance);

    // Update vendor total_paid
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      await supabase
        .from('merchant_vendors')
        .update({ total_paid: vendor.totalPaid + amount })
        .eq('id', vendorId);
      setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, totalPaid: v.totalPaid + amount } : v));
    }

    await insertTx({
      type: 'vendor_payment',
      description: vendor?.business || description,
      amount: total,
      direction: 'out',
      status: 'completed',
      reference: `VP-${Date.now().toString().slice(-8)}`,
    });
  }, [walletBalance, savingsBalance, vendors, syncWallet, insertTx]);

  const transferToSavings = useCallback((amount: number): boolean => {
    if (amount > walletBalance) return false;
    const newWallet = walletBalance - amount;
    const newSavings = savingsBalance + amount;
    setWalletBalance(newWallet);
    setSavingsBalance(newSavings);
    syncWallet(newWallet, newSavings);
    insertTx({ type: 'wallet_transfer', description: 'Transfer to Savings', amount, direction: 'out', status: 'completed', reference: `WT-${Date.now().toString().slice(-8)}` });
    return true;
  }, [walletBalance, savingsBalance, syncWallet, insertTx]);

  const transferToWallet = useCallback((amount: number): boolean => {
    if (amount > savingsBalance) return false;
    const newWallet = walletBalance + amount;
    const newSavings = savingsBalance - amount;
    setWalletBalance(newWallet);
    setSavingsBalance(newSavings);
    syncWallet(newWallet, newSavings);
    insertTx({ type: 'wallet_transfer', description: 'Transfer from Savings', amount, direction: 'in', status: 'completed', reference: `WT-${Date.now().toString().slice(-8)}` });
    return true;
  }, [walletBalance, savingsBalance, syncWallet, insertTx]);

  const addVendor = useCallback(async (v: Omit<Vendor, 'id' | 'totalPaid'>) => {
    if (!profileId) return;
    const { data } = await supabase
      .from('merchant_vendors')
      .insert({
        profile_id: profileId,
        name: v.name,
        business: v.business,
        phone: v.phone,
        account_number: v.accountNumber,
        bank: v.bank,
      })
      .select()
      .single();

    if (data) {
      setVendors(prev => [mapDbVendor(data), ...prev]);
    }
  }, [profileId]);

  const removeVendor = useCallback(async (id: string) => {
    await supabase.from('merchant_vendors').delete().eq('id', id);
    setVendors(prev => prev.filter(v => v.id !== id));
  }, []);

  const updateBankConfig = useCallback(async (config: BankConfig) => {
    if (!profileId) return;
    setBankConfig(config);
    await supabase
      .from('merchant_wallets')
      .update({
        bank_name: config.bankName,
        bank_account_number: config.accountNumber,
        bank_account_holder: config.accountHolder,
      })
      .eq('profile_id', profileId);
  }, [profileId]);

  const triggerSettlement = useCallback(async () => {
    if (!profileId) return;
    const settledTxIds = new Set(settlements.flatMap(s => s.txIds));
    const unsettledQR = transactions.filter(
      tx => tx.type === 'qr_received' && tx.status === 'completed' && !settledTxIds.has(tx.id)
    );
    if (unsettledQR.length === 0) return;

    const gross = unsettledQR.reduce((s, tx) => s + tx.amount, 0);
    const fee = Math.round(gross * PLATFORM_FEE * 100) / 100;
    const net = Math.round((gross - fee) * 100) / 100;
    const bankLabel = `${bankConfig.bankName.split(' ').map(w => w[0]).join('')} ${bankConfig.accountNumber}`;

    const { data: stlData } = await supabase
      .from('merchant_settlements')
      .insert({
        profile_id: profileId,
        gross_amount: gross,
        transaction_count: unsettledQR.length,
        fee_amount: fee,
        net_amount: net,
        bank_account: bankLabel,
        tx_ids: unsettledQR.map(tx => tx.id),
      })
      .select()
      .single();

    if (stlData) {
      setSettlements(prev => [mapDbSettlement(stlData), ...prev]);

      // Deduct fee from wallet
      const newWallet = walletBalance - fee;
      setWalletBalance(newWallet);
      await syncWallet(newWallet, savingsBalance);

      await insertTx({
        type: 'settlement',
        description: `Settlement Fee — ${stlData.id.slice(0, 12)}`,
        amount: fee,
        direction: 'out',
        status: 'completed',
        reference: stlData.id,
      });
    }
  }, [profileId, transactions, settlements, bankConfig, walletBalance, savingsBalance, syncWallet, insertTx]);

  const advanceSettlementStatus = useCallback(async (id: string) => {
    const settlement = settlements.find(s => s.id === id);
    if (!settlement) return;

    let newStatus: string | null = null;
    if (settlement.status === 'pending') newStatus = 'processing';
    else if (settlement.status === 'processing') newStatus = 'settled';
    if (!newStatus) return;

    await supabase
      .from('merchant_settlements')
      .update({ status: newStatus })
      .eq('id', id);

    setSettlements(prev => prev.map(s =>
      s.id === id ? { ...s, status: newStatus as Settlement['status'] } : s
    ));
  }, [settlements]);

  // Auto-advance processing settlements after 3 seconds
  useEffect(() => {
    const processing = settlements.filter(s => s.status === 'processing');
    if (processing.length === 0) return;
    const timer = setTimeout(async () => {
      for (const s of processing) {
        await supabase
          .from('merchant_settlements')
          .update({ status: 'settled' })
          .eq('id', s.id);
      }
      setSettlements(prev => prev.map(s =>
        s.status === 'processing' ? { ...s, status: 'settled' } : s
      ));
    }, 3000);
    return () => clearTimeout(timer);
  }, [settlements]);

  return (
    <MerchantWalletContext.Provider value={{
      walletBalance, savingsBalance, transactions, vendors, settlements, bankConfig, loading,
      receivePayment, payVendor, transferToSavings, transferToWallet,
      addVendor, removeVendor, updateBankConfig, triggerSettlement, advanceSettlementStatus,
    }}>
      {children}
    </MerchantWalletContext.Provider>
  );
};

export const useMerchantWallet = () => {
  const ctx = useContext(MerchantWalletContext);
  if (!ctx) throw new Error('useMerchantWallet must be used within MerchantWalletProvider');
  return ctx;
};
