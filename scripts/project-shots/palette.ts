import sharp from 'sharp';

export type Rgb = readonly [number, number, number];

export const CALM_BASE: Rgb = [0xec, 0xec, 0xe9];

export function mix(a: Rgb, b: Rgb, amountOfB: number): Rgb {
  const t = Math.min(1, Math.max(0, amountOfB));
  return [0, 1, 2].map((i) => Math.round(a[i]! * (1 - t) + b[i]! * t)) as unknown as Rgb;
}

export function toHex(c: Rgb): string {
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function toHsl([r, g, b]: Rgb): [number, number, number] {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === rn ? ((gn - bn) / d + 6) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  return [h * 60, s, l];
}

function fromHsl(h: number, s: number, l: number): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r, g, b].map((v) => Math.round((v + m) * 255)) as unknown as Rgb;
}

// Most common colour among saturated, mid-lightness pixels (4-bit-per-channel buckets), so a
// mostly white site still yields its brand hue. Null when under 3% of pixels are chromatic.
export function dominantChromatic(pixels: Uint8Array, channels: number): Rgb | null {
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  let chromatic = 0;
  const total = Math.floor(pixels.length / channels);
  for (let i = 0; i + 2 < pixels.length; i += channels) {
    const px: Rgb = [pixels[i]!, pixels[i + 1]!, pixels[i + 2]!];
    const [, s, l] = toHsl(px);
    if (s < 0.18 || l < 0.1 || l > 0.93) continue;
    chromatic++;
    const key = ((px[0] >> 4) << 8) | ((px[1] >> 4) << 4) | (px[2] >> 4);
    const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bucket.n++;
    bucket.r += px[0];
    bucket.g += px[1];
    bucket.b += px[2];
    buckets.set(key, bucket);
  }
  if (total === 0 || chromatic / total < 0.03) return null;
  const best = [...buckets.values()].reduce((a, b) => (b.n > a.n ? b : a));
  return [best.r / best.n, best.g / best.n, best.b / best.n].map(Math.round) as unknown as Rgb;
}

// Hue comes from the site, lightness and saturation are pinned so all cards share one calm value.
export function calmTint(dominant: Rgb): Rgb {
  const [h, s] = toHsl(dominant);
  return mix(CALM_BASE, fromHsl(h, Math.min(0.32, s * 0.5), 0.86), 0.7);
}

export async function siteTint(file: string): Promise<{ dominant: Rgb; tint: Rgb }> {
  const { data, info } = await sharp(file).resize(120, 75, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const chromatic = dominantChromatic(data, info.channels);
  if (chromatic) return { dominant: chromatic, tint: calmTint(chromatic) };
  const { dominant } = await sharp(file).stats();
  const fallback: Rgb = [dominant.r, dominant.g, dominant.b];
  return { dominant: fallback, tint: mix(CALM_BASE, fallback, 0.12) };
}
