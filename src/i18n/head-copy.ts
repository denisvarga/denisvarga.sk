import type { Lang, Localized } from './types';

export const SITE_URL = 'https://denisvarga.sk';

export interface HeadCopy {
  readonly path: '/' | '/en/';
  readonly title: string;
  readonly description: string;
  readonly ogLocale: 'sk_SK' | 'en_US';
}

export const headCopy: Localized<HeadCopy> = {
  sk: {
    path: '/',
    title: 'Denis Varga | AI developer a WordPress špecialista',
    description:
      'Denis Varga, AI developer a WordPress špecialista. Weby a e-shopy na mieru, WooCommerce, Vue.js, AI agenti, MCP servery a automatizácie.',
    ogLocale: 'sk_SK',
  },
  en: {
    path: '/en/',
    title: 'Denis Varga | AI developer and WordPress specialist',
    description:
      'Denis Varga, AI developer and WordPress specialist. Custom websites and stores, WooCommerce, Vue.js, AI agents, MCP servers and automations.',
    ogLocale: 'en_US',
  },
};

export function canonicalUrl(lang: Lang): string {
  return SITE_URL + headCopy[lang].path;
}
