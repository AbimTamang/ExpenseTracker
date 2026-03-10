export function getToken() {
  return localStorage.getItem("token");
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("name");
}

