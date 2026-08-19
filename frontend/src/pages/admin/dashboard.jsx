import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CalendarDays, Coffee, ReceiptText, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { toast } from 'react-toastify';
import { api, withToken } from '../../lib/api';
import { clearAdminSession, getAdminSession } from '../../lib/adminSession';
import { useI18n } from '../../i18n/useI18n';
import '../../styles/Admin/AdminDashboard.css';

const today = new Date().toISOString().slice(0, 10);
const currentMonth = today.slice(0, 7);
const PERIODS = ['day', 'week', 'month', 'custom'];

const Dashboard = () => {
  const { locale, t } = useI18n();
  const [period, setPeriod] = useState('month');
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(currentMonth);
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [summary, setSummary] = useState({ orderCount: 0, revenue: 0, cost: 0, profit: 0, ownOrderCount: 0, ownBalance: 0, startDate: today, endDate: today });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const session = getAdminSession();

  const money = (value) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value || 0);
  const periodLabel = (value) => t(`adminOperations.dashboard.periods.${value}`);
  const roomLabel = (order) => order.isOwnOrder ? 'OWN' : t('adminOperations.common.roomValue', { number: order.roomNumber });
  const paymentLabel = (method) => method === 'Nakit' ? t('adminOperations.common.cash') : method === 'Kredi Kartı' ? t('adminOperations.common.card') : method;
  const query = useMemo(() => {
    const parameters = new URLSearchParams({ period });
    if (period === 'month') parameters.set('month', month);
    if (period === 'day' || period === 'week') parameters.set('date', date);
    if (period === 'custom') { parameters.set('start', start); parameters.set('end', end); }
    return parameters.toString();
  }, [period, month, date, start, end]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [summaryResult, historyResult] = await Promise.all([
          api.get(`/orders/summary?${query}`, withToken(session.token)),
          api.get(`/orders/history?${query}`, withToken(session.token)),
        ]);
        setSummary(summaryResult.data);
        setHistory(historyResult.data.orders);
      } catch (error) {
        if ([401, 403].includes(error.response?.status)) { clearAdminSession(); window.location.assign('/admin'); return; }
        toast.error(error.response?.data?.message || t('adminOperations.dashboard.loadError'));
      } finally { setLoading(false); }
    };
    void loadDashboard();
  }, [query, session?.token, t]);

  return <div className="admin-dashboard-page">
    <header className="admin-page-heading"><div><p>{t('adminOperations.dashboard.eyebrow')}</p><h1>{t('adminOperations.dashboard.title')}</h1><span>{t('adminOperations.dashboard.subtitle')}</span></div></header>
    <section className="admin-report-filters" aria-label={t('adminOperations.dashboard.filtersLabel')}>
      <div className="admin-period-buttons">{PERIODS.map((value) => <button type="button" className={period === value ? 'active' : ''} onClick={() => setPeriod(value)} key={value}>{periodLabel(value)}</button>)}</div>
      <div className="admin-period-date-fields">
        {period === 'month' && <label>{t('adminOperations.dashboard.month')}<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>}
        {(period === 'day' || period === 'week') && <label>{t(period === 'day' ? 'adminOperations.dashboard.day' : 'adminOperations.dashboard.weekDay')}<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>}
        {period === 'custom' && <><label>{t('adminOperations.dashboard.start')}<input type="date" value={start} onChange={(event) => setStart(event.target.value)} /></label><label>{t('adminOperations.dashboard.end')}<input type="date" min={start} value={end} onChange={(event) => setEnd(event.target.value)} /></label></>}
      </div>
    </section>
    {loading ? <div className="admin-page-loading">{t('adminOperations.dashboard.loading')}</div> : <>
      <div className="admin-report-range"><CalendarDays size={16} />{periodLabel(summary.period)}: {new Date(`${summary.startDate}T00:00:00`).toLocaleDateString(locale)} – {new Date(`${summary.endDate}T00:00:00`).toLocaleDateString(locale)}</div>
      <section className="admin-metric-grid">
        <article><span><ReceiptText size={19} /></span><p>{t('adminOperations.dashboard.deliveredOrders')}</p><strong>{summary.orderCount}</strong></article>
        <article><span><TrendingUp size={19} /></span><p>{t('adminOperations.dashboard.revenue')}</p><strong>{money(summary.revenue)}</strong></article>
        <article><span><TrendingDown size={19} /></span><p>{t('adminOperations.dashboard.cost')}</p><strong>{money(summary.cost)}</strong></article>
        <article className="profit"><span><Wallet size={19} /></span><p>{t('adminOperations.dashboard.profit')}</p><strong>{money(summary.profit)}</strong></article>
        <article className="own"><span><Coffee size={19} /></span><p>{t('adminOperations.dashboard.ownBalance')}</p><strong>{money(summary.ownBalance)}</strong><small>{t('adminOperations.dashboard.ownMeta', { count: summary.ownOrderCount })}</small></article>
      </section>
      <section className="admin-history-section">
        <div className="admin-history-heading"><div><BarChart3 size={20} /><h2>{t('adminOperations.dashboard.historyTitle')}</h2></div><span>{t('adminOperations.dashboard.historyNote')}</span></div>
        {history.length ? <div className="admin-history-table-wrap"><table><thead><tr><th>{t('adminOperations.dashboard.table.room')}</th><th>{t('adminOperations.dashboard.table.products')}</th><th>{t('adminOperations.dashboard.table.payment')}</th><th>{t('adminOperations.dashboard.table.amount')}</th><th>{t('adminOperations.dashboard.table.deliveredAt')}</th></tr></thead><tbody>{history.map((order) => <tr key={order._id}><td>{roomLabel(order)}</td><td>{order.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')}</td><td>{paymentLabel(order.paymentMethod)}</td><td>{money(order.totalRevenue)}</td><td>{new Date(order.deliveredAt).toLocaleString(locale)}</td></tr>)}</tbody></table></div> : <div className="admin-history-empty">{t('adminOperations.dashboard.emptyHistory')}</div>}
      </section>
    </>}
  </div>;
};

export default Dashboard;
