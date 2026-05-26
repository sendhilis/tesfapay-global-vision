import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KycApplicationProvider } from "@/contexts/KycApplicationContext";
import { WizardProvider } from "@/contexts/BankConfigContext";
import Setup from "./pages/Setup";
import RootGate from "./components/RootGate";
import PlatformModule from "./pages/PlatformModule";
import Launchpad from "./pages/Launchpad";

const LaunchpadRoute = () => <Launchpad skipAutoRedirect />;
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminKYC from "./pages/admin/AdminKYC";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminBankGPTAnalytics from "./pages/admin/AdminBankGPTAnalytics";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminEMoney from "./pages/admin/AdminEMoney";
import AdminReports from "./pages/admin/AdminReports";
import AdminAgents from "./pages/admin/AdminAgents";
import WalletHome from "./pages/wallet/WalletHome";
import SendMoney from "./pages/wallet/SendMoney";
import PayBills from "./pages/wallet/PayBills";
import SavingsGoals from "./pages/wallet/SavingsGoals";
import TransactionHistory from "./pages/wallet/TransactionHistory";
import UserProfile from "./pages/wallet/UserProfile";
import WalletLayout from "./pages/wallet/WalletLayout";
import RequestMoney from "./pages/wallet/RequestMoney";
import AirtimeTopup from "./pages/wallet/AirtimeTopup";
import MerchantPay from "./pages/wallet/MerchantPay";
import MicroLoan from "./pages/wallet/MicroLoan";
import CashInOut from "./pages/wallet/CashInOut";
import LoyaltyRewards from "./pages/wallet/LoyaltyRewards";
import KYCUpgrade from "./pages/wallet/KYCUpgrade";
import Onboarding from "./pages/Onboarding";
import LoginPage from "./pages/LoginPage";
import AgentOnboarding from "./pages/agent/AgentOnboarding";
import AgentLayout from "./pages/agent/AgentLayout";
import AgentHome from "./pages/agent/AgentHome";
import AgentCashIn from "./pages/agent/AgentCashIn";
import AgentCashOut from "./pages/agent/AgentCashOut";
import AgentCustomers from "./pages/agent/AgentCustomers";
import AgentCommission from "./pages/agent/AgentCommission";
import AgentFloat from "./pages/agent/AgentFloat";
import AgentProfile from "./pages/agent/AgentProfile";
import InstallPage from "./pages/InstallPage";
import ProposalDocument from "./pages/ProposalDocument";
import ProductShowcase from "./pages/ProductShowcase";

import { NisirPortalMount, type NisirPortal } from "@/platform/NisirPortalMount";
import ABXPreloader from "@/components/ABXPreloader";

const queryClient = new QueryClient();

/**
 * If the page is loaded inside the Nisir portal iframe (path
 * `/_nisir/<portal>`), render ONLY the Nisir portal tree. This
 * keeps the portal's MemoryRouter from nesting inside the ABX
 * BrowserRouter (which React Router v6 forbids).
 */
const nisirPortalMatch = (() => {
  if (typeof window === "undefined") return null;
  const m = window.location.pathname.match(/^\/_nisir\/(retail|ib|agency|merchant)\/?$/);
  return m ? (m[1] as NisirPortal) : null;
})();

const App = () => {
  if (nisirPortalMatch) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <NisirPortalMount portal={nisirPortalMatch} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }
  return (
  <QueryClientProvider client={queryClient}>
    <KycApplicationProvider>
    <WizardProvider>
    <TooltipProvider>
      <ABXPreloader />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootGate />} />
          <Route path="/launchpad" element={<LaunchpadRoute />} />
          <Route path="/home" element={<Index />} />
          <Route path="/platform/:moduleId" element={<PlatformModule />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/install" element={<InstallPage />} />
          <Route path="/proposal" element={<ProposalDocument />} />
          <Route path="/showcase" element={<ProductShowcase />} />

          {/* Wallet App Routes */}
          <Route path="/wallet" element={<WalletLayout />}>
            <Route index element={<WalletHome />} />
            <Route path="send" element={<SendMoney />} />
            <Route path="request" element={<RequestMoney />} />
            <Route path="pay" element={<PayBills />} />
            <Route path="airtime" element={<AirtimeTopup />} />
            <Route path="merchant" element={<MerchantPay />} />
            <Route path="savings" element={<SavingsGoals />} />
            <Route path="history" element={<TransactionHistory />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="loan" element={<MicroLoan />} />
            <Route path="cashinout" element={<CashInOut />} />
            <Route path="loyalty" element={<LoyaltyRewards />} />
            <Route path="kyc-upgrade" element={<KYCUpgrade />} />
          </Route>

          {/* Admin Console Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="kyc" element={<AdminKYC />} />
            <Route path="agents" element={<AdminAgents />} />
            <Route path="emoney" element={<AdminEMoney />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="bankgpt-analytics" element={<AdminBankGPTAnalytics />} />
          </Route>

          {/* Agent Portal Routes */}
          <Route path="/agent/onboarding" element={<AgentOnboarding />} />
          <Route path="/agent" element={<AgentLayout />}>
            <Route index element={<AgentHome />} />
            <Route path="cashin" element={<AgentCashIn />} />
            <Route path="cashout" element={<AgentCashOut />} />
            <Route path="customers" element={<AgentCustomers />} />
            <Route path="commission" element={<AgentCommission />} />
            <Route path="float" element={<AgentFloat />} />
            <Route path="profile" element={<AgentProfile />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </WizardProvider>
    </KycApplicationProvider>
  </QueryClientProvider>
  );
};

export default App;
