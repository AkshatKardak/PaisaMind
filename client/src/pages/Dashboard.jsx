import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  ArrowRight,
  IndianRupee,
  Activity,
  RefreshCw,
  Sliders,
  FileSpreadsheet,
  PieChart as PieIcon,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import useAuth from "../hooks/useAuth";
import useFinancialData from "../hooks/useFinancialData";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import { showToast } from "../components/ui/Toast";
import { useTheme } from "../context/ThemeContext";
import { formatINR } from "../utils/formatCurrency";
import * as aiService from "../services/aiService";
import * as incomeService from "../services/incomeService";
import * as expenseService from "../services/expenseService";
import * as invoiceService from "../services/invoiceService";
import { analyticsService } from "../services/analyticsService";

const CHART_COLORS = ["#0891b2", "#6366f1", "#059669", "#ea580c", "#7c3aed", "#db2777"];

/* ── KPI Card ── */
function KPI({ title, value, subtext, icon: Icon, accent, to }) {
  const content = (
    <div
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: `${accent}18`, color: accent }}
        >
          <Icon size={17} />
        </div>
        {to && (
          <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: accent }} />
        )}
      </div>
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)", letterSpacing: "0.12em" }}
        >
          {title}
        </p>
        <p className="mt-1 text-2xl font-extrabold tracking-tight tabular-nums" style={{ color: accent }}>
          {value}
        </p>
        {subtext && (
          <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
            {subtext}
          </p>
        )}
      </div>
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : content;
}

/* ── Section label ── */
function SectionLabel({ children, color }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
      style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {children}
    </span>
  );
}

/* ── Card wrapper ── */
function Card({ children, className = "", accentGlow }) {
  return (
    <div
      className={`rounded-2xl p-6 ${className}`}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        boxShadow: accentGlow
          ? `0 0 0 1px var(--border-default), 0 8px 32px ${accentGlow}14`
          : "var(--shadow-card)",
      }}
    >
      {children}
    </div>
  );
}

/* ── AI Insight Card ── */
function AIInsightCard({ insight, type, onDismiss }) {
  const map = { warning: { color: "#d97706" }, danger: { color: "#dc2626" }, success: { color: "#059669" } };
  const { color } = map[type] || map.success;
  return (
    <div
      className="relative overflow-hidden rounded-xl px-4 py-3 text-xs leading-relaxed"
      style={{ background: `${color}0c`, border: `1px solid ${color}22` }}
    >
      <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-xl" style={{ background: color }} />
      <div className="flex items-start justify-between gap-3 pl-1">
        <p style={{ color: "var(--text-primary)" }}>{insight}</p>
        <button onClick={onDismiss} className="shrink-0 transition-opacity hover:opacity-60" style={{ color: "var(--text-muted)" }}>
          x
        </button>
      </div>
    </div>
  );
}

