import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, BarChart3, Brain, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import useAuth from "../hooks/useAuth";
import useFinancialData from "../hooks/useFinancialData";
import KPICard from "../components/ui/KPICard";
import InsightCard from "../components/ui/InsightCard";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import { showToast } from "../components/ui/Toast";
import { useTheme } from "../context/ThemeContext";
import { formatINR } from "../utils/formatCurrency";
import { calculateHealthScore } from "../utils/healthScore";
import * as aiService from "../services/aiService";
import * as incomeService from "../services/incomeService";
import * as expenseService from "../services/expenseService";
import * as invoiceService from "../services/invoiceService";

const chartColors = ["#F59E0B", "#8B5CF6", "#10B981", "#0EA5E9", "#6B7280", "#EF4444"];

function Dashboard() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [dismissed, setDismissed] = useState([]);
  const financialData = useFinancialData();

  const incomeQuery = useQuery({ queryKey: ["dashboard-income"], queryFn: () => incomeService.getIncome({}) });
  const expenseQuery = useQuery({ queryKey: ["dashboard-expenses"], queryFn: () => expenseService.getExpenses({}) });
  const invoiceQuery = useQuery({ queryKey: ["dashboard-invoices"], queryFn: invoiceService.getInvoices });
  const insightsQuery = useQuery({ queryKey: ["dashboard-insights"], queryFn: () => aiService.getInsights({}) });

  const reportMutation = useMutation({
    mutationFn: () => aiService.getMonthlyReport({}),
    onSuccess: () => showToast({ type: "success", title: "AI report generated", message: "Fresh narrative insights are ready in Reports." }),
    onError: (error) => showToast({ type: "error", title: "Could not generate report", message: error.response?.data?.message || "Please try again." }),
  });

  const incomeItems = incomeQuery.data?.data ?? [];
  const expenseItems = expenseQuery.data?.data ?? [];
  const invoiceItems = invoiceQuery.data?.data ?? [];
  const expenseSummary = financialData.expenseSummary;

  const monthlyExpenseMap = expenseItems.reduce((map, item) => {
    const key = new Date(item.date).toLocaleString("en-IN", { month: "short" });
    map[key] = (map[key] || 0) + Number(item.amount || 0);
    return map;
  }, {});

  const incomeSeries = financialData.incomeSummary.map((item) => ({
    month: item.month,
    income: item.total || 0,
    expense: monthlyExpenseMap[item.month] || 0,
  }));

  const totalIncome = incomeItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpenses = expenseItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const health = calculateHealthScore(totalIncome, totalExpenses, invoiceItems, incomeSeries.map((item) => ({ profit: item.income - item.expense })));
  const recentTransactions = [...incomeItems.map((item) => ({ ...item, type: "income", title: item.source })), ...expenseItems.map((item) => ({ ...item, type: "expense", title: item.title }))].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const alertBanners = useMemo(() => {
    const overdueCount = invoiceItems.filter((invoice) => invoice.status === "overdue").length;
    const cashRunway = totalExpenses > 0 ? totalIncome / totalExpenses : 0;

    return [
      cashRunway > 0 && cashRunway < 1
        ? { type: "warning", text: "Cash runway is under one month. Tighten expenses or accelerate collections." }
        : null,
      totalIncome > 1800000
        ? { type: "danger", text: "GST threshold warning triggered. You are approaching Rs. 20,00,000 in annual income." }
        : null,
      overdueCount > 0
        ? { type: "warning", text: `${overdueCount} invoice${overdueCount > 1 ? "s are" : " is"} overdue and needs a follow-up.` }
        : null,
    ].filter(Boolean);
  }, [invoiceItems, totalExpenses, totalIncome]);

  const gridStroke = isDark ? "#1F2937" : "#E2E8F0";
  const axisTick = { fill: isDark ? "#6B7280" : "#94A3B8" };
  const tooltipStyle = {
    background: isDark ? "#111827" : "#FFFFFF",
    border: `1px solid ${isDark ? "#374151" : "#E2E8F0"}`,
    borderRadius: "8px",
    color: isDark ? "#F9FAFB" : "#0F172A",
  };

  return (
    <div className="space-y-6">
      {alertBanners.map((banner) => (
        <div
          key={banner.text}
          className={`glass-banner flex items-center gap-3 ${
            banner.type === "danger" ? "border-red-500/30 text-red-300" : "border-amber-500/30 text-amber-300"
          }`}
        >
          <AlertTriangle size={18} />
          <span className="text-sm">{banner.text}</span>
        </div>
      ))}

      <section className="glass-banner reveal visible flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-secondary)]">Welcome back</p>
          <h1 className="page-title mt-2">Good to see you, {user?.name?.split(" ")[0]}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
            Keep cash flow visible, reduce subscription bleed, and stay ahead of taxes without spreadsheet sprawl.
          </p>
        </div>
        <button className="pm-button pm-button-primary" onClick={() => reportMutation.mutate()} disabled={reportMutation.isPending}>
          {reportMutation.isPending ? "Generating..." : "Generate AI Report"}
        </button>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KPICard title="Income" value={formatINR(totalIncome)} change={12.4} icon={TrendingUp} color="bg-sky-500/15 text-sky-400" />
        <KPICard title="Expenses" value={formatINR(totalExpenses)} change={-3.2} icon={TrendingDown} color="bg-red-500/15 text-red-400" />
        <KPICard title="Profit" value={formatINR(totalIncome - totalExpenses)} change={8.6} icon={Wallet} color="bg-emerald-500/15 text-emerald-400" />
        <KPICard title="Score" value={`${health.score} / 100`} change={5.1} icon={BarChart3} color="bg-violet-500/15 text-violet-400" />
      </section>

      <section className="grid gap-6 xl:grid-cols-5">
        <div className="pm-card xl:col-span-3">
          <div className="mb-6">
            <h3 className="text-xl font-semibold">Income vs Expenses</h3>
            <p className="text-sm text-[var(--text-secondary)]">Last 6 months</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeSeries}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke={gridStroke} tick={axisTick} />
                <YAxis stroke={gridStroke} tick={axisTick} tickFormatter={(value) => `Rs.${value / 1000}k`} />
                <Tooltip formatter={(value) => formatINR(value)} contentStyle={tooltipStyle} />
                <Bar dataKey="income" fill="#0EA5E9" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expense" fill="#EF4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="pm-card xl:col-span-2">
          <div className="mb-6">
            <h3 className="text-xl font-semibold">Expense Mix</h3>
            <p className="text-sm text-[var(--text-secondary)]">Current category spread</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenseSummary} dataKey="total" nameKey="category" innerRadius={65} outerRadius={90} paddingAngle={4}>
                  {expenseSummary.map((entry, index) => (
                    <Cell key={entry.category} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatINR(value)} contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center text-sm text-[var(--text-secondary)]">
            Total {formatINR(expenseSummary.reduce((sum, item) => sum + Number(item.total || 0), 0))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-5">
        <div className="pm-card xl:col-span-3">
          <div className="mb-6">
            <h3 className="text-xl font-semibold">Recent Transactions</h3>
            <p className="text-sm text-[var(--text-secondary)]">Latest inflows and outflows</p>
          </div>
          <div className="table-shell">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.slice(0, 6).map((item) => (
                  <tr key={`${item.type}-${item._id}`}>
                    <td>{new Date(item.date).toLocaleDateString("en-IN")}</td>
                    <td className="font-medium">{item.title}</td>
                    <td><span className="pm-badge bg-slate-700/60 text-slate-200">{item.category}</span></td>
                    <td className={item.type === "income" ? "text-emerald-400" : "text-red-400"}>
                      {item.type === "income" ? "IN" : "OUT"} {formatINR(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pm-card xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-violet-300">
              <Brain size={18} />
              <h3 className="font-semibold">AI Insights</h3>
            </div>
            <button className="pm-button pm-button-ghost !px-3 !py-2 text-sm" onClick={() => insightsQuery.refetch()}>
              Refresh
            </button>
          </div>
          <div className="space-y-3">
            {insightsQuery.isLoading
              ? Array.from({ length: 3 }).map((_, index) => <SkeletonLoader key={index} variant="card" />)
              : (insightsQuery.data?.data?.insights || [])
                  .filter((_, index) => !dismissed.includes(index))
                  .slice(0, 3)
                  .map((insight, index) => (
                    <InsightCard
                      key={insight}
                      insight={insight}
                      type={index === 0 ? "warning" : index === 1 ? "danger" : "success"}
                      onDismiss={() => setDismissed((current) => [...current, index])}
                    />
                  ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
