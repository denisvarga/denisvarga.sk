import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

// Production origin -> the page dist/client serves at its root (the Worker maps "/" on
// denisvarga.dev to the English page); every other path maps 1:1 on both domains.
const SITE_ROOTS = new Map([
  ['https://denisvarga.sk', '/index.html'],
  ['https://denisvarga.dev', '/en/index.html'],
]);
const REQUIRED_ARTIFACTS = [
  'index.html',
  'en/index.html',
  '404.html',
  '_headers',
  'robots.txt',
  'sitemap.xml',
  'llms.txt',
  'llms-full.txt',
  'humans.txt',
  '.well-known/security.txt',
  'og-image.jpg',
  'og-image-en.jpg',
  'favicon.svg',
  'apple-touch-icon.png',
  'cv/denis-varga-cv.pdf',
  'cv/denis-varga-cv-en.pdf',
];
const PAGES = [
  { file: 'index.html', lang: 'sk', canonical: 'https://denisvarga.sk/' },
  { file: 'en/index.html', lang: 'en', canonical: 'https://denisvarga.dev/' },
  { file: '404.html', lang: 'sk', canonical: null },
] as const;
const HREFLANGS = ['en', 'sk', 'x-default'];
const TAG = /<([a-zA-Z][\w-]*)((?:\s+[^\s"'=/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/g;
const ATTR = /([^\s"'=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

interface Tag {
  readonly name: string;
  readonly attrs: ReadonlyMap<string, string>;
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(
    entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])),
  );
  return nested.flat();
}

const exists = (path: string) =>
  stat(path).then(
    () => true,
    () => false,
  );

export function parseTags(html: string): Tag[] {
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
  return [...withoutComments.matchAll(TAG)].map(([, name = '', attrText = '']) => ({
    name: name.toLowerCase(),
    attrs: new Map(
      [...attrText.matchAll(ATTR)].map(([, key = '', dq, sq, bare]) => [key.toLowerCase(), dq ?? sq ?? bare ?? '']),
    ),
  }));
}

// Local URL -> path inside dist/client, or null for external, anchor and protocol links.
export function localAssetPath(url: string): string | null {
  const origin = [...SITE_ROOTS.keys()].find((o) => url.startsWith(`${o}/`));
  const path = origin ? url.slice(origin.length) : url;
  if (origin && /^\/(?:[?#]|$)/.test(path)) return SITE_ROOTS.get(origin) ?? null;
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  const clean = decodeURIComponent(path.replace(/[?#].*$/, ''));
  return clean.endsWith('/') ? `${clean}index.html` : clean;
}

function urlsOf(tag: Tag): string[] {
  const urls = ['src', 'href'].flatMap((key) => (tag.attrs.has(key) ? [tag.attrs.get(key)!] : []));
  for (const key of ['srcset', 'imagesrcset']) {
    const value = tag.attrs.get(key);
    if (value) urls.push(...value.split(',').map((candidate) => candidate.trim().split(/\s+/)[0] ?? ''));
  }
  return urls.filter(Boolean);
}

export async function checkDist(distDir: string, { deploy = false } = {}): Promise<string[]> {
  const clientDir = join(distDir, 'client');
  const failures = new Set<string>();
  const clientFiles = await walk(clientDir);
  const htmlFiles = clientFiles.filter((f) => f.endsWith('.html'));
  const show = (file: string) => relative(distDir, file);

  for (const artifact of REQUIRED_ARTIFACTS) {
    if (!(await exists(join(clientDir, artifact)))) failures.add(`missing artifact: client/${artifact}`);
  }

  const cssClasses = new Set<string>();
  for (const file of clientFiles.filter((f) => /[/\\]assets[/\\][^/\\]+\.css$/.test(f))) {
    for (const [, name] of (await readFile(file, 'utf8')).matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) cssClasses.add(name!);
  }

  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    const tags = parseTags(html);
    if (tags.some((t) => t.attrs.has('style'))) failures.add(`${show(file)}: style attribute (blocked by CSP)`);

    for (const tag of tags.filter((t) => t.name === 'script')) {
      if (!tag.attrs.has('src') && tag.attrs.get('type') !== 'application/ld+json') {
        failures.add(`${show(file)}: inline <script> (no src, not application/ld+json)`);
      }
    }

    for (const tag of tags) {
      for (const name of (tag.attrs.get('class') ?? '').split(/\s+/).filter(Boolean)) {
        if (!cssClasses.has(name)) failures.add(`${show(file)}: class "${name}" not found in any assets/*.css`);
      }
      for (const url of urlsOf(tag)) {
        const path = localAssetPath(url);
        if (path && !(await exists(join(clientDir, path)))) failures.add(`${show(file)}: ${url} does not exist`);
      }
    }
  }

  for (const page of PAGES) {
    const path = join(clientDir, page.file);
    if (!(await exists(path))) continue;
    const tags = parseTags(await readFile(path, 'utf8'));
    const lang = tags.find((t) => t.name === 'html')?.attrs.get('lang');
    if (lang !== page.lang) failures.add(`client/${page.file}: <html lang="${lang}">, expected "${page.lang}"`);
    const links = tags.filter((t) => t.name === 'link');
    const canonicals = links.filter((t) => t.attrs.get('rel') === 'canonical').map((t) => t.attrs.get('href'));
    const hreflangs = links.filter((t) => t.attrs.get('rel') === 'alternate' && t.attrs.has('hreflang'));
    const expectedHreflangs = page.canonical ? HREFLANGS : [];
    const actualHreflangs = hreflangs.map((t) => t.attrs.get('hreflang')).toSorted();
    if (canonicals.join() !== (page.canonical ?? '')) {
      failures.add(`client/${page.file}: canonical ${JSON.stringify(canonicals)}, expected ${page.canonical}`);
    }
    if (actualHreflangs.join() !== expectedHreflangs.join()) {
      failures.add(`client/${page.file}: hreflang ${JSON.stringify(actualHreflangs)}, expected ${expectedHreflangs}`);
    }
  }

  for (const file of deploy ? await walk(distDir) : clientFiles) {
    if (/(^|[/\\])\.dev\.vars[^/\\]*$/.test(file)) failures.add(`${show(file)}: .dev.vars must not ship`);
  }

  return [...failures];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const failures = await checkDist('dist', { deploy: process.argv.includes('--deploy') });
  if (failures.length > 0) {
    console.error(`check-dist failed (${failures.length}):\n${failures.join('\n')}`);
    process.exit(1);
  }
  console.log('check-dist: ok');
}
