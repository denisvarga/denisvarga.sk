import { stat } from 'node:fs/promises';
import { chromium, type Browser } from '@playwright/test';
import sharp from 'sharp';
import { preview } from 'vite';
import { copyEn } from '../src/i18n/copy-en';
import { copySk } from '../src/i18n/copy-sk';
import { SITE_URL, headCopy } from '../src/i18n/head-copy';
import type { Lang } from '../src/i18n/types';
import { OG_IMAGES, OG_IMAGE_SIZE } from '../src/seo/head-tags';

// Screenshots the built hero (portrait, particle sphere, Manrope) with share-card copy in place of
// the CTAs, so the OG images stay faithful to the site. Needs a fresh `pnpm build`; the images land
// in public/, so build again before deploying.

const { width: WIDTH, height: HEIGHT } = OG_IMAGE_SIZE;
const SCALE = 2;
// Own port, so a `pnpm preview` already running on 4173 never collides.
const PORT = 4179;
// The GL intro burst runs 2.6 s and the scene eases toward its targets by a fixed share per
// frame, so settling is counted in frames as well as time (SwiftShader can drop below 60 fps).
const SETTLE_MS = 4000;
const SETTLE_FRAMES = 240;
// Particles are the only large accent-coloured area; the sub-line dot alone stays far below this.
const MIN_ACCENT_PIXELS = 1500;

interface OgCard {
  readonly lang: Lang;
  readonly sub: string;
  readonly title: readonly [light: string, bold: string];
  readonly lead: string;
  readonly note: string;
}

declare global {
  interface Window {
    ogSettle?: { frames: number; start: number };
  }
}

const DOMAIN = new URL(SITE_URL).host;
const CARDS: readonly OgCard[] = [
  {
    lang: 'sk',
    sub: DOMAIN,
    title: ['Denis', 'Varga'],
    lead: copySk.hero.sub,
    note: 'Webové aplikácie, AI agenti a interné nástroje',
  },
  {
    lang: 'en',
    sub: DOMAIN,
    title: ['Denis', 'Varga'],
    lead: copyEn.hero.sub,
    note: 'Web apps, AI agents and internal tools',
  },
];

// Capture-only layout for the 1200x630 frame; the shipped CSS is untouched. Content stays inside
// the central 1100x580 so platform crops never cut it. The hero keeps exactly one viewport of
// height, like on desktop, because the next section's position drives the particle morph.
const CAPTURE_CSS = `
[data-og-hide] { display: none !important; }
html, body { overflow: hidden !important; }
[data-og='hero'] { box-sizing: border-box; height: ${HEIGHT}px; min-height: 0; padding: 0 0 0 84px; }
[data-og='inner'] { max-width: none; margin: 0; }
[data-og='text'] { flex: 0 0 560px; max-width: 560px; gap: 0; }
[data-og='sub'] { display: flex; align-items: center; gap: 12px; font-size: 20px; color: var(--grey-600); }
[data-og='sub']::before { content: ''; flex: none; width: 10px; height: 10px; border-radius: 50%; background: var(--acc); }
[data-og='title'] { margin-top: 30px; font-size: 118px; line-height: 0.94; }
[data-og='title'] .word-mask { display: block; width: fit-content; }
[data-og='lead'] { margin-top: 34px; font-size: 30px; line-height: 1.25; }
[data-og='note'] { margin-top: 14px; font-size: 21px; color: var(--grey-600); }
[data-og='overlay'] { padding: 0; }
[data-og='portrait'] { top: auto; bottom: -86px; right: -22px; width: 640px; transform: none; }
`;

