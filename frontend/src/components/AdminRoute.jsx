import { Navigate, Outlet } from 'react-router-dom';
import { getAdminSession } from '../lib/adminSession';

const AdminRoute = ({ roles }) => {
  const session = getAdminSession();
  if (!session) return <Navigate to="/admin" replace />;
  if (roles && !roles.includes(session.role)) return <Navigate to="/admin/orders" replace />;
  return <Outlet />;
};

export default AdminRoute;
