import api from "./api";

export const getGoals = async () => {
  const response = (await api.get("/goals")).data;
  return { ...response, data: response.data || response.goals || [] };
};

export const createGoal = async (payload) => {
  const response = (await api.post("/goals", payload)).data;
  return { ...response, data: response.data || response.goal };
};

export const updateGoal = async ({ id, ...payload }) => {
  const response = (await api.put(`/goals/${id}`, payload)).data;
  return { ...response, data: response.data || response.goal };
};

export const deleteGoal = async (id) => (await api.delete(`/goals/${id}`)).data;

export const updateProgress = async ({ id, savedAmount }) => {
  const response = (await api.patch(`/goals/${id}/progress`, { savedAmount })).data;
  return { ...response, data: response.data || response.goal };
};

export default { getGoals, createGoal, updateGoal, deleteGoal, updateProgress };
