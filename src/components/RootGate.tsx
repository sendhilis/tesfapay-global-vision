import { Navigate } from "react-router-dom";
import { useWizard } from "@/contexts/BankConfigContext";
import Index from "@/pages/Index";

/**
 * RootGate — Redirects "/" to "/setup" until the bank admin has
 * published their configuration via the ABX wizard.
 */
export default function RootGate() {
  const { published } = useWizard();
  if (!published) return <Navigate to="/setup" replace />;
  return <Index />;
}
