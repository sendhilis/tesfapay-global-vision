/**
 * BankGPT settings panel
 * ─────────────────────────────────────────────────────────────
 * Lives inside the W-MOD Configure drawer when the bank admin
 * clicks "Configure" on the BankGPT module.
 *
 * Drives `config.ai.mesh.agents[*].enabled` directly — the very
 * same flags the live AI Mesh on /wallet reads from. Toggling here
 * activates / deactivates that concierge agent across the bank.
 */
import { useWizard, type MeshAgentId } from "@/contexts/BankConfigContext";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Languages } from "lucide-react";

const ORDER: MeshAgentId[] = [
  "concierge", "onboarding", "savingsCoach", "investmentCoach",
  "loanAgent", "complaintAgent", "notificationAgent",
];

const ROLE_HINT: Record<MeshAgentId, string> = {
  concierge:          "Master router. Reads intent, hands off to specialists, holds context.",
  onboarding:         "Welcomes new customers, walks them through KYC and account opening.",
  savingsCoach:       "Suggests goals, runs auto-sweeps, celebrates milestones.",
  investmentCoach:    "Recommends T-Bills, fixed deposits, explains risk plainly.",
  loanAgent:          "Pre-qualifies micro-loans, handles applications and repayments.",
  complaintAgent:     "Resolves disputes, reverses charges, escalates to human at frustration.",
  notificationAgent:  "Outbound only — salary alerts, low-balance warnings, milestone pings.",
};

export function BankGPTSettings() {
  const { config, setConfig } = useWizard();
  const mesh = config.ai.mesh;

  function toggle(id: MeshAgentId, on: boolean) {
    if (mesh.agents[id].locked) return;
    setConfig({
      ...config,
      ai: {
        ...config.ai,
        mesh: {
          ...mesh,
          agents: {
            ...mesh.agents,
            [id]: { ...mesh.agents[id], enabled: on },
          },
        },
      },
    });
  }

  const activeCount = ORDER.filter((id) => mesh.agents[id].enabled).length;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">AI Mesh roster</p>
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">{activeCount}</strong> of {ORDER.length} concierge agents activated
            </p>
          </div>
          <Badge variant="secondary" className="gap-1.5">
            <Languages className="h-3 w-3" /> EN + አማ
          </Badge>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          All agents are bilingual (English + Amharic) by default and ground every reply in the
          customer's live profile from the CDP — balances, transactions, loans, cards, investments,
          credit &amp; engagement scores.
        </p>
      </div>

      <div className="space-y-3">
        {ORDER.map((id) => {
          const a = mesh.agents[id];
          const isOn = a.enabled;
          return (
            <div
              key={id}
              className={
                "rounded-xl border p-4 transition " +
                (isOn ? "border-primary/40 bg-primary/5" : "border-border bg-card")
              }
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-base font-bold text-white"
                  style={{ background: a.color }}
                >
                  {a.avatarStyle === "initial" ? a.name[0] : a.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">{a.name}</h4>
                    {a.locked && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                        always on
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{a.tagline}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-snug">{ROLE_HINT[id]}</p>
                </div>
                <Switch
                  checked={isOn}
                  disabled={a.locked}
                  onCheckedChange={(v) => toggle(id, v)}
                  aria-label={`Activate ${a.name}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground">
        On Go Live, customers see the AI Mesh chat experience with these agents enabled. Every
        message is routed to the best specialist; handoffs are seamless and contextual.
      </p>
    </div>
  );
}
