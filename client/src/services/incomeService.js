import api from "./api";

const normalizeSummary = (summary = []) =>
  summary.map((item) => ({
    month: new Date(item._id.year, item._id.month - 1, 1).toLocaleString("en-IN", { month: "short" }),
    year: item._id.year,
    total: item.total,
  }));

export const getIncome = async (params) => {
  const response = (await api.get("/income", { params })).data;
  return {
    ...response,
    data: response.data || response.income || [],
  };
};

export const addIncome = async (payload) => {
  const response = (await api.post("/income", payload)).data;
  return { ...response, data: response.data || response.income };
};

export const updateIncome = async ({ id, ...payload }) => {
  const response = (await api.put(`/income/${id}`, payload)).data;
  return { ...response, data: response.data || response.income };
};

export const deleteIncome = async (id) => (await api.delete(`/income/${id}`)).data;

export const getSummary = async () => {
  const response = (await api.get("/income/summary")).data;
  return {
    ...response,
    data: normalizeSummary(response.data || response.summary || []),
  };
};

export default { getIncome, addIncome, updateIncome, deleteIncome, getSummary };
