const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const MOTION = path.join(__dirname, '..', 'frontend', 'public', 'category-motion');
const OUT = path.join(MOTION, 'cut');
const JOBS = [
  ['kahveler', 'kahve-2.png'],
  ['tatli-meyve', 'dessert-2.png'],
  ['kahvaltilar', 'breakfast-2.png']
];

(async () => {
  const { pipeline, RawImage } = await import('@huggingface/transformers');
  const remover = await pipeline('background-removal', 'Xenova/modnet');
  fs.mkdirSync(OUT, { recursive: true });

  for (const [name, file] of JOBS) {
    const { data, info } = await sharp(path.join(MOTION, file))
      .rotate()
      .resize({ width: 768, withoutEnlargement: true })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const image = new RawImage(new Uint8ClampedArray(data), info.width, info.height, 3);
    console.log('cut', file);
    const result = await remover(image);
    const outputImage = Array.isArray(result) ? result[0] : result;
    const rgba = outputImage.rgba ? outputImage.rgba() : outputImage;
    const webp = await sharp(Buffer.from(rgba.data), {
      raw: { width: rgba.width, height: rgba.height, channels: rgba.channels }
    })
      .trim({ threshold: 8 })
      .webp({ quality: 90, alphaQuality: 95, effort: 5 })
      .toBuffer();
    fs.writeFileSync(path.join(OUT, `${name}.webp`), webp);
    console.log('wrote', `${name}.webp`, `${(webp.length / 1024).toFixed(0)}KB`);
  }

  const pot = path.join(MOTION, 'live-kahve-pot.png');
  if (fs.existsSync(pot)) {
    const { data, info } = await sharp(pot).ensureAlpha().resize({ width: 420 }).raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      if (lum < 18) data[i + 3] = 0;
    }
    const potWebp = await sharp(data, { raw: info })
      .trim({ threshold: 6 })
      .webp({ quality: 90, alphaQuality: 95, effort: 5 })
      .toBuffer();
    fs.writeFileSync(path.join(OUT, 'kahve-pot.webp'), potWebp);
    console.log('wrote kahve-pot.webp', `${(potWebp.length / 1024).toFixed(0)}KB`);
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
