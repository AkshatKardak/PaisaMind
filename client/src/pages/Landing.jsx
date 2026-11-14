import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import ThemeToggle from "../components/ui/ThemeToggle";
import { formatINR } from "../utils/formatCurrency";

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [calcIncome, setCalcIncome] = useState(2400000);

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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-[var(--bg-primary)] border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="PaisaMind" className="h-8 w-auto object-contain" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[var(--text-secondary)]">
            <a href="#problems" className="hover:text-[var(--text-primary)] transition-colors">The Problem</a>
            <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">Capabilities</a>
            <a href="#tax-engine" className="hover:text-[var(--text-primary)] transition-colors">Section 44ADA</a>
            <a href="#comparison" className="hover:text-[var(--text-primary)] transition-colors">Comparison</a>
            <a href="#faq" className="hover:text-[var(--text-primary)] transition-colors">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Link
              to="/login"
              className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
            >
              <span>Start Free</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3 text-sm">
            <a href="#problems" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-[var(--text-secondary)]">The Problem</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-[var(--text-secondary)]">Capabilities</a>
            <a href="#tax-engine" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-[var(--text-secondary)]">Section 44ADA</a>
            <a href="#comparison" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-[var(--text-secondary)]">Comparison</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-[var(--text-secondary)]">FAQ</a>
            <div className="pt-2 border-t border-[var(--border)] flex gap-2">
              <Link to="/login" className="flex-1 py-2 text-center text-xs border border-[var(--border)] rounded-md text-[var(--text-secondary)]">Sign In</Link>
              <Link to="/register" className="flex-1 py-2 text-center text-xs bg-emerald-600 text-white rounded-md font-semibold">Start Free</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero Section ── */}
      <section className="py-16 lg:py-24 border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-block px-3 py-1 rounded border border-[var(--border)] bg-[var(--bg-card)] text-xs text-[var(--text-secondary)]">
                Built for Indian freelancers
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[var(--text-primary)] leading-[1.15]">
                Financial tracking and tax planning for Indian freelancers.
              </h1>

              <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-lg leading-relaxed font-normal">
                Track income, reconcile TDS against Form 26AS, and compare Section 44ADA with the new regime.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs inline-flex items-center gap-2 transition-colors"
                >
                  <span>Start Free</span>
                  <ArrowRight size={14} />
                </Link>
                <a
                  href="#features"
                  className="px-5 py-2.5 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-xs inline-flex items-center gap-2 transition-colors"
                >
                  <span>View capabilities</span>
                </a>
              </div>

              <div className="pt-4 text-xs text-[var(--text-muted)] border-t border-[var(--border)] max-w-md">
                Client-side parsing by default. Files stay on your device. Zero net banking credentials requested.
              </div>
            </div>

            {/* Right Column: Dashboard Card */}
            <div className="lg:col-span-6">
              <div className="rounded-lg p-5 bg-[var(--bg-card)] border border-[var(--border)] space-y-4 text-left">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                  <div>
                    <div className="text-[10px] font-mono tracking-wider text-[var(--text-muted)] uppercase">
                      Overview
                    </div>
                    <div className="text-base font-semibold text-[var(--text-primary)]">
                      {currentMonthName} ledger
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">
                    Sample data
                  </span>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Net Income</span>
                      <span className="text-[9px] font-mono text-[var(--text-muted)]">Sample data</span>
                    </div>
                    <div className="text-lg font-semibold font-mono tabular-nums text-[var(--text-primary)]">
                      ₹5,14,000
                    </div>
                    <div className="text-[10px] text-emerald-500 font-medium">
                      +9% vs last month
                    </div>
                  </div>

                  <div className="p-3 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Cash Runway</span>
                      <span className="text-[9px] font-mono text-[var(--text-muted)]">Sample data</span>
                    </div>
                    <div className="text-lg font-semibold font-mono tabular-nums text-[var(--text-primary)]">
                      4.2 months
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      Based on current burn
                    </div>
                  </div>
                </div>

                {/* GST Threshold Progress */}
                <div className="p-3 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--text-secondary)] font-medium">GST exemption threshold</span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">Sample data</span>
                  </div>
                  <div className="w-full bg-[var(--border)] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: "82%" }} />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono tabular-nums text-[var(--text-muted)]">
                    <span>₹16,40,000 logged</span>
                    <span>₹20,00,000 threshold (82%)</span>
                  </div>
                </div>

                {/* Notes */}
                <div className="p-3 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2 text-xs">
                  <div className="text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                    Notes
                  </div>
                  <div className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] text-xs leading-relaxed">
                    Estimated tax under Section 44ADA is ₹42,000 lower than standard rates for current gross receipts.
                  </div>
                  <div className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] text-xs leading-relaxed">
                    Form 26AS shows ₹18,500 unclaimed TDS credit under Section 194J from Q2 invoice settlement.
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-1 pt-1 text-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-[var(--border)]">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Recent transactions
                    </span>
                    <span className="text-[9px] font-mono text-[var(--text-muted)]">Sample data</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-[var(--border)] text-xs">
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">Client settlement</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Bank transfer</div>
                    </div>
                    <span className="text-emerald-500 font-mono font-semibold tabular-nums">+₹75,000</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 text-xs">
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">Cloud hosting</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Recurring debit</div>
                    </div>
                    <span className="text-[var(--text-secondary)] font-mono tabular-nums">-₹6,200</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Problem Section (Numbered Ledger) ── */}
      <section id="problems" className="py-16 lg:py-24 border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-left mb-12">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
              The problem
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)] max-w-[60ch] leading-tight">
              Where freelance money breaks
            </h2>
          </div>

          <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {/* Row 01 */}
            <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-1 font-mono text-xs text-[var(--text-muted)] pt-0.5">
                01
              </div>
              <div className="md:col-span-4 text-base font-semibold text-[var(--text-primary)]">
                Income lands in five places
              </div>
              <div className="md:col-span-7 text-sm text-[var(--text-secondary)] max-w-[68ch] leading-relaxed">
                A salary arrives as one payslip. Freelance income arrives as UPI credits, NEFT
                transfers, gateway settlements and the occasional cheque. Nothing reconciles itself.
              </div>
            </div>

            {/* Row 02 */}
            <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-1 font-mono text-xs text-[var(--text-muted)] pt-0.5">
                02
              </div>
              <div className="md:col-span-4 text-base font-semibold text-[var(--text-primary)]">
                TDS leaves before you see it
              </div>
              <div className="md:col-span-7 text-sm text-[var(--text-secondary)] max-w-[68ch] leading-relaxed">
                A client pays ₹1,00,000 and ₹10,000 is deducted under 194J. That credit sits with the
                government until you claim it, and most freelancers never claim all of it.
              </div>
            </div>

            {/* Row 03 */}
            <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-1 font-mono text-xs text-[var(--text-muted)] pt-0.5">
                03
              </div>
              <div className="md:col-span-4 text-base font-semibold text-[var(--text-primary)]">
                44ADA is a decision, not a default
              </div>
              <div className="md:col-span-7 text-sm text-[var(--text-secondary)] max-w-[68ch] leading-relaxed">
                Declaring 50% of receipts as profit is permitted up to ₹75 lakh. Whether it beats the
                new regime depends on your numbers, and almost nobody runs both.
              </div>
            </div>

            {/* Row 04 */}
            <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-1 font-mono text-xs text-[var(--text-muted)] pt-0.5">
                04
              </div>
              <div className="md:col-span-4 text-base font-semibold text-[var(--text-primary)]">
                The GST line arrives unannounced
              </div>
              <div className="md:col-span-7 text-sm text-[var(--text-secondary)] max-w-[68ch] leading-relaxed">
                Registration becomes mandatory past ₹20 lakh turnover. Crossing it unnoticed means
                retrospective demands and penalties.
              </div>
            </div>
          </div>

          <div className="mt-6 text-xs text-[var(--text-muted)] text-left">
            PaisaMind handles 01 through 04. Everything else it does is in service of those four.
          </div>
        </div>
      </section>

      {/* ── Capabilities Section ── */}
      <section id="features" className="py-16 lg:py-24 border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-left">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Capabilities
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]">
              Built around freelance compliance
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] space-y-3">
              <div className="text-xs font-mono text-[var(--text-muted)]">01 / INGESTION</div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Paste box & browser PDF parsing
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Paste bank transaction SMS messages directly into the parser. Bank statement PDFs are parsed entirely inside your browser using pdf.js; raw statement files are not uploaded to servers.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] space-y-3">
              <div className="text-xs font-mono text-[var(--text-muted)]">02 / TAX RECONCILIATION</div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Form 26AS / AIS 3-bucket match
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Upload your annual 26AS or AIS PDF to extract Section 194J, 194C, and 194H entries. Reconciles into matched credits, unclaimed TDS you forgot, and invoices missing credit.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] space-y-3">
              <div className="text-xs font-mono text-[var(--text-muted)]">03 / INVOICING</div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Direct UPI intent & QR codes
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Generate client-side UPI QR codes and upi:// payment links directly tied to your VPA. Zero gateway transaction fees and instant settlement to your primary account.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] space-y-3">
              <div className="text-xs font-mono text-[var(--text-muted)]">04 / TAX PLANNING</div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Section 44ADA vs New Regime
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Calculate tax under the 50% presumptive taxation rules of Section 44ADA alongside the New Tax Regime, showing every line item and deduction threshold explicitly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive 44ADA Calculator Section ── */}
      <section id="tax-engine" className="py-16 lg:py-24 border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-left">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Tax Comparison
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]">
              Section 44ADA presumptive tax calculator
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Specified professionals with gross freelance receipts up to ₹75 Lakh can declare 50% as taxable profit.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-[var(--text-secondary)]">Annual Gross Freelance Receipts</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">Sample data</span>
                  <span className="font-mono text-sm tabular-nums text-[var(--text-primary)]">{formatINR(calcIncome)}</span>
                </div>
              </div>
              <input
                type="range"
                min={600000}
                max={7500000}
                step={100000}
                value={calcIncome}
                onChange={(e) => setCalcIncome(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
                aria-label="Annual Gross Freelance Receipts Slider"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] space-y-1">
                <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] uppercase font-semibold">
                  <span>Deemed Profit (50%)</span>
                  <span className="font-mono text-[9px]">Sample data</span>
                </div>
                <div className="text-base font-semibold font-mono tabular-nums text-[var(--text-primary)]">
                  {formatINR(deemedProfit)}
                </div>
              </div>
              <div className="p-4 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] space-y-1">
                <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] uppercase font-semibold">
                  <span>Tax under Sec 44ADA</span>
                  <span className="font-mono text-[9px]">Sample data</span>
                </div>
                <div className="text-base font-semibold font-mono tabular-nums text-[var(--text-primary)]">
                  {formatINR(adaTax)}
                </div>
              </div>
              <div className="p-4 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] space-y-1">
                <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] uppercase font-semibold">
                  <span>Estimated Difference</span>
                  <span className="font-mono text-[9px]">Sample data</span>
                </div>
                <div className="text-base font-semibold font-mono tabular-nums text-emerald-500">
                  {formatINR(estimatedSavings)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section id="comparison" className="py-16 lg:py-24 border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-left">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Comparison
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]">
              Comparison with general tools
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs bg-[var(--bg-card)] rounded-lg border border-[var(--border)] overflow-hidden">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-primary)] bg-[var(--bg-elevated)]">
                  <th className="p-4 font-semibold">Task</th>
                  <th className="p-4 font-semibold text-emerald-500">PaisaMind</th>
                  <th className="p-4 font-semibold text-[var(--text-muted)]">Spreadsheets</th>
                  <th className="p-4 font-semibold text-[var(--text-muted)]">Traditional Accounting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text-secondary)]">
                <tr>
                  <td className="p-4 font-medium text-[var(--text-primary)]">Section 44ADA presumptive calculation</td>
                  <td className="p-4 text-emerald-500 font-medium">Automatic comparison against new regime</td>
                  <td className="p-4 text-[var(--text-muted)]">Manual formula creation</td>
                  <td className="p-4 text-[var(--text-muted)]">Requires manual accountant entry</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-[var(--text-primary)]">Form 26AS / AIS TDS reconciliation</td>
                  <td className="p-4 text-emerald-500 font-medium">3-bucket automated match</td>
                  <td className="p-4 text-[var(--text-muted)]">Manual VLOOKUP</td>
                  <td className="p-4 text-[var(--text-muted)]">Separate tax software needed</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-[var(--text-primary)]">Direct UPI payment invoices</td>
                  <td className="p-4 text-emerald-500 font-medium">Client-side upi:// QR (0% fee)</td>
                  <td className="p-4 text-[var(--text-muted)]">Manual UPI ID copy</td>
                  <td className="p-4 text-[var(--text-muted)]">Payment gateway fee (2-3%)</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-[var(--text-primary)]">Bank transaction ingestion</td>
                  <td className="p-4 text-emerald-500 font-medium">In-browser parsing & SMS paste box</td>
                  <td className="p-4 text-[var(--text-muted)]">Manual CSV typing</td>
                  <td className="p-4 text-[var(--text-muted)]">Bank portal scraping or feeds</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section id="faq" className="py-16 lg:py-24 border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-left">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              FAQ
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] space-y-1.5">
              <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                Who qualifies for Section 44ADA presumptive taxation?
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Specified professionals under Section 44AA(1) — including software engineers, technical consultants, UI/UX designers, legal, medical, and accounting professionals — whose gross receipts do not exceed ₹75 Lakh in a financial year (where cash receipts do not exceed 5%).
              </p>
            </div>

            <div className="p-5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] space-y-1.5">
              <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                Are bank statements uploaded to a server?
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                No. Standard bank statements and PDFs are parsed locally in your browser using client-side JavaScript. Only the extracted transaction rows sync to your account, and only after your explicit confirmation.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] space-y-1.5">
              <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                Does PaisaMind require my bank login or net banking password?
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Never. PaisaMind never asks for net banking credentials and does not scrape banking portals. Data is ingested solely via the paste box, browser PDF parser, or manual entry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Call To Action ── */}
      <section className="py-16 lg:py-24 border-b border-[var(--border)] text-left">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]">
            Ready to track income and reconcile tax?
          </h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-lg">
            Track income, match Form 26AS credits, and calculate presumptive tax.
          </p>
          <div className="pt-2">
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs inline-flex items-center gap-2 transition-colors"
            >
              <span>Start Free</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 bg-[var(--bg-card)] text-xs text-[var(--text-muted)] text-left">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <Link to="/">
                <img src="/logo.png" alt="PaisaMind" className="h-7 w-auto object-contain" />
              </Link>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Financial tracking and tax planning for Indian freelancers.
              </p>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-[var(--text-primary)] text-xs uppercase tracking-wider">Compliance</div>
              <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
                <li>Section 44ADA Presumptive Tax</li>
                <li>Section 194J / 194C TDS Reconciliation</li>
                <li>GST ₹20 Lakh Threshold Tracker</li>
                <li>Direct UPI Invoicing</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-[var(--text-primary)] text-xs uppercase tracking-wider">Statutory Notice</div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                PaisaMind is an analytical tool for freelance financial record-keeping and tax estimation under the Indian Income-tax Act. It does not provide legal or certified audit advice.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px]">
            <div>
              &copy; {new Date().getFullYear()} PaisaMind.
            </div>
            <div className="flex gap-4">
              <Link to="/login" className="hover:text-[var(--text-primary)] transition-colors">Sign In</Link>
              <Link to="/register" className="hover:text-[var(--text-primary)] transition-colors">Register</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
