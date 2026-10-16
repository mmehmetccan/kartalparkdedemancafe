import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, KeyRound } from 'lucide-react';
import { toast } from 'react-toastify';
import { api } from '../../lib/api';
import { getGuestSession, isGuestSessionExpired, saveGuestSession } from '../../lib/guestSession';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useI18n } from '../../i18n/useI18n';
import { publicAsset } from '../../lib/publicAsset';
import '../../styles/Guest/GuestLogin.css';

const isValidRoom = (value) => value.toLowerCase() === 'own' || /^[1-6]0(?:0[1-9]|1[0-2])$/.test(value);
const isPossibleAdminUsername = (value) => /^[a-zA-Z0-9._-]{3,40}$/.test(value);

const Login = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [roomNumber, setRoomNumber] = useState('');
  const [roomError, setRoomError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const activeSession = getGuestSession();
    if (activeSession && !isGuestSessionExpired(activeSession)) navigate('/menu', { replace: true });
  }, [navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();
    const trimmedRoomNumber = roomNumber.trim();
    setRoomError('');
    if (!trimmedRoomNumber) {
      setRoomError(t('guestLogin.errors.emptyRoom'));
      return;
    }

    if (!isValidRoom(trimmedRoomNumber) && isPossibleAdminUsername(trimmedRoomNumber)) {
      setLoading(true);
      try {
        const { data } = await api.get('/auth/admin/exists', { params: { username: trimmedRoomNumber } });
        if (data?.exists) {
          navigate('/admin', { replace: true, state: { username: trimmedRoomNumber } });
          return;
        }
      } catch {
        // If the username check cannot complete, keep the normal room-login validation flow.
      } finally {
        setLoading(false);
      }
    }

    if (!isValidRoom(trimmedRoomNumber)) {
      setRoomError(t('guestLogin.errors.invalidRoom'));
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
        <div className="guest-login-topbar-inner">
          <div className="guest-login-brand">
            <div className="guest-login-brand-copy" aria-label={t('common.hotelName')}>
              <img src={publicAsset('park-dedeman-header-lockup.webp')} alt={t('common.hotelName')} className="guest-login-brand-mark" />
            </div>
          </div>

          <div className="guest-login-topbar-actions">
            <LanguageSwitcher compact className="guest-login-language-switcher" />
            <p>{t('guestLogin.topBadge')}</p>
          </div>
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
            <div className={`guest-login-input-wrap${roomError ? ' has-error' : ''}`}>
              <KeyRound size={19} aria-hidden="true" />
              <input
                id="room-number"
                type="text"
                inputMode="text"
                autoComplete="off"
                maxLength={40}
                placeholder={t('guestLogin.roomPlaceholder')}
                value={roomNumber}
                onChange={(event) => {
                  setRoomNumber(event.target.value);
                  if (roomError) setRoomError('');
                }}
                disabled={loading}
                aria-invalid={Boolean(roomError)}
                aria-describedby={roomError ? 'room-number-error' : undefined}
                autoFocus
              />
            </div>
            {roomError && (
              <p id="room-number-error" className="guest-login-alert" role="alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{roomError}</span>
              </p>
            )}
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
