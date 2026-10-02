import { describe, expect, it } from 'vitest';
import { expandQuad, quadFromMask } from './screen-quad.ts';

const W = 600;
const H = 400;

// Screen occupying x 100..500, y 80..330 (continuous edges) with rounded corners and a top notch.
function screenMask({ radius = 0, notch = false } = {}): Uint8Array {
  const m = new Uint8Array(W * H);
  for (let y = 80; y < 330; y++) {
    for (let x = 100; x < 500; x++) {
      const cx = Math.min(Math.max(x + 0.5, 100 + radius), 500 - radius);
      const cy = Math.min(Math.max(y + 0.5, 80 + radius), 330 - radius);
      if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) > radius) continue;
      if (notch && y < 95 && x >= 280 && x < 320) continue;
      m[y * W + x] = 1;
    }
  }
  return m;
}

describe('quadFromMask', () => {
  it('recovers the true screen corners despite rounded corners and a notch', () => {
    const quad = quadFromMask(screenMask({ radius: 20, notch: true }), W, H);
    const expected = [[100, 80], [500, 80], [500, 330], [100, 330]];
    quad!.forEach(([x, y], i) => {
      expect(Math.abs(x - expected[i]![0]!)).toBeLessThan(0.6);
      expect(Math.abs(y - expected[i]![1]!)).toBeLessThan(0.6);
    });
  });

  it('ignores stray key-coloured pixels outside the screen', () => {
    const m = screenMask();
    for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) m[(y + 360) * W + x + 560] = 1;
    const [tl, , br] = quadFromMask(m, W, H)!;
    expect(tl[0]).toBeCloseTo(100, 0);
    expect(br[1]).toBeCloseTo(330, 0);
  });

  it('returns null when no meaningful screen is present', () => {
    expect(quadFromMask(new Uint8Array(W * H), W, H)).toBeNull();
  });
});

describe('expandQuad', () => {
  it('offsets every edge of a wide quad by the same distance', () => {
    const [tl, tr, br, bl] = expandQuad([[0, 0], [100, 0], [100, 20], [0, 20]], 2);
    expect(tl).toEqual([-2, -2]);
    expect(tr[1]).toBeCloseTo(-2, 6);
    expect(br).toEqual([102, 22]);
    expect(bl[0]).toBeCloseTo(-2, 6);
  });
});
