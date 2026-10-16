const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
const { connectDB, getPool } = require('../config/db');
const { normalizeProductPayload } = require('../config/menuCategories');
const catalog = require('../data/menuProductCatalog.json');

// Yalnızca eksik örnek ürünler eklenir; mevcut kayıt ve fiyatlar korunur.
const seedMenuProducts = async ({ dryRun = false } = {}) => {
    const publicDirectory = path.join(__dirname, '..', '..', 'frontend', 'public');
    for (const product of catalog) {
        for (const asset of [product.imageUrl, `menu-products/motion/${product.slug}-cutout.webp`]) {
            if (!fs.existsSync(path.join(publicDirectory, asset))) {
                throw new Error(`Ürün görseli eksik: ${asset}`);
            }
        }
    }

    await connectDB();
    const pool = getPool();
    let connection;
    let locked = false;
    let created = 0;
    let skipped = 0;
    try {
        connection = await pool.getConnection();
        const [[lock]] = await connection.query("SELECT GET_LOCK('dedeman_menu_catalog_seed', 10) AS acquired");
        if (Number(lock.acquired) !== 1) throw new Error('Başka bir ürün ekleme işlemi sürüyor.');
        locked = true;
        await connection.beginTransaction();
        for (const item of catalog) {
            const [[existing]] = await connection.query('SELECT id FROM products WHERE name = ? LIMIT 1', [item.name]);
            if (existing) {
                skipped += 1;
                console.log(`Korundu: ${item.name}`);
                continue;
            }
            const product = normalizeProductPayload(item);
            if (!dryRun) {
                await connection.query(
                    `INSERT INTO products
                     (id, name, category, menu_section, menu_subsection, description, intensity,
                      selling_price, cost_price, image_url, translations, is_available)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [crypto.randomUUID(), product.name, product.category, product.menuSection,
                        product.menuSubsection, product.description, product.intensity,
                        product.sellingPrice, product.costPrice, product.imageUrl,
                        JSON.stringify(product.translations), 1]
                );
            }
            created += 1;
            console.log(`${dryRun ? 'Eklenecek' : 'Eklendi'}: ${product.name} (${product.sellingPrice} TL)`);
        }
        if (dryRun) await connection.rollback();
        else await connection.commit();
        console.log(`${dryRun ? 'Önizleme' : 'Tamamlandı'}: ${created} yeni ürün, ${skipped} mevcut ürün korundu.`);
        return { created, skipped };
    } catch (error) {
        if (connection) await connection.rollback();
        throw error;
    } finally {
        if (locked) await connection.query("SELECT RELEASE_LOCK('dedeman_menu_catalog_seed')");
        if (connection) connection.release();
        await pool.end();
    }
};

if (require.main === module) {
    seedMenuProducts({ dryRun: process.argv.includes('--dry-run') }).catch((error) => {
        console.error(`Menü ürünleri eklenemedi: ${error.message}`);
        process.exitCode = 1;
    });
}

module.exports = { seedMenuProducts };
