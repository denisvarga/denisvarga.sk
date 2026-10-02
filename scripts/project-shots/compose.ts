import { access, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type Page } from '@playwright/test';
import sharp from 'sharp';
import { writeOverview, writeSampleJpgs, writeShipWebp } from './outputs.ts';
import { siteTint, toHex } from './palette.ts';
import { argList, domainOf, loadProjects, RAW_DIR, ROOT, SAMPLES_DIR, SHOTS_DIR, type ShotProject } from './project-list.ts';
import { CANVAS, renderHtml, VARIANTS, type Variant } from './templates.ts';

// Usage:
//   tsx scripts/project-shots/compose.ts [--only slug,slug] [--variants a,b,b-name]
//     samples: spikes/project-shots/samples/<slug>-<variant>.jpg plus the -4x3 rail crop
//   tsx scripts/project-shots/compose.ts --variants b-name --out spikes/project-shots/backup-b-name
//     one variant for every project (or --only) as <out>/<slug>.webp at 1280x800 plus <out>/overview-4x3.jpg
// Renders at 2x and downsamples with Lanczos so captured text stays crisp.

const HTML_DIR = `${SHOTS_DIR}/html`;
const FONTS_URL = pathToFileURL(`${ROOT}node_modules/@fontsource-variable`).href;
const REQUIRED_FONTS = ['JetBrains Mono Variable'];

function parseVariants(): Variant[] {
  const wanted = argList('--variants');
  if (wanted.length === 0) return [...VARIANTS];
  const bad = wanted.filter((v) => !(VARIANTS as readonly string[]).includes(v));
  if (bad.length > 0) throw new Error(`Unknown variant(s): ${bad.join(', ')}; use ${VARIANTS.join(', ')}`);
  return wanted as Variant[];
}

async function rawPaths(slug: string): Promise<{ desktop: string; mobile: string }> {
  const desktop = `${RAW_DIR}/${slug}-desktop.png`;
  const mobile = `${RAW_DIR}/${slug}-mobile.png`;
  await Promise.all([desktop, mobile].map((f) => access(f))).catch(() => {
    throw new Error(`${slug}: raw captures missing, run capture.ts --only ${slug} first`);
  });
  return { desktop, mobile };
}

async function renderVariant(page: Page, project: ShotProject, variant: Variant, tint: string): Promise<Buffer> {
  const { desktop, mobile } = await rawPaths(project.slug);
  const html = renderHtml({
    variant,
    desktopUrl: pathToFileURL(desktop).href,
    mobileUrl: pathToFileURL(mobile).href,
    domain: domainOf(project.url),
    name: project.name,
    tint,
    fontsUrl: FONTS_URL,
  });
  const htmlFile = `${HTML_DIR}/${project.slug}-${variant}.html`;
  await writeFile(htmlFile, html);
  await page.goto(pathToFileURL(htmlFile).href, { waitUntil: 'load' });
  const loaded = await page.evaluate(
    `Promise.all([...document.images].map((i) => i.decode()))
      .then(() => document.fonts.ready)
      .then(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family))`,
  );
  const families = Array.isArray(loaded) ? loaded.map(String) : [];
  const missing = REQUIRED_FONTS.filter((f) => !families.some((loadedFamily) => loadedFamily.includes(f)));
  if (missing.length > 0) throw new Error(`${project.slug}-${variant}: fonts not loaded: ${missing.join(', ')}`);

  return sharp(await page.screenshot({ type: 'png' })).resize(CANVAS.width, CANVAS.height, { kernel: 'lanczos3' }).png().toBuffer();
}

const variants = parseVariants();
const outArg = argList('--out')[0];
const outDir = outArg ? resolve(outArg) : null;
if (outDir && variants.length !== 1) throw new Error('--out takes exactly one --variants value');
const projects = await loadProjects(argList('--only'));
await mkdir(HTML_DIR, { recursive: true });
await mkdir(outDir ?? SAMPLES_DIR, { recursive: true });
const shipped: { label: string; file: string }[] = [];

// Full Chromium (new headless) instead of the headless shell: the shell rasterizes large blurred
// box-shadows per tile and leaves visible seams. The flag lets file:// pages load the @imported fonts.
const browser = await chromium.launch({ channel: 'chromium', headless: true, args: ['--allow-file-access-from-files'] });
const failures: string[] = [];
try {
  const context = await browser.newContext({ viewport: CANVAS, deviceScaleFactor: 2 });
  const page = await context.newPage();
  for (const project of projects) {
    try {
      const { dominant, tint } = await siteTint((await rawPaths(project.slug)).desktop);
      console.log(`${project.slug}: dominant ${toHex(dominant)} -> tint ${toHex(tint)}`);
      for (const variant of variants) {
        const full = await renderVariant(page, project, variant, toHex(tint));
        if (outDir) {
          const file = `${outDir}/${project.slug}.webp`;
          const bytes = await writeShipWebp(full, file);
          shipped.push({ label: project.name, file });
          console.log(`${file}: ${(bytes / 1024).toFixed(1)} KB`);
        } else {
          await writeSampleJpgs(full, `${SAMPLES_DIR}/${project.slug}-${variant}`);
          console.log(`${SAMPLES_DIR}/${project.slug}-${variant}.jpg (+ -4x3)`);
        }
      }
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  }
} finally {
  await browser.close();
}

if (failures.length > 0) {
  console.error(`compose failed:\n${failures.join('\n')}`);
  process.exitCode = 1;
} else if (outDir) {
  await writeOverview(shipped, `${outDir}/overview-4x3.jpg`);
  console.log(`${outDir}/overview-4x3.jpg`);
}
