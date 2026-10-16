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

const luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const saturation = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b);

const isBackground = (r, g, b) => {
  const lum = luminance(r, g, b);
  const sat = saturation(r, g, b);
  const max = Math.max(r, g, b);
  if (lum < 38 && sat < 48) return true;
  if (lum < 58 && sat < 22) return true;
  if (lum < 72 && r < 92 && g < 78 && b < 68 && sat < 28) return true;
  if (max < 32) return true;
  return false;
};

const cutImage = async (inputPath) => {
  const resized = await sharp(inputPath)
    .rotate()
    .resize({ width: 900, withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = resized;
  const { width, height } = info;
  const visited = new Uint8Array(width * height);
  const stack = [];

  const tryPush = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p]) return;
    const i = p * 4;
    if (!isBackground(data[i], data[i + 1], data[i + 2])) return;
    visited[p] = 1;
    stack.push(p);
  };

  for (let x = 0; x < width; x += 1) {
    tryPush(x, 0);
    tryPush(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    tryPush(0, y);
    tryPush(width - 1, y);
  }

  while (stack.length) {
    const p = stack.pop();
    const x = p % width;
    const y = (p - x) / width;
    tryPush(x + 1, y);
    tryPush(x - 1, y);
    tryPush(x, y + 1);
    tryPush(x, y - 1);
  }

  const grow = visited.slice();
  for (let pass = 0; pass < 2; pass += 1) {
    const next = grow.slice();
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const p = y * width + x;
        if (grow[p]) continue;
        if (grow[p - 1] || grow[p + 1] || grow[p - width] || grow[p + width]) next[p] = 1;
      }
    }
    grow.set(next);
  }

  for (let p = 0; p < visited.length; p += 1) {
    const i = p * 4;
    if (visited[p]) {
      data[i + 3] = 0;
      continue;
    }
    if (grow[p]) {
      data[i + 3] = Math.round(data[i + 3] * 0.28);
    }
  }

  return sharp(data, { raw: { width, height, channels: 4 } })
    .trim({ threshold: 8 })
    .webp({ quality: 90, alphaQuality: 95, effort: 5 })
    .toBuffer();
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [name, file] of Object.entries(SOURCES)) {
    const input = path.join(MOTION, file);
    console.log('cut', file);
    const output = await cutImage(input);
    fs.writeFileSync(path.join(OUT, `${name}.webp`), output);
    console.log('wrote', `${name}.webp`, `${(output.length / 1024).toFixed(0)}KB`);
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
