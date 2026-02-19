import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Star, ChevronRight, Bell, HelpCircle, LogOut, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const UserProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifs, setNotifs] = useState(true);
  const [kycLevel, setKycLevel] = useState(1);

  const menuItems = [
    { icon: Shield, label: "Security & MPIN", sub: "Biometrics enabled", action: () => toast({ title: "Coming Soon", description: "MPIN management will be available in next update." }) },
    { icon: Star, label: "Loyalty & Rewards", sub: "1,240 Tesfa Points", action: () => navigate("/wallet/loyalty") },
    { icon: Upload, label: "Upgrade KYC Level", sub: kycLevel === 1 ? "Currently Level 1 → Apply Level 2" : "✅ KYC Level 2 Active", action: () => kycLevel === 1 ? navigate("/wallet/kyc-upgrade") : undefined, badge: kycLevel === 1 ? "Upgrade" : undefined },
    { icon: Bell, label: "Notification Preferences", sub: "Manage alerts & nudge intensity", action: () => toast({ title: "Coming Soon", description: "Notification preferences will be available soon." }) },
    { icon: HelpCircle, label: "Help & Support", sub: "Chat with Tesfa AI or call 8711", action: () => toast({ title: "Help & Support", description: "Tesfa AI is available via the floating chat button." }) },
  ];

  return (
    <div className="px-4 py-4">
      {/* Profile Card */}
      <div className="glass-green rounded-3xl p-5 mb-5 text-center">
        <div className="w-20 h-20 mx-auto mb-3 rounded-2xl gradient-green flex items-center justify-center text-3xl font-bold text-foreground">AG</div>
        <h2 className="font-display font-bold text-xl text-foreground">Abebe Girma</h2>
        <p className="text-muted-foreground text-sm">+251 911 234 567</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-xs bg-gradient-gold text-tesfa-dark px-2.5 py-0.5 rounded-full font-bold">KYC Level 1</span>
          <span className="text-xs glass px-2.5 py-0.5 rounded-full text-muted-foreground">🌟 1,240 pts</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2 font-mono">Wallet ID: TPY-2024-ABEBE001</p>
      </div>

      {/* AI Assist */}
      <div className="glass rounded-2xl p-3 mb-5 flex gap-2 items-start">
        <span className="text-lg">🤖</span>
        <div>
          <p className="text-xs font-bold text-gold">Tesfa AI Advisor</p>
          <p className="text-xs text-muted-foreground">Upgrade to KYC Level 2 to unlock ETB 50,000/day limit and micro-loan eligibility. Takes 2 minutes with your Fayda ID.</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: "Transactions", value: "48" },
          { label: "This Month", value: "ETB 4.2K" },
          { label: "Loyalty Tier", value: "Silver" },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-3 text-center">
            <p className="text-sm font-bold text-gold">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="space-y-2 mb-5">
        {menuItems.map(({ icon: Icon, label, sub, action, badge }) => (
          <button key={label} onClick={action} className="w-full glass rounded-2xl p-3.5 flex items-center gap-3 text-left hover:border-tesfa-gold/20 transition-colors">
            <div className="w-9 h-9 rounded-xl glass-gold flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground truncate">{sub}</p>
            </div>
            {badge && <span className="text-[10px] bg-gradient-gold text-tesfa-dark px-2 py-0.5 rounded-full font-bold">{badge}</span>}
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}

        {/* Notifications Toggle */}
        <div className="glass rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl glass-gold flex items-center justify-center">
            <Bell className="w-4 h-4 text-gold" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Push Notifications</p>
            <p className="text-xs text-muted-foreground">Transaction alerts & AI insights</p>
          </div>
          <button onClick={() => setNotifs(!notifs)} className={`w-12 h-6 rounded-full transition-colors relative ${notifs ? "bg-gradient-gold" : "bg-muted"}`}>
            <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${notifs ? "right-0.5" : "left-0.5"}`} />
          </button>
        </div>
      </div>

      <button onClick={() => navigate("/")} className="w-full py-3.5 rounded-2xl glass border border-destructive/30 text-destructive flex items-center justify-center gap-2 text-sm font-semibold">
        <LogOut className="w-4 h-4" /> Sign Out
      </button>

      <p className="text-xs text-muted-foreground text-center mt-4">TesfaPay v2.1.0 · Global Bank Ethiopia · Licensed by NBE</p>
    </div>
  );
};

export default UserProfile;
