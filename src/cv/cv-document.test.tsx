import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { formatPeriod, JOBS } from '../data/jobs';
import { PROJECTS } from '../data/projects';
import { headCopy } from '../i18n/head-copy';
import { LANGS, type Lang } from '../i18n/types';
import { ui } from '../i18n/ui-copy';
import { BUILD_YEAR } from '../lib/use-current-year';
import { cvFacts, cvLabels, displayUrl, typeset } from './cv-copy';
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

  it('lists every company and every project, linking each public project to its domain', () => {
    for (const job of JOBS) expect(text).toContain(job.company);
    const items = [...doc.querySelectorAll('.project')];
    expect(items).toHaveLength(PROJECTS.length);
    PROJECTS.forEach((project, i) => {
      const links = [...items[i]!.querySelectorAll('a')].map((a) => [a.getAttribute('href'), a.textContent]);
      expect(links).toEqual(project.url ? [[project.url, displayUrl(project.url)]] : []);
    });
  });

  it('marks a project without a public site as private instead of linking it', () => {
    const items = [...doc.querySelectorAll('.project')];
    const privateIndexes = PROJECTS.flatMap((project, i) => (project.url === null ? [i] : []));
    expect(privateIndexes.length).toBeGreaterThan(0);
    for (const i of privateIndexes) {
      expect(items[i]!.querySelector('a')).toBeNull();
      expect(items[i]!.querySelector('.domain')?.textContent).toBe(ui[lang].privateProject);
    }
  });

  it('ends ongoing jobs with the build year, not the generation date', () => {
    expect(textOf(doc, '.period')).toEqual(JOBS.map((job) => formatPeriod(job.period, BUILD_YEAR)));
    expect(textOf(doc, '.period')).toContain(`2018 - ${BUILD_YEAR}`);
    expect(textOf(doc, '.period')).toContain('2021 - 2025');
    expect(textOf(doc, '.period').join(' ')).not.toContain('2031');
  });

  it('labels every section in its language', () => {
    const l = cvLabels[lang];
    expect(textOf(doc, 'h2')).toEqual([l.contact, l.profile, l.experience, l.ai, l.skills, l.languages, l.education, l.projects]);
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
    expect(doc.querySelector('.contact-list li')?.textContent).toBe(cvFacts[lang].location);
    expect(doc.querySelector('img')?.getAttribute('src')).toBe('portrait.jpg');
  });

  it('states languages and education in their own sections', () => {
    expect(doc.querySelector('.languages p')?.textContent).toBe(cvFacts[lang].languages);
    expect(doc.querySelector('.education p')?.textContent).toContain('(2012 - 2016)');
  });

  it('renders plain text: no markup asterisks and no en or em dash', () => {
    expect(text).not.toContain('*');
    for (const dash of FORBIDDEN_DASHES) expect(text).not.toContain(dash);
    expect(doc.querySelector('[style]')).toBeNull();
  });
});

describe('CvDocument dates', () => {
  it('uses the Europe/Bratislava date, not UTC', () => {
    const newYearsEve = new Date('2026-12-31T23:30:00Z');
    const sk = render('sk', newYearsEve);
    const en = render('en', newYearsEve);
    expect(sk.querySelector('.foot')?.textContent).toBe('Vygenerované z denisvarga.sk 1. januára 2027');
    expect(en.querySelector('.foot')?.textContent).toBe('Generated from denisvarga.dev on 1 January 2027');
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
