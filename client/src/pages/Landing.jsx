import {
  ArrowRight,
  BarChart2,
  Bell,
  Bot,
  Calculator,
  CheckCircle,
  CreditCard,
  FileText,
  Globe,
  Lightbulb,
  Play,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
  UserPlus,
} from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/ui/ThemeToggle";

const featureCards = [
  { icon: TrendingUp, title: "Income Tracker", sub: "Multi-source", color: "text-sky-400 bg-sky-500/10" },
  { icon: TrendingDown, title: "Expense Control", sub: "With categories", color: "text-red-400 bg-red-500/10" },
  { icon: FileText, title: "Invoice Generator", sub: "GST-ready", color: "text-amber-400 bg-amber-500/10" },
  { icon: CreditCard, title: "Stripe Payments", sub: "Get paid online", color: "text-emerald-400 bg-emerald-500/10" },
  { icon: Calculator, title: "Tax Planner", sub: "Old vs New regime", color: "text-amber-400 bg-amber-500/10" },
  { icon: Target, title: "Goal Tracker", sub: "With AI tips", color: "text-purple-400 bg-purple-500/10" },
  { icon: BarChart2, title: "AI Reports", sub: "Monthly insights", color: "text-sky-400 bg-sky-500/10" },
  { icon: Bell, title: "Smart Alerts", sub: "Tax + invoice", color: "text-pink-400 bg-pink-500/10" },
];

