import { mkdir, mkdtemp, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { checkDist, localAssetPath } from './check-dist';

let dist: string;

const page = (lang: string, canonical: string | null, body = '<p class="_p_1">x</p>') => `<!doctype html>
<html lang="${lang}">
  <head>
    <!-- comment with "quotes" and <tags style="x"> -->
    ${canonical ? `<link rel="canonical" href="${canonical}">` : ''}
    ${
      canonical
        ? [
            ['sk', 'https://denisvarga.sk/'],
            ['en', 'https://denisvarga.dev/'],
            ['x-default', 'https://denisvarga.sk/'],
          ]
            .map(([h, href]) => `<link rel="alternate" hreflang="${h}" href="${href}">`)
            .join('')
        : ''
    }
    <link rel="preload" href="/assets/manrope-latin-wght-normal-A1.woff2" as="font" type="font/woff2" crossorigin>
    <script type="application/ld+json">{"name":"\\u003c/script>"}</script>
    <script type="module" crossorigin src="/assets/index-A1.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-A1.css">
  </head>
  <body><div id="root">${body}</div></body>
</html>`;

const FIXTURE: Record<string, string> = {
  'client/index.html': page('sk', 'https://denisvarga.sk/'),
  'client/en/index.html': page('en', 'https://denisvarga.dev/'),
  'client/404.html': page('sk', null, '<a class="_p_1" href="https://denisvarga.dev/">x</a>'),
  'client/assets/index-A1.css': '._p_1{color:red}._img_2{width:1px}',
  'client/assets/index-A1.js': '',
  'client/assets/manrope-latin-wght-normal-A1.woff2': '',
  'client/assets/hero-640.webp': '',
  'client/assets/hero-1024.webp': '',
  'client/_headers': '',
  'client/robots.txt': '',
  'client/sitemap.xml': '',
  'client/llms.txt': '',
  'client/llms-full.txt': '',
  'client/humans.txt': '',
  'client/.well-known/security.txt': '',
  'client/og-image.jpg': '',
  'client/og-image-en.jpg': '',
  'client/favicon.svg': '',
  'client/apple-touch-icon.png': '',
  'client/cv/denis-varga-cv.pdf': '',
  'client/cv/denis-varga-cv-en.pdf': '',
  'denisvarga_sk/index.js': '',
};

async function put(path: string, content: string): Promise<void> {
  await mkdir(dirname(join(dist, path)), { recursive: true });
  await writeFile(join(dist, path), content);
}

beforeEach(async () => {
  dist = await mkdtemp(join(tmpdir(), 'check-dist-'));
  for (const [path, content] of Object.entries(FIXTURE)) await put(path, content);
});

afterEach(() => rm(dist, { recursive: true, force: true }));

const withBody = (body: string) => put('client/index.html', page('sk', 'https://denisvarga.sk/', body));

describe('checkDist', () => {
  it('passes a clean fixture (comments and JSON-LD are ignored)', async () => {
    expect(await checkDist(dist)).toEqual([]);
  });

  it('rule 1: a style attribute', async () => {
    await withBody('<p class="_p_1" style="color:red">x</p>');
    expect(await checkDist(dist)).toEqual(['client/index.html: style attribute (blocked by CSP)']);
  });

  it('rule 2: an inline script that is not JSON-LD', async () => {
    await withBody('<script>alert(1)</script><script type="module">x()</script>');
    expect(await checkDist(dist)).toEqual(['client/index.html: inline <script> (no src, not application/ld+json)']);
  });

  it('rule 3: a missing artifact', async () => {
    await unlink(join(dist, 'client/.well-known/security.txt'));
    expect(await checkDist(dist)).toEqual(['missing artifact: client/.well-known/security.txt']);
  });

  it('rule 4: wrong lang, missing canonical, wrong hreflang count', async () => {
    await put('client/en/index.html', page('sk', 'https://denisvarga.dev/'));
    await put('client/index.html', page('sk', null));
    expect(await checkDist(dist)).toEqual([
      'client/index.html: canonical [], expected https://denisvarga.sk/',
      'client/index.html: hreflang [], expected en,sk,x-default',
      'client/en/index.html: <html lang="sk">, expected "en"',
    ]);
  });

  it('rule 4: the English page canonical on the Slovak domain', async () => {
    await put('client/en/index.html', page('en', 'https://denisvarga.sk/en/'));
    expect(await checkDist(dist)).toEqual([
      'client/en/index.html: canonical ["https://denisvarga.sk/en/"], expected https://denisvarga.dev/',
    ]);
  });

  it('rule 4: a canonical on the 404 page', async () => {
    await put('client/404.html', page('sk', 'https://denisvarga.sk/'));
    expect(await checkDist(dist)).toHaveLength(2);
  });

  it('rule 5: an unknown class and missing src, srcset and preload targets', async () => {
    await withBody(
      '<img class="_img_2 _gone_3" src="/assets/hero-640.webp" srcset="/assets/hero-640.webp 640w, /assets/nope-1024.webp 1024w">' +
        '<img src="/assets/missing.avif"><a href="#top">a</a><a href="mailto:x@y.z">m</a><a href="https://github.com/x">g</a>',
    );
    await unlink(join(dist, 'client/assets/manrope-latin-wght-normal-A1.woff2'));
    const failures = await checkDist(dist);
    expect(failures).toContain('client/index.html: class "_gone_3" not found in any assets/*.css');
    expect(failures).toContain('client/index.html: /assets/nope-1024.webp does not exist');
    expect(failures).toContain('client/index.html: /assets/missing.avif does not exist');
    expect(failures).toContain('client/404.html: /assets/manrope-latin-wght-normal-A1.woff2 does not exist');
    expect(failures).toHaveLength(6);
  });

  it('rule 6: .dev.vars under client always, elsewhere in dist only with --deploy', async () => {
    await put('denisvarga_sk/.dev.vars', 'SECRET=1');
    expect(await checkDist(dist)).toEqual([]);
    expect(await checkDist(dist, { deploy: true })).toEqual(['denisvarga_sk/.dev.vars: .dev.vars must not ship']);
    await put('client/.dev.vars.production', 'SECRET=1');
    expect(await checkDist(dist)).toEqual(['client/.dev.vars.production: .dev.vars must not ship']);
  });

  it('rule 7: source maps, .env files and wrangler configs under client', async () => {
    await put('client/assets/index-A1.js.map', '{}');
    await put('client/.env.production', 'X=1');
    await put('client/wrangler.json', '{}');
    await put('client/nested/wrangler.jsonc', '{}');
    expect((await checkDist(dist)).toSorted()).toEqual([
      'client/.env.production: .env file must not ship',
      'client/assets/index-A1.js.map: source map must not ship',
      'client/nested/wrangler.jsonc: wrangler config must not ship',
      'client/wrangler.json: wrangler config must not ship',
    ]);
  });

  it('rule 7: the Worker source map and config outside client stay allowed', async () => {
    await put('denisvarga_sk/index.js.map', '{}');
    await put('denisvarga_sk/wrangler.json', '{}');
    expect(await checkDist(dist, { deploy: true })).toEqual([]);
  });

  it('rule 8: secrets in shipped text files, reported without the matched value', async () => {
    const openAi = `sk-proj-${'a1_B-'.repeat(6)}`;
    const turnstile = `0x4AAAAAAA${'b2_C-'.repeat(6)}`;
    await put('client/assets/index-A1.js', `use("${openAi}")`);
    await put('client/humans.txt', '-----BEGIN PRIVATE KEY-----');
    await put('client/sitemap.xml', `<x>${turnstile}</x>`);
    await put('client/og-image.jpg', openAi);
    expect((await checkDist(dist)).toSorted()).toEqual([
      'client/assets/index-A1.js: looks like an OpenAI API key',
      'client/humans.txt: looks like a private key',
      'client/sitemap.xml: looks like a Turnstile secret key',
    ]);
  });

  it('rule 8: the public Turnstile site key and "sk-" inside CSS names pass', async () => {
    await put(
      'client/assets/index-A1.js',
      `render({sitekey:"0x4AAAAAAA${'x'.repeat(14)}"});el.style.setProperty("--tw-mask-linear-from-position","0")`,
    );
    expect(await checkDist(dist)).toEqual([]);
  });
});

describe('localAssetPath', () => {
  it.each([
    ['/', '/index.html'],
    ['/en/', '/en/index.html'],
    ['/assets/a.css?v=1#x', '/assets/a.css'],
    ['https://denisvarga.sk/og-image.jpg', '/og-image.jpg'],
    ['https://denisvarga.sk/', '/index.html'],
    ['https://denisvarga.dev/', '/en/index.html'],
    ['https://denisvarga.dev/?ref=x', '/en/index.html'],
    ['https://denisvarga.dev/og-image-en.jpg', '/og-image-en.jpg'],
    ['https://denisvarga.sk.evil.example/', null],
    ['//cdn.example.com/a.js', null],
    ['https://github.com/denisvarga', null],
    ['#top', null],
    ['mailto:hello@denisvarga.sk', null],
    ['mailto:hello@denisvarga.dev', null],
  ])('%s -> %s', (url, expected) => {
    expect(localAssetPath(url)).toBe(expected);
  });
});
