import pill from '../components/pill-link.module.css';
import { canonicalUrl, notFoundCopy } from '../i18n/head-copy';
import { LANGS } from '../i18n/types';

// One static, bilingual page: Cloudflare serves it for every unknown path on both domains, so the
// links are absolute (a relative "/" on denisvarga.dev would open the English page).
// Its classes are global (not-found.css, imported by main.tsx) because a CSS module that only the
// prerender imports never reaches the client stylesheet that 404.html links.
export function NotFoundPage() {
  return (
    <main className="not-found">
      <h1 className="not-found-code">{notFoundCopy.code}</h1>
      {LANGS.map((lang) => (
        <p key={lang} lang={lang} className="not-found-message">
          {notFoundCopy.message[lang]}
        </p>
      ))}
      <div className="not-found-links">
        <a className={`${pill.pill} ${pill.dark} not-found-link`} href={canonicalUrl('sk')} hrefLang="sk" lang="sk">
          {notFoundCopy.home.sk}
        </a>
        <a className={`${pill.pill} ${pill.outline} not-found-link`} href={canonicalUrl('en')} hrefLang="en" lang="en">
          {notFoundCopy.home.en}
        </a>
      </div>
    </main>
  );
}
