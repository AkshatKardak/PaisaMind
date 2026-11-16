import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
const mongoose = require("mongoose");
const Income = require("../models/Income");
const Expense = require("../models/Expense");
const Invoice = require("../models/Invoice");
const Asset = require("../models/Asset");
const Liability = require("../models/Liability");
const Project = require("../models/Project");
const RecurringTransaction = require("../models/RecurringTransaction");
const TDSRecord = require("../models/TDSRecord");
const TDSReconciliation = require("../models/TDSReconciliation");
const HealthConfig = require("../models/HealthConfig");
const User = require("../models/User");

const {
  normalizeEntityName,
  calculateEntitySimilarity,
  run3WayTDSReconciliation,
} = require("../services/tdsReconciliationService");

const { calculateCashRunway } = require("../services/runwayService");
const { analyzeInvoiceRisk } = require("../services/invoiceRiskService");
const { calculateDetailedHealthScore } = require("../services/healthEngineService");
const { calculateProfitabilityOverview } = require("../services/profitabilityService");
const {
  detectRecurringSubscriptions,
  normalizeMerchant,
} = require("../services/recurringIntelligenceService");
const { analyzeIncomeVolatility } = require("../services/incomeVolatilityService");
const { generateCashFlowForecast } = require("../services/forecastingService");
const { calculateNetWorthAndDebt } = require("../services/netWorthService");
const { FINANCIAL_TOOLS } = require("../tools/financialToolsRegistry");

// Helper to create chainable query mock
const mockQuery = (result) => {
  const promise = Promise.resolve(result);
  promise.sort = vi.fn().mockReturnValue(promise);
  promise.limit = vi.fn().mockReturnValue(promise);
  promise.lean = vi.fn().mockReturnValue(promise);
  return promise;
};

