import { describe, expect, it } from 'vitest';
import { SKILLS, skillLabel } from '../data/skills';
import { buildHeadTags, buildNotFoundHeadTags, type HeadAssets } from './head-tags';
import { knowsAbout, profileJsonLd, serializeJsonLd } from './json-ld';
import { buildSitemap } from './sitemap';

const FONTS = ['/assets/manrope-latin-wght-normal-abc.woff2', '/assets/manrope-latin-ext-wght-normal-def.woff2'];
const PORTRAIT = '/assets/denis-cutout-1024-Ab_1.webp';
const ASSETS: HeadAssets = { fonts: FONTS, portrait: PORTRAIT };

function parseHead(html: string): Document {
  return new DOMParser().parseFromString(`<!doctype html><html><head>${html}</head></html>`, 'text/html');
}

const attrs = (doc: Document, selector: string, attr: string) =>
  [...doc.querySelectorAll(selector)].map((el) => el.getAttribute(attr));

describe('buildHeadTags', () => {
  it.each([
    ['sk', 'https://denisvarga.sk/', 'sk_SK', 'en_US'],
    ['en', 'https://denisvarga.dev/', 'en_US', 'sk_SK'],
  ] as const)('%s: canonical on its own domain, the three hreflang links and OG locale', (lang, canonical, locale, alternate) => {
    const doc = parseHead(buildHeadTags(lang, ASSETS));
    expect(attrs(doc, 'link[rel="canonical"]', 'href')).toEqual([canonical]);
    const hreflang = [...doc.querySelectorAll('link[rel="alternate"][hreflang]')].map((el) => [
      el.getAttribute('hreflang'),
      el.getAttribute('href'),
    ]);
    expect(hreflang).toEqual([
      ['sk', 'https://denisvarga.sk/'],
      ['en', 'https://denisvarga.dev/'],
      ['x-default', 'https://denisvarga.sk/'],
    ]);
    expect(attrs(doc, 'meta[property="og:url"]', 'content')).toEqual([canonical]);
    expect(attrs(doc, 'meta[property="og:locale"]', 'content')).toEqual([locale]);
    expect(attrs(doc, 'meta[property="og:locale:alternate"]', 'content')).toEqual([alternate]);
    expect(attrs(doc, 'meta[property="og:site_name"]', 'content')).toEqual(['Denis Varga']);
  });

  it.each([
    ['sk', 'https://denisvarga.sk/og-image.jpg?v=2026-10-04', /^Denis Varga, AI developer pre automatizáciu procesov\./],
    ['en', 'https://denisvarga.dev/og-image-en.jpg?v=2026-10-04', /^Denis Varga, AI developer for process automation\./],
  ] as const)('%s: its own share image for Open Graph and X, with size and alt text', (lang, url, alt) => {
    const doc = parseHead(buildHeadTags(lang, ASSETS));
    expect(attrs(doc, 'meta[property="og:image"]', 'content')).toEqual([url]);
    expect(attrs(doc, 'meta[name="twitter:image"]', 'content')).toEqual([url]);
    expect(attrs(doc, 'meta[property="og:image:width"]', 'content')).toEqual(['1200']);
    expect(attrs(doc, 'meta[property="og:image:height"]', 'content')).toEqual(['630']);
    const alts = [...attrs(doc, 'meta[property="og:image:alt"]', 'content'), ...attrs(doc, 'meta[name="twitter:image:alt"]', 'content')];
    expect(alts).toHaveLength(2);
    expect(new Set(alts).size).toBe(1);
    expect(alts[0]).toMatch(alt);
  });

  it.each([
    [
      'sk',
      'Denis Varga | AI developer pre automatizáciu procesov',
      'Webové aplikácie, AI agenti a interné nástroje. Vyvíjam od roku 2017, dnes AI-first s Claude Code, Codexom a MCP. Otvorený projektom aj pozíciám.',
    ],
    [
      'en',
      'Denis Varga | AI developer for process automation',
      'Web apps, AI agents and internal tools. Building software since 2017, now AI-first with Claude Code, Codex and MCP. Open to projects and roles.',
    ],
  ] as const)('%s: the approved title and description in the page and OG tags', (lang, title, description) => {
    const doc = parseHead(buildHeadTags(lang, ASSETS));
    expect(doc.title).toBe(title);
    expect(attrs(doc, 'meta[property="og:title"]', 'content')).toEqual([title]);
    expect(attrs(doc, 'meta[name="description"], meta[property="og:description"]', 'content')).toEqual([
      description,
      description,
    ]);
  });

  it('emits icons and both font preloads, but no charset or viewport', () => {
    const html = buildHeadTags('sk', ASSETS);
    const doc = parseHead(html);
    expect(attrs(doc, 'meta[name="twitter:card"]', 'content')).toEqual(['summary_large_image']);
    expect(attrs(doc, 'meta[name="theme-color"]', 'content')).toEqual(['#ECECE9']);
    expect(attrs(doc, 'link[rel="icon"]', 'href')).toEqual(['/favicon.svg']);
    expect(attrs(doc, 'link[rel="apple-touch-icon"]', 'href')).toEqual(['/apple-touch-icon.png']);
    expect(attrs(doc, 'link[rel="preload"][as="font"][crossorigin]', 'href')).toEqual(FONTS);
    expect(html).toMatch(/^<!--/);
    expect(html).toContain('Ahoj, zvedavec. / Hi, curious one.');
    expect(html).toContain('sudo hire denis');
    expect(html).toContain('hello@denisvarga.sk / hello@denisvarga.dev');
    expect(html).not.toMatch(/charset|viewport/);
  });

  it.each([
    ['sk', 'https://denisvarga.sk/', 'AI developer pre automatizáciu procesov', 'hello@denisvarga.sk'],
    ['en', 'https://denisvarga.dev/', 'AI developer for process automation', 'hello@denisvarga.dev'],
  ] as const)('%s: WebSite and ProfilePage JSON-LD for the one Person', (lang, url, jobTitle, email) => {
    const doc = parseHead(buildHeadTags(lang, ASSETS));
    const scripts = doc.querySelectorAll('script');
    expect(scripts).toHaveLength(1);
    expect(scripts[0]!.type).toBe('application/ld+json');
    const data = JSON.parse(scripts[0]!.textContent ?? '');
    expect(data['@context']).toBe('https://schema.org');
    const [website, profile] = data['@graph'];
    expect(website).toEqual({
      '@type': 'WebSite',
      '@id': `${url}#website`,
      url,
      name: 'Denis Varga',
      alternateName: new URL(url).host,
      inLanguage: lang,
    });
    expect(profile).toMatchObject({ '@type': 'ProfilePage', url, inLanguage: lang, isPartOf: { '@id': `${url}#website` } });
    const person = profile.mainEntity;
    expect(person).toMatchObject({
      '@type': 'Person',
      '@id': 'https://denisvarga.sk/#person',
      name: 'Denis Varga',
      url,
      image: `${url.slice(0, -1)}${PORTRAIT}`,
      jobTitle,
      email: `mailto:${email}`,
      telephone: '+421902074830',
      sameAs: ['https://github.com/denisvarga', 'https://www.linkedin.com/in/denisvarg/'],
      address: { '@type': 'PostalAddress', addressLocality: 'Bratislava', addressCountry: 'SK' },
      knowsLanguage: ['sk', 'en'],
      knowsAbout: knowsAbout(lang),
    });
    expect(person.worksFor).toEqual([
      { '@type': 'Organization', name: 'Vibration s.r.o.', url: 'https://vibration.sk/' },
    ]);
    expect(person).not.toHaveProperty('alumniOf');
  });

  it('knowsAbout lists concrete skills that the page shows in that language', () => {
    for (const lang of ['sk', 'en'] as const) {
      const skills = knowsAbout(lang);
      const visible = new Set(SKILLS.flatMap((group) => group.items.map((item) => skillLabel(item, lang))));
      expect(skills).toEqual(expect.arrayContaining(['Claude Code', 'RAG', 'React', 'Next.js', 'TypeScript', 'WordPress']));
      expect(skills.filter((skill) => !visible.has(skill))).toEqual([]);
      expect(new Set(skills).size).toBe(skills.length);
    }
    expect(knowsAbout('sk')).toContain('Multi-agent orchestrácia');
    expect(knowsAbout('en')).toContain('Multi-agent orchestration');
  });

  it('404 head: noindex, no canonical or hreflang', () => {
    const doc = parseHead(buildNotFoundHeadTags(FONTS));
    expect(attrs(doc, 'meta[name="robots"]', 'content')).toEqual(['noindex']);
    expect(doc.querySelectorAll('link[rel="canonical"], link[hreflang], script')).toHaveLength(0);
  });
});

