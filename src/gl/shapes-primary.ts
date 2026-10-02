export type Rand = () => number;
export type ShapeBuilder = (n: number, R: Rand) => Float32Array;

// Formulas, constants and the order of R() calls are copied from the design's makeShapes, so a
// seeded R reproduces the design's buffers exactly.
export function rotX(a: Float32Array, k: number, t: number): void {
  const y = a[k + 1]!;
  const z = a[k + 2]!;
  const c = Math.cos(t);
  const s = Math.sin(t);
  a[k + 1] = y * c - z * s;
  a[k + 2] = y * s + z * c;
}

export function jit(R: Rand, s: number): number {
  return (R() + R() + R() - 1.5) * s;
}

export const sphereShape: ShapeBuilder = (n, R) => {
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const k = i * 3;
    if (i % 7 === 0) {
      const r = 1.6 * Math.cbrt(R()), u = R() * 2 - 1, p = R() * 6.2832, q = Math.sqrt(1 - u * u);
      a[k] = q * Math.cos(p) * r;
      a[k + 1] = u * r;
      a[k + 2] = q * Math.sin(p) * r;
    } else {
      const y = 1 - (2 * (i + 0.5)) / n, q = Math.sqrt(1 - y * y), ph = i * 2.39996;
      a[k] = q * Math.cos(ph) * 2.05;
      a[k + 1] = y * 2.05;
      a[k + 2] = q * Math.sin(ph) * 2.05;
    }
  }
  return a;
};

export const knotShape: ShapeBuilder = (n, R) => {
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const k = i * 3, t = R() * 6.2832, r = 1.25 + 0.55 * Math.cos(3 * t);
    a[k] = r * Math.cos(2 * t) + jit(R, 0.09);
    a[k + 1] = r * Math.sin(2 * t) + jit(R, 0.09);
    a[k + 2] = 0.6 * Math.sin(3 * t) + jit(R, 0.09);
    rotX(a, k, 0.4);
  }
  return a;
};

export const helixShape: ShapeBuilder = (n, R) => {
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const k = i * 3;
    if (i % 5 === 0) {
      const st = Math.round(R() * 24) / 24, t = st * 2 - 1, an = t * Math.PI * 3, u = R() * 2 - 1;
      a[k] = Math.cos(an) * 1.05 * u;
      a[k + 1] = t * 2.1;
      a[k + 2] = Math.sin(an) * 1.05 * u;
    } else {
      const t = R() * 2 - 1, an = t * Math.PI * 3 + (i % 2 ? Math.PI : 0);
      a[k] = Math.cos(an) * 1.05 + jit(R, 0.05);
      a[k + 1] = t * 2.1 + jit(R, 0.03);
      a[k + 2] = Math.sin(an) * 1.05 + jit(R, 0.05);
    }
    rotX(a, k, 0.18);
  }
  return a;
};

const NEURAL_LAYERS = [4, 7, 9, 7, 4];

function neuralNodes(): number[][][] {
  return NEURAL_LAYERS.map((c, l) => {
    const arr: number[][] = [], rad = 0.25 + c * 0.11;
    for (let j = 0; j < c; j++) {
      const an = (j / c) * 6.2832 + l * 0.4;
      arr.push([-2.6 + l * 1.3, Math.cos(an) * rad, Math.sin(an) * rad]);
    }
    return arr;
  });
}

export const neuralShape: ShapeBuilder = (n, R) => {
  const a = new Float32Array(n * 3), nodes = neuralNodes();
  for (let i = 0; i < n; i++) {
    const k = i * 3;
    if (R() < 0.34) {
      const layer = nodes[(R() * 5) | 0]!, nd = layer[(R() * layer.length) | 0]!;
      for (let d = 0; d < 3; d++) a[k + d] = nd[d]! + jit(R, 0.06);
    } else {
      const l = (R() * 4) | 0, from = nodes[l]!, to = nodes[l + 1]!;
      const A = from[(R() * from.length) | 0]!, B = to[(R() * to.length) | 0]!, t = R();
      for (let d = 0; d < 3; d++) a[k + d] = A[d]! + (B[d]! - A[d]!) * t;
    }
  }
  return a;
};
