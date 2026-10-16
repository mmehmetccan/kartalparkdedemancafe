require(require('path').join(__dirname, '..', 'backend', 'node_modules', 'dotenv')).config({
  path: require('path').join(__dirname, '..', 'backend', '.env')
});
const { connectDB, getPool } = require('../backend/config/db');
const { normalizeProductImagePath } = require('../backend/utils/imagePath');

(async () => {
  await connectDB();
  const pool = getPool();
  const [rows] = await pool.query('SELECT id, name, image_url FROM products ORDER BY name');
  let updated = 0;
  for (const row of rows) {
    const next = normalizeProductImagePath(row.image_url || '');
    if (next !== String(row.image_url || '')) {
      await pool.query('UPDATE products SET image_url = ? WHERE id = ?', [next, row.id]);
      updated += 1;
      console.log(`${row.name}: ${row.image_url} -> ${next}`);
    } else {
      console.log(`${row.name}: ${row.image_url || '(boş)'}`);
    }
  }
  console.log(`updated ${updated}/${rows.length}`);
  await pool.end();
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
