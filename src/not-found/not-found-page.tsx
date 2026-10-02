import pill from '../components/pill-link.module.css';
import { notFoundCopy } from '../i18n/head-copy';
import { LANGS } from '../i18n/types';

// One static, bilingual page: Cloudflare serves it for every unknown path in either language.
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
        <a className={`${pill.pill} ${pill.dark} not-found-link`} href="/" hrefLang="sk" lang="sk">
          {notFoundCopy.home.sk}
        </a>
        <a className={`${pill.pill} ${pill.outline} not-found-link`} href="/en/" hrefLang="en" lang="en">
          {notFoundCopy.home.en}
        </a>
      </div>
    </main>
  );
}