function Landing() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("visible")),
      { threshold: 0.1 }
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    const nav = document.getElementById("navbar");
    const onScroll = () => {
      if (!nav) return;
      nav.style.boxShadow = window.scrollY > 60 ? "0 1px 40px rgba(0,0,0,0.5)" : "none";
    };

    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <header
        id="navbar"
        className="navbar fixed left-0 right-0 top-0 z-50 h-16 border-b border-white/5 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-full w-full max-w-[1200px] items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="PaisaMind" width={32} height={32} className="rounded-lg" />
            <div className="leading-tight">
              <div className="font-display text-[20px] font-bold text-[var(--text-primary)]">PaisaMind</div>
              <div className="text-xs text-slate-500">Finance OS for freelancers</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="rounded-lg border border-slate-700 px-5 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-sky-500 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-sky-400 hover:shadow-[0_0_20px_rgba(14,165,233,0.4)]"
            >
              Get Started →
            </Link>
          </div>
        </div>
      </header>

      <section className="grid-bg relative min-h-screen overflow-hidden bg-[var(--bg-primary)] px-6 pb-16 pt-24">
        <div className="orb orb-blue" />
        <div className="orb orb-purple" />
        <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-12 pb-8 pt-8 lg:flex-row">
          <div className="w-full lg:w-[55%]">
            <div className="animate-[fadeSlideUp_0.7s_ease_forwards]">
              <div className="mb-4 flex items-center gap-3">
                <span className="h-6 w-[2px] bg-sky-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">
                  MONEY CLARITY, FINALLY
                </span>
              </div>
            </div>
            <h1 className="animate-[fadeSlideUp_0.7s_ease_0.15s_forwards] font-display text-[clamp(40px,5.5vw,76px)] font-extrabold leading-[1.05] text-[var(--text-primary)] opacity-0">
              The financial <span className="underline decoration-sky-500 underline-offset-6">OS</span>
              <br />
              built for Indian
              <br />
              freelancers.
            </h1>
            <p className="animate-[fadeSlideUp_0.7s_ease_0.3s_forwards] mt-6 max-w-[500px] text-[18px] leading-[1.7] text-slate-400 opacity-0">
              PaisaMind tracks your income streams, catches tax deadlines before they hit, chases overdue invoices,
              and gives you an AI co-pilot - all in one sharp, fast dashboard.
            </p>
            <div className="animate-[fadeSlideUp_0.7s_ease_0.45s_forwards] mt-10 flex flex-wrap gap-4 opacity-0">
              <Link
                to="/register"
                className="flex items-center gap-2 rounded-xl bg-sky-500 px-8 py-4 text-base font-bold text-white transition-all duration-200 hover:bg-sky-400 hover:shadow-[0_0_30px_rgba(14,165,233,0.5)]"
              >
                Start for Free →
              </Link>
              <button className="flex items-center gap-2 rounded-xl border border-slate-700 px-8 py-4 text-base text-slate-300 transition hover:border-slate-500 hover:text-white">
                <Play size={16} />
                See the dashboard
              </button>
            </div>
            <div className="animate-[fadeSlideUp_0.7s_ease_0.6s_forwards] mt-8 flex flex-wrap items-center gap-3 opacity-0">
              <div className="flex items-center">
                {["A", "R", "S", "K", "P"].map((v, idx) => (
                  <span
                    key={v}
                    className={`-ml-2 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--bg-primary)] text-xs font-semibold text-white ${
                      ["bg-sky-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-pink-500"][idx]
                    }`}
                  >
                    {v}
                  </span>
                ))}
              </div>
              <span className="text-sm text-slate-400">Trusted by 2,000+ Indian freelancers</span>
              <span className="text-sm text-amber-400">★★★★★</span>
              <span className="text-sm text-slate-400">4.9/5</span>
            </div>
          </div>

          <div className="w-full lg:w-[45%]">
            <div className="relative animate-[float_7s_ease-in-out_infinite]">
              <div className="pointer-events-none absolute inset-[-5%] z-0 bg-[radial-gradient(circle,rgba(14,165,233,0.12),transparent)] blur-[40px]" />
              <div className="relative z-10 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-2xl">
                <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Dashboard</span>
                  <span className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { l: "Income", v: "₹85,500", c: "text-[var(--text-primary)]" },
                    { l: "Profit", v: "₹51,400", c: "text-emerald-400" },
                    { l: "Score", v: "74/100", c: "text-sky-400" },
                  ].map((item) => (
                    <div key={item.l} className="rounded-lg bg-[var(--bg-elevated)] p-3">
                      <div className="text-[10px] uppercase text-slate-500">{item.l}</div>
                      <div className={`mt-1 text-sm font-bold ${item.c}`}>{item.v}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <div className="mb-2 text-[10px] text-slate-500">6-month trend</div>
                  <div className="flex h-[60px] items-end gap-1">
                    {[30, 45, 35, 50, 40, 60, 55].map((height, i) => (
                      <div
                        key={height}
                        className="w-4 rounded-t-sm bg-sky-500"
                        style={{
                          "--h": `${height}px`,
                          animation: `growBar 0.7s ease ${i * 0.1}s forwards`,
                          height: 0,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="my-4 border-t border-slate-800" />
                <div className="flex items-start gap-2 border-l-2 border-purple-500 pl-3 text-xs text-slate-300">
                  <Lightbulb size={16} className="mt-0.5 text-purple-400" />
                  <span>You overspent ₹8,200 in Software this month</span>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-lg bg-[var(--bg-elevated)] px-3 py-2">
                  <div>
                    <div className="text-xs text-[var(--text-primary)]">Acme Corp</div>
                    <div className="text-xs font-bold text-[var(--text-primary)]">₹25,000</div>
                  </div>
                  <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                    OVERDUE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-card)] py-10">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 md:grid-cols-4">
          {[
            ["₹2.4Cr+", "Income tracked"],
            ["15,000+", "Invoices generated"],
            ["94%", "On-time tax reminders"],
            ["4.9★", "Average rating"],
          ].map(([num, label], i) => (
            <div
              key={num}
              className={`px-8 text-center ${i !== 3 ? "md:border-r border-[var(--border)]" : ""}`}
            >
              <div className="animate-[countUp_0.8s_ease] font-display text-4xl font-extrabold text-[var(--text-primary)]">
                {num}
              </div>
              <div className="mt-1 text-sm font-medium text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[var(--bg-primary)] py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="reveal text-center">
            <p className="text-xs uppercase tracking-widest text-sky-400">BUILT FOR THE WAY YOU WORK</p>
            <h2 className="mx-auto mt-4 max-w-[600px] font-display text-4xl font-extrabold text-[var(--text-primary)] md:text-5xl">
              Everything a freelancer&apos;s finances actually need.
            </h2>
            <p className="mt-4 text-lg text-slate-400">No accountant. No confusing software. Just clarity.</p>
          </div>

          <div className="reveal mt-20 flex flex-col items-center gap-8 lg:flex-row">
            <div className="w-full lg:w-[60%]">
              <span className="mb-4 inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                FINANCIAL HEALTH
              </span>
              <h3 className="font-display text-3xl font-bold text-[var(--text-primary)]">Know your score before your CA does.</h3>
              <p className="mt-4 max-w-[560px] text-base leading-7 text-slate-400">
                A real-time 0-100 Financial Health Score calculated across 4 dimensions:
              </p>
              <div className="mt-6 space-y-4">
                {[
                  ["Savings Ratio", 78, "from-emerald-500 to-emerald-300"],
                  ["Expense Control", 62, "from-amber-500 to-amber-300"],
                  ["Income Stability", 55, "from-amber-500 to-amber-300"],
                  ["Invoice Collection", 90, "from-emerald-500 to-emerald-300"],
                ].map(([label, pct, gradient]) => (
                  <div key={label}>
                    <div className="mb-1 flex justify-between text-sm text-slate-400">
                      <span>{label}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--bg-elevated)]">
                      <div className={`h-1.5 rounded-full bg-gradient-to-r ${gradient}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full lg:w-[40%]">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 transition-all duration-300 hover:border-sky-500/30">
                <div className="mx-auto w-full max-w-[220px]">
                  <svg viewBox="0 0 200 120" className="w-full">
                    <path d="M20 100 A80 80 0 0 1 180 100" stroke="#1F2937" strokeWidth="14" fill="none" />
                    <path d="M20 100 A80 80 0 0 1 150 42" stroke="#0EA5E9" strokeWidth="14" fill="none" />
                  </svg>
                </div>
                <div className="mt-2 text-center">
                  <div className="text-6xl font-black text-[var(--text-primary)]">74</div>
                  <div className="text-sm tracking-[0.2em] text-sky-400">GOOD</div>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {["bg-emerald-500/20", "bg-amber-500/20", "bg-sky-500/20", "bg-purple-500/20"].map((cls) => (
                    <span key={cls} className={`h-2 w-8 rounded-full ${cls}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="reveal mt-24 flex flex-col-reverse items-center gap-8 lg:flex-row-reverse">
            <div className="w-full lg:w-[60%]">
              <span className="mb-4 inline-block rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
                TAX INTELLIGENCE
              </span>
              <h3 className="font-display text-3xl font-bold text-[var(--text-primary)]">
                GST alerts. Advance tax. Old vs New regime.
              </h3>
              <p className="mt-4 text-base leading-7 text-slate-400">
                Built for Indian freelancers, with threshold alerts, tax projections, and deadline tracking.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  "Real-time GST threshold tracker with alerts",
                  "Old vs New regime comparison calculator",
                  "Quarterly advance tax payment schedule",
                  "Upcoming deadline countdown timers",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-slate-300">
                    <CheckCircle size={16} className="mt-0.5 text-emerald-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full lg:w-[40%]">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
                <div className="text-xs text-slate-500">GST Threshold Monitor</div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                  <div className="h-3 w-[82%] rounded-full bg-gradient-to-r from-amber-500 to-red-500" />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">₹16,40,000 of ₹20,00,000 used</span>
                  <span className="font-bold text-amber-400">82%</span>
                </div>
                <div className="mt-2 text-xs text-amber-400">Warning: Approaching limit</div>
                <div className="my-4 border-t border-slate-800" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[var(--bg-elevated)] p-4">
                    <div className="text-xs text-slate-500">Old Regime</div>
                    <div className="mt-1 text-xl font-bold text-[var(--text-primary)]">₹1,24,800</div>
                    <div className="text-xs text-slate-500">Tax payable</div>
                  </div>
                  <div className="rounded-xl border border-emerald-500/30 bg-[var(--bg-elevated)] p-4">
                    <div className="text-xs text-emerald-400">New Regime ✓</div>
                    <div className="mt-1 text-xl font-bold text-emerald-400">₹94,200</div>
                    <div className="text-xs text-slate-500">You save ₹30,600</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="reveal mt-24 flex flex-col items-center gap-8 lg:flex-row">
            <div className="w-full lg:w-[60%]">
              <span className="mb-4 inline-block rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400">
                AI POWERED
              </span>
              <h3 className="font-display text-3xl font-bold text-[var(--text-primary)]">Your AI finance co-pilot, on demand.</h3>
              <p className="mt-4 text-base leading-7 text-slate-400">
                Powered by Groq&apos;s llama-3.3-70b, PaisaMind reads your financial data and delivers plain-English
                insights, monthly reports, and AI-drafted invoice reminders.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  "Insight: Food spending is up 34% from last month",
                  "Alert: Income dropped below 3-month average",
                  "Urgent: ₹45,000 in invoices are overdue",
                ].map((item) => (
                  <div key={item} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full lg:w-[40%]">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-purple-400">
                  <Sparkles size={14} />
                  AI Insights
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl border-l-2 border-purple-500 bg-[var(--bg-elevated)] px-4 py-3 text-xs text-slate-300">
                    You spent 21% more on tools this month.
                  </div>
                  <div className="rounded-xl border-l-2 border-sky-500 bg-[var(--bg-elevated)] px-4 py-3 text-xs text-slate-300">
                    Consider pre-paying internet for 6 months to save 8%.
                  </div>
                  <div className="rounded-xl border-l-2 border-red-500 bg-[var(--bg-elevated)] px-4 py-3 text-xs text-slate-300">
                    Invoice PM-342 is overdue by 11 days.
                  </div>
                </div>
                <button className="mt-4 w-full rounded-lg border border-purple-500/30 px-4 py-2 text-xs text-purple-400 transition hover:bg-purple-500/10">
                  Refresh Insights
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="reveal border-y border-[var(--border-subtle)] bg-[#0D1117] py-24">
        <div className="mx-auto max-w-[1200px] px-6 text-center">
          <p className="text-xs uppercase tracking-widest text-sky-400">GETTING STARTED</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold text-[var(--text-primary)]">Up and running in 3 minutes</h2>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                n: "01",
                icon: UserPlus,
                t: "Create your account",
                b: "Sign up with email. Configure your tax regime, PAN, and GST in Settings.",
                color: "bg-sky-500/10 text-sky-400",
              },
              {
                n: "02",
                icon: Upload,
                t: "Log income & expenses",
                b: "Add transactions manually. We auto-categorize and build your dashboard.",
                color: "bg-emerald-500/10 text-emerald-400",
              },
              {
                n: "03",
                icon: Bot,
                t: "Get AI-powered insights",
                b: "Get your health score, tax estimates, invoice reminders, and smart tips.",
                color: "bg-purple-500/10 text-purple-400",
              },
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.n} className="relative overflow-visible rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 text-left transition-all duration-300 hover:border-sky-500/30">
                  <div className="absolute right-4 top-4 text-6xl font-black leading-none text-slate-800">
                    {step.n}
                  </div>
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${step.color}`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-[var(--text-primary)]">{step.t}</h3>
                  <p className="text-sm leading-6 text-slate-400">{step.b}</p>
                  {idx < 2 ? (
                    <ArrowRight className="absolute -right-6 top-1/2 hidden -translate-y-1/2 text-slate-700 md:block" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="reveal bg-[var(--bg-primary)] py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <h3 className="text-center font-display text-3xl font-bold text-[var(--text-primary)]">One platform. Everything covered.</h3>
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
            {featureCards.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="cursor-default rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-sky-500/20"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.color}`}>
                    <Icon size={20} />
                  </div>
                  <div className="mt-3 text-sm font-semibold text-[var(--text-primary)]">{item.title}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.sub}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="reveal border-y border-sky-500/10 bg-[linear-gradient(135deg,rgba(14,165,233,0.10),rgba(139,92,246,0.10))] py-24 text-center">
        <h3 className="mx-auto max-w-3xl font-display text-4xl font-extrabold text-[var(--text-primary)] md:text-5xl">
          Start understanding your money today.
        </h3>
        <p className="mt-4 text-lg text-slate-400">Free to start. No credit card. No CA required.</p>
        <Link
          to="/register"
          className="mt-10 inline-block rounded-xl bg-sky-500 px-10 py-5 text-lg font-bold text-white animate-[pulse-glow_2.5s_infinite] transition hover:bg-sky-400 hover:[animation-play-state:paused]"
        >
          Create Free Account →
        </Link>
        <p className="mt-4 text-xs text-slate-600">Built for Indian freelancers</p>
      </section>

      <footer className="border-t border-[var(--border-subtle)] bg-[#080C14] px-6 py-12">
        <div className="mx-auto grid max-w-[1200px] gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <img src="/favicon.png" alt="PaisaMind" width={28} height={28} className="rounded-md" />
              <span className="font-display text-lg font-bold text-[var(--text-primary)]">PaisaMind</span>
            </div>
            <p className="mt-2 max-w-[240px] text-sm text-slate-500">Finance OS for Indian freelancers</p>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex text-slate-600 transition hover:text-slate-300"
            >
              <Globe size={18} />
            </a>
          </div>
          <div>
            <div className="mb-3 text-xs uppercase tracking-widest text-slate-600">Product</div>
            <div className="space-y-2 text-sm text-slate-500">
              {["Dashboard", "Income Tracker", "Tax Planner", "Invoice Generator", "AI Reports"].map((item) => (
                <div key={item} className="transition hover:text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-3 text-xs uppercase tracking-widest text-slate-600">Tech Stack</div>
            <div className="flex flex-wrap gap-2">
              {["React", "Node.js", "MongoDB", "Express", "Groq AI", "Stripe", "Resend", "Tailwind"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-md border border-[#374151] bg-[#1F2937] px-2 py-1 text-xs text-slate-400"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-[1200px] flex-col justify-between gap-2 border-t border-slate-900 pt-6 text-xs text-slate-700 md:flex-row">
          <span>© 2026 PaisaMind. All rights reserved.</span>
          <span>Made in India</span>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
