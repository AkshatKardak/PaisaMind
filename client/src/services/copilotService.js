import api from "./api";

export const copilotService = {
  chat: async (message, conversationId) => {
    const res = await api.post("/copilot/chat", { message, conversationId });
    return res.data;
  },

  sendMessage: async ({ message, conversationId }) => {
    const res = await api.post("/copilot/chat", { message, conversationId });
    return res.data;
  },

  listConversations: async () => {
    const res = await api.get("/copilot/conversations");
    return res.data;
  },

  getConversationHistory: async (conversationId) => {
    const res = await api.get(`/copilot/conversations/${conversationId}`);
    return res.data;
  },
};
