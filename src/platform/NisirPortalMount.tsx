/**
 * NisirPortalMount
 * ─────────────────────────────────────────────────────────────
 * Mounts a Nisir Digital portal (Retail / IB / Agency / Merchant)
 * inside ABX via a nested MemoryRouter, preserving the exact
 * look-and-feel of the original Nisir Lovable app.
 *
 * Auto-signs in a demo user that matches the portal so the
 * existing Nisir hooks (useAuth, useAccounts, …) work verbatim
 * against the ported backend.
 */
import { useEffect, useState } from "react";
import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LanguageProvider } from "@nisir/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@nisir/hooks/useAuth";
import { useTransactionToasts } from "@nisir/hooks/useTransactionToasts";
import { MerchantWalletProvider } from "@nisir/contexts/MerchantWalletContext";

// Retail
import RetailHome from "@nisir/pages/retail/RetailHome";
import RetailAccounts from "@nisir/pages/retail/RetailAccounts";
import RetailAccountDetail from "@nisir/pages/retail/RetailAccountDetail";
import RetailOpenAccount from "@nisir/pages/retail/RetailOpenAccount";
import RetailOwnTransfer from "@nisir/pages/retail/RetailOwnTransfer";
import RetailAccountSettings from "@nisir/pages/retail/RetailAccountSettings";
import RetailPayments from "@nisir/pages/retail/RetailPayments";
import RetailLoans from "@nisir/pages/retail/RetailLoans";
import RetailSupport from "@nisir/pages/retail/RetailSupport";
import RetailTransactions from "@nisir/pages/retail/RetailTransactions";
import KycWizard from "@nisir/pages/retail/KycWizard";
import RetailNotifications from "@nisir/pages/retail/RetailNotifications";
import AgentCashInRetail from "@nisir/pages/retail/AgentCashIn";
import AgentCashOutRetail from "@nisir/pages/retail/AgentCashOut";

// Agency
import AgencyLayout from "@nisir/pages/agency/AgencyLayout";
import AgencyHome from "@nisir/pages/agency/AgencyHome";
import AgencyCashIn from "@nisir/pages/agency/AgencyCashIn";
import AgencyCashOut from "@nisir/pages/agency/AgencyCashOut";
import AgencyFloatRequest from "@nisir/pages/agency/AgencyFloatRequest";
import AgencyOnboarding from "@nisir/pages/agency/AgencyOnboarding";
import AgencyPayments from "@nisir/pages/agency/AgencyPayments";
import AgencyCustomers from "@nisir/pages/agency/AgencyCustomers";
import AgencyReports from "@nisir/pages/agency/AgencyReports";
import AgencyProfile from "@nisir/pages/agency/AgencyProfile";
import AgencyBillPay from "@nisir/pages/agency/AgencyBillPay";
import AgencyLoanRepay from "@nisir/pages/agency/AgencyLoanRepay";
import AgencyAirtime from "@nisir/pages/agency/AgencyAirtime";
import AgencyBalanceInquiry from "@nisir/pages/agency/AgencyBalanceInquiry";
import AgencyTransfer from "@nisir/pages/agency/AgencyTransfer";
import AgencySavingsCollection from "@nisir/pages/agency/AgencySavingsCollection";
import AgencyComplaints from "@nisir/pages/agency/AgencyComplaints";
import AgencyEODReconciliation from "@nisir/pages/agency/AgencyEODReconciliation";
import AgencyCommissions from "@nisir/pages/agency/AgencyCommissions";
import AgencyPerformance from "@nisir/pages/agency/AgencyPerformance";
import AgencySubAgents from "@nisir/pages/agency/AgencySubAgents";
import AgencyReversal from "@nisir/pages/agency/AgencyReversal";

// Merchant
import MerchantLayout from "@nisir/pages/merchant/MerchantLayout";
import MerchantHome from "@nisir/pages/merchant/MerchantHome";
import MerchantQR from "@nisir/pages/merchant/MerchantQR";
import MerchantSales from "@nisir/pages/merchant/MerchantSales";
import MerchantSettlements from "@nisir/pages/merchant/MerchantSettlements";
import MerchantDisputes from "@nisir/pages/merchant/MerchantDisputes";
import MerchantWallet from "@nisir/pages/merchant/MerchantWallet";
import MerchantVendors from "@nisir/pages/merchant/MerchantVendors";
import MerchantTransactions from "@nisir/pages/merchant/MerchantTransactions";

