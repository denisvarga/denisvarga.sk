import { describe, expect, it } from 'vitest';
import { PROJECTS } from '../../data/projects';
import { pad2, projectDomain, projectScope } from './project-scope';

describe('projectScope', () => {
  it('splits on commas and colons, capitalizes and numbers each part', () => {
    expect(projectScope('Môj vlastný e-shop: mapové artworky z GPX trás, 2D a 3D generovanie, 3D tlač')).toEqual([
      { n: '01', text: 'Môj vlastný e-shop' },
      { n: '02', text: 'Mapové artworky z GPX trás' },
      { n: '03', text: '2D a 3D generovanie' },
      { n: '04', text: '3D tlač' },
    ]);
  });

  it('keeps a colon inside a ratio such as 1:1', () => {
    expect(projectScope('podľa Figmy 1:1, napojenie na Realpad: synchronizácia cenníka')).toEqual([
      { n: '01', text: 'Podľa Figmy 1:1' },
      { n: '02', text: 'Napojenie na Realpad' },
      { n: '03', text: 'Synchronizácia cenníka' },
    ]);
  });

  it('keeps parentheses and drops empty parts', () => {
    expect(projectScope('Multivendor marketplace (Dokan), stripe,, :')).toEqual([
      { n: '01', text: 'Multivendor marketplace (Dokan)' },
      { n: '02', text: 'Stripe' },
    ]);
  });

  it('returns nothing for an empty description', () => {
    expect(projectScope('')).toEqual([]);
  });

  it('gives every project at least one scope item in both languages', () => {
    for (const project of PROJECTS) {
      expect(projectScope(project.desc.sk).length).toBeGreaterThan(0);
      expect(projectScope(project.desc.en).length).toBeGreaterThan(0);
    }
  });
});

describe('helpers', () => {
  it('pads numbers to two digits', () => {
    expect(pad2(3)).toBe('03');
    expect(pad2(12)).toBe('12');
  });

  it('strips the scheme from a project url', () => {
    expect(projectDomain('https://denva.studio')).toBe('denva.studio');
  });
});
