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
      message: typeof response.message === "string" ? response.message : response.message?.message,
    },
  };
};

export default { getInsights, getMonthlyReport, getInvoiceReminder };