describe('serializeJsonLd', () => {
  it('escapes every "<" so content cannot close the script element', () => {
    const json = serializeJsonLd({ ...profileJsonLd('sk', PORTRAIT), name: '</script><script>alert(1)</script><!--' });
    expect(json).not.toContain('<');
    expect(JSON.parse(json).name).toBe('</script><script>alert(1)</script><!--');
  });
});

describe('buildSitemap', () => {
  it('lists both domains with lastmod and the full alternate set', () => {
    const xml = buildSitemap('2026-10-02');
    expect(xml.match(/<loc>[^<]+<\/loc>/g)).toEqual([
      '<loc>https://denisvarga.sk/</loc>',
      '<loc>https://denisvarga.dev/</loc>',
    ]);
    expect(xml.match(/<lastmod>2026-10-02<\/lastmod>/g)).toHaveLength(2);
    expect(xml.match(/<xhtml:link rel="alternate" hreflang="en" href="https:\/\/denisvarga\.dev\/"\/>/g)).toHaveLength(2);
    expect(xml.match(/<xhtml:link rel="alternate" hreflang="x-default" href="https:\/\/denisvarga\.sk\/"\/>/g)).toHaveLength(2);
  });

  it('rejects a malformed date', () => {
    expect(() => buildSitemap('2026-10-02T00:00')).toThrow('Invalid sitemap date');
  });
});
