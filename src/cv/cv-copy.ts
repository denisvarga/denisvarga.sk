import { copyEn } from '../i18n/copy-en';
import { copySk } from '../i18n/copy-sk';
import type { Copy, Lang, Localized } from '../i18n/types';

export const CV_NAME = 'Denis Varga';
export const CV_TITLE = `${CV_NAME} - CV`;
export const GITHUB_URL = 'https://github.com/denisvarga';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/denisvarg/';

const TIME_ZONE = 'Europe/Bratislava';
const DATE_LOCALE: Localized<string> = { sk: 'sk-SK', en: 'en-GB' };

export interface CvLabels {
  readonly profile: string;
  readonly experience: string;
  readonly ai: string;
  readonly skills: string;
  readonly projects: string;
  readonly contact: string;
  readonly generated: (date: string) => string;
}

export const cvLabels: Localized<CvLabels> = {
  sk: {
    profile: 'Profil',
    experience: 'Skúsenosti',
    ai: 'Ako pracujem s AI',
    skills: 'Zručnosti',
    projects: 'Projekty',
    contact: 'Kontakt',
    generated: (date) => `Vygenerované z denisvarga.sk ${date}`,
  },
  en: {
    profile: 'Profile',
    experience: 'Experience',
    ai: 'How I work with AI',
    skills: 'Skills',
    projects: 'Projects',
    contact: 'Contact',
    generated: (date) => `Generated from denisvarga.dev on ${date}`,
  },
};

export const cvCopy: Localized<Copy> = { sk: copySk, en: copyEn };

// The site's timezone decides the date, not the build machine's.
export function cvDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[lang], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TIME_ZONE,
  }).format(date);
}

const SK_SINGLE_LETTER_WORD = /(?<=(?:^|[\s(])[aiksouvzAIKSOUVZ])\s+/g;

// Slovak typesetting: a one-letter preposition or conjunction never ends a line, so it is bound
// to the next word with a no-break space.
export function typeset(text: string, lang: Lang): string {
  return lang === 'sk' ? text.replace(SK_SINGLE_LETTER_WORD, ' ') : text;
}

/** `https://www.linkedin.com/in/denisvarg/` -> `linkedin.com/in/denisvarg`, `https://routie.sk` -> `routie.sk`. */
export function displayUrl(url: string): string {
  const { host, pathname } = new URL(url);
  return `${host.replace(/^www\./, '')}${pathname.replace(/\/+$/, '')}`;
}
