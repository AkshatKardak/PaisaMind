const Expense = require("../models/Expense");
const { stringSimilarity } = require("./anomalyService");

// Standard known recurring merchants & tools
const KNOWN_SUBSCRIPTION_KEYWORDS = [
  "netflix", "adobe", "aws", "amazon web", "spotify", "google", "workspace", "github",
  "figma", "canva", "chatgpt", "openai", "claude", "notion", "airtel", "jio", "act fibernet",
  "digitalocean", "vercel", "cursor", "midjourney", "zoom", "slack", "wework", "rent", "emi", "insurance",
  "lic", "hdfc", "icici", "sbi", "swiggy", "zomato", "prime"
];

/**
 * Normalizes title / merchant string for grouping
 */
const normalizeMerchant = (rawTitle = "") => {
  const cleaned = rawTitle
    .toLowerCase()
    .replace(/[0-9]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const keyword of KNOWN_SUBSCRIPTION_KEYWORDS) {
    if (cleaned.includes(keyword)) {
      return keyword.toUpperCase();
    }
  }

  // Fallback to first 2 words
  const words = cleaned.split(" ").filter(w => w.length > 2);
  return (words.slice(0, 2).join(" ") || cleaned).toUpperCase();
};

/**
 * Detects recurring expenses, subscriptions, and price increases automatically
 */
const detectRecurringSubscriptions = async (userId) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const expenses = await Expense.find({
    userId,
    date: { $gte: sixMonthsAgo },
  }).sort({ date: 1 });

  if (expenses.length < 2) {
    return {
      subscriptions: [],
      monthlyTotal: 0,
      annualTotal: 0,
      priceIncreases: [],
      hasSufficientData: false,
    };
  }

  // 1. Group expenses by normalized merchant
  const groups = {};
  expenses.forEach((e) => {
    const merchant = normalizeMerchant(e.title);
    if (!groups[merchant]) groups[merchant] = [];
    groups[merchant].push(e);
  });

  const subscriptions = [];
  const priceIncreases = [];

  for (const [merchant, txs] of Object.entries(groups)) {
    if (txs.length < 2) continue;

    // Calculate intervals between consecutive transactions (in days)
    const intervals = [];
    for (let i = 1; i < txs.length; i++) {
      const diffDays = (new Date(txs[i].date) - new Date(txs[i - 1].date)) / (1000 * 60 * 60 * 24);
      intervals.push(diffDays);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const amounts = txs.map((t) => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const latestTx = txs[txs.length - 1];
    const previousTx = txs[txs.length - 2];

    let frequency = "monthly";
    let isIntervalValid = false;
    let expectedNextIntervalDays = 30;

    if (avgInterval >= 25 && avgInterval <= 35) {
      frequency = "monthly";
      isIntervalValid = true;
      expectedNextIntervalDays = 30;
    } else if (avgInterval >= 6 && avgInterval <= 9) {
      frequency = "weekly";
      isIntervalValid = true;
      expectedNextIntervalDays = 7;
    } else if (avgInterval >= 340 && avgInterval <= 390) {
      frequency = "yearly";
      isIntervalValid = true;
      expectedNextIntervalDays = 365;
    } else if (txs.length >= 3 && avgInterval >= 20 && avgInterval <= 45) {
      frequency = "monthly";
      isIntervalValid = true;
      expectedNextIntervalDays = Math.round(avgInterval);
    }

    // Amount variance
    const amountDeviations = amounts.map((a) => Math.abs(a - avgAmount));
    const maxAmountDev = Math.max(...amountDeviations);
    const isAmountConsistent = avgAmount > 0 ? (maxAmountDev / avgAmount) <= 0.25 : false;

    // Confidence Score Calculation (0-100)
    let confidenceScore = 50;
    if (isIntervalValid) confidenceScore += 25;
    if (isAmountConsistent) confidenceScore += 15;
    if (KNOWN_SUBSCRIPTION_KEYWORDS.some((kw) => merchant.toLowerCase().includes(kw))) {
      confidenceScore += 10;
    }
    confidenceScore = Math.min(100, confidenceScore);

    if (confidenceScore >= 60) {
      const nextDate = new Date(latestTx.date);
      nextDate.setDate(nextDate.getDate() + expectedNextIntervalDays);

      const annualized = frequency === "monthly"
        ? Math.round(avgAmount * 12)
        : frequency === "weekly"
        ? Math.round(avgAmount * 52)
        : Math.round(avgAmount);

      const monthlyCost = frequency === "monthly"
        ? Math.round(avgAmount)
        : frequency === "weekly"
        ? Math.round(avgAmount * 4.33)
        : Math.round(avgAmount / 12);

      subscriptions.push({
        merchant,
        sampleTitle: latestTx.title,
        category: latestTx.category,
        frequency,
        averageAmount: Math.round(avgAmount),
        latestAmount: latestTx.amount,
        monthlyCost,
        annualizedCost: annualized,
        lastTransactionDate: latestTx.date,
        nextExpectedDate: nextDate,
        occurrences: txs.length,
        confidenceScore,
        isKnownSaaS: KNOWN_SUBSCRIPTION_KEYWORDS.some((kw) => merchant.toLowerCase().includes(kw)),
      });

      // Price Increase Check (comparing latest charge to previous)
      if (previousTx && latestTx.amount > previousTx.amount) {
        const increaseAmt = latestTx.amount - previousTx.amount;
        const increasePct = Math.round((increaseAmt / previousTx.amount) * 100);
        if (increasePct >= 5 && increaseAmt >= 50) {
          priceIncreases.push({
            merchant,
            previousAmount: previousTx.amount,
            currentAmount: latestTx.amount,
            increaseAmount: increaseAmt,
            percentageIncrease: increasePct,
            date: latestTx.date,
            description: `${merchant} subscription price increased from ₹${previousTx.amount.toLocaleString("en-IN")} to ₹${latestTx.amount.toLocaleString("en-IN")} (+${increasePct}%).`,
          });
        }
      }
    }
  }

  const monthlyTotal = subscriptions.reduce((sum, s) => sum + s.monthlyCost, 0);
  const annualTotal = subscriptions.reduce((sum, s) => sum + s.annualizedCost, 0);

  return {
    subscriptions: subscriptions.sort((a, b) => b.monthlyCost - a.monthlyCost),
    monthlyTotal,
    annualTotal,
    count: subscriptions.length,
    priceIncreases,
    hasSufficientData: true,
  };
};

module.exports = {
  detectRecurringSubscriptions,
  normalizeMerchant,
};
