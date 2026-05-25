import { Navigate } from "react-router-dom";
import { useWizard } from "@/contexts/BankConfigContext";
import Launchpad from "@/pages/Launchpad";

/**
 * RootGate — until the bank admin has published their BankConfig
 * via the wizard, redirect to /setup. Once published, render the
 * Launchpad which lists ONLY the enabled platform modules.
 */
export default function RootGate() {
  const { published } = useWizard();
  if (!published) return <Navigate to="/setup" replace />;
  return <Launchpad />;
}
