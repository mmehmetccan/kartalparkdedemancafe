import { useState } from 'react';
import { CalendarPlus, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import { api, withToken } from '../../lib/api';
import { clearAdminSession, getAdminSession } from '../../lib/adminSession';
import { useI18n } from '../../i18n/useI18n';
import '../../styles/Admin/AdminBreakfastCreate.css';

const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

const BreakfastCreate = () => {
  const { t } = useI18n();
  const [roomNumber, setRoomNumber] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [requestedTime, setRequestedTime] = useState('09:00');
  const [scheduledDate, setScheduledDate] = useState(tomorrow);
  const [days, setDays] = useState(1);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const session = getAdminSession();

  const createBreakfast = async (event) => {
    event.preventDefault();
    if (!roomNumber.trim()) { toast.warning(t('adminOperations.createBreakfast.roomRequired')); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/breakfast', { roomNumber: roomNumber.trim(), guestCount: Number(guestCount), requestedTime, scheduledDate, days: Number(days), note: note.trim() }, withToken(session.token));
      toast.success(t('adminOperations.createBreakfast.created', { count: data.breakfasts.length }));
      setRoomNumber('');
      setGuestCount(1);
      setRequestedTime('09:00');
      setScheduledDate(tomorrow);
      setDays(1);
      setNote('');
    } catch (error) {
      if (error.response?.status === 401) { clearAdminSession(); window.location.assign('/admin'); return; }
      toast.error(error.response?.data?.message || t('adminOperations.createBreakfast.createError'));
    } finally { setLoading(false); }
  };

  return <div className="admin-breakfast-create-page">
    <header className="admin-page-heading"><div><p>{t('adminOperations.common.breakfastOperation')}</p><h1>{t('adminOperations.createBreakfast.title')}</h1><span>{t('adminOperations.createBreakfast.subtitle')}</span></div></header>
    <section className="admin-breakfast-create-card"><div className="admin-breakfast-create-icon"><CalendarPlus size={28} /></div><form onSubmit={createBreakfast}>
      <label htmlFor="breakfast-room">{t('adminOperations.createBreakfast.roomNumber')}</label><input id="breakfast-room" value={roomNumber} onChange={(event) => setRoomNumber(event.target.value)} placeholder={t('adminOperations.createBreakfast.roomPlaceholder')} autoFocus />
      <div className="admin-breakfast-field-grid"><label htmlFor="breakfast-guests">{t('adminOperations.createBreakfast.guestCount')}<input id="breakfast-guests" type="number" min="1" max="20" value={guestCount} onChange={(event) => setGuestCount(event.target.value)} /></label><label htmlFor="breakfast-time">{t('adminOperations.createBreakfast.requestedTime')}<input id="breakfast-time" type="time" value={requestedTime} onChange={(event) => setRequestedTime(event.target.value)} /></label></div>
      <div className="admin-breakfast-field-grid"><label htmlFor="breakfast-date">{t('adminOperations.createBreakfast.startDate')}<input id="breakfast-date" type="date" min={today} max={tomorrow} value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} /></label><label htmlFor="breakfast-days">{t('adminOperations.createBreakfast.breakfastDays')}<input id="breakfast-days" type="number" min="1" max="30" value={days} onChange={(event) => setDays(event.target.value)} /></label></div>
      <p className="admin-breakfast-create-help">{t('adminOperations.createBreakfast.help')}</p>
      <label htmlFor="breakfast-note">{t('adminOperations.createBreakfast.guestNote')} <span>{t('adminOperations.common.optional')}</span></label><textarea id="breakfast-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder={t('adminOperations.createBreakfast.notePlaceholder')} rows="4" maxLength="500" />
      <button type="submit" disabled={loading}>{loading ? t('adminOperations.createBreakfast.saving') : <><Send size={17} />{t('adminOperations.createBreakfast.submit')}</>}</button>
    </form></section>
  </div>;
};

export default BreakfastCreate;
