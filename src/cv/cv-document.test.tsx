import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { JOBS } from '../data/jobs';
import { PROJECTS } from '../data/projects';
import { headCopy } from '../i18n/head-copy';
import { LANGS, type Lang } from '../i18n/types';
import { cvLabels, displayUrl, typeset } from './cv-copy';
import { CvDocument } from './cv-document';
import { cvHtmlDocument } from './cv-html';

const GENERATED_AT = new Date('2031-06-15T10:00:00Z');
const FORBIDDEN_DASHES = [String.fromCodePoint(0x2013), String.fromCodePoint(0x2014)];

function render(lang: Lang, generatedAt = GENERATED_AT): Document {
  const html = renderToStaticMarkup(<CvDocument lang={lang} portraitSrc="portrait.jpg" generatedAt={generatedAt} />);
  return new DOMParser().parseFromString(html, 'text/html');
}

const textOf = (doc: Document, selector: string) => [...doc.querySelectorAll(selector)].map((el) => el.textContent);

describe.each(LANGS)('CvDocument (%s)', (lang) => {
  const doc = render(lang);
  const text = doc.body.textContent ?? '';

  it('lists every company and every project with a link to its domain', () => {
    for (const job of JOBS) expect(text).toContain(job.company);
    const links = new Map([...doc.querySelectorAll('a')].map((a) => [a.getAttribute('href'), a.textContent]));
    for (const project of PROJECTS) expect(links.get(project.url)).toBe(displayUrl(project.url));
    expect(textOf(doc, '.project')).toHaveLength(12);
  });

  it('ends ongoing jobs at the year of generation', () => {
    expect(textOf(doc, '.period')).toEqual(JOBS.map((job) => `${job.period.start} - ${job.period.end ?? 2031}`));
    expect(textOf(doc, '.period')).toContain('2018 - 2031');
    expect(textOf(doc, '.period')).toContain('2021 - 2025');
  });

  it('labels every section in its language', () => {
    const l = cvLabels[lang];
    expect(textOf(doc, 'h2')).toEqual([l.contact, l.profile, l.experience, l.ai, l.skills, l.projects]);
  });

  it('carries the per-language contacts', () => {
    const hrefs = [...doc.querySelectorAll('.contact-list a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual([
      `mailto:${headCopy[lang].email}`,
      'tel:+421902074830',
      headCopy[lang].origin,
      'https://github.com/denisvarga',
      'https://www.linkedin.com/in/denisvarg/',
    ]);
    expect(text).toContain('linkedin.com/in/denisvarg');
    expect(doc.querySelector('img')?.getAttribute('src')).toBe('portrait.jpg');
  });

  it('renders plain text: no markup asterisks and no en or em dash', () => {
    expect(text).not.toContain('*');
    for (const dash of FORBIDDEN_DASHES) expect(text).not.toContain(dash);
    expect(doc.querySelector('[style]')).toBeNull();
  });
});

describe('CvDocument dates', () => {
  it('uses the Europe/Bratislava date and year, not UTC', () => {
    const newYearsEve = new Date('2026-12-31T23:30:00Z');
    const sk = render('sk', newYearsEve);
    const en = render('en', newYearsEve);
    expect(sk.querySelector('.foot')?.textContent).toBe('Vygenerované z denisvarga.sk 1. januára 2027');
    expect(en.querySelector('.foot')?.textContent).toBe('Generated from denisvarga.dev on 1 January 2027');
    expect(textOf(en, '.period')).toContain('2018 - 2027');
  });
});

describe('typeset', () => {
  it('binds Slovak one-letter words to the next word, and leaves English alone', () => {
    expect(typeset('robím s AI a v tíme (a k tomu)', 'sk')).toBe('robím s AI a v tíme (a k tomu)');
    expect(typeset('Make a plan, I said', 'en')).toBe('Make a plan, I said');
  });
});

describe('cvHtmlDocument', () => {
  // Vitest stubs CSS imports (even ?raw) to empty strings; scripts/build-cv-pdf.ts verifies that
  // the stylesheet reached the built page.
  it('wraps the body in a titled print document with one @font-face per subset and weight', () => {
    const html = cvHtmlDocument('en', { fontDir: 'fonts', portrait: 'portrait.jpg' }, '<p>x</p>');
    expect(html.startsWith('<!doctype html>\n<html lang="en">')).toBe(true);
    expect(html).toContain('<title>Denis Varga - CV</title>');
    expect(html.match(/@font-face/g)).toHaveLength(8);
    expect(html).toContain("url('fonts/manrope-latin-ext-600.woff2')");
    expect(html).toContain('<body><p>x</p></body>');
  });

  it('rejects a font directory that could break out of the CSS url()', () => {
    expect(() => cvHtmlDocument('sk', { fontDir: "x') ; @import ('y", portrait: 'p.jpg' }, '')).toThrow(/Unsafe/);
  });
});
