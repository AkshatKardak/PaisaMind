import api from "./api";

export const getInvoices = async () => {
  const response = (await api.get("/invoices")).data;
  return { ...response, data: response.data || response.invoices || [] };
};

export const createInvoice = async (payload) => {
  const response = (await api.post("/invoices", payload)).data;
  return { ...response, data: response.data || response.invoice };
};

export const updateInvoice = async ({ id, ...payload }) => {
  const response = (await api.put(`/invoices/${id}`, payload)).data;
  return { ...response, data: response.data || response.invoice };
};

export const deleteInvoice = async (id) => (await api.delete(`/invoices/${id}`)).data;

export const updateStatus = async ({ id, status }) => {
  const response = (await api.patch(`/invoices/${id}/status`, { status })).data;
  return { ...response, data: response.data || response.invoice };
};

export const getSummary = async () => {
  const response = (await api.get("/invoices/summary")).data;
  return { ...response, data: response.data || response.summary || {} };
};

export const createPaymentLink = async (id) => {
  const response = (await api.post(`/invoices/${id}/payment-link`)).data;
  return { ...response, data: response.data || { url: response.url } };
};

export default { getInvoices, createInvoice, updateInvoice, deleteInvoice, updateStatus, getSummary, createPaymentLink };
