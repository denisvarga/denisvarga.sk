import { describe, expect, it } from 'vitest';
import { calmTint, CALM_BASE, dominantChromatic, mix, toHex, type Rgb } from './palette.ts';
import { parseProjects } from './project-list.ts';

const lum = ([r, g, b]: Rgb) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function pixels(...runs: [Rgb, number][]): Uint8Array {
  return Uint8Array.from(runs.flatMap(([c, n]) => Array.from({ length: n }, () => [...c]).flat()));
}

describe('palette', () => {
  it('mixes and formats colours', () => {
    expect(mix([0, 0, 0], [255, 255, 255], 0.5)).toEqual([128, 128, 128]);
    expect(mix([0, 0, 0], [255, 255, 255], 2)).toEqual([255, 255, 255]);
    expect(toHex(CALM_BASE)).toBe('#ecece9');
  });

  it('picks the brand hue on a mostly white page', () => {
    const peach: Rgb = [224, 190, 160];
    expect(dominantChromatic(pixels([[255, 255, 255], 80], [peach, 15], [[20, 20, 20], 5]), 3)).toEqual(peach);
  });

  it('returns null for an achromatic page', () => {
    expect(dominantChromatic(pixels([[255, 255, 255], 90], [[128, 128, 128], 10]), 3)).toBeNull();
  });

  it('keeps tints calm and equally light regardless of the source colour', () => {
    const navy = calmTint([10, 40, 120]);
    const peach = calmTint([224, 190, 160]);
    expect(Math.abs(lum(navy) - lum(peach))).toBeLessThan(12);
    expect(lum(navy)).toBeGreaterThan(200);
  });
});

describe('parseProjects', () => {
  it('reads name, url and slug triples and rejects odd URLs', () => {
    const src = `{ name: 'Pangeas', url: 'https://pangeas.cz', slug: 'pangeas', desc: {} }`;
    expect(parseProjects(src)).toEqual([{ name: 'Pangeas', url: 'https://pangeas.cz', slug: 'pangeas' }]);
    expect(() => parseProjects(`name: 'X', url: 'http://x.sk/a?b', slug: 'x'`)).toThrow(/Unexpected project URL/);
  });
});
