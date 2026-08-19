import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Banknote, Check, ClipboardList, CreditCard, RefreshCw, X, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { api, withToken } from '../../lib/api';
import { clearAdminSession, getAdminSession } from '../../lib/adminSession';
import { announceNewItems } from '../../lib/notifications';
import { useI18n } from '../../i18n/useI18n';
import '../../styles/Admin/AdminOrders.css';

const Orders = () => {
  const { locale, t } = useI18n();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [newOrderIds, setNewOrderIds] = useState([]);
  const [cancelTarget, setCancelTarget] = useState(null);
  const knownOrderIds = useRef(null);
  const session = getAdminSession();

  const money = useCallback(
    (value) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value || 0),
    [locale],
  );
  const roomLabel = useCallback(
    (order) => (order.isOwnOrder ? 'OWN' : t('adminOperations.common.roomValue', { number: order.roomNumber })),
    [t],
  );
  const unauthorized = useCallback(() => {
    clearAdminSession();
    window.location.assign('/admin');
  }, []);

  const loadOrders = useCallback(async (showMessage = false) => {
    try {
      const { data } = await api.get('/orders/active', withToken(session.token));
      const currentIds = new Set(data.map((order) => order._id));
      if (knownOrderIds.current) {
        const newIds = data.filter((order) => !knownOrderIds.current.has(order._id)).map((order) => order._id);
        if (newIds.length) {
          setNewOrderIds(newIds);
          announceNewItems(t('adminOperations.orders.newItems', { count: newIds.length }));
          window.setTimeout(() => setNewOrderIds([]), 6000);
        }
      }
      knownOrderIds.current = currentIds;
      setOrders(data);
      if (showMessage) toast.success(t('adminOperations.orders.refreshed'));
    } catch (error) {
      if (error.response?.status === 401) unauthorized();
      else toast.error(error.response?.data?.message || t('adminOperations.orders.loadError'));
    } finally {
      setLoading(false);
    }
  }, [session?.token, t, unauthorized]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void loadOrders(); }, 0);
    const timer = window.setInterval(() => { void loadOrders(); }, 10_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, [loadOrders]);

  const deliver = async (order) => {
    setUpdatingId(order._id);
    try {
      await api.put(`/orders/${order._id}/deliver`, {}, withToken(session.token));
      setOrders((current) => current.filter((item) => item._id !== order._id));
      toast.success(t('adminOperations.orders.deliveredToast', { room: roomLabel(order) }));
    } catch (error) {
      if (error.response?.status === 401) unauthorized();
      else toast.error(error.response?.data?.message || t('adminOperations.orders.deliverError'));
    } finally {
      setUpdatingId(null);
    }
  };

  const cancel = async () => {
    if (!cancelTarget) return;
    const order = cancelTarget;
    setUpdatingId(order._id);
    try {
      await api.put(`/orders/${order._id}/cancel`, {}, withToken(session.token));
      setOrders((current) => current.filter((item) => item._id !== order._id));
      setCancelTarget(null);
      toast.success(t('adminOperations.orders.cancelledToast', { room: roomLabel(order) }));
    } catch (error) {
      if (error.response?.status === 401) unauthorized();
      else toast.error(error.response?.data?.message || t('adminOperations.orders.cancelError'));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="admin-orders-page">
      <header className="admin-page-heading">
        <div><p>{t('adminOperations.common.liveOperation')}</p><h1>{t('adminOperations.orders.title')}</h1><span>{t('adminOperations.orders.subtitle')}</span></div>
        <button type="button" onClick={() => loadOrders(true)}><RefreshCw size={17} />{t('adminOperations.common.refresh')}</button>
      </header>
      {loading ? <div className="admin-page-loading">{t('adminOperations.orders.loading')}</div> : orders.length ? (
        <div className="admin-orders-grid">
          {orders.map((order) => {
            const isCash = order.paymentMethod === 'Nakit';
            return <article className={`admin-order-card ${newOrderIds.includes(order._id) ? 'admin-new-item' : ''}`} key={order._id}>
              <header><div><span>{order.isOwnOrder ? t('adminOperations.common.internalAccount') : t('adminOperations.common.roomUpper')}</span><h2>{order.isOwnOrder ? 'OWN' : order.roomNumber}</h2></div><button type="button" className="admin-cancel-order" disabled={updatingId === order._id} onClick={() => setCancelTarget(order)}><XCircle size={15} />{t('adminOperations.orders.cancelAction')}</button></header>
              <ul>{order.items.map((item) => <li key={`${order._id}-${item.product}`}><span>{item.quantity} × {item.name}</span><strong>{money(item.quantity * item.unitPrice)}</strong></li>)}</ul>
              <footer><b className={isCash ? 'admin-payment-cash' : 'admin-payment-card'}>{isCash ? <Banknote size={14} /> : <CreditCard size={14} />}{t(isCash ? 'adminOperations.common.cash' : 'adminOperations.common.card')}</b><div className="admin-deliver-action"><strong>{money(order.totalRevenue)}</strong><button type="button" disabled={updatingId === order._id} onClick={() => deliver(order)}>{updatingId === order._id ? t('adminOperations.common.processing') : <><Check size={17} />{t('adminOperations.common.delivered')}</>}</button></div></footer>
            </article>;
          })}
        </div>
      ) : <div className="admin-empty-state"><ClipboardList size={34} /><h2>{t('adminOperations.orders.emptyTitle')}</h2><p>{t('adminOperations.orders.emptyBody')}</p></div>}
      {cancelTarget && <div className="admin-cancel-dialog-backdrop" role="presentation" onClick={() => !updatingId && setCancelTarget(null)}><section className="admin-cancel-dialog" role="dialog" aria-modal="true" aria-labelledby="cancel-order-title" onClick={(event) => event.stopPropagation()}><button type="button" className="admin-cancel-dialog-close" onClick={() => setCancelTarget(null)} disabled={Boolean(updatingId)} aria-label={t('adminOperations.orders.closeDialog')}><X size={18} /></button><span><AlertTriangle size={24} /></span><p>{t('adminOperations.orders.cancelEyebrow')}</p><h2 id="cancel-order-title">{t('adminOperations.orders.cancelTitle', { room: roomLabel(cancelTarget) })}</h2><small>{t('adminOperations.orders.cancelWarning')}</small><div><button type="button" onClick={() => setCancelTarget(null)} disabled={Boolean(updatingId)}>{t('adminOperations.common.cancel')}</button><button type="button" onClick={cancel} disabled={Boolean(updatingId)}>{updatingId ? t('adminOperations.orders.cancelling') : t('adminOperations.orders.confirmCancel')}</button></div></section></div>}
    </div>
  );
};

export default Orders;
