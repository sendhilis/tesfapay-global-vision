/**
 * ABX Theme Library
 * 4 pre-designed, opinionated themes. Banks pick one and customize only
 * within the safe envelope (accent shift, name, logo, products, AI tone).
 *
 * Each theme is a complete snapshot of brand + ux tokens that drives the
 * full GlobalPay wallet repaint.
 */

export type ThemeId = "emerald" | "indigo" | "onyx" | "coral";

export type AbxTheme = {
  id: ThemeId;
  name: string;
  tagline: string;
  vibe: string;
  brand: {
    primaryColor: string;
    secondaryColor: string;
    surfaceColor: string;
    backgroundColor: string;
    textPrimary: string;
    textSecondary: string;
    successColor: string;
    warningColor: string;
    errorColor: string;
    fontHeading: string;
    fontBody: string;
    borderRadius: "none" | "soft" | "rounded" | "pill";
    shadowStyle: "flat" | "soft" | "elevated" | "dramatic";
  };
  // Extra tokens that drive structural look beyond the basic palette
  tokens: {
    gradientHero: string;    // bg behind balance card
    gradientAccent: string;  // gold/secondary highlight
    gradientCard: string;    // tile gradient
    radiusPx: number;        // for inline `--radius`
    glassBg: string;
    glassBorder: string;
    shadowCard: string;
  };
  ux: {
    navigationStyle: "bottom-tabs" | "side-drawer" | "floating-hub" | "ai-first";
    homeScreenLayout: "balance-hero" | "card-grid" | "feed" | "agent-chat";
    density: "compact" | "comfortable" | "spacious";
    cardStyle: "flat" | "elevated" | "outlined" | "glass";
    animationLevel: "minimal" | "balanced" | "expressive";
  };
};

