import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const deploy = process.argv.includes('--deploy');

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])),
  );
  return nested.flat();
}

const failures: string[] = [];

for (const file of await walk('dist/client')) {
  if (!file.endsWith('.html')) continue;
  if ((await readFile(file, 'utf8')).includes(' style="')) failures.push(`${file}: style attribute`);
}

if (deploy) {
  for (const file of await walk('dist')) {
    if (/\.dev\.vars/.test(file)) failures.push(`${file}: .dev.vars must not ship`);
  }
}

if (failures.length > 0) {
  console.error(`check-dist failed:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log('check-dist: ok');
