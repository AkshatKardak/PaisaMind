const Income = require("../models/Income");
const Expense = require("../models/Expense");
const Invoice = require("../models/Invoice");
const RecurringTransaction = require("../models/RecurringTransaction");
const User = require("../models/User");
const { calculateCashRunway } = require("../services/runwayService");
const { generateCashFlowForecast } = require("../services/forecastingService");
const { detectSpendingAnomalies, detectDuplicates } = require("../services/anomalyService");
const { detectRecurringSubscriptions } = require("../services/recurringIntelligenceService");
const { analyzeIncomeVolatility } = require("../services/incomeVolatilityService");
const { analyzeInvoiceRisk } = require("../services/invoiceRiskService");
const { simulateScenario } = require("../services/simulationService");
const { calculateNetWorthAndDebt } = require("../services/netWorthService");
const { calculateDetailedHealthScore } = require("../services/healthEngineService");
const { calculateProfitabilityOverview } = require("../services/profitabilityService");
const {
  computeNewRegimeTax,
  computeOldRegimeTax,
  compute44ADATax,
  compareAllRegimes,
  calculateRecommendedTaxReserve,
  calculateGSTStatus,
} = require("../services/taxIntelligenceService");

/**
 * Registry of 19 server-side deterministic financial tools with OpenAPI/JSON Schema specifications
 */
