import api from "./api";

export const profitabilityService = {
  getOverview: async () => {
    const res = await api.get("/profitability/overview");
    return res.data;
  },

  createProject: async (payload) => {
    const res = await api.post("/profitability/projects", payload);
    return res.data;
  },

  logHours: async (projectId, payload) => {
    const res = await api.post(`/profitability/projects/${projectId}/log-hours`, payload);
    return res.data;
  },

  logExpense: async (projectId, payload) => {
    const res = await api.post(`/profitability/projects/${projectId}/log-expense`, payload);
    return res.data;
  },

  deleteProject: async (projectId) => {
    const res = await api.delete(`/profitability/projects/${projectId}`);
    return res.data;
  },
};

export default profitabilityService;
