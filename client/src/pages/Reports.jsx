import { Download, RefreshCcw, TrendingUp, DollarSign, Receipt, PiggyBank, Activity, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
import { formatINR } from "../utils/formatCurrency";
import { calculateHealthScore } from "../utils/healthScore";
import * as aiService from "../services/aiService";
import * as incomeService from "../services/incomeService";
import * as expenseService from "../services/expenseService";
import * as invoiceService from "../services/invoiceService";
import { showToast } from "../components/ui/Toast";
import { useTheme } from "../context/ThemeContext";
import useAuth from "../hooks/useAuth";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const SECTION_META = [
  { key: "incomeSummary",   label: "Income",   icon: DollarSign, color: "emerald", emptyHint: "Add income entries to generate your income summary." },
  { key: "expenseAnalysis", label: "Expenses", icon: Receipt,    color: "rose",    emptyHint: "Log your expenses to see a detailed expense analysis." },
  { key: "taxStatus",       label: "Tax",      icon: TrendingUp, color: "amber",   emptyHint: "Set your tax regime in Settings to get tax insights." },
  { key: "savingsProgress", label: "Savings",  icon: PiggyBank,  color: "sky",     emptyHint: "Track income and expenses consistently to see savings progress." },
];

const COLOR_MAP = {
  emerald: { border: "border-emerald-500/20", bg: "bg-emerald-500/10", icon: "text-emerald-400" },
  rose:    { border: "border-rose-500/20",    bg: "bg-rose-500/10",    icon: "text-rose-400"    },
  amber:   { border: "border-amber-500/20",   bg: "bg-amber-500/10",   icon: "text-amber-400"   },
  sky:     { border: "border-sky-500/20",     bg: "bg-sky-500/10",     icon: "text-sky-400"     },
};

const GRADE_STYLE = {
  A: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  B: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  C: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  D: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  E: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

function SkeletonLine({ w = "w-full", h = "h-3" }) {
  return <div className={`animate-pulse rounded-full bg-[var(--border)] ${w} ${h}`} />;
}

function SectionCard({ meta, content, isLoading }) {
  const c    = COLOR_MAP[meta.color];
  const Icon = meta.icon;
  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-5 flex flex-col gap-3`}>
      <div className="flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--card)] ${c.icon}`}>
          <Icon size={16} />
        </div>
        <h4 className="font-semibold text-[var(--text-primary)]">{meta.label}</h4>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <SkeletonLine />
          <SkeletonLine w="w-4/5" />
          <SkeletonLine w="w-3/5" />
        </div>
      ) : content ? (
        <p className="text-sm leading-6 text-[var(--text-secondary)]">{content}</p>
      ) : (
        <div className="flex items-start gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)]/40 p-3">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
          <p className="text-xs text-[var(--text-muted)]">{meta.emptyHint}</p>
        </div>
      )}
    </div>
  );
}

