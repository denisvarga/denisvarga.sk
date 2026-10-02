import { execFile } from 'node:child_process';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { despillAroundScreen } from './despill.ts';
import { frameAroundScreen, type FrameSpec, type Span } from './frame.ts';
import { writeSampleJpgs } from './outputs.ts';
import { argList, loadProjects, RAW_DIR, SHOTS_DIR } from './project-list.ts';
import { scenePrompt } from './scene-prompts.ts';
import { readCorners, renderOnScreen } from './screen-overlay.ts';
import { countKeyPixels, detectKeyedScreen } from './screen-quad.ts';

// Usage:
//   tsx scripts/project-shots/ai-scene.ts --generate --max-credits 26 [--only slug,slug]  (spends credits)
//   tsx scripts/project-shots/ai-scene.ts [--only slug,slug]                               (re-composite only)
//   tsx scripts/project-shots/ai-scene.ts --only slug --use-attempt 1                       (pick an older attempt)
// Every scene gets the real desktop capture warped onto its keyed screen, then a crop that puts the
// screen at the same size and position in all projects. Masters land in final/<slug>.png.

const execFileAsync = promisify(execFile);
const AI_DIR = `${SHOTS_DIR}/ai`;
const FINAL_DIR = `${SHOTS_DIR}/final`;
const ATTEMPTS_FILE = `${AI_DIR}/attempts.json`;
const CREDITS_LOG = `${AI_DIR}/credits-log.json`;
const MODEL = 'nano_banana_pro';
const CREDITS_PER_IMAGE = 2;
const MAX_ATTEMPTS_PER_PROJECT = 2;
const MASTER = { width: 1920, height: 1200 } as const;
// Screen height 36% of the frame gives every laptop the same apparent size (about 45 to 55% of the
// width depending on how far the model turned it). The model tends to draw laptops low, so the
// screen centre target (52% from the top) is where most scenes can actually reach.
const FRAME: FrameSpec = { screenHeight: 0.36, screenCenterY: 0.52, aspect: 1.6 };

// ai/<slug>-laptop.json holds the measured laptop span {left, right} in scene pixels.
async function readSpan(slug: string): Promise<Span | undefined> {
  const value = await readJson<unknown>(`${AI_DIR}/${slug}-laptop.json`, null);
  if (value === null) return undefined;
  const span = value as Partial<Span>;
  if (typeof span.left !== 'number' || typeof span.right !== 'number' || span.right <= span.left) {
    throw new Error(`${slug}-laptop.json: expected {"left": number, "right": number}`);
  }
  return { left: span.left, right: span.right };
}

// CLI failures can echo presigned upload URLs with temporary tokens; keep only a short message.
async function hf(args: string[], timeout: number): Promise<string> {
  try {
    const { stdout } = await execFileAsync('higgsfield', args, { timeout, maxBuffer: 16 * 1024 * 1024 });
    return stdout;
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr ?? '';
    const first = stderr.split('\n').find((line) => line.trim()) ?? (error instanceof Error ? error.message : String(error));
    // oxlint-disable-next-line preserve-caught-error -- a cause would re-expose the full stderr
    throw new Error(`higgsfield ${args.slice(0, 2).join(' ')} failed: ${first.slice(0, 300)}`);
  }
}

async function credits(): Promise<number> {
  const match = /(\d+)\s+credits/.exec(await hf(['account', 'status'], 30_000));
  if (!match) throw new Error('Could not read the credit balance; is higgsfield logged in?');
  return Number(match[1]);
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  return readFile(file, 'utf8').then((t) => JSON.parse(t) as T, () => fallback);
}

async function generate(slug: string, attempt: number): Promise<void> {
  const params = ['--prompt', scenePrompt(slug), '--aspect_ratio', '16:9', '--resolution', '2k'];
  const stdout = await hf(['generate', 'create', MODEL, ...params, '--wait', '--json'], 10 * 60_000);
  const url = [...stdout.matchAll(/"result_url":\s*"(https:\/\/[^"]+\.(?:png|jpe?g|webp))"/g)].map((m) => m[1]).at(-1);
  if (!url) throw new Error(`${slug}: no image result_url in higgsfield output`);
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  const type = res.headers.get('content-type') ?? '';
  if (!res.ok || !type.startsWith('image/')) throw new Error(`${url}: HTTP ${res.status}, ${type || 'no content-type'}`);
  const file = `${AI_DIR}/${slug}-attempt-${attempt}.png`;
  await sharp(Buffer.from(await res.arrayBuffer())).png().toFile(file);
  await copyFile(file, `${AI_DIR}/${slug}-scene.png`);
  console.log(`${slug}: attempt ${attempt} generated (${url})`);
}

