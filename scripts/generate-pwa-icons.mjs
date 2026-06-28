// Genere les icones PWA carrees (192/512 + maskable) a partir de l'embleme TogoSaaS.
// Usage : node scripts/generate-pwa-icons.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const src = resolve(root, 'public/togosaas-emblem.png');
const out = resolve(root, 'public');

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

async function standard(size) {
  const file = resolve(out, `pwa-${size}x${size}.png`);
  await sharp(src)
    .resize(size, size, { fit: 'contain', background: WHITE })
    .flatten({ background: WHITE })
    .png()
    .toFile(file);
  console.log('  +', `pwa-${size}x${size}.png`);
}

async function maskable(size) {
  // Zone de securite maskable : on garde l'embleme dans ~70% du cadre.
  const inner = Math.round(size * 0.7);
  const pad = Math.round((size - inner) / 2);
  const file = resolve(out, `pwa-maskable-${size}x${size}.png`);

  const emblem = await sharp(src)
    .resize(inner, inner, { fit: 'contain', background: WHITE })
    .flatten({ background: WHITE })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: WHITE },
  })
    .composite([{ input: emblem, top: pad, left: pad }])
    .png()
    .toFile(file);
  console.log('  +', `pwa-maskable-${size}x${size}.png`);
}

console.log('==> Generation des icones PWA');
await standard(192);
await standard(512);
await maskable(192);
await maskable(512);
console.log('Termine.');
