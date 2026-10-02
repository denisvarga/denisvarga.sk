import { canonicalUrl, headCopy } from './head-copy';
import type { Lang } from './types';

// The dev server, vite preview and workers.dev serve both languages from one host, under their
// prerendered paths; production serves each language at the root of its own domain.
export function isSingleHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.workers.dev');
}

export function langHref(lang: Lang, singleHost: boolean): string {
  return singleHost ? headCopy[lang].path : canonicalUrl(lang);
}
