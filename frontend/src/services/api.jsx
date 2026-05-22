import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "/api" : "http://localhost:5000/api");

const API = axios.create({
  baseURL,
  timeout: 30000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const API_ORIGIN = (() => {
  const base = API.defaults.baseURL || "http://localhost:5000/api";
  try {
    return new URL(base).origin;
  } catch {
    return "http://localhost:5000";
  }
})();

export function assetUrl(storedPath) {
  if (!storedPath || typeof storedPath !== "string") return "";
  if (storedPath.startsWith("http://") || storedPath.startsWith("https://")) {
    return storedPath;
  }
  const path = storedPath.startsWith("/") ? storedPath : `/${storedPath}`;
  return `${API_ORIGIN}${path}`;
}

export default API;
