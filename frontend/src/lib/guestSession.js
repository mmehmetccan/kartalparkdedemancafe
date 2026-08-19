const SESSION_KEY = 'guestSession';

const parseTokenPayload = (token) => {
  try {
    const encodedPayload = token.split('.')[1];
    return JSON.parse(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
};

export const saveGuestSession = ({ token, roomNumber, expiresAt }) => {
  const payload = parseTokenPayload(token);
  const session = {
    token,
    roomNumber: String(roomNumber),
    expiresAt,
    cartKey: `guestCart:${roomNumber}:${payload?.iat || Date.now()}`
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
};

export const getGuestSession = () => {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!session?.token || !session?.roomNumber || !session?.expiresAt || !session?.cartKey) return null;
    return session;
  } catch {
    return null;
  }
};

export const isGuestSessionExpired = (session) => !session || new Date(session.expiresAt).getTime() <= Date.now();

export const clearGuestSession = () => {
  const session = getGuestSession();
  if (session?.cartKey) localStorage.removeItem(session.cartKey);
  localStorage.removeItem(SESSION_KEY);
};

export const getGuestCart = (cartKey) => {
  try {
    return JSON.parse(localStorage.getItem(cartKey)) || {};
  } catch {
    return {};
  }
};

export const saveGuestCart = (cartKey, cart) => {
  localStorage.setItem(cartKey, JSON.stringify(cart));
};
