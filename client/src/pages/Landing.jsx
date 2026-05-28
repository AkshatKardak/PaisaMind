import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  Brain,
  Calculator,
  CheckCircle,
  CreditCard,
  FileText,
  Globe,
  IndianRupee,
  Lightbulb,
  Menu,
  Shield,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
  UserPlus,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/ui/ThemeToggle";

/* ─────────── DATA ─────────── */

const featureCards = [
  { icon: TrendingUp,   title: "Income Tracker",      sub: "Multi-source revenue",     color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
  { icon: TrendingDown, title: "Expense Control",      sub: "Smart categorisation",    color: "text-red-400 bg-red-500/10 border-red-500/20" },
  { icon: FileText,     title: "Invoice Generator",   sub: "GST-ready PDFs",          color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { icon: CreditCard,   title: "Online Payments",     sub: "Razorpay integrated",     color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { icon: Calculator,   title: "Tax Planner",         sub: "Old vs New regime",       color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  { icon: Target,       title: "Goal Tracker",        sub: "Milestone savings",       color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  { icon: Brain,        title: "AI Reports",          sub: "Groq llama-3 powered",    color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  { icon: Bell,         title: "Smart Alerts",        sub: "Tax + invoice nudges",    color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
];

const testimonials = [
  { name: "Priya Sharma",  role: "UI/UX Freelancer, Pune",      avatar: "PS", color: "bg-sky-500",     quote: "Finally replaced 3 spreadsheets. The GST tracker alone is worth it." },
  { name: "Rohan Mehta",   role: "Full-stack Developer, Bengaluru", avatar: "RM", color: "bg-violet-500", quote: "The AI insights caught that I was undercharging by ₹40k/month. Game changer." },
  { name: "Anjali Singh",  role: "Content Strategist, Mumbai",  avatar: "AS", color: "bg-emerald-500", quote: "Invoice automation + Razorpay means I get paid 3x faster now." },
];

const steps = [
  { n: "01", icon: UserPlus, title: "Create your account", body: "Sign up free. Set your tax regime, PAN & GST preferences in Settings.", color: "bg-sky-500/10 text-sky-400 border-sky-500/25" },
  { n: "02", icon: Upload,   title: "Log income & expenses", body: "Add transactions. We auto-categorise and build your live dashboard.", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" },
  { n: "03", icon: Bot,      title: "Get AI-powered clarity", body: "Health score, tax estimate, invoice reminders and smart savings tips.", color: "bg-violet-500/10 text-violet-400 border-violet-500/25" },
];

const trustLogos = ["React", "Node.js", "MongoDB", "Groq AI", "Razorpay", "Resend", "Tailwind", "Express"];

/* ─────────── ANIMATED CHART BARS ─────────── */
function ChartBars({ data, color = "#0EA5E9" }) {
  return (
    <div className="flex h-[72px] items-end gap-[5px]">
      {data.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-[3px]"
          style={{
            height: `${h}%`,
            background: color,
            opacity: 0.7 + i * 0.04,
            animation: `growBarLanding 0.6s ease ${i * 0.08}s both`,
          }}
        />
      ))}
    </div>
  );
}

/* ─────────── FLOATING DASHBOARD MOCKUP ─────────── */
function DashboardMockup() {
  return (
    <div className="relative w-full select-none">
      {/* glow halo */}
      <div className="pointer-events-none absolute inset-[-8%] rounded-[40px] bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.18),transparent_70%)] blur-2xl" />

      {/* main card */}
      <div
        className="relative z-10 overflow-hidden rounded-[20px] border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.5)]"
        style={{ background: "rgba(17,24,39,0.92)", backdropFilter: "blur(20px)" }}
      >
        {/* window chrome */}
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
            <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
            <span className="h-3 w-3 rounded-full bg-[#28C840]" />
          </div>
          <span className="text-[11px] text-slate-500">paisamind.app/dashboard</span>
          <div className="h-3 w-16 rounded-full bg-white/5" />
        </div>

        <div className="p-5">
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Income",  value: "₹1,24,500", change: "+12.4%", up: true,  color: "text-sky-400" },
              { label: "Profit",  value: "₹68,200",   change: "+8.6%",  up: true,  color: "text-emerald-400" },
              { label: "Score",   value: "82 / 100",  change: "+5pts",  up: true,  color: "text-violet-400" },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <div className="text-[10px] uppercase tracking-widest text-slate-500">{kpi.label}</div>
                <div className={`mt-1 text-[15px] font-bold ${kpi.color}`}>{kpi.value}</div>
                <div className={`mt-0.5 text-[10px] ${kpi.up ? "text-emerald-400" : "text-red-400"}`}>{kpi.change}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-5 gap-3 mb-4">
            <div className="col-span-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">6-Month Cash Flow</div>
              <ChartBars data={[38, 55, 42, 68, 52, 74]} color="#0EA5E9" />
              <ChartBars data={[22, 30, 28, 40, 35, 38]} color="#EF4444" />
            </div>
            <div className="col-span-2 rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">Expenses</div>
              <div className="space-y-2 mt-3">
                {[["Software", 42, "bg-violet-500"], ["Travel", 28, "bg-sky-500"], ["Food", 18, "bg-amber-500"], ["Other", 12, "bg-slate-500"]].map(([cat, w, cls]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-[9px] text-slate-500 mb-0.5">
                      <span>{cat}</span><span>{w}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5">
                      <div className={`h-1.5 rounded-full ${cls}`} style={{ width: `${w}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI insight */}
          <div className="mb-3 flex items-start gap-3 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
            <Sparkles size={13} className="mt-0.5 shrink-0 text-violet-400" />
            <span className="text-[11px] leading-5 text-violet-200">
              You overspent ₹8,200 on Software this month. Switch to annual billing to save ₹14,400/yr.
            </span>
          </div>

          {/* Overdue invoice */}
          <div className="flex items-center justify-between rounded-xl border border-red-500/15 bg-red-500/5 px-4 py-3">
            <div>
              <div className="text-[11px] font-semibold text-slate-200">Acme Corp · INV-042</div>
              <div className="text-[11px] font-bold text-red-400">₹45,000 overdue</div>
            </div>
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400 animate-pulse">
              Overdue
            </span>
          </div>
        </div>
      </div>

      {/* Floating notification chip */}
      <div
        className="absolute -right-4 top-[15%] z-20 flex items-center gap-2 rounded-2xl border border-emerald-500/25 px-4 py-2.5 shadow-xl"
        style={{ background: "rgba(17,24,39,0.92)", backdropFilter: "blur(16px)", animation: "floatChip 4s ease-in-out infinite" }}
      >
        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-semibold text-emerald-300">₹28,000 received</span>
      </div>

      {/* Floating tax chip */}
      <div
        className="absolute -left-4 bottom-[20%] z-20 flex items-center gap-2 rounded-2xl border border-amber-500/25 px-4 py-2.5 shadow-xl"
        style={{ background: "rgba(17,24,39,0.92)", backdropFilter: "blur(16px)", animation: "floatChip 5s ease-in-out 1s infinite" }}
      >
        <span className="text-xs">⚠️</span>
        <span className="text-xs font-semibold text-amber-300">GST at 82%</span>
      </div>
    </div>
  );
}

/* ─────────── FEATURE BENTO SECTION ─────────── */
function FeatureBento() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {featureCards.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className={`group cursor-default rounded-2xl border bg-[var(--bg-card)] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_28px_rgba(14,165,233,0.12)] ${item.color.split(" ").find(c => c.startsWith("border"))}`}
          >
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl border ${item.color}`}>
              <Icon size={20} />
            </div>
            <div className="text-sm font-bold text-[var(--text-primary)]">{item.title}</div>
            <div className="mt-1 text-xs text-[var(--text-secondary)]">{item.sub}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────── MAIN COMPONENT ─────────── */
function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    /* Scroll reveal */
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    /* Navbar scroll shadow */
    const nav = document.getElementById("lp-navbar");
    const onScroll = () => {
      if (!nav) return;
      nav.classList.toggle("lp-nav-scrolled", window.scrollY > 60);
    };
    window.addEventListener("scroll", onScroll);
    onScroll();

    /* Parallax orbs */
    const onMouseMove = (e) => {
      const orbs = document.querySelectorAll(".parallax-orb");
      orbs.forEach((orb, i) => {
        const speed = (i + 1) * 0.012;
        const x = (e.clientX - window.innerWidth / 2) * speed;
        const y = (e.clientY - window.innerHeight / 2) * speed;
        orb.style.transform = `translate(${x}px, ${y}px)`;
      });
    };
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <div className="lp-root overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">

      {/* ── NAVBAR ── */}
      <header id="lp-navbar" className="lp-navbar fixed left-0 right-0 top-0 z-50 h-16">
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="PaisaMind" width={32} height={32} className="rounded-xl" />
            <div className="leading-none">
              <div className="font-display text-[18px] font-bold tracking-tight">PaisaMind</div>
              <div className="text-[10px] text-slate-500">Finance OS for Freelancers</div>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 text-sm text-[var(--text-secondary)] md:flex">
            {["Features", "How it works", "Pricing"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} className="transition hover:text-[var(--text-primary)]">{item}</a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login" className="hidden rounded-xl border border-[var(--border)] px-5 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-sky-500/50 hover:text-[var(--text-primary)] md:block">
              Sign In
            </Link>
            <Link to="/register" className="lp-cta-btn rounded-xl px-5 py-2 text-sm font-bold text-white">
              Get Started →
            </Link>
            <button className="ml-1 text-[var(--text-secondary)] md:hidden" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-[var(--bg-card)] p-6 md:hidden">
          <div className="mb-8 flex items-center justify-between">
            <span className="font-display text-xl font-bold">PaisaMind</span>
            <button onClick={() => setMobileMenuOpen(false)}><X size={24} /></button>
          </div>
          <div className="space-y-5 text-lg font-medium">
            {["Features", "How it works", "Pricing"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} className="block text-[var(--text-secondary)]" onClick={() => setMobileMenuOpen(false)}>{item}</a>
            ))}
          </div>
          <div className="mt-auto space-y-3">
            <Link to="/login" className="block w-full rounded-xl border border-[var(--border)] py-3 text-center font-semibold" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
            <Link to="/register" className="lp-cta-btn block w-full rounded-xl py-3 text-center font-bold text-white" onClick={() => setMobileMenuOpen(false)}>Get Started Free →</Link>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section ref={heroRef} className="lp-hero relative min-h-screen overflow-hidden px-5 pb-20 pt-28">
        {/* Background orbs */}
        <div className="parallax-orb orb orb-blue transition-transform duration-300 ease-out" />
        <div className="parallax-orb orb orb-purple transition-transform duration-300 ease-out" />
        <div className="lp-grid-overlay pointer-events-none absolute inset-0 z-0" />
        {/* light streaks */}
        <div className="pointer-events-none absolute left-1/4 top-0 h-[400px] w-[1px] bg-gradient-to-b from-sky-500/20 via-sky-500/5 to-transparent" />
        <div className="pointer-events-none absolute right-1/3 top-0 h-[300px] w-[1px] bg-gradient-to-b from-violet-500/15 via-violet-500/5 to-transparent" />

        <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col items-center gap-16 lg:flex-row lg:items-center lg:gap-12">

          {/* LEFT: copy */}
          <div className="w-full lg:w-[52%]">
            <div className="mb-6 inline-flex animate-[fadeSlideUp_0.6s_ease_both] items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/8 px-4 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-400">AI-Powered Finance OS · India</span>
            </div>

            <h1 className="animate-[fadeSlideUp_0.7s_ease_0.1s_both] font-display text-[clamp(38px,5.5vw,76px)] font-extrabold leading-[1.04] tracking-tight text-[var(--text-primary)]">
              The financial{" "}
              <span className="lp-highlight">intelligence</span>
              <br />platform built for
              <br />
              <span className="lp-gradient-text">Indian freelancers.</span>
            </h1>

            <p className="animate-[fadeSlideUp_0.7s_ease_0.25s_both] mt-6 max-w-[520px] text-[17px] leading-[1.75] text-[var(--text-secondary)]">
              Track every rupee, automate GST alerts, generate invoices, and let Groq AI surface insights
              your CA would charge ₹5,000/month to tell you.
            </p>

            <div className="animate-[fadeSlideUp_0.7s_ease_0.4s_both] mt-10 flex flex-wrap gap-4">
              <Link to="/register" className="lp-cta-btn-lg group flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-bold text-white">
                Start for Free
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#features" className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-8 py-4 text-base font-semibold text-[var(--text-secondary)] transition-all hover:border-sky-500/30 hover:text-[var(--text-primary)]">
                <Zap size={16} className="text-amber-400" />
                See features
              </a>
            </div>

            {/* Social proof */}
            <div className="animate-[fadeSlideUp_0.7s_ease_0.55s_both] mt-10 flex flex-wrap items-center gap-4">
              <div className="flex items-center">
                {["A", "R", "S", "K", "P"].map((v, i) => (
                  <span key={v} className={`-ml-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--bg-primary)] text-xs font-bold text-white first:ml-0 ${["bg-sky-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-pink-500"][i]}`}>{v}</span>
                ))}
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">Trusted by 2,000+ freelancers</div>
                <div className="flex items-center gap-1 text-xs text-amber-400">★★★★★ <span className="text-[var(--text-secondary)]">4.9 / 5 rating</span></div>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-1.5">
                <Shield size={12} className="text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">Free forever plan</span>
              </div>
            </div>
          </div>

          {/* RIGHT: dashboard mockup */}
          <div className="w-full animate-[float_8s_ease-in-out_infinite] lg:w-[48%]">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <div className="border-y border-[var(--border)] bg-[var(--bg-card)]">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 divide-x divide-[var(--border)] md:grid-cols-4">
          {[
            ["₹2.4 Cr+", "Income tracked"],
            ["18,000+", "Invoices generated"],
            ["94%", "On-time tax alerts"],
            ["4.9 ★", "Average user rating"],
          ].map(([num, label], i) => (
            <div key={num} className={`px-8 py-8 text-center ${i % 2 === 0 && i > 1 ? "border-t border-[var(--border)] md:border-t-0" : ""}`}>
              <div className="font-display text-3xl font-extrabold text-[var(--text-primary)]">{num}</div>
              <div className="mt-1 text-sm text-[var(--text-secondary)]">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES DEEP DIVES ── */}
      <section id="features" className="bg-[var(--bg-primary)] py-32">
        <div className="mx-auto max-w-[1200px] px-5">

          {/* Section header */}
          <div className="reveal mb-24 text-center">
            <div className="lp-section-label">Built for the way you work</div>
            <h2 className="mx-auto mt-4 max-w-[640px] font-display text-[clamp(32px,4vw,52px)] font-extrabold leading-tight">
              Everything a freelancer's finances actually need.
            </h2>
            <p className="mt-5 text-lg text-[var(--text-secondary)]">No accountant. No confusing software. Just clarity.</p>
          </div>

          {/* ─ Feature 1: Health Score ─ */}
          <div className="reveal mb-28 flex flex-col items-center gap-12 lg:flex-row">
            <div className="w-full lg:w-[55%]">
              <div className="lp-feature-badge border-emerald-500/25 bg-emerald-500/8 text-emerald-400">Financial Health</div>
              <h3 className="mt-4 font-display text-3xl font-bold">Know your score before your CA does.</h3>
              <p className="mt-4 max-w-[520px] text-base leading-7 text-[var(--text-secondary)]">
                A real-time 0–100 Financial Health Score across savings ratio, expense control, income stability, and invoice collection rate.
              </p>
              <div className="mt-8 space-y-4">
                {[["Savings Ratio", 78, "bg-emerald-500"], ["Expense Control", 62, "bg-amber-500"], ["Income Stability", 55, "bg-amber-500"], ["Invoice Collection", 90, "bg-emerald-500"]].map(([label, pct, cls]) => (
                  <div key={label}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">{label}</span>
                      <span className="font-semibold text-[var(--text-primary)]">{pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                      <div className={`h-2 rounded-full ${cls} transition-all duration-1000`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full lg:w-[45%]">
              <div className="lp-feature-card group">
                <div className="mx-auto max-w-[200px]">
                  <svg viewBox="0 0 200 110" className="w-full">
                    <path d="M16 100 A84 84 0 0 1 184 100" stroke="var(--bg-elevated)" strokeWidth="16" fill="none" strokeLinecap="round" />
                    <path d="M16 100 A84 84 0 0 1 155 38" stroke="#0EA5E9" strokeWidth="16" fill="none" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="mt-1 text-center">
                  <div className="font-display text-7xl font-black text-[var(--text-primary)]">82</div>
                  <div className="mt-1 text-sm font-bold uppercase tracking-[0.25em] text-sky-400">Great</div>
                </div>
                <div className="mt-5 grid grid-cols-4 gap-2">
                  {[["Savings", "#10B981"], ["Expenses", "#F59E0B"], ["Income", "#F59E0B"], ["Invoices", "#10B981"]].map(([l, c]) => (
                    <div key={l} className="text-center">
                      <div className="mx-auto h-1.5 w-full rounded-full" style={{ background: c, opacity: 0.6 }} />
                      <div className="mt-1 text-[9px] text-[var(--text-secondary)]">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ─ Feature 2: Tax Intelligence ─ */}
          <div className="reveal mb-28 flex flex-col-reverse items-center gap-12 lg:flex-row-reverse">
            <div className="w-full lg:w-[55%]">
              <div className="lp-feature-badge border-amber-500/25 bg-amber-500/8 text-amber-400">Tax Intelligence</div>
              <h3 className="mt-4 font-display text-3xl font-bold">GST alerts. Advance tax. Regime comparison.</h3>
              <p className="mt-4 text-base leading-7 text-[var(--text-secondary)]">
                Built ground-up for Indian freelancers — with real-time GST threshold tracking, quarterly advance tax reminders, and a side-by-side regime calculator.
              </p>
              <div className="mt-6 space-y-3">
                {["Real-time GST threshold tracker with colour-coded alerts", "Old vs New regime tax comparison with savings delta", "Quarterly advance tax schedule with deadline countdown", "AI-powered tax-saving instrument recommendations"].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                    <CheckCircle size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full lg:w-[45%]">
              <div className="lp-feature-card">
                <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">GST Threshold</div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                  <div className="h-3 w-[82%] rounded-full bg-gradient-to-r from-amber-500 to-red-500" />
                </div>
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">₹16,40,000 of ₹20,00,000</span>
                  <span className="font-bold text-amber-400">82% ⚠️</span>
                </div>
                <div className="my-5 border-t border-[var(--border)]" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                    <div className="text-xs text-[var(--text-secondary)]">Old Regime</div>
                    <div className="mt-2 text-2xl font-black text-[var(--text-primary)]">₹1,24,800</div>
                    <div className="text-xs text-[var(--text-secondary)]">tax payable</div>
                  </div>
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-4">
                    <div className="text-xs font-semibold text-emerald-400">New Regime ✓</div>
                    <div className="mt-2 text-2xl font-black text-emerald-400">₹94,200</div>
                    <div className="text-xs text-emerald-600">Save ₹30,600</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─ Feature 3: AI Co-pilot ─ */}
          <div className="reveal flex flex-col items-center gap-12 lg:flex-row">
            <div className="w-full lg:w-[55%]">
              <div className="lp-feature-badge border-violet-500/25 bg-violet-500/8 text-violet-400">AI Co-pilot</div>
              <h3 className="mt-4 font-display text-3xl font-bold">Your AI finance co-pilot, on demand.</h3>
              <p className="mt-4 text-base leading-7 text-[var(--text-secondary)]">
                Powered by Groq's llama-3.3-70b — the fastest inference engine on the planet. PaisaMind reads your data and delivers plain-English insights, monthly reports, and AI-drafted invoice reminders in seconds.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  { text: "Food spending is up 34% from last month", type: "warn" },
                  { text: "Income dropped below your 3-month average", type: "danger" },
                  { text: "₹45,000 in invoices are overdue — send reminder?", type: "danger" },
                ].map((item) => (
                  <div key={item.text} className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${item.type === "danger" ? "border-red-500/15 bg-red-500/5 text-red-300" : "border-amber-500/15 bg-amber-500/5 text-amber-300"}`}>
                    <Lightbulb size={14} className="mt-0.5 shrink-0" />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full lg:w-[45%]">
              <div className="lp-feature-card">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-violet-400">
                    <Sparkles size={15} /> AI Insights
                  </div>
                  <span className="lp-live-dot" />
                </div>
                <div className="space-y-3">
                  {[
                    ["You spent 21% more on tools this month.", "violet"],
                    ["Pre-paying internet for 6 months saves 8%.", "sky"],
                    ["Invoice PM-342 overdue by 11 days.", "red"],
                  ].map(([text, color]) => (
                    <div key={text} className={`rounded-xl border-l-[3px] bg-[var(--bg-elevated)] px-4 py-3 text-xs leading-5 text-[var(--text-secondary)] border-${color}-500`}>
                      {text}
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex gap-2">
                  <button className="flex-1 rounded-xl border border-violet-500/25 py-2 text-xs font-semibold text-violet-400 transition hover:bg-violet-500/10">Refresh</button>
                  <button className="flex-1 rounded-xl border border-[var(--border)] py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)]">Monthly Report</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO FEATURE GRID ── */}
      <section id="features-grid" className="border-y border-[var(--border)] bg-[var(--bg-card)] py-24">
        <div className="mx-auto max-w-[1200px] px-5">
          <div className="reveal mb-12 text-center">
            <h3 className="font-display text-3xl font-bold">One platform. Everything covered.</h3>
          </div>
          <div className="reveal">
            <FeatureBento />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-[var(--bg-primary)] py-28">
        <div className="mx-auto max-w-[1200px] px-5">
          <div className="reveal mb-16 text-center">
            <div className="lp-section-label">Getting started</div>
            <h2 className="mt-4 font-display text-[clamp(28px,3.5vw,44px)] font-extrabold">Up and running in 3 minutes.</h2>
          </div>
          <div className="reveal relative grid gap-6 md:grid-cols-3">
            {/* connector line */}
            <div className="pointer-events-none absolute left-0 right-0 top-[52px] hidden h-[1px] bg-gradient-to-r from-transparent via-[var(--border)] to-transparent md:block" />
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.n} className="lp-step-card relative">
                  <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border ${step.color}`}>
                    <Icon size={24} />
                  </div>
                  <div className="absolute right-5 top-5 font-display text-5xl font-black text-[var(--bg-elevated)]">{step.n}</div>
                  <h3 className="mb-2 text-lg font-bold">{step.title}</h3>
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">{step.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="border-y border-[var(--border)] bg-[var(--bg-card)] py-24">
        <div className="mx-auto max-w-[1200px] px-5">
          <div className="reveal mb-14 text-center">
            <div className="lp-section-label">What freelancers say</div>
            <h2 className="mt-4 font-display text-[clamp(28px,3.5vw,44px)] font-extrabold">Real people. Real results.</h2>
          </div>
          <div className="reveal grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="lp-testimonial-card">
                <div className="mb-4 text-amber-400 text-sm">★★★★★</div>
                <p className="text-sm leading-7 text-[var(--text-secondary)]">"{t.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-sm text-white ${t.color}`}>{t.avatar}</div>
                  <div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">{t.name}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="reveal relative overflow-hidden py-28 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(14,165,233,0.10),transparent)]" />
        <div className="relative z-10 mx-auto max-w-[700px] px-5">
          <div className="lp-section-label mb-4">Start today. It's free.</div>
          <h2 className="font-display text-[clamp(32px,4vw,56px)] font-extrabold leading-tight">
            Start understanding your
            <br />
            <span className="lp-gradient-text">money today.</span>
          </h2>
          <p className="mt-5 text-lg text-[var(--text-secondary)]">No credit card. No CA. No spreadsheet. Free to start.</p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/register" className="lp-cta-btn-lg flex items-center gap-2 rounded-2xl px-10 py-4 text-base font-bold text-white">
              Create Free Account
              <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="rounded-2xl border border-[var(--border)] px-10 py-4 text-base font-semibold text-[var(--text-secondary)] transition hover:border-sky-500/30 hover:text-[var(--text-primary)]">
              Sign In
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--text-secondary)]">
            {["Free plan forever", "No credit card needed", "Built for India"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle size={13} className="text-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[var(--border)] bg-[var(--bg-card)] px-5 py-14">
        <div className="mx-auto grid max-w-[1200px] gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <img src="/favicon.png" alt="PaisaMind" width={28} height={28} className="rounded-xl" />
              <span className="font-display text-lg font-bold">PaisaMind</span>
            </div>
            <p className="mt-3 max-w-[280px] text-sm leading-6 text-[var(--text-secondary)]">
              The AI-powered financial operating system for Indian freelancers and small businesses.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {trustLogos.map((item) => (
                <span key={item} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">{item}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">Product</div>
            <div className="space-y-2.5 text-sm text-[var(--text-secondary)]">
              {["Dashboard", "Income Tracker", "Tax Planner", "Invoice Generator", "AI Reports", "Cash Flow Forecast"].map((item) => (
                <div key={item} className="cursor-default transition hover:text-[var(--text-primary)]">{item}</div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">Legal</div>
            <div className="space-y-2.5 text-sm text-[var(--text-secondary)]">
              {["Privacy Policy", "Terms of Service", "Security"].map((item) => (
                <div key={item} className="cursor-default transition hover:text-[var(--text-primary)]">{item}</div>
              ))}
            </div>
            <div className="mt-8">
              <a href="https://github.com/AkshatKardak" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">
                <Globe size={15} /> GitHub
              </a>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-[1200px] flex-col justify-between gap-2 border-t border-[var(--border)] pt-6 text-xs text-[var(--text-secondary)] md:flex-row">
          <span>© 2026 PaisaMind. All rights reserved.</span>
          <span>Made with ❤️ in India · AI-powered fintech for freelancers</span>
        </div>
      </footer>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--bg-card)]/95 p-3 backdrop-blur md:hidden">
        <Link to="/register" className="lp-cta-btn block w-full rounded-2xl py-3.5 text-center text-base font-bold text-white">
          Get Started Free →
        </Link>
      </div>
    </div>
  );
}

export default Landing;