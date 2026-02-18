import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Users, ArrowLeftRight, FileCheck, BarChart2,
  Bell, Settings, ChevronLeft, ChevronRight, Menu, X
} from "lucide-react";
import tesfaLogo from "@/assets/tesfa-logo.png";
import adminHeroBg from "@/assets/admin-hero-bg.jpg";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/users", icon: Users, label: "Users & KYC" },
  { to: "/admin/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { to: "/admin/kyc", icon: FileCheck, label: "KYC Review" },
  { to: "/admin/analytics", icon: BarChart2, label: "Analytics" },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-60" : "w-16"} flex-shrink-0 glass border-r border-border flex flex-col transition-all duration-300 z-40 relative`}>
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center gap-3 overflow-hidden">
          <img src={tesfaLogo} alt="TesfaPay" className="w-8 h-8 rounded-lg flex-shrink-0" />
          {sidebarOpen && (
            <div>
              <p className="font-display font-bold text-sm text-gold">TesfaPay</p>
              <p className="text-[10px] text-muted-foreground">Admin Console</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto p-1 rounded-lg hover:bg-muted text-muted-foreground"
          >
            {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-none">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors overflow-hidden ${
                  isActive
                    ? "bg-gradient-gold text-tesfa-dark font-bold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm whitespace-nowrap">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-border space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Settings className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Settings</span>}
          </button>
          <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Back to App</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 glass border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-bold text-foreground">Global Bank Ethiopia — TesfaPay Admin</p>
              <p className="text-xs text-muted-foreground">Operations Dashboard · {new Date().toLocaleDateString("en-ET", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-semibold">System Live</span>
            </div>
            <button className="relative p-2 glass rounded-xl hover:bg-muted">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-tesfa-gold" />
            </button>
            <div className="w-8 h-8 rounded-xl gradient-green flex items-center justify-center text-xs font-bold">SA</div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
