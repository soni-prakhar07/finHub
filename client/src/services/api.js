import axios from "axios";

export const AUTH_TOKEN_KEY = "token";

function normalizeBaseUrl(url) {
  if (!url || typeof url !== "string") {
    return null;
  }
  return url.replace(/\/+$/, "");
}

// Always talk to the API server (default :5000). Override with VITE_API_BASE_URL if needed.
const envUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
const baseURL = envUrl || "http://localhost:5000";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
