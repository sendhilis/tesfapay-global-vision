/**
 * AdminBar — Thin top strip shown on every post-go-live screen
 * (Launchpad, Wallet, Platform modules) while the bank admin is
 * still in the testing phase. Lets the admin jump back to the
 * Modules Launchpad or re-open the ABX Wizard from anywhere.
 */
import { LayoutGrid, Settings2, ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function AdminBar({ label }: { label?: string }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onLaunchpad = pathname === "/" || pathname === "/launchpad";

  return (
    <div className="w-full bg-[#0b1220] text-white/90 border-b border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="hidden sm:inline-flex items-center rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] uppercase tracking-[0.22em] text-amber-300">
            Admin Preview
          </span>
          {label && (
            <span className="truncate text-[11px] uppercase tracking-[0.18em] text-white/60">
              {label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!onLaunchpad && (
            <button
              onClick={() => navigate("/launchpad")}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] hover:bg-white/20"
            >
              <LayoutGrid className="h-3 w-3" /> Modules
            </button>
          )}
          <button
            onClick={() => navigate("/setup")}
            className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-semibold text-slate-900 hover:bg-amber-300"
          >
            <Settings2 className="h-3 w-3" /> Wizard
          </button>
        </div>
      </div>
    </div>
  );
}
