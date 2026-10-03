import adrianastudio from '../assets/projects/adrianastudio.webp';
import akbaltazarovic from '../assets/projects/akbaltazarovic.webp';
import autoomnium from '../assets/projects/autoomnium.webp';
import cherries from '../assets/projects/cherries.webp';
import denva from '../assets/projects/denva.webp';
import dermateq from '../assets/projects/dermateq.webp';
import narodnyfutbalovystadion from '../assets/projects/narodnyfutbalovystadion.webp';
import norahorvathova from '../assets/projects/norahorvathova.webp';
import pangeas from '../assets/projects/pangeas.webp';
import routie from '../assets/projects/routie.webp';
import saunika from '../assets/projects/saunika.webp';
import schoolofarts from '../assets/projects/schoolofarts.webp';
import type { Localized } from '../i18n/types';

export interface Project {
  readonly name: string;
  readonly url: string;
  readonly slug: string;
  readonly desc: Localized<string>;
  readonly image: string;
}

export const PROJECT_IMAGE_SIZE = { width: 1280, height: 800 } as const;

export const PROJECTS: readonly Project[] = [
  {
    name: 'Národný futbalový štadión',
    url: 'https://narodnyfutbalovystadion.sk',
    slug: 'narodnyfutbalovystadion',
    desc: { sk: 'Téma na mieru, napojenie na Ticketportal', en: 'Custom theme, Ticketportal integration' },
    image: narodnyfutbalovystadion,
  },
  {
    name: 'Pangeas',
    url: 'https://pangeas.cz',
    slug: 'pangeas',
    desc: {
      sk: 'Multivendor marketplace (Dokan), Stripe Express, Packeta, PDF fakturácia',
      en: 'Multivendor marketplace (Dokan), Stripe Express, Packeta, PDF invoicing',
    },
    image: pangeas,
  },
  {
    name: 'Routie',
    url: 'https://routie.sk',
    slug: 'routie',
    desc: {
      sk: 'Môj vlastný e-shop: mapové artworky z GPX trás, 2D a 3D generovanie, 3D tlač',
      en: 'My own e-shop: map artworks from GPX routes, 2D & 3D generation, 3D printing',
    },
    image: routie,
  },
  {
    name: 'Dermateq',
    url: 'https://dermateq.sk',
    slug: 'dermateq',
    desc: {
      sk: 'WordPress na mieru, ACF bloky, Vite build, GSAP animácie',
      en: 'Custom WordPress, ACF blocks, Vite build, GSAP animations',
    },
    image: dermateq,
  },
  {
    name: 'Cherries',
    url: 'https://cherries.sk',
    slug: 'cherries',
    desc: {
      sk: 'Vlastný systém darčekových poukážok, mini konfigurátor nechtov',
      en: 'Custom gift voucher system, mini nail configurator',
    },
    image: cherries,
  },
  {
    name: 'Auto Omnium',
    url: 'https://autoomnium.sk',
    slug: 'autoomnium',
    desc: { sk: 'Web predajcu vozidiel, vlastná téma', en: 'Car dealer website, custom theme' },
    image: autoomnium,
  },
  {
    name: 'Saunika',
    url: 'https://saunika.sk',
    slug: 'saunika',
    desc: {
      sk: 'Téma na mieru, WooCommerce podľa dodanej grafiky',
      en: "Custom theme and WooCommerce from the client's design",
    },
    image: saunika,
  },
  {
    name: 'AK Baltazarovič',
    url: 'https://akbaltazarovic.eu',
    slug: 'akbaltazarovic',
    desc: { sk: 'Web advokátskej kancelárie, vlastná téma', en: 'Law firm website, custom theme' },
    image: akbaltazarovic,
  },
  {
    name: 'A-Studio',
    url: 'https://adrianastudio.sk',
    slug: 'adrianastudio',
    desc: {
      sk: 'Prezentácia interiérového štúdia, vlastná téma',
      en: 'Interior design studio showcase, custom theme',
    },
    image: adrianastudio,
  },
  {
    name: 'School of Arts',
    url: 'https://schoolofarts.sk',
    slug: 'schoolofarts',
    desc: { sk: 'Web umeleckej školy, vlastná téma', en: 'Art school website, custom theme' },
    image: schoolofarts,
  },
  {
    name: 'Nora Horváthová',
    url: 'https://norahorvathova.sk',
    slug: 'norahorvathova',
    desc: { sk: 'Kampaňový web komunálnej kandidátky', en: 'Campaign site for a municipal candidate' },
    image: norahorvathova,
  },
  {
    name: 'Denva',
    url: 'https://denva.studio',
    slug: 'denva',
    desc: {
      sk: 'Môj osobný web a meno, pod ktorým robím na voľnej nohe',
      en: 'My personal site and the name I freelance under',
    },
    image: denva,
  },
];
