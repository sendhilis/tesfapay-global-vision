import { useWizard } from "@/contexts/BankConfigContext";
import { MODULES, STEPS } from "@/lib/wizard-config";
import { AbxLogo, Diamond } from "./AbxLogo";
import { Check, Lock } from "lucide-react";

export function WizardSidebar() {
  const { stepIdx, goTo, completed, progress } = useWizard();
  const current = STEPS[stepIdx];

  return (
    <aside className="hidden lg:flex flex-col w-[320px] shrink-0 bg-[var(--ink)] text-[var(--cream)] sticky top-0 h-screen">
      <div className="p-8 border-b border-white/10">
        <AbxLogo tone="cream" className="text-2xl" />
        <p className="mt-3 text-[11px] tracking-[0.22em] uppercase text-[var(--teal)]/90">
          Alpha Banking Experience
        </p>
        <p className="mt-1 text-xs text-white/55 font-serif italic">Setup Wizard · v1.0</p>
      </div>

      <div className="px-8 py-5 border-b border-white/10">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/55">
          <span>Progress</span>
          <span className="text-[var(--teal)]">{progress}%</span>
        </div>
        <div className="mt-2 h-[3px] w-full bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[var(--teal)] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {MODULES.map((m) => {
          const moduleSteps = STEPS.map((s, i) => ({ s, i })).filter(({ s }) => s.module === m.id);
          const active = current.module === m.id;
          const allDone = moduleSteps.every(({ i }) => completed.has(i));
          return (
            <div key={m.id} className="px-4 py-1.5">
              <button
                onClick={() => goTo(moduleSteps[0]?.i ?? 0)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all group ${
                  active ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-[10px] w-6 h-6 rounded-full flex items-center justify-center border ${
                      allDone
                        ? "bg-[var(--teal)] border-[var(--teal)] text-[var(--ink)]"
                        : active
                        ? "border-[var(--teal)] text-[var(--teal)]"
                        : "border-white/20 text-white/50"
                    }`}
                  >
                    {allDone ? <Check className="w-3 h-3" strokeWidth={3} /> : m.code}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[13px] font-medium ${active ? "text-white" : "text-white/80"}`}>
                      {m.name}
                    </div>
                    <div className="text-[11px] text-white/45 truncate">{m.desc}</div>
                  </div>
                </div>
                {active && (
                  <ul className="mt-3 ml-9 space-y-1 border-l border-white/10 pl-3">
                    {moduleSteps.map(({ s, i }) => (
                      <li key={s.id}>
                        <button
                          onClick={(e) => { e.stopPropagation(); goTo(i); }}
                          className={`text-[11px] py-1 px-2 rounded w-full text-left flex items-center gap-2 ${
                            i === stepIdx
                              ? "text-[var(--teal)]"
                              : completed.has(i)
                              ? "text-white/60"
                              : "text-white/40 hover:text-white/70"
                          }`}
                        >
                          <span className="font-mono text-[9px] opacity-60">{s.id}</span>
                          <span className="truncate">{s.title.replace(/\*\*/g, "")}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      <div className="px-8 py-5 border-t border-white/10 text-[10px] text-white/40 flex items-center gap-2">
        <Lock className="w-3 h-3" />
        Confidential · Techurate Systems · www.techurate.com
        <Diamond className="h-2 w-2 ml-auto diamond-spin" />
      </div>
    </aside>
  );
}
