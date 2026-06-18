import api from "./api";

export const getRecurring    = ()             => api.get("/recurring").then((r) => r.data);
export const createRecurring = (data)         => api.post("/recurring", data).then((r) => r.data);
export const updateRecurring = ({ id, ...data }) => api.put(`/recurring/${id}`, data).then((r) => r.data);
export const deleteRecurring = (id)           => api.delete(`/recurring/${id}`).then((r) => r.data);
