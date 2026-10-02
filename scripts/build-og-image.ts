import { stat } from 'node:fs/promises';
import sharp from 'sharp';

// Same master as scripts/build-images.ts; design/ is local-only, so run this before publishing.
const SOURCE = 'design/assets/denis-cutout-solid.png';
const OUT = 'public/og-image.jpg';
const WIDTH = 1200;
const HEIGHT = 630;
const BACKGROUND = '#ECECE9';

await stat(SOURCE).catch(() => {
  throw new Error(`Hero source missing: ${SOURCE}`);
});

const cutout = await sharp(SOURCE).resize({ height: HEIGHT, fit: 'inside' }).png().toBuffer();
const { width: cutoutWidth = 0 } = await sharp(cutout).metadata();

const info = await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 3, background: BACKGROUND } })
  .composite([{ input: cutout, top: 0, left: WIDTH - cutoutWidth }])
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile(OUT);

console.log(`${OUT}: ${info.width}x${info.height}, ${(info.size / 1024).toFixed(1)} KB`);
