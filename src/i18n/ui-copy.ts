import type { Localized, UiCopy } from './types';

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

export const contact = {
  email: 'hello@denisvarga.sk',
  emailHref: 'mailto:hello@denisvarga.sk',
  phone: '+421 902 074 830',
  phoneHref: 'tel:+421902074830',
  cvHref: 'https://resume.denva.sk/wp-content/uploads/cv/denis-varga-cv.pdf',
} as const;
