const crypto = require('crypto');
const { getPool } = require('../config/db');
const { createPasswordHash, verifyPassword } = require('../utils/password');
const { mapUser } = require('../utils/apiShape');

const createId = () => crypto.randomUUID();

const findById = async (id, { includePassword = false } = {}) => {
    const [rows] = await getPool().query(
        `SELECT id, username, password, role, created_at, updated_at
         FROM users WHERE id = ? LIMIT 1`,
        [id]
    );
    return mapUser(rows[0], { includePassword });
};

const findByUsername = async (username, { includePassword = false } = {}) => {
    const [rows] = await getPool().query(
        `SELECT id, username, password, role, created_at, updated_at
         FROM users WHERE username = ? LIMIT 1`,
        [username]
    );
    return mapUser(rows[0], { includePassword });
};

const findAll = async () => {
    const [rows] = await getPool().query(
        `SELECT id, username, role, created_at, updated_at
         FROM users ORDER BY username ASC`
    );
    return rows.map((row) => mapUser(row));
};

const countByRole = async (role) => {
    const [rows] = await getPool().query(
        'SELECT COUNT(*) AS total FROM users WHERE role = ?',
        [role]
    );
    return Number(rows[0]?.total || 0);
};

const create = async ({ username, password, role = 'admin' }) => {
    const id = createId();
    const passwordHash = createPasswordHash(password);
    await getPool().query(
        `INSERT INTO users (id, username, password, role)
         VALUES (?, ?, ?, ?)`,
        [id, username, passwordHash, role]
    );
    return findById(id);
};

const updatePassword = async (id, password) => {
    const passwordHash = createPasswordHash(password);
    const [result] = await getPool().query(
        'UPDATE users SET password = ? WHERE id = ?',
        [passwordHash, id]
    );
    return result.affectedRows > 0;
};

const upsertAdmin = async ({ username, password, role = 'admin' }) => {
    const existing = await findByUsername(username, { includePassword: true });
    if (existing) {
        await updatePassword(existing.id, password);
        return findById(existing.id);
    }
    return create({ username, password, role });
};

const remove = async (id) => {
    const [result] = await getPool().query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

const matchPassword = (user, enteredPassword) => verifyPassword(enteredPassword, user?.password);

module.exports = {
    findById,
    findByUsername,
    findAll,
    countByRole,
    create,
    updatePassword,
    upsertAdmin,
    remove,
    matchPassword
};
