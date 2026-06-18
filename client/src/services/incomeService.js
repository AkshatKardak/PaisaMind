import api from "./api";

export const getIncome        = (params) => api.get("/income", { params }).then((r) => r.data);
export const addIncome        = (data)   => api.post("/income", data).then((r) => r.data);
export const updateIncome     = ({ id, ...data }) => api.put(`/income/${id}`, data).then((r) => r.data);
export const deleteIncome     = (id)     => api.delete(`/income/${id}`).then((r) => r.data);
export const getIncomeSummary = ()       => api.get("/income/summary").then((r) => r.data);
export const getGSTStatus     = ()       => api.get("/income/gst-status").then((r) => r.data);
