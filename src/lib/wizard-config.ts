export type ModuleId =
  | "entry" | "M1" | "M2" | "M3" | "M4" | "M5" | "M6" | "M7" | "M8" | "M9" | "review";

export type StepDef = {
  id: string;
  module: ModuleId;
  title: string;
  section: string;
  input: string;
};

export const MODULES: { id: ModuleId; code: string; name: string; desc: string }[] = [
  { id: "entry",  code: "00", name: "Welcome",                 desc: "Authenticate & begin" },
  { id: "M1",     code: "01", name: "Identity & Brand",        desc: "Name, logo, palette, type" },
  { id: "M2",     code: "02", name: "CX Design",               desc: "Navigation, layout, interaction" },
  { id: "M3",     code: "03", name: "Personas",                desc: "Audience segments & rules" },
  { id: "M4",     code: "04", name: "Onboarding",              desc: "KYC, account opening, welcome" },
  { id: "M5",     code: "05", name: "AI Agent Mesh",           desc: "12 agents · tone · escalation" },
  { id: "M6",     code: "06", name: "Product Catalogue",       desc: "Accounts, loans, deposits" },
  { id: "M7",     code: "07", name: "Branch & Staff",          desc: "Branch network configuration" },
  { id: "M8",     code: "08", name: "Process AI",              desc: "Reconciliation, compliance, flows" },
  { id: "M9",     code: "09", name: "Ethiopia Compliance",     desc: "Fayda · Eth-Switch · NBE" },
  { id: "review", code: "10", name: "Review & Go Live",        desc: "Validate · publish BankConfig" },
];

export const STEPS: StepDef[] = [
  { id: "W01", module: "entry", section: "Setup Entry",   title: "Wizard Welcome & Auth",         input: "Button" },
  { id: "W02", module: "M1",    section: "M1 — Identity", title: "Bank Name & Short Name",        input: "Text Input" },
  { id: "W03", module: "M1",    section: "M1 — Identity", title: "Logo Upload",                   input: "File Upload" },
  { id: "W04", module: "M1",    section: "M1 — Identity", title: "Tagline",                       input: "Text Input" },
  { id: "W05", module: "M1",    section: "M1 — Identity", title: "Market & Regulatory Setup",     input: "Dropdown + Text" },
  { id: "W06", module: "M1",    section: "M1 — Identity", title: "Language Configuration",        input: "Multi-select + Drag" },
  { id: "W07", module: "M1",    section: "M1 — Brand",    title: "Primary Brand Colour",          input: "Colour Picker" },
  { id: "W08", module: "M1",    section: "M1 — Brand",    title: "Full Colour Palette",           input: "Colour Pickers ×7" },
  { id: "W09", module: "M1",    section: "M1 — Brand",    title: "Typography",                    input: "Font Picker" },
  { id: "W10", module: "M1",    section: "M1 — Brand",    title: "Visual Style",                  input: "Toggle Cards" },
  { id: "W11", module: "M2",    section: "M2 — CX Design",title: "Navigation Style",              input: "Visual Selector" },
  { id: "W12", module: "M2",    section: "M2 — CX Design",title: "Home Screen Layout",            input: "Visual Selector" },
  { id: "W13", module: "M2",    section: "M2 — CX Design",title: "Interaction Mode",              input: "Toggle Cards" },
  { id: "W14", module: "M2",    section: "M2 — CX Design",title: "UX Details",                    input: "Dropdowns + Toggles" },
  { id: "W15", module: "M3",    section: "M3 — Persona",  title: "Persona 1 Definition",          input: "Form + Preview" },
  { id: "W16", module: "M3",    section: "M3 — Persona",  title: "Persona 2–8 Definitions",       input: "Repeat Form" },
  { id: "W17", module: "M3",    section: "M3 — Persona",  title: "Persona Classification Rules",  input: "Rule Builder" },
  { id: "W18", module: "M3",    section: "M3 — Persona",  title: "Persona UX Variants",           input: "Per-Persona Overrides" },
  { id: "W19", module: "M4",    section: "M4 — Onboarding", title: "KYC & Identity Config",       input: "Dropdowns + Toggles" },
  { id: "W20", module: "M4",    section: "M4 — Onboarding", title: "Account Opening Settings",    input: "Dropdowns + Toggles" },
  { id: "W21", module: "M4",    section: "M4 — Onboarding", title: "Onboarding Step Sequencer",   input: "Drag & Drop" },
  { id: "W22", module: "M4",    section: "M4 — Onboarding", title: "Welcome Experience",          input: "Visual Selector" },
  { id: "W23", module: "M5",    section: "M5 — AI Setup", title: "Global AI Settings",            input: "Sliders + Toggles" },
  { id: "W24", module: "M5",    section: "M5 — AI Setup", title: "Agent Activation",              input: "Toggle List" },
  { id: "W25", module: "M5",    section: "M5 — AI Setup", title: "Agent Deep Config",             input: "Per-Agent Forms" },
  { id: "W26", module: "M6",    section: "M6 — Products", title: "Product Catalogue",             input: "Card Builder" },
  { id: "W27", module: "M7",    section: "M7 — Branch",   title: "Branch Configuration",          input: "Conditional Form" },
  { id: "W28", module: "M7",    section: "M7 — Branch",   title: "Branch List",                   input: "Map + Form" },
  { id: "W29", module: "M8",    section: "M8 — Process AI", title: "Reconciliation Setup",        input: "Form + Rule Builder" },
  { id: "W30", module: "M8",    section: "M8 — Process AI", title: "Compliance Configuration",    input: "Form + Multi-select" },
  { id: "W31", module: "M8",    section: "M8 — Process AI", title: "Custom Workflows",            input: "Workflow Builder" },
  { id: "W32", module: "M9",    section: "M9 — Ethiopia", title: "Fayda Integration",             input: "Form + API Test" },
  { id: "W33", module: "M9",    section: "M9 — Ethiopia", title: "Eth-Switch & Interop",          input: "Form + Toggles" },
  { id: "W34", module: "M9",    section: "M9 — Ethiopia", title: "Ethiopian Calendar & Features", input: "Toggles + Config" },
  { id: "W35", module: "M9",    section: "M9 — Ethiopia", title: "NBE Report Schedule",           input: "Report Configurator" },
  { id: "W36", module: "review",section: "Validation",    title: "Completeness Review & Go Live", input: "Dashboard" },
];

export const TOTAL_STEPS = STEPS.length;
