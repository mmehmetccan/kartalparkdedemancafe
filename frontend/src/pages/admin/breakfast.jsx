import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Clock3, Coffee, Pencil, RefreshCw, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import { api, withToken } from '../../lib/api';
import { clearAdminSession, getAdminSession } from '../../lib/adminSession';
import { announceNewItems } from '../../lib/notifications';
import { useI18n } from '../../i18n/useI18n';
import '../../styles/Admin/AdminBreakfast.css';

const Breakfast = () => {
  const { locale, t } = useI18n();
  const [breakfasts, setBreakfasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [newBreakfastIds, setNewBreakfastIds] = useState([]);
  const [editing, setEditing] = useState(null);
  const knownBreakfastIds = useRef(null);
  const session = getAdminSession();
  const canEdit = ['admin', 'reception'].includes(session?.role);
  const unauthorized = useCallback(() => { clearAdminSession(); window.location.assign('/admin'); }, []);

  const loadBreakfasts = useCallback(async (showMessage = false) => {
    try {
      const { data } = await api.get('/breakfast/active', withToken(session.token));
      const currentIds = new Set(data.map((item) => item._id));
      if (knownBreakfastIds.current) {
        const newIds = data.filter((item) => !knownBreakfastIds.current.has(item._id)).map((item) => item._id);
        if (newIds.length) {
          setNewBreakfastIds(newIds);
          announceNewItems(t('adminOperations.breakfast.newItems', { count: newIds.length }));
          window.setTimeout(() => setNewBreakfastIds([]), 6000);
        }
      }
      knownBreakfastIds.current = currentIds;
      setBreakfasts(data);
      if (showMessage) toast.success(t('adminOperations.breakfast.refreshed'));
    } catch (error) {
      if (error.response?.status === 401) unauthorized();
      else toast.error(error.response?.data?.message || t('adminOperations.breakfast.loadError'));
    } finally {
      setLoading(false);
    }
  }, [session?.token, t, unauthorized]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void loadBreakfasts(); }, 0);
    const timer = window.setInterval(() => { void loadBreakfasts(); }, 10_000);
    return () => { window.clearTimeout(initialLoad); window.clearInterval(timer); };
  }, [loadBreakfasts]);

  const deliver = async (breakfast) => {
    setUpdatingId(breakfast._id);
    try {
      await api.put(`/breakfast/${breakfast._id}/deliver`, {}, withToken(session.token));
      setBreakfasts((current) => current.filter((item) => item._id !== breakfast._id));
      toast.success(t('adminOperations.breakfast.deliveredToast', { room: breakfast.roomNumber }));
    } catch (error) {
      if (error.response?.status === 401) unauthorized();
      else toast.error(error.response?.data?.message || t('adminOperations.breakfast.deliverError'));
    } finally { setUpdatingId(null); }
  };

  const beginEdit = (breakfast) => setEditing({
    id: breakfast._id,
    roomNumber: breakfast.roomNumber,
    guestCount: breakfast.guestCount || 1,
    requestedTime: breakfast.requestedTime || '09:00',
    scheduledDate: breakfast.scheduledDate || new Date().toISOString().slice(0, 10),
    note: breakfast.note || '',
  });

  const saveEdit = async (event) => {
    event.preventDefault();
    setUpdatingId(editing.id);
    try {
      const { data } = await api.put(`/breakfast/${editing.id}`, { ...editing, guestCount: Number(editing.guestCount) }, withToken(session.token));
      setBreakfasts((current) => current.map((item) => item._id === data._id ? data : item));
      setEditing(null);
      toast.success(t('adminOperations.breakfast.updated'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('adminOperations.breakfast.updateError'));
    } finally { setUpdatingId(null); }
  };

  return <div className="admin-breakfast-page">
    <header className="admin-page-heading"><div><p>{t('adminOperations.common.breakfastOperation')}</p><h1>{t('adminOperations.breakfast.title')}</h1><span>{t('adminOperations.breakfast.subtitle')}</span></div><button type="button" onClick={() => loadBreakfasts(true)}><RefreshCw size={17} />{t('adminOperations.common.refresh')}</button></header>
    {loading ? <div className="admin-page-loading">{t('adminOperations.breakfast.loading')}</div> : breakfasts.length ? <div className="admin-breakfast-grid">
      {breakfasts.map((breakfast) => <article className={`admin-breakfast-card ${newBreakfastIds.includes(breakfast._id) ? 'admin-new-item' : ''}`} key={breakfast._id}>
        <header><Coffee size={21} /><div><span>{t('adminOperations.common.roomUpper')}</span><h2>{breakfast.roomNumber}</h2></div>{canEdit && <button className="admin-breakfast-edit-button" type="button" onClick={() => beginEdit(breakfast)}><Pencil size={14} />{t('adminOperations.breakfast.edit')}</button>}</header>
        {editing?.id === breakfast._id ? <form className="admin-breakfast-edit-form" onSubmit={saveEdit}>
          <input value={editing.roomNumber} onChange={(event) => setEditing({ ...editing, roomNumber: event.target.value })} aria-label={t('adminOperations.breakfast.roomNumber')} />
          <div><input type="number" min="1" max="20" value={editing.guestCount} onChange={(event) => setEditing({ ...editing, guestCount: event.target.value })} aria-label={t('adminOperations.breakfast.guestCount')} /><input type="time" value={editing.requestedTime} onChange={(event) => setEditing({ ...editing, requestedTime: event.target.value })} aria-label={t('adminOperations.breakfast.requestedTime')} /></div>
          <input type="date" value={editing.scheduledDate} onChange={(event) => setEditing({ ...editing, scheduledDate: event.target.value })} aria-label={t('adminOperations.breakfast.breakfastDate')} />
          <textarea value={editing.note} onChange={(event) => setEditing({ ...editing, note: event.target.value })} rows="3" maxLength="500" />
          <div className="admin-breakfast-edit-actions"><button type="button" onClick={() => setEditing(null)}>{t('adminOperations.common.cancel')}</button><button type="submit" disabled={updatingId === breakfast._id}>{t('adminOperations.common.save')}</button></div>
        </form> : <><div className="admin-breakfast-details"><span><Users size={15} />{breakfast.guestCount || 1} {t('adminOperations.common.person')}</span><span><Clock3 size={15} />{breakfast.requestedTime || '09:00'}</span></div><div className="admin-breakfast-note"><span>{t('adminOperations.common.note')}</span><p>{breakfast.note || t('adminOperations.common.noGuestNote')}</p></div><footer><time>{breakfast.scheduledDate || new Date(breakfast.createdAt).toLocaleDateString(locale)}</time><button type="button" disabled={updatingId === breakfast._id} onClick={() => deliver(breakfast)}>{updatingId === breakfast._id ? t('adminOperations.common.processing') : <><Check size={17} />{t('adminOperations.common.delivered')}</>}</button></footer></>}
      </article>)}
    </div> : <div className="admin-empty-state"><Coffee size={34} /><h2>{t('adminOperations.breakfast.emptyTitle')}</h2><p>{t('adminOperations.breakfast.emptyBody')}</p></div>}
  </div>;
};

export default Breakfast;
