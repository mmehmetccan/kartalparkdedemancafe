import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, Coffee, ReceiptText, Utensils } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { api, withToken } from '../../lib/api';
import { clearAdminSession, getAdminSession } from '../../lib/adminSession';
import { useI18n } from '../../i18n/useI18n';
import { translateManagement } from '../../i18n/managementTranslations';
import '../../styles/Admin/AdminOrderHistory.css';

const today = new Date().toISOString().slice(0, 10);
const currentMonth = today.slice(0, 7);
const historyTabs = {
  coffee: { endpoint: '/orders/history', property: 'orders' },
  breakfast: { endpoint: '/breakfast/history', property: 'breakfasts' }
};

const OrderHistory = () => {
  const { language, locale, formatDate, formatNumber } = useI18n();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('day');
  const [historyType, setHistoryType] = useState('coffee');
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(currentMonth);
  const [result, setResult] = useState({ records: [], startDate: today, endDate: today, period: 'day' });
  const [loading, setLoading] = useState(true);
  const token = getAdminSession()?.token;
  const mt = (key, values) => translateManagement(language, key, values) || key;
  const periodLabels = {
    day: mt('adminOrderHistory.period.day'),
    week: mt('adminOrderHistory.period.week'),
    month: mt('adminOrderHistory.period.month'),
  };
  const historyTabLabels = {
    coffee: mt('adminOrderHistory.historyLabels.coffee'),
    breakfast: mt('adminOrderHistory.historyLabels.breakfast'),
  };

  const formatShortDate = (value) => formatDate(`${value}T00:00:00`);
  const formatDeliveryTime = (value) => new Intl.DateTimeFormat(locale, {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(new Date(value));
  const formatMoney = (value) => formatNumber(value || 0, {
    style: 'currency', currency: 'TRY', maximumFractionDigits: 2
  });

  const query = useMemo(() => {
    const parameters = new URLSearchParams({ period });
    if (period === 'month') parameters.set('month', month);
    else parameters.set('date', date);
    return parameters.toString();
  }, [date, month, period]);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const selectedTab = historyTabs[historyType];
        const response = await api.get(`${selectedTab.endpoint}?${query}`, withToken(token));
        const nextRecords = Array.isArray(response.data?.[selectedTab.property]) ? response.data[selectedTab.property] : [];
        setResult({ ...response.data, records: nextRecords });
      } catch (error) {
        if (error.response?.status === 401) {
          clearAdminSession();
          navigate('/admin', { replace: true });
          return;
        }
        toast.error(
          error?.response?.data?.message
          || translateManagement(language, `api.${error?.response?.data?.messageKey}`, error?.response?.data?.messageParams)
          || translateManagement(language, 'adminOrderHistory.errors.loadFailed')
        );
      } finally {
        setLoading(false);
      }
    };

    void loadHistory();
  }, [historyType, language, navigate, query, token]);

  return (
    <div className="admin-order-history-page">
      <header className="admin-page-heading">
        <div>
          <p>{mt('adminOrderHistory.pageEyebrow')}</p>
          <h1>{mt('adminOrderHistory.pageTitle')}</h1>
          <span>{mt('adminOrderHistory.pageDescription')}</span>
        </div>
      </header>

      <section className="admin-order-history-tabs" aria-label={mt('adminOrderHistory.tabsAria')}>
        <button type="button" className={historyType === 'coffee' ? 'active' : ''} onClick={() => setHistoryType('coffee')}><Coffee size={17} />{mt('adminOrderHistory.tabs.coffee')}</button>
        <button type="button" className={historyType === 'breakfast' ? 'active' : ''} onClick={() => setHistoryType('breakfast')}><Utensils size={17} />{mt('adminOrderHistory.tabs.breakfast')}</button>
      </section>

      <section className="admin-order-history-filters" aria-label={mt('adminOrderHistory.filtersAria')}>
        <div className="admin-order-history-periods">
          {Object.entries(periodLabels).map(([value, label]) => (
            <button type="button" className={period === value ? 'active' : ''} onClick={() => setPeriod(value)} key={value}>{label}</button>
          ))}
        </div>
        <label>
          {period === 'month' ? mt('adminOrderHistory.filterLabel.month') : period === 'week' ? mt('adminOrderHistory.filterLabel.week') : mt('adminOrderHistory.filterLabel.day')}
          <input
            type={period === 'month' ? 'month' : 'date'}
            value={period === 'month' ? month : date}
            onChange={(event) => period === 'month' ? setMonth(event.target.value) : setDate(event.target.value)}
          />
        </label>
      </section>

      {loading ? <div className="admin-page-loading">{mt('adminOrderHistory.loading')}</div> : (
        <>
          <div className="admin-order-history-range"><CalendarDays size={16} />{mt('adminOrderHistory.rangeLabel', { period: periodLabels[result.period], start: formatShortDate(result.startDate), end: formatShortDate(result.endDate) })}</div>
          <section className="admin-order-history-list">
            <header>
              <div><CheckCircle2 size={20} /><h2>{mt('adminOrderHistory.recordsTitle', { count: result.records.length, label: historyTabLabels[historyType].toLocaleLowerCase(locale) })}</h2></div>
              <span><Clock3 size={14} />{mt('adminOrderHistory.recordsMeta')}</span>
            </header>
            {result.records.length ? (
              <div className="admin-order-history-table-wrap">
                <table>
                  <thead>{historyType === 'coffee' ? <tr><th>{mt('adminOrderHistory.table.room')}</th><th>{mt('adminOrderHistory.table.items')}</th><th>{mt('adminOrderHistory.table.payment')}</th><th>{mt('adminOrderHistory.table.amount')}</th><th>{mt('adminOrderHistory.table.deliveredAt')}</th></tr> : <tr><th>{mt('adminOrderHistory.table.room')}</th><th>{mt('adminOrderHistory.table.guestTime')}</th><th>{mt('adminOrderHistory.table.status')}</th><th>{mt('adminOrderHistory.table.eventTime')}</th></tr>}</thead>
                  <tbody>{historyType === 'coffee' ? result.records.map((order) => (
                    <tr key={order._id}><td>{order.isOwnOrder ? mt('adminOrderHistory.fallback.own') : mt('adminOrderHistory.fallback.room', { room: order.roomNumber })}</td><td>{Array.isArray(order.items) ? order.items.map((item) => `${item.quantity}× ${item.name}`).join(', ') : mt('adminOrderHistory.fallback.empty')}</td><td>{order.paymentMethod || mt('adminOrderHistory.fallback.empty')}</td><td>{formatMoney(order.totalRevenue)}</td><td><time dateTime={order.deliveredAt}>{order.deliveredAt ? formatDeliveryTime(order.deliveredAt) : mt('adminOrderHistory.fallback.empty')}</time></td></tr>
                  )) : result.records.map((breakfast) => {
                    const eventTime = breakfast.status === 'İptal Edildi' ? breakfast.cancelledAt : breakfast.deliveredAt;
                    return <tr key={breakfast._id}><td>{mt('adminOrderHistory.fallback.room', { room: breakfast.roomNumber })}</td><td>{mt('adminOrderHistory.fallback.guestCount', { count: breakfast.guestCount || 1 })} · {breakfast.requestedTime || mt('adminOrderHistory.fallback.requestedTime')}</td><td>{mt(`adminOrderHistory.breakfastStatus.${breakfast.status}`)}</td><td><time dateTime={eventTime}>{eventTime ? formatDeliveryTime(eventTime) : mt('adminOrderHistory.fallback.empty')}</time></td></tr>;
                  })}</tbody>
                </table>
              </div>
            ) : <div className="admin-order-history-empty"><ReceiptText size={28} /><p>{historyType === 'coffee' ? mt('adminOrderHistory.fallback.noCoffee') : mt('adminOrderHistory.fallback.noBreakfast')}</p></div>}
          </section>
        </>
      )}
    </div>
  );
};

export default OrderHistory;
