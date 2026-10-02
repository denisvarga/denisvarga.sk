import type { Lang, Localized } from './types';

export const SITE_URL = 'https://denisvarga.sk';
export const SOURCE_URL = 'https://github.com/denisvarga/denisvarga.sk';
export const CONTACT_EMAIL = 'hello@denisvarga.sk';

export interface HeadCopy {
  readonly path: '/' | '/en/';
  readonly title: string;
  readonly description: string;
  readonly jobTitle: string;
  readonly ogLocale: 'sk_SK' | 'en_US';
  readonly consoleGreeting: string;
}

export const headCopy: Localized<HeadCopy> = {
  sk: {
    path: '/',
    title: 'Denis Varga | AI developer a WordPress špecialista',
    description:
      'Denis Varga, AI developer a WordPress špecialista. Weby a e-shopy na mieru, WooCommerce, Vue.js, AI agenti, MCP servery a automatizácie.',
    jobTitle: 'AI developer a WordPress špecialista',
    ogLocale: 'sk_SK',
    consoleGreeting:
      'Ahoj, vidím, že sa pozeráte pod kapotu. Tento web beží na React 19, TypeScripte a Vite, servíruje ho jeden Cloudflare Worker s Hono a AI chat odpovedá cez OpenAI. Zdrojový kód: https://github.com/denisvarga/denisvarga.sk. Napíšte na hello@denisvarga.sk alebo skúste v chate: sudo hire denis',
  },
  en: {
    path: '/en/',
    title: 'Denis Varga | AI developer and WordPress specialist',
    description:
      'Denis Varga, AI developer and WordPress specialist. Custom websites and stores, WooCommerce, Vue.js, AI agents, MCP servers and automations.',
    jobTitle: 'AI developer and WordPress specialist',
    ogLocale: 'en_US',
    consoleGreeting:
      'Hi, I see you are looking under the hood. This site runs on React 19, TypeScript and Vite, is served by a single Cloudflare Worker with Hono, and the AI chat answers through OpenAI. Source: https://github.com/denisvarga/denisvarga.sk. Write to hello@denisvarga.sk or try in the chat: sudo hire denis',
  },
};

export const notFoundCopy = {
  code: '404',
  title: '404 | Denis Varga',
  message: { sk: 'Táto stránka neexistuje.', en: 'This page does not exist.' },
  home: { sk: 'Späť na úvod', en: 'Back home' },
} as const;

export function canonicalUrl(lang: Lang): string {
  return SITE_URL + headCopy[lang].path;
}
