/** JWT payload uses `{ id, role? }` from backend authController. */
export function getStoredUserId() {
  const id = localStorage.getItem("userId");
  if (id) return id;
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json);
    return payload.id || null;
  } catch {
    return null;
  }
}

export function getStoredUserRole() {
  const stored = localStorage.getItem("userRole");
  if (stored) return stored;
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json);
    return payload.role || "user";
  } catch {
    return null;
  }
}

export function setAuthSession({ token, user }) {
  if (token) localStorage.setItem("token", token);
  if (user?.email) localStorage.setItem("userEmail", user.email);
  if (user?._id) localStorage.setItem("userId", user._id);
  if (user?.role) localStorage.setItem("userRole", user.role);
}

export function clearAuthSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userId");
  localStorage.removeItem("userRole");
}

export function isAdmin() {
  return getStoredUserRole() === "admin";
}

export function isAuthenticated() {
  return !!localStorage.getItem("token");
}
