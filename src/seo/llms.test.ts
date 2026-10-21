import { describe, expect, it } from 'vitest';
import { PROJECT_DETAILS_EN } from '../../shared/project-details-en';
import { formatPeriod } from '../data/jobs';
import { PROJECTS } from '../data/projects';
import { BUILD_YEAR } from '../lib/use-current-year';
import { buildLlmsFullTxt, buildLlmsTxt } from './llms';

describe('llms.txt', () => {
  it('follows the llmstxt.org shape and links the plain-text CV', () => {
    const text = buildLlmsTxt();
    expect(text.startsWith('# Denis Varga\n\n> ')).toBe(true);
    expect(text).toContain('(https://denisvarga.sk/llms-full.txt)');
    expect(text).toContain('hello@denisvarga.dev');
    expect(text).toContain('hello@denisvarga.sk');
  });

  it('summarises with the page description: role, place and WordPress', () => {
    const summary = buildLlmsTxt().split('\n')[2];
    expect(summary).toContain('AI & full-stack developer in Bratislava, Slovakia.');
    expect(summary).toContain('WordPress and WooCommerce');
    expect(summary?.match(/AI & full-stack developer/g)).toHaveLength(1);
  });

  it('carries the whole CV without markup', () => {
    const text = buildLlmsFullTxt();
    for (const project of PROJECTS) expect(text).toContain(project.url ?? `${project.name} (private project, no public site)`);
    expect(text).toContain(`### GrandPano, WordPress specialist (${formatPeriod({ start: 2026, end: null }, BUILD_YEAR)})`);
    expect(text).toContain('- Brixx (https://brixx.cz): Residential development website, built as an employee of GrandPano. ');
    expect(text).toContain(`### Denva, AI engineer & full-stack developer (2018 - ${BUILD_YEAR})`);
    expect(text).toContain('- Location: Bratislava, Slovakia; remote preferred.');
    expect(text).toContain('- Based in: Bratislava, Slovakia or remote');
    expect(text).toContain('- I build: Websites, online stores (WordPress, WooCommerce), apps, automation');
    expect(text).toContain('Make and n8n');
    expect(text).toContain('- Languages: Slovak (native), English (professional working proficiency).');
    expect(text).toContain('- Education: Secondary School of Printing (Stredná odborná škola polygrafická), digital media graphic designer, 2012 - 2016.');
    expect(text).not.toContain('*');
  });

  it('carries every project\'s English drawer summary and scope', () => {
    const text = buildLlmsFullTxt();
    for (const project of PROJECTS) {
      const details = PROJECT_DETAILS_EN[project.slug];
      expect(details, project.slug).toBeDefined();
      expect(text).toContain(`${details?.summary} Scope: ${details?.scope.join('; ')}.`);
    }
  });
});
