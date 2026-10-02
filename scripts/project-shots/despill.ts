import sharp from 'sharp';
import type { Quad } from './screen-overlay.ts';

// The model lights the keyboard and the surface in front of the laptop with the key colour. Magenta
// spill raises red and blue against green, so the excess of their mean over green (minus a small
// tolerance for naturally warm tones) is removed from both. Measured on the dressmaking scene: the
// glow on oak scored about 14, clean oak about 1. The weight feathers the effect at the region edge.
const TOLERANCE = 2;

export function despillPixel(r: number, g: number, b: number, weight: number): [number, number, number] {
  const spill = (r + b) / 2 - g - TOLERANCE;
  if (spill <= 0 || weight <= 0) return [r, g, b];
  const cut = Math.round(spill * Math.min(1, weight));
  return [Math.max(0, r - cut), g, Math.max(0, b - cut)];
}

export async function despillAroundScreen(sceneFile: string, quad: Quad): Promise<Buffer> {
  const { data, info } = await sharp(sceneFile).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const xs = quad.map(([x]) => x);
  const ys = quad.map(([, y]) => y);
  const screenW = Math.max(...xs) - Math.min(...xs);
  const screenH = Math.max(...ys) - Math.min(...ys);
  // Light falls forward: keyboard and surface below the hinge, not the objects behind the screen.
  const hinge = Math.min(quad[2][1], quad[3][1]);
  const box = {
    left: Math.min(...xs) - 0.6 * screenW,
    right: Math.max(...xs) + 0.6 * screenW,
    top: hinge - 0.05 * screenH,
    bottom: Math.max(...ys) + 1.3 * screenH,
  };
  const feather = 0.25 * screenW;
  for (let y = 0; y < info.height; y++) {
    const dy = Math.max(box.top - y, y - box.bottom, 0);
    if (dy >= feather) continue;
    for (let x = 0; x < info.width; x++) {
      const dx = Math.max(box.left - x, x - box.right, 0);
      const weight = 1 - Math.hypot(dx, dy) / feather;
      if (weight <= 0) continue;
      const i = (y * info.width + x) * info.channels;
      const [r, g, b] = despillPixel(data[i]!, data[i + 1]!, data[i + 2]!, weight);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } }).png().toBuffer();
}
