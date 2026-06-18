const asyncHandler = require("express-async-handler");
const { Groq } = require("groq-sdk");
const Income  = require("../models/Income");
const Expense = require("../models/Expense");
const Invoice = require("../models/Invoice");
const Goal    = require("../models/Goal");
const User    = require("../models/User");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

  // Fix: use paidAt (when money actually arrived) instead of dueDate for income realisation
  const paidInvoicesThisMonth = invoices.filter((inv) => {
    if (!["Paid", "Partially Paid"].includes(inv.status)) return false;
    const ref = inv.paidAt ? new Date(inv.paidAt) : (inv.dueDate ? new Date(inv.dueDate) : new Date(inv.createdAt));
    return ref >= start && ref <= end;
  });

  const invoiceIncome  = paidInvoicesThisMonth.reduce((sum, inv) => sum + Number(inv.amount || inv.total || 0), 0);
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
    .map(([cat, amt]) => `${cat} (\u20b9${amt.toLocaleString("en-IN")})`)
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

  const fmt = (n) => `\u20b9${Number(n).toLocaleString("en-IN")}`;

  const prompt = `You are a financial advisor for Indian freelancers.
Write a concise, friendly narrative monthly report for ${monthName}.

Financial data:
- Income from invoices: ${fmt(invoiceIncome)} (${paidInvoicesThisMonth.length} paid invoices)
- Income from direct entries: ${fmt(directIncome)}
- TOTAL income: ${fmt(totalIncome)}
- Total expenses: ${fmt(totalExpense)}
- Top expense categories: ${topCategories || "None"}
- Net savings: ${fmt(netSavings)}
- Savings rate: ${savingsRate}%
- Tax regime: ${user?.taxRegime || "Not set"}
- 80C invested: ${fmt(user?.investments80C || 0)}
- 80D invested: ${fmt(user?.investments80D || 0)}
- Active financial goals: ${activeGoals}
- Unpaid invoices: ${unpaidCount}
- Overdue invoices: ${overdueCount}
- Paid invoices (all time): ${totalPaidCount}

Respond ONLY with valid JSON — no markdown, no code fences:
{
  "incomeSummary": "2-3 sentence narrative about income this month",
  "expenseAnalysis": "2-3 sentence narrative about expenses and categories",
  "taxStatus": "2-3 sentence narrative about tax implications and 80C/80D status",
  "savingsProgress": "2-3 sentence narrative about savings and goals",
  "keyActionItems": ["action 1", "action 2", "action 3"]
}`;

  try {
    const response = await groq.chat.completions.create({
      model:       "llama-3.3-70b-versatile",
      messages:    [{ role: "user", content: prompt }],
      temperature: 0.5,
    });

    let raw = response.choices?.[0]?.message?.content || "{}";
    raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(raw);

    return res.status(200).json({
      success: true,
      data: {
        month, year,
        sections: {
          incomeSummary:   parsed.incomeSummary   || null,
          expenseAnalysis: parsed.expenseAnalysis || null,
          taxStatus:       parsed.taxStatus       || null,
          savingsProgress: parsed.savingsProgress || null,
          keyActionItems:  Array.isArray(parsed.keyActionItems) ? parsed.keyActionItems : [],
        },
      },
    });
  } catch (err) {
    console.error("[getMonthlyReport] Groq error:", err.message);
    return res.status(200).json({
      success: true,
      data: {
        month, year,
        sections: {
          incomeSummary:   `You earned ${fmt(totalIncome)} in ${monthName} (${fmt(invoiceIncome)} from invoices, ${fmt(directIncome)} from direct entries).`,
          expenseAnalysis: totalExpense > 0
            ? `Your total expenses were ${fmt(totalExpense)}. Top categories: ${topCategories || "N/A"}.`
            : "No expenses recorded for this month.",
          taxStatus: user?.taxRegime
            ? `You are on the ${user.taxRegime} tax regime. 80C invested: ${fmt(user.investments80C || 0)}.`
            : "Tax regime not set. Go to Settings to configure it for better tax insights.",
          savingsProgress: `You saved ${fmt(Math.max(netSavings, 0))} this month — a ${savingsRate}% savings rate.`,
          keyActionItems: [
            unpaidCount  > 0 ? `Follow up on ${unpaidCount} unpaid invoice${unpaidCount > 1 ? "s" : ""}.` : null,
            overdueCount > 0 ? `${overdueCount} invoice${overdueCount > 1 ? "s are" : " is"} overdue — send reminders immediately.` : null,
            savingsRate  < 20 ? "Aim for a 20%+ savings rate. Review your top expense categories." : null,
            !user?.taxRegime ? "Set your tax regime in Settings to get personalised tax insights." : null,
          ].filter(Boolean),
        },
      },
    });
  }
});

