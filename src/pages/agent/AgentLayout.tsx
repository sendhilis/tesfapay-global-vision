/**
 * AgentLayout — Mobile agent portal shell with bottom navigation.
 *
 * @route /agent/* (parent layout)
 * @module Agent Portal
 *
 * @description Wraps all agent child routes. Provides: top bar with logo +
 * agent name/code, scrollable content area (<Outlet />), and bottom navigation
 * (Dashboard, Cash In, Cash Out, Customers, Commission, Profile).
 * Constrained to max-w-md for mobile-first design.
 *
 * @children AgentHome, AgentCashIn, AgentCashOut, AgentCustomers,
 *           AgentCommission, AgentProfile
 *
 * @api_endpoints
 * - GET /v1/users/me          → agent name for top bar
 * - GET /v1/agent/dashboard   → agent code (AGT-XXX) for display
 */
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Home, ArrowDownLeft, ArrowUpRight, Users, BarChart3, User } from "lucide-react";
import tesfaLogo from "@/assets/tesfa-logo.png";

const navItems = [
  { to: "/agent", icon: Home, label: "Dashboard" },
  { to: "/agent/cashin", icon: ArrowDownLeft, label: "Cash In" },
  { to: "/agent/cashout", icon: ArrowUpRight, label: "Cash Out" },
  { to: "/agent/customers", icon: Users, label: "Customers" },
  { to: "/agent/commission", icon: BarChart3, label: "Commission" },
  { to: "/agent/profile", icon: User, label: "Profile" },
];

const AgentLayout = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen min-h-dvh bg-background flex flex-col max-w-md mx-auto relative overflow-x-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 pt-safe glass border-b border-border">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <img src={tesfaLogo} alt="GlobalPay" className="w-7 h-7 rounded-lg" />
          <div>
            <span className="font-display font-bold text-xs text-primary block leading-none">GlobalPay</span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Agent Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-muted-foreground">Dawit H. · AGT-001</span>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto scrollbar-none pb-20">
        <Outlet />
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md glass border-t border-border pb-safe z-50">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/agent"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-xl transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-colors ${isActive ? "bg-primary/15" : ""}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AgentLayout;
