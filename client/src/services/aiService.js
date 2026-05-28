import api from "./api";

export const getInsights = async (payload = {}) => {
  const response = (await api.post("/ai/insights", payload)).data;
  return {
    ...response,
    data: response.data || {
      insights: response.insights || [],
      health_explanation: response.health_explanation,
      top_action: response.top_action,
    },
  };
};

export const getMonthlyReport = async (payload = {}) => {
  const response = (await api.post("/ai/monthly-report", payload)).data;
  return { ...response, data: response.data || response.report || {} };
};

export const getInvoiceReminder = async (payload) => {
  const response = (await api.post("/ai/invoice-reminder", payload)).data;
  return {
    ...response,
    data: response.data || {
      message:
        typeof response.message === "string"
          ? response.message
          : response.message?.message,
    },
  };
};

// NEW
export const getTaxSavingSuggestions = async () => {
  const response = (await api.get("/ai/tax-saving")).data;
  return response;
};

// NEW
export const getCashFlowForecast = async () => {
  const response = (await api.get("/ai/cash-flow-forecast")).data;
  return response;
};

export default {
  getInsights,
  getMonthlyReport,
  getInvoiceReminder,
  getTaxSavingSuggestions,
  getCashFlowForecast,
};