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
    for (const project of PROJECTS) expect(text).toContain(project.url);
    expect(text).toContain('### Denva, AI engineer & full-stack developer (2018 - present)');
    expect(text).not.toContain('*');
  });
});
