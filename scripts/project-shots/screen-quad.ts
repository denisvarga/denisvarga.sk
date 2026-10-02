import sharp from 'sharp';
import type { Point, Quad } from './screen-overlay.ts';

export function isKeyMagenta(r: number, g: number, b: number): boolean {
  return r > 150 && b > 150 && g < 110 && Math.abs(r - b) < 90;
}

// Mask of the largest 4-connected blob, or null when it covers under 1% of the image.
export function largestComponent(mask: Uint8Array, width: number, height: number): Uint8Array | null {
  const label = new Int32Array(mask.length);
  const stack = new Int32Array(mask.length);
  let best: number[] = [];
  let next = 0;
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || label[start]) continue;
    const pixels: number[] = [];
    let top = 0;
    stack[top++] = start;
    label[start] = ++next;
    while (top > 0) {
      const i = stack[--top]!;
      pixels.push(i);
      const x = i % width;
      for (const n of [i - width, i + width, x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1]) {
        if (n >= 0 && n < mask.length && mask[n] && !label[n]) {
          label[n] = next;
          stack[top++] = n;
        }
      }
    }
    if (pixels.length > best.length) best = pixels;
  }
  if (best.length < width * height * 0.01) return null;
  const blob = new Uint8Array(mask.length);
  for (const i of best) blob[i] = 1;
  return blob;
}

function extremeCorners(blob: Uint8Array, width: number): Quad {
  const scores: ((x: number, y: number) => number)[] = [(x, y) => -x - y, (x, y) => x - y, (x, y) => x + y, (x, y) => y - x];
  return scores.map((score) => {
    let winner: Point = [0, 0];
    let max = -Infinity;
    for (let i = 0; i < blob.length; i++) {
      if (!blob[i]) continue;
      const s = score(i % width, Math.floor(i / width));
      if (s > max) [max, winner] = [s, [i % width, Math.floor(i / width)]];
    }
    return winner;
  }) as unknown as Quad;
}

const SAMPLES = [0.12, 0.17, 0.22, 0.27, 0.32, 0.68, 0.73, 0.78, 0.83, 0.88];

// Extreme points land on the arcs of rounded display corners, a few pixels inside the real edges.
// Each edge is re-fitted to boundary points sampled away from the corners and from the middle
// (where a camera notch can cut in), and the corners become the intersections of those lines.
function refineQuad(blob: Uint8Array, width: number, height: number, quad: Quad): Quad {
  const inside = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    return xi >= 0 && yi >= 0 && xi < width && yi < height && blob[yi * width + xi] === 1;
  };
  const cx = quad.reduce((s, [x]) => s + x, 0) / 4;
  const cy = quad.reduce((s, [, y]) => s + y, 0) / 4;
  const size = Math.min(...quad.map((a, i) => Math.hypot(quad[(i + 1) % 4]![0] - a[0], quad[(i + 1) % 4]![1] - a[1])));
  const lines = quad.map((a, i) => {
    const b = quad[(i + 1) % 4]!;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const d: Point = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    const mid: Point = [(a[0] + b[0]) / 2 - cx, (a[1] + b[1]) / 2 - cy];
    const n: Point = d[1] * mid[0] - d[0] * mid[1] >= 0 ? [d[1], -d[0]] : [-d[1], d[0]];
    const points: Point[] = [];
    for (const t of SAMPLES) {
      const start: Point = [a[0] + t * (b[0] - a[0]) - n[0] * size * 0.08, a[1] + t * (b[1] - a[1]) - n[1] * size * 0.08];
      if (!inside(...start)) continue;
      for (let s = 0; s < size * 0.2; s += 0.25) {
        if (!inside(start[0] + n[0] * s, start[1] + n[1] * s)) {
          points.push([start[0] + n[0] * (s - 0.125), start[1] + n[1] * (s - 0.125)]);
          break;
        }
      }
    }
    if (points.length < 4) return null;
    const mx = points.reduce((s, [x]) => s + x, 0) / points.length;
    const my = points.reduce((s, [, y]) => s + y, 0) / points.length;
    let sxx = 0;
    let sxy = 0;
    let syy = 0;
    for (const [x, y] of points) {
      sxx += (x - mx) ** 2;
      sxy += (x - mx) * (y - my);
      syy += (y - my) ** 2;
    }
    const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    return { p: [mx, my] as Point, d: [Math.cos(angle), Math.sin(angle)] as Point };
  });
  if (lines.some((l) => l === null)) return quad;
  const fitted = lines as { p: Point; d: Point }[];
  return fitted.map((line, i) => {
    const prev = fitted[(i + 3) % 4]!;
    const det = line.d[0] * prev.d[1] - line.d[1] * prev.d[0];
    if (Math.abs(det) < 1e-9) return quad[i]!;
    const s = ((prev.p[0] - line.p[0]) * prev.d[1] - (prev.p[1] - line.p[1]) * prev.d[0]) / det;
    return [line.p[0] + s * line.d[0], line.p[1] + s * line.d[1]];
  }) as unknown as Quad;
}

