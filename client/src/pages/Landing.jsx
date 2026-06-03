import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import ThemeToggle from "../components/ui/ThemeToggle";

const flowSteps = [
  {
    title: "Track",
    body: "Capture freelance income, expenses, invoices, and goals without spreadsheet drag.",
    icon: Wallet,
  },
  {
    title: "Analyze",
    body: "AI reviews spending, tax exposure, recurring costs, and invoice health in context.",
    icon: Brain,
  },
  {
    title: "Predict",
    body: "Forecast cash flow, GST threshold risk, advance tax needs, and savings runway.",
    icon: BarChart3,
  },
  {
    title: "Optimize",
    body: "Turn insights into better pricing, cleaner collections, and smarter tax decisions.",
    icon: Zap,
  },
];

const problems = [
  {
    title: "Income arrives everywhere",
    body: "UPI, clients, platforms, retainers, and one-off projects rarely land in a neat monthly rhythm.",
    icon: TrendingUp,
  },
  {
    title: "Taxes stay unclear",
    body: "GST thresholds, advance tax, old vs new regime, and deductions become last-minute pressure.",
    icon: Calculator,
  },
  {
    title: "Subscriptions quietly leak money",
    body: "Tools, SaaS apps, domains, and marketing spends keep running long after they stop helping.",
    icon: TrendingDown,
  },
  {
    title: "Invoices need chasing",
    body: "Unpaid invoices distort cash flow and force awkward follow-ups when work should move forward.",
    icon: FileText,
  },
];

const features = [
  {
    eyebrow: "Income Tracking",
    title: "See every rupee you earn in one clean system.",
    body: "Log client payments, UPI collections, freelance marketplace income, and side-project revenue with category-level reporting.",
    icon: TrendingUp,
    accent: "sky",
  },
  {
    eyebrow: "Expense Control",
    title: "Spot spend patterns before they become habits.",
    body: "Track tools, internet, travel, marketing, and recurring costs with subscription leak detection built in.",
    icon: TrendingDown,
    accent: "red",
  },
  {
    eyebrow: "Invoice Automation",
    title: "Create GST-ready invoices and get paid faster.",
    body: "Generate invoices, monitor paid and overdue status, draft reminders, and create online payment links.",
    icon: FileText,
    accent: "amber",
  },
  {
    eyebrow: "Cash Flow Forecasting",
    title: "Plan the next month before it surprises you.",
    body: "Model expected income, upcoming expenses, tax payments, and savings goals from your actual financial activity.",
    icon: BarChart3,
    accent: "purple",
  },
];

const testimonials = [
  {
    name: "Aarav Mehta",
    role: "Product designer",
    city: "Bengaluru",
    quote:
      "PaisaMind gave me one place to understand client income, tax estimates, and unpaid invoices. It feels calm instead of accounting-heavy.",
    initials: "AM",
  },
  {
    name: "Riya Shah",
    role: "Content creator",
    city: "Mumbai",
    quote:
      "The GST threshold view is the thing I check most. I finally know when revenue is good news and when it needs tax planning.",
    initials: "RS",
  },
  {
    name: "Kabir Sethi",
    role: "Indie consultant",
    city: "Pune",
    quote:
      "The monthly AI report helps me make decisions without spending Sunday night inside a spreadsheet.",
    initials: "KS",
  },
];

const healthMetrics = [
  ["Savings ratio", 78, "green"],
  ["Expense control", 64, "amber"],
  ["Income stability", 71, "sky"],
  ["Invoice collection", 88, "green"],
];

const featureGrid = [
  ["Income Tracker", "Multi-source revenue", TrendingUp, "sky"],
  ["Expense Control", "Categories and leaks", TrendingDown, "red"],
  ["Invoice Generator", "GST-ready billing", FileText, "amber"],
  ["Online Payments", "Razorpay checkout links", CreditCard, "green"],
  ["Tax Planner", "Old vs new regime", Calculator, "amber"],
  ["Goal Tracker", "Savings milestones", Target, "purple"],
  ["AI Reports", "Monthly intelligence", Bot, "purple"],
  ["Smart Alerts", "Tax and invoices", Bell, "sky"],
];

