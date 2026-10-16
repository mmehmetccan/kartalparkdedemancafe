/**
 * public/menu-products içindeki orijinal PNG fotoğrafları JPG olarak yazar
 * ve kahve ürünlerinin image_url alanını veritabanına kaydeder.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { connectDB, getPool } = require('../backend/config/db');
const productRepository = require('../backend/repositories/productRepository');

const PRODUCTS_DIR = path.join(__dirname, '..', 'frontend', 'public', 'menu-products');

const CATALOG_IMAGES = {
  Espresso: { png: 'espresso-v1.png', jpg: 'espresso.jpg' },
  Americano: { png: 'americano-v1.png', jpg: 'americano.jpg' },
  Cappuccino: { png: 'cappuccino-v1.png', jpg: 'cappuccino.jpg' },
  Latte: { png: 'latte-v1.png', jpg: 'latte.jpg' },
  'Türk Kahvesi': { png: 'turk-kahvesi-v1.png', jpg: 'turk-kahvesi.jpg' },
  'Iced Latte': { png: 'iced-latte-v1.png', jpg: 'iced-latte.jpg' }
};

const restoreJpegsFromPng = async () => {
  for (const files of Object.values(CATALOG_IMAGES)) {
    const png = path.join(PRODUCTS_DIR, files.png);
    const jpg = path.join(PRODUCTS_DIR, files.jpg);
    if (!fs.existsSync(png)) {
      throw new Error(`Orijinal görsel bulunamadı: ${png}`);
    }
    await sharp(png).jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toFile(jpg);
    console.log(`Logosuz yazıldı: ${path.basename(jpg)}`);
  }

  for (const stale of fs.readdirSync(PRODUCTS_DIR).filter((file) => file.endsWith('-v1.jpg'))) {
    fs.unlinkSync(path.join(PRODUCTS_DIR, stale));
    console.log(`Eski logolu dosya silindi: ${stale}`);
  }
};

const syncDatabase = async () => {
  await connectDB();
  const pool = getPool();
  for (const [name, files] of Object.entries(CATALOG_IMAGES)) {
    const imageUrl = `menu-products/${files.jpg.replace(/\.jpg$/i, '.webp')}`;
    const [result] = await pool.query(
      'UPDATE products SET image_url = ? WHERE name = ?',
      [imageUrl, name]
    );
    if (!result.affectedRows) {
      console.log(`Atlandı (ürün yok): ${name}`);
      continue;
    }
    console.log(`Veritabanı: ${name} -> ${imageUrl}`);
  }

  const products = await productRepository.findAll();
  console.log('\nTüm ürün görselleri:');
  products.forEach((product) => {
    console.log(`- ${product.name}: ${product.imageUrl || '(boş)'}`);
  });
  await pool.end();
};

(async () => {
  await restoreJpegsFromPng();
  await syncDatabase();
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
