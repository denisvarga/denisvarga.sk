import sharp, { type OverlayOptions } from 'sharp';

// Shipped project images are 16:10; the rail shows their central 4:3 crop.
export const SHIP_SIZE = { width: 1280, height: 800 } as const;
const WEBP_QUALITY = 80;

export async function writeShipWebp(source: Buffer | string, file: string): Promise<number> {
  const info = await sharp(source)
    .resize(SHIP_SIZE.width, SHIP_SIZE.height, { fit: 'cover', kernel: 'lanczos3' })
    .webp({ quality: WEBP_QUALITY, effort: 6 })
    .toFile(file);
  return info.size;
}

function crop4x3(width: number, height: number) {
  const cropWidth = Math.round((height * 4) / 3);
  return { left: Math.round((width - cropWidth) / 2), top: 0, width: cropWidth, height };
}

export async function writeSampleJpgs(full: Buffer, base: string): Promise<void> {
  const { width = 0, height = 0 } = await sharp(full).metadata();
  await sharp(full).jpeg({ quality: 88, mozjpeg: true }).toFile(`${base}.jpg`);
  await sharp(full).extract(crop4x3(width, height)).jpeg({ quality: 88, mozjpeg: true }).toFile(`${base}-4x3.jpg`);
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

// Rail preview: every image as its 4:3 crop with the card radius on the site background.
export async function writeOverview(entries: readonly { label: string; file: string }[], outFile: string): Promise<void> {
  const W = 400;
  const H = 300;
  const GAP = 24;
  const PAD = 40;
  const LABEL = 34;
  const COLS = 4;
  const rows = Math.ceil(entries.length / COLS);
  const mask = Buffer.from(`<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" rx="15" ry="15"/></svg>`);
  const layers: OverlayOptions[] = [];
  for (const [i, entry] of entries.entries()) {
    const { width = 0, height = 0 } = await sharp(entry.file).metadata();
    const card = await sharp(entry.file)
      .extract(crop4x3(width, height))
      .resize(W, H)
      .composite([{ input: mask, blend: 'dest-in' }])
      .png()
      .toBuffer();
    const left = PAD + (i % COLS) * (W + GAP);
    const top = PAD + Math.floor(i / COLS) * (H + LABEL + GAP);
    const text = `<svg width="${W}" height="${LABEL}"><text x="2" y="24" font-family="Helvetica" font-size="15" fill="#3e4044">${esc(entry.label)}</text></svg>`;
    layers.push({ input: card, left, top }, { input: Buffer.from(text), left, top: top + H });
  }
  await sharp({
    create: {
      width: 2 * PAD + COLS * W + (COLS - 1) * GAP,
      height: 2 * PAD + rows * (H + LABEL) + (rows - 1) * GAP,
      channels: 3,
      background: '#ECECE9',
    },
  })
    .composite(layers)
    .jpeg({ quality: 88 })
    .toFile(outFile);
}
