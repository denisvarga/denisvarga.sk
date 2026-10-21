import { helixShape, knotShape, neuralShape, sphereShape, type Rand, type ShapeBuilder } from './shapes-primary';
import { atomShape, gridShape, ringsShape } from './shapes-secondary';

// Index = section index: hero, about, experience, AI, projects, stack, contact.
export const SHAPE_BUILDERS: readonly ShapeBuilder[] = [
  sphereShape,
  knotShape,
  helixShape,
  neuralShape,
  gridShape,
  ringsShape,
  atomShape,
];

const MOBILE_WIDTH = 900;
const ACCENT_HEX = 0xf2541b;
const ACCENT_RGB = [(ACCENT_HEX >> 16) & 255, (ACCENT_HEX >> 8) & 255, ACCENT_HEX & 255].map((v) => v / 255);

// Chosen once at init from the viewport width, like the design; never re-read on resize.
export function pointCount(viewportWidth: number): number {
  return viewportWidth < MOBILE_WIDTH ? 7000 : 12000;
}

export function isMobileWidth(viewportWidth: number): boolean {
  return viewportWidth < MOBILE_WIDTH;
}

export function makeShapes(n: number, R: Rand = Math.random): Float32Array[] {
  return SHAPE_BUILDERS.map((build) => build(n, R));
}

export interface PointAttributes {
  readonly dir: Float32Array;
  readonly ph: Float32Array;
  readonly col: Float32Array;
  readonly size: Float32Array;
}

// The design's per-point loop in initGL followed by paintColors with the default accent.
export function makePointAttributes(n: number, R: Rand = Math.random): PointAttributes {
  const dir = new Float32Array(n * 3), ph = new Float32Array(n), col = new Float32Array(n * 3), size = new Float32Array(n);
  const isAcc = new Uint8Array(n), shade = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const u = R() * 2 - 1, p = R() * 6.283, q = Math.sqrt(1 - u * u), m = 0.4 + R() * 1.4;
    dir[i * 3] = q * Math.cos(p) * m;
    dir[i * 3 + 1] = u * m;
    dir[i * 3 + 2] = q * Math.sin(p) * m;
    ph[i] = R() * 6.283;
    isAcc[i] = R() < 0.12 ? 1 : 0;
    shade[i] = 0.08 + R() * 0.28;
    size[i] = isAcc[i] ? 1.25 : 0.7 + R() * 0.6;
  }
  const [r, g, b] = ACCENT_RGB as [number, number, number];
  for (let i = 0; i < n; i++) {
    const k = i * 3, f = shade[i]!;
    if (isAcc[i]) {
      col[k] = r;
      col[k + 1] = g;
      col[k + 2] = b;
    } else {
      col[k] = f;
      col[k + 1] = f * 1.02;
      col[k + 2] = f * 1.05;
    }
  }
  return { dir, ph, col, size };
}
