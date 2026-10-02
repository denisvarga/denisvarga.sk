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

function contactCopy(lang: Lang): ContactCopy {
  const { email } = headCopy[lang];
  return {
    email,
    emailHref: `mailto:${email}`,
    phone: '+421 902 074 830',
    phoneHref: 'tel:+421902074830',
    cvHref: 'https://resume.denva.sk/wp-content/uploads/cv/denis-varga-cv.pdf',
  };
}

export const contact: Localized<ContactCopy> = { sk: contactCopy('sk'), en: contactCopy('en') };
