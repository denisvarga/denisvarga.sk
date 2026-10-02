// Prints dist/cv-src/cv-<lang>.html (written by `pnpm build`) to the committed PDFs in public/cv/.
// Run after a build: pnpm exec tsx scripts/build-cv-pdf.ts
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type Page } from '@playwright/test';

const SRC_DIR = 'dist/cv-src';
const OUT_DIR = 'public/cv';
const TARGETS = [
  { src: 'cv-sk.html', out: 'denis-varga-cv.pdf' },
  { src: 'cv-en.html', out: 'denis-varga-cv-en.pdf' },
] as const;
const MAX_PAGES = 3;
const AUTHOR = 'Denis Varga';
const FORBIDDEN_DASHES = [String.fromCodePoint(0x2013), String.fromCodePoint(0x2014)];

async function assertSourceClean(file: string): Promise<void> {
  const html = await readFile(file, 'utf8').catch((error: unknown) => {
    throw new Error(`Cannot read ${file}; run \`pnpm build\` first`, { cause: error });
  });
  if (FORBIDDEN_DASHES.some((dash) => html.includes(dash))) throw new Error(`${file} contains an en or em dash`);
}

// Every declared font face must load, every image must decode and the stylesheet must apply, or
// the PDF would silently fall back to a system font, an empty portrait or an unstyled page.
async function assertPageReady(page: Page): Promise<void> {
  const problems = await page.evaluate(async () => {
    const issues: string[] = [];
    const section = document.querySelector('.sec');
    if (!section || getComputedStyle(section).display !== 'grid') issues.push('the print stylesheet did not apply');
    const faces: FontFace[] = [];
    document.fonts.forEach((face) => faces.push(face));
    if (faces.length === 0) issues.push('no @font-face declared');
    await Promise.all(faces.map((face) => face.load().catch(() => issues.push(`font failed: ${face.family}`))));
    for (const img of Array.from(document.images)) {
      if (!img.complete || img.naturalWidth === 0) issues.push(`image failed: ${img.src}`);
      else await img.decode();
    }
    return issues;
  });
  if (problems.length > 0) throw new Error(problems.join('\n'));
}

function pageCount(pdf: Buffer): number {
  const counts = [...pdf.toString('latin1').matchAll(/\/Type\s*\/Pages\b[^>]*?\/Count\s+(\d+)/g)].map((m) => Number(m[1]));
  if (counts.length === 0) throw new Error('Cannot read the page count of the generated PDF');
  return Math.max(...counts);
}

const pdfString = (text: string) => `(${text.replace(/[\\()]/g, (c) => `\\${c}`)})`;

// Chromium takes the PDF title from <title> but has no author option, so the Info dictionary is
// replaced through a standard incremental update: a new Info object, a one-entry xref section and
// a trailer that chains to the original one with /Prev.
function withAuthor(pdf: Buffer, author: string): Buffer {
  const text = pdf.toString('latin1');
  const trailer = text.lastIndexOf('trailer');
  const startxref = /startxref\s+(\d+)\s+%%EOF\s*$/.exec(text);
  const tail = text.slice(trailer);
  const size = /\/Size\s+(\d+)/.exec(tail);
  const root = /\/Root\s+(\d+\s+\d+\s+R)/.exec(tail);
  const infoRef = /\/Info\s+(\d+)\s+(\d+)\s+R/.exec(tail);
  if (trailer < 0 || !startxref || !size || !root || !infoRef) {
    throw new Error('Unexpected PDF trailer layout; cannot set the author');
  }
  const infoBody = new RegExp(`(?:^|\\s)${infoRef[1]}\\s+${infoRef[2]}\\s+obj\\s*<<([\\s\\S]*?)>>\\s*endobj`).exec(text);
  if (!infoBody?.[1]) throw new Error('Cannot find the PDF Info dictionary');
  const entries = infoBody[1].replace(/\/Author\s*\((?:\\.|[^\\)])*\)/, '').trim();
  const id = Number(size[1]);
  const object = `${id} 0 obj\n<<${entries} /Author ${pdfString(author)}>>\nendobj\n`;
  const prefix = text.endsWith('\n') ? '' : '\n';
  const objectOffset = pdf.length + prefix.length;
  const xrefOffset = objectOffset + object.length;
  const update =
    `${prefix}${object}xref\n${id} 1\n${String(objectOffset).padStart(10, '0')} 00000 n \n` +
    `trailer\n<< /Size ${id + 1} /Root ${root[1]} /Info ${id} 0 R /Prev ${startxref[1]} >>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.concat([pdf, Buffer.from(update, 'latin1')]);
}

await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const { src, out } of TARGETS) {
    const file = resolve(SRC_DIR, src);
    await assertSourceClean(file);
    await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
    await assertPageReady(page);
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true,
      outline: true,
    });
    const pages = pageCount(pdf);
    if (pages > MAX_PAGES) throw new Error(`${out}: ${pages} pages, the limit is ${MAX_PAGES}`);
    const final = withAuthor(pdf, AUTHOR);
    await writeFile(join(OUT_DIR, out), final);
    console.log(`${join(OUT_DIR, out)}: ${pages} pages, ${Math.round(final.length / 1024)} KB`);
  }
} finally {
  await browser.close();
}
