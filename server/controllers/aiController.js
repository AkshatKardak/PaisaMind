const asyncHandler = require("express-async-handler");
const { Groq } = require("groq-sdk");
const Income  = require("../models/Income");
const Expense = require("../models/Expense");
const Invoice = require("../models/Invoice");
const Goal    = require("../models/Goal");
const User    = require("../models/User");
const { generateCashFlowForecast } = require("../services/forecastingService");
const { calculateCashRunway } = require("../services/runwayService");
const { calculateDetailedHealthScore } = require("../services/healthEngineService");
const { compareAllRegimes } = require("../services/taxIntelligenceService");
const logger = require("../services/logger");

const groq = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "your_groq_api_key"
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const getCurrentMonthRange = () => {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const getLastMonthsRange = (months = 6) => {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const monthKey = (date) =>
  new Date(date).toLocaleString("en-IN", { month: "short", year: "numeric" });

// ─── Monthly Report ───────────────────────────────────────────────────────────
const getMonthlyReport = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user   = await User.findById(userId);

  const month = Number(req.body?.month || req.query?.month || new Date().getMonth() + 1);
  const year  = Number(req.body?.year  || req.query?.year  || new Date().getFullYear());

  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month,     0, 23, 59, 59, 999);

  const monthName = start.toLocaleString("en-IN", { month: "long", year: "numeric" });

  const [incomes, expenses, invoices, goals] = await Promise.all([
    Income.find({ userId, date: { $gte: start, $lte: end } }).sort({ date: -1 }),
    Expense.find({ userId, date: { $gte: start, $lte: end } }).sort({ date: -1 }),
    Invoice.find({ userId }).sort({ createdAt: -1 }),
    Goal.find({ userId }),
  ]);

  const paidInvoicesThisMonth = invoices.filter((inv) => {
    if (!["Paid", "Partially Paid"].includes(inv.status)) return false;
    const ref = inv.paidAt ? new Date(inv.paidAt) : (inv.dueDate ? new Date(inv.dueDate) : new Date(inv.createdAt));
    return ref >= start && ref <= end;
  });

  const invoiceIncome  = paidInvoicesThisMonth.reduce((sum, inv) => sum + Number(inv.amount || inv.totalAmount || 0), 0);
  const directIncome   = incomes.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalIncome    = directIncome + invoiceIncome;
  const totalExpense   = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netSavings     = totalIncome - totalExpense;
  const savingsRate    = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  const overdueCount   = invoices.filter((i) => i.status === "Overdue").length;
  const unpaidCount    = invoices.filter((i) => i.status === "Unpaid").length;
  const totalPaidCount = invoices.filter((i) => i.status === "Paid").length;

  const categoryMap = {};
  expenses.forEach((e) => {
    const cat = e.category || "Other";
    categoryMap[cat] = (categoryMap[cat] || 0) + Number(e.amount || 0);
  });
  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, amt]) => `${cat} (₹${amt.toLocaleString("en-IN")})`)
    .join(", ");

  const activeGoals = goals.length;

  if (totalIncome === 0 && totalExpense === 0) {
    return res.status(200).json({
      success: true,
      data: {
        month, year,
        sections: {
          incomeSummary:   null,
          expenseAnalysis: null,
          taxStatus:       null,
          savingsProgress: null,
          keyActionItems:  [],
        },
      },
    });
  }

  const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

  const prompt = `You are a financial advisor for Indian freelancers.
Write a concise, friendly narrative monthly report for ${monthName}.

Financial data:
- Total Income: ${fmt(totalIncome)} (Direct: ${fmt(directIncome)}, Invoices Paid: ${fmt(invoiceIncome)})
- Total Expenses: ${fmt(totalExpense)}
- Net Savings: ${fmt(netSavings)} (Savings Rate: ${savingsRate}%)
- Top Expense Categories: ${topCategories || "None"}
- Invoices: ${totalPaidCount} paid, ${unpaidCount} unpaid, ${overdueCount} overdue
- Active Financial Goals: ${activeGoals}
- Tax Regime: ${user?.taxRegime || "new"}

Return ONLY a valid JSON object matching this schema:
{
  "sections": {
    "incomeSummary":   "2-3 sentences analyzing income performance this month",
    "expenseAnalysis": "2-3 sentences on spending patterns and largest categories",
    "taxStatus":       "1-2 sentences on estimated tax impact",
    "savingsProgress": "1-2 sentences on savings rate and goal momentum",
    "keyActionItems":  ["Action 1", "Action 2", "Action 3"]
  }
}`;

  if (groq) {
    try {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
      return res.status(200).json({
        success: true,
        data: {
          month, year,
          metrics: { totalIncome, totalExpense, netSavings, savingsRate, overdueCount },
          sections: parsed.sections || {},
        },
      });
    } catch (llmErr) {
      logger.warn({ err: llmErr.message }, "[AI] Groq call failed; using deterministic fallback");
    }
  }

  // Deterministic Fallback
  return res.status(200).json({
    success: true,
    data: {
      month, year,
      metrics: { totalIncome, totalExpense, netSavings, savingsRate, overdueCount },
      sections: {
        incomeSummary: `Earned ${fmt(totalIncome)} in ${monthName}. Direct earnings were ${fmt(directIncome)} alongside ${fmt(invoiceIncome)} collected through client invoices.`,
        expenseAnalysis: `Total spending was ${fmt(totalExpense)}. Highest expense categories this month: ${topCategories || "Standard business overhead"}.`,
        taxStatus: `Based on current YTD receipts, continue setting aside ~15-20% into your tax reserve.`,
        savingsProgress: `Retained ${fmt(netSavings)} with a ${savingsRate}% net savings rate across ${activeGoals} active goals.`,
        keyActionItems: [
          overdueCount > 0 ? `Follow up on ${overdueCount} overdue invoice(s).` : "Maintain client invoicing cadence.",
          savingsRate < 25 ? "Aim to lift savings rate above 25%." : "Great savings rate this month!",
          "Review upcoming quarterly advance tax dates.",
        ],
      },
    },
  });
});

