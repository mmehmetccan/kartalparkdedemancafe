const ADMIN_SESSION_KEY = 'adminSession';

const tokenExpiresAt = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
};

export const saveAdminSession = (data) => {
  const session = { token: data.token, username: data.username, role: data.role, expiresAt: tokenExpiresAt(data.token) };
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  return session;
};

export const getAdminSession = () => {
  try {
    const session = JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY));
    if (!session?.token || !session?.role || !session.expiresAt || session.expiresAt <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
};

export const clearAdminSession = () => localStorage.removeItem(ADMIN_SESSION_KEY);
