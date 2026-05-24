import api from "./api";

export const getExpenses = async (params) => {
  const response = (await api.get("/expenses", { params })).data;
  return { ...response, data: response.data || response.expenses || [] };
};

export const addExpense = async (payload) => {
  const response = (await api.post("/expenses", payload)).data;
  return { ...response, data: response.data || response.expense };
};

export const updateExpense = async ({ id, ...payload }) => {
  const response = (await api.put(`/expenses/${id}`, payload)).data;
  return { ...response, data: response.data || response.expense };
};

export const deleteExpense = async (id) => (await api.delete(`/expenses/${id}`)).data;

export const getSummary = async (params = {}) => {
  const response = (await api.get("/expenses/summary", { params })).data;
  return {
    ...response,
    data: (response.data || response.summary || []).map((item) => ({
      category: item.category || item._id,
      total: item.total,
    })),
  };
};

export const getSubscriptions = async () => {
  const response = (await api.get("/expenses/subscriptions")).data;
  const subscriptions = response.data?.subscriptions || response.subscriptions || [];
  const flaggedItems = response.data?.flaggedItems || subscriptions.filter((item) => item.flagged);

  return {
    ...response,
    data: {
      subscriptions,
      flaggedItems,
      monthlyBleed: response.data?.monthlyBleed ?? response.monthlyBleed ?? 0,
      annualBleed: response.data?.annualBleed ?? response.annualBleed ?? 0,
    },
  };
};

export default { getExpenses, addExpense, updateExpense, deleteExpense, getSummary, getSubscriptions };
