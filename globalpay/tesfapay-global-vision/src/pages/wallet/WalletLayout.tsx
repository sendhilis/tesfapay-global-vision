/**
 * WalletLayout — Mobile wallet app shell with bottom navigation.
 *
 * @route /wallet/* (parent layout)
 * @module Wallet
 *
 * @description Wraps all wallet child routes. Provides: top bar with logo + user name,
 * scrollable content area (<Outlet />), floating AI assistant (TesfaAI), and
 * bottom navigation bar (Home, Send, Pay, Savings, History, Profile).
 * Constrained to max-w-md for mobile-first design.
 *
 * @children WalletHome, SendMoney, PayBills, SavingsGoals, TransactionHistory,
 *           UserProfile, RequestMoney, AirtimeTopup, MerchantPay, MicroLoan,
 *           CashInOut, LoyaltyRewards, KYCUpgrade
 *
 * @api_endpoints
 * - GET /v1/users/me  → user name for top bar display
 */
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Home, Send, Receipt, PiggyBank, History, User } from "lucide-react";
import tesfaLogo from "@/assets/tesfa-logo.png";
import TesfaAI from "@/components/TesfaAI";

const navItems = [
  { to: "/wallet", icon: Home, label: "Home" },
  { to: "/wallet/send", icon: Send, label: "Send" },
  { to: "/wallet/pay", icon: Receipt, label: "Pay" },
  { to: "/wallet/savings", icon: PiggyBank, label: "Savings" },
  { to: "/wallet/history", icon: History, label: "History" },
  { to: "/wallet/profile", icon: User, label: "Profile" },
];

const WalletLayout = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen min-h-dvh bg-background flex flex-col max-w-md mx-auto relative overflow-x-hidden">
      {/* Top status bar */}
      <div className="flex items-center justify-between px-5 py-3 pt-safe glass border-b border-border">
        <div className="flex items-center gap-2" onClick={() => navigate("/")} role="button">
          <img src={tesfaLogo} alt="GlobalPay" className="w-7 h-7 rounded-lg" />
          <span className="font-display font-bold text-sm text-gold">GlobalPay</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-muted-foreground">Abebe G.</span>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto scrollbar-none pb-20">
        <Outlet />
      </div>

      {/* Global AI floating assistant */}
      <TesfaAI />

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md glass border-t border-border pb-safe z-50">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/wallet"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors ${
                  isActive
                    ? "text-gold"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-colors ${isActive ? "bg-tesfa-gold/15" : ""}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default WalletLayout;
