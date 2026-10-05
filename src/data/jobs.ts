import type { Localized } from '../i18n/types';

export interface Job {
  /** `end: null` means the job is ongoing; it renders up to the current year. */
  readonly period: { readonly start: number; readonly end: number | null };
  readonly company: string;
  readonly role: Localized<string>;
  readonly text: Localized<string>;
}

export const JOBS: readonly Job[] = [
  {
    period: { start: 2026, end: null },
    company: 'GrandPano',
    role: { sk: 'WordPress špecialista', en: 'WordPress specialist' },
    text: {
      sk: 'Staviam weby rezidenčných developerských projektov od základu, 1:1 podľa Figmy. Napájam ich na Realpad (cenník a leady) a ladím SEO, viditeľnosť v AI vyhľadávaní a výkon.',
      en: 'I build websites for residential development projects from scratch, 1:1 from Figma. I connect them to Realpad (price lists and leads) and tune SEO, visibility in AI search and performance.',
    },
  },
  {
    period: { start: 2018, end: null },
    company: 'Denva',
    role: { sk: 'AI engineer a fullstack developer', en: 'AI engineer & full-stack developer' },
    text: {
      sk: 'Pod značkou Denva pracujem priamo pre klientov. Staviam AI agentov, automatizácie a vlastné MCP servery a k tomu weby, e-shopy a aplikácie od prvého náčrtu po produkciu.',
      en: 'Under the Denva name I work directly with clients. I build AI agents, automations and custom MCP servers, plus websites, online stores and apps from first sketch to production.',
    },
  },
  {
    period: { start: 2017, end: null },
    company: 'Vibration s.r.o.',
    role: { sk: 'Web developer', en: 'Web developer' },
    text: {
      sk: 'Vyvíjam a dlhodobo spravujem WordPress, od veľkých multisite inštalácií po WooCommerce e-shopy. Popritom robím frontendy e-shopov na platforme Sellio (PHP Yii, Vue.js).',
      en: 'I build and maintain WordPress, from large multisite installs to WooCommerce stores. Alongside that I build store frontends on the Sellio e-commerce platform (PHP Yii, Vue.js).',
    },
  },
  {
    period: { start: 2021, end: 2025 },
    company: 'TENENET o.z.',
    role: { sk: 'Web developer a IT špecialista', en: 'Web developer & IT specialist' },
    text: {
      sk: 'Štyri roky remote pre neziskovú organizáciu: weby jej projektov, hlavný web a IT podpora pre kolegov.',
      en: 'Four years remote for a non-profit: sites for its projects, the main website and IT support for colleagues.',
    },
  },
  {
    period: { start: 2016, end: 2017 },
    company: 'Multimedia s.r.o.',
    role: { sk: 'Grafik (tlač a web)', en: 'Graphic designer & press operator' },
    text: {
      sk: 'Navrhoval som grafiku pre tlač aj web a obsluhoval tlačové stroje. Odtiaľ mám cit pre typografiu a detail.',
      en: "I designed graphics for print and web and ran the printing presses. That's where my eye for type and detail comes from.",
    },
  },
  {
    period: { start: 2015, end: 2016 },
    company: 'Comsultia s.r.o.',
    role: { sk: 'Web developer (stáž)', en: 'Web developer intern' },
    text: {
      sk: 'HTML, CSS a JavaScript pre agentúrne projekty. Tu som spustil svoje prvé weby a tu ma vývoj chytil.',
      en: "HTML, CSS and JavaScript for agency projects. My first sites went live here, and that's where I got hooked.",
    },
  },
];

/** "2017 - 2026"; an ongoing job ends in `currentYear`, and a single year stands alone. */
export function formatPeriod(period: Job['period'], currentYear: number): string {
  const end = period.end ?? currentYear;
  return end === period.start ? String(end) : `${period.start} - ${end}`;
}
