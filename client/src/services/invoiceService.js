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

// Fix: route is /:id/checkout on the server, not /:id/payment-link
export const createPaymentLink = async (id) => {
  const response = (await api.post(`/invoices/${id}/checkout`)).data;
  return { ...response, data: response.data || { url: response.url } };
};

export const downloadPDF = (id) =>
  api.get(`/invoices/${id}/pdf`, { responseType: "blob" }).then((r) => {
    const url  = window.URL.createObjectURL(new Blob([r.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href  = url;
    link.setAttribute("download", `invoice-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  });

export default { getInvoices, createInvoice, updateInvoice, deleteInvoice, updateStatus, getSummary, createPaymentLink, downloadPDF };
