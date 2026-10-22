// Project card facts shared by the site (which adds the screenshots), the CV and the chat agent's
// facts. The drawer texts live per language in project-details-sk.ts and project-details-en.ts,
// so the client entry carries only what the cards show.

export type ProjectLang = 'sk' | 'en';

/** Who the work was done for: freelance under Denva, as a GrandPano or Vibration employee, or Denis's own product. */
export type ProjectContext = 'denva' | 'grandpano' | 'vibration' | 'own';

type Localized<T> = Readonly<Record<ProjectLang, T>>;

export interface ProjectInfo {
  readonly name: string;
  /** Public site, or null for a private project without one. */
  readonly url: string | null;
  readonly slug: string;
  readonly context: ProjectContext;
  /** Shown in the homepage rail; every project is in the full list. */
  readonly featured: boolean;
  readonly kind: Localized<string>;
  /** One line on the card. */
  readonly desc: Localized<string>;
  /** Who else was involved, shown on the card and in the drawer. */
  readonly credit?: Localized<string>;
}

/** One project's drawer texts in one language. */
export interface ProjectDetails {
  /** Opens the drawer: what the project is, in one or two sentences. */
  readonly summary: string;
  /** What was built, one item per line in the drawer. */
  readonly scope: readonly string[];
}

export type ProjectDetailsBySlug = Readonly<Record<string, ProjectDetails>>;