const FINANCIAL_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_financial_summary",
      description: "Get a comprehensive financial summary including total income, total expenses, net savings, cash balance, and runway for the user.",
      parameters: {
        type: "object",
        properties: {
          month: { type: "integer", description: "Month number 1-12 (defaults to current month)" },
          year: { type: "integer", description: "4-digit year (defaults to current year)" },
        },
      },
    },
    execute: async (userId, args = {}) => {
      const now = new Date();
      const month = args.month || (now.getMonth() + 1);
      const year = args.year || now.getFullYear();
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);

      const [incomes, expenses, runway, health] = await Promise.all([
        Income.find({ userId, date: { $gte: start, $lte: end } }),
        Expense.find({ userId, date: { $gte: start, $lte: end } }),
        calculateCashRunway(userId),
        calculateDetailedHealthScore(userId),
      ]);

      const totalIncome = incomes.reduce((s, i) => s + Number(i.amount || 0), 0);
      const totalExpense = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
      const netSavings = totalIncome - totalExpense;

      return {
        month,
        year,
        totalIncome: Math.round(totalIncome),
        totalExpense: Math.round(totalExpense),
        netSavings: Math.round(netSavings),
        savingsRate: totalIncome > 0 ? `${Math.round((netSavings / totalIncome) * 100)}%` : "0%",
        liquidCashBalance: runway.liquidCashBalance,
        cashRunwayMonths: runway.expectedRunwayMonths,
        financialHealthScore: health.totalScore,
        healthGrade: health.grade,
      };
    },
  },
  {
    type: "function",
    function: {
      name: "get_monthly_income",
      description: "Get monthly income history, average monthly income, stability score, and volatility breakdown.",
      parameters: {
        type: "object",
        properties: {
          months: { type: "integer", description: "Number of past months to retrieve (defaults to 6)" },
        },
      },
    },
    execute: async (userId, args = {}) => {
      return await analyzeIncomeVolatility(userId, args.months || 6);
    },
  },
  {
    type: "function",
    function: {
      name: "get_monthly_expenses",
      description: "Get total monthly expenses, recurring vs discretionary split, and monthly burn rate.",
      parameters: {
        type: "object",
        properties: {
          months: { type: "integer", description: "Number of past months to analyze (defaults to 6)" },
        },
      },
    },
    execute: async (userId, args = {}) => {
      const months = args.months || 6;
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

      const expenses = await Expense.find({ userId, date: { $gte: start } }).sort({ date: 1 });
      const monthlyMap = {};

      expenses.forEach((e) => {
        const d = new Date(e.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!monthlyMap[key]) monthlyMap[key] = { total: 0, recurring: 0, count: 0 };
        monthlyMap[key].total += Number(e.amount || 0);
        if (e.isRecurring) monthlyMap[key].recurring += Number(e.amount || 0);
        monthlyMap[key].count += 1;
      });

      return {
        periodMonths: months,
        monthlyHistory: Object.entries(monthlyMap).map(([month, data]) => ({
          month,
          totalExpense: Math.round(data.total),
          recurringExpense: Math.round(data.recurring),
          discretionaryExpense: Math.round(data.total - data.recurring),
          transactionsCount: data.count,
        })),
      };
    },
  },
  {
    type: "function",
    function: {
      name: "get_spending_by_category",
      description: "Get expense breakdown grouped by category for a given month or recent months.",
      parameters: {
        type: "object",
        properties: {
          month: { type: "integer", description: "Month number 1-12 (defaults to current month)" },
          year: { type: "integer", description: "4-digit year (defaults to current year)" },
        },
      },
    },
    execute: async (userId, args = {}) => {
      const now = new Date();
      const month = args.month || (now.getMonth() + 1);
      const year = args.year || now.getFullYear();
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);

      const expenses = await Expense.find({ userId, date: { $gte: start, $lte: end } });
      const catMap = {};
      let total = 0;

      expenses.forEach((e) => {
        const cat = e.category || "Other";
        const amt = Number(e.amount || 0);
        catMap[cat] = (catMap[cat] || 0) + amt;
        total += amt;
      });

      const categories = Object.entries(catMap)
        .map(([category, amount]) => ({
          category,
          amount: Math.round(amount),
          percentage: total > 0 ? Number(((amount / total) * 100).toFixed(1)) : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      return { month, year, totalSpending: Math.round(total), categories };
    },
  },
  {
    type: "function",
    function: {
      name: "get_cash_balance",
      description: "Get the user's current liquid cash balance, net available cash after tax reserves, and bank account balances.",
      parameters: { type: "object", properties: {} },
    },
    execute: async (userId) => {
      const runway = await calculateCashRunway(userId);
      const netWorth = await calculateNetWorthAndDebt(userId);
      return {
        liquidCashBalance: runway.liquidCashBalance,
        netAvailableCashAfterTaxReserve: runway.netAvailableCash,
        monthlyBurnRate: runway.monthlyBurnRate,
        liquidAssets: netWorth.assets.filter((a) => a.isLiquid),
      };
    },
  },
  {
    type: "function",
    function: {
      name: "get_cashflow_forecast",
      description: "Get 30, 60, and 90 day statistical cash flow forecasts with upper and lower confidence bounds.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "integer", description: "Forecast horizon in days: 30, 60, or 90 (defaults to 90)" },
        },
      },
    },
    execute: async (userId, args = {}) => {
      return await generateCashFlowForecast(userId);
    },
  },
  {
    type: "function",
    function: {
      name: "get_upcoming_expenses",
      description: "Get scheduled recurring expenses, upcoming EMIs, and bills due in the next 30 days.",
      parameters: { type: "object", properties: {} },
    },
    execute: async (userId) => {
      const now = new Date();
      const next30Days = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

      const [recurring, netWorth] = await Promise.all([
        RecurringTransaction.find({
          userId,
          type: "expense",
          $or: [{ active: true }, { isActive: true }],
        }),
        calculateNetWorthAndDebt(userId),
      ]);

      return {
        upcomingRecurringExpenses: recurring.map((r) => ({
          title: r.title,
          amount: r.amount,
          frequency: r.frequency,
          nextRunAt: r.nextRunAt,
          category: r.category,
        })),
        upcomingEmis: netWorth.upcomingEmis,
        totalMonthlyCommitments: (recurring.reduce((s, r) => s + r.amount, 0)) + netWorth.totalMonthlyEmi,
      };
    },
  },
  {
    type: "function",
    function: {
      name: "get_recurring_expenses",
      description: "List all active recurring subscriptions, SaaS tools, rent, and monthly commitments.",
      parameters: { type: "object", properties: {} },
    },
    execute: async (userId) => {
      return await detectRecurringSubscriptions(userId);
    },
  },
  {
    type: "function",
    function: {
      name: "get_invoice_summary",
      description: "Get summary of all invoices: paid, unpaid, overdue, total receivables, and collection rate.",
      parameters: { type: "object", properties: {} },
    },
    execute: async (userId) => {
      const invoices = await Invoice.find({ userId });
      const now = new Date();

      let paid = 0;
      let unpaid = 0;
      let overdue = 0;
      let paidCount = 0;
      let unpaidCount = 0;
      let overdueCount = 0;

      invoices.forEach((inv) => {
        const amt = Number(inv.amount || inv.totalAmount || 0);
        if (["Paid", "Partially Paid"].includes(inv.status)) {
          paid += amt;
          paidCount++;
        } else if (inv.status === "Overdue" || (inv.status === "Unpaid" && new Date(inv.dueDate) < now)) {
          overdue += amt;
          overdueCount++;
        } else {
          unpaid += amt;
          unpaidCount++;
        }
      });

      return {
        totalInvoicesCount: invoices.length,
        totalPaidAmount: Math.round(paid),
        paidCount,
        totalUnpaidAmount: Math.round(unpaid),
        unpaidCount,
        totalOverdueAmount: Math.round(overdue),
        overdueCount,
        totalOutstandingReceivables: Math.round(unpaid + overdue),
        collectionRate: (paid + unpaid + overdue) > 0 ? `${Math.round((paid / (paid + unpaid + overdue)) * 100)}%` : "100%",
      };
    },
  },
  {
    type: "function",
    function: {
      name: "get_invoice_risk",
      description: "Assess payment delay risk on pending and overdue invoices, categorized by client reliability.",
      parameters: { type: "object", properties: {} },
    },
    execute: async (userId) => {
      return await analyzeInvoiceRisk(userId);
    },
  },
  {
    type: "function",
    function: {
      name: "get_tax_estimate",
      description: "Calculate deterministic Indian income tax liabilities comparing Old Regime, New Regime, and Section 44ADA presumptive taxation.",
      parameters: {
        type: "object",
        properties: {
          regime: { type: "string", enum: ["new", "old", "compare"], description: "Tax regime to compute or compare" },
        },
      },
    },
    execute: async (userId, args = {}) => {
      const now = new Date();
      const fyStart = new Date(now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1, 3, 1);
      const [incomes, expenses, user] = await Promise.all([
        Income.find({ userId, date: { $gte: fyStart } }),
        Expense.find({ userId, date: { $gte: fyStart } }),
        User.findById(userId),
      ]);

      const grossIncome = incomes.reduce((s, i) => s + Number(i.amount || 0), 0);
      const eligibleExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

      const deductions = {
        section80C: user?.investments80C || 0,
        section80D: user?.investments80D || 0,
      };

      return compareAllRegimes(grossIncome, eligibleExpenses, deductions);
    },
  },
  {
    type: "function",
    function: {
      name: "get_tax_reserve",
      description: "Get the recommended tax reserve to set aside from income based on current YTD earnings and tax slabs.",
      parameters: {
        type: "object",
        properties: {
          newIncomeAmount: { type: "number", description: "Optional incoming transaction amount to compute exact marginal reserve for" },
        },
      },
    },
    execute: async (userId, args = {}) => {
      const now = new Date();
      const fyStart = new Date(now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1, 3, 1);
      const incomes = await Income.find({ userId, date: { $gte: fyStart } });
      const ytdIncome = incomes.reduce((s, i) => s + Number(i.amount || 0), 0);

      return calculateRecommendedTaxReserve({
        ytdIncome,
        newIncomeAmount: args.newIncomeAmount || 0,
        regime: "new",
        use44ADA: true,
      });
    },
  },
  {
    type: "function",
    function: {
      name: "get_financial_health",
      description: "Get the user's transparent 8-component Financial Health Score (0-100) with detailed component breakdowns.",
      parameters: { type: "object", properties: {} },
    },
    execute: async (userId) => {
      return await calculateDetailedHealthScore(userId);
    },
  },
  {
    type: "function",
    function: {
      name: "get_net_worth",
      description: "Get total assets, total liabilities, net worth, and asset/liability breakdown.",
      parameters: { type: "object", properties: {} },
    },
    execute: async (userId) => {
      return await calculateNetWorthAndDebt(userId);
    },
  },
  {
    type: "function",
    function: {
      name: "get_debt_summary",
      description: "Get active loans, EMIs, credit card balances, debt-to-income ratio, and upcoming payment pressure.",
      parameters: { type: "object", properties: {} },
    },
    execute: async (userId) => {
      const data = await calculateNetWorthAndDebt(userId);
      return {
        totalLiabilities: data.totalLiabilities,
        totalMonthlyEmi: data.totalMonthlyEmi,
        dtiPercentage: data.dtiPercentage,
        dtiRisk: data.dtiRisk,
        liabilities: data.liabilities,
        upcomingEmis: data.upcomingEmis,
      };
    },
  },
  {
    type: "function",
    function: {
      name: "detect_anomalies",
      description: "Scan for spending spikes, category budget surges, and duplicate transactions.",
      parameters: {
        type: "object",
        properties: {
          months: { type: "integer", description: "Number of past months to scan (defaults to 6)" },
        },
      },
    },
    execute: async (userId, args = {}) => {
      const [spendingAnomalies, duplicates] = await Promise.all([
        detectSpendingAnomalies(userId, args.months || 6),
        detectDuplicates(userId, 3),
      ]);
      return {
        spendingAnomalies: spendingAnomalies.anomalies,
        potentialDuplicates: duplicates,
        hasSufficientData: spendingAnomalies.hasSufficientData,
      };
    },
  },
  {
    type: "function",
    function: {
      name: "get_subscription_summary",
      description: "Analyze all detected SaaS software, cloud subscriptions, internet, and recurring expenses with price increases.",
      parameters: { type: "object", properties: {} },
    },
    execute: async (userId) => {
      return await detectRecurringSubscriptions(userId);
    },
  },
  {
    type: "function",
    function: {
      name: "get_client_payment_reliability",
      description: "Check reliability score and payment delay history for a specific client or all clients.",
      parameters: {
        type: "object",
        properties: {
          clientName: { type: "string", description: "Name of the client to inspect" },
        },
      },
    },
    execute: async (userId, args = {}) => {
      const riskData = await analyzeInvoiceRisk(userId);
      if (args.clientName) {
        const found = riskData.clients?.find(
          (c) => c.clientName.toLowerCase().includes(args.clientName.toLowerCase())
        );
        return found || { message: `No historical invoice records found for client "${args.clientName}".` };
      }
      return riskData;
    },
  },
  {
    type: "function",
    function: {
      name: "simulate_financial_scenario",
      description: "Simulate what happens if income changes, a major one-time purchase is made, a new recurring expense is added, or an invoice is delayed.",
      parameters: {
        type: "object",
        properties: {
          scenarioType: {
            type: "string",
            enum: ["large_purchase", "income_decrease", "income_increase", "new_recurring_expense", "delayed_invoice", "new_emi"],
            description: "Type of scenario to test",
          },
          itemDescription: { type: "string", description: "Description of the item or action (e.g. '₹70k MacBook Air')" },
        },
        required: ["scenarioType"],
      },
    },
    execute: async (userId, args) => {
      return await simulateScenario(userId, args);
    },
  },
  {
    type: "function",
    function: {
      name: "get_client_profitability",
      description: "Get real effective hourly rates, profit margin %, direct project costs, client ROI tier classification (A/B/C/D), and scope creep alerts for clients and projects.",
      parameters: {
        type: "object",
        properties: {
          clientName: { type: "string", description: "Optional name of specific client to inspect" },
        },
      },
    },
    execute: async (userId, args = {}) => {
      const overview = await calculateProfitabilityOverview(userId);
      if (args.clientName) {
        const found = overview.clients.find((c) =>
          c.clientName.toLowerCase().includes(args.clientName.toLowerCase())
        );
        return found || { message: `No project or billing records found for client "${args.clientName}".` };
      }
      return overview;
    },
  },
];

module.exports = {
  FINANCIAL_TOOLS,
};
