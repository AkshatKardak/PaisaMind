const asyncHandler = require("express-async-handler");
const { Groq } = require("groq-sdk");
const Income = require("../models/Income");
const Expense = require("../models/Expense");
const Invoice = require("../models/Invoice");
const Goal = require("../models/Goal");
const User = require("../models/User");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const getLastMonthsRange = (months = 6) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const monthKey = (date) =>
  new Date(date).toLocaleString("en-IN", { month: "short", year: "numeric" });

const buildMonthlyTrend = (items, dateField, amountField) => {
  const map = {};
  items.forEach((item) => {
    const key = monthKey(item[dateField]);
    map[key] = (map[key] || 0) + Number(item[amountField] || 0);
  });
  return Object.entries(map).map(([month, total]) => ({ month, total }));
};

const getAIInsights = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const { start, end } = getCurrentMonthRange();

  const [incomes, expenses, invoices, goals] = await Promise.all([
    Income.find({ userId, date: { $gte: start, $lte: end } }).sort({ date: -1 }),
    Expense.find({ userId, date: { $gte: start, $lte: end } }).sort({ date: -1 }),
    Invoice.find({ userId }).sort({ createdAt: -1 }),
    Goal.find({ userId }).sort({ createdAt: -1 }),
  ]);

  const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const profit = totalIncome - totalExpense;
  const overdueInvoices = invoices.filter((inv) => inv.status === "Overdue");
  const unpaidInvoices = invoices.filter((inv) => inv.status === "Unpaid");

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

    const raw = response.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);

    return res.status(200).json({
      success: true,
      data: parsed.insights || [],
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      data: [
        {
          title: "Income check",
          description: profit >= 0
            ? "Your income is ahead of expenses this month."
            : "Your expenses are higher than income this month.",
          type: profit >= 0 ? "positive" : "warning",
        },
        {
          title: "Invoice follow-up",
          description: `${overdueInvoices.length} invoices are overdue and need immediate follow-up.`,
          type: overdueInvoices.length > 0 ? "danger" : "info",
        },
      ],
    });
  }
});

const getHealthScoreExplanation = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const { start, end } = getCurrentMonthRange();

  const [incomes, expenses, invoices] = await Promise.all([
    Income.find({ userId, date: { $gte: start, $lte: end } }),
    Expense.find({ userId, date: { $gte: start, $lte: end } }),
    Invoice.find({ userId }),
  ]);

  const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const savingsRatio = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;
  const paidInvoices = invoices.filter((inv) => inv.status === "Paid").length;
  const invoiceScore = invoices.length > 0 ? paidInvoices / invoices.length : 0;

  const score =
    Math.max(0, Math.min(100,
      Math.round(
        savingsRatio * 25 +
        (1 - Math.min(totalExpense / (totalIncome || 1), 1)) * 25 +
        invoiceScore * 25 +
        25
      )
    ));

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

    const raw = response.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);

    return res.status(200).json({
      success: true,
      data: {
        score,
        summary: parsed.summary || "Your financial health looks stable.",
        suggestions: parsed.suggestions || [],
      },
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      data: {
        score,
        summary: "Your score is based on income, expenses, and invoice collection.",
        suggestions: [
          "Reduce unnecessary recurring expenses.",
          "Follow up on unpaid invoices.",
          "Increase your savings ratio this month.",
        ],
      },
    });
  }
});

const getTaxSavingSuggestions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);

  const { start, end } = getCurrentMonthRange();
  const incomes = await Income.find({ userId, date: { $gte: start, $lte: end } });
  const expenses = await Expense.find({ userId, date: { $gte: start, $lte: end } });

  const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
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

    const raw = response.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);

    return res.status(200).json({
      success: true,
      data: parsed.recommendations || [],
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      data: [
        {
          instrument: "ELSS",
          section: "80C",
          current: Number(user?.investments80C || 0),
          recommended: 150000,
          taxSaving: 0,
          deadline: "March 31",
          priority: "High",
          reason: "ELSS can help you complete 80C limits and save tax.",
        },
      ],
    });
  }
});

const getCashFlowForecast = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { start, end } = getLastMonthsRange(6);

  const incomes = await Income.find({ userId, date: { $gte: start, $lte: end } }).sort({ date: 1 });
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
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const growth =
      values.length > 1
        ? (values[values.length - 1] - values[0]) / Math.max(values[0], 1)
        : 0;

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
  getAIInsights,
  getHealthScoreExplanation,
  getTaxSavingSuggestions,
  getCashFlowForecast,
};