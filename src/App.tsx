import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminKYC from "./pages/admin/AdminKYC";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminLayout from "./pages/admin/AdminLayout";
import WalletHome from "./pages/wallet/WalletHome";
import SendMoney from "./pages/wallet/SendMoney";
import PayBills from "./pages/wallet/PayBills";
import SavingsGoals from "./pages/wallet/SavingsGoals";
import TransactionHistory from "./pages/wallet/TransactionHistory";
import UserProfile from "./pages/wallet/UserProfile";
import WalletLayout from "./pages/wallet/WalletLayout";
import Onboarding from "./pages/Onboarding";
import LoginPage from "./pages/LoginPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Wallet App Routes */}
          <Route path="/wallet" element={<WalletLayout />}>
            <Route index element={<WalletHome />} />
            <Route path="send" element={<SendMoney />} />
            <Route path="pay" element={<PayBills />} />
            <Route path="savings" element={<SavingsGoals />} />
            <Route path="history" element={<TransactionHistory />} />
            <Route path="profile" element={<UserProfile />} />
          </Route>

          {/* Admin Console Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="kyc" element={<AdminKYC />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