/* ── GST Threshold Widget ── */
function GSTWidget({ gstData }) {
  if (!gstData) return null;

  const { annualRevenue, threshold, percentage, fyLabel, warning, registered } = gstData;
  const barColor = registered ? "#dc2626" : warning ? "#d97706" : "#059669";
  const labelColor = registered ? "#dc2626" : warning ? "#d97706" : "#64748b";

  return (
    <Card accentGlow={warning || registered ? barColor : undefined}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <SectionLabel color={barColor}>GST Tracker</SectionLabel>
          <h3 className="mt-2 text-base font-bold" style={{ color: "var(--text-primary)" }}>
            Annual Revenue vs Threshold
          </h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {fyLabel || "FY 2025-26"} · Limit ₹20,00,000
          </p>
        </div>
        {registered && (
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
            style={{ background: "#dc262615", color: "#dc2626", border: "1px solid #dc262625" }}
          >
            GST Required
          </span>
        )}
        {!registered && warning && (
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
            style={{ background: "#d9780615", color: "#d97706", border: "1px solid #d9780625" }}
          >
            80% Crossed
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Annual Revenue</p>
          <p className="text-xl font-extrabold tabular-nums mt-0.5" style={{ color: "var(--text-primary)" }}>
            {formatINR(annualRevenue || 0)}
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Remaining Headroom</p>
          <p className="text-xl font-extrabold tabular-nums mt-0.5" style={{ color: barColor }}>
            {formatINR(Math.max(0, (threshold || 2000000) - (annualRevenue || 0)))}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 w-full overflow-hidden rounded-full" style={{ background: "var(--bg-elevated)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, percentage || 0)}%`, background: barColor }}
        />
        <div
          className="absolute top-0 h-full w-px"
          style={{ left: "80%", background: "#d97706", opacity: 0.7 }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
        <span>₹0</span>
        <span style={{ color: labelColor, fontWeight: 700 }}>{percentage || 0}% used</span>
        <span>₹20L</span>
      </div>

      {registered && (
        <p className="mt-3 text-xs rounded-xl px-3 py-2" style={{ background: "#dc262610", color: "#dc2626" }}>
          You have crossed ₹20L. You must register for GST. Consult a CA immediately.
        </p>
      )}
      {!registered && warning && (
        <p className="mt-3 text-xs rounded-xl px-3 py-2" style={{ background: "#d9780610", color: "#d97706" }}>
          You are above 80% of the GST threshold. Consider speaking to a CA about registration.
        </p>
      )}
    </Card>
  );
}

/* ═════════════════ DASHBOARD ═════════════════ */
export default function Dashboard() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [dismissed, setDismissed] = useState([]);
  const financialData = useFinancialData();

  const incomeQuery = useQuery({ queryKey: ["dashboard-income"], queryFn: () => incomeService.getIncome({}) });
  const expenseQuery = useQuery({ queryKey: ["dashboard-expenses"], queryFn: () => expenseService.getExpenses({}) });
  const invoiceQuery = useQuery({ queryKey: ["dashboard-invoices"], queryFn: invoiceService.getInvoices });
  const insightsQuery = useQuery({ queryKey: ["dashboard-insights"], queryFn: () => aiService.getInsights({}) });
  const gstQuery = useQuery({ queryKey: ["dashboard-gst"], queryFn: incomeService.getGSTStatus });
  const healthQuery = useQuery({ queryKey: ["dashboard-health-engine"], queryFn: analyticsService.getFinancialHealth });
  const runwayQuery = useQuery({ queryKey: ["dashboard-runway"], queryFn: analyticsService.getRunway });
  const anomaliesQuery = useQuery({ queryKey: ["dashboard-anomalies"], queryFn: () => analyticsService.getAnomalies(3) });

  const reportMutation = useMutation({
    mutationFn: () => aiService.getMonthlyReport({}),
    onSuccess: () => showToast({ type: "success", title: "AI report generated", message: "Fresh insights are ready in Reports." }),
    onError: (e) => showToast({ type: "error", title: "Could not generate", message: e.response?.data?.message || "Please try again." }),
  });

  const incomeItems = Array.isArray(incomeQuery.data?.data) ? incomeQuery.data.data : [];
  const expenseItems = Array.isArray(expenseQuery.data?.data) ? expenseQuery.data.data : [];
  const invoiceItems = Array.isArray(invoiceQuery.data?.data) ? invoiceQuery.data.data : [];
  const expenseSummary = Array.isArray(financialData.expenseSummary) ? financialData.expenseSummary : [];
  const gstData = gstQuery.data?.data ?? null;
  const deterministicHealth = healthQuery.data?.data;
  const runwayData = runwayQuery.data?.data;
  const anomaliesData = anomaliesQuery.data?.data?.anomalies || [];

  // Robust, chronological 6-month continuous aggregation from actual income and expense records
  const incomeSeries = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString("en-IN", { month: "short" });
      const year = d.getFullYear();
      const monthNum = d.getMonth();

      const monthIncome = incomeItems
        .filter((item) => {
          const dt = new Date(item.date);
          return !isNaN(dt) && dt.getMonth() === monthNum && dt.getFullYear() === year;
        })
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      const monthExpense = expenseItems
        .filter((item) => {
          const dt = new Date(item.date);
          return !isNaN(dt) && dt.getMonth() === monthNum && dt.getFullYear() === year;
        })
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      months.push({
        month: monthLabel,
        income: monthIncome,
        expense: monthExpense,
        net: monthIncome - monthExpense,
      });
    }
    return months;
  }, [incomeItems, expenseItems]);

  const totalIncome = incomeItems.reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalExpenses = expenseItems.reduce((s, i) => s + Number(i.amount || 0), 0);
  const netProfit = totalIncome - totalExpenses;

  const healthScore = deterministicHealth?.totalScore ?? (totalIncome > 0 ? 74 : 50);
  const healthGrade = deterministicHealth?.grade ?? (healthScore >= 80 ? "EXCELLENT" : healthScore >= 65 ? "GOOD" : "FAIR");
  const scoreColor = healthScore >= 75 ? "#059669" : healthScore >= 50 ? "#d97706" : "#dc2626";

  const expectedRunway = runwayData?.expectedRunwayMonths ?? (totalExpenses > 0 ? (totalIncome / totalExpenses).toFixed(1) : 0);

  const recentTransactions = [
    ...incomeItems.map((i) => ({ ...i, type: "income", title: i.source })),
    ...expenseItems.map((i) => ({ ...i, type: "expense", title: i.title })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const alertBanners = useMemo(() => {
    const overdueInvoices = invoiceItems.filter((inv) => inv.status === "Overdue");
    const alerts = [];

    if (anomaliesData.length > 0) {
      alerts.push({
        type: "warning",
        text: `${anomaliesData.length} spending spike${anomaliesData.length > 1 ? "s" : ""} detected this month. Review anomalies to stay on budget.`,
        to: "/anomalies",
      });
    }

    if (expectedRunway > 0 && expectedRunway < 2) {
      alerts.push({
        type: "warning",
        text: `Cash runway is ${expectedRunway} months. Tighten discretionary expenses or accelerate client invoice collections.`,
        to: "/simulator",
      });
    }

    if (overdueInvoices.length > 0) {
      alerts.push({
        type: "warning",
        text: `${overdueInvoices.length} invoice${overdueInvoices.length > 1 ? "s are" : " is"} overdue. Check client payment risk.`,
        to: "/invoices",
      });
    }

    return alerts;
  }, [anomaliesData, expectedRunway, invoiceItems]);

  const firstName = useMemo(() => {
    const name = user?.name || user?.displayName || "";
    if (name && name !== "PaisaMind User") return name.split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
    return "there";
  }, [user]);

  const tooltipStyle = {
    background: isDark ? "#1e293b" : "#ffffff",
    border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
    borderRadius: "12px",
    color: isDark ? "#e2e8f0" : "#1e293b",
    fontSize: 12,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  };
  const axisTickColor = isDark ? "#64748b" : "#94a3b8";
  const gridStroke = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";

  return (
    <div className="space-y-5 pb-12">
      {/* ── Alert banners ── */}
      {alertBanners.map((b, idx) => (
        <Link
          key={idx}
          to={b.to || "#"}
          className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm transition-all hover:opacity-90"
          style={{
            background: b.type === "danger" ? "var(--danger-soft)" : "var(--warning-soft)",
            border: b.type === "danger" ? "1px solid var(--danger-border)" : "1px solid var(--warning-border)",
            color: b.type === "danger" ? "var(--danger)" : "var(--warning)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{b.text}</span>
          </div>
          <ArrowRight size={14} className="shrink-0 opacity-70" />
        </Link>
      ))}

      {/* ── Hero Banner with Copilot & Intelligence Actions ── */}
      <Card>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--primary)", letterSpacing: "0.14em" }}>
                AI Financial OS
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                Grounded Intelligence
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Hey, <span style={{ color: "var(--primary)" }}>{firstName}</span>
            </h1>
            <p className="mt-1 max-w-lg text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Your financial decision engine is live with deterministic tax calculations, 95% cash forecasts, and AI tool calling.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/copilot"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20"
            >
              <Sparkles size={14} />
              <span>Ask Copilot</span>
            </Link>
            <Link
              to="/simulator"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold text-xs transition-all"
            >
              <Sliders size={14} className="text-indigo-500" />
              <span>Simulate Scenario</span>
            </Link>
            <button
              onClick={() => reportMutation.mutate()}
              disabled={reportMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] text-xs font-medium transition-all"
            >
              <RefreshCw size={13} className={reportMutation.isPending ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </Card>

      {/* ── KPI Row (5 Key Metrics) ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KPI title="Total Income" value={formatINR(totalIncome)} icon={TrendingUp} accent="#0891b2" to="/income" />
        <KPI title="Total Expenses" value={formatINR(totalExpenses)} icon={TrendingDown} accent="#dc2626" to="/expenses" />
        <KPI title="Net Profit" value={formatINR(netProfit)} icon={IndianRupee} accent={netProfit >= 0 ? "#059669" : "#dc2626"} />
        <KPI title="Health Score" value={`${healthScore} / 100`} subtext={`Grade: ${healthGrade}`} icon={Activity} accent={scoreColor} to="/health" />
        <KPI title="Cash Runway" value={`${expectedRunway} mo`} subtext="Expected Buffer" icon={Wallet} accent="#8b5cf6" to="/simulator" />
      </div>

      {/* ── GST Widget — only renders when data is available ── */}
      {gstData && <GSTWidget gstData={gstData} />}

      {/* ── Charts ── */}
      <div className="grid gap-5 xl:grid-cols-5 min-w-0">
        <Card className="xl:col-span-3 min-w-0">
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <SectionLabel color="#0891b2">Cash Flow</SectionLabel>
              <h3 className="mt-2 text-base font-bold" style={{ color: "var(--text-primary)" }}>
                Income vs Expenses
              </h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Monthly comparison — last 6 months
              </p>
            </div>
            {/* Chart Legend */}
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#0891b2]" />
                <span style={{ color: "var(--text-primary)" }}>Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#dc2626]" />
                <span style={{ color: "var(--text-primary)" }}>Expenses</span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full min-w-0" style={{ minHeight: 256 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={256}>
              <BarChart data={incomeSeries} barGap={6}>
                <CartesianGrid vertical={false} stroke={gridStroke} />
                <XAxis dataKey="month" tick={{ fill: axisTickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: axisTickColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [formatINR(value), name === "income" ? "Income" : "Expense"]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Bar dataKey="income" name="income" fill="#0891b2" radius={[4, 4, 0, 0]} minPointSize={3} />
                <Bar dataKey="expense" name="expense" fill="#dc2626" radius={[4, 4, 0, 0]} minPointSize={3} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="xl:col-span-2 min-w-0">
          <div className="mb-5">
            <SectionLabel color="#6366f1">Breakdown</SectionLabel>
            <h3 className="mt-2 text-base font-bold" style={{ color: "var(--text-primary)" }}>
              Expense Mix
            </h3>
          </div>
          <div className="h-48 w-full min-w-0" style={{ minHeight: 192 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={192}>
              <PieChart>
                <Pie
                  data={expenseSummary.map((item) => ({ name: item._id || item.category, value: item.total }))}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={72}
                  innerRadius={36}
                >
                  {expenseSummary.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatINR(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1.5">
            {expenseSummary.slice(0, 4).map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
                  <span style={{ color: "var(--text-muted)" }}>{item._id || item.category}</span>
                </div>
                <span style={{ color: "var(--text-primary)" }} className="font-medium tabular-nums">
                  {formatINR(item.total)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Recent Transactions ── */}
      <Card>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <SectionLabel color="#059669">Activity</SectionLabel>
            <h3 className="mt-2 text-base font-bold" style={{ color: "var(--text-primary)" }}>
              Recent Transactions
            </h3>
          </div>
          <Link
            to="/statement-import"
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:underline"
          >
            <FileSpreadsheet size={14} /> Import Statement
          </Link>
        </div>
        <div className="space-y-3">
          {recentTransactions.slice(0, 8).map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: item.type === "income" ? "#0891b220" : "#dc262620" }}
                >
                  {item.type === "income" ? <TrendingUp size={14} color="#0891b2" /> : <TrendingDown size={14} color="#dc2626" />}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(item.date).toLocaleDateString("en-IN")}</p>
                </div>
              </div>
              <span className="text-sm font-bold tabular-nums" style={{ color: item.type === "income" ? "#0891b2" : "#dc2626" }}>
                {item.type === "income" ? "+" : "-"}{formatINR(item.amount)}
              </span>
            </div>
          ))}
          {recentTransactions.length === 0 && (
            <p className="text-center text-sm py-4" style={{ color: "var(--text-muted)" }}>
              No transactions yet. Add income or expenses to get started.
            </p>
          )}
        </div>
      </Card>

      {/* ── AI Insights ── */}
      <Card accentGlow="#8B5CF6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <SectionLabel color="#8B5CF6">AI Decision Engine</SectionLabel>
            <h3 className="mt-2 text-base font-bold" style={{ color: "var(--text-primary)" }}>
              Smart Insights & Projections
            </h3>
          </div>
          <button
            onClick={() => insightsQuery.refetch()}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
            style={{ background: "#8B5CF615", color: "#8B5CF6" }}
          >
            <RefreshCw size={13} className={insightsQuery.isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
        <div className="space-y-3">
          {insightsQuery.isLoading && <SkeletonLoader lines={3} />}
          {insightsQuery.isError && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              AI insights unavailable — check your API key configuration.
            </p>
          )}
          {(insightsQuery.data?.data?.insights || [])
            .filter((item) => !dismissed.includes(item.insight))
            .map((item) => (
              <AIInsightCard
                key={item.insight}
                insight={item.insight}
                type={item.type}
                onDismiss={() => setDismissed((prev) => [...prev, item.insight])}
              />
            ))}
        </div>
      </Card>
    </div>
  );
}
