import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The only dash guard (typography rule): no en dash or em dash anywhere in shipped sources.
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TARGETS = ['src', 'shared', 'worker', 'public', 'index.html'];
const BINARY = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.ico', '.woff', '.woff2']);
const EN_DASH = String.fromCodePoint(0x2013);
const EM_DASH = String.fromCodePoint(0x2014);

function files(path: string): string[] {
  const stat = statSync(path, { throwIfNoEntry: false });
  if (!stat) return [];
  if (!stat.isDirectory()) return [path];
  return readdirSync(path).flatMap((name) => files(join(path, name)));
}

describe('no-dash guard', () => {
  it('finds no U+2013 or U+2014 in src, shared, worker, public and index.html', () => {
    const scanned = TARGETS.flatMap((t) => files(join(ROOT, t))).filter((f) => !BINARY.has(extname(f).toLowerCase()));
    const hits: string[] = [];
    for (const file of scanned) {
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (line.includes(EN_DASH) || line.includes(EM_DASH)) hits.push(`${relative(ROOT, file)}:${i + 1}`);
        });
    }
    expect(scanned.length).toBeGreaterThan(0);
    expect(hits).toEqual([]);
  });
});
