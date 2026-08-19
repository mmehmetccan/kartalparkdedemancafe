const crypto = require('crypto');
const { getPool } = require('../config/db');
const { normalizeProductPayload } = require('../config/menuCategories');
const { mapProduct } = require('../utils/apiShape');

const createId = () => crypto.randomUUID();

const serializeProduct = (payload) => {
    const normalized = normalizeProductPayload(payload);
    return {
        id: payload.id || createId(),
        name: normalized.name,
        category: normalized.category,
        menuSection: normalized.menuSection || null,
        menuSubsection: normalized.menuSubsection || null,
        description: normalized.description || '',
        intensity: normalized.intensity ?? null,
        sellingPrice: normalized.sellingPrice,
        costPrice: normalized.costPrice,
        imageUrl: normalized.imageUrl || '',
        translations: JSON.stringify(normalized.translations || {}),
        isAvailable: normalized.isAvailable !== false ? 1 : 0
    };
};

const findAll = async () => {
    const [rows] = await getPool().query(
        `SELECT * FROM products
         ORDER BY menu_section ASC, menu_subsection ASC, name ASC`
    );
    return rows.map(mapProduct);
};

const findAvailable = async () => {
    const [rows] = await getPool().query(
        `SELECT id, name, category, menu_section, menu_subsection, description, intensity,
                selling_price, cost_price, image_url, translations, created_at, updated_at
         FROM products
         WHERE is_available = 1
         ORDER BY menu_section ASC, menu_subsection ASC, name ASC`
    );
    return rows.map(mapProduct);
};

const findByIds = async (ids, { availableOnly = false } = {}) => {
    if (!ids.length) return [];
    const placeholders = ids.map(() => '?').join(', ');
    const availabilityClause = availableOnly ? ' AND is_available = 1' : '';
    const [rows] = await getPool().query(
        `SELECT * FROM products WHERE id IN (${placeholders})${availabilityClause}`,
        ids
    );
    return rows.map(mapProduct);
};

const findById = async (id) => {
    const [rows] = await getPool().query('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
    return mapProduct(rows[0]);
};

const create = async (payload) => {
    const product = serializeProduct(payload);
    await getPool().query(
        `INSERT INTO products
         (id, name, category, menu_section, menu_subsection, description, intensity,
          selling_price, cost_price, image_url, translations, is_available)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            product.id,
            product.name,
            product.category,
            product.menuSection,
            product.menuSubsection,
            product.description,
            product.intensity,
            product.sellingPrice,
            product.costPrice,
            product.imageUrl,
            product.translations,
            product.isAvailable
        ]
    );
    return findById(product.id);
};

const update = async (id, payload) => {
    const product = serializeProduct({ ...payload, id });
    const [result] = await getPool().query(
        `UPDATE products SET
           name = ?, category = ?, menu_section = ?, menu_subsection = ?, description = ?,
           intensity = ?, selling_price = ?, cost_price = ?, image_url = ?, translations = ?,
           is_available = ?
         WHERE id = ?`,
        [
            product.name,
            product.category,
            product.menuSection,
            product.menuSubsection,
            product.description,
            product.intensity,
            product.sellingPrice,
            product.costPrice,
            product.imageUrl,
            product.translations,
            product.isAvailable,
            id
        ]
    );
    if (!result.affectedRows) return null;
    return findById(id);
};

const remove = async (id) => {
    const [result] = await getPool().query('DELETE FROM products WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

const findByName = async (name) => {
    const [rows] = await getPool().query('SELECT * FROM products WHERE name = ? LIMIT 1', [name]);
    return mapProduct(rows[0]);
};

module.exports = {
    findAll,
    findAvailable,
    findByIds,
    findById,
    findByName,
    create,
    update,
    remove
};
