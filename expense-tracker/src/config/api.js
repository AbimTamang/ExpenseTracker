/**
 * Builds API URLs safely (no double slashes, always includes /api).
 *
 * Set VITE_API_URL to your API host, e.g.:
 *   https://api.expensetracker.kushal-karki.com.np/api
 * or (host only — /api is added automatically):
 *   https://api.expensetracker.kushal-karki.com.np
 */
function getApiBase() {
  let base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  base = base.replace(/\/+$/, "");
  if (!base.endsWith("/api")) {
    base = `${base}/api`;
  }
  return base;
}

export const API_BASE = getApiBase();

export function apiUrl(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}
