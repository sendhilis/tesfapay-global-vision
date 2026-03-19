/**
 * AgentProfile — Agent account profile and settings.
 *
 * @route /agent/profile
 * @module Agent Portal
 *
 * @description Shows agent name, code (AGT-001), type, KYC level, region/zone,
 * contact info, and settings menu (Security, Commission History, Float Mgmt, etc.).
 *
 * @api_endpoints
 * - GET /v1/users/me       → user profile
 * - GET /v1/agent/dashboard → agent-specific info (code, type, region)
 *
 * @tables users, agents, user_roles
 *
 * @mock_data Agent "Dawit Haile" profile hardcoded.
 */
import { useNavigate } from "react-router-dom";
import { LogOut, ChevronRight, Shield, Star, Building2, MapPin, Phone, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AgentProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const menuItems = [
    { icon: Shield, label: "Security & MPIN", sub: "Biometrics enabled", action: () => toast({ title: "Coming Soon" }) },
    { icon: Star, label: "My Wallet", sub: "Switch to personal wallet view", action: () => navigate("/wallet") },
    { icon: Building2, label: "Agent Agreement", sub: "View NBE-licensed agency terms", action: () => toast({ title: "Document available in next update" }) },
    { icon: MapPin, label: "Operating Zone", sub: "Addis Ababa – Bole · SA-001", action: () => toast({ title: "Zone change requires bank approval" }) },
  ];

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Agent Profile Card */}
      <div className="glass rounded-3xl p-5 text-center relative overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
        <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-secondary/30 flex items-center justify-center text-3xl font-bold text-foreground">DH</div>
        <h2 className="font-display font-bold text-xl text-foreground">Dawit Haile</h2>
        <p className="text-muted-foreground text-sm">+251 912 345 678</p>
        <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
          <span className="text-xs bg-primary/20 text-primary px-2.5 py-0.5 rounded-full font-bold">✅ Active Agent</span>
          <span className="text-xs glass px-2.5 py-0.5 rounded-full text-muted-foreground">Sub Agent</span>
          <span className="text-xs glass px-2.5 py-0.5 rounded-full text-muted-foreground">KYC L2</span>
        </div>
      </div>

      {/* Agent Details */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-primary uppercase tracking-wide">Agent Information</p>
        {[
          { icon: CreditCard, label: "Agent Code", value: "AGT-001" },
          { icon: Building2, label: "Business", value: "Dawit Haile General Store" },
          { icon: Phone, label: "Wallet ID", value: "TPY-2024-DAWIT002" },
          { icon: MapPin, label: "Zone", value: "Addis Ababa – Bole" },
          { icon: Shield, label: "Super Agent", value: "Bole Super Agent Hub (SA-001)" },
          { icon: Star, label: "Agent Since", value: "June 15, 2024" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className="text-xs font-semibold text-foreground truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "This Month", value: "ETB 6.2K", sub: "Commission" },
          { label: "Customers", value: "142", sub: "Registered" },
          { label: "Txn Volume", value: "ETB 1.8M", sub: "Lifetime" },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-3 text-center">
            <p className="text-sm font-bold text-primary">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            <p className="text-[9px] text-muted-foreground/60">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Menu Items */}
      <div className="space-y-2">
        {menuItems.map(({ icon: Icon, label, sub, action }) => (
          <button key={label} onClick={action} className="w-full glass rounded-2xl p-3.5 flex items-center gap-3 text-left hover:border-primary/20 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground truncate">{sub}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <button onClick={() => navigate("/")} className="w-full py-3.5 rounded-2xl glass border border-destructive/30 text-destructive flex items-center justify-center gap-2 text-sm font-semibold">
        <LogOut className="w-4 h-4" /> Sign Out
      </button>

      <p className="text-xs text-muted-foreground text-center pb-2">GlobalPay Agent v2.1.0 · Global Bank Ethiopia · NBE Licensed</p>
    </div>
  );
};

export default AgentProfile;
