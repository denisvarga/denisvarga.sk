// Project facts shared by the site (which adds the screenshots) and the chat agent's facts.

export type ProjectLang = 'sk' | 'en';

/** Who the work was done for: freelance under Denva, as a GrandPano employee, or Denis's own product. */
export type ProjectContext = 'denva' | 'grandpano' | 'own';

export interface ProjectInfo {
  readonly name: string;
  readonly url: string;
  readonly slug: string;
  readonly context: ProjectContext;
  /** Shown in the homepage rail; every project is in the full list. */
  readonly featured: boolean;
  readonly kind: Readonly<Record<ProjectLang, string>>;
  readonly desc: Readonly<Record<ProjectLang, string>>;
}

// Featured projects come first so the rail shows the same numbers as the full list.
export const PROJECT_INFO: readonly ProjectInfo[] = [
  {
    name: 'Národný futbalový štadión',
    url: 'https://narodnyfutbalovystadion.sk',
    slug: 'narodnyfutbalovystadion',
    context: 'denva',
    featured: true,
    kind: { sk: 'Web národného štadióna', en: 'National stadium website' },
    desc: {
      sk: 'Téma na mieru, napojenie na feed vstupeniek z Ticketportalu',
      en: 'Custom theme, Ticketportal ticket feed integration',
    },
  },
  {
    name: 'Brixx',
    url: 'https://brixx.cz',
    slug: 'brixx',
    context: 'grandpano',
    featured: true,
    kind: { sk: 'Web rezidenčného projektu', en: 'Residential development website' },
    desc: {
      sk: 'Téma od základu podľa Figmy 1:1, napojenie na Realpad: synchronizácia cenníka a odosielanie leadov, SEO a LLM optimalizácia, optimalizácia výkonu, GSAP a vlastné animácie',
      en: 'Theme built from scratch 1:1 from Figma, Realpad integration: price list sync and lead delivery, SEO and LLM optimization, performance optimization, GSAP and custom animations',
    },
  },
  {
    name: 'Pangeas',
    url: 'https://pangeas.cz',
    slug: 'pangeas',
    context: 'denva',
    featured: true,
    kind: { sk: 'Marketplace', en: 'Marketplace' },
    desc: {
      sk: 'Multivendor marketplace (Dokan), Stripe Express, Packeta, PDF fakturácia',
      en: 'Multivendor marketplace (Dokan), Stripe Express, Packeta, PDF invoicing',
    },
  },
  {
    name: 'Routie',
    url: 'https://routie.sk',
    slug: 'routie',
    context: 'own',
    featured: true,
    kind: { sk: 'E-shop s mapovými artworkmi', en: 'Map artwork store' },
    desc: {
      sk: 'Vlastný e-shop: mapové artworky z GPX trás, 2D a 3D generovanie, 3D tlač',
      en: 'Own e-shop: map artworks from GPX routes, 2D & 3D generation, 3D printing',
    },
  },
  {
    name: 'Monkey Studio',
    url: 'https://monkeystudios.com',
    slug: 'monkeystudios',
    context: 'denva',
    featured: true,
    kind: { sk: 'Štúdio 3D architektonických vizualizácií', en: '3D architectural visualization studio' },
    desc: {
      sk: 'WordPress téma na mieru podľa dodaného dizajnu 1:1, GSAP a vlastné animácie, SEO a optimalizácia rýchlosti',
      en: 'Custom WordPress theme 1:1 from the supplied design, GSAP and custom animations, SEO and speed optimization',
    },
  },
  {
    name: 'Rkovacovsky Photo',
    url: 'https://rkovacovsky.sk',
    slug: 'rkovacovsky',
    context: 'denva',
    featured: true,
    kind: { sk: 'Portfólio fotografa a grafika', en: 'Photographer and designer portfolio' },
    desc: {
      sk: 'Téma na mieru podľa dodanej grafiky, pokročilé vizuálne animácie, GSAP',
      en: 'Custom theme from the supplied design, advanced visual animations, GSAP',
    },
  },
  {
    name: 'Zanzara',
    url: 'https://zanzara.cz',
    slug: 'zanzara',
    context: 'grandpano',
    featured: true,
    kind: { sk: 'Web rezidenčného projektu', en: 'Residential development website' },
    desc: {
      sk: 'Téma od základu podľa Figmy 1:1, napojenie na Realpad: synchronizácia cenníka a odosielanie leadov, SEO a LLM optimalizácia, optimalizácia výkonu, GSAP a vlastné animácie',
      en: 'Theme built from scratch 1:1 from Figma, Realpad integration: price list sync and lead delivery, SEO and LLM optimization, performance optimization, GSAP and custom animations',
    },
  },
  {
    name: 'Cherries',
    url: 'https://cherries.sk',
    slug: 'cherries',
    context: 'denva',
    featured: true,
    kind: { sk: 'E-shop', en: 'Online store' },
    desc: {
      sk: 'Vlastný systém darčekových poukážok, mini konfigurátor nechtov',
      en: 'Custom gift voucher system, mini nail configurator',
    },
  },
  {
    name: 'Nová Trnitá',
    url: 'https://novatrnita.cz',
    slug: 'novatrnita',
    context: 'grandpano',
    featured: false,
    kind: { sk: 'Web novej mestskej štvrte', en: 'New city district website' },
    desc: {
      sk: 'Téma od základu podľa Figmy 1:1, napojenie na Realpad: odosielanie leadov, SEO a LLM optimalizácia, optimalizácia výkonu, GSAP a vlastné animácie',
      en: 'Theme built from scratch 1:1 from Figma, Realpad integration: lead delivery, SEO and LLM optimization, performance optimization, GSAP and custom animations',
    },
  },
  {
    name: 'LEDpixel',
    url: 'https://ledpixel.sk',
    slug: 'ledpixel',
    context: 'denva',
    featured: false,
    kind: { sk: 'Prenájom LED stien', en: 'LED wall rental' },
    desc: {
      sk: 'WordPress téma na mieru podľa dodaného dizajnu 1:1, GSAP a vlastné animácie, SEO a optimalizácia rýchlosti',
      en: 'Custom WordPress theme 1:1 from the supplied design, GSAP and custom animations, SEO and speed optimization',
    },
  },
  {
    name: 'Juraj Mikúš',
    url: 'https://jurajmikus.sk',
    slug: 'jurajmikus',
    context: 'denva',
    featured: false,
    kind: { sk: 'Kampaňový web kandidáta na primátora', en: 'Mayoral campaign website' },
    desc: {
      sk: 'V spolupráci s be-you.sk, návrh dizajnu a grafiky, vlastná téma podľa vytvorenej grafiky',
      en: 'In collaboration with be-you.sk, design and graphics, custom theme built from that design',
    },
  },
  {
    name: 'Jaroslav Koštial',
    url: 'https://jaroslavkostial.sk',
    slug: 'jaroslavkostial',
    context: 'denva',
    featured: false,
    kind: { sk: 'Kampaňový web nezávislého kandidáta', en: 'Independent candidate campaign website' },
    desc: {
      sk: 'Podľa požiadaviek klienta, návrh dizajnu, vlastná téma na mieru',
      en: "Built to the client's brief, design, custom theme",
    },
  },
  {
    name: 'Dermateq',
    url: 'https://dermateq.sk',
    slug: 'dermateq',
    context: 'denva',
    featured: false,
    kind: { sk: 'Firemný web', en: 'Company website' },
    desc: {
      sk: 'WordPress na mieru, ACF bloky, Vite build, GSAP animácie',
      en: 'Custom WordPress, ACF blocks, Vite build, GSAP animations',
    },
  },
  {
    name: 'Auto Omnium',
    url: 'https://autoomnium.sk',
    slug: 'autoomnium',
    context: 'denva',
    featured: false,
    kind: { sk: 'Web predajcu vozidiel', en: 'Car dealer website' },
    desc: { sk: 'Web predajcu vozidiel, vlastná téma', en: 'Car dealer website, custom theme' },
  },
  {
    name: 'Saunika',
    url: 'https://saunika.sk',
    slug: 'saunika',
    context: 'denva',
    featured: false,
    kind: { sk: 'E-shop', en: 'Online store' },
    desc: {
      sk: 'Téma na mieru, WooCommerce podľa dodanej grafiky',
      en: "Custom theme and WooCommerce from the client's design",
    },
  },
  {
    name: 'AK Baltazarovič',
    url: 'https://akbaltazarovic.eu',
    slug: 'akbaltazarovic',
    context: 'denva',
    featured: false,
    kind: { sk: 'Web advokátskej kancelárie', en: 'Law firm website' },
    desc: { sk: 'Web advokátskej kancelárie, vlastná téma', en: 'Law firm website, custom theme' },
  },
  {
    name: 'A-Studio',
    url: 'https://adrianastudio.sk',
    slug: 'adrianastudio',
    context: 'denva',
    featured: false,
    kind: { sk: 'Web interiérového štúdia', en: 'Interior design studio website' },
    desc: {
      sk: 'Prezentácia interiérového štúdia, vlastná téma',
      en: 'Interior design studio showcase, custom theme',
    },
  },
  {
    name: 'School of Arts',
    url: 'https://schoolofarts.sk',
    slug: 'schoolofarts',
    context: 'denva',
    featured: false,
    kind: { sk: 'Web umeleckej školy', en: 'Art school website' },
    desc: { sk: 'Web umeleckej školy, vlastná téma', en: 'Art school website, custom theme' },
  },
  {
    name: 'Nora Horváthová',
    url: 'https://norahorvathova.sk',
    slug: 'norahorvathova',
    context: 'denva',
    featured: false,
    kind: { sk: 'Kampaňový web', en: 'Campaign website' },
    desc: { sk: 'Kampaňový web komunálnej kandidátky', en: 'Campaign site for a municipal candidate' },
  },
  {
    name: 'Denva',
    url: 'https://denva.studio',
    slug: 'denva',
    context: 'own',
    featured: false,
    kind: { sk: 'Osobný web', en: 'Personal website' },
    desc: {
      sk: 'Osobný web a značka pre prácu na voľnej nohe',
      en: 'Personal site and freelance brand',
    },
  },
];
