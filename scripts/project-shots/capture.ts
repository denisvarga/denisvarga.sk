import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium, devices, type Browser, type BrowserContextOptions } from '@playwright/test';
import { CLICK_CONSENT, FIND_LEFTOVERS, HIDE_OVERLAYS, SCROLL_NUDGE, SITE_CSS, VENDOR_HIDE_CSS } from './page-cleanup.ts';
import { FREEZE_PAGE, HIDE_CARETS, PIN_CLASS_SLIDERS, PIN_SLIDERS } from './page-pinning.ts';
import { argList, loadProjects, RAW_DIR, type ShotProject } from './project-list.ts';

// Usage: tsx scripts/project-shots/capture.ts [--only slug,slug] [--channel chrome]
// Private projects (url null) are skipped; their raw images come from spikes/project-shots/html.
// Defaults to full Chromium (new headless), which renders large blurred shadows without the tile
// seams of the headless shell. Use the chrome channel when a site relies on H.264 video.

type Kind = 'desktop' | 'mobile';
type PublicProject = ShotProject & { readonly url: string };

interface ShotResult {
  readonly kind: Kind;
  readonly ok: boolean;
  readonly finalUrl?: string;
  readonly consentClicked?: string | null;
  readonly hidden?: readonly string[];
  readonly pinned?: readonly string[];
  readonly carets?: readonly string[];
  readonly leftovers?: readonly string[];
  readonly error?: string;
}

const IPHONE_UA =
  devices['iPhone 14']?.userAgent ??
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const CONTEXTS: Record<Kind, BrowserContextOptions> = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  mobile: {
    viewport: { width: 390, height: 844 },
    screen: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: IPHONE_UA,
  },
};

const LOG_FILE = `${RAW_DIR}/capture-log.json`;
const PAUSE_BETWEEN_SITES_MS = 1500;

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

async function shoot(browser: Browser, project: PublicProject, kind: Kind): Promise<ShotResult> {
  const context = await browser.newContext({
    ...CONTEXTS[kind],
    locale: 'sk-SK',
    timezoneId: 'Europe/Bratislava',
    colorScheme: 'light',
    // Reduced motion makes entrance animations land in their final state before the shot.
    reducedMotion: 'reduce',
  });
  try {
    const page = await context.newPage();
    const response = await page.goto(project.url, { waitUntil: 'load', timeout: 45_000 });
    if (!response) throw new Error('no response');
    if (response.status() >= 400) throw new Error(`HTTP ${response.status()}`);
    // Analytics beacons can keep the network busy forever, so idle is best effort.
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
    await page.evaluate('document.fonts.ready');
    await page.waitForTimeout(1500);

    const clicked = await page.evaluate(CLICK_CONSENT);
    const consentClicked = typeof clicked === 'string' ? clicked : null;
    if (consentClicked) await page.waitForTimeout(1000);
    await page.addStyleTag({ content: VENDOR_HIDE_CSS + (SITE_CSS[project.slug] ?? '') });
    await page.evaluate(SCROLL_NUDGE);
    // Overlays run twice: some popups only appear after the scroll nudge or on a timer.
    const hidden = strings(await page.evaluate(HIDE_OVERLAYS));
    const pinned = strings(await page.evaluate(PIN_SLIDERS));
    await page.waitForTimeout(1500);
    hidden.push(...strings(await page.evaluate(HIDE_OVERLAYS)));
    const carets = strings(await page.evaluate(HIDE_CARETS));
    await page.evaluate(FREEZE_PAGE);
    pinned.push(...strings(await page.evaluate(PIN_CLASS_SLIDERS)));
    const leftovers = strings(await page.evaluate(FIND_LEFTOVERS));

    await page.screenshot({ path: `${RAW_DIR}/${project.slug}-${kind}.png`, animations: 'disabled' });
    return { kind, ok: true, finalUrl: page.url(), consentClicked, hidden, pinned, carets, leftovers };
  } catch (error) {
    return { kind, ok: false, error: error instanceof Error ? error.message.split('\n')[0] : String(error) };
  } finally {
    await context.close();
  }
}

async function readLog(): Promise<Record<string, ShotResult[]>> {
  try {
    return JSON.parse(await readFile(LOG_FILE, 'utf8')) as Record<string, ShotResult[]>;
  } catch {
    return {};
  }
}

const listed = await loadProjects(argList('--only'));
for (const { slug } of listed.filter((p) => !p.url)) console.log(`${slug}: skipped, private project without a url`);
const projects = listed.filter((p): p is PublicProject => p.url !== null);
const channel = argList('--channel')[0] ?? 'chromium';
await mkdir(RAW_DIR, { recursive: true });

const browser = await chromium.launch({ channel, headless: true });
const log = await readLog();
const problems: string[] = [];
try {
  for (const [i, project] of projects.entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, PAUSE_BETWEEN_SITES_MS));
    const results: ShotResult[] = [];
    for (const kind of ['desktop', 'mobile'] as const) {
      const result = await shoot(browser, project, kind);
      results.push(result);
      const detail = result.ok
        ? `consent=${result.consentClicked ?? '-'} hidden=${result.hidden?.length ?? 0} pinned=${result.pinned?.join(',') || '-'} carets=${result.carets?.join(',') || '-'} leftovers=${result.leftovers?.join(' | ') || '-'}`
        : `FAILED ${result.error}`;
      console.log(`${project.slug} ${kind}: ${detail}`);
      if (!result.ok || result.leftovers?.length) problems.push(`${project.slug} ${kind}`);
    }
    log[project.slug] = results;
  }
} finally {
  await browser.close();
  await writeFile(LOG_FILE, `${JSON.stringify(log, null, 2)}\n`);
}

if (problems.length > 0) {
  console.error(`Check these captures (failed or possible overlay): ${problems.join(', ')}`);
  process.exitCode = 1;
}
