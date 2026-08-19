import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, KeyRound } from 'lucide-react';
import { toast } from 'react-toastify';
import { api } from '../../lib/api';
import { getGuestSession, isGuestSessionExpired, saveGuestSession } from '../../lib/guestSession';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useI18n } from '../../i18n/useI18n';
import '../../styles/Guest/GuestLogin.css';

const isValidRoom = (value) => value.toLowerCase() === 'own' || /^[1-6]0(?:0[1-9]|1[0-2])$/.test(value);

const Login = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [roomNumber, setRoomNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const activeSession = getGuestSession();
    if (activeSession && !isGuestSessionExpired(activeSession)) navigate('/menu', { replace: true });
  }, [navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();
    const trimmedRoomNumber = roomNumber.trim();
    if (!trimmedRoomNumber) {
      toast.warn(t('guestLogin.errors.emptyRoom'));
      return;
    }
    if (!isValidRoom(trimmedRoomNumber)) {
      toast.warn(t('guestLogin.errors.invalidRoom'));
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { roomNumber: trimmedRoomNumber });
      saveGuestSession(data);
      navigate('/menu');
    } catch (error) {
      toast.error(error.response?.data?.message || t('guestLogin.errors.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="guest-login-page">
      <header className="guest-login-topbar">
        <div className="guest-login-brand">
          <img src="/park-dedeman-login-logo.jpg" alt={t('common.hotelName')} />
          <div>
            <strong>PARK DEDEMAN</strong>
            <span>KARTAL</span>
          </div>
        </div>
        <div className="guest-login-topbar-actions">
          <LanguageSwitcher compact />
          <p>{t('guestLogin.topBadge')}</p>
        </div>
      </header>

      <section className="guest-login-layout" aria-labelledby="guest-login-title">
        <section className="guest-login-visual">
          <div className="guest-login-welcome">
            <p>{t('guestLogin.welcomeEyebrow')}</p>
            <h1>{t('guestLogin.welcomeTitle')}</h1>
            <span>{t('guestLogin.welcomeBody')}</span>
          </div>
        </section>

        <section className="guest-login-form-area">
          <p className="guest-login-kicker">{t('guestLogin.kicker')}</p>
          <h2 id="guest-login-title">{t('guestLogin.title')}</h2>
          <p className="guest-login-description">{t('guestLogin.description')}</p>

          <form onSubmit={handleLogin} className="guest-login-form">
            <label htmlFor="room-number">
              <span>{t('guestLogin.roomLabel')}</span>
              <small>{t('guestLogin.roomHelp')}</small>
            </label>
            <div className="guest-login-input-wrap">
              <KeyRound size={19} aria-hidden="true" />
              <input
                id="room-number"
                type="text"
                inputMode="text"
                autoComplete="off"
                maxLength={4}
                placeholder={t('guestLogin.roomPlaceholder')}
                value={roomNumber}
                onChange={(event) => setRoomNumber(event.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>
            <button type="submit" disabled={loading} className="guest-login-submit">
              {loading ? t('guestLogin.submitting') : <>{t('guestLogin.submit')} <ArrowRight size={18} /></>}
            </button>
            <p className="guest-login-form-note">{t('guestLogin.note')}</p>
          </form>
        </section>
      </section>
    </main>
  );
};

export default Login;
