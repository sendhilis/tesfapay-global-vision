import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Shield, Zap, Globe, Star, Download, X } from "lucide-react";
import tesfaHeroBg from "@/assets/tesfa-hero-bg.jpg";
import tesfaLogo from "@/assets/tesfa-logo.png";

const Index = () => {
  const navigate = useNavigate();
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = sessionStorage.getItem("installBannerDismissed");
    if (!isStandalone && !dismissed) {
      setTimeout(() => setShowInstallBanner(true), 2000);
    }
  }, []);

  const dismissBanner = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem("installBannerDismissed", "1");
  };

  const features = [
    { icon: Zap, title: "Instant Transfers", desc: "Send money across Ethiopia in seconds" },
    { icon: Shield, title: "Bank-Grade Security", desc: "256-bit encryption & biometric auth" },
    { icon: Globe, title: "Multi-Channel", desc: "Mobile, USSD, agent & web access" },
    { icon: Star, title: "Loyalty Rewards", desc: "Earn Tesfa Points on every transaction" },
  ];

  return (
    <div className="min-h-dvh relative overflow-hidden">
      {/* Hero Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${tesfaHeroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(168_70%_10%/0.75)] via-[hsl(220_35%_8%/0.85)] to-[hsl(220_35%_8%)]" />

      {/* Ethiopian pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `repeating-linear-gradient(45deg, hsl(42 90% 52%) 0px, hsl(42 90% 52%) 1px, transparent 1px, transparent 20px),
          repeating-linear-gradient(-45deg, hsl(168 70% 32%) 0px, hsl(168 70% 32%) 1px, transparent 1px, transparent 20px)`,
      }} />

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 glass-gold border-b border-primary/20 px-4 py-3 flex items-center gap-3 animate-slide-up max-w-md mx-auto">
          <img src={tesfaLogo} alt="" className="w-8 h-8 rounded-lg flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gold leading-tight">Install TesfaPay</p>
            <p className="text-[10px] text-muted-foreground">Add to home screen for the best experience</p>
          </div>
          <button
            onClick={() => navigate("/install")}
            className="flex-shrink-0 bg-gradient-gold text-tesfa-dark text-xs font-bold px-3 py-1.5 rounded-xl min-h-[36px] flex items-center gap-1"
          >
            <Download className="w-3 h-3" /> Install
          </button>
          <button onClick={dismissBanner} aria-label="Dismiss" className="p-1 text-muted-foreground min-w-[36px] min-h-[36px] flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="relative z-10 flex flex-col min-h-dvh">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-5 pt-safe">
          <div className="flex items-center gap-3">
            <img src={tesfaLogo} alt="TesfaPay" className="w-10 h-10 rounded-xl" />
            <div>
              <p className="font-display font-bold text-lg text-gold leading-none">TesfaPay</p>
              <p className="text-xs text-muted-foreground">Global Bank Ethiopia</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin")}
            className="glass text-xs text-muted-foreground px-3 py-1.5 rounded-full hover:text-gold transition-colors"
          >
            Admin ↗
          </button>
        </header>

        {/* Hero Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
          <div className="animate-float mb-6">
            <img src={tesfaLogo} alt="TesfaPay" className="w-24 h-24 mx-auto rounded-2xl shadow-gold" />
          </div>

          <h1 className="font-display font-bold text-4xl md:text-5xl mb-3 leading-tight">
            <span className="text-gold">ተስፋ</span>
            <span className="text-foreground"> Pay</span>
          </h1>
          <p className="text-xl font-display font-semibold text-foreground mb-2">Your Hope. Your Wallet.</p>
          <p className="text-muted-foreground text-sm max-w-xs mb-8 leading-relaxed">
            Ethiopia's most trusted digital wallet — powered by Global Bank Ethiopia. 
            Fast, secure, and built for every Ethiopian.
          </p>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-8">
            {features.map((f) => (
              <div key={f.title} className="glass rounded-2xl p-3 text-left hover-lift">
                <f.icon className="w-5 h-5 text-gold mb-2" />
                <p className="text-xs font-semibold text-foreground mb-0.5">{f.title}</p>
                <p className="text-xs text-muted-foreground leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="w-full max-w-sm space-y-3">
            <button
              onClick={() => navigate("/wallet")}
              className="w-full py-4 rounded-2xl font-display font-bold text-tesfa-dark bg-gradient-gold shadow-gold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity animate-glow-gold text-sm"
            >
              Open My Wallet <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/agent")}
              className="w-full py-3.5 rounded-2xl font-semibold text-foreground glass border border-border flex items-center justify-center gap-2 hover:border-primary/40 transition-colors text-sm"
            >
              🏪 Agent Portal — ወኪል
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => navigate("/onboarding")}
                className="flex-1 py-3 rounded-2xl font-semibold text-primary glass border border-primary/30 text-xs hover:bg-primary/10 transition-colors"
              >
                Create Account
              </button>
              <button
                onClick={() => navigate("/agent/onboarding")}
                className="flex-1 py-3 rounded-2xl font-semibold text-muted-foreground glass border border-border text-xs hover:border-primary/30 transition-colors"
              >
                Become an Agent
              </button>
            </div>
          </div>
        </div>

        {/* Bottom info */}
        <div className="px-6 pb-safe pb-8 text-center">
          <p className="text-xs text-muted-foreground">
            Licensed by National Bank of Ethiopia · ETB Regulated
          </p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <span className="text-xs text-muted-foreground">🇪🇹 Ethiopia</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
            <span className="text-xs text-muted-foreground">Amharic & English</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
            <span className="text-xs text-muted-foreground">24/7 Support</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
