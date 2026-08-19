import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Home, LogIn } from 'lucide-react';
import { getAdminSession } from '../lib/adminSession';
import { getGuestSession, isGuestSessionExpired } from '../lib/guestSession';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useI18n } from '../i18n/useI18n';
import '../styles/NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (location.pathname.startsWith('/admin') && getAdminSession()) {
        navigate('/admin/orders', { replace: true });
        return;
      }

      const guestSession = getGuestSession();
      if (guestSession && !isGuestSessionExpired(guestSession)) {
        navigate('/menu', { replace: true });
        return;
      }

      navigate('/', { replace: true });
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [location.pathname, navigate]);

  return (
    <main className="not-found-page">
      <div className="not-found-shell">
        <section className="not-found-visual" aria-hidden="true">
          <div className="not-found-logo">
            <img src="/park-dedeman-logo.jpg" alt="" />
            <div>
              <strong>PARK DEDEMAN</strong>
              <span>KARTAL</span>
            </div>
          </div>

          <div className="not-found-visual-copy">
            <p>{t('notFound.visualEyebrow')}</p>
            <h2>{t('notFound.visualTitle')}</h2>
            <span>{t('notFound.visualBody')}</span>
          </div>
        </section>

        <section className="not-found-card">
          <div className="not-found-card-top">
            <p className="not-found-code">{t('notFound.code')}</p>
            <LanguageSwitcher compact />
          </div>
          <h1>{t('notFound.title')}</h1>
          <span>{t('notFound.description')}</span>
          <div className="not-found-note">
            <ArrowRight size={16} />
            <span>{t('notFound.note')}</span>
          </div>
          <div className="not-found-actions">
            <button type="button" onClick={() => navigate('/', { replace: true })}>
              <Home size={18} />
              {t('common.actions.backToGuest')}
            </button>
            <button type="button" onClick={() => navigate('/admin', { replace: true })}>
              <LogIn size={18} />
              {t('common.actions.backToAdmin')}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
};

export default NotFound;
