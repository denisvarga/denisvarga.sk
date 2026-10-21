import { describe, expect, it } from 'vitest';
import { SKILLS, skillLabel } from '../../shared/skills';
import { buildHeadTags, buildNotFoundHeadTags, type HeadAssets } from './head-tags';
import { knowsAbout, profileJsonLd, serializeJsonLd } from './json-ld';
import { buildSitemap, contentDateOr } from './sitemap';

const LATIN = '/assets/manrope-latin-wght-normal-abc.woff2';
const LATIN_EXT = '/assets/manrope-latin-ext-wght-normal-def.woff2';
const FONTS: HeadAssets['fonts'] = { sk: [LATIN, LATIN_EXT], en: [LATIN] };
const PORTRAIT = '/assets/denis-cutout-1024-Ab_1.webp';
const ASSETS: HeadAssets = { fonts: FONTS, portrait: PORTRAIT };
const CONTENT_DATE = '2026-10-19';

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
    const doc = parseHead(buildHeadTags(lang, ASSETS, CONTENT_DATE));
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
    ['sk', 'https://denisvarga.sk/og-image.jpg?v=2026-10-04', /^Denis Varga, AI a full-stack developer od nápadu po produkciu\./],
    ['en', 'https://denisvarga.dev/og-image-en.jpg?v=2026-10-04', /^Denis Varga, AI & full-stack developer from idea to production\./],
  ] as const)('%s: its own share image for Open Graph and X, with size and alt text', (lang, url, alt) => {
    const doc = parseHead(buildHeadTags(lang, ASSETS, CONTENT_DATE));
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
      'Denis Varga | AI a full-stack developer, Bratislava',
      'AI a full-stack developer z Bratislavy. Webové aplikácie, AI agenti, automatizácie, WordPress a WooCommerce. Od roku 2017, otvorený projektom aj pozíciám.',
    ],
    [
      'en',
      'Denis Varga | AI & full-stack developer, Slovakia',
      'AI & full-stack developer in Bratislava, Slovakia. Web apps, AI agents, automation, WordPress and WooCommerce. Since 2017, open to projects and roles.',
    ],
  ] as const)('%s: the approved title and description in the page and OG tags, within the snippet limits', (lang, title, description) => {
    const doc = parseHead(buildHeadTags(lang, ASSETS, CONTENT_DATE));
    expect(doc.title).toBe(title);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(attrs(doc, 'meta[property="og:title"]', 'content')).toEqual([title]);
    expect(attrs(doc, 'meta[name="description"], meta[property="og:description"]', 'content')).toEqual([
      description,
      description,
    ]);
  });

  it.each(['sk', 'en'] as const)('%s: lets search engines show a large image preview', (lang) => {
    const doc = parseHead(buildHeadTags(lang, ASSETS, CONTENT_DATE));
    expect(attrs(doc, 'meta[name="robots"]', 'content')).toEqual(['max-image-preview:large']);
  });

  it('emits icons and font preloads, but no charset or viewport', () => {
    const html = buildHeadTags('sk', ASSETS, CONTENT_DATE);
    const doc = parseHead(html);
    expect(attrs(doc, 'meta[name="twitter:card"]', 'content')).toEqual(['summary_large_image']);
    expect(attrs(doc, 'meta[name="theme-color"]', 'content')).toEqual(['#ECECE9']);
    expect(attrs(doc, 'link[rel="icon"]', 'href')).toEqual(['/favicon.ico', '/favicon.svg']);
    expect(attrs(doc, 'link[rel="icon"]', 'sizes')).toEqual(['48x48', null]);
    expect(attrs(doc, 'link[rel="apple-touch-icon"]', 'href')).toEqual(['/apple-touch-icon.png']);
    expect(attrs(doc, 'link[rel="preload"][as="font"][crossorigin]', 'href')).toEqual([LATIN, LATIN_EXT]);
    expect(html).toMatch(/^<!--/);
    expect(html).toContain('Ahoj, zvedavec. / Hi, curious one.');
    expect(html).toContain('sudo hire denis');
    expect(html).toContain('hello@denisvarga.sk / hello@denisvarga.dev');
    expect(html).not.toMatch(/charset|viewport/);
  });

  it.each([
    ['sk', [LATIN, LATIN_EXT]],
    ['en', [LATIN]],
  ] as const)('%s: preloads only the fonts its first screen needs', (lang, fonts) => {
    const doc = parseHead(buildHeadTags(lang, ASSETS, CONTENT_DATE));
    expect(attrs(doc, 'link[rel="preload"][as="font"]', 'href')).toEqual(fonts);
  });

  it.each([
    ['sk', 'https://denisvarga.sk/', 'AI a full-stack developer', 'hello@denisvarga.sk'],
    ['en', 'https://denisvarga.dev/', 'AI & full-stack developer', 'hello@denisvarga.dev'],
  ] as const)('%s: WebSite and ProfilePage JSON-LD for the one Person', (lang, url, jobTitle, email) => {
    const doc = parseHead(buildHeadTags(lang, ASSETS, CONTENT_DATE));
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
    expect(profile).toMatchObject({
      '@type': 'ProfilePage',
      url,
      inLanguage: lang,
      isPartOf: { '@id': `${url}#website` },
      dateModified: CONTENT_DATE,
    });
    const person = profile.mainEntity;
    expect(person).toMatchObject({
      '@type': 'Person',
      '@id': 'https://denisvarga.sk/#person',
      name: 'Denis Varga',
      url: 'https://denisvarga.sk/',
      image: `${url.slice(0, -1)}${PORTRAIT}`,
      jobTitle,
      email: `mailto:${email}`,
      telephone: '+421902074830',
      sameAs: [
        'https://github.com/denisvarga',
        'https://www.linkedin.com/in/denisvarg/',
        'https://denva.studio/autor/denis-varga/',
      ],
      address: { '@type': 'PostalAddress', addressLocality: 'Bratislava', addressCountry: 'SK' },
      knowsLanguage: ['sk', 'en'],
      knowsAbout: knowsAbout(lang),
    });
    expect(person.worksFor).toEqual([
      { '@type': 'Organization', name: 'Denva', url: 'https://denva.studio/' },
      { '@type': 'Organization', name: 'GrandPano', url: 'https://grandpano.sk/' },
      { '@type': 'Organization', name: 'Vibration s.r.o.', url: 'https://vibration.sk/' },
    ]);
    expect(person).not.toHaveProperty('alumniOf');
  });

  it('knowsAbout lists concrete skills that the page shows in that language', () => {
    for (const lang of ['sk', 'en'] as const) {
      const skills = knowsAbout(lang);
      const visible = new Set(SKILLS.flatMap((group) => group.items.map((item) => skillLabel(item, lang))));
      expect(skills).toEqual(
        expect.arrayContaining(['Claude Code', 'RAG', 'React', 'Next.js', 'TypeScript', 'WordPress', 'WooCommerce', 'PHP', 'Vue.js']),
      );
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

  it('404 head: preloads the fonts of both languages once each', () => {
    const doc = parseHead(buildNotFoundHeadTags({ sk: [LATIN, LATIN_EXT], en: [LATIN] }));
    expect(attrs(doc, 'link[rel="preload"][as="font"]', 'href')).toEqual([LATIN, LATIN_EXT]);
  });
});

describe('serializeJsonLd', () => {
  it('escapes every "<" so content cannot close the script element', () => {
    const json = serializeJsonLd({ ...profileJsonLd('sk', PORTRAIT, CONTENT_DATE), name: '</script><script>alert(1)</script><!--' });
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

describe('contentDateOr', () => {
  it('takes the printed commit date, without the trailing newline', () => {
    expect(contentDateOr('2026-10-19\n', '2026-10-21')).toBe('2026-10-19');
  });

  it.each(['', '\n', 'fatal: not a repository', '2026-10-19T10:00:00+02:00'])('falls back when the output is %j', (output) => {
    expect(contentDateOr(output, '2026-10-21')).toBe('2026-10-21');
  });
});
