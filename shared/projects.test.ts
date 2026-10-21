import { describe, expect, it } from 'vitest';
import { PROJECTS_WITH_DETAILS } from './project-details';
import { PROJECT_DETAILS_EN } from './project-details-en';
import { PROJECT_DETAILS_SK } from './project-details-sk';
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
    for (const p of PROJECTS_WITH_DETAILS) {
      const texts = [p.kind, p.desc, p.summary, p.credit].flatMap((t) => (t ? [t.sk, t.en] : []));
      for (const text of [...texts, ...p.scope.sk, ...p.scope.en]) expect(text.trim()).not.toBe('');
      expect(p.scope.sk).toHaveLength(p.scope.en.length);
    }
  });
});

describe('project details', () => {
  it.each([
    ['sk', PROJECT_DETAILS_SK],
    ['en', PROJECT_DETAILS_EN],
  ] as const)('%s: one entry per project slug, nothing extra', (_lang, details) => {
    expect(Object.keys(details).toSorted()).toEqual(PROJECT_INFO.map((p) => p.slug).toSorted());
  });

  it('joins the card facts with both languages in list order', () => {
    expect(PROJECTS_WITH_DETAILS.map((p) => p.slug)).toEqual(PROJECT_INFO.map((p) => p.slug));
    for (const p of PROJECTS_WITH_DETAILS) {
      expect(p.summary.sk).toBe(PROJECT_DETAILS_SK[p.slug]?.summary);
      expect(p.scope.en).toBe(PROJECT_DETAILS_EN[p.slug]?.scope);
    }
  });
});
