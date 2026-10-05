import { describe, expect, it } from 'vitest';
import { PROJECTS } from '../data/projects';
import { buildLlmsFullTxt, buildLlmsTxt } from './llms';

describe('llms.txt', () => {
  it('follows the llmstxt.org shape and links the plain-text CV', () => {
    const text = buildLlmsTxt();
    expect(text.startsWith('# Denis Varga\n\n> ')).toBe(true);
    expect(text).toContain('(https://denisvarga.sk/llms-full.txt)');
    expect(text).toContain('hello@denisvarga.dev');
    expect(text).toContain('hello@denisvarga.sk');
  });

  it('carries the whole CV without markup', () => {
    const text = buildLlmsFullTxt();
    for (const project of PROJECTS) expect(text).toContain(project.url ?? `${project.name} (private project, no public site)`);
    expect(text).toContain('### GrandPano, WordPress specialist (2026 - present)');
    expect(text).toContain('- Brixx (https://brixx.cz): Residential development website, built as an employee of GrandPano. ');
    expect(text).toContain('### Denva, AI engineer & full-stack developer (2018 - present)');
    expect(text).toContain('- Location: Bratislava, Slovakia; remote preferred.');
    expect(text).toContain('- Languages: Slovak (native), English (professional working proficiency).');
    expect(text).toContain('- Education: Secondary School of Printing (Stredná odborná škola polygrafická), digital media graphic designer, 2012 - 2016.');
    expect(text).not.toContain('*');
  });
});
