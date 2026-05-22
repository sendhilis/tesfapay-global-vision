export type ModuleId =
  | "entry" | "M1" | "M2" | "M3" | "M4" | "MESH" | "M5" | "M6" | "review";

export type StepDef = {
  id: string;
  module: ModuleId;
  title: string;
  section: string;
  input: string;
};

export const MODULES: { id: ModuleId; code: string; name: string; desc: string }[] = [
  { id: "entry",  code: "00", name: "Welcome",          desc: "Start setup" },
  { id: "M1",     code: "01", name: "Identity",         desc: "Bank name, logo, tagline" },
  { id: "M2",     code: "02", name: "Theme",            desc: "Pick & tune your ABX theme" },
  { id: "M3",     code: "03", name: "Products",         desc: "Catalogue & offerings" },
  { id: "M4",     code: "04", name: "AI Concierge",     desc: "Tone & global defaults" },
  { id: "MESH",   code: "05", name: "AI Mesh",          desc: "Configure agents by talking to them" },
  { id: "M5",     code: "06", name: "Onboarding",       desc: "KYC & account opening" },
  { id: "M6",     code: "07", name: "Compliance",       desc: "Ethiopia · Fayda · NBE" },
  { id: "review", code: "08", name: "Review & Go Live", desc: "Publish BankConfig" },
];

export const STEPS: StepDef[] = [
  { id: "W01", module: "entry",  section: "Welcome",       title: "Wizard Welcome",            input: "Button" },
  { id: "W02", module: "M1",     section: "Identity",      title: "Bank Identity",             input: "Form" },
  { id: "W03", module: "M2",     section: "Theme",         title: "Pick Your ABX Theme",       input: "Theme Picker" },
  { id: "W04", module: "M2",     section: "Theme",         title: "Tune Accent & Mode",        input: "Sliders + Toggles" },
  { id: "W05", module: "M3",     section: "Products",      title: "Product Catalogue",         input: "Card Builder" },
  { id: "W06", module: "M4",     section: "AI",            title: "Concierge Tone & Agents",   input: "Sliders + Toggles" },
  { id: "WAM", module: "MESH",   section: "AI Mesh",       title: "AI Mesh Studio",            input: "Canvas + Config + Live Sim" },
  { id: "W07", module: "M5",     section: "Onboarding",    title: "KYC & Account Opening",     input: "Form + Toggles" },
  { id: "W08", module: "M6",     section: "Compliance",    title: "Ethiopia · NBE · Fayda",    input: "Form + Toggles" },
  { id: "W09", module: "review", section: "Validation",    title: "Review & Go Live",          input: "Dashboard" },
];

export const TOTAL_STEPS = STEPS.length;
