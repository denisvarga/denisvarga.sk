import { readFile, writeFile } from 'node:fs/promises';
import sharp, { type Sharp } from 'sharp';

const SOURCE = 'public/favicon.svg';
const APPLE_TOUCH = { out: 'public/apple-touch-icon.png', size: 180 } as const;
const FAVICON_ICO = { out: 'public/favicon.ico', size: 48 } as const;
// The SVG switches colours with prefers-color-scheme; a raster icon cannot, so it sits on the light page colour.
const BACKGROUND = '#ECECE9';
const ICO_HEADER_BYTES = 6;
const ICO_ENTRY_BYTES = 16;

const svg = await readFile(SOURCE).catch(() => {
  throw new Error(`Favicon source missing: ${SOURCE}`);
});

// Rasterise well above the target size so the downscale keeps the glyph edges crisp.
function rasterise(size: number): Sharp {
  return sharp(svg, { density: 72 * Math.ceil((size * 4) / 64) })
    .resize(size, size)
    .flatten({ background: BACKGROUND });
}

// One PNG image in an ICO container (header, one directory entry, the PNG bytes). Browsers and
// Windows since Vista read PNG entries; the entry declares 32 bpp, so the PNG carries an alpha channel.
function pngToIco(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(ICO_HEADER_BYTES + ICO_ENTRY_BYTES);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(size, 6);
  header.writeUInt8(size, 7);
  header.writeUInt8(0, 8);
  header.writeUInt8(0, 9);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(header.length, 18);
  return Buffer.concat([header, png]);
}

const appleTouch = await rasterise(APPLE_TOUCH.size).png({ compressionLevel: 9 }).toBuffer();
const faviconPng = await rasterise(FAVICON_ICO.size).ensureAlpha().png({ compressionLevel: 9 }).toBuffer();
const outputs = [
  { ...APPLE_TOUCH, data: appleTouch },
  { ...FAVICON_ICO, data: pngToIco(faviconPng, FAVICON_ICO.size) },
];
for (const { out, size, data } of outputs) {
  await writeFile(out, data);
  console.log(`${out}: ${size}x${size}, ${(data.length / 1024).toFixed(1)} KB`);
}
