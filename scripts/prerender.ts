import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Lang } from '../src/i18n/types';
import { buildHeadTags, buildNotFoundHeadTags } from '../src/seo/head-tags';
import { buildSitemap } from '../src/seo/sitemap';

const CLIENT_DIR = 'dist/client';
const SSR_DIR = 'dist-ssr';
const PRELOADED_FONTS = [/^manrope-latin-wght-normal-[\w-]+\.woff2$/, /^manrope-latin-ext-wght-normal-[\w-]+\.woff2$/];
const HTML_LANG = /<html lang="[a-z]+">/;
const MODULE_SCRIPT = /\s*<script type="module"[^>]*><\/script>/g;
const MODULE_PRELOAD = /\s*<link rel="modulepreload"[^>]*>/g;

function replaceOnce(html: string, search: string | RegExp, value: string): string {
  const count = typeof search === 'string' ? html.split(search).length - 1 : (html.match(search) ?? []).length;
  if (count !== 1) throw new Error(`Template must contain ${String(search)} exactly once, found ${count}`);
  return html.replace(search, () => value);
}

function fillTemplate(template: string, lang: Lang, head: string, body: string): string {
  const withLang = replaceOnce(template, HTML_LANG, `<html lang="${lang}">`);
  return replaceOnce(replaceOnce(withLang, '<!--app-head-->', head), '<!--app-html-->', body);
}

async function fontPreloads(): Promise<string[]> {
  const assets = await readdir(join(CLIENT_DIR, 'assets'));
  return PRELOADED_FONTS.map((pattern) => {
    const matches = assets.filter((name) => pattern.test(name));
    if (matches.length !== 1) throw new Error(`Expected one font asset for ${pattern}, found ${matches.length}`);
    return `/assets/${matches[0]}`;
  });
}

const entryFile = (await readdir(SSR_DIR)).find((f) => /^entry-prerender\.m?js$/.test(f));
if (!entryFile) throw new Error(`No entry-prerender bundle in ${SSR_DIR}/`);

const { renderApp, renderNotFound } = (await import(
  pathToFileURL(join(SSR_DIR, entryFile)).href
)) as typeof import('../src/entry-prerender');

const template = await readFile(join(CLIENT_DIR, 'index.html'), 'utf8');
const fonts = await fontPreloads();

const pages: ReadonlyArray<{ lang: Lang; file: string }> = [
  { lang: 'sk', file: 'index.html' },
  { lang: 'en', file: 'en/index.html' },
];
for (const { lang, file } of pages) {
  const html = fillTemplate(template, lang, buildHeadTags(lang, fonts), await renderApp(lang));
  await mkdir(join(CLIENT_DIR, file, '..'), { recursive: true });
  await writeFile(join(CLIENT_DIR, file), html);
  console.log(`prerendered: ${file}`);
}

// The 404 page is static: same stylesheet, no module script, nothing to hydrate.
const scriptCount = (template.match(MODULE_SCRIPT) ?? []).length;
if (scriptCount !== 1) throw new Error(`Expected one module script in the template, found ${scriptCount}`);
const staticTemplate = template.replace(MODULE_SCRIPT, '').replace(MODULE_PRELOAD, '');
await writeFile(
  join(CLIENT_DIR, '404.html'),
  fillTemplate(staticTemplate, 'sk', buildNotFoundHeadTags(fonts), await renderNotFound()),
);
console.log('prerendered: 404.html');

// sv-SE formats as YYYY-MM-DD; the site's timezone decides the date, not the build machine's.
const buildDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Bratislava' }).format(new Date());
await writeFile(join(CLIENT_DIR, 'sitemap.xml'), buildSitemap(buildDate));
console.log(`sitemap.xml: lastmod ${buildDate}`);

await rm(SSR_DIR, { recursive: true, force: true });
