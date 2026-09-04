import api from "./api";

export const netWorthService = {
  getOverview: async () => {
    const res = await api.get("/net-worth");
    return res.data;
  },

  createAsset: async (assetData) => {
    const res = await api.post("/net-worth/assets", assetData);
    return res.data;
  },

  deleteAsset: async (id) => {
    const res = await api.delete(`/net-worth/assets/${id}`);
    return res.data;
  },

  createLiability: async (liabilityData) => {
    const res = await api.post("/net-worth/liabilities", liabilityData);
    return res.data;
  },

  deleteLiability: async (id) => {
    const res = await api.delete(`/net-worth/liabilities/${id}`);
    return res.data;
  },
};
