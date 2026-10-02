import { describe, expect, it } from 'vitest';
import { homography, type Quad } from './screen-overlay.ts';

function apply(m: number[], x: number, y: number): [number, number] {
  const w = m[3]! * x + m[7]! * y + m[15]!;
  return [(m[0]! * x + m[4]! * y + m[12]!) / w, (m[1]! * x + m[5]! * y + m[13]!) / w];
}

describe('homography', () => {
  it('maps the source rectangle corners onto a perspective quad', () => {
    const quad: Quad = [[10, 20], [110, 25], [105, 80], [12, 70]];
    const m = homography(100, 50, quad);
    const mapped = [apply(m, 0, 0), apply(m, 100, 0), apply(m, 100, 50), apply(m, 0, 50)];
    mapped.forEach(([x, y], i) => {
      expect(x).toBeCloseTo(quad[i]![0], 6);
      expect(y).toBeCloseTo(quad[i]![1], 6);
    });
  });

  it('rejects a collapsed quad', () => {
    expect(() => homography(100, 50, [[0, 0], [0, 0], [0, 0], [0, 0]])).toThrow(/Degenerate/);
  });
});