const projects = await loadProjects(argList('--only'));
await mkdir(AI_DIR, { recursive: true });
await mkdir(FINAL_DIR, { recursive: true });

const useAttempt = argList('--use-attempt')[0];
if (useAttempt) {
  if (projects.length !== 1) throw new Error('--use-attempt needs exactly one --only slug');
  await copyFile(`${AI_DIR}/${projects[0]!.slug}-attempt-${useAttempt}.png`, `${AI_DIR}/${projects[0]!.slug}-scene.png`);
}

if (process.argv.includes('--generate')) {
  const maxCredits = Number(argList('--max-credits')[0]);
  if (!Number.isFinite(maxCredits)) throw new Error('--generate needs --max-credits <n>');
  const log = await readJson<{ spent: number }[]>(CREDITS_LOG, []);
  const spentSoFar = log.reduce((sum, entry) => sum + entry.spent, 0);
  if (spentSoFar + projects.length * CREDITS_PER_IMAGE > maxCredits) {
    throw new Error(`${spentSoFar} credits already spent; ${projects.length} more images would exceed ${maxCredits}`);
  }
  const attempts = await readJson<Record<string, number>>(ATTEMPTS_FILE, {});
  const over = projects.filter((p) => (attempts[p.slug] ?? 0) >= MAX_ATTEMPTS_PER_PROJECT).map((p) => p.slug);
  if (over.length > 0) throw new Error(`Already at ${MAX_ATTEMPTS_PER_PROJECT} attempts: ${over.join(', ')}`);
  const before = await credits();
  const failures: string[] = [];
  for (const { slug } of projects) {
    const attempt = (attempts[slug] ?? 0) + 1;
    attempts[slug] = attempt;
    await writeFile(ATTEMPTS_FILE, `${JSON.stringify(attempts, null, 2)}\n`);
    await generate(slug, attempt).catch((error: unknown) => failures.push(error instanceof Error ? error.message : String(error)));
  }
  const after = await credits();
  log.push({ at: new Date().toISOString(), slugs: projects.map((p) => p.slug), before, after, spent: before - after } as { spent: number });
  await writeFile(CREDITS_LOG, `${JSON.stringify(log, null, 2)}\n`);
  console.log(`credits: ${before} -> ${after} (spent ${before - after})`);
  if (failures.length > 0) throw new Error(`generation failed:\n${failures.join('\n')}`);
}

const browser = await chromium.launch({ channel: 'chromium', headless: true });
try {
  const page = await browser.newPage();
  for (const { slug } of projects) {
    const scene = `${AI_DIR}/${slug}-scene.png`;
    const quad = (await readCorners(`${AI_DIR}/${slug}-corners.json`)) ?? (await detectKeyedScreen(scene));
    const clean = `${AI_DIR}/${slug}-scene-clean.png`;
    await writeFile(clean, await despillAroundScreen(scene, quad));
    const composite = await renderOnScreen(page, clean, `${RAW_DIR}/${slug}-desktop.png`, quad);
    const { width = 0, height = 0 } = await sharp(composite).metadata();
    const span = await readSpan(slug);
    const framing = frameAroundScreen(quad, width, height, FRAME, span);
    const master = await sharp(composite).extract(framing.crop).resize(MASTER.width, MASTER.height, { kernel: 'lanczos3' }).png().toBuffer();
    await writeFile(`${FINAL_DIR}/${slug}.png`, master);
    await writeSampleJpgs(master, `${FINAL_DIR}/${slug}`);
    const [tl, tr, , bl] = quad;
    const aspect = Math.hypot(tr[0] - tl[0], tr[1] - tl[1]) / Math.hypot(bl[0] - tl[0], bl[1] - tl[1]);
    const leftover = await countKeyPixels(composite, quad);
    const warn = [
      framing.shifted ? 'crop hit an edge' : '',
      aspect < 1.2 || aspect > 1.85 ? `screen aspect ${aspect.toFixed(2)}` : '',
      leftover > 0 ? `${leftover} key pixels left` : '',
    ]
      .filter(Boolean)
      .join(', ');
    const laptop = framing.laptopWidth === null ? 'no laptop span yet' : `laptop ${(framing.laptopWidth * 100).toFixed(1)}% of width`;
    const position = `centre at ${(framing.screenCenterY * 100).toFixed(1)}% from top`;
    console.log(`${slug}: screen ${(framing.screenHeight * 100).toFixed(1)}% of height, ${position}, ${laptop}, crop ${framing.crop.width}px${warn ? `, CHECK: ${warn}` : ''}`);
  }
} finally {
  await browser.close();
}
