import { Navigate, Outlet } from 'react-router-dom';
import { getGuestSession, isGuestSessionExpired } from '../lib/guestSession';

const GuestRoute = () => {
  const session = getGuestSession();

  if (!session || isGuestSessionExpired(session)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default GuestRoute;
