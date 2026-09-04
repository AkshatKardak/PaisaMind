const Expense = require("../models/Expense");
const Income = require("../models/Income");
const Anomaly = require("../models/Anomaly");
const logger = require("./logger");

/**
 * Standard deviation helper
 */
const calculateStats = (numbers) => {
  if (!numbers || numbers.length === 0) return { mean: 0, stdDev: 0, count: 0 };
  const count = numbers.length;
  const mean = numbers.reduce((a, b) => a + b, 0) / count;
  if (count === 1) return { mean, stdDev: 0, count };
  const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / (count - 1);
  const stdDev = Math.sqrt(variance);
  return { mean, stdDev, count };
};

/**
 * String similarity ratio (Levenshtein distance based)
 */
const stringSimilarity = (str1, str2) => {
  const s1 = (str1 || "").toLowerCase().trim();
  const s2 = (str2 || "").toLowerCase().trim();
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const track = Array(s2.length + 1).fill(null).map(() =>
    Array(s1.length + 1).fill(null));
  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;

  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator, // substitution
      );
    }
  }
  const distance = track[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return (maxLen - distance) / maxLen;
};

/**
 * Detect spending anomalies for a given user
 */
const detectSpendingAnomalies = async (userId, monthsBack = 6) => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const expenses = await Expense.find({
    userId,
    date: { $gte: startDate },
  }).sort({ date: 1 });

  if (expenses.length < 3) {
    return {
      anomalies: [],
      hasSufficientData: false,
      message: "Insufficient transaction history (< 3 records). Log at least 1 month of expenses to detect patterns.",
    };
  }

  // 1. Group expenses by category
  const categoryHistory = {};
  const currentMonthCategoryTotals = {};
  const recentTransactions = [];

  expenses.forEach((e) => {
    const cat = e.category || "Other";
    const amt = Number(e.amount || 0);
    const date = new Date(e.date);

    if (!categoryHistory[cat]) categoryHistory[cat] = [];

    if (date < currentMonthStart) {
      categoryHistory[cat].push(amt);
    } else {
      currentMonthCategoryTotals[cat] = (currentMonthCategoryTotals[cat] || 0) + amt;
      recentTransactions.push(e);
    }
  });

  const detectedAnomalies = [];

  // A. Category Monthly Total Spike Detection
  for (const [cat, currentTotal] of Object.entries(currentMonthCategoryTotals)) {
    const pastValues = categoryHistory[cat] || [];
    if (pastValues.length >= 2) {
      const { mean, stdDev, count } = calculateStats(pastValues);
      const diff = currentTotal - mean;
      const pctIncrease = mean > 0 ? (diff / mean) * 100 : 100;
      const zScore = stdDev > 0 ? diff / stdDev : 0;

      // Flag if: Z-Score >= 2.0 OR (pctIncrease >= 50% AND currentTotal >= 2000)
      if ((zScore >= 1.95 || (pctIncrease >= 50 && diff >= 2000)) && currentTotal > mean) {
        detectedAnomalies.push({
          type: "spending_spike",
          category: cat,
          amount: Math.round(currentTotal),
          baselineAmount: Math.round(mean),
          percentageDeviation: Math.round(pctIncrease),
          zScore: Number(zScore.toFixed(2)),
          description: `${cat} expenses (₹${Math.round(currentTotal).toLocaleString("en-IN")}) are ${Math.round(pctIncrease)}% higher than the ${count}-month average baseline (₹${Math.round(mean).toLocaleString("en-IN")}).`,
          severity: pctIncrease > 100 || zScore > 3 ? "HIGH" : "MEDIUM",
        });
      }
    }
  }

  // B. Single Outlier Transaction Detection in recent month
  for (const tx of recentTransactions) {
    const cat = tx.category || "Other";
    const pastValues = categoryHistory[cat] || [];
    if (pastValues.length >= 3) {
      const { mean, stdDev } = calculateStats(pastValues);
      const amt = Number(tx.amount || 0);
      const zScore = stdDev > 0 ? (amt - mean) / stdDev : 0;

      if (amt >= mean * 2.0 && amt >= 5000 && zScore >= 2.2) {
        detectedAnomalies.push({
          type: "spending_spike",
          category: cat,
          amount: amt,
          baselineAmount: Math.round(mean),
          percentageDeviation: Math.round(((amt - mean) / mean) * 100),
          zScore: Number(zScore.toFixed(2)),
          transactionId: tx._id,
          title: tx.title,
          description: `Unusual single purchase: "${tx.title}" of ₹${amt.toLocaleString("en-IN")} is significantly higher than typical ${cat} transactions (baseline: ₹${Math.round(mean).toLocaleString("en-IN")}).`,
          severity: "HIGH",
        });
      }
    }
  }

  return {
    anomalies: detectedAnomalies,
    hasSufficientData: true,
    totalAnomaliesCount: detectedAnomalies.length,
  };
};

/**
 * Detect potential duplicate transactions
 */
const detectDuplicates = async (userId, daysWindow = 3) => {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const expenses = await Expense.find({
    userId,
    date: { $gte: threeMonthsAgo },
  }).sort({ date: 1 });

  const duplicates = [];
  const checkedPairs = new Set();

  for (let i = 0; i < expenses.length; i++) {
    for (let j = i + 1; j < expenses.length; j++) {
      const a = expenses[i];
      const b = expenses[j];

      const pairKey = `${a._id}_${b._id}`;
      if (checkedPairs.has(pairKey)) continue;

      const dateDiffDays = Math.abs((new Date(a.date) - new Date(b.date)) / (1000 * 60 * 60 * 24));
      if (dateDiffDays > daysWindow) continue;

      // Exact or near-exact amount check
      const amtDiff = Math.abs(a.amount - b.amount);
      const isSameAmount = amtDiff === 0 || (amtDiff / Math.max(a.amount, 1)) < 0.005;

      if (isSameAmount) {
        const titleSim = stringSimilarity(a.title, b.title);
        const catMatch = a.category === b.category;

        if (titleSim >= 0.75 || (titleSim >= 0.6 && catMatch)) {
          checkedPairs.add(pairKey);
          duplicates.push({
            id: pairKey,
            transactionA: {
              _id: a._id,
              title: a.title,
              amount: a.amount,
              date: a.date,
              category: a.category,
            },
            transactionB: {
              _id: b._id,
              title: b.title,
              amount: b.amount,
              date: b.date,
              category: b.category,
            },
            amount: a.amount,
            similarityScore: Math.round(titleSim * 100),
            dateDiffDays: Number(dateDiffDays.toFixed(1)),
            reason: `Identical amount ₹${a.amount.toLocaleString("en-IN")} logged ${dateDiffDays === 0 ? "on the same day" : `${Math.round(dateDiffDays)} days apart`} with similar title "${a.title}" vs "${b.title}".`,
          });
        }
      }
    }
  }

  return duplicates;
};

module.exports = {
  detectSpendingAnomalies,
  detectDuplicates,
  stringSimilarity,
  calculateStats,
};
