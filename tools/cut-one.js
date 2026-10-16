const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  const { removeBackground } = await import('@imgly/background-removal-node');
  const input = path.join(__dirname, '..', 'frontend', 'public', 'category-motion', 'kahve-1.png');
  const source = fs.readFileSync(input);
  console.log('loaded', source.length);
  const cut = await removeBackground(new Blob([source], { type: 'image/png' }));
  const out = path.join(__dirname, '..', 'frontend', 'public', 'category-motion', 'cut');
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'kahveler.png'), Buffer.from(await cut.arrayBuffer()));
  console.log('ok');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
