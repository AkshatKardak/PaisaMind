const Invoice = require("../models/Invoice");

/**
 * Calculates client payment reliability scores (0-100) and risk classification
 */
const analyzeInvoiceRisk = async (userId) => {
  const invoices = await Invoice.find({ userId }).sort({ createdAt: -1 });

  if (!invoices || invoices.length === 0) {
    return {
      clients: [],
      overallRisk: "LOW",
      totalOverdueAmount: 0,
      totalPendingAmount: 0,
      atRiskInvoices: [],
      hasSufficientData: false,
      message: "No invoices found. Create invoices to track client payment reliability.",
    };
  }

  const clientStats = {};
  const atRiskInvoices = [];
  let totalOverdueAmount = 0;
  let totalPendingAmount = 0;
  const now = new Date();

  invoices.forEach((inv) => {
    const client = inv.clientName || "Unknown Client";
    if (!clientStats[client]) {
      clientStats[client] = {
        clientName: client,
        clientEmail: inv.clientEmail || "",
        totalInvoices: 0,
        paidInvoices: 0,
        overdueInvoices: 0,
        unpaidInvoices: 0,
        totalBilled: 0,
        totalCollected: 0,
        outstandingAmount: 0,
        overdueAmount: 0,
        delays: [],
      };
    }

    const stat = clientStats[client];
    stat.totalInvoices += 1;
    const amt = Number(inv.amount || inv.totalAmount || 0);
    stat.totalBilled += amt;

    const dueDate = new Date(inv.dueDate);

    if (["Paid", "Partially Paid"].includes(inv.status)) {
      stat.paidInvoices += 1;
      stat.totalCollected += amt;
      const paidDate = inv.paidAt ? new Date(inv.paidAt) : new Date(inv.updatedAt);
      const delayDays = Math.round((paidDate - dueDate) / (1000 * 60 * 60 * 24));
      stat.delays.push(delayDays);
    } else if (inv.status === "Overdue" || (inv.status === "Unpaid" && dueDate < now)) {
      stat.overdueInvoices += 1;
      stat.overdueAmount += amt;
      stat.outstandingAmount += amt;
      totalOverdueAmount += amt;
      totalPendingAmount += amt;

      const daysOverdue = Math.max(1, Math.round((now - dueDate) / (1000 * 60 * 60 * 24)));
      atRiskInvoices.push({
        _id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        clientName: client,
        amount: amt,
        dueDate: inv.dueDate,
        daysOverdue,
        riskLevel: daysOverdue > 30 ? "HIGH" : daysOverdue > 14 ? "MEDIUM" : "LOW",
      });
    } else {
      stat.unpaidInvoices += 1;
      stat.outstandingAmount += amt;
      totalPendingAmount += amt;
    }
  });

  // Calculate scores per client
  const clientRiskProfiles = Object.values(clientStats).map((stat) => {
    let avgPaymentDelay = 0;
    let medianPaymentDelay = 0;
    let maxPaymentDelay = 0;

    if (stat.delays.length > 0) {
      avgPaymentDelay = Math.round(stat.delays.reduce((a, b) => a + b, 0) / stat.delays.length);
      const sorted = [...stat.delays].sort((a, b) => a - b);
      medianPaymentDelay = sorted[Math.floor(sorted.length / 2)];
      maxPaymentDelay = Math.max(...stat.delays);
    }

    let reliabilityScore = 85; // baseline

    if (stat.totalInvoices < 2) {
      return {
        ...stat,
        avgPaymentDelay,
        medianPaymentDelay,
        maxPaymentDelay,
        reliabilityScore: 70,
        riskClassification: "INSUFFICIENT_DATA",
        riskLabel: "Insufficient History",
      };
    }

    // Penalties based on payment delay and overdue history
    if (avgPaymentDelay > 0) {
      reliabilityScore -= Math.min(35, avgPaymentDelay * 1.2);
    } else if (avgPaymentDelay < 0) {
      reliabilityScore += 5; // early payers
    }

    const overdueRate = stat.overdueInvoices / stat.totalInvoices;
    reliabilityScore -= overdueRate * 40;

    if (stat.outstandingAmount > 0 && stat.totalCollected === 0) {
      reliabilityScore -= 15;
    }

    reliabilityScore = Math.max(10, Math.min(100, Math.round(reliabilityScore)));

    let riskClassification = "LOW";
    if (reliabilityScore < 50 || stat.overdueInvoices >= 2) {
      riskClassification = "HIGH";
    } else if (reliabilityScore < 75 || stat.overdueInvoices === 1) {
      riskClassification = "MEDIUM";
    }

    return {
      clientName: stat.clientName,
      clientEmail: stat.clientEmail,
      totalInvoices: stat.totalInvoices,
      paidInvoices: stat.paidInvoices,
      overdueInvoices: stat.overdueInvoices,
      unpaidInvoices: stat.unpaidInvoices,
      totalBilled: stat.totalBilled,
      totalCollected: stat.totalCollected,
      outstandingAmount: stat.outstandingAmount,
      overdueAmount: stat.overdueAmount,
      avgPaymentDelayDays: avgPaymentDelay,
      medianPaymentDelayDays: medianPaymentDelay,
      maxPaymentDelayDays: maxPaymentDelay,
      reliabilityScore,
      riskClassification,
      riskLabel: riskClassification === "HIGH" ? "High Risk" : riskClassification === "MEDIUM" ? "Moderate Risk" : "Low Risk",
      expectedPaymentDelayDays: Math.max(0, avgPaymentDelay),
    };
  });

  clientRiskProfiles.sort((a, b) => a.reliabilityScore - b.reliabilityScore);

  const highRiskClientsCount = clientRiskProfiles.filter((c) => c.riskClassification === "HIGH").length;
  const overallRisk = highRiskClientsCount > 0 || totalOverdueAmount > 50000 ? "HIGH" : totalOverdueAmount > 0 ? "MEDIUM" : "LOW";

  return {
    clients: clientRiskProfiles,
    overallRisk,
    totalOverdueAmount: Math.round(totalOverdueAmount),
    totalPendingAmount: Math.round(totalPendingAmount),
    atRiskInvoices: atRiskInvoices.sort((a, b) => b.daysOverdue - a.daysOverdue),
    hasSufficientData: true,
  };
};

module.exports = {
  analyzeInvoiceRisk,
};
