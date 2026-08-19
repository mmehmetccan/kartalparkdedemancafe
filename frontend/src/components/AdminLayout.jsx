import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CalendarPlus, ClipboardList, Coffee, History, LayoutDashboard, LogOut, PackagePlus, UsersRound } from 'lucide-react';
import { clearAdminSession, getAdminSession } from '../lib/adminSession';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../i18n/useI18n';
import '../styles/Admin/AdminLayout.css';

const AdminLayout = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const session = getAdminSession();
  const username = session?.username || t('adminLayout.fallbackUser');
  const role = session?.role;
  const canCreateBreakfast = ['admin', 'reception'].includes(role);
  const canViewReports = role === 'admin';

  const logout = () => {
    clearAdminSession();
    navigate('/admin', { replace: true });
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img src="/park-dedeman-logo.jpg" alt={t('common.hotelName')} />
          <div><span>{t('common.hotelName')}</span><strong>{t('common.adminPanel')}</strong></div>
        </div>
        <nav className="admin-navigation" aria-label={t('adminLayout.ariaLabel')}>
          <NavLink to="/admin/orders"><ClipboardList size={18} />{t('adminLayout.nav.orders')}</NavLink>
          <NavLink to="/admin/order-history"><History size={18} />{t('adminLayout.nav.delivered')}</NavLink>
          {canCreateBreakfast && <NavLink to="/admin/breakfast/create"><CalendarPlus size={18} />{t('adminLayout.nav.createBreakfast')}</NavLink>}
          <NavLink to="/admin/breakfast"><Coffee size={18} />{t('adminLayout.nav.breakfasts')}</NavLink>
          <NavLink to="/admin/products"><PackagePlus size={18} />{t('adminLayout.nav.products')}</NavLink>
          {canViewReports && <NavLink to="/admin/dashboard"><LayoutDashboard size={18} />{t('adminLayout.nav.reports')}</NavLink>}
          {canViewReports && <NavLink to="/admin/users"><UsersRound size={18} />{t('adminLayout.nav.users')}</NavLink>}
        </nav>
        <div className="admin-sidebar-footer">
          <span>{t('adminLayout.footerLabel', { username, role: t(`adminLayout.roles.${role || 'admin'}`) })}</span>
          <div className="admin-sidebar-tools">
            <LanguageSwitcher compact />
            <button type="button" onClick={logout}><LogOut size={16} />{t('common.actions.logout')}</button>
          </div>
        </div>
      </aside>
      <section className="admin-main"><Outlet /></section>
    </div>
  );
};

export default AdminLayout;
