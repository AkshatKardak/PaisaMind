import axios from "axios";
import { auth } from "../config/firebase";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

/* Auto-attach fresh Firebase ID token to every request */
api.interceptors.request.use(async (config) => {
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/*
  Response interceptor — surface server errors so every mutation's onError
  handler receives a proper Error object with a readable .message.

  Without this, a 401 "User not found in database" or 500 from the server
  would silently swallow — the Invoice save modal would stay open with zero
  feedback to the user (the P0 bug confirmed in Run 2).
*/
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Prefer the server's own message, fall back to the HTTP status text
    const serverMessage =
      error.response?.data?.message ||
      error.response?.statusText ||
      error.message ||
      "Something went wrong. Please try again.";

    // Attach it directly so callers can do: error.message OR error.response?.data?.message
    error.message = serverMessage;

    if (import.meta.env.DEV) {
      console.error(
        `[API ${error.response?.status ?? "ERR"}]`,
        error.config?.method?.toUpperCase(),
        error.config?.url,
        "→",
        serverMessage
      );
    }

    return Promise.reject(error);
  }
);

export default api;
