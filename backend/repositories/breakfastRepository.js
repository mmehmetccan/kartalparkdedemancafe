const crypto = require('crypto');
const { getPool } = require('../config/db');
const { mapBreakfast } = require('../utils/apiShape');

const createId = () => crypto.randomUUID();

const createMany = async (records) => {
    if (!records.length) return [];
    const connection = await getPool().getConnection();
    try {
        await connection.beginTransaction();
        const created = [];
        for (const record of records) {
            const id = createId();
            await connection.query(
                `INSERT INTO breakfasts
                 (id, room_number, note, guest_count, requested_time, scheduled_date, plan_id, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'Bekliyor')`,
                [
                    id,
                    record.roomNumber,
                    record.note || '',
                    record.guestCount,
                    record.requestedTime,
                    record.scheduledDate,
                    record.planId || null
                ]
            );
            created.push(id);
        }
        await connection.commit();
        return findByIds(created);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const findById = async (id) => {
    const [rows] = await getPool().query('SELECT * FROM breakfasts WHERE id = ? LIMIT 1', [id]);
    return mapBreakfast(rows[0]);
};

const findByIds = async (ids) => {
    if (!ids.length) return [];
    const placeholders = ids.map(() => '?').join(', ');
    const [rows] = await getPool().query(
        `SELECT * FROM breakfasts WHERE id IN (${placeholders}) ORDER BY scheduled_date ASC, requested_time ASC`,
        ids
    );
    return rows.map(mapBreakfast);
};

const findActive = async (date) => {
    const [rows] = await getPool().query(
        `SELECT * FROM breakfasts
         WHERE status = 'Bekliyor' AND scheduled_date <= ?
         ORDER BY requested_time ASC, created_at ASC`,
        [date]
    );
    return rows.map(mapBreakfast);
};

const updatePending = async (id, payload) => {
    const [result] = await getPool().query(
        `UPDATE breakfasts SET
           room_number = ?, note = ?, guest_count = ?, requested_time = ?, scheduled_date = ?
         WHERE id = ? AND status = 'Bekliyor'`,
        [
            payload.roomNumber,
            payload.note || '',
            payload.guestCount,
            payload.requestedTime,
            payload.scheduledDate,
            id
        ]
    );
    if (!result.affectedRows) return null;
    return findById(id);
};

const deliverPending = async (id) => {
    const [result] = await getPool().query(
        `UPDATE breakfasts SET status = 'Teslim Edildi', delivered_at = UTC_TIMESTAMP()
         WHERE id = ? AND status = 'Bekliyor'`,
        [id]
    );
    if (!result.affectedRows) return null;
    return findById(id);
};

const findHistory = async (startDate, endDate) => {
    const [rows] = await getPool().query(
        `SELECT * FROM breakfasts
         WHERE status IN ('Teslim Edildi', 'İptal Edildi')
           AND scheduled_date >= ? AND scheduled_date <= ?
         ORDER BY scheduled_date DESC, requested_time DESC`,
        [startDate, endDate]
    );
    return rows.map(mapBreakfast);
};

const cancelOverdue = async ({ date, hour, now = new Date() }) => {
    const comparison = hour >= 14 ? '<=' : '<';
    const [result] = await getPool().query(
        `UPDATE breakfasts SET
           status = 'İptal Edildi',
           cancelled_at = ?,
           cancellation_reason = '14:00 teslim süresi geçtiği için otomatik iptal edildi.'
         WHERE status = 'Bekliyor' AND scheduled_date ${comparison} ?`,
        [now, date]
    );
    return result.affectedRows;
};

module.exports = {
    createMany,
    findById,
    findActive,
    updatePending,
    deliverPending,
    findHistory,
    cancelOverdue
};
