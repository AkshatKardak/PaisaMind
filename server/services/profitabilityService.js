const Project = require("../models/Project");
const Invoice = require("../models/Invoice");
const User = require("../models/User");

/**
 * Calculates Project and Client Unit Economics, Real Effective Hourly Rates, and Scope Creep
 */
const calculateProfitabilityOverview = async (userId) => {
  const [projects, invoices, user] = await Promise.all([
    Project.find({ userId }).sort({ createdAt: -1 }),
    Invoice.find({ userId }),
    User.findById(userId),
  ]);

  const defaultTargetHourlyRate = user?.targetHourlyRate || 2500;

  // Aggregate stats per client
  const clientMap = {};

  // Initialize client stats from invoices
  invoices.forEach((inv) => {
    const client = inv.clientName || "Direct Client";
    if (!clientMap[client]) {
      clientMap[client] = {
        clientName: client,
        clientEmail: inv.clientEmail || "",
        totalBilled: 0,
        totalCollected: 0,
        totalTdsWithheld: 0,
        directExpenses: 0,
        totalHoursLogged: 0,
        projectsCount: 0,
        projectNames: [],
        delays: [],
      };
    }
    const stat = clientMap[client];
    const amt = Number(inv.totalAmount || inv.amount || 0);
    stat.totalBilled += amt;
    stat.totalTdsWithheld += Number(inv.tdsDeductedAmount || 0);

    if (["Paid", "Partially Paid"].includes(inv.status)) {
      stat.totalCollected += amt;
      if (inv.paidAt && inv.dueDate) {
        const delay = Math.round((new Date(inv.paidAt) - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24));
        stat.delays.push(delay);
      }
    }
  });

  // Calculate project metrics and fold into client map
  const projectSummaries = projects.map((p) => {
    const hours = Number(p.loggedHours || 0);
    const expenses = Number(p.directExpenses || 0);
    const billed = Number(p.totalBilled || 0);
    const targetRate = Number(p.targetHourlyRate || defaultTargetHourlyRate);

    const netProfit = Math.max(0, billed - expenses);
    const profitMargin = billed > 0 ? Number(((netProfit / billed) * 100).toFixed(1)) : 0;
    const realHourlyRate = hours > 0 ? Math.round(netProfit / hours) : (p.feeType === "hourly" ? targetRate : billed);
    const rateRealization = targetRate > 0 ? Number(((realHourlyRate / targetRate) * 100).toFixed(1)) : 100;

    // Scope creep detection
    const isScopeCreep = (hours >= 10 && realHourlyRate < targetRate * 0.70) || (billed > 0 && expenses > billed * 0.30);
    let scopeCreepReason = "";
    if (isScopeCreep) {
      if (realHourlyRate < targetRate * 0.70) {
        scopeCreepReason = `Effective rate ₹${realHourlyRate.toLocaleString("en-IN")}/hr is ${Math.round(100 - rateRealization)}% below target (₹${targetRate}/hr) due to ${hours} hours spent.`;
      } else {
        scopeCreepReason = `High direct costs: ₹${expenses.toLocaleString("en-IN")} spent (${Math.round((expenses / billed) * 100)}% of billed revenue).`;
      }
    }

    // Fold into client stats
    if (!clientMap[p.clientName]) {
      clientMap[p.clientName] = {
        clientName: p.clientName,
        totalBilled: billed,
        totalCollected: 0,
        totalTdsWithheld: 0,
        directExpenses: expenses,
        totalHoursLogged: hours,
        projectsCount: 1,
        projectNames: [p.name],
        delays: [],
      };
    } else {
      const stat = clientMap[p.clientName];
      stat.directExpenses += expenses;
      stat.totalHoursLogged += hours;
      stat.projectsCount += 1;
      if (!stat.projectNames.includes(p.name)) stat.projectNames.push(p.name);
      if (stat.totalBilled === 0 && billed > 0) stat.totalBilled = billed;
    }

    return {
      _id: p._id,
      name: p.name,
      clientName: p.clientName,
      feeType: p.feeType,
      totalBilled: Math.round(billed),
      directExpenses: Math.round(expenses),
      netProfit: Math.round(netProfit),
      profitMargin,
      loggedHours: hours,
      targetHourlyRate: targetRate,
      realHourlyRate,
      rateRealization,
      isScopeCreep,
      scopeCreepReason,
      status: p.status,
    };
  });

  // Calculate Client ROI Tiers
  const clientRoiProfiles = Object.values(clientMap).map((stat) => {
    const netProfit = Math.max(0, stat.totalBilled - stat.directExpenses);
    const profitMargin = stat.totalBilled > 0 ? Number(((netProfit / stat.totalBilled) * 100).toFixed(1)) : 80;
    const avgDelay = stat.delays.length > 0 ? Math.round(stat.delays.reduce((a, b) => a + b, 0) / stat.delays.length) : 0;
    const effectiveRate = stat.totalHoursLogged > 0 ? Math.round(netProfit / stat.totalHoursLogged) : defaultTargetHourlyRate;

    // Determine Tier (A/B/C/D)
    let tier = "Tier B";
    let tierLabel = "Steady Workhorse";
    let tierBadge = "STEADY";

    if (profitMargin >= 70 && avgDelay <= 10 && effectiveRate >= defaultTargetHourlyRate * 0.9) {
      tier = "Tier A";
      tierLabel = "Star Client (High Margin & Fast Pay)";
      tierBadge = "STAR";
    } else if (profitMargin < 40 || effectiveRate < defaultTargetHourlyRate * 0.5 || avgDelay > 30) {
      tier = "Tier D";
      tierLabel = "Loss-Making / Scope-Creep Risk";
      tierBadge = "TOXIC";
    } else if (profitMargin < 55 || avgDelay > 15) {
      tier = "Tier C";
      tierLabel = "High Maintenance";
      tierBadge = "MAINTENANCE";
    }

    return {
      clientName: stat.clientName,
      clientEmail: stat.clientEmail,
      totalBilled: Math.round(stat.totalBilled),
      totalCollected: Math.round(stat.totalCollected),
      totalTdsWithheld: Math.round(stat.totalTdsWithheld),
      directExpenses: Math.round(stat.directExpenses),
      netProfit: Math.round(netProfit),
      profitMargin,
      totalHoursLogged: stat.totalHoursLogged,
      effectiveHourlyRate: effectiveRate,
      avgPaymentDelayDays: avgDelay,
      projectsCount: stat.projectsCount,
      projectNames: stat.projectNames,
      tier,
      tierLabel,
      tierBadge,
    };
  });

  clientRoiProfiles.sort((a, b) => b.netProfit - a.netProfit);

  const totalBilledAll = clientRoiProfiles.reduce((s, c) => s + c.totalBilled, 0);
  const totalDirectExpensesAll = clientRoiProfiles.reduce((s, c) => s + c.directExpenses, 0);
  const totalHoursAll = clientRoiProfiles.reduce((s, c) => s + c.totalHoursLogged, 0);
  const overallNetProfit = Math.max(0, totalBilledAll - totalDirectExpensesAll);
  const overallHourlyRate = totalHoursAll > 0 ? Math.round(overallNetProfit / totalHoursAll) : defaultTargetHourlyRate;
  const overallMargin = totalBilledAll > 0 ? Number(((overallNetProfit / totalBilledAll) * 100).toFixed(1)) : 85;

  const scopeCreepProjects = projectSummaries.filter((p) => p.isScopeCreep);

  return {
    summary: {
      totalBilled: Math.round(totalBilledAll),
      totalDirectExpenses: Math.round(totalDirectExpensesAll),
      overallNetProfit: Math.round(overallNetProfit),
      overallMargin,
      totalHoursLogged: totalHoursAll,
      overallEffectiveHourlyRate: overallHourlyRate,
      targetHourlyRate: defaultTargetHourlyRate,
      scopeCreepProjectsCount: scopeCreepProjects.length,
    },
    clients: clientRoiProfiles,
    projects: projectSummaries,
    scopeCreepAlerts: scopeCreepProjects,
  };
};

module.exports = {
  calculateProfitabilityOverview,
};
