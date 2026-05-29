import { Download, RefreshCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatINR } from "../utils/formatCurrency";
import { calculateHealthScore } from "../utils/healthScore";
import * as aiService from "../services/aiService";
import * as incomeService from "../services/incomeService";
import * as expenseService from "../services/expenseService";
import * as invoiceService from "../services/invoiceService";
import { showToast } from "../components/ui/Toast";
import { useTheme } from "../context/ThemeContext";

function Reports() {
  const { isDark } = useTheme();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const reportQuery = useQuery({
    queryKey: ["monthly-report", month, year],
    queryFn: () => aiService.getMonthlyReport({ month, year }),
    // Don't crash the page if AI is down — just show empty sections
    retry: 1,
  });
  const incomeSummaryQuery = useQuery({ queryKey: ["report-income-summary"], queryFn: incomeService.getSummary, retry: 1 });
  const incomeQuery  = useQuery({ queryKey: ["report-income"],   queryFn: () => incomeService.getIncome({}), retry: 1 });
  const expenseQuery = useQuery({ queryKey: ["report-expenses"], queryFn: () => expenseService.getExpenses({}), retry: 1 });
  const invoiceQuery = useQuery({ queryKey: ["report-invoices"], queryFn: invoiceService.getInvoices, retry: 1 });

  const regenerate = useMutation({
    mutationFn: () => aiService.getMonthlyReport({ month, year }),
    onSuccess: () => reportQuery.refetch(),
    onError: () => showToast({ type: "error", title: "Could not regenerate", message: "AI service unavailable. Please try again." }),
  });

  const history = useMemo(() => {
    try {
      const incomeSummary = Array.isArray(incomeSummaryQuery.data?.data) ? incomeSummaryQuery.data.data : [];
      const income   = Array.isArray(incomeQuery.data?.data)   ? incomeQuery.data.data   : [];
      const expenses = Array.isArray(expenseQuery.data?.data)  ? expenseQuery.data.data  : [];
      const invoices = Array.isArray(invoiceQuery.data?.data)  ? invoiceQuery.data.data  : [];

      return incomeSummary.map((item) => {
        // Filter entries that belong to this month label
        const monthIncome   = income.filter((e) => new Date(e.date).toLocaleString("en-IN", { month: "short" }) === item.month);
        const monthExpenses = expenses.filter((e) => new Date(e.date).toLocaleString("en-IN", { month: "short" }) === item.month);

        // calculateHealthScore expects arrays, not plain numbers
        const scoreResult = calculateHealthScore(monthIncome, monthExpenses, invoices, []);
        return {
          month: item.month,
          score: typeof scoreResult === "object" ? (scoreResult.score ?? 0) : (scoreResult ?? 0),
        };
      });
    } catch (err) {
      console.error("Health score history error:", err);
      return [];
    }
  }, [expenseQuery.data, incomeQuery.data, incomeSummaryQuery.data, invoiceQuery.data]);

  const report = reportQuery.data?.data?.sections;
  const tooltipStyle = {
    background: isDark ? "#111827" : "#ffffff",
    border: isDark ? "1px solid #374151" : "1px solid #cbd5e1",
    borderRadius: "12px",
    color: isDark ? "#f8fafc" : "#0f172a",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-sm text-[var(--text-secondary)]">Narrative monthly reports and your health score trend.</p>
        </div>
        <div className="flex gap-3">
          <select className="pm-select" value={month} onChange={(event) => setMonth(Number(event.target.value))}>
            {Array.from({ length: 12 }).map((_, index) => (
              <option key={index + 1} value={index + 1}>
                {new Date(2026, index, 1).toLocaleString("en-IN", { month: "long" })}
              </option>
            ))}
          </select>
          <input className="pm-input !w-28" type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} />
        </div>
      </div>

      <div className="pm-card">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold">AI Report</h3>
            <p className="text-sm text-[var(--text-secondary)]">Fresh breakdown across income, expenses, tax, and savings.</p>
          </div>
          <div className="flex gap-3">
            <button className="pm-button pm-button-ghost flex items-center gap-2" onClick={() => regenerate.mutate()} disabled={regenerate.isPending}>
              <RefreshCcw size={18} />
              {regenerate.isPending ? "Regenerating..." : "Regenerate"}
            </button>
            <button
              className="pm-button pm-button-primary flex items-center gap-2"
              onClick={() => {
                window.print();
                showToast({ type: "info", title: "Print dialog opened", message: "Use Save as PDF to download." });
              }}
            >
              <Download size={18} />
              Download PDF
            </button>
          </div>
        </div>
        {reportQuery.isError ? (
          <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-400">
            AI report unavailable — the AI service may be down or your API key may be missing. Your financial data above is still accurate.
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] p-4">
                <h4 className="mb-2 text-lg font-semibold">Income</h4>
                <p className="text-sm leading-7 text-[var(--text-secondary)]">{report?.incomeSummary || (reportQuery.isLoading ? "Loading..." : "No data yet.")}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] p-4">
                <h4 className="mb-2 text-lg font-semibold">Expenses</h4>
                <p className="text-sm leading-7 text-[var(--text-secondary)]">{report?.expenseAnalysis || (reportQuery.isLoading ? "Loading..." : "No data yet.")}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] p-4">
                <h4 className="mb-2 text-lg font-semibold">Tax</h4>
                <p className="text-sm leading-7 text-[var(--text-secondary)]">{report?.taxStatus || (reportQuery.isLoading ? "Loading..." : "No data yet.")}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] p-4">
                <h4 className="mb-2 text-lg font-semibold">Savings</h4>
                <p className="text-sm leading-7 text-[var(--text-secondary)]">{report?.savingsProgress || (reportQuery.isLoading ? "Loading..." : "No data yet.")}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
              <h4 className="mb-2 text-lg font-semibold">Key Actions</h4>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                {(report?.keyActionItems || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
                {!report?.keyActionItems?.length && !reportQuery.isLoading && (
                  <li>No actions suggested yet. Add more financial data to get personalised recommendations.</li>
                )}
              </ul>
            </div>
          </>
        )}
      </div>

      <div className="pm-card">
        <div className="mb-6">
          <h3 className="text-xl font-semibold">Health Score History</h3>
        </div>
        <div className="h-72">
          {history.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--text-secondary)]">
              Log income entries across at least 2 months to see your health score trend.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip formatter={(value) => `${value} / 100`} contentStyle={tooltipStyle} />
                <Area dataKey="score" stroke="#8B5CF6" fill="rgba(139,92,246,0.16)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;
