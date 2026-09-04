import api from "./api";

export const statementService = {
  uploadStatement: async (file) => {
    const formData = new FormData();
    formData.append("statement", file);
    const res = await api.post("/statements/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  remapColumns: async (importId, columnMapping) => {
    const res = await api.post("/statements/remap", { importId, columnMapping });
    return res.data;
  },

  commitTransactions: async (importId, selectedIndices) => {
    const res = await api.post("/statements/commit", { importId, selectedIndices });
    return res.data;
  },

  getImport: async (id) => {
    const res = await api.get(`/statements/${id}`);
    return res.data;
  },
};
