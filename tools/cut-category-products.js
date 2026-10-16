const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const MOTION = path.join(__dirname, '..', 'frontend', 'public', 'category-motion');
const OUT = path.join(MOTION, 'cut');

const SOURCES = {
  kahveler: 'kahve-1.png',
  'ana-yemekler': 'burger-1.png',
  'ara-sicaklar': 'starter-1.png',
  'tatli-meyve': 'dessert-1.png',
  icecekler: 'drink-1.png',
  kahvaltilar: 'breakfast-1.png'
};

(async () => {
  const { removeBackground } = await import('@imgly/background-removal-node');
  fs.mkdirSync(OUT, { recursive: true });

  for (const [name, file] of Object.entries(SOURCES)) {
    const input = path.join(MOTION, file);
    console.log('cut', file);
    const source = fs.readFileSync(input);
    const cut = await removeBackground(new Blob([source], { type: 'image/png' }), {
      output: { format: 'image/png', quality: 0.92 }
    });
    const png = Buffer.from(await cut.arrayBuffer());
    const trimmed = await sharp(png)
      .trim({ threshold: 12 })
      .resize({ width: 720, height: 520, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90, alphaQuality: 95, effort: 5 })
      .toBuffer();
    const dest = path.join(OUT, `${name}.webp`);
    fs.writeFileSync(dest, trimmed);
    console.log('wrote', path.basename(dest), `${(trimmed.length / 1024).toFixed(0)}KB`);
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
