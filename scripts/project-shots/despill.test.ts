import { describe, expect, it } from 'vitest';
import { despillPixel } from './despill.ts';

describe('despillPixel', () => {
  it('neutralises the magenta glow on dark keys', () => {
    expect(despillPixel(56, 23, 56, 1)).toEqual([25, 23, 25]);
  });

  it('pulls a pink-tinted oak surface back to plain oak', () => {
    const [r, g, b] = despillPixel(195, 150, 133, 1);
    expect([r, g, b]).toEqual([183, 150, 121]);
  });

  it('leaves warm wood, light stone and neutral greys alone', () => {
    expect(despillPixel(189, 154, 122, 1)).toEqual([189, 154, 122]);
    expect(despillPixel(231, 222, 215, 1)).toEqual([231, 222, 215]);
    expect(despillPixel(128, 128, 128, 1)).toEqual([128, 128, 128]);
  });

  it('applies only part of the correction at the feathered edge', () => {
    expect(despillPixel(56, 23, 56, 0.5)).toEqual([40, 23, 40]);
  });
});