// Featured projects come first so the rail shows the same numbers as the full list.
export const PROJECT_INFO: readonly ProjectInfo[] = [
  {
    name: 'Denva Second Brain',
    url: null,
    slug: 'second-brain',
    context: 'own',
    featured: true,
    kind: { sk: 'Osobný AI systém', en: 'Personal AI system' },
    desc: {
      sk: 'Súkromný AI mozog: RAG nad pgvector, MCP server, Telegram bot a coding agent',
      en: 'A private AI brain: RAG on pgvector, an MCP server, a Telegram bot and a coding agent',
    },
  },
  {
    name: 'Národný futbalový štadión',
    url: 'https://narodnyfutbalovystadion.sk',
    slug: 'narodnyfutbalovystadion',
    context: 'denva',
    featured: true,
    kind: { sk: 'Web národného štadióna', en: 'National stadium website' },
    desc: {
      sk: 'Dvojjazyčný web štadióna s automatickým importom podujatí z Ticketportalu',
      en: 'Bilingual stadium website with automatic event import from Ticketportal',
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
      sk: 'Web rezidenčného projektu so živým cenníkom bytov synchronizovaným z Realpadu',
      en: 'Residential development site with a live flat price list synced from Realpad',
    },
    credit: { sk: 'Realizované ako zamestnanec GrandPano.', en: 'Built as an employee of GrandPano.' },
  },
  {
    name: 'Pangeas',
    url: 'https://pangeas.cz',
    slug: 'pangeas',
    context: 'denva',
    featured: true,
    kind: { sk: 'Multivendor marketplace', en: 'Multivendor marketplace' },
    desc: {
      sk: 'Český marketplace slow fashion na WooCommerce a Dokane s dopravou a zmluvami pre každého predajcu',
      en: 'Czech slow fashion marketplace on WooCommerce and Dokan with shipping and contracts per vendor',
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
      sk: 'Vlastný e-shop: z nahratej GPX trasy živý náhľad mapy a personalizovaný obraz',
      en: 'Own e-shop: a live map preview and a personalised print from an uploaded GPX route',
    },
  },
  {
    name: 'Monkey Studios',
    url: 'https://monkeystudios.com',
    slug: 'monkeystudios',
    context: 'denva',
    featured: true,
    kind: { sk: 'Štúdio 3D architektonických vizualizácií', en: '3D architectural visualization studio' },
    desc: {
      sk: 'Štvorjazyčný web so 106-snímkovou hero sekvenciou riadenou scrollom a vlastnými GSAP efektmi',
      en: 'Four-language site with a 106-frame scroll-driven hero sequence and custom GSAP effects',
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
      sk: 'Portfólio fotografa s podpisom, ktorý sa sám nakreslí, a vlastným GSAP lightboxom',
      en: "Photographer's portfolio with a self-drawing signature intro and a custom GSAP lightbox",
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
      sk: 'Web rezidenčného projektu s videom riadeným scrollom a živým cenníkom z Realpadu',
      en: 'Residential development site with scroll-driven video and a live price list from Realpad',
    },
    credit: { sk: 'Realizované ako zamestnanec GrandPano.', en: 'Built as an employee of GrandPano.' },
  },
  {
    name: 'Cherries',
    url: 'https://cherries.sk',
    slug: 'cherries',
    context: 'denva',
    featured: true,
    kind: { sk: 'Web nechtového štúdia', en: 'Nail studio website' },
    desc: {
      sk: 'Web nechtového štúdia s predajom darčekových poukážok cez Stripe a konfigurátorom farieb',
      en: 'Nail studio site selling gift vouchers through Stripe, with a colour configurator',
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
      sk: 'Web novej mestskej štvrte s newsletterom napojeným na Realpad a vlastným llms.txt',
      en: 'New city district site with a newsletter connected to Realpad and its own llms.txt',
    },
    credit: { sk: 'Realizované ako zamestnanec GrandPano.', en: 'Built as an employee of GrandPano.' },
  },
  {
    name: 'LEDpixel',
    url: 'https://ledpixel.sk',
    slug: 'ledpixel',
    context: 'denva',
    featured: false,
    kind: { sk: 'Prenájom LED stien', en: 'LED wall rental' },
    desc: {
      sk: 'Web prenájmu LED stien podľa Figmy 1:1, so zhodou overenou automatickým meraním',
      en: 'LED wall rental site built 1:1 from Figma, with the match checked by automated measuring',
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
      sk: 'Kampaňový web kandidáta na primátora Skalice s transparenčnými oznámeniami podľa EÚ 2024/900',
      en: 'Campaign site for a Skalica mayoral candidate with EU 2024/900 transparency notices',
    },
    credit: { sk: 'V spolupráci s be-you.sk.', en: 'In collaboration with be-you.sk.' },
  },
  {
    name: 'Limo Prestige',
    url: 'https://limo-prestige.sk',
    slug: 'limoprestige',
    context: 'denva',
    featured: false,
    kind: { sk: 'Prémiová preprava s osobným šoférom', en: 'Premium chauffeur service' },
    desc: { sk: 'WordPress téma na mieru podľa dodanej grafiky', en: 'Custom WordPress theme from the supplied design' },
    credit: { sk: 'V spolupráci s be-you.sk.', en: 'In collaboration with be-you.sk.' },
  },
  {
    name: 'Marani',
    url: 'https://maranibratislava.sk',
    slug: 'maranibratislava',
    context: 'denva',
    featured: false,
    kind: { sk: 'Gruzínska reštaurácia', en: 'Georgian restaurant' },
    desc: { sk: 'WordPress téma na mieru podľa dodanej grafiky', en: 'Custom WordPress theme from the supplied design' },
    credit: { sk: 'V spolupráci s be-you.sk.', en: 'In collaboration with be-you.sk.' },
  },
  {
    name: 'Slovan Bratislava',
    url: 'https://slovan.disponea.sk',
    slug: 'slovandisponea',
    context: 'denva',
    featured: false,
    kind: { sk: 'Objednávky fotiek a hráčskych kartičiek', en: 'Photo and player card orders' },
    desc: {
      sk: 'Vlastný objednávkový systém na WordPresse bez WooCommerce so Stripe a PDF faktúrami',
      en: 'A custom WordPress order system without WooCommerce, with Stripe and PDF invoices',
    },
    credit: { sk: 'V spolupráci s be-you.sk.', en: 'In collaboration with be-you.sk.' },
  },
  {
    name: 'Chata Mýto',
    url: 'https://chatamyto.sk',
    slug: 'chatamyto',
    context: 'denva',
    featured: false,
    kind: { sk: 'Prenájom chát v Nízkych Tatrách', en: 'Chalet rentals in the Low Tatras' },
    desc: {
      sk: 'Web chát s wellness so štruktúrovanými dátami ubytovania a cookie lištou na mieru',
      en: 'Wellness chalet site with lodging structured data and a custom cookie consent',
    },
  },
  {
    name: 'Nerina',
    url: 'https://nerina.sk',
    slug: 'nerina',
    context: 'denva',
    featured: false,
    kind: { sk: 'Ubytovanie pri Donovaloch', en: 'Chalet stay near Donovaly' },
    desc: {
      sk: 'Štvorjazyčný web dvojchaty s automatizovaným blogom a štruktúrovanými dátami ubytovania',
      en: 'Four-language twin chalet site with an automated blog and lodging structured data',
    },
  },
  {
    name: 'HABERA & TEAM',
    url: 'https://team-online.sk',
    slug: 'teamonline',
    context: 'denva',
    featured: false,
    kind: { sk: 'Web hudobnej skupiny', en: 'Band website' },
    desc: {
      sk: 'Redizajn webu kapely na WordPress tému na mieru namiesto šablóny a page buildera Divi',
      en: 'Band site redesigned onto a custom-built WordPress theme in place of the Divi theme and page builder',
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
      sk: 'Jednostránkový kampaňový web s riešeniami v dialógových oknách a podnetmi pre lokality',
      en: 'One-page campaign site with solutions in dialogs and suggestions per locality',
    },
  },
  {
    name: 'Slovenský Červený kríž',
    url: 'https://redcross.sk',
    slug: 'redcross',
    context: 'vibration',
    featured: false,
    kind: { sk: 'WordPress multisite sieť', en: 'WordPress multisite network' },
    desc: {
      sk: 'Téma na mieru pre WordPress multisite s viac ako 70 samostatnými webmi',
      en: 'Custom theme for a WordPress multisite with more than 70 separate sites',
    },
    credit: { sk: 'Realizované ako zamestnanec Vibration.', en: 'Built as an employee of Vibration.' },
  },
  {
    name: '123gold',
    url: 'https://trauring-zentrum-mainz.de',
    slug: '123gold',
    context: 'vibration',
    featured: false,
    kind: { sk: 'Multisite sieť 72 webov zlatníctiev', en: 'Multisite network of 72 jewellery store sites' },
    desc: {
      sk: 'Migrácia na novú WooCommerce multisite infraštruktúru so 72 webmi a nočnou synchronizáciou produktov cez API',
      en: 'Migration to a new WooCommerce multisite infrastructure of 72 sites with nightly product sync over an API',
    },
    credit: { sk: 'Realizované ako zamestnanec Vibration.', en: 'Built as an employee of Vibration.' },
  },
  {
    name: 'Lekár.sk',
    url: 'https://lekar.sk',
    slug: 'lekar',
    context: 'vibration',
    featured: false,
    kind: { sk: 'Zdravotný portál', en: 'Health portal' },
    desc: {
      sk: 'Zdravotný portál presťahovaný z pôvodného CMS do WordPressu s viac ako 7 tisíc presmerovaniami',
      en: 'Health portal moved from its original CMS to WordPress with more than 7,000 redirects',
    },
    credit: { sk: 'Realizované ako zamestnanec Vibration.', en: 'Built as an employee of Vibration.' },
  },
  {
    name: 'Sadíme budúcnosť',
    url: 'https://sadimebuducnost.sk',
    slug: 'sadimebuducnost',
    context: 'vibration',
    featured: false,
    kind: { sk: 'Darcovský web projektu výsadby stromov', en: 'Tree planting donation website' },
    desc: {
      sk: 'Interaktívna mapa s tisíckami výsadieb a vlastný darovací formulár s platbou cez Stripe',
      en: 'An interactive map of thousands of plantings and a custom donation form paid through Stripe',
    },
    credit: { sk: 'Realizované ako zamestnanec Vibration.', en: 'Built as an employee of Vibration.' },
  },
  {
    name: 'Online žiak',
    url: 'https://onlineziak.sk',
    slug: 'onlineziak',
    context: 'vibration',
    featured: false,
    kind: { sk: 'Vzdelávací portál', en: 'Education portal' },
    desc: {
      sk: 'Vzdelávací portál s vyhľadávaním, ktoré rozumie slovenským tvarom slov',
      en: 'Education portal with a search that understands Slovak word forms',
    },
    credit: { sk: 'Realizované ako zamestnanec Vibration.', en: 'Built as an employee of Vibration.' },
  },
  {
    name: 'Elektrárňa Piešťany',
    url: 'https://elektrarnapiestany.sk',
    slug: 'elektrarnapiestany',
    context: 'vibration',
    featured: false,
    kind: { sk: 'Web na mieru', en: 'Custom website' },
    desc: {
      sk: 'Vlastná WordPress téma podľa dizajnu 1:1',
      en: 'Custom WordPress theme 1:1 from the design',
    },
    credit: { sk: 'Realizované ako zamestnanec Vibration.', en: 'Built as an employee of Vibration.' },
  },
  {
    name: 'Chiptech',
    url: 'https://chiptech.sk',
    slug: 'chiptech',
    context: 'vibration',
    featured: false,
    kind: { sk: 'Chiptuning vozidiel', en: 'Vehicle chiptuning' },
    desc: {
      sk: 'Pokročilý filter vozidiel doprogramovaný do existujúcej témy',
      en: 'An advanced vehicle filter built into an existing theme',
    },
    credit: { sk: 'Realizované ako zamestnanec Vibration.', en: 'Built as an employee of Vibration.' },
  },
  {
    name: 'Vibration',
    url: 'https://vibration.sk',
    slug: 'vibration',
    context: 'vibration',
    featured: false,
    kind: { sk: 'Firemný web', en: 'Company website' },
    desc: {
      sk: 'Úpravy a programovanie frontendu firemného webu na vlastnej platforme Sellio 2',
      en: 'Frontend changes and development of the company site on the in-house Sellio 2 platform',
    },
    credit: { sk: 'Realizované ako zamestnanec Vibration.', en: 'Built as an employee of Vibration.' },
  },
  {
    name: 'Zlatníctvo Horváth',
    url: 'https://zlatnictvohorvath.sk',
    slug: 'zlatnictvohorvath',
    context: 'vibration',
    featured: false,
    kind: { sk: 'E-shop zlatníctva', en: 'Jewellery store' },
    desc: {
      sk: 'Vue komponenty a frontend e-shopu podľa Figmy 1:1, s videom na produktových kartách',
      en: 'Vue components and a store frontend 1:1 from Figma, with video on product cards',
    },
    credit: { sk: 'Realizované ako zamestnanec Vibration.', en: 'Built as an employee of Vibration.' },
  },
  {
    name: 'Voňavý domov',
    url: 'https://vonavydomov.eu',
    slug: 'vonavydomov',
    context: 'vibration',
    featured: false,
    kind: { sk: 'E-shop s parfumami na pranie', en: 'Laundry perfume store' },
    desc: {
      sk: 'E-shop v 7 jazykoch na 7 doménach, s piatimi dopravcami a výkonom ako referencia platformy',
      en: 'Store in 7 languages on 7 domains, with five carriers and performance that sets the platform reference',
    },
    credit: { sk: 'Realizované ako zamestnanec Vibration.', en: 'Built as an employee of Vibration.' },
  },
  {
    name: 'Tatranský profil',
    url: 'https://tatranskyprofil.eu',
    slug: 'tatranskyprofil',
    context: 'vibration',
    featured: false,
    kind: { sk: 'E-shop so severským drevom', en: 'Nordic timber store' },
    desc: {
      sk: 'Najväčšia téma platformy Sellio 2: 191 komponentov a kontrola doručenia do Poľska na SVG mape',
      en: 'The largest theme on Sellio 2: 191 components and a Polish delivery check on an SVG map',
    },
    credit: { sk: 'Realizované ako zamestnanec Vibration.', en: 'Built as an employee of Vibration.' },
  },
  {
    name: 'Najkoberce',
    url: 'https://najkoberce.sk',
    slug: 'najkoberce',
    context: 'vibration',
    featured: false,
    kind: { sk: 'E-shop s kobercami', en: 'Carpet store' },
    desc: {
      sk: 'Frontend e-shopu na Yii platforme Sellio 1 pre slovenskú aj českú doménu',
      en: 'Store frontend on the Yii-based Sellio 1 platform for a Slovak and a Czech domain',
    },
    credit: { sk: 'Realizované ako zamestnanec Vibration.', en: 'Built as an employee of Vibration.' },
  },
  {
    name: 'Tomaflora',
    url: 'https://tomaflora.sk',
    slug: 'tomaflora',
    context: 'vibration',
    featured: false,
    kind: { sk: 'E-shop s izbovými rastlinami', en: 'Houseplant store' },
    desc: {
      sk: 'Šablóna e-shopu na Sellio 1 podľa dizajnu 1:1 s Instagram feedom a zoomom fotiek',
      en: 'Store template on Sellio 1 1:1 from the design, with an Instagram feed and photo zoom',
    },
    credit: { sk: 'Realizované ako zamestnanec Vibration.', en: 'Built as an employee of Vibration.' },
  },
  {
    name: 'Madad',
    url: 'https://madad.sk',
    slug: 'madad',
    context: 'vibration',
    featured: false,
    kind: { sk: 'E-shop Madness Advertising', en: 'Madness Advertising store' },
    desc: {
      sk: 'Frontend e-shopu na Sellio 1 podľa dizajnu 1:1 s balíčkami produktov',
      en: 'Store frontend on Sellio 1 1:1 from the design, with product packs',
    },
    credit: { sk: 'Realizované ako zamestnanec Vibration.', en: 'Built as an employee of Vibration.' },
  },
  {
    name: 'Dermateq',
    url: 'https://dermateq.sk',
    slug: 'dermateq',
    context: 'denva',
    featured: false,
    kind: { sk: 'Web dodávateľa technológií pre kliniky', en: 'Clinic technology supplier website' },
    desc: {
      sk: '36 ACF blokov, vlastný obsahový model technológií a výsledkov, critical CSS pre každú šablónu',
      en: '36 ACF blocks, a custom content model for technologies and results, critical CSS per template',
    },
  },
  {
    name: 'Auto Omnium',
    url: 'https://autoomnium.sk',
    slug: 'autoomnium',
    context: 'denva',
    featured: false,
    kind: { sk: 'Web predajcu BMW', en: 'BMW dealer website' },
    desc: {
      sk: 'Trojjazyčný web predajcu BMW s AI prekladom vozidiel cez OpenAI a cenami v CZK podľa kurzu ECB',
      en: 'Three-language BMW dealer site with AI translation of vehicles through OpenAI and CZK prices from the ECB rate',
    },
  },
  {
    name: 'Saunika',
    url: 'https://saunika.sk',
    slug: 'saunika',
    context: 'denva',
    featured: false,
    kind: { sk: 'E-shop', en: 'Online store' },
    desc: {
      sk: 'E-shop na WooCommerce s vlastnou témou podľa dodanej grafiky',
      en: "WooCommerce store with a custom theme from the client's design",
    },
  },
  {
    name: 'AK Baltazarovič',
    url: 'https://akbaltazarovic.eu',
    slug: 'akbaltazarovic',
    context: 'denva',
    featured: false,
    kind: { sk: 'Web advokátskej kancelárie', en: 'Law firm website' },
    desc: {
      sk: 'Web advokátskej kancelárie prenesený zo statického HTML do WordPressu so zhodou 1:1',
      en: 'Law firm site moved from static HTML to WordPress with a 1:1 visual match',
    },
  },
  {
    name: 'A-Studio',
    url: 'https://adrianastudio.sk',
    slug: 'adrianastudio',
    context: 'denva',
    featured: false,
    kind: { sk: 'Web interiérového štúdia', en: 'Interior design studio website' },
    desc: {
      sk: 'Web interiérového štúdia s referenciami, plynulými animáciami a vlastnou galériou',
      en: 'Interior design studio site with references, smooth animation and a custom gallery',
    },
  },
  {
    name: 'School of Arts',
    url: 'https://schoolofarts.sk',
    slug: 'schoolofarts',
    context: 'denva',
    featured: false,
    kind: { sk: 'Web umeleckej školy', en: 'Art school website' },
    desc: {
      sk: 'Web umeleckej školy s kurzami, lektormi a promo systémom',
      en: 'Art school site with courses, tutors and a promo system',
    },
  },
  {
    name: 'Nora Horváthová',
    url: 'https://norahorvathova.sk',
    slug: 'norahorvathova',
    context: 'denva',
    featured: false,
    kind: { sk: 'Kampaňový web kandidátky na starostku', en: 'Mayoral candidate campaign website' },
    desc: {
      sk: 'Kampaňový web s anonymnými podnetmi a tlačovými materiálmi generovanými z kódu',
      en: 'Campaign site with anonymous suggestions and print materials generated from code',
    },
  },
  {
    name: 'Denva',
    url: 'https://denva.studio',
    slug: 'denva',
    context: 'own',
    featured: false,
    kind: { sk: 'Osobný web', en: 'Personal website' },
    desc: {
      sk: 'Štvorjazyčný web s automatizovaným blogom a medzinárodným SEO',
      en: 'Four-language site with an automated blog and international SEO',
    },
  },
];
