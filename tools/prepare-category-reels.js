const path = require('path');
const sharp = require('sharp');

const PUBLIC = path.join(__dirname, '..', 'frontend', 'public');
const MOTION = path.join(PUBLIC, 'category-motion');

const REEL_FRAMES = [
  'kahve-1.png',
  'kahve-2.png',
  'kahve-3.png',
  'burger-1.png',
  'burger-2.png',
  'burger-3.png',
  'starter-1.png',
  'starter-2.png',
  'dessert-1.png',
  'dessert-2.png',
  'drink-1.png',
  'drink-2.png',
  'breakfast-1.png',
  'breakfast-2.png'
];

(async () => {
  const logo = path.join(PUBLIC, 'park-dedeman-header-logo.png');
  await sharp(logo)
    .extract({ left: 78, top: 168, width: 348, height: 132 })
    .resize({ width: 696, height: 264 })
    .webp({ quality: 92, effort: 5 })
    .toFile(path.join(PUBLIC, 'park-dedeman-header-lockup.webp'));
  console.log('wrote park-dedeman-header-lockup.webp');

  for (const file of REEL_FRAMES) {
    const input = path.join(MOTION, file);
    const output = input.replace(/\.png$/i, '.webp');
    await sharp(input)
      .rotate()
      .resize({ width: 640, height: 400, fit: 'cover', position: 'centre' })
      .webp({ quality: 74, effort: 5 })
      .toFile(output);
    console.log(path.basename(output));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
