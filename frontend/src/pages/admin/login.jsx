import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole, LogIn, UserRound } from 'lucide-react';
import { toast } from 'react-toastify';
import { api } from '../../lib/api';
import { getAdminSession, saveAdminSession } from '../../lib/adminSession';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useI18n } from '../../i18n/useI18n';
import '../../styles/Admin/AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getAdminSession()) navigate('/admin/orders', { replace: true });
  }, [navigate]);

  const login = async (event) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      toast.warning(t('adminLogin.errors.required'));
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/admin/login', { username: username.trim(), password });
      saveAdminSession(data);
      navigate('/admin/orders', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || t('adminLogin.errors.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-intro">
        <div className="admin-login-language">
          <LanguageSwitcher compact />
        </div>
        <img src="/park-dedeman-logo.jpg" alt={t('common.hotelName')} />
        <p>{t('adminLogin.brand')}</p>
        <h1>{t('adminLogin.title')}</h1>
        <span>{t('adminLogin.description')}</span>
      </section>
      <section className="admin-login-panel">
        <div className="admin-login-card">
          <p>{t('adminLogin.kicker')}</p>
          <h2>{t('adminLogin.welcome')}</h2>
          <form onSubmit={login}>
            <label htmlFor="admin-username">{t('adminLogin.username')}</label>
            <div><UserRound size={18} /><input id="admin-username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" /></div>
            <label htmlFor="admin-password">{t('adminLogin.password')}</label>
            <div><LockKeyhole size={18} /><input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></div>
            <button type="submit" disabled={loading}>{loading ? t('adminLogin.submitting') : <><LogIn size={18} />{t('adminLogin.submit')}</>}</button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default AdminLogin;
