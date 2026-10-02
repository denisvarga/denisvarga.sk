import { HEAD_COMMENT, SITE_URL, canonicalUrl, headCopy, notFoundCopy } from '../i18n/head-copy';
import { LANGS, type Lang } from '../i18n/types';
import { personJsonLd, serializeJsonLd } from './json-ld';

export const OG_IMAGE = { url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630 } as const;
export const THEME_COLOR = '#ECECE9';

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
export function buildHeadTags(lang: Lang, fontPreloads: readonly string[]): string {
  const copy = headCopy[lang];
  const other = LANGS.find((l) => l !== lang) ?? 'sk';
  return [
    HEAD_COMMENT,
    `<title>${escapeHtml(copy.title)}</title>`,
    meta('name', 'description', copy.description),
    `<link rel="canonical" href="${canonicalUrl(lang)}">`,
    ...hreflangAlternates().map(([hreflang, href]) => `<link rel="alternate" hreflang="${hreflang}" href="${href}">`),
    meta('property', 'og:type', 'website'),
    meta('property', 'og:url', canonicalUrl(lang)),
    meta('property', 'og:title', copy.title),
    meta('property', 'og:description', copy.description),
    meta('property', 'og:locale', copy.ogLocale),
    meta('property', 'og:locale:alternate', headCopy[other].ogLocale),
    meta('property', 'og:image', OG_IMAGE.url),
    meta('property', 'og:image:width', String(OG_IMAGE.width)),
    meta('property', 'og:image:height', String(OG_IMAGE.height)),
    meta('name', 'twitter:card', 'summary_large_image'),
    ...sharedTags(fontPreloads),
    `<script type="application/ld+json">${serializeJsonLd(personJsonLd(lang))}</script>`,
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
