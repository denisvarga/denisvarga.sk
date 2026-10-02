import { mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const SOURCE = 'design/assets/denis-cutout-solid.png';
const OUT_DIR = 'src/assets/hero';
const WIDTHS = [640, 1024] as const;
const MAX_LARGEST_AVIF_BYTES = 120 * 1024;

await stat(SOURCE).catch(() => {
  throw new Error(`Hero source missing: ${SOURCE}`);
});
await mkdir(OUT_DIR, { recursive: true });

let largestAvif = 0;
for (const width of WIDTHS) {
  const base = sharp(SOURCE).resize({ width, withoutEnlargement: true });
  const avifPath = join(OUT_DIR, `denis-cutout-${width}.avif`);
  const webpPath = join(OUT_DIR, `denis-cutout-${width}.webp`);
  const avif = await base.clone().avif({ quality: 65, effort: 7 }).toFile(avifPath);
  const webp = await base.clone().webp({ quality: 85, alphaQuality: 90, effort: 6 }).toFile(webpPath);
  console.log(`${avifPath}: ${avif.width}x${avif.height}, ${(avif.size / 1024).toFixed(1)} KB`);
  console.log(`${webpPath}: ${webp.width}x${webp.height}, ${(webp.size / 1024).toFixed(1)} KB`);
  if (width === Math.max(...WIDTHS)) largestAvif = avif.size;
}

if (largestAvif > MAX_LARGEST_AVIF_BYTES) {
  console.error(`Largest hero AVIF is ${largestAvif} bytes, budget is ${MAX_LARGEST_AVIF_BYTES}.`);
  process.exit(1);
}