// IB
import IBLayout from "@nisir/pages/ib/IBLayout";
import IBDashboard from "@nisir/pages/ib/IBDashboard";
import IBAccounts from "@nisir/pages/ib/IBAccounts";
import IBTransfers from "@nisir/pages/ib/IBTransfers";
import IBBeneficiaries from "@nisir/pages/ib/IBBeneficiaries";
import IBBills from "@nisir/pages/ib/IBBills";
import IBSalaryUpload from "@nisir/pages/ib/IBSalaryUpload";
import IBStatements from "@nisir/pages/ib/IBStatements";
import IBSettings from "@nisir/pages/ib/IBSettings";
import IBVendorPayments from "@nisir/pages/ib/IBVendorPayments";
import IBLoanRepayments from "@nisir/pages/ib/IBLoanRepayments";
import IBScheduledPayments from "@nisir/pages/ib/IBScheduledPayments";
import IBApprovals from "@nisir/pages/ib/IBApprovals";
import IBSavingsDeposits from "@nisir/pages/ib/IBSavingsDeposits";
import IBCashManagement from "@nisir/pages/ib/IBCashManagement";
import IBMessages from "@nisir/pages/ib/IBMessages";

export type NisirPortal = "retail" | "ib" | "agency" | "merchant";

const DEMO: Record<NisirPortal, { email: string; password: string; initialPath: string }> = {
  retail:   { email: "abebe.kebede@test.com",   password: "Test@12345", initialPath: "/retail" },
  ib:       { email: "tigist.haile@test.com",   password: "Test@12345", initialPath: "/ib" },
  agency:   { email: "agent.desta@test.com",    password: "Test@12345", initialPath: "/agency" },
  merchant: { email: "merchant.abiy@test.com",  password: "Test@12345", initialPath: "/merchant" },
};

function TransactionToastBridge() {
  useTransactionToasts();
  return null;
}

