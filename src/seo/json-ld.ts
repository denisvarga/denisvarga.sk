import { SKILLS } from '../data/skills';
import { CONTACT_EMAIL, canonicalUrl, headCopy } from '../i18n/head-copy';
import type { Lang } from '../i18n/types';

export function personJsonLd(lang: Lang): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Denis Varga',
    url: canonicalUrl(lang),
    jobTitle: headCopy[lang].jobTitle,
    email: `mailto:${CONTACT_EMAIL}`,
    telephone: '+421902074830',
    sameAs: ['https://github.com/denisvarga'],
    knowsAbout: SKILLS.map((group) => group.name[lang]),
  };
}

// Escaping every "<" means no content can close the <script> element or open a comment in it.
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replaceAll('<', '\\u003c');
}
