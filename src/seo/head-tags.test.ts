import { describe, expect, it } from 'vitest';
import { SKILLS } from '../data/skills';
import { buildHeadTags, buildNotFoundHeadTags } from './head-tags';
import { personJsonLd, serializeJsonLd } from './json-ld';
import { buildSitemap } from './sitemap';

const FONTS = ['/assets/manrope-latin-wght-normal-abc.woff2', '/assets/manrope-latin-ext-wght-normal-def.woff2'];

function parseHead(html: string): Document {
  return new DOMParser().parseFromString(`<!doctype html><html><head>${html}</head></html>`, 'text/html');
}

const attrs = (doc: Document, selector: string, attr: string) =>
  [...doc.querySelectorAll(selector)].map((el) => el.getAttribute(attr));

describe('buildHeadTags', () => {
  it.each([
    ['sk', 'https://denisvarga.sk/', 'sk_SK', 'en_US'],
    ['en', 'https://denisvarga.sk/en/', 'en_US', 'sk_SK'],
  ] as const)('%s: canonical, the three hreflang links and OG locale', (lang, canonical, locale, alternate) => {
    const doc = parseHead(buildHeadTags(lang, FONTS));
    expect(attrs(doc, 'link[rel="canonical"]', 'href')).toEqual([canonical]);
    const hreflang = [...doc.querySelectorAll('link[rel="alternate"][hreflang]')].map((el) => [
      el.getAttribute('hreflang'),
      el.getAttribute('href'),
    ]);
    expect(hreflang).toEqual([
      ['sk', 'https://denisvarga.sk/'],
      ['en', 'https://denisvarga.sk/en/'],
      ['x-default', 'https://denisvarga.sk/'],
    ]);
    expect(attrs(doc, 'meta[property="og:url"]', 'content')).toEqual([canonical]);
    expect(attrs(doc, 'meta[property="og:locale"]', 'content')).toEqual([locale]);
    expect(attrs(doc, 'meta[property="og:locale:alternate"]', 'content')).toEqual([alternate]);
  });

  it('emits the approved copy, icons, OG image and both font preloads, but no charset or viewport', () => {
    const html = buildHeadTags('sk', FONTS);
    const doc = parseHead(html);
    expect(doc.title).toBe('Denis Varga | AI developer a WordPress špecialista');
    expect(attrs(doc, 'meta[property="og:image"]', 'content')).toEqual(['https://denisvarga.sk/og-image.jpg']);
    expect(attrs(doc, 'meta[name="twitter:card"]', 'content')).toEqual(['summary_large_image']);
    expect(attrs(doc, 'meta[name="theme-color"]', 'content')).toEqual(['#ECECE9']);
    expect(attrs(doc, 'link[rel="icon"]', 'href')).toEqual(['/favicon.svg']);
    expect(attrs(doc, 'link[rel="apple-touch-icon"]', 'href')).toEqual(['/apple-touch-icon.png']);
    expect(attrs(doc, 'link[rel="preload"][as="font"][crossorigin]', 'href')).toEqual(FONTS);
    expect(html).toMatch(/^<!-- Ahoj, zvedavec\. \/ Hi, curious one\./);
    expect(html).not.toMatch(/charset|viewport/);
  });

  it('carries the Person JSON-LD for the page language', () => {
    const doc = parseHead(buildHeadTags('en', FONTS));
    const scripts = doc.querySelectorAll('script');
    expect(scripts).toHaveLength(1);
    expect(scripts[0]!.type).toBe('application/ld+json');
    const data = JSON.parse(scripts[0]!.textContent ?? '');
    expect(data).toMatchObject({
      '@type': 'Person',
      url: 'https://denisvarga.sk/en/',
      jobTitle: 'AI developer and WordPress specialist',
      email: 'mailto:hello@denisvarga.sk',
      telephone: '+421902074830',
      knowsAbout: SKILLS.map((g) => g.name.en),
    });
  });

  it('404 head: noindex, no canonical or hreflang', () => {
    const doc = parseHead(buildNotFoundHeadTags(FONTS));
    expect(attrs(doc, 'meta[name="robots"]', 'content')).toEqual(['noindex']);
    expect(doc.querySelectorAll('link[rel="canonical"], link[hreflang], script')).toHaveLength(0);
  });
});

describe('serializeJsonLd', () => {
  it('escapes every "<" so content cannot close the script element', () => {
    const json = serializeJsonLd({ ...personJsonLd('sk'), name: '</script><script>alert(1)</script><!--' });
    expect(json).not.toContain('<');
    expect(JSON.parse(json).name).toBe('</script><script>alert(1)</script><!--');
  });
});

describe('buildSitemap', () => {
  it('lists both pages with lastmod and the full alternate set', () => {
    const xml = buildSitemap('2026-10-02');
    expect(xml.match(/<loc>[^<]+<\/loc>/g)).toEqual([
      '<loc>https://denisvarga.sk/</loc>',
      '<loc>https://denisvarga.sk/en/</loc>',
    ]);
    expect(xml.match(/<lastmod>2026-10-02<\/lastmod>/g)).toHaveLength(2);
    expect(xml.match(/<xhtml:link rel="alternate" hreflang="x-default"/g)).toHaveLength(2);
  });

  it('rejects a malformed date', () => {
    expect(() => buildSitemap('2026-10-02T00:00')).toThrow('Invalid sitemap date');
  });
});
