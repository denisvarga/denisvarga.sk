import { SKILLS, skillLabel } from '../../shared/skills';
import { canonicalUrl, GITHUB_URL, headCopy, LINKEDIN_URL } from '../i18n/head-copy';
import type { Lang } from '../i18n/types';

// One @id and url on both domains, so the SK and EN profile pages describe the same person.
const PERSON_URL = 'https://denisvarga.sk/';
const PERSON_ID = `${PERSON_URL}#person`;
const DENVA_PROFILE_URL = 'https://denva.studio/autor/denis-varga/';
// Matched on the English group name, which is stable across copy edits of the Slovak one.
const KNOWS_ABOUT_GROUPS: readonly string[] = ['AI & agents', 'LLMs & data'];
const KNOWS_ABOUT_STACK = ['React', 'Next.js', 'TypeScript', 'WordPress', 'WooCommerce', 'PHP', 'Vue.js'];

/** Concrete skills that are also visible on the page: both AI groups plus the core web stack. */
export function knowsAbout(lang: Lang): string[] {
  const ai = SKILLS.filter((group) => KNOWS_ABOUT_GROUPS.includes(group.name.en)).flatMap((group) =>
    group.items.map((item) => skillLabel(item, lang)),
  );
  return [...ai, ...KNOWS_ABOUT_STACK];
}

/**
 * `portraitPath` is the hashed hero portrait in dist/client, e.g. /assets/denis-cutout-1024-x.webp;
 * `dateModified` is the YYYY-MM-DD date of the last content change.
 */
export function profileJsonLd(lang: Lang, portraitPath: string, dateModified: string): Record<string, unknown> {
  const head = headCopy[lang];
  const url = canonicalUrl(lang);
  const websiteId = `${url}#website`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url,
        name: 'Denis Varga',
        alternateName: new URL(url).host,
        inLanguage: lang,
      },
      {
        '@type': 'ProfilePage',
        '@id': `${url}#profile`,
        url,
        inLanguage: lang,
        isPartOf: { '@id': websiteId },
        dateModified,
        mainEntity: {
          '@type': 'Person',
          '@id': PERSON_ID,
          name: 'Denis Varga',
          url: PERSON_URL,
          image: head.origin + portraitPath,
          jobTitle: head.jobTitle,
          description: head.description,
          email: `mailto:${head.email}`,
          telephone: '+421902074830',
          sameAs: [GITHUB_URL, LINKEDIN_URL, DENVA_PROFILE_URL],
          address: { '@type': 'PostalAddress', addressLocality: 'Bratislava', addressCountry: 'SK' },
          knowsLanguage: ['sk', 'en'],
          worksFor: [
            { '@type': 'Organization', name: 'Denva', url: 'https://denva.studio/' },
            { '@type': 'Organization', name: 'GrandPano', url: 'https://grandpano.sk/' },
            { '@type': 'Organization', name: 'Vibration s.r.o.', url: 'https://vibration.sk/' },
          ],
          knowsAbout: knowsAbout(lang),
        },
      },
    ],
  };
}

// Escaping every "<" means no content can close the <script> element or open a comment in it.
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replaceAll('<', '\\u003c');
}
