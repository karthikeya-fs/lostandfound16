import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

/** Origin for static files (e.g. `/uploads/...`) served by the API server */
export const API_ORIGIN = (() => {
  const base = API.defaults.baseURL || "http://localhost:5000/api";
  try {
    return new URL(base).origin;
  } catch {
    return "http://localhost:5000";
  }
})();

/** Resolve a stored path like `/uploads/foo.jpg` to a full URL */
export function assetUrl(storedPath) {
  if (!storedPath || typeof storedPath !== "string") return "";
  if (storedPath.startsWith("http://") || storedPath.startsWith("https://")) {
    return storedPath;
  }
  const path = storedPath.startsWith("/") ? storedPath : `/${storedPath}`;
  return `${API_ORIGIN}${path}`;
}

export default API;