// Runs in the page, serialised by Playwright: no nested named functions, tsx would wrap them in a
// helper the page lacks.
function applyCard(card: OgCard): void {
  const canvas = document.querySelector('canvas');
  const hero = document.querySelector('main section[data-sec]');
  const title = hero?.querySelector('h1');
  const text = title?.parentElement;
  const sub = text?.firstElementChild;
  const lead = text?.querySelector('p');
  const pulse = text?.querySelector('[data-pulse]');
  const note = pulse?.parentElement;
  const noteText = note?.querySelector('span:not([data-pulse])');
  const ctas = text?.querySelector('button')?.parentElement;
  const hidden = title?.querySelector('.visually-hidden');
  const words = [...(title?.querySelectorAll('.word') ?? [])];
  const portrait = [...(hero?.querySelectorAll('[data-heroimg]') ?? [])]
    .find((img) => img.getBoundingClientRect().width > 0)
    ?.closest('[data-enter]');
  const overlay = portrait?.parentElement?.parentElement;
  const parts = { canvas, hero, title, text, sub, lead, pulse, note, noteText, ctas, hidden, portrait, overlay };
  const missing = Object.entries(parts).filter(([, el]) => !el).map(([name]) => name);
  if (words.length < 2) missing.push('title words');
  if (missing.length > 0) throw new Error(`hero markup changed, missing: ${missing.join(', ')}`);

  // Hides the fixed chrome (header, menu, progress bar, chat) without relying on hashed class
  // names: every sibling along the paths to the hero and the GL canvas, except the later sections,
  // which stay in the layout below the fold.
  const keep = new Set<Element>();
  for (const leaf of [hero!, canvas!]) {
    for (let el: Element | null = leaf; el && el !== document.body; el = el.parentElement) keep.add(el);
  }
  keep.delete(hero!);
  for (const el of keep) {
    for (const sibling of el.parentElement?.children ?? []) if (!keep.has(sibling)) sibling.setAttribute('data-og-hide', '');
  }
  for (const el of [ctas!, pulse!, ...words.slice(1, -1).map((w) => w.parentElement!)]) el.setAttribute('data-og-hide', '');

  const marks: Array<[Element, string]> = [
    [hero!, 'hero'], [text!.parentElement!, 'inner'], [text!, 'text'], [sub!, 'sub'], [title!, 'title'],
    [lead!, 'lead'], [note!, 'note'], [overlay!, 'overlay'], [portrait!, 'portrait'],
  ];
  for (const [el, name] of marks) el.setAttribute('data-og', name);

  sub!.textContent = card.sub;
  words[0]!.textContent = card.title[0];
  words.at(-1)!.textContent = card.title[1];
  hidden!.textContent = card.title.join(' ');
  lead!.textContent = card.lead;
  noteText!.textContent = card.note;
}

async function capture(browser: Browser, base: string, card: OgCard): Promise<Buffer> {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: SCALE,
    // The site CSP has no 'unsafe-inline' for styles; the capture CSS is injected inline.
    bypassCSP: true,
  });
  try {
    const page = await context.newPage();
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    const url = new URL(headCopy[card.lang].path, base).href;
    const response = await page.goto(url, { waitUntil: 'load' });
    if (!response?.ok()) throw new Error(`${url}: HTTP ${response?.status() ?? 'no response'}`);
    // data-in on the hero marks a finished entrance, so hydration is done and nothing re-renders.
    await page.waitForSelector('main section[data-sec][data-in]', { timeout: 15_000 });
    await page.waitForSelector('canvas', { state: 'attached', timeout: 15_000 });

    await page.evaluate(applyCard, card);
    await page.addStyleTag({ content: CAPTURE_CSS });
    // Re-measures the layout cache, which places the particle sphere on the moved portrait.
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));

    const glyphs = [card.sub, ...card.title, card.lead, card.note].join(' ');
    await page.evaluate(async (sample) => {
      await Promise.all(['300', '400', '500', '600'].map((weight) => document.fonts.load(`${weight} 40px Manrope`, sample)));
      await document.fonts.ready;
    }, glyphs);

    await page.evaluate(() => {
      window.ogSettle = { frames: 0, start: performance.now() };
    });
    await page.waitForFunction(
      ({ frames, ms }) => {
        const settle = window.ogSettle!;
        settle.frames += 1;
        return settle.frames >= frames && performance.now() - settle.start >= ms;
      },
      { frames: SETTLE_FRAMES, ms: SETTLE_MS },
      { polling: 'raf', timeout: 60_000 },
    );

    if (pageErrors.length > 0) throw new Error(`${url}: page errors: ${pageErrors.join('; ')}`);
    return await page.screenshot({ type: 'png' });
  } finally {
    await context.close();
  }
}

async function accentPixels(image: Buffer): Promise<number> {
  const { data, info } = await sharp(image).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let count = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i]!, g = data[i + 1]!, b = data[i + 2]!;
    if (r > 200 && g > 70 && g < 150 && b < 110) count++;
  }
  return count;
}

async function main(): Promise<void> {
  await stat('dist/client/index.html').catch(() => {
    throw new Error('dist/client/index.html missing: run `pnpm build` first');
  });

  const server = await preview({ preview: { port: PORT, strictPort: true, open: false }, logLevel: 'warn' });
  let browser: Browser | null = null;
  try {
    const base = server.resolvedUrls?.local[0] ?? `http://localhost:${PORT}/`;
    browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    for (const card of CARDS) {
      const out = `public${OG_IMAGES[card.lang].path}`;
      const shot = await capture(browser, base, card);
      const accent = await accentPixels(shot);
      if (accent < MIN_ACCENT_PIXELS) throw new Error(`${out}: particle sphere did not render (${accent} accent pixels)`);
      const info = await sharp(shot)
        .resize(WIDTH, HEIGHT, { kernel: 'lanczos3' })
        .jpeg({ quality: 86, progressive: true, mozjpeg: true })
        .toFile(out);
      console.log(`${out}: ${info.width}x${info.height}, ${(info.size / 1024).toFixed(1)} KB, ${accent} accent px`);
    }
  } finally {
    await browser?.close();
    await server.close();
  }
}

await main();
