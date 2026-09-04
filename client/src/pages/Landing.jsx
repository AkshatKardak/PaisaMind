import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart2,
  BarChart3,
  Bot,
  Brain,
  Calculator,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  IndianRupee,
  Layers,
  Menu,
  MessageCircle,
  Percent,
  QrCode,
  Receipt,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sliders,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import ThemeToggle from "../components/ui/ThemeToggle";
import { formatINR } from "../utils/formatCurrency";

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [calcIncome, setCalcIncome] = useState(2400000);

  // Month calculation
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const currentMonthName = monthNames[new Date().getMonth()];

  // Interactive 44ADA Calculator preview
  const deemedProfit = Math.round(calcIncome * 0.5);
  const normalTax = Math.round(
    calcIncome > 1500000
      ? 150000 + (calcIncome - 1500000) * 0.3
      : calcIncome * 0.15
  );
  const adaTax = Math.round(
    deemedProfit > 1200000
      ? 60000 + (deemedProfit - 1200000) * 0.15
      : Math.max(0, (deemedProfit - 700000) * 0.1)
  );
  const estimatedSavings = Math.max(0, normalTax - adaTax);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070b14]/90 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo with NO word "PaisaMind", showing just the official logo image */}
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-9 w-auto object-contain" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
            <a href="#problems" className="hover:text-cyan-400 transition-colors">Problem</a>
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#tax-engine" className="hover:text-cyan-400 transition-colors">Tax</a>
            <a href="#comparison" className="hover:text-cyan-400 transition-colors">Comparison</a>
            <a href="#faq" className="hover:text-cyan-400 transition-colors">FAQ</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <span>Start For Free</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-[#0c1322] p-4 space-y-3 text-sm font-semibold">
            <a href="#problems" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-300">Problem</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-300">Features</a>
            <a href="#tax-engine" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-300">Tax</a>
            <a href="#comparison" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-300">Comparison</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-300">FAQ</a>
            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <Link to="/login" className="flex-1 py-2 text-center text-xs border border-slate-700 rounded-xl text-slate-200">Sign In</Link>
              <Link to="/register" className="flex-1 py-2 text-center text-xs bg-cyan-400 text-slate-950 rounded-xl font-bold">Start For Free</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero Section (Matching Exactly the Uploaded Cockpit Image) ── */}
      <section className="relative pt-12 pb-24 overflow-hidden border-b border-slate-800/60 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]">
        {/* Glow gradients */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[300px] bg-cyan-500/10 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* ── Left Column ── */}
            <div className="lg:col-span-6 space-y-6 text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0c1b2f] border border-cyan-500/30 text-[11px] font-semibold tracking-wide text-cyan-400 shadow-sm">
                <Sparkles size={13} className="text-cyan-400" />
                <span>AI-POWERED FINANCE OS INDIA</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-white leading-[1.1]">
                The financial <br />
                intelligence <br />
                platform built for <br />
                Indian freelancers.
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed font-normal">
                PaisaMind is an AI-powered finance platform for income tracking, Indian tax planning software, invoice automation, GST tracker alerts, cash flow forecasting, and smart financial intelligence in one calm dashboard.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/register"
                  className="px-7 py-3.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-sm shadow-xl shadow-cyan-500/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                  <span>Start For Free</span>
                  <ArrowRight size={15} />
                </Link>
                <a
                  href="#features"
                  className="px-6 py-3.5 rounded-2xl bg-[#0f172a] border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white font-semibold text-sm flex items-center gap-2 transition-all"
                >
                  <span>See Features</span>
                  <BarChart2 size={15} className="text-slate-400" />
                </a>
              </div>

              {/* Social Proof & Trust Avatars */}
              <div className="pt-4 flex items-center gap-4">
                <div className="flex -space-x-2 overflow-hidden">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600 text-white font-bold text-xs ring-2 ring-[#070b14]">A</span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs ring-2 ring-[#070b14]">R</span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white font-bold text-xs ring-2 ring-[#070b14]">S</span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-white font-bold text-xs ring-2 ring-[#070b14]">K</span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-pink-600 text-white font-bold text-xs ring-2 ring-[#070b14]">P</span>
                </div>
                <div className="text-xs text-slate-400">
                  <span className="text-slate-200 font-semibold">Trusted by 2,000+ freelancers, creators,</span> and small businesses.
                </div>
                <div className="pl-2 border-l border-slate-800 text-xs">
                  <span className="text-slate-400">Rated</span> <strong className="text-white font-bold">4.9/5</strong>
                </div>
              </div>
            </div>

            {/* ── Right Column: PaisaMind Cockpit Mockup ── */}
            <div className="lg:col-span-6 relative">
              {/* Custom CSS Keyframes for Cockpit Micro-Animations */}
              <style>{`
                @keyframes cockpitFloat {
                  0%, 100% { transform: translateY(0px); }
                  50% { transform: translateY(-7px); }
                }
                @keyframes cockpitFloatReverse {
                  0%, 100% { transform: translateY(0px); }
                  50% { transform: translateY(7px); }
                }
                @keyframes barPulse {
                  0%, 100% { opacity: 0.85; filter: brightness(1); }
                  50% { opacity: 1; filter: brightness(1.2); }
                }
                @keyframes shimmerGradient {
                  0% { background-position: 100% 0; }
                  100% { background-position: -100% 0; }
                }
                @keyframes spinSlow {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
                .animate-cockpit-float {
                  animation: cockpitFloat 4.5s ease-in-out infinite;
                }
                .animate-cockpit-float-rev {
                  animation: cockpitFloatReverse 5s ease-in-out infinite;
                }
                .animate-shimmer-bar {
                  background: linear-gradient(90deg, #f59e0b 0%, #fb923c 50%, #f59e0b 100%);
                  background-size: 200% 100%;
                  animation: shimmerGradient 3s linear infinite;
                }
              `}</style>

              {/* Floating Badge: Top Left Insight (Animated) */}
              <div className="absolute -top-4 -left-4 z-20 px-3.5 py-2 rounded-xl bg-[#09182d]/90 border border-cyan-500/40 text-cyan-300 text-xs shadow-xl backdrop-blur-md flex flex-col items-start animate-cockpit-float transition-all hover:scale-105">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-[9px] uppercase tracking-wider font-bold text-cyan-400">INSIGHT</span>
                </div>
                <span className="font-semibold text-[11px] text-white">Income increased 14% this month</span>
              </div>

              {/* Floating Badge: Bottom Right Reminder (Animated) */}
              <div className="absolute -bottom-3 -right-3 z-20 px-3.5 py-2 rounded-xl bg-[#231508]/90 border border-amber-600/40 text-amber-300 text-xs shadow-xl backdrop-blur-md flex flex-col items-start animate-cockpit-float-rev transition-all hover:scale-105">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[9px] uppercase tracking-wider font-bold text-amber-400">REMINDER</span>
                </div>
                <span className="font-semibold text-[11px] text-white">Quarterly tax due in 8 days</span>
              </div>

              {/* Main Cockpit Window Card */}
              <div className="rounded-3xl p-6 bg-[#0c1424] border border-slate-800 shadow-2xl space-y-4 text-left relative overflow-hidden transition-all hover:border-slate-700/80">
                {/* Subtle Ambient Back-Glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 blur-3xl pointer-events-none" />

                {/* Cockpit Window Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div>
                    <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                      PAISAMIND COCKPIT
                    </div>
                    <div className="text-lg font-bold font-display text-white flex items-center gap-2">
                      <span>{currentMonthName} finances</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  </div>
                  {/* Traffic Light Window Dots */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                </div>

                {/* Top Metrics Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#111c30] border border-slate-800 space-y-1 transition-all hover:border-cyan-500/30">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">PROFIT</div>
                    <div className="text-xl font-bold font-mono text-white">Rs. 5.14L</div>
                    <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <TrendingUp size={11} />
                      <span>+9% vs last month</span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#151c33] border border-indigo-500/20 space-y-1 transition-all hover:border-indigo-500/40">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">HEALTH</div>
                    <div className="text-xl font-bold font-mono text-indigo-300">82<span className="text-xs text-slate-400">/100</span></div>
                    <div className="text-[10px] text-indigo-400 font-semibold">Good &bull; Low Risk</div>
                  </div>
                </div>

                {/* Middle Row: Income Analytics & Expense Split */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Income Trend Bars */}
                  <div className="p-3.5 rounded-2xl bg-[#0f182a] border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-300">Income analytics</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400">Healthy</span>
                    </div>
                    <div className="text-[9px] text-slate-500">Six month trend</div>
                    {/* Visual Rounded Animated Bars */}
                    <div className="flex items-end justify-between h-14 pt-2 gap-1.5">
                      <div className="w-full bg-cyan-500/40 rounded-t h-[45%] transition-all duration-300 hover:h-[55%] hover:bg-cyan-400 cursor-pointer" />
                      <div className="w-full bg-cyan-500/60 rounded-t h-[60%] transition-all duration-300 hover:h-[70%] hover:bg-cyan-400 cursor-pointer" />
                      <div className="w-full bg-cyan-500/50 rounded-t h-[52%] transition-all duration-300 hover:h-[62%] hover:bg-cyan-400 cursor-pointer" />
                      <div className="w-full bg-cyan-500/75 rounded-t h-[78%] transition-all duration-300 hover:h-[88%] hover:bg-cyan-400 cursor-pointer" />
                      <div className="w-full bg-cyan-500/85 rounded-t h-[86%] transition-all duration-300 hover:h-[95%] hover:bg-cyan-400 cursor-pointer" />
                      <div className="w-full bg-cyan-400 rounded-t h-[100%] shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:brightness-125 cursor-pointer" />
                    </div>
                  </div>

                  {/* Expense Split Ring */}
                  <div className="p-3.5 rounded-2xl bg-[#0f182a] border border-slate-800 flex flex-col items-center justify-center text-center space-y-1 relative">
                    <span className="text-[11px] font-semibold text-slate-300 self-start">Expense split</span>
                    <div className="relative w-20 h-20 rounded-full border-4 border-cyan-400 border-t-purple-500 border-r-pink-500 flex flex-col items-center justify-center my-1 transition-transform hover:scale-105 duration-300">
                      <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">SPEND</span>
                      <span className="text-xs font-bold text-white font-mono">Rs. 1.9L</span>
                    </div>
                  </div>
                </div>

                {/* GST Threshold Progress */}
                <div className="p-3.5 rounded-2xl bg-[#0f182a] border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">GST threshold</span>
                    <span className="font-bold text-amber-400 font-mono">82%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="animate-shimmer-bar h-full rounded-full" style={{ width: "82%" }} />
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Rs. 16.4L used of Rs. 20L annual exemption threshold.
                  </div>
                </div>

                {/* AI Insight Cards */}
                <div className="p-3 rounded-2xl bg-[#11192b] border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-[11px]">
                    <Sparkles size={12} />
                    <span>AI insight cards</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#0a1120] text-slate-300 text-[11px] leading-relaxed">
                    Cash runway improved by 11 days after lower travel and tool spend.
                  </div>
                  <div className="p-2 rounded-xl bg-[#1c1219] text-rose-300 text-[11px] leading-relaxed">
                    Invoice PM-342 is overdue and affects {currentMonthName} cash flow.
                  </div>
                </div>

                {/* Transaction Activity List */}
                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Transaction activity</div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60 text-[11px]">
                    <div>
                      <div className="font-semibold text-white">Design retainer</div>
                      <div className="text-[9px] text-slate-400">Client paid</div>
                    </div>
                    <span className="text-emerald-400 font-mono font-bold">+ Rs. 75,000</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60 text-[11px]">
                    <div>
                      <div className="font-semibold text-white">Software tools</div>
                      <div className="text-[9px] text-slate-400">Recurring</div>
                    </div>
                    <span className="text-slate-300 font-mono">Rs. 6,200</span>
                  </div>
                  <div className="flex justify-between items-center py-1 text-[11px]">
                    <div>
                      <div className="font-semibold text-rose-300">Invoice PM-342</div>
                      <div className="text-[9px] text-rose-400/80">Overdue</div>
                    </div>
                    <span className="text-rose-400 font-mono font-bold">Rs. 25,000</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Problem Section ── */}
      <section id="problems" className="py-20 bg-[#090e1a] border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">The Problem</span>
            <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white">
              Why Freelance Finances Feel So Stressful
            </h2>
            <p className="text-sm text-slate-400">
              Traditional spreadsheets and heavy CA accounting tools weren't made for independent Indian operators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-3">
              <TrendingUp className="text-cyan-400" size={24} />
              <h3 className="font-bold text-sm text-white">Income arrives everywhere</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                UPI, clients, international transfers, and retainers land unpredictably without a neat monthly rhythm.
              </p>
            </div>
            <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-3">
              <Calculator className="text-amber-400" size={24} />
              <h3 className="font-bold text-sm text-white">Taxes stay unclear</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Section 44ADA vs New Regime, Advance Tax schedules, and GST ₹20L thresholds create last-minute panic.
              </p>
            </div>
            <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-3">
              <TrendingDown className="text-rose-400" size={24} />
              <h3 className="font-bold text-sm text-white">Subscriptions quietly leak</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cloud servers, design tools, and SaaS apps keep auto-debiting long after client projects wrap up.
              </p>
            </div>
            <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-3">
              <FileText className="text-indigo-400" size={24} />
              <h3 className="font-bold text-sm text-white">Invoices need chasing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Overdue payments distort cash runway and force uncomfortable follow-up conversations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Enhanced 4-Tier System Architecture Blueprint ── */}
      <section id="features" className="py-24 border-b border-slate-800/60 bg-[#070c17]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">System Architecture</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-white">
              Four-Tier Financial Intelligence Architecture
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              PaisaMind separates data ingestion, mathematical computation, AI tool orchestration, and financial execution into four deterministic layers. No hallucinated figures, no guesswork.
            </p>
          </div>

          {/* Architecture Flow Stack */}
          <div className="space-y-8">

            {/* Layer 1: Ingestion & Ledger */}
            <div className="p-8 rounded-3xl bg-[#0b1220] border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono font-bold text-sm">
                    01
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Layer 1: Multi-Source Data Ingestion & Ledger Pipeline</h3>
                    <p className="text-xs text-slate-400">Captures every rupee across bank statements, passbook scans, and client invoices</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[11px] font-mono font-semibold w-fit">
                  ETL & OCR Engine
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                    <FileSpreadsheet size={16} />
                    <span>Bank Statement Parser</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Auto-ingests CSV, Excel, and text-based PDFs from HDFC, ICICI, SBI, and Axis with heuristic column detection.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                    <Brain size={16} />
                    <span>Vision OCR Pipeline</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Processes photographed physical passbooks and scanned receipts via Groq Vision when zero selectable text is found.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <QrCode size={16} />
                    <span>Zero-Fee UPI Invoicing</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Generates native UPI intent QR codes on invoices for instant zero-deduction transfers directly into your bank account.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                    <Receipt size={16} />
                    <span>Form 26AS TDS Ledger</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Reconciles Section 194J and 194C client tax deductions to ensure no withholding credit goes unclaimed.
                  </p>
                </div>
              </div>
            </div>

            {/* Layer 2: Deterministic Calculation Engines */}
            <div className="p-8 rounded-3xl bg-[#0b1220] border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono font-bold text-sm">
                    02
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Layer 2: Deterministic Financial Intelligence Engines</h3>
                    <p className="text-xs text-slate-400">Pure server-side algorithms governed by Indian tax law and financial mathematics</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-mono font-semibold w-fit">
                  Zero Hallucination
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <Calculator size={16} />
                    <span>Section 44ADA Optimizer</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Evaluates the 50% presumptive profit rule against the New Tax Regime, computing exact advance tax schedules.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                    <BarChart3 size={16} />
                    <span>95% Runway Forecaster</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Calculates historical burn rate, baseline recurring costs, and project payment timing to project business runway.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
                    <Target size={16} />
                    <span>Scope Creep Sentinel</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Monitors project unit economics, alerting whenever client revisions cause effective hourly earnings to crater.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                    <ShieldCheck size={16} />
                    <span>Z-Score Anomaly Filter</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Flags double-charged vendor transactions, unexpected price hikes on tools, and statistically unusual spending spikes.
                  </p>
                </div>
              </div>
            </div>

            {/* Layer 3 & Layer 4 Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Layer 3: AI Copilot Orchestration */}
              <div className="p-8 rounded-3xl bg-[#0b1220] border border-slate-800 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-mono font-bold text-sm">
                      03
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Layer 3: AI Copilot Orchestration</h3>
                      <p className="text-[11px] text-slate-400">Groq LLaMA-3.3 with 20 Verified Tool Engines</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-mono font-bold">
                    Tool Calling
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Instead of generating free-form numbers, the LLM acts as an orchestrator. When you ask "Can I afford a laptop?", it executes verified backend calculation tools to check your bank balances, projected runway, and tax liabilities before formulating advice.
                </p>

                <div className="p-3.5 rounded-2xl bg-[#070b14] border border-slate-800/80 font-mono text-[11px] text-indigo-300 space-y-1">
                  <div>&gt; verifyAffordability(item: "MacBook", cost: 75000)</div>
                  <div className="text-emerald-400">&gt; calculateRunway(postPurchaseBuffer: 3.4 months)</div>
                  <div className="text-cyan-400">&gt; verdict: "Affordable with 3+ months runway preserved"</div>
                </div>
              </div>

              {/* Layer 4: Action & Execution */}
              <div className="p-8 rounded-3xl bg-[#0b1220] border border-slate-800 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-mono font-bold text-sm">
                      04
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Layer 4: Execution & Recovery Automation</h3>
                      <p className="text-[11px] text-slate-400">Turns financial data into immediate actions</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-mono font-bold">
                    Automations
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  PaisaMind converts financial insights directly into tangible steps: 3-stage WhatsApp reminder drafts for overdue invoices, print-ready CA audit statements, and automated background health monitoring keep-alives.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800/80 text-xs space-y-1">
                    <div className="font-bold text-white">WhatsApp Recovery</div>
                    <p className="text-[10px] text-slate-400">Gentle, Firm, and Final legal follow-up drafts with 1-click delivery.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800/80 text-xs space-y-1">
                    <div className="font-bold text-white">Clean PDF Exports</div>
                    <p className="text-[10px] text-slate-400">Monochrome, print-friendly monthly statements ready for your CA.</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ── Interactive 44ADA Calculator Section ── */}
      <section id="tax-engine" className="py-20 bg-[#090e1a] border-b border-slate-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Indian Taxation</span>
            <h2 className="text-3xl font-black font-display text-white">
              Interactive Section 44ADA Savings Preview
            </h2>
            <p className="text-xs text-slate-400">
              Indian freelancers under ₹75L gross receipts can legally declare 50% profits without maintaining extensive books.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-[#0c1424] border border-slate-800 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Annual Gross Freelance Receipts:</span>
                <span className="text-cyan-400 font-bold font-mono text-sm">{formatINR(calcIncome)}</span>
              </div>
              <input
                type="range"
                min={600000}
                max={7500000}
                step={100000}
                value={calcIncome}
                onChange={(e) => setCalcIncome(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Deemed Profit (50%)</div>
                <div className="text-base font-bold font-mono text-white">{formatINR(deemedProfit)}</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Tax under Sec 44ADA</div>
                <div className="text-base font-bold font-mono text-cyan-400">{formatINR(adaTax)}</div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-1">
                <div className="text-[10px] text-emerald-400 uppercase font-bold">Estimated Legal Savings</div>
                <div className="text-xl font-black font-mono text-emerald-400">{formatINR(estimatedSavings)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section id="comparison" className="py-20 border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">The Edge</span>
            <h2 className="text-3xl font-black font-display text-white">Why PaisaMind Outperforms Alternatives</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs bg-[#0c1424] rounded-3xl border border-slate-800 overflow-hidden">
              <thead>
                <tr className="border-b border-slate-800 text-slate-200">
                  <th className="p-4 sm:p-5">Capability</th>
                  <th className="p-4 sm:p-5 text-cyan-400 font-extrabold text-sm">PaisaMind</th>
                  <th className="p-4 sm:p-5 text-slate-400">Excel / Google Sheets</th>
                  <th className="p-4 sm:p-5 text-slate-400">Traditional Software</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="p-4 sm:p-5 font-semibold">Indian Section 44ADA Presumptive Tax</td>
                  <td className="p-4 sm:p-5 text-emerald-400 font-bold">Automated & Optimized</td>
                  <td className="p-4 sm:p-5 text-slate-400">Manual formulas</td>
                  <td className="p-4 sm:p-5 text-amber-400">Requires manual CA setup</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold">Grounded AI Copilot with Tool Calling</td>
                  <td className="p-4 sm:p-5 text-emerald-400 font-bold">20 Deterministic Engines</td>
                  <td className="p-4 sm:p-5 text-slate-400">None</td>
                  <td className="p-4 sm:p-5 text-slate-400">None / Hallucinating chat</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold">Zero-Fee UPI QR Code Invoices</td>
                  <td className="p-4 sm:p-5 text-emerald-400 font-bold">Instant GPay / PhonePe (0%)</td>
                  <td className="p-4 sm:p-5 text-slate-400">None</td>
                  <td className="p-4 sm:p-5 text-amber-400">Gateway fee cuts (2-3%)</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold">Real Effective Hourly Rate & Scope Creep</td>
                  <td className="p-4 sm:p-5 text-emerald-400 font-bold">Automated Sentinel</td>
                  <td className="p-4 sm:p-5 text-slate-400">Manual tracking</td>
                  <td className="p-4 sm:p-5 text-slate-400">Not supported</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section id="faq" className="py-20 bg-[#090e1a] border-b border-slate-800/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black font-display text-white">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-400">Clear answers on taxation, tool calling, and security.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-sm text-white">Can any freelancer use Section 44ADA?</h4>
              <p className="text-slate-400 leading-relaxed">
                Eligible professions include software development, UI/UX design, IT consulting, writing, legal, medical, accounting, and technical consulting with gross receipts under ₹75 Lakhs per financial year.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-sm text-white">Does the AI Copilot ever make up financial numbers?</h4>
              <p className="text-slate-400 leading-relaxed">
                Never. The LLM acts solely as an orchestrator that calls backend verification tools. All balances, runway predictions, tax brackets, and debt ratios are calculated by deterministic JavaScript engines.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-sm text-white">Are UPI QR Code payments really zero-fee?</h4>
              <p className="text-slate-400 leading-relaxed">
                Yes. PaisaMind creates standard `upi://pay` intent QR codes. Clients scan and transfer funds directly into your verified bank account without payment gateway deductions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Call To Action ── */}
      <section className="py-20 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-black font-display text-white">
          Ready for Calm Financial Clarity?
        </h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Start tracking income, optimizing taxes, and forecasting cash runway in minutes.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95"
        >
          <span>Launch Your Workspace</span>
          <ArrowRight size={16} />
        </Link>
      </section>

      {/* ── Comprehensive Enterprise Footer ── */}
      <footer className="pt-16 pb-12 border-t border-slate-800/80 bg-[#060a12] text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            
            {/* Column 1: Brand & Identity */}
            <div className="lg:col-span-2 space-y-4">
              <Link to="/" className="inline-block">
                <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
              </Link>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                The financial intelligence operating system engineered for Indian freelancers, consultants, and independent agencies. Combining deterministic tax computation with grounded AI decision support.
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-mono">
                <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-cyan-400">
                  Section 44ADA Ready
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-emerald-400">
                  0% Gateway Fees
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-indigo-400">
                  Grounded AI Tools
                </span>
              </div>
            </div>

            {/* Column 2: Platform Modules */}
            <div className="space-y-3">
              <div className="font-bold text-white text-xs uppercase tracking-wider">Platform Modules</div>
              <ul className="space-y-2 text-xs">
                <li><a href="#features" className="hover:text-cyan-400 transition-colors">Four-Tier Architecture</a></li>
                <li><a href="#tax-engine" className="hover:text-cyan-400 transition-colors">Section 44ADA Optimizer</a></li>
                <li><a href="#comparison" className="hover:text-cyan-400 transition-colors">PaisaMind vs Traditional</a></li>
                <li><a href="#problems" className="hover:text-cyan-400 transition-colors">Freelance Financial Pains</a></li>
                <li><a href="#faq" className="hover:text-cyan-400 transition-colors">Tax & Tool FAQ</a></li>
              </ul>
            </div>

            {/* Column 3: Indian Tax Framework */}
            <div className="space-y-3">
              <div className="font-bold text-white text-xs uppercase tracking-wider">Tax & Compliance</div>
              <ul className="space-y-2 text-xs">
                <li><span className="text-slate-300">Section 44ADA:</span> 50% Deemed Profit</li>
                <li><span className="text-slate-300">Section 194J:</span> Professional TDS (10%/2%)</li>
                <li><span className="text-slate-300">Section 194C:</span> Contractor TDS (1%)</li>
                <li><span className="text-slate-300">GST Exemption:</span> Rs. 20 Lakh Threshold</li>
                <li><span className="text-slate-300">Advance Tax:</span> 15th Jun / Sep / Dec / Mar</li>
              </ul>
            </div>

            {/* Column 4: Regulatory Disclaimer */}
            <div className="space-y-3">
              <div className="font-bold text-white text-xs uppercase tracking-wider">Statutory Notice</div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                PaisaMind is an analytical productivity software platform built according to the provisions of the Indian Income-tax Act, 1961. Content and mathematical tools are provided for financial planning and decision support. For statutory tax return submissions, consult your certified Chartered Accountant.
              </p>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} PaisaMind Platform. Built for Indian Freelancers & Small Businesses.
            </div>
            <div className="flex items-center gap-6">
              <Link to="/login" className="hover:text-slate-300 transition-colors">Sign In</Link>
              <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">Start Free Workspace</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
