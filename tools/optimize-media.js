const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const sharp = require('sharp');
const ffmpegPath = require('ffmpeg-static');

const PUBLIC = path.join(__dirname, '..', 'frontend', 'public');
const UPLOADS = path.join(__dirname, '..', 'backend', 'uploads', 'products');
const MOTION = path.join(PUBLIC, 'category-motion');

const STILL_TARGETS = [
  { file: 'park-dedeman-lobby.png', width: 1600, quality: 72 },
  { file: 'park-dedeman-entrance.png', width: 1600, quality: 72 },
  { file: 'park-dedeman-exterior.png', width: 1400, quality: 68 },
  { file: 'park-dedeman-reception.png', width: 1400, quality: 70 },
  { file: 'park-dedeman-mobile.png', width: 900, quality: 72 },
  { file: 'park-dedeman-header-logo.png', width: 240, quality: 82 },
  { file: 'park-dedeman-logo.jpg', width: 240, quality: 82 },
  { file: 'park-dedeman-login-logo.jpg', width: 240, quality: 82 },
  { file: 'coffee-bean-cluster-v1.png', width: 320, quality: 70 },
  { file: 'coffee-bean-add-badge-v1.png', width: 240, quality: 70 }
];

const PRODUCT_JPGS = [
  'espresso.jpg',
  'americano.jpg',
  'cappuccino.jpg',
  'latte.jpg',
  'turk-kahvesi.jpg',
  'iced-latte.jpg'
];

const CATEGORY_REELS = {
  kahveler: ['kahve-1.png', 'kahve-2.png', 'kahve-3.png'],
  'ana-yemekler': ['burger-1.png', 'burger-2.png', 'burger-3.png'],
  'ara-sicaklar': ['starter-1.png', 'starter-2.png'],
  'tatli-meyve': ['dessert-1.png', 'dessert-2.png'],
  icecekler: ['drink-1.png', 'drink-2.png'],
  kahvaltilar: ['breakfast-1.png', 'breakfast-2.png']
};

const runFfmpeg = (args) => {
  const result = spawnSync(ffmpegPath, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed: ${args.join(' ')}`);
  }
};

const writeWebp = async (inputPath, outputPath, { width, quality }) => {
  await sharp(inputPath)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 5 })
    .toFile(outputPath);
  const before = fs.statSync(inputPath).size;
  const after = fs.statSync(outputPath).size;
  console.log(`${path.basename(outputPath)}  ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`);
};

const pingPong = (files) => (files.length > 1 ? [...files, ...files.slice(1, -1).reverse()] : files);

(async () => {
  for (const target of STILL_TARGETS) {
    const input = path.join(PUBLIC, target.file);
    if (!fs.existsSync(input)) continue;
    const output = path.join(PUBLIC, target.file.replace(/\.(png|jpe?g)$/i, '.webp'));
    await writeWebp(input, output, target);
  }

  for (const file of PRODUCT_JPGS) {
    const input = path.join(PUBLIC, 'menu-products', file);
    if (!fs.existsSync(input)) continue;
    await writeWebp(input, input.replace(/\.jpg$/i, '.webp'), { width: 900, quality: 74 });
  }

  if (fs.existsSync(UPLOADS)) {
    for (const file of fs.readdirSync(UPLOADS)) {
      if (!/\.(png|jpe?g)$/i.test(file)) continue;
      const input = path.join(UPLOADS, file);
      await writeWebp(input, input.replace(/\.(png|jpe?g)$/i, '.webp'), { width: 1200, quality: 74 });
    }
  }

  const work = path.join(MOTION, '_frames');
  fs.mkdirSync(work, { recursive: true });

  for (const [category, frames] of Object.entries(CATEGORY_REELS)) {
    const sequence = pingPong(frames);
    const prepared = [];
    for (let index = 0; index < sequence.length; index += 1) {
      const source = path.join(MOTION, sequence[index]);
      if (!fs.existsSync(source)) {
        throw new Error(`Eksik kare: ${source}`);
      }
      const framePath = path.join(work, `${category}-${String(index + 1).padStart(2, '0')}.png`);
      await sharp(source)
        .resize(360, 220, { fit: 'cover', position: 'centre' })
        .png()
        .toFile(framePath);
      prepared.push(framePath);
    }

    const stillPath = path.join(MOTION, `${category}-still.webp`);
    await sharp(path.join(MOTION, frames[frames.length - 1]))
      .resize(360, 220, { fit: 'cover', position: 'centre' })
      .webp({ quality: 72, effort: 5 })
      .toFile(stillPath);

    const listFile = path.join(work, `${category}.txt`);
    fs.writeFileSync(
      listFile,
      prepared.map((frame) => `file '${frame.replace(/\\/g, '/')}'\nduration 0.14`).join('\n') + `\nfile '${prepared[prepared.length - 1].replace(/\\/g, '/')}'\n`
    );

    const output = path.join(MOTION, `${category}.webp`);
    runFfmpeg([
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', listFile,
      '-an',
      '-vsync', 'vfr',
      '-c:v', 'libwebp',
      '-lossless', '0',
      '-q:v', '68',
      '-compression_level', '4',
      '-loop', '0',
      output
    ]);
    console.log(`${category}.webp  ${(fs.statSync(output).size / 1024).toFixed(0)}KB`);
  }

  fs.rmSync(work, { recursive: true, force: true });
  console.log('done');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
