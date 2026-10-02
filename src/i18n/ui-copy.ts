import { headCopy } from './head-copy';
import type { Lang, Localized, UiCopy } from './types';

export const ui: Localized<UiCopy> = {
  sk: {
    more: 'Viac o projekte',
    scope: 'Čo som robil',
    open: 'Otvoriť web',
    close: 'Zavrieť',
    menu: 'Menu',
    menuClose: 'Zavrieť',
    prev: 'Predchádzajúci projekt',
    next: 'Ďalší projekt',
  },
  en: {
    more: 'Project details',
    scope: 'What I did',
    open: 'Visit site',
    close: 'Close',
    menu: 'Menu',
    menuClose: 'Close',
    prev: 'Previous project',
    next: 'Next project',
  },
};

export interface ContactCopy {
  readonly email: string;
  readonly emailHref: `mailto:${string}`;
  readonly phone: string;
  readonly phoneHref: `tel:${string}`;
  readonly cvHref: string;
}

// Same-origin PDFs printed from this site's data by scripts/build-cv-pdf.ts.
const CV_HREF: Localized<string> = { sk: '/cv/denis-varga-cv.pdf', en: '/cv/denis-varga-cv-en.pdf' };

function contactCopy(lang: Lang): ContactCopy {
  const { email } = headCopy[lang];
  return {
    email,
    emailHref: `mailto:${email}`,
    phone: '+421 902 074 830',
    phoneHref: 'tel:+421902074830',
    cvHref: CV_HREF[lang],
  };
}

export const contact: Localized<ContactCopy> = { sk: contactCopy('sk'), en: contactCopy('en') };
