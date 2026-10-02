import { SKILLS, skillLabel } from '../data/skills';
import { canonicalUrl, headCopy } from '../i18n/head-copy';
import type { Lang } from '../i18n/types';

// One @id on both domains, so the SK and EN profile pages describe the same person.
const PERSON_ID = 'https://denisvarga.sk/#person';
// Matched on the English group name, which is stable across copy edits of the Slovak one.
const KNOWS_ABOUT_GROUPS: readonly string[] = ['AI & agents', 'LLMs & data'];
const KNOWS_ABOUT_STACK = ['React', 'Next.js', 'TypeScript', 'WordPress'];

/** Concrete skills that are also visible on the page: both AI groups plus the core web stack. */
export function knowsAbout(lang: Lang): string[] {
  const ai = SKILLS.filter((group) => KNOWS_ABOUT_GROUPS.includes(group.name.en)).flatMap((group) =>
    group.items.map((item) => skillLabel(item, lang)),
  );
  return [...ai, ...KNOWS_ABOUT_STACK];
}

/** `portraitPath` is the hashed hero portrait in dist/client, e.g. /assets/denis-cutout-1024-x.webp. */
export function profileJsonLd(lang: Lang, portraitPath: string): Record<string, unknown> {
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
        mainEntity: {
          '@type': 'Person',
          '@id': PERSON_ID,
          name: 'Denis Varga',
          url,
          image: head.origin + portraitPath,
          jobTitle: head.jobTitle,
          description: head.description,
          email: `mailto:${head.email}`,
          telephone: '+421902074830',
          sameAs: ['https://github.com/denisvarga', 'https://www.linkedin.com/in/denisvarg/'],
          worksFor: [
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
