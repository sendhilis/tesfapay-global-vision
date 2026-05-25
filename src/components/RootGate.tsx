import { Navigate } from "react-router-dom";
import { useWizard } from "@/contexts/BankConfigContext";
import Launchpad from "@/pages/Launchpad";

/**
 * RootGate — until the bank admin has published their BankConfig
 * via the wizard, redirect to /setup. Once published, render the
 * Launchpad which lists ONLY the enabled platform modules.
 *
 * IMPORTANT: We must wait for hydration to finish before deciding,
 * otherwise a full-page reload after publish briefly sees
 * `published=false` and bounces the user back into /setup.
 */
export default function RootGate() {
  const { published, syncState } = useWizard();

  if (syncState === "loading") {
    return (
      <div className="min-h-dvh grid place-items-center bg-background">
        <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground animate-pulse">
          Loading your bank…
        </div>
      </div>
    );
  }

  if (!published) return <Navigate to="/setup" replace />;
  return <Launchpad />;
}