function downloadPDF(report, history, userName, month, year) {
  const monthName   = MONTHS[month - 1];
  const scoreItem   = history[history.length - 1];
  const score       = scoreItem?.score ?? "\u2014";
  const grade       = scoreItem?.grade ?? "\u2014";

  const actionItems = (report?.keyActionItems || []).length
    ? report.keyActionItems.map((a) => `<li style="margin-bottom:8px;padding-left:4px;color:#334155;">• ${a}</li>`).join("")
    : `<li style="color:#64748b;">No actions recorded \u2014 maintain regular transaction entries for ongoing recommendations.</li>`;

  const sectionHTML = SECTION_META.map((m) => {
    const content = report?.[m.key] || "No data available for this section.";
    return `
      <div style="margin-bottom:16px;padding:14px 16px;border-radius:8px;background:#ffffff;border:1px solid #e2e8f0;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#475569;margin-bottom:6px;">${m.label} Analysis</div>
        <p style="margin:0;font-size:12.5px;line-height:1.6;color:#1e293b;">${content}</p>
      </div>`;
  }).join("");

  const historyRows = history.length
    ? history.map((h) => `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 14px;color:#1e293b;font-weight:500;">${h.month}</td>
          <td style="padding:10px 14px;color:#1e293b;text-align:center;font-family:monospace;font-weight:600;">${h.score}</td>
          <td style="padding:10px 14px;text-align:center;">
            <span style="padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;background:#f1f5f9;color:#0f172a;border:1px solid #cbd5e1;">Grade ${h.grade}</span>
          </td>
        </tr>`).join("")
    : `<tr><td colspan="3" style="padding:14px;color:#94a3b8;text-align:center;">No historical records found</td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Financial Report \u2014 ${monthName} ${year}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, sans-serif; background: #ffffff; color: #0f172a; padding: 48px; line-height: 1.5; font-size: 13px; }
    @media print {
      body { background: #ffffff !important; color: #0f172a !important; padding: 24px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-break { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #0f172a;">
    <div>
      <div style="font-size:20px;font-weight:800;letter-spacing:-0.02em;color:#0f172a;margin-bottom:3px;">FINANCIAL REPORT</div>
      <div style="font-size:12px;color:#475569;">Monthly Financial Audit & Performance Summary</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:15px;font-weight:700;color:#0f172a;">${monthName} ${year}</div>
      <div style="font-size:11.5px;color:#64748b;margin-top:2px;">Account: <strong>${userName}</strong></div>
      <div style="font-size:11.5px;color:#64748b;">Generated: ${new Date().toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}</div>
    </div>
  </div>

  <!-- Health Scorecard Overview -->
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;">
    <div>
      <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#475569;margin-bottom:4px;">Financial Health Index</div>
      <div style="font-size:32px;font-weight:800;color:#0f172a;font-family:monospace;">${score}<span style="font-size:16px;color:#64748b;font-weight:400;"> / 100</span></div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;font-weight:600;color:#64748b;margin-bottom:4px;">Assessment</div>
      <div style="font-size:22px;font-weight:800;color:#0f172a;border:1.5px solid #0f172a;padding:2px 14px;border-radius:6px;display:inline-block;">${grade}</div>
    </div>
  </div>

  <!-- Financial Analysis Sections -->
  <div style="margin-bottom:24px;">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#0f172a;margin-bottom:12px;">Monthly Financial Insights</div>
    ${sectionHTML}
  </div>

  <!-- Key Recommendations -->
  <div class="no-break" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:18px 20px;margin-bottom:24px;">
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#0f172a;margin-bottom:10px;">Recommended Action Items</div>
    <ul style="list-style:none;font-size:12.5px;color:#334155;line-height:1.7;">${actionItems}</ul>
  </div>

  <!-- History Table -->
  <div class="no-break" style="margin-bottom:32px;">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#0f172a;margin-bottom:10px;">Scorecard Trajectory</div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;font-size:12px;">
      <thead>
        <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;">
          <th style="padding:8px 14px;text-align:left;font-weight:600;color:#475569;">MONTH</th>
          <th style="padding:8px 14px;text-align:center;font-weight:600;color:#475569;">SCORE</th>
          <th style="padding:8px 14px;text-align:center;font-weight:600;color:#475569;">RATING</th>
        </tr>
      </thead>
      <tbody>${historyRows}</tbody>
    </table>
  </div>

  <!-- Footer -->
  <div style="margin-top:40px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;display:flex;justify-content:space-between;">
    <div>CONFIDENTIAL &bull; FOR ACCOUNT HOLDER USE ONLY</div>
    <div>Page 1 of 1</div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, "_blank");
  setTimeout(() => {
    if (win) { win.focus(); win.print(); }
    URL.revokeObjectURL(url);
  }, 800);
}

function Reports() {
  const { isDark } = useTheme();
  const { user }   = useAuth();
  const today      = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year,  setYear]  = useState(today.getFullYear());

  const reportQuery        = useQuery({ queryKey: ["monthly-report", month, year], queryFn: () => aiService.getMonthlyReport({ month, year }), retry: 1 });
  const incomeSummaryQuery = useQuery({ queryKey: ["report-income-summary"], queryFn: incomeService.getSummary, retry: 1 });
  const incomeQuery        = useQuery({ queryKey: ["report-income"],   queryFn: () => incomeService.getIncome({}),   retry: 1 });
  const expenseQuery       = useQuery({ queryKey: ["report-expenses"], queryFn: () => expenseService.getExpenses({}), retry: 1 });
  const invoiceQuery       = useQuery({ queryKey: ["report-invoices"], queryFn: invoiceService.getInvoices,           retry: 1 });

  const regenerate = useMutation({
    mutationFn: () => aiService.getMonthlyReport({ month, year }),
    onSuccess:  () => reportQuery.refetch(),
    onError:    () => showToast({ type: "error", title: "Could not regenerate", message: "AI service unavailable. Please try again." }),
  });

  const history = useMemo(() => {
    try {
      const incomeSummary = Array.isArray(incomeSummaryQuery.data?.data) ? incomeSummaryQuery.data.data : [];
      const income   = Array.isArray(incomeQuery.data?.data)  ? incomeQuery.data.data  : [];
      const expenses = Array.isArray(expenseQuery.data?.data) ? expenseQuery.data.data : [];
      const invoices = Array.isArray(invoiceQuery.data?.data) ? invoiceQuery.data.data : [];
      return incomeSummary.map((item) => {
        const mIncome   = income.filter((e)   => new Date(e.date).toLocaleString("en-IN", { month: "short" }) === item.month);
        const mExpenses = expenses.filter((e) => new Date(e.date).toLocaleString("en-IN", { month: "short" }) === item.month);
        const result    = calculateHealthScore(mIncome, mExpenses, invoices, []);
        return {
          month: item.month,
          score: typeof result === "object" ? (result.score ?? 0) : (result ?? 0),
          grade: typeof result === "object" ? (result.grade ?? "\u2014") : "\u2014",
        };
      });
    } catch (err) {
      console.error("Health score history error:", err);
      return [];
    }
  }, [expenseQuery.data, incomeQuery.data, incomeSummaryQuery.data, invoiceQuery.data]);

  const currentIncome = useMemo(() => {
    const list = Array.isArray(incomeQuery.data?.data) ? incomeQuery.data.data : [];
    return list
      .filter((e) => new Date(e.date).getMonth() + 1 === month && new Date(e.date).getFullYear() === year)
      .reduce((s, e) => s + Number(e.amount || 0), 0);
  }, [incomeQuery.data, month, year]);

  const currentExpense = useMemo(() => {
    const list = Array.isArray(expenseQuery.data?.data) ? expenseQuery.data.data : [];
    return list
      .filter((e) => new Date(e.date).getMonth() + 1 === month && new Date(e.date).getFullYear() === year)
      .reduce((s, e) => s + Number(e.amount || 0), 0);
  }, [expenseQuery.data, month, year]);

  const latestScore     = history.length ? history[history.length - 1] : null;
  const report          = reportQuery.data?.data?.sections;
  const isReportLoading = reportQuery.isLoading;
  const hasSomeData     = currentIncome > 0 || currentExpense > 0;

  const tooltipStyle = {
    background:   isDark ? "#111827" : "#ffffff",
    border:       isDark ? "1px solid #374151" : "1px solid #cbd5e1",
    borderRadius: "12px",
    color:        isDark ? "#f8fafc" : "#0f172a",
    fontSize:     "13px",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-sm text-[var(--text-secondary)]">Narrative monthly reports and your health score trend.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="pm-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <input className="pm-input !w-24" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
      </div>

      {/* Snapshot Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Income",     value: formatINR(currentIncome),                               color: "text-emerald-400", icon: DollarSign },
          { label: "Expenses",   value: formatINR(currentExpense),                              color: "text-rose-400",    icon: Receipt    },
          { label: "Net Saving", value: formatINR(Math.max(currentIncome - currentExpense, 0)), color: "text-sky-400",     icon: PiggyBank  },
          { label: "Health",     value: latestScore ? `${latestScore.score} / 100` : "\u2014",  color: "text-violet-400",  icon: Activity   },
        ].map((s) => (
          <div key={s.label} className="pm-card flex flex-col gap-1 !p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-muted)]">{s.label}</span>
              <s.icon size={14} className={s.color} />
            </div>
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="text-xs text-[var(--text-muted)]">{MONTHS[month - 1]} {year}</span>
          </div>
        ))}
      </div>

      {/* AI Report Card */}
      <div className="pm-card">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold">AI Monthly Report</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">Fresh breakdown across income, expenses, tax and savings.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              className="pm-button pm-button-ghost flex items-center gap-2 text-sm"
              onClick={() => regenerate.mutate()}
              disabled={regenerate.isPending}
            >
              <RefreshCcw size={15} className={regenerate.isPending ? "animate-spin" : ""} />
              {regenerate.isPending ? "Regenerating\u2026" : "Regenerate"}
            </button>
            <button
              className="pm-button pm-button-primary flex items-center gap-2 text-sm"
              onClick={() => {
                downloadPDF(report, history, user?.name || user?.displayName || "User", month, year);
                showToast({ type: "success", title: "PDF Ready", message: "Click \u2018Save as PDF\u2019 in the print dialog." });
              }}
            >
              <Download size={15} />
              Download PDF
            </button>
          </div>
        </div>

        {/* Amber warning when no data at all */}
        {!hasSomeData && !isReportLoading && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
            <AlertCircle size={16} className="shrink-0 text-amber-400" />
            <p className="text-sm text-amber-300">
              No financial data for {MONTHS[month - 1]} {year} yet.
              <span className="ml-1 font-medium">Add income or expense entries to generate a full AI report.</span>
            </p>
          </div>
        )}

        {reportQuery.isError ? (
          <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-400">
            AI report unavailable \u2014 the AI service may be down or your API key may be missing. Your financial data above is still accurate.
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {SECTION_META.map((meta) => (
                <SectionCard key={meta.key} meta={meta} content={report?.[meta.key]} isLoading={isReportLoading} />
              ))}
            </div>

            {/* Key Actions */}
            <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <h4 className="font-semibold text-emerald-300">Key Actions</h4>
              </div>
              {isReportLoading ? (
                <div className="space-y-2">
                  <SkeletonLine w="w-3/4" />
                  <SkeletonLine w="w-2/3" />
                  <SkeletonLine w="w-1/2" />
                </div>
              ) : (
                <ul className="space-y-2">
                  {(report?.keyActionItems || []).length > 0
                    ? report.keyActionItems.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                          <ArrowRight size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                          {item}
                        </li>
                      ))
                    : (
                        <li className="flex items-start gap-2 text-sm">
                          <AlertCircle size={14} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
                          <span className="text-[var(--text-muted)]">No actions suggested yet. Add more financial data to get personalised recommendations.</span>
                        </li>
                      )}
                </ul>
              )}
            </div>
          </>
        )}
      </div>

      {/* Health Score History */}
      <div className="pm-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Health Score History</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">Track your financial health grade over time.</p>
          </div>
          {latestScore && (
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-bold ${GRADE_STYLE[latestScore.grade] || GRADE_STYLE["C"]}`}>
              <Activity size={14} />
              Grade {latestScore.grade}{'\u00b7'}{latestScore.score}/100
            </div>
          )}
        </div>

        <div className="h-72">
          {history.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <Activity size={36} className="text-[var(--border)]" />
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)]">No history yet</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Log income and expenses across at least 2 months to see your health score trend.</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1f2937" : "#e5e7eb"} vertical={false} />
                <XAxis dataKey="month" stroke="#6B7280" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#6B7280" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <ReferenceLine y={85} stroke="#10b981" strokeDasharray="4 4" label={{ value: "A", fill: "#10b981", fontSize: 11 }} />
                <ReferenceLine y={70} stroke="#38bdf8" strokeDasharray="4 4" label={{ value: "B", fill: "#38bdf8", fontSize: 11 }} />
                <Tooltip
                  formatter={(value, _name, props) => [`${value}/100 \u00b7 Grade ${props.payload?.grade}`, "Health Score"]}
                  contentStyle={tooltipStyle}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  fill="url(#scoreGradient)"
                  dot={{ r: 5, fill: "#8B5CF6", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 7, fill: "#a78bfa" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Grade legend */}
        {history.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3 border-t border-[var(--border)] pt-4">
            {["A","B","C","D","E"].map((g) => {
              const ranges  = { A: "\u226585", B: "\u226570", C: "\u226555", D: "\u226540", E: "<40" };
              const colors  = { A: "bg-emerald-400", B: "bg-sky-400", C: "bg-amber-400", D: "bg-orange-400", E: "bg-rose-400" };
              return (
                <div key={g} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <span className={`inline-block h-2 w-2 rounded-full ${colors[g]}`} />
                  Grade {g} ({ranges[g]})
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
