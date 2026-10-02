import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const CLIENT_DIR = 'dist/client';
const SSR_DIR = 'dist-ssr';

const entryFile = (await readdir(SSR_DIR)).find((f) => f.startsWith('entry-prerender.'));
if (!entryFile) throw new Error(`No entry-prerender bundle in ${SSR_DIR}/`);

const { renderApp } = (await import(pathToFileURL(join(SSR_DIR, entryFile)).href)) as typeof import('../src/entry-prerender');

const template = await readFile(join(CLIENT_DIR, 'index.html'), 'utf8');
const html = template.replace('<!--app-head-->', '').replace('<!--app-html-->', await renderApp('sk'));
await writeFile(join(CLIENT_DIR, 'index.html'), html);

await rm(SSR_DIR, { recursive: true, force: true });
console.log('prerendered: /');
