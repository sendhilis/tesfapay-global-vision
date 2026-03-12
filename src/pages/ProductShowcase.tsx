import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Download, Smartphone, Send, Receipt, PiggyBank, QrCode,
  Users, ShieldCheck, Brain, BarChart3, Building2, CreditCard, Globe,
  Zap, TrendingUp, Lock, Eye, Bot, Coins, ArrowUpDown, FileCheck,
  Wallet, Star, CheckCircle2, ChevronRight, Landmark, HeartHandshake,
  Network, Layers, Fingerprint, Bell, Clock, Shield, Target, Award, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";

import techmonkLogo from "@/assets/techmonk-logo.png";
import tesfaLogo from "@/assets/tesfa-logo.png";
import heroBg from "@/assets/showcase-hero-bg.jpg";
import walletEcosystem from "@/assets/showcase-wallet-ecosystem.png";
import aiBrain from "@/assets/showcase-ai-brain.png";
import adminConsole from "@/assets/showcase-admin-console.png";
import securityImg from "@/assets/showcase-security.png";

const ProductShowcase = () => {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!contentRef.current || exporting) return;
    setExporting(true);
    try {
      // Temporarily add print-mode class for PDF-specific sizing
      contentRef.current.classList.add("pdf-export-mode");
      // Allow reflow
      await new Promise(r => setTimeout(r, 100));

      const html2pdf = (await import("html2pdf.js")).default;
      const contentWidth = 794; // A4 width in px at 96dpi
      const opt = {
        margin: [0, 0, 0, 0],
        filename: "GlobalPay-Product-Showcase-TechMonk.pdf",
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          width: contentWidth,
          windowWidth: contentWidth,
          scrollY: 0,
          scrollX: 0,
        },
        jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css"], before: ".page-break" },
      };
      await html2pdf().set(opt).from(contentRef.current).save();
      contentRef.current.classList.remove("pdf-export-mode");
    } catch (e) {
      contentRef.current?.classList.remove("pdf-export-mode");
      console.error("PDF export failed:", e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-50 glass border-b border-border print:hidden">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <img src={techmonkLogo} alt="TechMonk" className="h-7" />
            <span className="text-xs text-muted-foreground">×</span>
            <img src={tesfaLogo} alt="GlobalPay" className="h-7 rounded" />
          </div>
          <Button size="sm" onClick={handleExportPDF} disabled={exporting} className="bg-gradient-gold text-foreground font-bold hover:opacity-90">
            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {exporting ? "Generating…" : "Export PDF"}
          </Button>
        </div>
      </div>

      {/* PDF print styles */}
      <style>{`
        .pdf-export-mode {
          max-width: 794px !important;
          width: 794px !important;
        }
        .pdf-export-mode .pdf-section {
          min-height: 1122px !important;
          max-height: 1122px !important;
          height: 1122px !important;
          overflow: hidden !important;
          box-sizing: border-box !important;
          padding: 48px 40px !important;
        }
        .pdf-export-mode .pdf-cover {
          min-height: 1122px !important;
          max-height: 1122px !important;
          height: 1122px !important;
        }
        .pdf-export-mode .page-break {
          height: 0 !important;
          page-break-before: always !important;
        }
        .pdf-export-mode .pdf-section img.section-img {
          max-height: 240px !important;
          object-fit: contain !important;
        }
        .pdf-export-mode .pdf-section .text-3xl {
          font-size: 1.25rem !important;
        }
        .pdf-export-mode .pdf-section .text-2xl {
          font-size: 1.125rem !important;
        }
        .pdf-export-mode .pdf-section h2 {
          font-size: 1.5rem !important;
        }
        @media print {
          .page-break { page-break-before: always; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

      {/* PDF Content — fixed width for consistent PDF rendering */}
      <div ref={contentRef} className="bg-background text-foreground max-w-[1200px] mx-auto">

        {/* ═══════ COVER PAGE ═══════ */}
        <section className="pdf-cover relative min-h-[1120px] flex flex-col items-center justify-center overflow-hidden" style={{ background: "hsl(220 35% 6%)" }}>
          <div className="absolute inset-0 opacity-30">
            <img src={heroBg} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
          <div className="relative z-10 text-center max-w-3xl px-8">
            <div className="flex items-center justify-center gap-6 mb-10">
              <img src={techmonkLogo} alt="TechMonk" className="h-14" />
            </div>
            <div className="inline-block px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 mb-8">
              <span className="text-xs font-semibold text-primary tracking-widest uppercase">Product Showcase 2026</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              <span className="text-foreground">Global</span>
              <span className="text-primary">Pay</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 font-light">
              The World's Most Advanced AI-Powered Mobile Money Platform
            </p>
            <p className="text-sm text-muted-foreground/70 mb-12">
              Enterprise Wallet Solution · Engineered by TechMonk
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              {["14 Core Modules", "50+ AI Features", "Regulatory Compliant", "Agent & Merchant Networks"].map(t => (
                <span key={t} className="px-4 py-2 rounded-xl glass-gold text-xs font-semibold text-primary">{t}</span>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-6 max-w-lg mx-auto">
              {[
                { n: "10M+", l: "Target Users" },
                { n: "50K+", l: "Agent Network" },
                { n: "<0.3s", l: "Avg Latency" },
                { n: "99.99%", l: "Uptime SLA" },
              ].map(s => (
                <div key={s.l} className="text-center">
                  <p className="text-2xl font-display font-bold text-primary">{s.n}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-8 z-10 text-center">
            <p className="text-[10px] text-muted-foreground/50">CONFIDENTIAL — © 2026 TechMonk Technologies</p>
          </div>
        </section>

        {/* ═══════ WALLET ECOSYSTEM ═══════ */}
        <div className="page-break" />
        <section className="pdf-section min-h-[1120px] py-20 px-8">
          <div className="max-w-5xl mx-auto">
            <SectionHeader icon={Smartphone} title="Customer Wallet Ecosystem" subtitle="Complete financial services in every customer's pocket" number="01" />
            <div className="grid md:grid-cols-2 gap-12 mt-12 items-center">
              <div>
                <img src={walletEcosystem} alt="Wallet Ecosystem" className="section-img w-full max-w-md mx-auto drop-shadow-2xl" />
              </div>
              <div className="space-y-4">
                {[
                  { icon: Send, title: "P2P Money Transfer", desc: "Instant transfers via phone number, QR code, or NFC tap. Multi-currency with real-time FX rates. Schedule recurring payments." },
                  { icon: Receipt, title: "Bill Payments", desc: "Pay utilities, telecom, school fees, tax, insurance — 200+ billers integrated via single API gateway." },
                  { icon: PiggyBank, title: "Smart Savings Goals", desc: "AI-suggested savings targets based on spending patterns. Auto-round-up deposits, goal-based visual tracking." },
                  { icon: QrCode, title: "Merchant QR Payments", desc: "Scan static/dynamic QR codes for instant merchant payments. Split bills, add tips, earn loyalty points." },
                  { icon: CreditCard, title: "AI Micro-Loans", desc: "Credit scoring via transaction history & alternative data. Instant disbursement, flexible repayment schedules." },
                  { icon: Coins, title: "Airtime & Data Top-Up", desc: "Top-up any mobile network operator. Auto-recharge rules, family plans, bulk purchases for enterprises." },
                ].map(f => (
                  <FeatureRow key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
                ))}
              </div>
            </div>

            {/* Benefits cards */}
            <div className="grid md:grid-cols-2 gap-6 mt-16">
              <BenefitCard
                title="Benefits to Customers"
                color="gold"
                items={[
                  "24/7 access to financial services without branch visits",
                  "Lower transaction fees than traditional banking (up to 60% cheaper)",
                  "AI-powered spending insights and savings recommendations",
                  "Instant money transfers completed in under 3 seconds",
                  "Earn loyalty rewards on every transaction",
                  "Micro-loans available without collateral requirements",
                ]}
              />
              <BenefitCard
                title="Benefits to Service Provider"
                color="green"
                items={[
                  "Massive customer acquisition through digital-first onboarding",
                  "Transaction fee revenue across all payment channels",
                  "Rich customer data for cross-selling financial products",
                  "Reduced operational costs — 95% digital vs branch operations",
                  "Interest income from micro-lending portfolio",
                  "Brand loyalty via rewards and gamification engine",
                ]}
              />
            </div>
          </div>
        </section>

        {/* ═══════ AGENT BANKING ═══════ */}
        <div className="page-break" />
        <section className="pdf-section min-h-[1120px] py-20 px-8" style={{ background: "hsl(220 30% 7%)" }}>
          <div className="max-w-5xl mx-auto">
            <SectionHeader icon={Building2} title="Agent Banking Network" subtitle="Extending financial services to every corner of the market" number="02" />
            <div className="grid md:grid-cols-4 gap-6 mt-12">
              {[
                { tier: "Super Agent", desc: "Regional oversight, float management, sub-agent recruitment, performance monitoring", color: "from-primary to-primary/60", count: "50+" },
                { tier: "Master Agent", desc: "District-level management, cash distribution, compliance enforcement, training delivery", color: "from-secondary to-accent", count: "500+" },
                { tier: "Agent", desc: "Cash-in/cash-out, customer registration, KYC collection, basic account services", color: "from-accent to-accent/60", count: "10,000+" },
                { tier: "Sub-Agent", desc: "Limited transactions, referral services, mobile top-up, bill collection", color: "from-muted to-muted/60", count: "40,000+" },
              ].map(t => (
                <div key={t.tier} className="glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-colors">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center mb-4`}>
                    <Users className="w-6 h-6 text-foreground" />
                  </div>
                  <h4 className="font-display font-bold text-foreground mb-1">{t.tier}</h4>
                  <p className="text-2xl font-bold text-primary mb-2">{t.count}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
                </div>
              ))}
            </div>

            {/* Agent features */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {[
                { icon: ArrowUpDown, title: "Cash-In / Cash-Out", items: ["OTP-verified transactions", "Real-time receipt generation", "Daily limit enforcement", "Multi-currency support"] },
                { icon: TrendingUp, title: "Float Management", items: ["AI-predicted float requirements", "Auto rebalance alerts", "Multi-source replenishment", "Real-time balance tracking"] },
                { icon: Award, title: "Commission Engine", items: ["Tiered commission structure", "Real-time earnings dashboard", "Monthly settlement cycles", "Performance bonus tiers"] },
              ].map(f => (
                <div key={f.title} className="glass rounded-2xl p-6 border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <f.icon className="w-5 h-5 text-primary" />
                    <h4 className="font-display font-bold text-foreground">{f.title}</h4>
                  </div>
                  <ul className="space-y-2">
                    {f.items.map(i => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-12">
              <BenefitCard title="Benefits to Agents" color="gold" items={[
                "Earn commissions on every transaction processed",
                "AI-powered float prediction prevents cash shortages",
                "Digital tools replace paper-based record keeping",
                "Performance-based tier upgrades increase earning potential",
                "Training and support via in-app academy",
              ]} />
              <BenefitCard title="Benefits to Service Provider" color="green" items={[
                "Extend banking reach to rural and underserved areas",
                "Lower cost-per-transaction vs branch banking by 80%",
                "Rapid geographic expansion without infrastructure investment",
                "Real-time agent monitoring and compliance enforcement",
                "Distributed cash management reduces vault requirements",
              ]} />
            </div>
          </div>
        </section>

        {/* ═══════ AI COPILOT ═══════ */}
        <div className="page-break" />
        <section className="pdf-section min-h-[1120px] py-20 px-8">
          <div className="max-w-5xl mx-auto">
            <SectionHeader icon={Brain} title="AI Copilot — Smart Assistant" subtitle="Intelligent automation across every layer of the platform" number="03" />
            <div className="grid md:grid-cols-2 gap-12 mt-12 items-center">
              <div className="space-y-6">
                {[
                  { icon: Bot, title: "Conversational Banking", desc: "Natural language transactions with multi-language support. Voice-first interface for accessibility and low-literacy users." },
                  { icon: Eye, title: "Fraud Detection Engine", desc: "Real-time anomaly detection using ML models trained on regional transaction patterns. 99.7% accuracy rate." },
                  { icon: Target, title: "Predictive Analytics", desc: "Churn prediction, revenue forecasting, agent performance scoring, and customer lifetime value modeling." },
                  { icon: Fingerprint, title: "Behavioral Biometrics", desc: "Continuous authentication via typing patterns, swipe gestures, and device usage patterns." },
                  { icon: Bell, title: "Smart Notifications", desc: "AI-timed nudges for bill reminders, savings opportunities, and personalized financial tips." },
                  { icon: FileCheck, title: "Automated Compliance", desc: "SAR narrative auto-generation, PEP screening, sanctions list monitoring, and regulatory report filing." },
                ].map(f => (
                  <FeatureRow key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
                ))}
              </div>
              <div className="flex justify-center">
                <img src={aiBrain} alt="AI Copilot" className="w-full max-w-sm drop-shadow-2xl" />
              </div>
            </div>

            <div className="mt-16 glass rounded-2xl p-8 border border-primary/20">
              <h4 className="font-display font-bold text-foreground text-lg mb-6 text-center">AI Feature Coverage by Stakeholder</h4>
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  { role: "Customer", count: 15, features: ["Spending insights", "Savings coach", "Bill reminders", "Fraud alerts", "Voice banking"] },
                  { role: "Agent", count: 12, features: ["Float prediction", "Customer scoring", "Route optimization", "Demand forecasting", "Performance tips"] },
                  { role: "Merchant", count: 10, features: ["Sales analytics", "Inventory hints", "Dynamic pricing", "Customer segments", "Promo engine"] },
                  { role: "Admin", count: 15, features: ["Anomaly detection", "Auto SAR filing", "Risk scoring", "Revenue forecast", "Network health"] },
                ].map(r => (
                  <div key={r.role} className="text-center">
                    <p className="text-3xl font-display font-bold text-primary mb-1">{r.count}</p>
                    <p className="text-sm font-semibold text-foreground mb-3">{r.role} AI Features</p>
                    <ul className="space-y-1.5">
                      {r.features.map(f => (
                        <li key={f} className="text-[11px] text-muted-foreground flex items-center gap-1.5 justify-center">
                          <Zap className="w-3 h-3 text-primary" />{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ ADMIN CONSOLE ═══════ */}
        <div className="page-break" />
        <section className="pdf-section min-h-[1120px] py-20 px-8" style={{ background: "hsl(220 30% 7%)" }}>
          <div className="max-w-5xl mx-auto">
            <SectionHeader icon={BarChart3} title="Enterprise Admin Console" subtitle="Complete operational command center for GlobalPay" number="04" />
            <div className="flex justify-center mt-8 mb-12">
              <img src={adminConsole} alt="Admin Console" className="w-full max-w-2xl drop-shadow-2xl" />
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                { icon: Users, title: "User Management", items: ["Customer lifecycle management", "Bulk account operations", "Role-based access control", "Activity audit trails"] },
                { icon: ArrowUpDown, title: "Transaction Monitoring", items: ["Real-time transaction feed", "Pattern-based flagging", "Manual review workflows", "Reversal & dispute handling"] },
                { icon: FileCheck, title: "KYC / AML Center", items: ["Document verification queue", "Tier upgrade approvals", "PEP & sanctions screening", "Risk-based categorization"] },
                { icon: Building2, title: "Agent Operations", items: ["Agent onboarding workflow", "Float allocation & limits", "Commission management", "Performance dashboards"] },
                { icon: Coins, title: "E-Money Management", items: ["Issuance & redemption", "Trust fund reconciliation", "Float monitoring", "Central bank reserve compliance"] },
                { icon: BarChart3, title: "Analytics & Reports", items: ["Custom report builder", "Scheduled exports (CSV/PDF)", "Regulatory filing automation", "Executive KPI dashboards"] },
                { icon: Shield, title: "Security Center", items: ["Threat monitoring dashboard", "IP & device allowlisting", "Maker-checker approvals", "Session management"] },
                { icon: Globe, title: "System Configuration", items: ["Fee structure management", "Transaction limit rules", "Notification templates", "API key management"] },
                { icon: Clock, title: "Audit & Compliance", items: ["Immutable audit logs", "Compliance calendar", "Regulatory report scheduler", "Evidence packaging"] },
              ].map(m => (
                <div key={m.title} className="glass rounded-2xl p-5 border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <m.icon className="w-4 h-4 text-primary" />
                    </div>
                    <h4 className="font-display font-bold text-foreground text-sm">{m.title}</h4>
                  </div>
                  <ul className="space-y-1.5">
                    {m.items.map(i => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                        <ChevronRight className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />{i}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ SECURITY & COMPLIANCE ═══════ */}
        <div className="page-break" />
        <section className="pdf-section min-h-[1120px] py-20 px-8">
          <div className="max-w-5xl mx-auto">
            <SectionHeader icon={ShieldCheck} title="Security & Regulatory Compliance" subtitle="Banking-grade security aligned with global regulatory standards" number="05" />
            <div className="grid md:grid-cols-2 gap-12 mt-12 items-center">
              <div className="flex justify-center">
                <img src={securityImg} alt="Security" className="w-64 drop-shadow-2xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Lock, title: "AES-256 Encryption", desc: "End-to-end encryption for all data at rest and in transit" },
                  { icon: Fingerprint, title: "Multi-Factor Auth", desc: "PIN + Biometric + OTP with adaptive risk-based step-up" },
                  { icon: Eye, title: "Real-Time Monitoring", desc: "24/7 SOC with automated threat detection & response" },
                  { icon: Shield, title: "PCI-DSS Level 1", desc: "Full compliance with payment card industry standards" },
                  { icon: FileCheck, title: "Regulatory Frameworks", desc: "Configurable compliance engine for any central bank directive" },
                  { icon: Network, title: "Zero Trust", desc: "Micro-segmented network with least-privilege access" },
                ].map(s => (
                  <div key={s.title} className="glass rounded-xl p-4 border border-border">
                    <s.icon className="w-5 h-5 text-primary mb-2" />
                    <h5 className="font-bold text-foreground text-xs mb-1">{s.title}</h5>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Workflow section */}
            <div className="mt-16">
              <h4 className="font-display font-bold text-foreground text-lg mb-8 text-center">Core Operational Workflows</h4>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { title: "Customer Onboarding", steps: ["Download app & enter phone", "OTP verification", "Basic KYC (name, ID)", "Selfie capture for liveness", "Wallet activated — KYC Tier 1", "Upgrade path to Tier 2/3 available"] },
                  { title: "P2P Money Transfer", steps: ["Select recipient (phone/QR/NFC)", "Enter amount & currency", "AI fraud check (<200ms)", "PIN/Biometric confirmation", "Real-time balance debit/credit", "Push notification to both parties"] },
                  { title: "Agent Cash-In", steps: ["Agent scans customer QR", "Enter deposit amount", "Customer confirms via OTP", "Agent float debited in real-time", "Customer wallet credited instantly", "Digital receipt to both parties"] },
                ].map(w => (
                  <div key={w.title} className="glass rounded-2xl p-6 border border-border">
                    <h5 className="font-display font-bold text-foreground text-sm mb-4">{w.title}</h5>
                    <ol className="space-y-3">
                      {w.steps.map((s, i) => (
                        <li key={i} className="flex items-start gap-3 text-xs text-muted-foreground">
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                          {s}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ TECHNICAL ARCHITECTURE ═══════ */}
        <div className="page-break" />
        <section className="pdf-section min-h-[1120px] py-20 px-8" style={{ background: "hsl(220 30% 7%)" }}>
          <div className="max-w-5xl mx-auto">
            <SectionHeader icon={Layers} title="Technical Architecture" subtitle="Cloud-native, microservices-based platform built for scale" number="06" />

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {[
                { title: "Frontend Layer", items: ["React 18 with TypeScript", "Progressive Web App (PWA)", "Offline-first with service workers", "Responsive + Native feel", "60fps animations", "< 150KB initial bundle"] },
                { title: "Backend Services", items: ["Microservices architecture", "Event-driven (Kafka/RabbitMQ)", "PostgreSQL + Redis caching", "GraphQL + REST APIs", "Auto-scaling containers", "Blue-green deployments"] },
                { title: "Infrastructure", items: ["Multi-region cloud deployment", "99.99% uptime SLA", "< 300ms P95 latency", "Real-time CDC replication", "Automated disaster recovery", "Infrastructure as Code (Terraform)"] },
              ].map(l => (
                <div key={l.title} className="glass rounded-2xl p-6 border border-primary/20">
                  <h4 className="font-display font-bold text-primary mb-4">{l.title}</h4>
                  <ul className="space-y-2.5">
                    {l.items.map(i => (
                      <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />{i}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Integration ecosystem */}
            <div className="mt-16 glass rounded-2xl p-8 border border-border">
              <h4 className="font-display font-bold text-foreground text-lg mb-8 text-center">Integration Ecosystem</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: "Core Banking", desc: "T24, Flexcube, Finacle, Temenos" },
                  { name: "Payment Switch", desc: "National switches, VISA, Mastercard" },
                  { name: "Telco APIs", desc: "Any MNO via GSMA standard APIs" },
                  { name: "Identity", desc: "National ID, Passport, eKYC providers" },
                  { name: "Credit Bureau", desc: "Local & international credit bureaus" },
                  { name: "Tax & Revenue", desc: "Government e-Tax gateways" },
                  { name: "Utilities", desc: "Electricity, water, internet providers" },
                  { name: "Insurance", desc: "Insurance aggregators & carriers" },
                ].map(i => (
                  <div key={i.name} className="text-center p-4 rounded-xl bg-muted/30 border border-border">
                    <p className="text-xs font-bold text-foreground mb-1">{i.name}</p>
                    <p className="text-[10px] text-muted-foreground">{i.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Database stats */}
            <div className="grid grid-cols-4 gap-6 mt-12">
              {[
                { n: "27", l: "Database Tables" },
                { n: "40+", l: "API Endpoints" },
                { n: "15+", l: "Microservices" },
                { n: "200+", l: "Requirement IDs" },
              ].map(s => (
                <div key={s.l} className="text-center glass rounded-2xl p-6 border border-border">
                  <p className="text-3xl font-display font-bold text-primary">{s.n}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ WHY GLOBALPAY ═══════ */}
        <div className="page-break" />
        <section className="pdf-section min-h-[1120px] py-20 px-8">
          <div className="max-w-5xl mx-auto">
            <SectionHeader icon={Star} title="Why GlobalPay?" subtitle="The competitive advantage for your financial institution" number="07" />

            <div className="grid md:grid-cols-2 gap-8 mt-12">
              {[
                { icon: Zap, title: "Speed to Market", desc: "Pre-built modules with configurable workflows allow launch in 12-16 weeks vs 12+ months for custom builds. Rapid iteration post-launch." },
                { icon: TrendingUp, title: "Revenue Multiplier", desc: "Transaction fees, micro-lending interest, merchant MDR, float interest, and data monetization create 5+ revenue streams from Day 1." },
                { icon: Globe, title: "Financial Inclusion", desc: "Agent network extends banking to millions of unbanked citizens. USSD fallback ensures feature phone compatibility across any market." },
                { icon: HeartHandshake, title: "Customer Stickiness", desc: "Gamified savings, loyalty rewards, and AI-personalized experiences drive 3.5x higher retention than competitors." },
                { icon: Landmark, title: "Regulatory Ready", desc: "Pre-mapped to central bank directives with automated compliance reporting. Reduces regulatory risk and audit preparation time by 70%." },
                { icon: Network, title: "Ecosystem Play", desc: "Open API architecture enables third-party integrations, creating a platform economy around GlobalPay." },
              ].map(v => (
                <div key={v.title} className="glass rounded-2xl p-6 border border-border flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <v.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-foreground mb-1">{v.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ROI Projections */}
            <div className="mt-16 glass rounded-2xl p-8 border border-primary/20">
              <h4 className="font-display font-bold text-foreground text-lg mb-8 text-center">Projected Impact — Year 1</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { metric: "2M+", label: "Active Wallets", sub: "Target within 12 months" },
                  { metric: "$500M+", label: "Transaction Volume", sub: "Monthly throughput" },
                  { metric: "$8M+", label: "Fee Revenue", sub: "Annual projection" },
                  { metric: "15,000+", label: "Active Agents", sub: "Nationwide coverage" },
                ].map(p => (
                  <div key={p.label} className="text-center">
                    <p className="text-2xl md:text-3xl font-display font-bold text-primary">{p.metric}</p>
                    <p className="text-sm font-semibold text-foreground mt-1">{p.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{p.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ CLOSING / CTA ═══════ */}
        <div className="page-break" />
        <section className="pdf-cover pdf-section min-h-[1120px] flex flex-col items-center justify-center py-20 px-8 relative" style={{ background: "hsl(220 35% 6%)" }}>
          <div className="absolute inset-0 opacity-15">
            <img src={heroBg} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="relative z-10 text-center max-w-2xl">
            <img src={techmonkLogo} alt="TechMonk" className="h-16 mx-auto mb-8" />
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-foreground mb-4">
              Ready to Transform
              <br />
              <span className="text-primary">Your Digital Finance?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-12">
              GlobalPay is more than a product — it's a platform for financial inclusion, powered by AI and built for scale in any market.
            </p>

            <div className="glass rounded-2xl p-8 border border-primary/20 mb-12">
              <h4 className="font-display font-bold text-foreground mb-6">Contact TechMonk</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-3 justify-center">
                  <Globe className="w-4 h-4 text-primary" />
                  <span>www.techmonk.io</span>
                </div>
                <div className="flex items-center gap-3 justify-center">
                  <Wallet className="w-4 h-4 text-primary" />
                  <span>solutions@techmonk.io</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 mb-8">
              <img src={techmonkLogo} alt="TechMonk" className="h-8" />
              <span className="text-muted-foreground">×</span>
              <img src={tesfaLogo} alt="GlobalPay" className="h-8 rounded" />
            </div>
            <p className="text-[10px] text-muted-foreground/50">
              CONFIDENTIAL — This document contains proprietary information of TechMonk Technologies.
              <br />
              © 2026 TechMonk Technologies Pvt. Ltd. All rights reserved.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

/* ── Reusable Components ── */

const SectionHeader = ({ icon: Icon, title, subtitle, number }: { icon: any; title: string; subtitle: string; number: string }) => (
  <div className="flex items-start gap-4">
    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
      <Icon className="w-7 h-7 text-primary" />
    </div>
    <div>
      <p className="text-[10px] font-bold text-primary tracking-widest uppercase mb-1">Section {number}</p>
      <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
    </div>
  </div>
);

const FeatureRow = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <div className="flex gap-3">
    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div>
      <h5 className="font-bold text-foreground text-sm">{title}</h5>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  </div>
);

const BenefitCard = ({ title, color, items }: { title: string; color: "gold" | "green"; items: string[] }) => (
  <div className={`rounded-2xl p-6 border ${color === "gold" ? "glass-gold border-primary/20" : "glass-green border-secondary/20"}`}>
    <h4 className={`font-display font-bold mb-4 ${color === "gold" ? "text-primary" : "text-secondary"}`}>{title}</h4>
    <ul className="space-y-2.5">
      {items.map(i => (
        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${color === "gold" ? "text-primary" : "text-secondary"}`} />
          {i}
        </li>
      ))}
    </ul>
  </div>
);

export default ProductShowcase;
