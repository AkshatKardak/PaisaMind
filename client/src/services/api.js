import axios from "axios";
import { auth } from "../config/firebase";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  timeout: 30000, // 30s — covers Render/Railway free-tier cold-start (~10s)
});

/* Auto-attach fresh Firebase ID token to every request */
api.interceptors.request.use(async (config) => {
  // Wait for Firebase auth to be ready before attaching token
  const user = await new Promise((resolve) => {
    if (auth.currentUser) return resolve(auth.currentUser);
    const unsub = auth.onAuthStateChanged((u) => {
      unsub();
      resolve(u);
    });
  });

  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/*
  Response interceptor — surface server errors so every mutation's onError
  handler receives a proper Error object with a readable .message.
*/
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const serverMessage =
      error.code === "ECONNABORTED"
        ? "Server is waking up — please wait a moment and try again."
        : error.response?.data?.message ||
          error.response?.statusText ||
          error.message ||
          "Something went wrong. Please try again.";

    error.message = serverMessage;

    if (import.meta.env.DEV) {
      console.error(
        `[API ${error.response?.status ?? error.code ?? "ERR"}]`,
        error.config?.method?.toUpperCase(),
        error.config?.url,
        "\u2192",
        serverMessage
      );
    }

    return Promise.reject(error);
  }
);

export default api;
