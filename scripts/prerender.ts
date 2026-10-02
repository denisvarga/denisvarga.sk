import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import type { CvAssets } from '../src/cv/cv-html';
import { LANGS, type Lang } from '../src/i18n/types';
import { buildHeadTags, buildNotFoundHeadTags, type HeadAssets } from '../src/seo/head-tags';
import { buildSitemap } from '../src/seo/sitemap';

const CLIENT_DIR = 'dist/client';
const SSR_DIR = 'dist-ssr';
// Outside dist/client, so the CV print sources never deploy; scripts/build-cv-pdf.ts reads them.
const CV_DIR = 'dist/cv-src';
const PRELOADED_FONTS = [/^manrope-latin-wght-normal-[\w-]+\.woff2$/, /^manrope-latin-ext-wght-normal-[\w-]+\.woff2$/];
const PROFILE_PORTRAIT = /^denis-cutout-1024-[\w-]+\.webp$/;
const CV_PORTRAIT = /^denis-cutout-640-[\w-]+\.webp$/;
// 25 mm at about 360 dpi. Chromium passes a JPEG into the PDF as is, but re-encodes a WebP with
// alpha losslessly (about 240 KB), so the portrait is flattened onto the site's --bg colour.
const CV_PORTRAIT_PX = 360;
const PORTRAIT_BG = '#ecece9';
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

// Hashed asset names exist only after the client build, so they are resolved from dist.
const builtAssets = await readdir(join(CLIENT_DIR, 'assets'));
function assetName(pattern: RegExp): string {
  const matches = builtAssets.filter((name) => pattern.test(name));
  if (matches.length !== 1) throw new Error(`Expected one asset for ${pattern}, found ${matches.length}`);
  return `${matches[0]}`;
}

const entryFile = (await readdir(SSR_DIR)).find((f) => /^entry-prerender\.m?js$/.test(f));
if (!entryFile) throw new Error(`No entry-prerender bundle in ${SSR_DIR}/`);

const { renderApp, renderNotFound, renderCvHtml, buildLlmsTxt, buildLlmsFullTxt } = (await import(
  pathToFileURL(join(SSR_DIR, entryFile)).href
)) as typeof import('../src/entry-prerender');

const template = await readFile(join(CLIENT_DIR, 'index.html'), 'utf8');
const siteAsset = (pattern: RegExp) => `/assets/${assetName(pattern)}`;
const assets: HeadAssets = { fonts: PRELOADED_FONTS.map(siteAsset), portrait: siteAsset(PROFILE_PORTRAIT) };

const pages: ReadonlyArray<{ lang: Lang; file: string }> = [
  { lang: 'sk', file: 'index.html' },
  { lang: 'en', file: 'en/index.html' },
];
for (const { lang, file } of pages) {
  const html = fillTemplate(template, lang, buildHeadTags(lang, assets), await renderApp(lang));
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
  fillTemplate(staticTemplate, 'sk', buildNotFoundHeadTags(assets.fonts), await renderNotFound()),
);
console.log('prerendered: 404.html');

// sv-SE formats as YYYY-MM-DD; the site's timezone decides the date, not the build machine's.
const buildDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Bratislava' }).format(new Date());
await writeFile(join(CLIENT_DIR, 'sitemap.xml'), buildSitemap(buildDate));
console.log(`sitemap.xml: lastmod ${buildDate}`);

await writeFile(join(CLIENT_DIR, 'llms.txt'), buildLlmsTxt());
await writeFile(join(CLIENT_DIR, 'llms-full.txt'), buildLlmsFullTxt());
console.log('llms.txt, llms-full.txt');

// Self-contained, so the PDF generator can open the pages over file:// with relative URLs.
const cvAssets: CvAssets = { fontDir: 'fonts', portrait: 'portrait.jpg' };
await rm(CV_DIR, { recursive: true, force: true });
await mkdir(CV_DIR, { recursive: true });
await cp('src/cv/fonts', join(CV_DIR, cvAssets.fontDir), { recursive: true });
await sharp(join(CLIENT_DIR, 'assets', assetName(CV_PORTRAIT)))
  .flatten({ background: PORTRAIT_BG })
  .resize(CV_PORTRAIT_PX, CV_PORTRAIT_PX)
  .jpeg({ quality: 84 })
  .toFile(join(CV_DIR, cvAssets.portrait));
const generatedAt = new Date();
for (const lang of LANGS) {
  await writeFile(join(CV_DIR, `cv-${lang}.html`), await renderCvHtml(lang, cvAssets, generatedAt));
}
console.log(`cv-src: ${LANGS.map((lang) => `cv-${lang}.html`).join(', ')}`);

await rm(SSR_DIR, { recursive: true, force: true });
