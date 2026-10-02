import { rotX, type ShapeBuilder } from './shapes-primary';

export const gridShape: ShapeBuilder = (n, R) => {
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const k = i * 3, gx = (R() * 2 - 1) * 3.2, gz = (R() * 2 - 1) * 2.2, x = Math.round(gx * 6) / 6;
    const z = R() < 0.5 ? Math.round(gz * 6) / 6 : gz, xx = R() < 0.5 ? gx : x;
    a[k] = xx;
    a[k + 2] = z;
    a[k + 1] = 0.32 * Math.sin(xx * 1.4) + 0.28 * Math.cos(z * 1.9);
    rotX(a, k, 0.55);
  }
  return a;
};

export const ringsShape: ShapeBuilder = (n, R) => {
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const k = i * 3, l = i % 6, r = 1.9 * ((1 + ((R() * 5) | 0)) / 5), an = R() * 6.2832;
    a[k] = Math.cos(an) * r;
    a[k + 1] = (l - 2.5) * 0.44;
    a[k + 2] = Math.sin(an) * r;
    rotX(a, k, 0.42);
  }
  return a;
};

const ATOM_RADII = [1.7, 2.15, 2.6];
const ATOM_TILT_X = [1.2, 0.4, -0.7];
const ATOM_TILT_Y = [0.3, -0.9, 0.6];

export const atomShape: ShapeBuilder = (n, R) => {
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const k = i * 3;
    if (i % 20 < 10) {
      const u = R() * 2 - 1, p = R() * 6.283, q = Math.sqrt(1 - u * u);
      a[k] = q * Math.cos(p) * 0.95;
      a[k + 1] = u * 0.95;
      a[k + 2] = q * Math.sin(p) * 0.95;
    } else {
      const j = i % 3, Rr = ATOM_RADII[j]!, an = R() * 6.2832, x = Math.cos(an) * Rr, y = Math.sin(an) * Rr;
      const ax = ATOM_TILT_X[j]!, ay = ATOM_TILT_Y[j]!;
      const y2 = y * Math.cos(ax), z2 = y * Math.sin(ax);
      a[k] = x * Math.cos(ay) + z2 * Math.sin(ay);
      a[k + 1] = y2;
      a[k + 2] = -x * Math.sin(ay) + z2 * Math.cos(ay);
    }
  }
  return a;
};