export const ABX_THEMES: Record<ThemeId, AbxTheme> = {
  emerald: {
    id: "emerald",
    name: "Emerald Heritage",
    tagline: "Ethiopian premium banking. Deep green, warm gold.",
    vibe: "Trust · heritage · craft",
    brand: {
      primaryColor: "#D4A226",       // gold (CTA)
      secondaryColor: "#1B5E47",     // forest green (accent)
      surfaceColor: "#16252E",       // card
      backgroundColor: "#0B1A14",    // deep green-black
      textPrimary: "#F2E8D5",
      textSecondary: "#8FA89B",
      successColor: "#34D399",
      warningColor: "#F59E0B",
      errorColor: "#EF4444",
      fontHeading: "Sora",
      fontBody: "Plus Jakarta Sans",
      borderRadius: "rounded",
      shadowStyle: "elevated",
    },
    tokens: {
      gradientHero:   "linear-gradient(135deg, hsl(168 70% 18%) 0%, hsl(185 72% 22%) 50%, hsl(168 70% 10%) 100%)",
      gradientAccent: "linear-gradient(135deg, hsl(42 90% 52%), hsl(45 95% 65%))",
      gradientCard:   "linear-gradient(145deg, hsl(168 30% 15%) 0%, hsl(168 30% 9%) 100%)",
      radiusPx: 20,
      glassBg: "rgba(20, 40, 30, 0.55)",
      glassBorder: "rgba(212, 162, 38, 0.18)",
      shadowCard: "0 8px 32px hsl(168 70% 8% / 0.5)",
    },
    ux: {
      navigationStyle: "bottom-tabs",
      homeScreenLayout: "balance-hero",
      density: "comfortable",
      cardStyle: "glass",
      animationLevel: "balanced",
    },
  },

  indigo: {
    id: "indigo",
    name: "Indigo Modern",
    tagline: "Fintech challenger. Clean, bright, fast.",
    vibe: "Modern · digital · clarity",
    brand: {
      primaryColor: "#4F46E5",
      secondaryColor: "#06B6D4",
      surfaceColor: "#FFFFFF",
      backgroundColor: "#F5F7FB",
      textPrimary: "#0F172A",
      textSecondary: "#64748B",
      successColor: "#10B981",
      warningColor: "#F59E0B",
      errorColor: "#EF4444",
      fontHeading: "Space Grotesk",
      fontBody: "Inter",
      borderRadius: "soft",
      shadowStyle: "soft",
    },
    tokens: {
      gradientHero:   "linear-gradient(135deg, hsl(238 75% 60%) 0%, hsl(220 90% 55%) 100%)",
      gradientAccent: "linear-gradient(135deg, hsl(189 95% 45%), hsl(238 75% 60%))",
      gradientCard:   "linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(220 30% 97%) 100%)",
      radiusPx: 14,
      glassBg: "rgba(255, 255, 255, 0.72)",
      glassBorder: "rgba(15, 23, 42, 0.06)",
      shadowCard: "0 4px 24px hsl(220 50% 30% / 0.08)",
    },
    ux: {
      navigationStyle: "bottom-tabs",
      homeScreenLayout: "card-grid",
      density: "compact",
      cardStyle: "elevated",
      animationLevel: "minimal",
    },
  },

  onyx: {
    id: "onyx",
    name: "Onyx Premium",
    tagline: "Private banking. Black, champagne, restraint.",
    vibe: "Luxury · editorial · quiet",
    brand: {
      primaryColor: "#C9A84C",        // champagne gold
      secondaryColor: "#7A6A3F",      // bronze
      surfaceColor: "#1A1A1A",
      backgroundColor: "#0A0A0A",
      textPrimary: "#F0E9D6",
      textSecondary: "#9B9482",
      successColor: "#86EFAC",
      warningColor: "#FBBF24",
      errorColor: "#FCA5A5",
      fontHeading: "Cormorant Garamond",
      fontBody: "Inter",
      borderRadius: "none",
      shadowStyle: "dramatic",
    },
    tokens: {
      gradientHero:   "linear-gradient(135deg, hsl(0 0% 5%) 0%, hsl(40 25% 12%) 100%)",
      gradientAccent: "linear-gradient(135deg, hsl(45 56% 55%), hsl(40 40% 35%))",
      gradientCard:   "linear-gradient(145deg, hsl(0 0% 12%) 0%, hsl(0 0% 7%) 100%)",
      radiusPx: 4,
      glassBg: "rgba(20, 20, 20, 0.75)",
      glassBorder: "rgba(201, 168, 76, 0.18)",
      shadowCard: "0 20px 50px hsl(0 0% 0% / 0.8)",
    },
    ux: {
      navigationStyle: "floating-hub",
      homeScreenLayout: "balance-hero",
      density: "spacious",
      cardStyle: "outlined",
      animationLevel: "minimal",
    },
  },

  coral: {
    id: "coral",
    name: "Coral Daily",
    tagline: "Mass-market youth wallet. Warm, friendly, energetic.",
    vibe: "Playful · warm · everyday",
    brand: {
      primaryColor: "#F97565",
      secondaryColor: "#F6B26B",
      surfaceColor: "#FFFFFF",
      backgroundColor: "#FFF5EE",
      textPrimary: "#2D1B16",
      textSecondary: "#8B6F65",
      successColor: "#34D399",
      warningColor: "#F59E0B",
      errorColor: "#EF4444",
      fontHeading: "Outfit",
      fontBody: "Figtree",
      borderRadius: "pill",
      shadowStyle: "soft",
    },
    tokens: {
      gradientHero:   "linear-gradient(135deg, hsl(8 92% 68%) 0%, hsl(28 92% 68%) 100%)",
      gradientAccent: "linear-gradient(135deg, hsl(28 92% 68%), hsl(45 95% 65%))",
      gradientCard:   "linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(28 60% 97%) 100%)",
      radiusPx: 28,
      glassBg: "rgba(255, 245, 238, 0.82)",
      glassBorder: "rgba(249, 117, 101, 0.18)",
      shadowCard: "0 6px 28px hsl(8 92% 60% / 0.18)",
    },
    ux: {
      navigationStyle: "bottom-tabs",
      homeScreenLayout: "feed",
      density: "comfortable",
      cardStyle: "elevated",
      animationLevel: "expressive",
    },
  },
};

export const THEME_LIST = Object.values(ABX_THEMES);

/** Shift hue of a hex within ±range degrees (keeps S/L). For bounded accent tuning. */
export function shiftHueHex(hex: string, deg: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  let r = parseInt(full.slice(0, 2), 16) / 255;
  let g = parseInt(full.slice(2, 4), 16) / 255;
  let b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hue = 0; const l = (max + min) / 2; const d = max - min;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hue = (b - r) / d + 2; break;
      case b: hue = (r - g) / d + 4; break;
    }
    hue = (hue / 6) * 360;
  }
  hue = (hue + deg + 360) % 360;
  // hsl → rgb
  const hslToRgb = (h: number, s: number, l: number) => {
    h /= 360;
    if (s === 0) return [l, l, l];
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
  };
  const [nr, ng, nb] = hslToRgb(hue, s, l);
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0");
  return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`.toUpperCase();
}
