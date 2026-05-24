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

function Reports() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const reportQuery = useQuery({
    queryKey: ["monthly-report", month, year],
    queryFn: () => aiService.getMonthlyReport({ month, year }),
  });
  const incomeSummaryQuery = useQuery({ queryKey: ["report-income-summary"], queryFn: incomeService.getSummary });
  const incomeQuery = useQuery({ queryKey: ["report-income"], queryFn: () => incomeService.getIncome({}) });
  const expenseQuery = useQuery({ queryKey: ["report-expenses"], queryFn: () => expenseService.getExpenses({}) });
  const invoiceQuery = useQuery({ queryKey: ["report-invoices"], queryFn: invoiceService.getInvoices });

  const regenerate = useMutation({
    mutationFn: () => aiService.getMonthlyReport({ month, year }),
    onSuccess: () => reportQuery.refetch(),
  });

  const history = useMemo(() => {
    const incomeSummary = incomeSummaryQuery.data?.data ?? [];
    const income = incomeQuery.data?.data ?? [];
    const expenses = expenseQuery.data?.data ?? [];
    const invoices = invoiceQuery.data?.data ?? [];
    return incomeSummary.map((item) => {
      const monthIncome = income.filter((entry) => new Date(entry.date).toLocaleString("en-IN", { month: "short" }) === item.month).reduce((sum, entry) => sum + entry.amount, 0);
      const monthExpense = expenses.filter((entry) => new Date(entry.date).toLocaleString("en-IN", { month: "short" }) === item.month).reduce((sum, entry) => sum + entry.amount, 0);
      return {
        month: item.month,
        score: calculateHealthScore(monthIncome, monthExpense, invoices, []).score,
      };
    });
  }, [expenseQuery.data, incomeQuery.data, incomeSummaryQuery.data, invoiceQuery.data]);

  const report = reportQuery.data?.data?.sections;

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
            <button className="pm-button pm-button-ghost flex items-center gap-2" onClick={() => regenerate.mutate()}>
              <RefreshCcw size={18} />
              Regenerate
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
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] p-4">
            <h4 className="mb-2 text-lg font-semibold">📊 Income</h4>
            <p className="text-sm leading-7 text-[var(--text-secondary)]">{report?.incomeSummary}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] p-4">
            <h4 className="mb-2 text-lg font-semibold">💸 Expenses</h4>
            <p className="text-sm leading-7 text-[var(--text-secondary)]">{report?.expenseAnalysis}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] p-4">
            <h4 className="mb-2 text-lg font-semibold">🧾 Tax</h4>
            <p className="text-sm leading-7 text-[var(--text-secondary)]">{report?.taxStatus}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] p-4">
            <h4 className="mb-2 text-lg font-semibold">🎯 Savings</h4>
            <p className="text-sm leading-7 text-[var(--text-secondary)]">{report?.savingsProgress}</p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
          <h4 className="mb-2 text-lg font-semibold">✅ Key Actions</h4>
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            {(report?.keyActionItems || []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="pm-card">
        <div className="mb-6">
          <h3 className="text-xl font-semibold">Health Score History</h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip formatter={(value) => `${value} / 100`} contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "12px" }} />
              <Area dataKey="score" stroke="#8B5CF6" fill="rgba(139,92,246,0.16)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Reports;