// ─── AI Insights ──────────────────────────────────────────────────────────────
const getAIInsights = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { start, end } = getCurrentMonthRange();

  const [incomes, expenses, invoices, health] = await Promise.all([
    Income.find({ userId, date: { $gte: start, $lte: end } }),
    Expense.find({ userId, date: { $gte: start, $lte: end } }),
    Invoice.find({ userId }),
    calculateDetailedHealthScore(userId),
  ]);

  const totalIncome = incomes.reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalExpense = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const overdueInvoices = invoices.filter((i) => i.status === "Overdue");

  const insights = [];
  if (health.totalScore < 60) {
    insights.push({ type: "danger", insight: `Financial Health is currently ${health.totalScore}/100 (${health.grade}). ${health.improvements[0] || "Review expenses."}` });
  } else {
    insights.push({ type: "success", insight: `Financial Health is solid at ${health.totalScore}/100 (${health.grade}). ${health.summary}` });
  }

  if (overdueInvoices.length > 0) {
    const overdueAmt = overdueInvoices.reduce((s, i) => s + Number(i.amount || i.totalAmount || 0), 0);
    insights.push({ type: "warning", insight: `You have ₹${overdueAmt.toLocaleString("en-IN")} in overdue client receivables across ${overdueInvoices.length} invoices.` });
  }

  if (totalIncome > 0 && totalExpense > totalIncome * 0.7) {
    insights.push({ type: "warning", insight: `Monthly expenses are currently ${Math.round((totalExpense / totalIncome) * 100)}% of income. Target staying below 60% for healthy runway.` });
  }

  return res.status(200).json({
    success: true,
    data: {
      insights,
      health_score: health.totalScore,
      health_explanation: health.summary,
      top_action: health.improvements[0] || "Maintain current income velocity.",
    },
  });
});

// ─── Health Score Explanation ────────────────────────────────────────────────
const getHealthScoreExplanation = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const health = await calculateDetailedHealthScore(userId);
  return res.status(200).json({
    success: true,
    data: {
      score: health.totalScore,
      grade: health.grade,
      summary: health.summary,
      breakdown: health.breakdown,
      suggestions: health.improvements,
    },
  });
});

// ─── Tax Saving Suggestions ───────────────────────────────────────────────────
const getTaxSavingSuggestions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user   = await User.findById(userId);
  const { start, end } = getCurrentMonthRange();

  const [incomes, expenses] = await Promise.all([
    Income.find({ userId, date: { $gte: start, $lte: end } }),
    Expense.find({ userId, date: { $gte: start, $lte: end } }),
  ]);

  const totalIncome  = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const deductions = {
    section80C: user?.investments80C || 0,
    section80D: user?.investments80D || 0,
  };

  const taxComp = compareAllRegimes(totalIncome * 12, totalExpense * 12, deductions);

  const defaultRecommendations = [
    { instrument: "Section 44ADA Presumptive Scheme", section: "44ADA", current: 0, recommended: 0, taxSaving: taxComp.annualTaxSavings || 45000, deadline: "July 31", priority: "High", reason: "Declare 50% profits if gross professional receipts are under ₹75L." },
    { instrument: "ELSS Mutual Funds", section: "80C", current: Number(user?.investments80C || 0), recommended: 150000, taxSaving: 46800, deadline: "March 31", priority: "High", reason: "Complete ₹1.5L limit under Old Regime with 3-year lock-in." },
    { instrument: "Health Insurance for Self & Parents", section: "80D", current: Number(user?.investments80D || 0), recommended: 50000, taxSaving: 15600, deadline: "March 31", priority: "Medium", reason: "Deduct up to ₹25k for self/family and ₹50k for senior citizen parents." },
    { instrument: "National Pension Scheme (NPS Tier-1)", section: "80CCD(1B)", current: 0, recommended: 50000, taxSaving: 15600, deadline: "March 31", priority: "Medium", reason: "Exclusive ₹50,000 deduction over and above Section 80C." },
  ];

  return res.status(200).json({
    success: true,
    data: defaultRecommendations,
  });
});

// ─── Cash Flow Forecast ───────────────────────────────────────────────────────
const getCashFlowForecast = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const [forecastResult, runwayResult] = await Promise.all([
    generateCashFlowForecast(userId),
    calculateCashRunway(userId),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      history: forecastResult.history,
      forecast: forecastResult.forecast,
      pendingInvoiceValue: forecastResult.pendingInvoiceValue,
      runway: runwayResult.runwayDisplay,
      confidenceLevel: forecastResult.confidenceLevel,
      confidenceReason: forecastResult.confidenceReason,
    },
  });
});

module.exports = {
  getMonthlyReport,
  getAIInsights,
  getHealthScoreExplanation,
  getTaxSavingSuggestions,
  getCashFlowForecast,
};
