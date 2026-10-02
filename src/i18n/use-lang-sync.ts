import { useEffect, useRef } from 'react';
import { canonicalUrl, headCopy } from './head-copy';
import type { Lang } from './types';

// replaceState, not pushState: the toggle must not add history entries, so Back leaves the site
// like in the design and no popstate handling is needed.
export function syncDocumentLang(lang: Lang): void {
  const head = headCopy[lang];
  document.documentElement.lang = lang;
  document.title = head.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', head.description);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonicalUrl(lang));

  const { pathname, search, hash } = window.location;
  if (pathname !== head.path) window.history.replaceState(window.history.state, '', head.path + search + hash);
}

// The prerendered document already matches the initial language, so only changes are synced.
export function useLangSync(lang: Lang): void {
  const synced = useRef(lang);
  useEffect(() => {
    if (synced.current === lang) return;
    synced.current = lang;
    syncDocumentLang(lang);
  }, [lang]);
}
