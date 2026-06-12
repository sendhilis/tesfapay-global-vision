/**
 * EnvironmentSwitcher — three-lane selector for Sandbox / UAT / Production
 * promotion runs. Production lane is visually marked as gated.
 */
import { Lock } from "lucide-react";
import { ENV_DESCRIPTION, ENV_LABEL, type PromotionEnv } from "@/lib/bankgpt-promotion-steps";

const ENVS: PromotionEnv[] = ["sandbox", "uat", "prod"];

export function EnvironmentSwitcher({
  value, onChange, progressByEnv,
}: {
  value: PromotionEnv;
  onChange: (env: PromotionEnv) => void;
  progressByEnv: Record<PromotionEnv, number>;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {ENVS.map((env) => {
        const active = env === value;
        const gated = env === "prod";
        return (
          <button
            key={env}
            onClick={() => onChange(env)}
            className={`text-left rounded-xl border p-4 transition-all ${
              active
                ? "border-tesfa-gold bg-tesfa-gold/5 shadow-md"
                : "border-border hover:border-tesfa-gold/40 bg-card"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
                Lane
              </span>
              {gated && (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-semibold">
                  <Lock className="w-3 h-3" /> Gated
                </span>
              )}
            </div>
            <div className="text-sm font-bold text-foreground">{ENV_LABEL[env]}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              {ENV_DESCRIPTION[env]}
            </div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-tesfa-gold transition-all"
                style={{ width: `${progressByEnv[env]}%` }}
              />
            </div>
            <div className="mt-1 text-[10px] font-mono text-muted-foreground">
              {progressByEnv[env]}% complete
            </div>
          </button>
        );
      })}
    </div>
  );
}