function SectionHeader({ eyebrow, title, body, align = "center" }) {
  return (
    <div className={`mx-auto max-w-3xl ${align === "center" ? "text-center" : ""}`}>
      <div className="lp-section-label">{eyebrow}</div>
      <h2 className="mt-4 font-display text-[32px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[var(--text-primary)] md:text-5xl">
        {title}
      </h2>
      {body && <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[var(--text-secondary)] md:text-lg">{body}</p>}
    </div>
  );
}

function MiniBarChart() {
  const values = [34, 52, 42, 68, 58, 82, 74, 94];

  return (
    <div className="flex h-28 items-end gap-2 rounded-2xl border border-white/5 bg-black/15 p-4">
      {values.map((value, index) => (
        <div key={value} className="flex flex-1 items-end">
          <div
            className="lp-bar w-full rounded-t-md bg-gradient-to-t from-sky-600 to-sky-300"
            style={{ "--bar-height": `${value}%`, animationDelay: `${index * 90}ms` }}
          />
        </div>
      ))}
    </div>
  );
}

function DashboardPreview() {
  const activity = [
    ["Design retainer", "+ Rs. 58,000", "Client paid"],
    ["Software tools", "- Rs. 8,200", "Recurring"],
    ["Invoice PM-342", "Rs. 25,000", "Overdue"],
  ];

  return (
    <div className="lp-dashboard lp-floating relative mx-auto w-full max-w-[620px] lg:px-10">
      <div className="lp-floating-card lp-floating-card-left absolute left-0 top-24 hidden rounded-2xl px-4 py-3 text-sm shadow-2xl backdrop-blur-xl lg:block">
        <div className="text-[11px] uppercase tracking-[0.18em] text-sky-300">Insight</div>
        <div className="mt-1 font-semibold">Income increased 14% this month</div>
      </div>
      <div className="lp-floating-card lp-floating-card-right absolute bottom-28 right-0 hidden rounded-2xl px-4 py-3 text-sm shadow-2xl backdrop-blur-xl lg:block">
        <div className="text-[11px] uppercase tracking-[0.18em] text-amber-300">Reminder</div>
        <div className="mt-1 font-semibold">Quarterly tax due in 8 days</div>
      </div>

      <div className="lp-glass-panel overflow-hidden rounded-[28px] p-4 shadow-2xl md:p-5">
        <div className="mb-5 flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">PaisaMind cockpit</div>
            <div className="mt-1 font-display text-xl font-bold text-[var(--text-primary)]">June finances</div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Income", "Rs. 8.55L", "+14%", "sky"],
            ["Profit", "Rs. 5.14L", "+9%", "green"],
            ["Health", "82/100", "Good", "purple"],
          ].map(([label, value, change, accent]) => (
            <div key={label} className={`lp-mini-card lp-accent-${accent}`}>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</div>
              <div className="mt-2 text-lg font-extrabold text-[var(--text-primary)]">{value}</div>
              <div className="mt-1 text-xs text-[var(--text-secondary)]">{change}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="lp-mini-card">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[var(--text-primary)]">Income analytics</div>
                <div className="text-[11px] text-[var(--text-muted)]">Six month trend</div>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">Healthy</span>
            </div>
            <MiniBarChart />
          </div>

          <div className="lp-mini-card">
            <div className="mb-3 text-xs font-semibold text-[var(--text-primary)]">Expense split</div>
            <div className="mx-auto grid h-32 w-32 place-items-center rounded-full" style={{ background: "conic-gradient(#0EA5E9 0 38%, #8B5CF6 38% 62%, #F59E0B 62% 81%, #10B981 81% 100%)" }}>
              <div className="grid h-20 w-20 place-items-center rounded-full bg-[var(--bg-surface)] text-center">
                <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Spend</span>
                <span className="-mt-3 text-sm font-bold text-[var(--text-primary)]">Rs. 1.9L</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="lp-mini-card">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-primary)]">GST threshold</span>
              <span className="text-xs font-bold text-amber-300">82%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/6">
              <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-amber-400 to-red-500" />
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">Rs. 16.4L used of Rs. 20L annual threshold.</p>
          </div>

          <div className="lp-mini-card">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-purple-300">
              <Sparkles size={14} />
              AI insight cards
            </div>
            <div className="space-y-2">
              <div className="rounded-xl border border-sky-400/10 bg-sky-500/8 px-3 py-2 text-xs text-[var(--text-secondary)]">Cash runway improved by 11 days after lower travel spend.</div>
              <div className="rounded-xl border border-red-400/10 bg-red-500/8 px-3 py-2 text-xs text-[var(--text-secondary)]">Invoice PM-342 is overdue and affects June cash flow.</div>
            </div>
          </div>
        </div>

        <div className="mt-4 lp-mini-card">
          <div className="mb-3 text-xs font-semibold text-[var(--text-primary)]">Transaction activity</div>
          <div className="space-y-2">
            {activity.map(([title, amount, meta]) => (
              <div key={title} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2">
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">{title}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">{meta}</div>
                </div>
                <div className="text-xs font-bold text-[var(--text-primary)]">{amount}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChaosVisual() {
  const rows = [
    ["Client A", "UPI received", "Rs. 42,000"],
    ["SaaS renewal", "Auto debit", "Rs. 6,499"],
    ["GST", "Threshold risk", "82%"],
    ["Invoice", "Needs follow-up", "PM-342"],
    ["Tax", "Advance due", "8 days"],
  ];

  return (
    <div className="lp-glass-panel relative overflow-hidden rounded-[28px] p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(239,68,68,0.14),transparent_34%),radial-gradient(circle_at_20%_80%,rgba(245,158,11,0.12),transparent_35%)]" />
      <div className="relative">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Financial noise</div>
            <div className="mt-1 font-display text-xl font-bold text-[var(--text-primary)]">Before PaisaMind</div>
          </div>
          <div className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">High friction</div>
        </div>
        <div className="space-y-3">
          {rows.map(([title, meta, value], index) => (
            <div
              key={title}
              className="rounded-2xl border border-white/6 bg-white/[0.035] p-4 backdrop-blur-xl"
              style={{ transform: `translateX(${index % 2 === 0 ? 0 : 16}px)` }}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{title}</div>
                  <div className="text-xs text-[var(--text-muted)]">{meta}</div>
                </div>
                <div className="text-sm font-bold text-[var(--text-secondary)]">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureSpotlight({ feature, index }) {
  const Icon = feature.icon;
  const reverse = index % 2 === 1;

  return (
    <div className={`reveal grid items-center gap-8 lg:grid-cols-2 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
      <div>
        <div className={`lp-feature-badge lp-accent-${feature.accent}`}>
          <Icon size={15} />
          {feature.eyebrow}
        </div>
        <h3 className="mt-5 max-w-xl font-display text-3xl font-extrabold leading-tight tracking-[-0.03em] text-[var(--text-primary)] md:text-4xl">
          {feature.title}
        </h3>
        <p className="mt-4 max-w-xl text-base leading-8 text-[var(--text-secondary)]">{feature.body}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {["Realtime visibility", "AI context", "Indian workflows"].map((item) => (
            <span key={item} className="rounded-full border border-white/6 bg-white/[0.035] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="lp-glass-panel rounded-[28px] p-5">
        <div className="rounded-3xl border border-white/6 bg-black/15 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`grid h-11 w-11 place-items-center rounded-2xl lp-icon-bg-${feature.accent}`}>
                <Icon size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)]">{feature.eyebrow}</div>
                <div className="text-xs text-[var(--text-muted)]">Live module preview</div>
              </div>
            </div>
            <span className="lp-live-dot" />
          </div>

          <div className="space-y-3">
            {[88, 64, 72].map((value, rowIndex) => (
              <div key={value} className="rounded-2xl bg-white/[0.035] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">{["This month", "Forecast", "Risk score"][rowIndex]}</span>
                  <span className="text-xs font-bold text-[var(--text-primary)]">{value}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/6">
                  <div className={`h-full rounded-full lp-progress-${feature.accent}`} style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthScoreSection() {
  return (
    <section id="health-score" className="lp-section">
      <div className="mx-auto max-w-7xl px-5">
        <div className="reveal grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="lp-glass-panel rounded-[32px] p-6 md:p-8">
            <div className="relative mx-auto grid aspect-square max-w-[360px] place-items-center rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.18),transparent_62%)]">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 220 220" aria-hidden="true">
                <circle cx="110" cy="110" r="86" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="18" />
                <circle
                  cx="110"
                  cy="110"
                  r="86"
                  fill="none"
                  stroke="url(#healthGradient)"
                  strokeLinecap="round"
                  strokeWidth="18"
                  strokeDasharray="540"
                  strokeDashoffset="98"
                />
                <defs>
                  <linearGradient id="healthGradient" x1="0" x2="1" y1="0" y2="1">
                    <stop stopColor="#0EA5E9" />
                    <stop offset="1" stopColor="#10B981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="relative text-center">
                <div className="font-display text-7xl font-black tracking-[-0.08em] text-[var(--text-primary)]">82</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-[0.3em] text-sky-300">Strong</div>
              </div>
            </div>
          </div>

          <div>
            <div className="lp-section-label">Financial Health Score</div>
            <h2 className="mt-4 font-display text-[32px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[var(--text-primary)] md:text-5xl">
              Know your financial score before your CA does.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--text-secondary)] md:text-lg">
              PaisaMind converts income consistency, expense control, savings ratio, and invoice collection into one fintech-grade score you can act on.
            </p>

            <div className="mt-8 space-y-4">
              {healthMetrics.map(([label, value, tone]) => (
                <div key={label} className="rounded-2xl border border-white/6 bg-white/[0.035] p-4">
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="font-semibold text-[var(--text-primary)]">{label}</span>
                    <span className="font-bold text-[var(--text-secondary)]">{value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/6">
                    <div className={`h-full rounded-full lp-progress-${tone}`} style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TaxSection() {
  return (
    <section id="tax" className="lp-section border-y border-white/6 bg-[var(--bg-surface)]">
      <div className="mx-auto max-w-7xl px-5">
        <div className="reveal grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="lp-section-label">Indian tax planning software</div>
            <h2 className="mt-4 font-display text-[32px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[var(--text-primary)] md:text-5xl">
              GST alerts. Advance tax. Regime comparison.
            </h2>
            <p className="mt-5 text-base leading-8 text-[var(--text-secondary)] md:text-lg">
              Built for Indian freelancers who need a GST tracker, quarterly tax reminders, and a clear old vs new regime comparison without decoding tax jargon every month.
            </p>
            <div className="mt-7 grid gap-3">
              {[
                "Realtime GST threshold tracker with warning states",
                "Quarterly advance tax payment schedule and countdowns",
                "Old vs new regime comparison with tax-saving recommendations",
                "AI summaries that explain the next best action",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <CheckCircle className="text-emerald-400" size={17} />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="lp-glass-panel rounded-[32px] p-5 md:p-7">
            <div className="rounded-3xl border border-white/6 bg-black/15 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">GST threshold monitor</div>
                  <div className="mt-1 font-display text-2xl font-bold text-[var(--text-primary)]">Rs. 16,40,000 used</div>
                </div>
                <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">82%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/6">
                <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-amber-400 to-red-500" />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/6 bg-white/[0.035] p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Old regime</div>
                  <div className="mt-2 font-display text-2xl font-bold text-[var(--text-primary)]">Rs. 1,24,800</div>
                  <div className="mt-1 text-xs text-[var(--text-secondary)]">Estimated tax</div>
                </div>
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-emerald-300">New regime</div>
                  <div className="mt-2 font-display text-2xl font-bold text-emerald-300">Rs. 94,200</div>
                  <div className="mt-1 text-xs text-emerald-200/80">Save Rs. 30,600</div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-sky-400/15 bg-sky-500/10 p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="mt-0.5 text-sky-300" size={18} />
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">
                    Recommendation: keep the new regime selected unless deductions exceed Rs. 2.7L this year.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AiCopilotSection() {
  return (
    <section id="ai-copilot" className="lp-section">
      <div className="mx-auto max-w-7xl px-5">
        <div className="reveal grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="lp-glass-panel rounded-[32px] p-5 md:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-500/10 text-purple-300">
                  <Sparkles size={20} />
                </div>
                <div>
                  <div className="font-display text-xl font-bold text-[var(--text-primary)]">AI finance copilot</div>
                  <div className="text-xs text-[var(--text-muted)]">Contextual insights from your data</div>
                </div>
              </div>
              <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">Live</span>
            </div>
            <div className="space-y-3">
              {[
                ["Food spending increased 34% compared with last month.", "warning"],
                ["Your savings rate dropped from 31% to 24% this month.", "sky"],
                ["You can reduce tax liability through planned 80C investments.", "green"],
                ["Rs. 45,000 in invoices are overdue and need follow-up.", "danger"],
              ].map(([text, tone]) => (
                <div key={text} className={`rounded-2xl border bg-white/[0.035] p-4 text-sm leading-6 text-[var(--text-secondary)] lp-insight-${tone}`}>
                  {text}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="lp-section-label">AI-powered finance platform</div>
            <h2 className="mt-4 font-display text-[32px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[var(--text-primary)] md:text-5xl">
              Your AI finance co-pilot, on demand.
            </h2>
            <p className="mt-5 text-base leading-8 text-[var(--text-secondary)] md:text-lg">
              PaisaMind turns raw records into monthly reports, risk alerts, invoice reminder drafts, and plain-English recommendations for freelancer finance management.
            </p>
            <div className="mt-8 rounded-3xl border border-white/6 bg-white/[0.035] p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Monthly report preview</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {["Income summary", "Expense analysis", "Tax status", "Key action items"].map((item) => (
                  <div key={item} className="rounded-2xl bg-black/15 px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">{item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

    const nav = document.getElementById("lp-navbar");
    const onScroll = () => {
      nav?.classList.toggle("lp-nav-scrolled", window.scrollY > 60);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="lp-shell relative min-h-screen overflow-x-hidden text-[var(--text-primary)]">
      <header id="lp-navbar" className="lp-navbar fixed left-0 right-0 top-0 z-50 h-16">
        <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-3" aria-label="PaisaMind home">
            <img src="/logo.png" alt="PaisaMind logo" className="h-9 w-9 rounded-xl object-cover" />
            <div>
              <div className="font-display text-lg font-bold tracking-[-0.03em] text-[var(--text-primary)]">PaisaMind</div>
              <div className="hidden text-[11px] font-medium text-[var(--text-muted)] sm:block">Finance OS for Indian Freelancers</div>
            </div>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-[var(--text-secondary)] lg:flex">
            <a href="#problem" className="transition hover:text-[var(--text-primary)]">Problem</a>
            <a href="#features" className="transition hover:text-[var(--text-primary)]">Features</a>
            <a href="#tax" className="transition hover:text-[var(--text-primary)]">Tax</a>
            <a href="#testimonials" className="transition hover:text-[var(--text-primary)]">Customers</a>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            <Link to="/login" className="rounded-xl border border-white/8 px-5 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-white/20 hover:text-[var(--text-primary)]">
              Sign In
            </Link>
            <Link to="/register" className="lp-cta-btn inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white">
              Start For Free
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen((value) => !value)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/8 bg-white/[0.04] text-[var(--text-primary)]"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div className="mx-5 rounded-2xl border border-white/8 bg-[rgba(11,17,32,0.94)] p-4 shadow-2xl backdrop-blur-2xl md:hidden">
            <div className="grid gap-2 text-sm font-semibold text-[var(--text-secondary)]">
              {[
                ["Problem", "#problem"],
                ["Features", "#features"],
                ["Tax", "#tax"],
                ["Customers", "#testimonials"],
              ].map(([label, href]) => (
                <a key={label} href={href} className="rounded-xl px-3 py-2 hover:bg-white/[0.04]" onClick={() => setMobileMenuOpen(false)}>
                  {label}
                </a>
              ))}
              <Link to="/login" className="rounded-xl px-3 py-2 hover:bg-white/[0.04]" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              <Link to="/register" className="lp-cta-btn mt-2 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold text-white" onClick={() => setMobileMenuOpen(false)}>
                Start For Free
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="relative min-h-screen overflow-hidden px-5 pb-16 pt-28 md:pt-32">
          <div className="absolute inset-0 -z-10 lp-premium-bg" />
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="reveal visible">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/15 bg-sky-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
                <Sparkles size={14} />
                AI-Powered Finance OS India
              </div>
              <h1 className="mt-7 max-w-4xl font-display text-[42px] font-extrabold leading-[0.98] tracking-[-0.06em] text-[var(--text-primary)] sm:text-6xl lg:text-[72px]">
                The financial <span className="lp-highlight">intelligence</span> platform built for Indian freelancers.
              </h1>
              <p className="mt-7 max-w-2xl text-[17px] leading-8 text-[var(--text-secondary)] md:text-lg">
                PaisaMind is an AI-powered finance platform for income tracking, Indian tax planning software, invoice automation, GST tracker alerts, cash flow forecasting, and smart financial intelligence in one calm dashboard.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link to="/register" className="lp-cta-btn-lg inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-base font-bold text-white">
                  Start For Free
                  <ArrowRight size={18} />
                </Link>
                <a href="#features" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.035] px-7 py-4 text-base font-bold text-[var(--text-primary)] backdrop-blur-xl transition hover:border-sky-400/30 hover:bg-sky-500/10">
                  See Features
                  <BarChart3 size={18} />
                </a>
              </div>
              <div className="mt-8 flex flex-col gap-4 text-sm text-[var(--text-secondary)] sm:flex-row sm:items-center">
                <div className="flex -space-x-2">
                  {["A", "R", "S", "K", "P"].map((letter, index) => (
                    <div key={letter} className={`grid h-9 w-9 place-items-center rounded-full border border-[var(--bg-primary)] text-xs font-bold text-white lp-avatar-${index}`}>
                      {letter}
                    </div>
                  ))}
                </div>
                <div className="h-5 w-px bg-white/10 max-sm:hidden" />
                <div>Trusted by 2,000+ freelancers, creators, and small businesses.</div>
                <div className="font-semibold text-[var(--text-primary)]">Rated 4.9/5</div>
              </div>
            </div>

            <div className="reveal visible relative -mx-5 mt-4 md:mx-0 lg:mt-0">
              <DashboardPreview />
            </div>
          </div>
        </section>

        <section className="lp-stats-strip py-8 backdrop-blur-xl">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-5 md:grid-cols-4">
            {[
              ["Rs. 2.4Cr+", "Income tracked"],
              ["15,000+", "Invoices generated"],
              ["94%", "Tax reminders on time"],
              ["4.9/5", "Average rating"],
            ].map(([value, label]) => (
              <div key={label} className="reveal lp-stat-card rounded-2xl px-4 py-5 text-center">
                <div className="font-display text-3xl font-extrabold tracking-[-0.04em] text-[var(--text-primary)]">{value}</div>
                <div className="mt-1 text-xs font-medium text-[var(--text-muted)]">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="problem" className="lp-section">
          <div className="mx-auto max-w-7xl px-5">
            <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="reveal">
                <SectionHeader
                  align="left"
                  eyebrow="Problem Statement"
                  title="Freelancer finances are more chaotic than they should be."
                  body="Freelancers do not struggle because they are careless. They struggle because modern independent work creates scattered income, irregular cash flow, tax uncertainty, and invisible operating costs."
                />
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {problems.map((problem) => {
                    const Icon = problem.icon;
                    return (
                      <div key={problem.title} className="lp-card p-5">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.04] text-sky-300">
                          <Icon size={20} />
                        </div>
                        <h3 className="mt-4 font-display text-lg font-bold text-[var(--text-primary)]">{problem.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{problem.body}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="reveal">
                <ChaosVisual />
              </div>
            </div>
          </div>
        </section>

        <section id="solution" className="lp-section border-y border-white/6 bg-[var(--bg-surface)]">
          <div className="mx-auto max-w-7xl px-5">
            <div className="reveal">
              <SectionHeader
                eyebrow="Solution Flow"
                title="One platform. Complete financial clarity."
                body="PaisaMind turns daily financial activity into decisions you can trust: track, analyze, predict, and optimize."
              />
            </div>
            <div className="reveal relative mt-14 grid gap-5 lg:grid-cols-4">
              <div className="lp-flow-line hidden lg:block" />
              {flowSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="lp-card relative p-6">
                    <div className="mb-8 flex items-center justify-between">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl border border-sky-400/15 bg-sky-500/10 text-sky-300">
                        <Icon size={21} />
                      </div>
                      <span className="font-display text-5xl font-black leading-none text-white/[0.04]">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{step.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="features" className="lp-section">
          <div className="mx-auto max-w-7xl px-5">
            <div className="reveal">
              <SectionHeader
                eyebrow="Core Features"
                title="Every critical finance workflow, without the accounting clutter."
                body="PaisaMind combines freelancer finance management, invoice automation, GST tracker alerts, cash flow forecasting, AI reports, and goal tracking into a focused operating system."
              />
            </div>
            <div className="mt-16 space-y-20">
              {features.map((feature, index) => (
                <FeatureSpotlight key={feature.title} feature={feature} index={index} />
              ))}
            </div>

            <div className="reveal mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featureGrid.map(([title, body, Icon, tone]) => (
                <div key={title} className="lp-card p-5">
                  <div className={`grid h-10 w-10 place-items-center rounded-2xl lp-icon-bg-${tone}`}>
                    <Icon size={19} />
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold text-[var(--text-primary)]">{title}</h3>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <HealthScoreSection />
        <TaxSection />
        <AiCopilotSection />

        <section id="how-it-works" className="lp-section border-y border-white/6 bg-[var(--bg-surface)]">
          <div className="mx-auto max-w-7xl px-5">
            <div className="reveal">
              <SectionHeader eyebrow="How It Works" title="Up and running in three focused steps." />
            </div>
            <div className="reveal mt-14 grid gap-6 md:grid-cols-3">
              {[
                ["Create your account", "Configure your preferred tax regime, PAN, GST details, and business profile.", UserPlus],
                ["Add income and expenses", "Record transactions manually and let the dashboard shape your monthly picture.", Upload],
                ["Get financial clarity", "Use AI insights, forecasts, reports, and reminders to make stronger decisions.", Bot],
              ].map(([title, body, Icon], index) => (
                <div key={title} className="lp-card relative overflow-hidden p-7">
                  <span className="absolute right-5 top-4 font-display text-6xl font-black leading-none text-white/[0.035]">{String(index + 1).padStart(2, "0")}</span>
                  <div className="relative grid h-12 w-12 place-items-center rounded-2xl border border-sky-400/15 bg-sky-500/10 text-sky-300">
                    <Icon size={21} />
                  </div>
                  <h3 className="relative mt-8 font-display text-xl font-bold text-[var(--text-primary)]">{title}</h3>
                  <p className="relative mt-3 text-sm leading-7 text-[var(--text-secondary)]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="lp-section">
          <div className="mx-auto max-w-7xl px-5">
            <div className="reveal">
              <SectionHeader
                eyebrow="Testimonials"
                title="Real freelancers. Real financial clarity."
                body="PaisaMind is designed for everyday independent operators who need less confusion and more confidence."
              />
            </div>
            <div className="reveal mt-14 grid gap-6 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <figure key={testimonial.name} className="lp-card p-6">
                  <div className="flex items-center gap-3">
                    <div className={`grid h-12 w-12 place-items-center rounded-full text-sm font-bold text-white lp-avatar-${index + 1}`}>
                      {testimonial.initials}
                    </div>
                    <div>
                      <figcaption className="font-display text-base font-bold text-[var(--text-primary)]">{testimonial.name}</figcaption>
                      <div className="text-xs text-[var(--text-muted)]">{testimonial.role} in {testimonial.city}</div>
                    </div>
                  </div>
                  <blockquote className="mt-6 text-sm leading-7 text-[var(--text-secondary)]">"{testimonial.quote}"</blockquote>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-y border-sky-400/10 px-5 py-24 text-center">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.18),transparent_42%),linear-gradient(135deg,rgba(14,165,233,0.08),rgba(139,92,246,0.08))]" />
          <div className="reveal mx-auto max-w-3xl">
            <div className="lp-section-label">Final CTA</div>
            <h2 className="mt-4 font-display text-[34px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[var(--text-primary)] md:text-5xl">
              Start managing your freelance finances smarter.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[var(--text-secondary)] md:text-lg">
              Track income, taxes, invoices, and cash flow in one place with a finance OS for freelancers built around Indian workflows.
            </p>
            <Link to="/register" className="lp-cta-btn-lg mt-9 inline-flex items-center justify-center gap-2 rounded-2xl px-9 py-4 text-base font-bold text-white">
              Get Started Free
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/6 bg-[var(--bg-primary)] px-5 py-12">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_0.8fr_1fr]">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="PaisaMind logo" className="h-9 w-9 rounded-xl object-cover" />
              <div className="font-display text-lg font-bold text-[var(--text-primary)]">PaisaMind</div>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-7 text-[var(--text-muted)]">
              Finance OS for Indian freelancers, creators, solopreneurs, and small businesses.
            </p>
            <div className="mt-5 flex items-center gap-3 text-[var(--text-muted)]">
              <Globe size={18} />
              <span className="text-sm">Built for India-first independent work.</span>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">Product</div>
            <div className="mt-4 grid gap-3 text-sm text-[var(--text-secondary)]">
              <a href="#features" className="hover:text-[var(--text-primary)]">Features</a>
              <a href="#tax" className="hover:text-[var(--text-primary)]">Tax Planner</a>
              <a href="#ai-copilot" className="hover:text-[var(--text-primary)]">AI Reports</a>
              <a href="#health-score" className="hover:text-[var(--text-primary)]">Health Score</a>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">Trust</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["React", "Node.js", "MongoDB", "Express", "Groq AI", "RazorPay", "Resend", "Tailwind"].map((item) => (
                <span key={item} className="rounded-lg border border-white/6 bg-white/[0.035] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">{item}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/6 pt-6 text-xs text-[var(--text-muted)] md:flex-row md:items-center md:justify-between">
          <div>Copyright 2026 PaisaMind. All rights reserved.</div>
          <div className="flex gap-5">
            <a href="#privacy" className="hover:text-[var(--text-secondary)]">Privacy</a>
            <a href="#terms" className="hover:text-[var(--text-secondary)]">Terms</a>
            <a href="#security" className="hover:text-[var(--text-secondary)]">Security</a>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
        <Link to="/register" className="lp-cta-btn flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold text-white shadow-2xl">
          Start For Free
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

export default Landing;