// ─── AI Insights (Dashboard) ─────────────────────────────────────────────────
const getAIInsights = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { start, end } = getCurrentMonthRange();

  const [incomes, expenses, invoices, goals] = await Promise.all([
    Income.find({ userId, date: { $gte: start, $lte: end } }).sort({ date: -1 }),
    Expense.find({ userId, date: { $gte: start, $lte: end } }).sort({ date: -1 }),
    Invoice.find({ userId }).sort({ createdAt: -1 }),
    Goal.find({ userId }).sort({ createdAt: -1 }),
  ]);

  const totalIncome    = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpense   = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const profit         = totalIncome - totalExpense;
  const overdueInvoices = invoices.filter((inv) => inv.status === "Overdue");
  const unpaidInvoices  = invoices.filter((inv) => inv.status === "Unpaid");

  const prompt = `
You are a financial assistant for Indian freelancers.
Analyze this data and return 5 short actionable insights in JSON only.

Data:
- Total income this month: ${totalIncome}
- Total expenses this month: ${totalExpense}
- Profit: ${profit}
- Number of unpaid invoices: ${unpaidInvoices.length}
- Number of overdue invoices: ${overdueInvoices.length}
- Total goals: ${goals.length}

Format:
{
  "insights": [
    {
      "title": "string",
      "description": "string",
      "type": "positive|warning|danger|info"
    }
  ]
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });
    const raw    = response.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    return res.status(200).json({ success: true, data: parsed.insights || [] });
  } catch (error) {
    return res.status(200).json({
      success: true,
      data: [
        { title: "Income check", description: profit >= 0 ? "Your income is ahead of expenses this month." : "Your expenses are higher than income this month.", type: profit >= 0 ? "positive" : "warning" },
        { title: "Invoice follow-up", description: `${overdueInvoices.length} invoices are overdue and need immediate follow-up.`, type: overdueInvoices.length > 0 ? "danger" : "info" },
      ],
    });
  }
});

// ─── Health Score Explanation ─────────────────────────────────────────────────
const getHealthScoreExplanation = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { start, end } = getCurrentMonthRange();

  const [incomes, expenses, invoices] = await Promise.all([
    Income.find({ userId, date: { $gte: start, $lte: end } }),
    Expense.find({ userId, date: { $gte: start, $lte: end } }),
    Invoice.find({ userId }),
  ]);

  const totalIncome  = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const savingsRatio = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;
  const paidInvoices = invoices.filter((inv) => inv.status === "Paid").length;
  const invoiceScore = invoices.length > 0 ? paidInvoices / invoices.length : 0;

  // Fix: removed the hardcoded '+ 25' bonus that inflated every score by 25 points for free.
  // Score is now purely derived from real data across 3 equal dimensions (max 100).
  // savingsComponent: up to 40 pts — rewards saving >20% of income
  // expenseComponent: up to 30 pts — rewards keeping expenses below 80% of income
  // invoiceComponent: up to 30 pts — rewards collecting payment on all invoices
  const savingsComponent = Math.min(savingsRatio / 0.4, 1) * 40;
  const expenseRatio      = totalIncome > 0 ? totalExpense / totalIncome : 1;
  const expenseComponent  = Math.max(0, (1 - expenseRatio / 0.8)) * 30;
  const invoiceComponent  = invoiceScore * 30;

  const score = Math.max(0, Math.min(100, Math.round(
    savingsComponent + expenseComponent + invoiceComponent
  )));

  const prompt = `
