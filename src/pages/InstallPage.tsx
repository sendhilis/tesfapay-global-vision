import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Share, Plus, ArrowLeft, Smartphone, CheckCircle2 } from "lucide-react";
import tesfaLogo from "@/assets/tesfa-logo.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPage = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [installDone, setInstallDone] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
    setIsAndroid(/android/.test(ua));

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstallDone(true);
        setDeferredPrompt(null);
      }
    }
  };

  const features = [
    "Works offline — even without internet",
    "Instant access from your home screen",
    "Push notifications for transactions",
    "Faster load times — no app store needed",
    "Automatic updates in the background",
  ];

  return (
    <div className="min-h-dvh bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 pt-safe border-b border-border">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="p-2 glass rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div>
          <h1 className="font-display font-bold text-base text-foreground">Install GlobalPay</h1>
          <p className="text-xs text-muted-foreground">Add to your home screen</p>
        </div>
      </div>

      <div className="flex-1 px-5 py-6 space-y-6">
        {/* App Card */}
        <div className="glass rounded-3xl p-6 flex flex-col items-center text-center">
          <img src={tesfaLogo} alt="GlobalPay" className="w-20 h-20 rounded-2xl shadow-gold mb-4" />
          <h2 className="font-display font-bold text-xl text-gold mb-1">GlobalPay</h2>
          <p className="text-xs text-muted-foreground mb-4">Global Bank Ethiopia · Free</p>
          <div className="flex items-center gap-1 mb-4">
            {[1,2,3,4,5].map(i => <span key={i} className="text-gold text-sm">★</span>)}
            <span className="text-xs text-muted-foreground ml-1">4.9 (12k reviews)</span>
          </div>
          {installDone || isInstalled ? (
            <div className="flex items-center gap-2 text-tesfa-green">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold text-sm">Installed!</span>
            </div>
          ) : deferredPrompt ? (
            <button
              onClick={handleInstall}
              className="w-full py-3.5 rounded-2xl bg-gradient-gold text-tesfa-dark font-bold text-sm flex items-center justify-center gap-2 shadow-gold active:scale-95 transition-transform"
            >
              <Download className="w-4 h-4" />
              Install App
            </button>
          ) : null}
        </div>

        {/* Features */}
        <div>
          <h3 className="font-display font-bold text-sm text-foreground mb-3">Why install?</h3>
          <div className="space-y-2">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-3 glass rounded-2xl px-4 py-3">
                <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                <p className="text-sm text-foreground">{f}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Manual Instructions */}
        {(isIOS || (!deferredPrompt && !isAndroid)) && (
          <div className="glass-gold rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-4 h-4 text-gold" />
              <p className="text-sm font-bold text-gold">iPhone / iPad Instructions</p>
            </div>
            <ol className="space-y-2">
              <li className="flex items-start gap-2 text-xs text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-gold font-bold flex-shrink-0 mt-0.5">1</span>
                Tap the <Share className="w-3.5 h-3.5 inline mx-1 text-gold" /> <strong>Share</strong> button in Safari
              </li>
              <li className="flex items-start gap-2 text-xs text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-gold font-bold flex-shrink-0 mt-0.5">2</span>
                Scroll down and tap <strong>"Add to Home Screen"</strong>
              </li>
              <li className="flex items-start gap-2 text-xs text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-gold font-bold flex-shrink-0 mt-0.5">3</span>
                Tap <Plus className="w-3.5 h-3.5 inline mx-1 text-gold" /> <strong>Add</strong> to confirm
              </li>
            </ol>
          </div>
        )}

        {isAndroid && !deferredPrompt && (
          <div className="glass-gold rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-4 h-4 text-gold" />
              <p className="text-sm font-bold text-gold">Android Instructions</p>
            </div>
            <ol className="space-y-2">
              <li className="flex items-start gap-2 text-xs text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-gold font-bold flex-shrink-0 mt-0.5">1</span>
                Tap the <strong>⋮ menu</strong> in Chrome (top right)
              </li>
              <li className="flex items-start gap-2 text-xs text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-gold font-bold flex-shrink-0 mt-0.5">2</span>
                Tap <strong>"Add to Home screen"</strong>
              </li>
              <li className="flex items-start gap-2 text-xs text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-gold font-bold flex-shrink-0 mt-0.5">3</span>
                Tap <strong>Add</strong> to confirm
              </li>
            </ol>
          </div>
        )}

        <button
          onClick={() => navigate("/")}
          className="w-full py-3.5 rounded-2xl glass border border-border text-foreground font-semibold text-sm"
        >
          Continue in Browser
        </button>
      </div>
    </div>
  );
};

export default InstallPage;
