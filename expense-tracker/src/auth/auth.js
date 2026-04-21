export function getToken() {
  return localStorage.getItem("token");
}

export function isAuthenticated() {
  const token = getToken();
  return Boolean(token) && token !== "undefined" && token !== "null";
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("name");
}