Explain this financial health score in plain English for an Indian freelancer.
Score: ${score}
Income: ${totalIncome}
Expenses: ${totalExpense}
Savings ratio: ${Math.round(savingsRatio * 100)}%
Invoice payment rate: ${Math.round(invoiceScore * 100)}%

Return concise JSON:
{
  "summary": "string",
  "suggestions": ["string"]
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });
    const raw    = response.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    return res.status(200).json({
      success: true,
      data: { score, summary: parsed.summary || "Your financial health looks stable.", suggestions: parsed.suggestions || [] },
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      data: {
        score,
        summary: "Your score is based on income, expenses, and invoice collection.",
        suggestions: ["Reduce unnecessary recurring expenses.", "Follow up on unpaid invoices.", "Increase your savings ratio this month."],
      },
    });
  }
});

// ─── Tax Saving Suggestions ───────────────────────────────────────────────────
const getTaxSavingSuggestions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user   = await User.findById(userId);
  const { start, end } = getCurrentMonthRange();

  const incomes  = await Income.find({ userId, date: { $gte: start, $lte: end } });
  const expenses = await Expense.find({ userId, date: { $gte: start, $lte: end } });

  const totalIncome  = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const prompt = `
You are an Indian tax-saving assistant.
Use this user profile and return ranked tax-saving recommendations in JSON only.

User:
- Name: ${user?.name || "User"}
- Monthly income: ${totalIncome}
- Monthly expenses: ${totalExpense}
- Current tax regime: ${user?.taxRegime || "Unknown"}
- 80C invested: ${user?.investments80C || 0}
- 80D invested: ${user?.investments80D || 0}

Return:
{
  "recommendations": [
    {
      "instrument": "ELSS|PPF|NPS|Health Insurance|FD|Other",
      "section": "80C|80D|80CCD|Other",
      "current": number,
      "recommended": number,
      "taxSaving": number,
      "deadline": "string",
      "priority": "High|Medium|Low",
      "reason": "string"
    }
  ]
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });
    const raw    = response.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    return res.status(200).json({ success: true, data: parsed.recommendations || [] });
  } catch (error) {
    return res.status(200).json({
      success: true,
      data: [{ instrument: "ELSS", section: "80C", current: Number(user?.investments80C || 0), recommended: 150000, taxSaving: 0, deadline: "March 31", priority: "High", reason: "ELSS can help you complete 80C limits and save tax." }],
    });
  }
});

// ─── Cash Flow Forecast ───────────────────────────────────────────────────────
const getCashFlowForecast = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { start, end } = getLastMonthsRange(6);

  const incomes  = await Income.find({ userId, date: { $gte: start, $lte: end } }).sort({ date: 1 });
  const invoices = await Invoice.find({ userId, status: "Unpaid" });

  const monthlyData = {};
  incomes.forEach((item) => {
    const key = monthKey(item.date);
    monthlyData[key] = (monthlyData[key] || 0) + Number(item.amount || 0);
  });

  const months = Object.keys(monthlyData);
  const values = Object.values(monthlyData);

  let forecast = [];
  if (values.length > 0) {
    const recent = values.slice(-3);
    const avg    = recent.reduce((a, b) => a + b, 0) / recent.length;
    const growth = values.length > 1 ? (values[values.length - 1] - values[0]) / Math.max(values[0], 1) : 0;
    for (let i = 1; i <= 3; i++) {
      forecast.push({
        month: `Month ${i}`,
        predictedIncome: Math.max(0, Math.round(avg * (1 + growth * 0.1 * i))),
        confidence: values.length >= 4 ? "High" : values.length >= 2 ? "Medium" : "Low",
      });
    }
  }

  const pendingInvoiceValue = invoices.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return res.status(200).json({
    success: true,
    data: {
      history: months.map((month, idx) => ({ month, income: values[idx] })),
      forecast,
      pendingInvoiceValue,
      runway: "Estimated based on current income and expenses",
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
