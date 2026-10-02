import { describe, expect, it } from 'vitest';
import { isSingleHost, langHref } from './lang-href';

describe('isSingleHost', () => {
  it.each([
    ['localhost', true],
    ['127.0.0.1', true],
    ['denisvarga-sk.denisvarga.workers.dev', true],
    ['denisvarga.sk', false],
    ['denisvarga.dev', false],
    ['www.denisvarga.sk', false],
    ['workers.dev.example.com', false],
  ])('%s -> %s', (hostname, expected) => {
    expect(isSingleHost(hostname)).toBe(expected);
  });
});

describe('langHref', () => {
  it('points at each language domain in production', () => {
    expect(langHref('sk', false)).toBe('https://denisvarga.sk/');
    expect(langHref('en', false)).toBe('https://denisvarga.dev/');
  });

  it('keeps the prerendered paths on a single-host preview', () => {
    expect(langHref('sk', true)).toBe('/');
    expect(langHref('en', true)).toBe('/en/');
  });
});
