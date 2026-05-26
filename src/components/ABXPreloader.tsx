import { useEffect, useState } from "react";

/**
 * ABXPreloader — Full-bleed brand splash shown on first app load.
 * Mirrors the opening slide of the ABX (Alpha Banking Experience) deck:
 * Techurate mark, sparkle-accented ABX wordmark, tagline pill, iridescent orb.
 *
 * Shows once per browser session (sessionStorage flag), ~2.2s, then fades out.
 */
export default function ABXPreloader() {
  const [mounted, setMounted] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem("abx-preloader-seen");
  });
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    const t1 = window.setTimeout(() => setLeaving(true), 2000);
    const t2 = window.setTimeout(() => {
      setMounted(false);
      sessionStorage.setItem("abx-preloader-seen", "1");
    }, 2700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-700 ease-out ${
        leaving ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        background:
          "linear-gradient(180deg, #FBFAFE 0%, #F2EEFB 55%, #E6E0F7 100%)",
      }}
    >
      {/* Techurate wordmark */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-90">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 13 C7 5, 12 4, 17 11" stroke="#7BC142" strokeWidth="2.4" strokeLinecap="round" fill="none"/>
          <path d="M3 13 C9 17, 14 16, 21 7" stroke="#1E2A78" strokeWidth="2.4" strokeLinecap="round" fill="none"/>
        </svg>
        <div className="leading-none">
          <div className="font-serif font-bold text-[#1E2A78] text-lg tracking-tight">
            Techurate
          </div>
          <div className="text-[8px] tracking-[0.18em] text-[#1E2A78]/70 uppercase">
            Precision acquired
          </div>
        </div>
      </div>

      {/* Sparkles + ABX wordmark */}
      <div className="relative flex flex-col items-center">
        <div className="relative">
          {/* Sparkle stars (gradient blue→green) */}
          <svg
            className="absolute -top-10 left-1/2 -translate-x-[55%] animate-abx-sparkle"
            width="58"
            height="58"
            viewBox="0 0 100 100"
          >
            <defs>
              <linearGradient id="abxSpark1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#22C55E" />
              </linearGradient>
            </defs>
            <path
              d="M50 5 L57 43 L95 50 L57 57 L50 95 L43 57 L5 50 L43 43 Z"
              fill="url(#abxSpark1)"
            />
          </svg>
          <svg
            className="absolute -top-4 left-1/2 translate-x-2 animate-abx-sparkle-delay"
            width="32"
            height="32"
            viewBox="0 0 100 100"
          >
            <path
              d="M50 5 L57 43 L95 50 L57 57 L50 95 L43 57 L5 50 L43 43 Z"
              fill="#3B82F6"
            />
          </svg>

          {/* ABX wordmark */}
          <div
            className="font-black tracking-tight text-[#0B0B12] select-none"
            style={{
              fontFamily: "'Sora', system-ui, sans-serif",
              fontSize: "clamp(96px, 18vw, 220px)",
              lineHeight: 0.85,
              fontStretch: "condensed",
              letterSpacing: "-0.04em",
            }}
          >
            ABX
          </div>
        </div>

        {/* Tagline */}
        <div className="mt-4 text-[#1F2937] tracking-[0.45em] text-sm md:text-base font-medium">
          ALPHA&nbsp;&nbsp;BANKING&nbsp;&nbsp;EXPERIENCE
        </div>
      </div>

      {/* Iridescent orb */}
      <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full blur-3xl opacity-70 animate-abx-orb"
        style={{
          background:
            "radial-gradient(circle at 35% 40%, #C7BBF5 0%, #9FB8FF 35%, #E6C2F0 65%, transparent 75%)",
        }}
      />

      {/* Search bar pill */}
      <div className="absolute bottom-16 w-[min(640px,86vw)] glass-pill flex items-center gap-3 px-5 py-3 rounded-full shadow-[0_10px_40px_-12px_rgba(60,40,120,0.25)] backdrop-blur-md border border-white/60 bg-white/85">
        <span className="text-[#6B7280] text-xl leading-none">+</span>
        <span className="flex-1 text-sm md:text-[15px] text-[#374151]">
          Redefining How the World Interacts with Banking
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round">
          <rect x="9" y="3" width="6" height="12" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <rect x="3" y="9" width="2.5" height="6" rx="1" />
            <rect x="7" y="6" width="2.5" height="12" rx="1" />
            <rect x="11" y="3" width="2.5" height="18" rx="1" />
            <rect x="15" y="7" width="2.5" height="10" rx="1" />
            <rect x="19" y="10" width="2.5" height="4" rx="1" />
          </svg>
        </span>
      </div>

      <style>{`
        @keyframes abx-sparkle {
          0%, 100% { transform: translateX(-55%) scale(1) rotate(0deg); opacity: 1; }
          50%      { transform: translateX(-55%) scale(1.15) rotate(8deg); opacity: 0.85; }
        }
        @keyframes abx-sparkle-delay {
          0%, 100% { transform: translateX(0.5rem) scale(1) rotate(0deg); opacity: 0.9; }
          50%      { transform: translateX(0.5rem) scale(0.85) rotate(-10deg); opacity: 1; }
        }
        @keyframes abx-orb {
          0%, 100% { transform: translate(-50%, 0) scale(1); }
          50%      { transform: translate(-50%, -10px) scale(1.04); }
        }
        .animate-abx-sparkle { animation: abx-sparkle 2.4s ease-in-out infinite; transform-origin: center; }
        .animate-abx-sparkle-delay { animation: abx-sparkle-delay 2.4s ease-in-out infinite; transform-origin: center; }
        .animate-abx-orb { animation: abx-orb 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
