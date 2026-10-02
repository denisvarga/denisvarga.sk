import { describe, expect, it } from 'vitest';
import { designMakeShapes, designPointAttributes, seededRandom } from '../../scripts/oracles/design-gl-math';
import { makePointAttributes, makeShapes, pointCount, SHAPE_BUILDERS } from './make-shapes';

// Generous bounds per shape: sphere 2.05, knot ~1.8+jitter, helix ~2.3, net ~2.9, grid ~3.9, rings 1.9 + 1.1 height, atom 2.6.
const MAX_RADIUS = [2.06, 2.2, 2.5, 3.0, 4.0, 2.3, 2.61];

describe('makeShapes', () => {
  it('builds seven shapes with three finite coordinates per point', () => {
    const shapes = makeShapes(7000, seededRandom(1));
    expect(shapes).toHaveLength(7);
    for (const shape of shapes) {
      expect(shape).toHaveLength(21000);
      expect(shape.every(Number.isFinite)).toBe(true);
    }
  });

  it('keeps every shape inside its bounding radius', () => {
    makeShapes(12000, seededRandom(2)).forEach((shape, s) => {
      let max = 0;
      for (let k = 0; k < shape.length; k += 3) max = Math.max(max, Math.hypot(shape[k]!, shape[k + 1]!, shape[k + 2]!));
      expect(max).toBeLessThan(MAX_RADIUS[s]!);
      expect(max).toBeGreaterThan(0.5);
    });
  });

  it('reproduces the design buffers exactly for the same random sequence', () => {
    for (const n of [7000, 12000]) {
      const port = makeShapes(n, seededRandom(42));
      const design = designMakeShapes(n, seededRandom(42));
      port.forEach((shape, s) => expect(shape).toEqual(design[s]));
    }
  });

  it('consumes random numbers in the design order when built one slice at a time', () => {
    const R = seededRandom(7);
    const sliced = SHAPE_BUILDERS.map((build) => build(7000, R));
    const attrs = makePointAttributes(7000, R);
    const D = seededRandom(7);
    const design = designMakeShapes(7000, D);
    const designAttrs = designPointAttributes(7000, D);
    sliced.forEach((shape, s) => expect(shape).toEqual(design[s]));
    expect(attrs.dir).toEqual(designAttrs.dir);
    expect(attrs.ph).toEqual(designAttrs.ph);
    expect(attrs.col).toEqual(designAttrs.col);
    expect(attrs.size).toEqual(designAttrs.size);
  });

  it('picks the point count from the init width', () => {
    expect(pointCount(390)).toBe(7000);
    expect(pointCount(899)).toBe(7000);
    expect(pointCount(900)).toBe(12000);
  });
});
