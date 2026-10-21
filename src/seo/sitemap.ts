import { canonicalUrl } from '../i18n/head-copy';
import { LANGS } from '../i18n/types';
import { hreflangAlternates } from './head-tags';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The last content commit date (`git log -1 --format=%cs`), or `fallback` when git printed
 * nothing usable: no repository, no git binary, or no commit touching the content paths.
 */
export function contentDateOr(gitOutput: string, fallback: string): string {
  const date = gitOutput.trim();
  return ISO_DATE.test(date) ? date : fallback;
}

// Every <url> repeats the full alternate set, as Google requires for sitemap hreflang.
export function buildSitemap(lastmod: string): string {
  if (!ISO_DATE.test(lastmod)) throw new Error(`Invalid sitemap date: ${lastmod}`);
  const alternates = hreflangAlternates()
    .map(([hreflang, href]) => `<xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}"/>`)
    .join('\n    ');
  const urls = LANGS.map(
    (lang) => `  <url>
    <loc>${canonicalUrl(lang)}</loc>
    <lastmod>${lastmod}</lastmod>
    ${alternates}
  </url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}
