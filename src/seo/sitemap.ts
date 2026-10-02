import { canonicalUrl } from '../i18n/head-copy';
import { LANGS } from '../i18n/types';
import { hreflangAlternates } from './head-tags';

// Every <url> repeats the full alternate set, as Google requires for sitemap hreflang.
export function buildSitemap(buildDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(buildDate)) throw new Error(`Invalid sitemap date: ${buildDate}`);
  const alternates = hreflangAlternates()
    .map(([hreflang, href]) => `<xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}"/>`)
    .join('\n    ');
  const urls = LANGS.map(
    (lang) => `  <url>
    <loc>${canonicalUrl(lang)}</loc>
    <lastmod>${buildDate}</lastmod>
    ${alternates}
  </url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}
