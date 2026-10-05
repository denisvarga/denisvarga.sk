import { describe, expect, it } from 'vitest';
import { PROJECT_INFO } from './projects';

describe('PROJECT_INFO', () => {
  it('has unique slugs and bare https domains the screenshot pipeline can load', () => {
    expect(new Set(PROJECT_INFO.map((p) => p.slug)).size).toBe(PROJECT_INFO.length);
    for (const p of PROJECT_INFO) {
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
      if (p.url !== null) expect(p.url).toMatch(/^https:\/\/[a-z0-9.-]+$/);
    }
  });

  it('lists the featured projects first', () => {
    const featured = PROJECT_INFO.filter((p) => p.featured).length;
    expect(featured).toBeGreaterThan(0);
    expect(PROJECT_INFO.slice(0, featured).every((p) => p.featured)).toBe(true);
  });

  it('describes every project in both languages', () => {
    for (const p of PROJECT_INFO) {
      const texts = [p.kind, p.desc, p.summary, p.credit].flatMap((t) => (t ? [t.sk, t.en] : []));
      for (const text of [...texts, ...p.scope.sk, ...p.scope.en]) expect(text.trim()).not.toBe('');
      expect(p.scope.sk).toHaveLength(p.scope.en.length);
    }
  });
});
