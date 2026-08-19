const crypto = require('crypto');
const { getPool } = require('../config/db');
const { mapOrder } = require('../utils/apiShape');

const createId = () => crypto.randomUUID();

const create = async (payload) => {
    const id = createId();
    await getPool().query(
        `INSERT INTO orders
         (id, room_number, is_own_order, items, payment_method, status,
          total_revenue, total_cost, total_profit)
         VALUES (?, ?, ?, ?, ?, 'Bekliyor', ?, ?, ?)`,
        [
            id,
            payload.roomNumber,
            payload.isOwnOrder ? 1 : 0,
            JSON.stringify(payload.items),
            payload.paymentMethod,
            payload.totalRevenue,
            payload.totalCost,
            payload.totalProfit
        ]
    );
    return findById(id);
};

const findById = async (id) => {
    const [rows] = await getPool().query('SELECT * FROM orders WHERE id = ? LIMIT 1', [id]);
    return mapOrder(rows[0]);
};

const findActive = async () => {
    const [rows] = await getPool().query(
        `SELECT * FROM orders WHERE status = 'Bekliyor' ORDER BY created_at ASC`
    );
    return rows.map(mapOrder);
};

const findDeliveredHistory = async (start, end) => {
    const [rows] = await getPool().query(
        `SELECT * FROM orders
         WHERE status = 'Teslim Edildi' AND delivered_at >= ? AND delivered_at < ?
         ORDER BY delivered_at DESC`,
        [start, end]
    );
    return rows.map(mapOrder);
};

const getSummary = async (start, end) => {
    const [rows] = await getPool().query(
        `SELECT
           SUM(CASE WHEN is_own_order = 0 THEN 1 ELSE 0 END) AS orderCount,
           SUM(CASE WHEN is_own_order = 0 THEN total_revenue ELSE 0 END) AS revenue,
           SUM(CASE WHEN is_own_order = 0 THEN total_cost ELSE 0 END) AS cost,
           SUM(CASE WHEN is_own_order = 0 THEN total_profit ELSE 0 END) AS profit,
           SUM(CASE WHEN is_own_order = 1 THEN 1 ELSE 0 END) AS ownOrderCount,
           SUM(CASE WHEN is_own_order = 1 THEN total_revenue ELSE 0 END) AS ownBalance
         FROM orders
         WHERE status = 'Teslim Edildi' AND delivered_at >= ? AND delivered_at < ?`,
        [start, end]
    );

    const summary = rows[0] || {};
    return {
        orderCount: Number(summary.orderCount || 0),
        revenue: Number(summary.revenue || 0),
        cost: Number(summary.cost || 0),
        profit: Number(summary.profit || 0),
        ownOrderCount: Number(summary.ownOrderCount || 0),
        ownBalance: Number(summary.ownBalance || 0)
    };
};

const deliverPending = async (id) => {
    const [result] = await getPool().query(
        `UPDATE orders SET status = 'Teslim Edildi', delivered_at = UTC_TIMESTAMP()
         WHERE id = ? AND status = 'Bekliyor'`,
        [id]
    );
    if (!result.affectedRows) return null;
    return findById(id);
};

const cancelPending = async (id) => {
    const [result] = await getPool().query(
        `UPDATE orders SET status = 'İptal Edildi', cancelled_at = UTC_TIMESTAMP()
         WHERE id = ? AND status = 'Bekliyor'`,
        [id]
    );
    if (!result.affectedRows) return null;
    return findById(id);
};

module.exports = {
    create,
    findById,
    findActive,
    findDeliveredHistory,
    getSummary,
    deliverPending,
    cancelPending
};
