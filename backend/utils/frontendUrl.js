/**
 * Build frontend URLs without double slashes.
 * FRONTEND_URL should be e.g. https://expensetracker.kushal-karki.com.np (no trailing slash).
 */
function frontendUrl(path) {
  const base = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")[0]
    .trim()
    .replace(/\/+$/, "");

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

module.exports = frontendUrl;
