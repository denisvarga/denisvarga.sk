import { canonicalUrl, headCopy, notFoundCopy } from '../i18n/head-copy';
import { HEAD_COMMENT } from './head-comment';
import { LANGS, type Lang, type Localized } from '../i18n/types';
import { profileJsonLd, serializeJsonLd } from './json-ld';

// Share cards from scripts/build-og-image.ts, one per language; the paths are files in public/.
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;
export const OG_IMAGES: Localized<{ readonly path: `/${string}.jpg`; readonly alt: string }> = {
  sk: {
    path: '/og-image.jpg',
    alt: 'Denis Varga, AI developer s produktovým myslením. Webové aplikácie, AI agenti a interné nástroje.',
  },
  en: {
    path: '/og-image-en.jpg',
    alt: 'Denis Varga, AI developer with a product mindset. Web apps, AI agents and internal tools.',
  },
};
export const THEME_COLOR = '#ECECE9';
const SITE_NAME = 'Denis Varga';

/** Hashed build outputs the head points at, as /assets/ paths found in dist/client. */
export interface HeadAssets {
  readonly fonts: readonly string[];
  /** The 1024 px hero portrait, the profile image in the JSON-LD. */
  readonly portrait: string;
}

export function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

const meta = (key: 'name' | 'property', name: string, content: string) =>
  `<meta ${key}="${name}" content="${escapeHtml(content)}">`;

function sharedTags(fontPreloads: readonly string[]): string[] {
  return [
    meta('name', 'theme-color', THEME_COLOR),
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
    ...fontPreloads.map(
      (href) => `<link rel="preload" href="${escapeHtml(href)}" as="font" type="font/woff2" crossorigin>`,
    ),
  ];
}

export function hreflangAlternates(): ReadonlyArray<readonly [hreflang: string, href: string]> {
  return [...LANGS.map((lang) => [lang, canonicalUrl(lang)] as const), ['x-default', canonicalUrl('sk')]];
}

// charset and viewport live in index.html, so they are never emitted here.
export function buildHeadTags(lang: Lang, assets: HeadAssets): string {
  const copy = headCopy[lang];
  const other = LANGS.find((l) => l !== lang) ?? 'sk';
  const image = { url: copy.origin + OG_IMAGES[lang].path, alt: OG_IMAGES[lang].alt };
  return [
    HEAD_COMMENT,
    `<title>${escapeHtml(copy.title)}</title>`,
    meta('name', 'description', copy.description),
    `<link rel="canonical" href="${canonicalUrl(lang)}">`,
    ...hreflangAlternates().map(([hreflang, href]) => `<link rel="alternate" hreflang="${hreflang}" href="${href}">`),
    meta('property', 'og:type', 'website'),
    meta('property', 'og:site_name', SITE_NAME),
    meta('property', 'og:url', canonicalUrl(lang)),
    meta('property', 'og:title', copy.title),
    meta('property', 'og:description', copy.description),
    meta('property', 'og:locale', copy.ogLocale),
    meta('property', 'og:locale:alternate', headCopy[other].ogLocale),
    meta('property', 'og:image', image.url),
    meta('property', 'og:image:width', String(OG_IMAGE_SIZE.width)),
    meta('property', 'og:image:height', String(OG_IMAGE_SIZE.height)),
    meta('property', 'og:image:alt', image.alt),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:image', image.url),
    meta('name', 'twitter:image:alt', image.alt),
    ...sharedTags(assets.fonts),
    `<script type="application/ld+json">${serializeJsonLd(profileJsonLd(lang, assets.portrait))}</script>`,
  ].join('\n    ');
}

export function buildNotFoundHeadTags(fontPreloads: readonly string[]): string {
  return [
    HEAD_COMMENT,
    `<title>${escapeHtml(notFoundCopy.title)}</title>`,
    meta('name', 'robots', 'noindex'),
    ...sharedTags(fontPreloads),
  ].join('\n    ');
}