function AutoLogin({ portal, children }: { portal: NisirPortal; children: React.ReactNode }) {
  const { user, loading, signIn } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const cfg = DEMO[portal];

  useEffect(() => {
    if (loading || user || seeding) return;
    (async () => {
      setSeeding(true);
      let res = await signIn(cfg.email, cfg.password);
      if (res.error) {
        // Demo accounts not present yet — seed them then retry.
        try {
          await supabase.functions.invoke("create-test-users", { body: { action: "users" } });
        } catch {/* ignore */}
        res = await signIn(cfg.email, cfg.password);
      }
      setSeeding(false);
    })();
  }, [loading, user, seeding, cfg.email, cfg.password, signIn]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-xs text-muted-foreground">Signing in demo user…</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function RetailRoutes() {
  return (
    <Routes>
      <Route path="/retail" element={<RetailHome />} />
      <Route path="/retail/accounts" element={<RetailAccounts />} />
      <Route path="/retail/accounts/open" element={<RetailOpenAccount />} />
      <Route path="/retail/accounts/transfer" element={<RetailOwnTransfer />} />
      <Route path="/retail/accounts/:accountId" element={<RetailAccountDetail />} />
      <Route path="/retail/accounts/:accountId/settings" element={<RetailAccountSettings />} />
      <Route path="/retail/payments" element={<RetailPayments />} />
      <Route path="/retail/payments/*" element={<RetailPayments />} />
      <Route path="/retail/loans" element={<RetailLoans />} />
      <Route path="/retail/support" element={<RetailSupport />} />
      <Route path="/retail/transactions" element={<RetailTransactions />} />
      <Route path="/retail/kyc" element={<KycWizard />} />
      <Route path="/retail/notifications" element={<RetailNotifications />} />
      <Route path="/retail/agent/cash-in" element={<AgentCashInRetail />} />
      <Route path="/retail/agent/cash-out" element={<AgentCashOutRetail />} />
      <Route path="/retail/*" element={<RetailHome />} />
      <Route path="*" element={<Navigate to="/retail" replace />} />
    </Routes>
  );
}

function AgencyRoutes() {
  return (
    <Routes>
      <Route element={<AgencyLayout />}>
        <Route path="/agency" element={<AgencyHome />} />
        <Route path="/agency/cash-in" element={<AgencyCashIn />} />
        <Route path="/agency/cash-out" element={<AgencyCashOut />} />
        <Route path="/agency/float" element={<AgencyFloatRequest />} />
        <Route path="/agency/onboarding" element={<AgencyOnboarding />} />
        <Route path="/agency/payments" element={<AgencyPayments />} />
        <Route path="/agency/customers" element={<AgencyCustomers />} />
        <Route path="/agency/reports" element={<AgencyReports />} />
        <Route path="/agency/profile" element={<AgencyProfile />} />
        <Route path="/agency/bill-pay" element={<AgencyBillPay />} />
        <Route path="/agency/loan-repay" element={<AgencyLoanRepay />} />
        <Route path="/agency/airtime" element={<AgencyAirtime />} />
        <Route path="/agency/balance-inquiry" element={<AgencyBalanceInquiry />} />
        <Route path="/agency/transfer" element={<AgencyTransfer />} />
        <Route path="/agency/savings-collection" element={<AgencySavingsCollection />} />
        <Route path="/agency/complaints" element={<AgencyComplaints />} />
        <Route path="/agency/eod" element={<AgencyEODReconciliation />} />
        <Route path="/agency/commissions" element={<AgencyCommissions />} />
        <Route path="/agency/performance" element={<AgencyPerformance />} />
        <Route path="/agency/sub-agents" element={<AgencySubAgents />} />
        <Route path="/agency/reversal" element={<AgencyReversal />} />
        <Route path="/agency/*" element={<AgencyHome />} />
      </Route>
      <Route path="*" element={<Navigate to="/agency" replace />} />
    </Routes>
  );
}

function MerchantRoutes() {
  return (
    <MerchantWalletProvider>
      <Routes>
        <Route element={<MerchantLayout />}>
          <Route path="/merchant" element={<MerchantHome />} />
          <Route path="/merchant/qr" element={<MerchantQR />} />
          <Route path="/merchant/wallet" element={<MerchantWallet />} />
          <Route path="/merchant/vendors" element={<MerchantVendors />} />
          <Route path="/merchant/transactions" element={<MerchantTransactions />} />
          <Route path="/merchant/sales" element={<MerchantSales />} />
          <Route path="/merchant/settlements" element={<MerchantSettlements />} />
          <Route path="/merchant/disputes" element={<MerchantDisputes />} />
          <Route path="/merchant/*" element={<MerchantHome />} />
        </Route>
        <Route path="*" element={<Navigate to="/merchant" replace />} />
      </Routes>
    </MerchantWalletProvider>
  );
}

function IBRoutes() {
  return (
    <Routes>
      <Route element={<IBLayout />}>
        <Route path="/ib" element={<IBDashboard />} />
        <Route path="/ib/accounts" element={<IBAccounts />} />
        <Route path="/ib/transfers" element={<IBTransfers />} />
        <Route path="/ib/beneficiaries" element={<IBBeneficiaries />} />
        <Route path="/ib/bills" element={<IBBills />} />
        <Route path="/ib/salary" element={<IBSalaryUpload />} />
        <Route path="/ib/vendors" element={<IBVendorPayments />} />
        <Route path="/ib/loans" element={<IBLoanRepayments />} />
        <Route path="/ib/scheduled" element={<IBScheduledPayments />} />
        <Route path="/ib/approvals" element={<IBApprovals />} />
        <Route path="/ib/savings" element={<IBSavingsDeposits />} />
        <Route path="/ib/reports" element={<IBCashManagement />} />
        <Route path="/ib/messages" element={<IBMessages />} />
        <Route path="/ib/statements" element={<IBStatements />} />
        <Route path="/ib/settings" element={<IBSettings />} />
        <Route path="/ib/*" element={<IBDashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/ib" replace />} />
    </Routes>
  );
}

export function NisirPortalMount({ portal }: { portal: NisirPortal }) {
  const cfg = DEMO[portal];
  return (
    <div className="nisir-scope">
      <LanguageProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={[cfg.initialPath]}>
            <AutoLogin portal={portal}>
              <TransactionToastBridge />
              {portal === "retail"   && <RetailRoutes />}
              {portal === "ib"       && <IBRoutes />}
              {portal === "agency"   && <AgencyRoutes />}
              {portal === "merchant" && <MerchantRoutes />}
            </AutoLogin>
          </MemoryRouter>
        </AuthProvider>
      </LanguageProvider>
    </div>
  );
}