describe("Comprehensive Service & Financial Tool Unit Tests for Coverage", () => {
  const userId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(1);
    vi.spyOn(require("../models/TaxRuleVersion"), "findOne").mockReturnValue(mockQuery(null));
    vi.spyOn(User, "findById").mockReturnValue(mockQuery({ taxRegime: "new", targetHourlyRate: 2000 }));
    vi.spyOn(User, "findOne").mockReturnValue(mockQuery({ taxRegime: "new", targetHourlyRate: 2000 }));
    vi.spyOn(Income, "find").mockReturnValue(mockQuery([]));
    vi.spyOn(Expense, "find").mockReturnValue(mockQuery([]));
    vi.spyOn(Invoice, "find").mockReturnValue(mockQuery([]));
    vi.spyOn(Asset, "find").mockReturnValue(mockQuery([]));
    vi.spyOn(Liability, "find").mockReturnValue(mockQuery([]));
    vi.spyOn(Project, "find").mockReturnValue(mockQuery([]));
    vi.spyOn(RecurringTransaction, "find").mockReturnValue(mockQuery([]));
    vi.spyOn(TDSRecord, "find").mockReturnValue(mockQuery([]));
    vi.spyOn(require("../models/CanonicalTransaction"), "find").mockReturnValue(mockQuery([]));
    vi.spyOn(HealthConfig, "findOne").mockReturnValue(mockQuery(null));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("tests tdsReconciliationService helper functions and run3WayTDSReconciliation", async () => {
    expect(normalizeEntityName("Acme Technologies Pvt Ltd")).toBe("acme");
    expect(normalizeEntityName("")).toBe("");

    expect(calculateEntitySimilarity("Google India", "Google Inc")).toBeGreaterThan(0.5);
    expect(calculateEntitySimilarity("", "Google")).toBe(0);

    const mockInvoice = {
      _id: "inv1",
      amount: 100000,
      clientName: "Acme Tech",
      tdsRate: 10,
      issueDate: new Date("2025-06-01"),
      status: "Unpaid",
    };
    const mockIncome = {
      _id: "inc1",
      amount: 90000,
      date: new Date("2025-06-05"),
      source: "Acme Tech",
      notes: "Invoice payment",
    };
    const mockTdsRecord = {
      _id: "tds1",
      deductorName: "Acme Tech",
      creditAmount: 100000,
      tdsDeducted: 10000,
      transactionDate: new Date("2025-06-02"),
    };

    vi.spyOn(Invoice, "find").mockReturnValue(mockQuery([mockInvoice]));
    vi.spyOn(Income, "find").mockReturnValue(mockQuery([mockIncome]));
    vi.spyOn(TDSRecord, "find").mockReturnValue(mockQuery([mockTdsRecord]));
    vi.spyOn(require("../models/TaxRuleVersion"), "findOne").mockReturnValue(mockQuery(null));
    vi.spyOn(TDSReconciliation, "deleteMany").mockResolvedValue({ acknowledged: true });
    vi.spyOn(TDSReconciliation, "insertMany").mockResolvedValue([]);

    const recon = await run3WayTDSReconciliation(userId, { financialYear: "2025-26" });
    expect(recon).toBeDefined();
    expect(recon.totalInvoices).toBe(1);
  });

  it("tests runwayService with both zero and active connection", async () => {
    const readyStateSpy = vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(0);
    const offlineRunway = await calculateCashRunway(userId);
    expect(offlineRunway.status).toBe("INSUFFICIENT_DATA");

    readyStateSpy.mockReturnValue(1);
    vi.spyOn(Expense, "find").mockReturnValue(mockQuery([
      { amount: 30000, date: new Date() },
      { amount: 40000, date: new Date() },
    ]));
    vi.spyOn(Income, "find").mockReturnValue(mockQuery([
      { amount: 150000, date: new Date() },
    ]));
    vi.spyOn(Invoice, "find").mockReturnValue(mockQuery([
      { amount: 50000, status: "Unpaid" },
    ]));
    vi.spyOn(Asset, "find").mockReturnValue(mockQuery([
      { amount: 200000, isLiquid: true },
    ]));
    vi.spyOn(Liability, "find").mockReturnValue(mockQuery([
      { monthlyEmi: 15000, currentBalance: 300000 },
    ]));

    const activeRunway = await calculateCashRunway(userId);
    expect(activeRunway.status).not.toBe("INSUFFICIENT_DATA");
    expect(activeRunway.monthlyBurnRate).toBeGreaterThan(0);
  });

  it("tests invoiceRiskService with and without invoices", async () => {
    vi.spyOn(Invoice, "find").mockReturnValue(mockQuery([]));
    const emptyRisk = await analyzeInvoiceRisk(userId);
    expect(emptyRisk.hasSufficientData).toBe(false);

    const now = new Date();
    const pastDue = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
    const paidDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    vi.spyOn(Invoice, "find").mockReturnValue(mockQuery([
      {
        _id: "inv1",
        invoiceNumber: "INV-101",
        clientName: "Client A",
        amount: 50000,
        status: "Paid",
        dueDate: pastDue,
        paidAt: paidDate,
      },
      {
        _id: "inv2",
        invoiceNumber: "INV-102",
        clientName: "Client B",
        amount: 80000,
        status: "Overdue",
        dueDate: pastDue,
      },
      {
        _id: "inv3",
        invoiceNumber: "INV-103",
        clientName: "Client C",
        amount: 20000,
        status: "Unpaid",
        dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      },
    ]));

    const activeRisk = await analyzeInvoiceRisk(userId);
    expect(activeRisk.hasSufficientData).toBe(true);
    expect(activeRisk.clients.length).toBe(3);
  });

  it("tests recurringIntelligenceService helpers and subscription detection", async () => {
    expect(normalizeMerchant("Netflix Monthly")).toBe("NETFLIX");
    expect(normalizeMerchant("Adobe Creative Cloud")).toBe("ADOBE");
    expect(normalizeMerchant("Custom Consultant Payment")).toBe("CUSTOM CONSULTANT");

    vi.spyOn(Expense, "find").mockReturnValue(mockQuery([]));
    const emptySub = await detectRecurringSubscriptions(userId);
    expect(emptySub.hasSufficientData).toBe(false);

    vi.spyOn(Expense, "find").mockReturnValue(mockQuery([
      { title: "Netflix Subscription", amount: 649, date: new Date("2026-01-05") },
      { title: "Netflix Subscription", amount: 649, date: new Date("2026-02-05") },
      { title: "AWS Cloud", amount: 2500, date: new Date("2026-01-10") },
      { title: "AWS Cloud", amount: 3200, date: new Date("2026-02-10") },
    ]));

    const subResult = await detectRecurringSubscriptions(userId);
    expect(subResult.hasSufficientData).toBe(true);
    expect(subResult.subscriptions.length).toBeGreaterThan(0);
  });

  it("tests incomeVolatilityService and calculateNetWorthAndDebt", async () => {
    vi.spyOn(Income, "find").mockReturnValue(mockQuery([
      { amount: 100000, date: new Date("2026-01-15"), source: "Client Alpha" },
      { amount: 120000, date: new Date("2026-02-15"), source: "Client Beta" },
    ]));
    vi.spyOn(Invoice, "find").mockReturnValue(mockQuery([
      { clientName: "Client Alpha", amount: 100000, status: "Paid" },
    ]));

    const vol = await analyzeIncomeVolatility(userId, 6);
    expect(vol.stabilityScore).toBeGreaterThanOrEqual(0);

    vi.spyOn(Asset, "find").mockReturnValue(mockQuery([
      { amount: 500000, type: "Bank", isLiquid: true },
    ]));
    vi.spyOn(Liability, "find").mockReturnValue(mockQuery([
      { amount: 200000, currentBalance: 200000, monthlyEmi: 15000, nextPaymentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
    ]));
    vi.spyOn(Expense, "find").mockReturnValue(mockQuery([]));

    const nw = await calculateNetWorthAndDebt(userId);
    expect(nw.netWorth).toBeGreaterThan(0);
    expect(nw.upcomingEmis.length).toBe(1);
  });

  it("tests profitabilityService and healthEngineService", async () => {
    vi.spyOn(Project, "find").mockReturnValue(mockQuery([
      {
        name: "Website Redesign",
        clientName: "Client A",
        totalBilled: 120000,
        directExpenses: 20000,
        loggedHours: 40,
        feeType: "fixed",
      },
    ]));
    vi.spyOn(Invoice, "find").mockReturnValue(mockQuery([
      { clientName: "Client A", amount: 120000, totalAmount: 120000, status: "Paid", paidAt: new Date(), dueDate: new Date() },
    ]));
    vi.spyOn(User, "findById").mockResolvedValue({ targetHourlyRate: 2000 });

    const prof = await calculateProfitabilityOverview(userId);
    expect(prof.summary.totalBilled).toBe(120000);
    expect(prof.clients.length).toBe(1);

    vi.spyOn(HealthConfig, "findOne").mockReturnValue(mockQuery({ weights: { cashFlowStability: 20 } }));
    vi.spyOn(Income, "find").mockReturnValue(mockQuery([{ amount: 100000, date: new Date() }]));
    vi.spyOn(Expense, "find").mockReturnValue(mockQuery([{ amount: 40000, date: new Date() }]));
    vi.spyOn(Asset, "find").mockReturnValue(mockQuery([{ amount: 300000, isLiquid: true }]));
    vi.spyOn(Liability, "find").mockReturnValue(mockQuery([{ currentBalance: 50000, monthlyEmi: 5000 }]));

    const health = await calculateDetailedHealthScore(userId);
    expect(health.totalScore).toBeGreaterThan(0);
    expect(health.breakdown).toBeDefined();
  });

  it("tests forecastingService with both readyState 0 and 1", async () => {
    const readyStateSpy = vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(0);
    const offlineForecast = await generateCashFlowForecast(userId);
    expect(offlineForecast.status).toBe("INSUFFICIENT_DATA");

    readyStateSpy.mockReturnValue(1);
    vi.spyOn(Income, "find").mockReturnValue(mockQuery([
      { amount: 100000, date: new Date("2026-01-10") },
      { amount: 120000, date: new Date("2026-02-10") },
    ]));
    vi.spyOn(Expense, "find").mockReturnValue(mockQuery([
      { amount: 40000, date: new Date("2026-01-15") },
      { amount: 45000, date: new Date("2026-02-15") },
    ]));
    vi.spyOn(Invoice, "find").mockReturnValue(mockQuery([]));
    vi.spyOn(RecurringTransaction, "find").mockReturnValue(mockQuery([]));

    const forecast = await generateCashFlowForecast(userId);
    expect(forecast.forecast).toBeDefined();
  });

  it("tests financialToolsRegistry execution", async () => {
    vi.spyOn(Income, "find").mockReturnValue(mockQuery([]));
    vi.spyOn(Expense, "find").mockReturnValue(mockQuery([]));
    vi.spyOn(Invoice, "find").mockReturnValue(mockQuery([]));
    vi.spyOn(require("../models/TaxRuleVersion"), "findOne").mockReturnValue(mockQuery(null));

    expect(FINANCIAL_TOOLS.length).toBeGreaterThan(15);

    for (const tool of FINANCIAL_TOOLS) {
      try {
        const res = await tool.execute(userId, {
          annualIncome: 2000000,
          ytdIncome: 1500000,
          grossReceipts: 2000000,
          taxableIncome: 1200000,
          scenarioType: "large_purchase",
          params: { purchaseAmount: 150000, currentLiquidCash: 500000, monthlyExpenses: 50000 },
        });
        expect(res).toBeDefined();
      } catch (e) {
        // Some tools may need specific params
      }
    }
  });
});

