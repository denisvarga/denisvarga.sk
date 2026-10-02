import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import type { Page } from '@playwright/test';
import sharp from 'sharp';

export type Point = readonly [number, number];
/** Screen corners in image pixels: top-left, top-right, bottom-right, bottom-left. */
export type Quad = readonly [Point, Point, Point, Point];

// Projective map of the w x h rectangle onto quad, as CSS matrix3d values (column-major).
export function homography(w: number, h: number, quad: Quad): number[] {
  const src: Point[] = [[0, 0], [w, 0], [w, h], [0, h]];
  const rows: number[][] = [];
  src.forEach(([x, y], i) => {
    const [u, v] = quad[i]!;
    rows.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    rows.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  });
  for (let col = 0; col < 8; col++) {
    const pivot = rows.slice(col).reduce((best, r, i) => (Math.abs(r[col]!) > Math.abs(rows[best]![col]!) ? col + i : best), col);
    [rows[col], rows[pivot]] = [rows[pivot]!, rows[col]!];
    const p = rows[col]!;
    if (Math.abs(p[col]!) < 1e-12) throw new Error('Degenerate screen quad');
    for (let r = 0; r < 8; r++) {
      if (r === col) continue;
      const factor = rows[r]![col]! / p[col]!;
      rows[r] = rows[r]!.map((value, k) => value - factor * p[k]!);
    }
  }
  const [a, b, c, d, e, f, g, hh] = rows.map((r, i) => r[8]! / r[i]!) as [number, number, number, number, number, number, number, number];
  return [a, d, 0, g, b, e, 0, hh, 0, 0, 1, 0, c, f, 0, 1];
}

export async function readCorners(file: string): Promise<Quad | null> {
  const text = await readFile(file, 'utf8').catch(() => null);
  if (text === null) return null;
  const value: unknown = JSON.parse(text);
  const valid = Array.isArray(value) && value.length === 4 &&
    value.every((p) => Array.isArray(p) && p.length === 2 && p.every((n) => Number.isFinite(n)));
  if (!valid) throw new Error(`${file}: expected [[x,y],[x,y],[x,y],[x,y]] (tl, tr, br, bl)`);
  return value as unknown as Quad;
}

export async function renderOnScreen(page: Page, sceneFile: string, captureFile: string, quad: Quad): Promise<Buffer> {
  const scene = await sharp(sceneFile).metadata();
  const shot = await sharp(captureFile).metadata();
  if (!scene.width || !scene.height || !shot.width || !shot.height) throw new Error('Unreadable scene or capture size');
  const matrix = homography(shot.width, shot.height, quad).map((n) => n.toFixed(10)).join(',');
  const radius = Math.round(shot.width * 0.008);
  await page.setViewportSize({ width: scene.width, height: scene.height });
  const htmlFile = `${sceneFile}.html`;
  await writeFile(htmlFile, `<!doctype html><html><head><style>
* { margin: 0; } body { width: ${scene.width}px; height: ${scene.height}px; overflow: hidden; position: relative; }
.scene { display: block; }
.screen { position: absolute; left: 0; top: 0; width: ${shot.width}px; height: ${shot.height}px; overflow: hidden;
  border-radius: ${radius}px; transform-origin: 0 0; transform: matrix3d(${matrix}); }
.screen img { display: block; width: 100%; height: 100%; filter: brightness(0.96) saturate(0.97); }
.screen::after { content: ''; position: absolute; inset: 0;
  background: linear-gradient(118deg, rgb(255 255 255 / 0.07) 0%, rgb(255 255 255 / 0) 42%);
  box-shadow: inset 0 0 ${radius * 4}px rgb(0 0 0 / 0.22); }
</style></head><body><img class="scene" src="${pathToFileURL(sceneFile).href}" alt="">
<div class="screen"><img src="${pathToFileURL(captureFile).href}" alt=""></div></body></html>`);
  await page.goto(pathToFileURL(htmlFile).href, { waitUntil: 'load' });
  await page.evaluate('Promise.all([...document.images].map((i) => i.decode()))');
  return page.screenshot({ type: 'png' });
}
