import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle, BarChart3, Brain, Sparkles,
  TrendingDown, TrendingUp, Wallet, ArrowRight,
  IndianRupee, Activity, RefreshCw,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import useAuth from "../hooks/useAuth";
import useFinancialData from "../hooks/useFinancialData";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import { showToast } from "../components/ui/Toast";
import { useTheme } from "../context/ThemeContext";
import { formatINR } from "../utils/formatCurrency";
import { calculateHealthScore } from "../utils/healthScore";
import * as aiService from "../services/aiService";
import * as incomeService from "../services/incomeService";
import * as expenseService from "../services/expenseService";
import * as invoiceService from "../services/invoiceService";

const CHART_COLORS = ["#0891b2", "#6366f1", "#059669", "#ea580c", "#7c3aed", "#db2777"];

/* ── KPI Card ── */
function KPI({ title, value, change, icon: Icon, accent }) {
  const up = change >= 0;
  return (
    <div
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
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
        <span
          className="rounded-full px-2.5 py-1 text-xs font-bold tabular-nums"
          style={{
            background: up ? "var(--success-soft)" : "var(--danger-soft)",
            color: up ? "var(--success)" : "var(--danger)",
          }}
        >
          {up ? "+" : ""}{change}%
        </span>
      </div>
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)", letterSpacing: "0.12em" }}
        >
          {title}
        </p>
        <p
          className="mt-1 text-2xl font-extrabold tracking-tight tabular-nums"
          style={{ color: accent }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* ── Section label ── */
function SectionLabel({ children, color }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
      style={{
        background: `${color}15`,
        color: color,
        border: `1px solid ${color}25`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color }}
      />
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
  const map = {
    warning: { color: "#d97706" },
    danger: { color: "#dc2626" },
    success: { color: "#059669" },
  };
  const { color } = map[type] || map.success;
  return (
    <div
      className="relative overflow-hidden rounded-xl px-4 py-3 text-xs leading-relaxed"
      style={{
        background: `${color}0c`,
        border: `1px solid ${color}22`,
      }}
    >
      <div
        className="absolute left-0 top-0 h-full w-[3px] rounded-l-xl"
        style={{ background: color }}
      />
      <div className="flex items-start justify-between gap-3 pl-1">
        <p style={{ color: "var(--text-primary)" }}>{insight}</p>
        <button
          onClick={onDismiss}
          className="shrink-0 transition-opacity hover:opacity-60"
          style={{ color: "var(--text-muted)" }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/* ═════════════════ DASHBOARD ═════════════════ */
export default function Dashboard() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [dismissed, setDismissed] = useState([]);
  const financialData = useFinancialData();

  const incomeQuery   = useQuery({ queryKey: ["dashboard-income"],   queryFn: () => incomeService.getIncome({}) });
  const expenseQuery  = useQuery({ queryKey: ["dashboard-expenses"], queryFn: () => expenseService.getExpenses({}) });
  const invoiceQuery  = useQuery({ queryKey: ["dashboard-invoices"], queryFn: invoiceService.getInvoices });
  const insightsQuery = useQuery({ queryKey: ["dashboard-insights"], queryFn: () => aiService.getInsights({}) });

  const reportMutation = useMutation({
    mutationFn: () => aiService.getMonthlyReport({}),
    onSuccess: () => showToast({ type: "success", title: "AI report generated", message: "Fresh insights are ready in Reports." }),
    onError: (e) => showToast({ type: "error", title: "Could not generate", message: e.response?.data?.message || "Please try again." }),
  });

  const incomeItems    = Array.isArray(incomeQuery.data?.data)  ? incomeQuery.data.data  : [];
  const expenseItems   = Array.isArray(expenseQuery.data?.data) ? expenseQuery.data.data : [];
  const invoiceItems   = Array.isArray(invoiceQuery.data?.data) ? invoiceQuery.data.data : [];
  const expenseSummary = Array.isArray(financialData.expenseSummary) ? financialData.expenseSummary : [];

  const monthlyExpenseMap = expenseItems.reduce((map, item) => {
    const key = new Date(item.date).toLocaleString("en-IN", { month: "short" });
    map[key] = (map[key] || 0) + Number(item.amount || 0);
    return map;
  }, {});

  const incomeSeries = (Array.isArray(financialData.incomeSummary) ? financialData.incomeSummary : []).map((item) => ({
    month:   item.month,
    income:  item.total || 0,
    expense: monthlyExpenseMap[item.month] || 0,
  }));

  const totalIncome   = incomeItems.reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalExpenses = expenseItems.reduce((s, i) => s + Number(i.amount || 0), 0);
  const netProfit     = totalIncome - totalExpenses;

  const health = calculateHealthScore(
    incomeItems, expenseItems, invoiceItems,
    incomeSeries.map((item) => ({ income: item.income }))
  );

  const recentTransactions = [
    ...incomeItems.map((i)  => ({ ...i, type: "income",  title: i.source })),
    ...expenseItems.map((i) => ({ ...i, type: "expense", title: i.title })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const alertBanners = useMemo(() => {
    const overdueCount = invoiceItems.filter((inv) => inv.status === "overdue").length;
    const cashRunway   = totalExpenses > 0 ? totalIncome / totalExpenses : 0;
    return [
      cashRunway > 0 && cashRunway < 1 ? { type: "warning", text: "Cash runway is under one month. Tighten expenses or accelerate collections." } : null,
      totalIncome > 1800000            ? { type: "danger",  text: "GST threshold warning: approaching ₹20,00,000 in annual income." } : null,
      overdueCount > 0                 ? { type: "warning", text: `${overdueCount} invoice${overdueCount > 1 ? "s are" : " is"} overdue and needs follow-up.` } : null,
    ].filter(Boolean);
  }, [invoiceItems, totalExpenses, totalIncome]);

  const scoreColor = health.score >= 70 ? "#059669" : health.score >= 50 ? "#d97706" : "#dc2626";

  // Chart tooltip style — adapts to theme
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
      {alertBanners.map((b) => (
        <div
          key={b.text}
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
          style={{
            background: b.type === "danger" ? "var(--danger-soft)" : "var(--warning-soft)",
            border: b.type === "danger" ? "1px solid var(--danger-border)" : "1px solid var(--warning-border)",
            color: b.type === "danger" ? "var(--danger)" : "var(--warning)",
          }}
        >
          <AlertTriangle size={15} className="shrink-0" />
          {b.text}
        </div>
      ))}

      {/* ── Hero banner ── */}
      <Card>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--primary)", letterSpacing: "0.14em" }}
            >
              Welcome back
            </p>
            <h1
              className="mt-2 text-2xl font-extrabold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Hey, <span style={{ color: "var(--primary)" }}>{user?.name?.split(" ")[0]}</span>
            </h1>
            <p
              className="mt-1.5 max-w-lg text-sm leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              Your financial overview is ready. Stay on top of cash flow, expenses, and tax in one place.
            </p>
          </div>
          <button
            onClick={() => reportMutation.mutate()}
            disabled={reportMutation.isPending}
            className="pm-button pm-button-primary group flex shrink-0 items-center gap-2 px-5 py-2.5 text-sm transition-all active:scale-95 disabled:opacity-60"
          >
            {reportMutation.isPending
              ? <><RefreshCw size={14} className="animate-spin" /> Generating...</>
              : <><Sparkles size={14} /> Generate AI Report <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" /></>}
          </button>
        </div>
      </Card>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KPI title="Total Income"   value={formatINR(totalIncome)}   change={12.4} icon={TrendingUp}   accent="#0891b2" />
        <KPI title="Total Expenses" value={formatINR(totalExpenses)} change={-3.2} icon={TrendingDown} accent="#dc2626" />
        <KPI title="Net Profit"     value={formatINR(netProfit)}     change={8.6}  icon={IndianRupee}  accent={netProfit >= 0 ? "#059669" : "#dc2626"} />
        <KPI title="Health Score"   value={`${health.score} / 100`} change={5.1}  icon={Activity}     accent={scoreColor} />
      </div>

      {/* ── Charts ── */}
      <div className="grid gap-5 xl:grid-cols-5">

        {/* Bar chart */}
        <Card className="xl:col-span-3">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <SectionLabel color="#0891b2">Cash Flow</SectionLabel>
              <h3 className="mt-2 text-base font-bold" style={{ color: "var(--text-primary)" }}>
                Income vs Expenses
              </h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Monthly comparison — last 6 months
              </p>
            </div>
            <div className="flex items-center gap-4 pt-1">
              {[["#0891b2", "Income"], ["#dc2626", "Expenses"]].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ background: c }} />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={incomeSeries} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="transparent" tick={{ fill: axisTickColor, fontSize: 11 }} tickLine={false} />
              <YAxis stroke="transparent" tick={{ fill: axisTickColor, fontSize: 11 }} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(v) => formatINR(v)} contentStyle={tooltipStyle} cursor={{ fill: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)" }} />
              <Bar dataKey="income"  fill="#0891b2" radius={[5, 5, 0, 0]} maxBarSize={24} />
              <Bar dataKey="expense" fill="#dc2626" radius={[5, 5, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Donut chart */}
        <Card className="xl:col-span-2">
          <div className="mb-5">
            <SectionLabel color="#6366f1">Breakdown</SectionLabel>
            <h3 className="mt-2 text-base font-bold" style={{ color: "var(--text-primary)" }}>
              Expense Mix
            </h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Current category spread
            </p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={expenseSummary.length ? expenseSummary : [{ category: "No data", total: 1 }]}
                dataKey="total" nameKey="category"
                innerRadius={52} outerRadius={80} paddingAngle={3}
              >
                {(expenseSummary.length ? expenseSummary : [{ category: "No data" }]).map((entry, i) => (
                  <Cell key={entry.category} fill={CHART_COLORS[i % CHART_COLORS.length]} opacity={expenseSummary.length ? 1 : 0.2} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatINR(v)} contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2">
            {expenseSummary.slice(0, 4).map((item, i) => (
              <div key={item.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{item.category}</span>
                </div>
                <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {formatINR(item.total)}
                </span>
              </div>
            ))}
            {!expenseSummary.length && (
              <p className="text-center text-xs" style={{ color: "var(--text-faint)" }}>
                No expense data yet
              </p>
            )}
          </div>
          <div
            className="mt-4 border-t pt-3 text-center"
            style={{ borderColor: "var(--border-default)" }}
          >
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Total expenses · </span>
            <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {formatINR(expenseSummary.reduce((s, i) => s + Number(i.total || 0), 0))}
            </span>
          </div>
        </Card>
      </div>

      {/* ── Transactions + AI Insights ── */}
      <div className="grid gap-5 xl:grid-cols-5">

        {/* Transactions */}
        <Card className="xl:col-span-3">
          <div className="mb-5">
            <SectionLabel color="#059669">Activity</SectionLabel>
            <h3 className="mt-2 text-base font-bold" style={{ color: "var(--text-primary)" }}>
              Recent Transactions
            </h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Latest inflows and outflows
            </p>
          </div>
          <div
            className="overflow-hidden rounded-xl"
            style={{ border: "1px solid var(--border-default)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--bg-table-head)", borderBottom: "1px solid var(--border-default)" }}>
                  {["Date", "Title", "Category", "Amount"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-xs"
                      style={{ color: "var(--text-faint)" }}
                    >
                      No transactions yet. Add income or expenses to get started.
                    </td>
                  </tr>
                )}
                {recentTransactions.slice(0, 6).map((item) => (
                  <tr
                    key={`${item.type}-${item._id}`}
                    className="transition-colors"
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-row-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td className="px-4 py-3 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {new Date(item.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {item.title}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{
                          background: "var(--bg-badge)",
                          border: "1px solid var(--border-default)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-sm font-bold tabular-nums"
                      style={{ color: item.type === "income" ? "#059669" : "#dc2626" }}
                    >
                      {item.type === "income" ? "+" : "−"} {formatINR(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* AI Insights */}
        <Card className="xl:col-span-2" accentGlow="#6366f1">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: "#6366f118", border: "1px solid #6366f125" }}
                >
                  <Brain size={14} style={{ color: "#6366f1" }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  AI Insights
                </span>
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "#6366f1" }} />
              </div>
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-faint)" }}>
                Powered by Groq llama-3
              </p>
            </div>
            <button
              onClick={() => insightsQuery.refetch()}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
              style={{
                background: "#6366f112",
                border: "1px solid #6366f122",
                color: "#6366f1",
              }}
            >
              <RefreshCw size={11} /> Refresh
            </button>
          </div>

          <div className="space-y-2.5">
            {insightsQuery.isLoading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonLoader key={i} variant="card" />)
              : (insightsQuery.data?.data?.insights || []).length === 0
              ? (
                <div
                  className="rounded-xl px-4 py-8 text-center"
                  style={{ background: "var(--bg-empty)", border: "1px solid var(--border-default)" }}
                >
                  <Sparkles size={20} className="mx-auto mb-2" style={{ color: "var(--text-faint)" }} />
                  <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                    Add income and expenses to unlock AI insights.
                  </p>
                </div>
              )
              : (insightsQuery.data?.data?.insights || [])
                  .filter((_, i) => !dismissed.includes(i))
                  .slice(0, 3)
                  .map((insight, i) => (
                    <AIInsightCard
                      key={insight}
                      insight={insight}
                      type={i === 0 ? "warning" : i === 1 ? "danger" : "success"}
                      onDismiss={() => setDismissed((curr) => [...curr, i])}
                    />
                  ))
            }
          </div>

          {/* Health score bar */}
          <div
            className="mt-5 rounded-xl px-4 py-4"
            style={{ background: "var(--bg-empty)", border: "1px solid var(--border-default)" }}
          >
            <div className="mb-2 flex items-center justify-between">
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                Financial Health
              </span>
              <span className="text-xs font-extrabold" style={{ color: scoreColor }}>
                Grade {health.grade}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full"
              style={{ background: "var(--bg-progress-track)" }}
            >
              <div
                className="h-2 rounded-full transition-all duration-1000"
                style={{ width: `${health.score}%`, background: scoreColor }}
              />
            </div>
            <div className="mt-1.5 flex justify-between">
              <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>0</span>
              <span className="text-[10px] font-bold tabular-nums" style={{ color: scoreColor }}>
                {health.score} / 100
              </span>
              <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>100</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