export function quadFromMask(mask: Uint8Array, width: number, height: number): Quad | null {
  const blob = largestComponent(mask, width, height);
  return blob ? refineQuad(blob, width, height, extremeCorners(blob, width)) : null;
}

// Offsets every edge outward by px (exact line offset, not corner scaling) so the overlay also
// covers the anti-aliased key fringe along long edges.
export function expandQuad(quad: Quad, px: number): Quad {
  const cx = quad.reduce((s, [x]) => s + x, 0) / 4;
  const cy = quad.reduce((s, [, y]) => s + y, 0) / 4;
  const normal = (a: Point, b: Point): Point => {
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const len = Math.hypot(dx, dy) || 1;
    const n: Point = [dy / len, -dx / len];
    const mid: Point = [(a[0] + b[0]) / 2 - cx, (a[1] + b[1]) / 2 - cy];
    return n[0] * mid[0] + n[1] * mid[1] >= 0 ? n : [-n[0], -n[1]];
  };
  return quad.map((corner, i) => {
    const n1 = normal(quad[(i + 3) % 4]!, corner);
    const n2 = normal(corner, quad[(i + 1) % 4]!);
    const k = px / (1 + n1[0] * n2[0] + n1[1] * n2[1]);
    return [corner[0] + (n1[0] + n2[0]) * k, corner[1] + (n1[1] + n2[1]) * k];
  }) as unknown as Quad;
}

export async function detectKeyedScreen(file: string): Promise<Quad> {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const mask = new Uint8Array(info.width * info.height);
  for (let i = 0, p = 0; p < mask.length; i += info.channels, p++) {
    mask[p] = isKeyMagenta(data[i]!, data[i + 1]!, data[i + 2]!) ? 1 : 0;
  }
  const quad = quadFromMask(mask, info.width, info.height);
  if (!quad) throw new Error(`${file}: no chroma-magenta screen found`);
  return expandQuad(quad, 3);
}

function insideQuad(quad: Quad, x: number, y: number): boolean {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = quad[i]!;
    const [bx, by] = quad[(i + 1) % 4]!;
    const cross = Math.sign((bx - ax) * (y - ay) - (by - ay) * (x - ax));
    if (cross !== 0 && sign !== 0 && cross !== sign) return false;
    if (cross !== 0) sign = cross;
  }
  return true;
}

// Key-coloured pixels left outside the screen; inside it, magenta-like pixels belong to the real site.
export async function countKeyPixels(image: Buffer, screen: Quad): Promise<number> {
  const { data, info } = await sharp(image).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let count = 0;
  for (let p = 0, i = 0; i < data.length; p++, i += info.channels) {
    if (!isKeyMagenta(data[i]!, data[i + 1]!, data[i + 2]!)) continue;
    if (!insideQuad(screen, p % info.width, Math.floor(p / info.width))) count++;
  }
  return count;
}
