import type { Localized } from '../i18n/types';

export interface Job {
  readonly period: Localized<string>;
  readonly company: string;
  readonly role: Localized<string>;
  readonly text: Localized<string>;
}

export const JOBS: readonly Job[] = [
  {
    period: { sk: '2018 - dnes', en: '2018 - now' },
    company: 'Freelance',
    role: { sk: 'AI a fullstack developer', en: 'AI & fullstack developer' },
    text: {
      sk: 'Pod menom Denva robím priamo pre klientov: AI agenti, automatizácie a vlastné MCP servery, k tomu weby, e-shopy a aplikácie od prvého náčrtu po server.',
      en: 'Under the name Denva I work directly with clients: AI agents, automations and custom MCP servers, plus websites, stores and apps from the first sketch to the server.',
    },
  },
  {
    period: { sk: '2017 - dnes', en: '2017 - now' },
    company: 'Vibration s.r.o.',
    role: { sk: 'Web developer', en: 'Web developer' },
    text: {
      sk: 'WordPress od veľkých multisite inštalácií po WooCommerce e-shopy, vývoj aj dlhodobá správa. Popri tom frontendy e-shopov na platforme Sellio v PHP Yii a Vue.js.',
      en: 'WordPress from large multisite installs to WooCommerce stores, development and long-term care. Plus e-shop frontends on the Sellio platform in PHP Yii and Vue.js.',
    },
  },
  {
    period: { sk: '2021 - 2025', en: '2021 - 2025' },
    company: 'TENENET o.z.',
    role: { sk: 'Web developer a IT špecialista', en: 'Web developer & IT specialist' },
    text: {
      sk: 'Štyri roky v neziskovej organizácii: weby pre jej projekty, hlavný web a IT podpora pre kolegov.',
      en: 'Four years at a non-profit: sites for its projects, the main website and IT support for colleagues.',
    },
  },
  {
    period: { sk: '2016 - 2017', en: '2016 - 2017' },
    company: 'Multimedia s.r.o.',
    role: { sk: 'Grafik a tlačiar', en: 'Designer & printer' },
    text: {
      sk: 'Grafika pre tlač aj web a obsluha tlačových strojov. Odtiaľ mám cit pre typografiu a detail.',
      en: "Graphics for print and web, running print machines. That's where my eye for type and detail comes from.",
    },
  },
  {
    period: { sk: '2015 - 2016', en: '2015 - 2016' },
    company: 'Comsultia s.r.o.',
    role: { sk: 'Stáž', en: 'Internship' },
    text: {
      sk: 'HTML, CSS a JavaScript pre agentúrne projekty. Prvé weby, ktoré išli von - tu ma to chytilo.',
      en: 'HTML, CSS and JavaScript for agency projects. The first sites that went live - this is where it got me.',
    },
  },
];
