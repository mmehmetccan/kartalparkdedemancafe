import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AdminLayout from './components/AdminLayout';
import AdminRoute from './components/AdminRoute';
import GuestRoute from './components/GuestRoute';
import Login from './pages/guest/login';
import Menu from './pages/guest/menu';
import AdminLogin from './pages/admin/login';
import Orders from './pages/admin/orders';
import BreakfastCreate from './pages/admin/breakfastCreate';
import Breakfast from './pages/admin/breakfast';
import Dashboard from './pages/admin/dashboard';
import AdminUsers from './pages/admin/users';
import OrderHistory from './pages/admin/orderHistory';
import Products from './pages/admin/products';
import NotFound from './pages/NotFound';
import { useI18n } from './i18n/useI18n';

function App() {
  const { dir } = useI18n();

  return (
    <Router>
      {/* ToastContainer en dışa eklenir ki tüm sayfalarda bildirimler görünebilsin */}
      <ToastContainer autoClose={2000} position={dir === 'rtl' ? 'top-left' : 'top-right'} />
      
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<GuestRoute />}>
          <Route path="/menu" element={<Menu />} />
        </Route>
        
        <Route path="/admin" element={<AdminLogin />} />
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/orders" element={<Orders />} />
            <Route path="/admin/order-history" element={<OrderHistory />} />
            <Route path="/admin/breakfast" element={<Breakfast />} />
            <Route path="/admin/products" element={<Products />} />
            <Route element={<AdminRoute roles={['admin', 'reception']} />}>
              <Route path="/admin/breakfast/create" element={<BreakfastCreate />} />
            </Route>
            <Route element={<AdminRoute roles={['admin']} />}>
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
