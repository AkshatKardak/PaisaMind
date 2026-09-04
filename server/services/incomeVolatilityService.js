const Income = require("../models/Income");
const Invoice = require("../models/Invoice");
const { calculateStats } = require("./anomalyService");

/**
 * Calculates freelance income volatility, client concentration, and stability score
 */
const analyzeIncomeVolatility = async (userId, months = 6) => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const [incomes, invoices] = await Promise.all([
    Income.find({ userId, date: { $gte: startDate } }),
    Invoice.find({ userId, createdAt: { $gte: startDate } }),
  ]);

  // Aggregate income by month
  const monthlyTotals = {};
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyTotals[key] = 0;
  }

  // Combine direct income entries
  incomes.forEach((inc) => {
    const d = new Date(inc.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyTotals[key] !== undefined) {
      monthlyTotals[key] += Number(inc.amount || 0);
    }
  });

  // Client concentration mapping
  const clientRevenueMap = {};
  let totalRevenue = 0;

  // From invoices
  invoices.forEach((inv) => {
    if (["Paid", "Partially Paid"].includes(inv.status)) {
      const client = inv.clientName || "Direct / Unknown";
      const amt = Number(inv.amount || inv.totalAmount || 0);
      clientRevenueMap[client] = (clientRevenueMap[client] || 0) + amt;
      totalRevenue += amt;
    }
  });

  // From direct incomes
  incomes.forEach((inc) => {
    const source = inc.source || "Direct Client";
    const amt = Number(inc.amount || 0);
    clientRevenueMap[source] = (clientRevenueMap[source] || 0) + amt;
    totalRevenue += amt;
  });

  const monthValues = Object.values(monthlyTotals);
  const { mean: avgMonthlyIncome, stdDev } = calculateStats(monthValues);

  // Median calculation
  const sortedValues = [...monthValues].sort((a, b) => a - b);
  const mid = Math.floor(sortedValues.length / 2);
  const medianMonthlyIncome = sortedValues.length % 2 !== 0
    ? sortedValues[mid]
    : (sortedValues[mid - 1] + sortedValues[mid]) / 2;

  // Coefficient of Variation (CV = stdDev / mean)
  const coefficientOfVariation = avgMonthlyIncome > 0
    ? Number((stdDev / avgMonthlyIncome).toFixed(2))
    : 0;

  const minMonthlyIncome = Math.min(...monthValues);
  const maxMonthlyIncome = Math.max(...monthValues);

  // Linear Regression Trend Slope
  let trendSlope = 0;
  const n = monthValues.length;
  if (n >= 2) {
    const xMean = (n - 1) / 2;
    const yMean = avgMonthlyIncome;
    let numerator = 0;
    let denominator = 0;
    monthValues.forEach((y, x) => {
      numerator += (x - xMean) * (y - yMean);
      denominator += Math.pow(x - xMean, 2);
    });
    trendSlope = denominator !== 0 ? numerator / denominator : 0;
  }

  const trendDirection = trendSlope > 500 ? "GROWING" : trendSlope < -500 ? "DECLINING" : "STABLE";

  // Client Concentration Analysis (Herfindahl-Hirschman Index and Top Client Dependency)
  const clientBreakdown = Object.entries(clientRevenueMap)
    .map(([client, revenue]) => {
      const percentage = totalRevenue > 0 ? Number(((revenue / totalRevenue) * 100).toFixed(1)) : 0;
      return { client, revenue, percentage };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const topClient = clientBreakdown[0] || { client: "None", revenue: 0, percentage: 0 };
  const topClientDependency = topClient.percentage;

  // HHI Index (sum of squared percentages): 0 to 10,000
  const hhi = clientBreakdown.reduce((sum, c) => sum + Math.pow(c.percentage, 2), 0);
  const concentrationRisk = topClientDependency >= 50 ? "HIGH" : topClientDependency >= 30 ? "MEDIUM" : "LOW";

  // Stability Score (0 to 100)
  // Penalize high CV (up to 40 pts) and high top client dependency (up to 30 pts)
  let stabilityScore = 100;
  stabilityScore -= Math.min(50, coefficientOfVariation * 40);
  stabilityScore -= Math.min(30, (topClientDependency / 100) * 35);
  if (trendDirection === "GROWING") stabilityScore += 5;
  if (trendDirection === "DECLINING") stabilityScore -= 10;
  if (monthValues.filter((v) => v > 0).length < 3) stabilityScore = Math.min(stabilityScore, 50);

  stabilityScore = Math.max(10, Math.min(100, Math.round(stabilityScore)));

  const stabilityLabel = stabilityScore >= 75 ? "High Stability" : stabilityScore >= 50 ? "Moderate Volatility" : "High Volatility";

  return {
    periodMonths: months,
    avgMonthlyIncome: Math.round(avgMonthlyIncome),
    medianMonthlyIncome: Math.round(medianMonthlyIncome),
    stdDev: Math.round(stdDev),
    coefficientOfVariation,
    minMonthlyIncome: Math.round(minMonthlyIncome),
    maxMonthlyIncome: Math.round(maxMonthlyIncome),
    trendSlope: Math.round(trendSlope),
    trendDirection,
    stabilityScore,
    stabilityLabel,
    totalIncomeSources: clientBreakdown.length,
    topClientDependency,
    topClientName: topClient.client,
    concentrationRisk,
    clientBreakdown: clientBreakdown.slice(0, 5),
    monthlyHistory: Object.entries(monthlyTotals).map(([month, income]) => ({ month, income })),
    summaryNarrative: `Income Stability: ${stabilityScore}/100 (${stabilityLabel}). ${topClientDependency > 35 ? `Top client risk: ${topClientDependency}% of revenue relies on "${topClient.client}". Diversifying client base reduces risk.` : "Healthy client distribution detected."}`,
  };
};

module.exports = {
  analyzeIncomeVolatility,
};
