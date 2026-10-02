import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Same order and slugs as src/data/projects.ts, which cannot be imported here (it imports the .webp files).
const SLUGS = [
  'narodnyfutbalovystadion',
  'pangeas',
  'routie',
  'dermateq',
  'cherries',
  'autoomnium',
  'saunika',
  'akbaltazarovic',
  'adrianastudio',
  'schoolofarts',
  'norahorvathova',
  'denva',
] as const;

const BASE_URL = 'https://resume.denva.sk/wp-content/uploads/2026/08/';
const OUT_DIR = 'src/assets/projects';
const TIMEOUT_MS = 20_000;

function isWebp(bytes: Uint8Array): boolean {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  return bytes.length > 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
}

async function fetchImage(slug: string): Promise<Uint8Array> {
  const url = `${BASE_URL}${slug}-768x480.webp`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.url.startsWith('https://')) throw new Error(`${url}: redirected off HTTPS to ${res.url}`);
  if (res.status !== 200) throw new Error(`${url}: HTTP ${res.status}`);
  const type = res.headers.get('content-type')?.split(';')[0]?.trim();
  if (type !== 'image/webp') throw new Error(`${url}: content-type ${type ?? 'missing'}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (!isWebp(bytes)) throw new Error(`${url}: body is not a WebP file`);
  return bytes;
}

await mkdir(OUT_DIR, { recursive: true });

const failures: string[] = [];
for (const slug of SLUGS) {
  try {
    const bytes = await fetchImage(slug);
    const file = join(OUT_DIR, `${slug}.webp`);
    await writeFile(file, bytes);
    console.log(`${file}: ${(bytes.length / 1024).toFixed(1)} KB`);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
}

if (failures.length > 0) {
  console.error(`images:fetch failed:\n${failures.join('\n')}`);
  process.exit(1);
}
