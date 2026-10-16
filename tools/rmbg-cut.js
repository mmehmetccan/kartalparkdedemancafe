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
  const { pipeline, RawImage } = await import('@huggingface/transformers');
  console.log('loading background-removal model...');
  const remover = await pipeline('background-removal', 'Xenova/modnet');
  fs.mkdirSync(OUT, { recursive: true });

  for (const [name, file] of Object.entries(SOURCES)) {
    const input = path.join(MOTION, file);
    const { data, info } = await sharp(input)
      .rotate()
      .resize({ width: 768, withoutEnlargement: true })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const image = new RawImage(new Uint8ClampedArray(data), info.width, info.height, 3);
    console.log('cut', file, info.width, info.height);
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
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
