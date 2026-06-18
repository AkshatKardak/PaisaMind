import api from "./api";

export const getBudgets   = (params) => api.get("/budgets", { params }).then((r) => r.data);
export const upsertBudget = (data)   => api.post("/budgets", data).then((r) => r.data);
export const deleteBudget = (id)     => api.delete(`/budgets/${id}`).then((r) => r.data);
