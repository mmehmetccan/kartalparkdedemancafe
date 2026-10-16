const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const catalog = require('../backend/data/menuProductCatalog.json');

const root = path.join(__dirname, '..');
const sourceDirectory = path.join(root, 'output', 'menu-product-assets', '2026-10-14-v1');
const previewDirectory = path.join(root, 'output', 'menu-product-previews', '2026-10-14-v1');
const productDirectory = path.join(root, 'frontend', 'public', 'menu-products');
const motionDirectory = path.join(productDirectory, 'motion');
const bundledMotionDirectory = path.join(root, 'frontend', 'src', 'assets', 'product-motion');

// Yalnızca boyut/format optimizasyonu; üretilmiş alfa ve tam kadraj korunur.
const prepareMenuProducts = async () => {
  fs.mkdirSync(motionDirectory, { recursive: true });
  fs.mkdirSync(bundledMotionDirectory, { recursive: true });
  for (const product of catalog) {
    const cutoutSource = path.join(sourceDirectory, `${product.slug}-cutout.png`);
    const preview = path.join(previewDirectory, `${product.slug}-v1.png`);
    const imageSource = fs.existsSync(preview) ? preview : cutoutSource;
    const metadata = await sharp(cutoutSource).metadata();
    if (!metadata.hasAlpha) throw new Error(`Şeffaf ürün katmanı bekleniyor: ${product.slug}`);
    await sharp(imageSource)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80, alphaQuality: 90, effort: 5 })
      .toFile(path.join(productDirectory, `${product.slug}.webp`));
    const cutout = path.join(motionDirectory, `${product.slug}-cutout.webp`);
    await sharp(cutoutSource)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80, alphaQuality: 90, effort: 5 })
      .toFile(cutout);
    fs.copyFileSync(cutout, path.join(bundledMotionDirectory, `${product.slug}-cutout.webp`));
    console.log(`${product.name}: ${(fs.statSync(cutout).size / 1024).toFixed(0)} KB`);
  }
};

if (require.main === module) {
  prepareMenuProducts().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { prepareMenuProducts };
