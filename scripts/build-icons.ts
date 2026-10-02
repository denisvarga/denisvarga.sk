import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const SOURCE = 'public/favicon.svg';
const OUT = 'public/apple-touch-icon.png';
const SIZE = 180;
const BACKGROUND = '#ECECE9';

const svg = await readFile(SOURCE).catch(() => {
  throw new Error(`Favicon source missing: ${SOURCE}`);
});

// Rasterise well above the target size so the downscale keeps the glyph edges crisp.
const info = await sharp(svg, { density: 72 * Math.ceil((SIZE * 4) / 64) })
  .resize(SIZE, SIZE)
  .flatten({ background: BACKGROUND })
  .png({ compressionLevel: 9 })
  .toFile(OUT);

console.log(`${OUT}: ${info.width}x${info.height}, ${(info.size / 1024).toFixed(1)} KB`);
