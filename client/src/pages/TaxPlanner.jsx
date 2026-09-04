import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Percent,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingDown,
} from "lucide-react";
import { formatINR } from "../utils/formatCurrency";
import api from "../services/api";

const getTaxOverview = async () => (await api.get("/tax/overview")).data;
const getAdvanceTax = async () => (await api.get("/tax/advance-tax")).data;
const getGSTStatus = async () => (await api.get("/tax/gst-status")).data;

export default function TaxPlanner() {
  const [inputs, setInputs] = useState({
    income: 1500000,
    eligibleExpenses: 300000,
    section80C: 150000,
    section80D: 25000,
    hra: 0,
    newInvoiceAmount: 75000,
  });

  const [compareResult, setCompareResult] = useState(null);
  const [comparing, setComparing] = useState(false);

  const overviewQuery = useQuery({ queryKey: ["tax-overview"], queryFn: getTaxOverview });
  const advanceTaxQuery = useQuery({ queryKey: ["advance-tax"], queryFn: getAdvanceTax });
  const gstQuery = useQuery({ queryKey: ["gst-status"], queryFn: getGSTStatus });

  const overview = overviewQuery.data?.data;
  const gst = gstQuery.data?.data || { totalIncome: 0, threshold: 2000000, progress: 0 };
  const advanceTax = advanceTaxQuery.data?.data || { installments: [] };

  const handleRunComparison = async (e) => {
    if (e) e.preventDefault();
    setComparing(true);
    try {
      const res = await api.post("/tax/compare", {
        income: Number(inputs.income),
        eligibleExpenses: Number(inputs.eligibleExpenses),
        deductions80C: Number(inputs.section80C),
        deductions80D: Number(inputs.section80D),
        hra: Number(inputs.hra),
      });
      if (res.data?.success) {
        setCompareResult(res.data.data);
      }
    } catch (err) {
      alert("Tax comparison failed: " + err.message);
    } finally {
      setComparing(false);
    }
  };

  const comparison = compareResult || overview?.taxComparison;
  const reserve = overview?.recommendedTaxReserve;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[var(--border)]">
        <h1 className="text-2xl font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
          <Calculator className="text-indigo-500" />
          Indian Freelancer Tax Intelligence (FY 2025-26)
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Section 44ADA presumptive taxation, New vs Old regime optimizer, and automated tax reserve calculator
        </p>
      </div>

      {/* GST Progress & Recommended Tax Reserve Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GST Tracker Card */}
        <div className="rounded-3xl p-6 border border-[var(--border)] bg-[var(--bg-elevated)] space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              GST Threshold Monitor (Services: ₹20 Lakhs)
            </div>
            {gst.status === "warning" && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold">
                80% Reached
              </span>
            )}
            {gst.status === "mandatory_registration" && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-bold">
                Mandatory
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {formatINR(gst.totalIncome || 0)}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              Limit: {formatINR(gst.threshold || 2000000)}
            </div>
          </div>
          <div className="h-3 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                gst.progress >= 95 ? "bg-rose-500" : gst.progress >= 80 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, gst.progress || 0)}%` }}
            />
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            {gst.alertMessage || "Turnover is well within threshold limits."}
          </p>
        </div>

        {/* Recommended Tax Reserve Card */}
        <div className="rounded-3xl p-6 border border-[var(--border)] bg-[var(--bg-elevated)] space-y-3 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
            Automated Tax Reserve Guideline
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-display text-[var(--text-primary)]">
              {reserve?.reservePercentage || 15}%
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              of incoming freelancer receipts
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {reserve?.explanation || "Set aside ~15-20% from every client invoice to effortlessly fund advance tax installments without cash flow crunches."}
          </p>
        </div>
      </div>

      {/* Tax Comparison Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Inputs */}
        <form
          onSubmit={handleRunComparison}
          className="rounded-3xl p-6 border border-[var(--border)] bg-[var(--bg-elevated)] space-y-4 shadow-sm"
        >
          <h2 className="text-base font-bold text-[var(--text-primary)]">Regime Calculator Inputs</h2>
          <div className="space-y-1">
            <label className="text-xs text-[var(--text-secondary)]">Annual Gross Receipts (₹)</label>
            <input
              type="number"
              value={inputs.income}
              onChange={(e) => setInputs({ ...inputs, income: e.target.value })}
              className="w-full rounded-xl px-3 py-2 text-sm bg-[var(--bg-primary)] border border-[var(--border)]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[var(--text-secondary)]">Actual Business Expenses (₹)</label>
            <input
              type="number"
              value={inputs.eligibleExpenses}
              onChange={(e) => setInputs({ ...inputs, eligibleExpenses: e.target.value })}
              className="w-full rounded-xl px-3 py-2 text-sm bg-[var(--bg-primary)] border border-[var(--border)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[var(--text-secondary)]">Section 80C (₹)</label>
              <input
                type="number"
                value={inputs.section80C}
                onChange={(e) => setInputs({ ...inputs, section80C: e.target.value })}
                className="w-full rounded-xl px-3 py-2 text-sm bg-[var(--bg-primary)] border border-[var(--border)]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--text-secondary)]">Section 80D (₹)</label>
              <input
                type="number"
                value={inputs.section80D}
                onChange={(e) => setInputs({ ...inputs, section80D: e.target.value })}
                className="w-full rounded-xl px-3 py-2 text-sm bg-[var(--bg-primary)] border border-[var(--border)]"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={comparing}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-sm"
          >
            {comparing ? "Recalculating..." : "Recalculate Tax Regimes"}
          </button>
        </form>

        {/* 4-Way Comparison Cards */}
        <div className="lg:col-span-2 space-y-4">
          {comparison && (
            <>
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm flex items-center justify-between">
                <div>
                  <strong>Recommended Option:</strong> {comparison.recommendedOption?.name}
                  <div className="text-xs opacity-80">
                    Estimated Annual Tax: {formatINR(comparison.recommendedOption?.tax || 0)}
                  </div>
                </div>
                {comparison.annualTaxSavings > 0 && (
                  <div className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600">
                    Saves {formatINR(comparison.annualTaxSavings)} / year
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 44ADA New Regime */}
                {comparison.presumptiveNew && (
                  <div className="p-5 rounded-3xl bg-[var(--bg-elevated)] border-2 border-indigo-500/40 space-y-2 relative overflow-hidden">
                    <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      Section 44ADA (New Regime) ★
                    </div>
                    <div className="text-2xl font-black text-[var(--text-primary)]">
                      {formatINR(comparison.presumptiveNew.totalTax)}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      Deemed Profit: {formatINR(comparison.presumptiveNew.deemedProfit)} (50% margin)
                    </div>
                    <div className="text-[11px] text-emerald-500 font-medium">
                      No bookkeeping of individual expenses required.
                    </div>
                  </div>
                )}

                {/* Normal New Regime */}
                {comparison.normalNew && (
                  <div className="p-5 rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2">
                    <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      New Regime (Actual Expenses)
                    </div>
                    <div className="text-2xl font-black text-[var(--text-primary)]">
                      {formatINR(comparison.normalNew.totalTax)}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      Taxable Income: {formatINR(comparison.normalNew.taxableIncome)}
                    </div>
                  </div>
                )}

                {/* Normal Old Regime */}
                {comparison.normalOld && (
                  <div className="p-5 rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2">
                    <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      Old Regime (Actual Expenses)
                    </div>
                    <div className="text-2xl font-black text-[var(--text-primary)]">
                      {formatINR(comparison.normalOld.totalTax)}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      Deductions: {formatINR(comparison.normalOld.deductions?.total || 0)}
                    </div>
                  </div>
                )}

                {/* 44ADA Old Regime */}
                {comparison.presumptiveOld && (
                  <div className="p-5 rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2">
                    <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      Section 44ADA (Old Regime)
                    </div>
                    <div className="text-2xl font-black text-[var(--text-primary)]">
                      {formatINR(comparison.presumptiveOld.totalTax)}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      Deemed Profit minus 80C/80D
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Advance Tax Installments */}
      <div className="rounded-3xl p-6 border border-[var(--border)] bg-[var(--bg-elevated)] space-y-4 shadow-sm">
        <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Calendar size={18} className="text-indigo-500" />
          Statutory Advance Tax Schedule (Installments)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(advanceTax.installments || []).map((q) => (
            <div
              key={q.quarter}
              className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-indigo-500">{q.quarter}</span>
                <span className="text-xs text-[var(--text-secondary)]">{q.cumulativePercentage}% due</span>
              </div>
              <div className="text-lg font-bold text-[var(--text-primary)]">
                {formatINR(q.cumulativeDueAmount || 0)}
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                Deadline: {q.deadlineLabel || "15th"}
              </div>
              <div className="text-[11px]">
                {q.daysLeft > 0 ? (
                  <span className="text-sky-500 font-semibold">{q.daysLeft} days remaining</span>
                ) : (
                  <span className="text-emerald-500 font-semibold">Passed / Filed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
