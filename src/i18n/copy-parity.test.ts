import { describe, expect, it } from 'vitest';
import { demosEn } from '../data/demos-en';
import { demosSk } from '../data/demos-sk';
import { JOBS } from '../data/jobs';
import { PROJECTS } from '../data/projects';
import { SKILLS } from '../data/skills';
import { copyEn } from './copy-en';
import { copySk } from './copy-sk';
import { headCopy } from './head-copy';
import { ui } from './ui-copy';

// Shape with every string replaced by its type, so SK and EN must match key for key and
// array for array.
function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]));
  }
  return typeof value;
}

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

const everything = { copySk, copyEn, ui, headCopy, JOBS, PROJECTS, SKILLS, demosSk, demosEn };

describe('copy parity', () => {
  it('SK and EN page copy have identical shape', () => {
    expect(shape(copyEn)).toEqual(shape(copySk));
  });

  it('SK and EN UI and head copy have identical shape', () => {
    expect(shape(ui.en)).toEqual(shape(ui.sk));
    expect(shape(headCopy.en)).toEqual(shape(headCopy.sk));
  });

  it('demos match per language: same count, titles and line kinds', () => {
    expect(demosSk).toHaveLength(4);
    expect(demosEn).toHaveLength(4);
    demosSk.forEach((demo, i) => {
      expect(demosEn[i]?.lines.map(([kind]) => kind)).toEqual(demo.lines.map(([kind]) => kind));
    });
  });

  it('data has the design counts', () => {
    expect(JOBS).toHaveLength(5);
    expect(PROJECTS).toHaveLength(12);
    expect(SKILLS).toHaveLength(6);
    expect(new Set(PROJECTS.map((p) => p.slug)).size).toBe(12);
  });

  it('no string is empty or carries stray markup whitespace', () => {
    for (const s of strings(everything)) {
      expect(s.trim()).not.toBe('');
      expect(s).toBe(s.trim());
    }
  });

  it('uses hello@denisvarga.sk and never the old address', () => {
    const all = strings(everything).join('\n');
    const oldAddress = ['info', 'denva.sk'].join('@');
    expect(all).not.toContain(oldAddress);
    expect(copySk.ask.error).toContain('hello@denisvarga.sk');
    expect(copyEn.ask.error).toContain('hello@denisvarga.sk');
    expect(copySk.ask.error).toContain('+421 902 074 830');
  });
});
