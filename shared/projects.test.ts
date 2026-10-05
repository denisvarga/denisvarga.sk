import { describe, expect, it } from 'vitest';
import { PROJECT_INFO } from './projects';

describe('PROJECT_INFO', () => {
  it('has unique slugs and bare https domains the screenshot pipeline can load', () => {
    expect(new Set(PROJECT_INFO.map((p) => p.slug)).size).toBe(PROJECT_INFO.length);
    for (const p of PROJECT_INFO) {
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
      expect(p.url).toMatch(/^https:\/\/[a-z0-9.-]+$/);
    }
  });

  it('lists the featured projects first', () => {
    const featured = PROJECT_INFO.filter((p) => p.featured).length;
    expect(featured).toBeGreaterThan(0);
    expect(PROJECT_INFO.slice(0, featured).every((p) => p.featured)).toBe(true);
  });

  it('describes every project in both languages', () => {
    for (const p of PROJECT_INFO) {
      for (const text of [p.kind.sk, p.kind.en, p.desc.sk, p.desc.en]) expect(text.trim()).not.toBe('');
    }
  });
});
