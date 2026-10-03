import type { Lang, Localized } from './types';

export const SOURCE_URL = 'https://github.com/denisvarga/denisvarga.sk';
export const GITHUB_URL = 'https://github.com/denisvarga';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/denisvarg/';

export interface HeadCopy {
  /** Each language has its own domain; its page is served at the domain root. */
  readonly origin: 'https://denisvarga.sk' | 'https://denisvarga.dev';
  /** Where the prerendered page lives in dist/client, and its URL on localhost and workers.dev. */
  readonly path: '/' | '/en/';
  readonly email: string;
  readonly title: string;
  readonly description: string;
  readonly jobTitle: string;
  readonly ogLocale: 'sk_SK' | 'en_US';
  readonly consoleGreeting: string;
}

export const headCopy: Localized<HeadCopy> = {
  sk: {
    origin: 'https://denisvarga.sk',
    path: '/',
    email: 'hello@denisvarga.sk',
    title: 'Denis Varga | AI developer s produktovým myslením',
    description:
      'Webové aplikácie, AI agenti a interné nástroje. Vyvíjam od roku 2017, dnes AI-first s Claude Code, Codexom a MCP. Otvorený projektom aj pozíciám.',
    jobTitle: 'AI developer s produktovým myslením',
    ogLocale: 'sk_SK',
    consoleGreeting:
      'Ahoj, vidím, že sa pozeráte pod kapotu. Tento web beží na React 19, TypeScripte a Vite, servíruje ho jeden Cloudflare Worker s Hono a AI chat odpovedá cez OpenAI. Zdrojový kód: https://github.com/denisvarga/denisvarga.sk. Napíšte na hello@denisvarga.sk alebo skúste v chate: sudo hire denis',
  },
  en: {
    origin: 'https://denisvarga.dev',
    path: '/en/',
    email: 'hello@denisvarga.dev',
    title: 'Denis Varga | AI developer with a product mindset',
    description:
      'Web apps, AI agents and internal tools. Building software since 2017, now AI-first with Claude Code, Codex and MCP. Open to projects and roles.',
    jobTitle: 'AI developer with a product mindset',
    ogLocale: 'en_US',
    consoleGreeting:
      'Hi, I see you are looking under the hood. This site runs on React 19, TypeScript and Vite, is served by a single Cloudflare Worker with Hono, and the AI chat answers through OpenAI. Source: https://github.com/denisvarga/denisvarga.sk. Write to hello@denisvarga.dev or try in the chat: sudo hire denis',
  },
};

export const notFoundCopy = {
  code: '404',
  title: '404 | Denis Varga',
  message: { sk: 'Táto stránka neexistuje.', en: 'This page does not exist.' },
  home: { sk: 'Späť na úvod', en: 'Back home' },
} as const;

export function canonicalUrl(lang: Lang): string {
  return `${headCopy[lang].origin}/`;
}
