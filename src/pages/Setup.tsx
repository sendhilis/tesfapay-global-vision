/**
 * Setup — ABX bank-admin configuration wizard.
 * @route /setup
 * Drives the live look-and-feel of the GlobalPay wallet via BankConfigContext.
 */
import { WizardShell } from "@/components/wizard/WizardShell";

export default function Setup() {
  return <WizardShell />;
}
