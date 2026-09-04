import api from "./api";

export const analyticsService = {
  getFinancialSummary: async (month, year) => {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const res = await api.get("/analytics/financial-summary", { params });
    return res.data;
  },

  getFinancialHealth: async () => {
    const res = await api.get("/analytics/financial-health");
    return res.data;
  },

  getAnomalies: async (months = 6) => {
    const res = await api.get("/analytics/anomalies", { params: { months } });
    return res.data;
  },

  getDuplicates: async (daysWindow = 3) => {
    const res = await api.get("/analytics/duplicates", { params: { daysWindow } });
    return res.data;
  },

  resolveDuplicate: async (action, transactionIdToKeep, transactionIdToDelete) => {
    const res = await api.post("/analytics/duplicates/resolve", {
      action,
      transactionIdToKeep,
      transactionIdToDelete,
    });
    return res.data;
  },

  getRecurring: async () => {
    const res = await api.get("/analytics/recurring");
    return res.data;
  },

  getVolatility: async (months = 6) => {
    const res = await api.get("/analytics/volatility", { params: { months } });
    return res.data;
  },

  getInvoiceRisk: async () => {
    const res = await api.get("/analytics/invoice-risk");
    return res.data;
  },

  getRunway: async () => {
    const res = await api.get("/analytics/runway");
    return res.data;
  },

  getCashflowForecast: async () => {
    const res = await api.get("/analytics/cashflow-forecast");
    return res.data;
  },
};
