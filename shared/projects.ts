// Project facts shared by the site (which adds the screenshots) and the chat agent's facts.

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
  /** Opens the drawer: what the project is, in one or two sentences. */
  readonly summary: Localized<string>;
  /** What was built, one item per line in the drawer. */
  readonly scope: Localized<readonly string[]>;
  /** Who else was involved, shown on the card and in the drawer. */
  readonly credit?: Localized<string>;
}

// Featured projects come first so the rail shows the same numbers as the full list.
// Every scope item is backed by the project's source code; keep it that way when editing.
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
    summary: {
      sk: 'Osobný systém, ktorý zbiera poznámky, e-maily, články, hlasové správy aj fotky, triedi ich cez Claude a robí z nich prehľadávateľnú znalostnú bázu. Beží na dvoch miestach: riadiaca vrstva na Hetzner VPS, lokálne modely a agenti na stále zapnutom Macu, prepojené cez Tailscale.',
      en: 'A personal system that collects notes, emails, articles, voice messages and photos, classifies them with Claude and turns them into a searchable knowledge base. It runs in two places: the control plane on a Hetzner VPS, local models and agents on an always-on Mac, connected over Tailscale.',
    },
    scope: {
      sk: [
        'RAG nad PostgreSQL 17 a pgvector: embeddingy bge-m3 v HNSW indexe, hybridné vyhľadávanie (vektory, fulltext a trigramy) spojené cez reciprocal rank fusion a reranker bge-reranker-v2-m3',
        'Odpovede s citovanými zdrojmi a vlastný MCP server s nástrojmi na vyhľadávanie, otázky, zachytávanie poznámok a úlohy',
        'Telegram bot na zachytávanie obsahu, rozhovor s asistentom a schvaľovanie krokov agentov',
        'Coding agent nad Claude Agent SDK v oddelených git worktrees, v sandboxe bez prístupových údajov, s plánom na schválenie v Telegrame a pull requestom cez GitHub App',
        'Lokálne modely na Apple Silicon: prepis reči cez mlx-whisper (aj v slovenčine), OCR cez Apple Vision a generovanie cez mlx-lm',
        'Plánované joby vo fronte pg-boss: denné súhrny, kompilácia stránok znalostnej bázy, údržba a samoopravné úlohy',
        'Docker Compose, Caddy a Cloudflare Access, deploy so zálohou databázy, health checkom a automatickým rollbackom, nočné zálohy s týždenným testom obnovy',
      ],
      en: [
        'RAG on PostgreSQL 17 and pgvector: bge-m3 embeddings in an HNSW index, hybrid search (vectors, full text and trigrams) merged with reciprocal rank fusion and a bge-reranker-v2-m3 reranker',
        'Answers with cited sources and its own MCP server with tools for search, questions, note capture and tasks',
        'Telegram bot for capturing content, chatting with the assistant and approving agent steps',
        'Coding agent on the Claude Agent SDK in separate git worktrees, sandboxed without credentials, with plans approved in Telegram and pull requests opened by a GitHub App',
        'Local models on Apple Silicon: speech to text with mlx-whisper (Slovak included), OCR with Apple Vision and generation with mlx-lm',
        'Scheduled jobs on a pg-boss queue: daily digests, knowledge base page compilation, maintenance and self-healing tasks',
        'Docker Compose, Caddy and Cloudflare Access, deploys with a database backup, health check and automatic rollback, nightly backups with a weekly restore test',
      ],
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
    summary: {
      sk: 'Web Národného futbalového štadióna v slovenčine a angličtine. Podujatia sa doň každý deň načítajú z XML feedu Ticketportalu, takže program je aktuálny bez ručnej práce.',
      en: 'The National Football Stadium website in Slovak and English. Events are loaded every day from the Ticketportal XML feed, so the programme stays current without manual work.',
    },
    scope: {
      sk: [
        'Denný import XML feedu Ticketportalu cez WP-Cron aj tlačidlom v administrácii: vytvára a aktualizuje podujatia, kategórie a obrázky a odstraňuje tie, ktoré už prebehli',
        'SEO pre importované podujatia: jedna kanonická URL pre duplicitné názvy, podujatia bez vlastného textu mimo sitemapy a vyhľadávania',
        'Slovenská a anglická verzia cez WPML s vlastným helperom na dvojjazyčné texty v šablónach',
        '14 ACF blokov vrátane máp štadióna a areálu, podujatí a fanshopu',
        'Turnstile s overením hostname aj akcie, cookie lišta s Consent Mode v2 a hardening WordPressu',
      ],
      en: [
        'Daily import of the Ticketportal XML feed via WP-Cron or a button in the admin: it creates and updates events, categories and images and removes past events',
        'SEO for imported events: one canonical URL for duplicate titles, events without their own text kept out of the sitemap and search',
        'Slovak and English versions on WPML with a custom helper for bilingual template copy',
        '14 ACF blocks including stadium and park maps, events and a fan shop',
        'Turnstile that also checks hostname and action, a cookie bar with Consent Mode v2 and WordPress hardening',
      ],
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
    summary: {
      sk: 'Web rezidenčného projektu v Brne postavený od základu podľa Figmy 1:1. Cenník bytov sa každú hodinu sám synchronizuje z CRM Realpad a dopyty z formulárov idú rovno do Realpadu ako leady.',
      en: 'A residential development site in Brno, built from scratch 1:1 from Figma. The flat price list syncs itself from the Realpad CRM every hour, and form enquiries go straight into Realpad as leads.',
    },
    scope: {
      sk: [
        'Hodinová synchronizácia bytov z Realpadu do vlastného post typu: podlažia, PDF karty bytov, história synchronizácií a WP-CLI príkaz s dry-run',
        'Po každej synchronizácii sa premaže LiteSpeed cache aj Redis object cache',
        'Leady z formulárov do Realpad API so štruktúrovanými GDPR súhlasmi a zálohou v administrácii',
        'Cenník s AJAX filtrami, cenovým sliderom, filtrami v URL a obľúbenými bytmi',
        'VR prehliadky v krpano: 7 prehliadok a 178 z 361 bytov prepojených s interiérom',
        '42 ACF blokov, anglická verzia cez WPML, GSAP a Lenis animácie',
        'Vlastná cookie lišta s Consent Mode v2, schema RealEstateAgent, Turnstile a robots.txt otvorený AI crawlerom',
      ],
      en: [
        'Hourly sync of flats from Realpad into a custom post type: floors, PDF spec sheets, a sync history and a WP-CLI command with dry run',
        'Each sync purges both the LiteSpeed page cache and the Redis object cache',
        'Form leads sent to the Realpad API with structured GDPR consents and a backup copy in the admin',
        'Price list with AJAX filters, a price slider, filters mirrored in the URL and favourite flats',
        'krpano VR tours: 7 tours and 178 of 361 flats linked to an interior',
        '42 ACF blocks, an English version on WPML, GSAP and Lenis animations',
        'Own cookie consent with Consent Mode v2, RealEstateAgent schema, Turnstile and a robots.txt that welcomes AI crawlers',
      ],
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
    summary: {
      sk: 'Marketplace slow fashion, kde má každý predajca vlastný obchod, dopravu, platby aj zmluvy. Okrem bežného e-shopu rieši správy medzi predajcom a zákazníkom, doručovanie po balíkoch a české aj európske zákonné povinnosti.',
      en: 'A slow fashion marketplace where every vendor has their own shop, shipping, payments and contracts. Beyond a regular store it handles vendor-customer messages, per-package delivery and Czech and EU legal requirements.',
    },
    scope: {
      sk: [
        'WooCommerce s Dokan Pro a HPOS, 13 ACF blokov, Tailwind v4 a Sass',
        'Doprava pre každého predajcu: vlastné údaje Packety, cenové pásma podľa váhy a výpočet za každý balík v pokladni',
        'Správy medzi predajcom a zákazníkom vo vlastných databázových tabuľkách',
        'XML feed pre Zboží.cz, konverzie Zboží, Sklik retargeting a Meta Pixel naviazané na súhlas',
        'Online odstúpenie od zmluvy podľa smernice EÚ 2023/2673, zmluvy a podmienky predajcov v PDF',
        'Playwright testy: 44 spec súborov a 155 testov',
      ],
      en: [
        'WooCommerce with Dokan Pro and HPOS, 13 ACF blocks, Tailwind v4 and Sass',
        'Shipping per vendor: their own Packeta credentials, weight-based price tiers and a rate for each package at checkout',
        'Vendor-customer messaging stored in its own database tables',
        'Zboží.cz XML feed, Zboží conversions, Sklik retargeting and Meta Pixel tied to consent',
        'Online withdrawal form under EU Directive 2023/2673, vendor contracts and terms as PDF',
        'Playwright suite: 44 spec files and 155 tests',
      ],
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
    summary: {
      sk: 'Vlastný e-shop, kde si zákazník nahrá GPX trasu z behu, bicykla alebo túry a hneď vidí, ako bude vyzerať na mape. Ďalšia generácia s 3D reliéfom terénu a exportom pre 3D tlač je vo vývoji.',
      en: 'Own online store where customers upload a GPX route from a run, ride or hike and instantly see it on a map. The next generation, with 3D terrain relief and export for 3D printing, is in development.',
    },
    scope: {
      sk: [
        'Nahratie GPX cez AJAX s overením typu a súkromným úložiskom, súbor putuje ďalej s objednávkou',
        'Parsovanie GPX v prehliadači a vykreslenie trasy na mape MapLibre GL',
        'Personalizácia: nadpis, podnadpis, popis a až 4 vlastné štatistiky, ktoré prechádzajú do košíka, objednávky, administrácie aj e-mailov',
        'WooCommerce so Stripe, Packetou, PDF faktúrami a WPML',
        'Vo vývoji: Next.js 16 a React 19 platforma s Postgres a Drizzle, 3D konfigurátor v three.js s reliéfom terénu a exportom STL v milimetroch, tlačové PDF a e2e testy',
      ],
      en: [
        'GPX upload over AJAX with a type check and private storage, the file travels with the order',
        'GPX parsed in the browser and drawn as a route on a MapLibre GL map',
        'Personalisation: headline, subtitle, description and up to 4 custom stats carried into the cart, order, admin and emails',
        'WooCommerce with Stripe, Packeta, PDF invoices and WPML',
        'In development: a Next.js 16 and React 19 platform with Postgres and Drizzle, a three.js 3D configurator with terrain relief and STL export in millimetres, print PDFs and e2e tests',
      ],
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
    summary: {
      sk: 'WordPress web štúdia architektonických vizualizácií postavený na mieru podľa dodaného dizajnu 1:1. Úvod prehráva 3D animáciu budovy podľa scrollu a celý web žije desiatkami vlastných animácií.',
      en: 'A WordPress site for an architectural visualization studio, custom-built 1:1 from the supplied design. The intro plays a 3D building animation as you scroll, and the whole site runs on dozens of custom animations.',
    },
    scope: {
      sk: [
        'Hero sekvencia 106 snímok riadená scrollom: na desktope canvas s vopred dekódovanými snímkami alebo H.264 video s polovičnými dátami, na mobile jedno prehratie',
        'Vlastné GSAP a ScrollTrigger efekty: slová skladajúce sa v 3D, časová os procesu, sticky kroky s prelínaním fotiek a parallax pätičky, spolu 42 komponentov',
        '4 jazyky cez WPML (angličtina, slovenčina, poľština a chorvátčina) s vlastnou synchronizáciou ACF blokov a alt textov',
        'Portfólio s filtrom kategórií, mozaikou a vlastným lightboxom, obrázky s blur-up načítaním',
        'Schema Service a FAQPage a vlastný llms.txt generovaný zo služieb',
        'Vlastná WordPress téma s Vite buildom, kontaktný a newsletter formulár s Turnstile',
      ],
      en: [
        'A 106-frame hero sequence driven by scroll: on desktop a canvas with pre-decoded frames or an H.264 video at half the data, on phones a single playback',
        'Custom GSAP and ScrollTrigger effects: words assembling in 3D, a process timeline, sticky steps with photo crossfades and a footer parallax, 42 components in all',
        '4 languages on WPML (English, Slovak, Polish and Croatian) with custom sync of ACF blocks and alt texts',
        'Portfolio with a category filter, a mosaic and a custom lightbox, images with blur-up loading',
        'Service and FAQPage schema and its own llms.txt generated from the services',
        'Custom WordPress theme with a Vite build, contact and newsletter forms with Turnstile',
      ],
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
    summary: {
      sk: 'Jednostránkové portfólio fotografa a grafika postavené podľa dodanej grafiky. Stojí na pokročilých animáciách: od intra, v ktorom sa kreslí podpis, až po prechody fotiek podľa smeru scrollovania.',
      en: 'A one-page portfolio for a photographer and designer, built from the supplied design. It runs on advanced animation, from an intro that draws a signature to photo transitions that follow the scroll direction.',
    },
    scope: {
      sk: [
        'Intro: podpis sa sám nakreslí cez modrú plochu a fotka sa zaostrí do čiernobielej',
        'Vlastný GSAP lightbox bez knižnice: klávesnica, swipe, focus trap a zámok scrollu cez Lenis',
        'Portfólio v ručne navrhnutom rozptýlenom rozložení bez opakovania fotiek, filter kategórií a scrollspy',
        'Masonry prechody podľa smeru scrollu, parallax kariet, rozmazanie portrétu pri scrolle a nekonečný pás log',
        'Schema ProfessionalService napojená na Yoast, fotky portfólia v XML sitemape a sanitizácia SVG',
      ],
      en: [
        'Intro: a signature draws itself over a blue wash and the photo settles into sharp black and white',
        'A custom GSAP lightbox without a library: keyboard, swipe, focus trap and scroll lock through Lenis',
        'Portfolio in a hand-designed scattered layout that never repeats a photo, a category filter and a scrollspy',
        'Masonry wipes that follow the scroll direction, stacking card parallax, a portrait that blurs on scroll and an endless logo marquee',
        'ProfessionalService schema linked into Yoast, portfolio photos in the XML sitemap and SVG sanitising',
      ],
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
    summary: {
      sk: 'Web rezidenčného projektu v Brne-Komárove podľa Figmy 1:1. Vychádza z Brixxu, no pridáva vlastné scrollové zážitky a podrobné SEO pre každý byt.',
      en: 'A residential development site in Brno-Komárov, built 1:1 from Figma. It builds on Brixx and adds its own scroll experiences and detailed SEO for every flat.',
    },
    scope: {
      sk: [
        'Celoobrazovkové video riadené scrollom: každý krok prehrá zábery k ďalšej zastávke a scroll späť ich prehrá dozadu',
        'Horizontálna galéria výhod, ktorá pri scrolle podrží sekciu na mieste a pozastaví Lenis',
        'Synchronizácia cenníka a leadov s Realpadom, po synchronizácii sa premažú len stránky s bytmi',
        'Schema Apartment a Offer pre každý byt prepojená s ApartmentComplex, počty z živého cenníka',
        'Stav filtrov cenníka renderovaný na serveri z URL, s whitelistom a kanonickou URL',
        '40 ACF blokov, výber podlažia, VR prehliadka a WebP s náhradou za JPEG',
      ],
      en: [
        'Full-screen video driven by scroll: each step plays the footage to the next stop and scrolling back plays it in reverse',
        'Horizontal benefits gallery that pins the section and pauses Lenis while you pan',
        'Price list and lead sync with Realpad, only the pages that show flats are purged after a sync',
        'Apartment and Offer schema for every flat linked to an ApartmentComplex, with counts from the live price list',
        'Price list filter state rendered on the server from the URL, whitelisted and canonicalised',
        '40 ACF blocks, a floor selector, a VR tour and WebP with a JPEG fallback',
      ],
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
    summary: {
      sk: 'Web nechtového štúdia s vlastným predajom darčekových poukážok bez WooCommerce. Zákazník zaplatí cez Stripe a poukážka s unikátnym kódom mu príde e-mailom ako PDF.',
      en: 'A nail studio site with its own gift voucher sales, no WooCommerce. The customer pays through Stripe and receives a voucher with a unique code as a PDF by email.',
    },
    scope: {
      sk: [
        'Darčekové poukážky cez Stripe Checkout so serverovým overením platby a podpísaným webhookom',
        'Unikátne kódy a PDF poukážky v súkromnom úložisku, e-mail zákazníkovi aj notifikácia pre štúdio',
        'Správa objednávok v administrácii: stavy, nové vygenerovanie PDF, opätovné odoslanie e-mailu a čistenie nezaplatených objednávok',
        'Mini konfigurátor nechtov: kolekcie a farby z ACF, vybraná farba sa hneď ukáže na fotke ruky',
        'Kariéra so schemou JobPosting, schema BeautySalon a 13 ACF blokov',
      ],
      en: [
        'Gift vouchers through Stripe Checkout with server-side payment verification and a signed webhook',
        'Unique codes and PDF vouchers in private storage, an email to the customer and a notice to the studio',
        'Order management in the admin: statuses, PDF regeneration, resending the email and clearing unpaid orders',
        'Mini nail configurator: collections and colours from ACF, the chosen colour shows on a hand photo instantly',
        'Careers with JobPosting schema, BeautySalon schema and 13 ACF blocks',
      ],
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
    summary: {
      sk: 'Web novej štvrte južne od centra Brna podľa Figmy 1:1. Dôraz na rýchlosť, animácie a newsletter, ktorý každého odberateľa posiela do Realpadu ako lead.',
      en: 'A site for a new district just south of central Brno, built 1:1 from Figma. The focus is speed, animation and a newsletter that sends every subscriber to Realpad as a lead.',
    },
    scope: {
      sk: [
        'Newsletter s archívom odberateľov, automatickou odpoveďou a podpísaným odhlásením, každý odberateľ ide do Realpadu ako lead',
        'Heslo k Realpadu upraviteľné v nastaveniach témy a uložené šifrovane (AES-256-GCM)',
        'Ručne písané critical CSS, lazy loading, odložené skripty a vlastný llms.txt',
        'Animácie: CSS vlna znakov v úvode, nadpis, ktorý sa rozsvieti pri scrolle, animovaný graf barometra a GSAP before/after slider',
        '12 natívnych blokov, kontaktný formulár funkčný aj bez JavaScriptu s Turnstile a rate limitom',
        'PHPStan level 5, lint-staged a gitleaks pri každom commite',
      ],
      en: [
        'Newsletter with a subscriber archive, an autoreply and a signed unsubscribe link, every subscriber pushed to Realpad as a lead',
        'The Realpad password is editable in the theme settings and stored encrypted (AES-256-GCM)',
        'Hand-written critical CSS, lazy loading, deferred scripts and its own llms.txt',
        'Animation: a CSS character wave in the intro, a headline that lights up on scroll, an animated barometer chart and a GSAP before/after slider',
        '12 native blocks and a contact form that works without JavaScript, with Turnstile and a rate limit',
        'PHPStan level 5, lint-staged and gitleaks on every commit',
      ],
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
    summary: {
      sk: 'Web firmy na prenájom modulárnej LED steny a prezentačného pultu. Postavený podľa dizajnu 1:1 a zhodu s Figmou overuje automatický nástroj, ktorý meria každú sekciu.',
      en: 'A site for a company renting a modular LED wall and a presentation desk. Built 1:1 from the design, with an automated tool that measures every section against Figma.',
    },
    scope: {
      sk: [
        'Automatické overenie zhody s Figmou: nástroj meria stránky po sekciách a hlási odchýlky v pixeloch',
        '21 ACF blokov: cenníky prenájmu, technické parametre, záložky zostáv, FAQ a ďalšie',
        'Formulár na cenovú ponuku a newsletter funkčné aj bez JavaScriptu: nonce, honeypot, rate limit, Turnstile a log e-mailov',
        'Critical CSS, lazy loading s výnimkou pre hero, odložené skripty a preload fontov',
        'CI s lintom, kontrolou design tokenov, buildom, gitleaks a CodeRabbit review',
        'GSAP animácie a plynulý scroll cez Lenis',
      ],
      en: [
        'Automated check against Figma: a tool measures pages section by section and reports deltas in pixels',
        '21 ACF blocks: rental pricing, specs, setup tabs, FAQ and more',
        'Quote request and newsletter forms that work without JavaScript: nonce, honeypot, rate limit, Turnstile and an email log',
        'Critical CSS, lazy loading with a hero exemption, deferred scripts and font preloads',
        'CI with linting, a design token check, the build, gitleaks and CodeRabbit review',
        'GSAP animations and Lenis smooth scroll',
      ],
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
    summary: {
      sk: 'Kampaňový web Juraja Mikúša, kandidáta na primátora Skalice. Návrh dizajnu a grafiky, potom vlastná téma, ktorá spĺňa nové európske pravidlá pre politickú reklamu.',
      en: 'The campaign site of Juraj Mikúš, a mayoral candidate in Skalica. Design and graphics first, then a custom theme that meets the new EU rules on political advertising.',
    },
    scope: {
      sk: [
        'Transparenčné oznámenia billboardov podľa nariadenia EÚ 2024/900: vlastný post typ, zoznam aj detail pre každú plochu',
        'Údaje kampane zadané raz v nastaveniach, celková suma kampane sa dopočíta sama',
        'Stránky programu, aktualít, transparentného účtu s dokumentmi a kontaktu, každá ako pevná šablóna s ACF',
        'Dekoratívne ilustrácie pamiatok Skalice obkreslené z kampaňových záberov',
        'Formuláre so súhlasom GDPR, Turnstile a archívom v administrácii, po odoslaní focus na stavovú správu kvôli prístupnosti',
        'Schema Person, preload hero obrázka a vlastné fonty',
      ],
      en: [
        'Billboard transparency notices under EU Regulation 2024/900: a custom post type, a list and a detail page for each surface',
        'Campaign data entered once in the settings, the campaign total adds itself up',
        'Programme, news, transparent account with documents and contact pages, each a fixed template with ACF',
        'Decorative illustrations of Skalica landmarks traced from campaign footage',
        'Forms with GDPR consent, Turnstile and an admin archive, focus moves to the status message after sending for accessibility',
        'Person schema, a hero image preload and self-hosted fonts',
      ],
    },
    credit: { sk: 'V spolupráci s be-you.sk.', en: 'In collaboration with be-you.sk.' },
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
    summary: {
      sk: 'Kampaňový web nezávislého kandidáta podľa jeho požiadaviek, od návrhu po vývoj. Jednostránkový web zo 7 blokov, ktorý ľuďom ukazuje konkrétne riešenia pre ich lokalitu.',
      en: "An independent candidate's campaign site built to his brief, from design to development. A one-page site of 7 blocks that shows residents concrete solutions for their area.",
    },
    scope: {
      sk: [
        'Návrh dizajnu a jednostránkový web zo 7 ACF blokov: úvod, piliere, o mne, riešenia, lokality, stretnutia a kontakt',
        'Karty riešení otvárajú kroky v natívnom dialógu, lokality v záložkách s výzvou poslať podnet',
        'Navigácia so scrollspy a hlavička, ktorá sa pri scrolle nadol skryje a nahor vráti',
        'Schema organizácie, oprava stavových kódov sitemapy a vlastné fonty Inter a Manrope',
        'Kontaktný formulár s Turnstile a logom e-mailov',
      ],
      en: [
        'Design and a one-page site of 7 ACF blocks: intro, pillars, about, solutions, localities, meetings and contact',
        'Solution cards open their steps in a native dialog, localities sit in tabs with a prompt to send a suggestion',
        'Navigation with a scrollspy and a header that hides on scroll down and returns on scroll up',
        'Organization schema, a fix for sitemap status codes and self-hosted Inter and Manrope fonts',
        'Contact form with Turnstile and an email log',
      ],
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
    summary: {
      sk: 'Oficiálny web Slovenského Červeného kríža a jeho spolkov ako jedna WordPress multisite sieť s viac ako 70 samostatnými webmi. Téma na mieru podľa dizajnu 1:1, logika celej siete a optimalizácia výkonu.',
      en: 'The official site of the Slovak Red Cross and its branches as one WordPress multisite network of more than 70 separate sites. A custom theme 1:1 from the design, the logic of the whole network and performance work.',
    },
    scope: {
      sk: [
        'Téma na mieru pre celú multisite sieť podľa dizajnu 1:1 a návrh logiky zdieľaných nastavení, ktoré sa načítajú raz a cachujú',
        'Sieťové nástroje: mapa spolkov na Google Maps, vyhľadanie spolku podľa PSČ a jedno tlačidlo na premazanie WP Rocket a Redis cache na všetkých weboch',
        'Vlastný e-learning s kvízmi z CSV, výsledkami, exportom a e-mailmi podľa skóre',
        '12 vlastných ACF blokov vrátane máp a mapy centier darovania krvi',
        'Darovanie cez Darujme vrátane opakovaných platieb, integrácie SmartEmailing, Relevanssi a WPForms so Salesforce',
        'Zjednodušená administrácia pre správcov jednotlivých webov',
      ],
      en: [
        'A custom theme for the whole multisite network 1:1 from the design, and the logic of shared settings that are read once and cached',
        'Network tools: a Google Maps map of branches, branch lookup by postal code and one button that purges the WP Rocket and Redis caches on every site',
        'Custom e-learning with quizzes from CSV, results, export and score-based emails',
        '12 custom ACF blocks including maps and a map of blood donation centres',
        'Donations through Darujme including recurring payments, SmartEmailing, Relevanssi and WPForms with Salesforce integrations',
        'A simplified admin for the managers of individual sites',
      ],
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
    summary: {
      sk: 'Sieť webov nemeckých zlatníctiev, každé na vlastnej doméne, napríklad Trauring-Zentrum Mainz. Pôvodná multisite inštalácia s viac ako 100 tisíc tabuľkami v databáze prešla na novú optimalizovanú WooCommerce infraštruktúru, kde sa nový obchod pridá jednoduchým importom a produkty so skladom sa synchronizujú s externým systémom.',
      en: 'A network of German jewellery store sites, each on its own domain, such as Trauring-Zentrum Mainz. The original multisite install with over 100,000 database tables moved to a new, optimised WooCommerce infrastructure where a new store is added with a simple import and products and stock sync with an external system.',
    },
    scope: {
      sk: [
        'Migrácia pôvodnej multisite inštalácie s viac ako 100 tisíc tabuľkami na novú WooCommerce infraštruktúru',
        '72 webov na vlastných doménach so zdieľaným obsahom, ktorý si každý obchod môže prepísať',
        'Synchronizácia produktov a skladu s externým systémom cez API: paralelné požiadavky s opakovaním, detekcia zmien cez sha256 a idempotentné zápisy pre približne 167 tisíc produktových záznamov',
        'Nočná synchronizácia spúšťaná chráneným REST endpointom so zámkom proti súbehu',
        'Nové obchody z CSV príkazom wp shop sync: vytvorenie, úprava, obnovenie alebo archivácia, predvolene s dry-run',
        'Všetky veľkosti obrázkov rovno vo WebP pre sieť s viac ako miliónom obrázkov, vlastná schema vrstva a nemčina s angličtinou cez WPML',
      ],
      en: [
        'Migration of the original multisite install with over 100,000 tables to a new WooCommerce infrastructure',
        '72 sites on their own domains with shared content that each store can override',
        'Product and stock sync with an external system over an API: parallel requests with retries, sha256 change detection and idempotent writes for about 167,000 product records',
        'Nightly sync started by a protected REST endpoint with a lock against overlap',
        'New stores from a CSV with a wp shop sync command: create, update, restore or archive, dry run by default',
        'Every image size generated directly as WebP for a network of over a million images, its own schema layer and German with English on WPML',
      ],
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
    summary: {
      sk: 'Zdravotný portál o ochoreniach, prevencii a zdravom životnom štýle. Celý obsah sa presťahoval z pôvodného CMS do WordPressu s vlastnou témou podľa dizajnu 1:1, s dôrazom na SEO a rýchlosť.',
      en: 'A health portal about conditions, prevention and healthy living. All content moved from the original CMS to WordPress with a custom theme 1:1 from the design, with a focus on SEO and speed.',
    },
    scope: {
      sk: [
        'Migrácia celého obsahu z pôvodného CMS do WordPressu',
        '7 413 presmerovaní 301 zo starých adries článkov a tém na nové URL',
        'Pokročilá SEO optimalizácia so schemou MedicalOrganization',
        'Optimalizácia výkonu a lazy loading obrázkov',
        'Vlastná téma podľa dizajnu 1:1',
      ],
      en: [
        'Migration of all content from the original CMS to WordPress',
        '7,413 301 redirects from the old article and topic addresses to the new URLs',
        'Advanced SEO with MedicalOrganization schema',
        'Performance work and lazy-loaded images',
        'A custom theme 1:1 from the design',
      ],
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
    summary: {
      sk: 'Web projektu, ktorý vysádza stromy z príspevkov darcov. Interaktívna mapa ukazuje tisíce výsadieb a darovať sa dá cez vlastný formulár s platobnou bránou Stripe.',
      en: 'A site for a project that plants trees from donations. An interactive map shows thousands of plantings, and donations go through a custom form with the Stripe payment gateway.',
    },
    scope: {
      sk: [
        'Mapa Google Maps s približne 4 000 bodmi z externého feedu výsadieb a vlastných záznamov s GPS',
        'Body presunuté z 1,8 MB inline HTML do cachovaného markers.json, ktorý sa obnovuje každú hodinu',
        'Vlastný darovací formulár so Stripe PaymentIntents: validácia pred platbou, idempotency kľúč a rate limit',
        'Denné párovanie platieb namiesto webhooku: nájde zaplatené platby bez objednávky a označí refundácie a spory',
        'Dary ako WooCommerce objednávky (HPOS), PDF certifikát pre darcu a export darcov do XLSX bez ďalších knižníc',
      ],
      en: [
        'A Google Maps map with about 4,000 markers from an external planting feed and own GPS records',
        'Markers moved from 1.8 MB of inline HTML to a cached markers.json rebuilt every hour',
        'A custom donation form with Stripe PaymentIntents: validation before payment, an idempotency key and a rate limit',
        'Daily payment reconciliation instead of a webhook: it finds paid intents without an order and flags refunds and disputes',
        'Donations as WooCommerce orders (HPOS), a PDF certificate for donors and a donor export to XLSX without extra libraries',
      ],
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
    summary: {
      sk: 'Vzdelávací portál s článkami, poradňou a mapou predajných miest, postavený podľa dizajnu 1:1 s požiadavkou na prístupnosť WCAG 2.1 AA.',
      en: 'An education portal with articles, a Q&A section and a map of sales points, built 1:1 from the design to meet WCAG 2.1 AA accessibility.',
    },
    scope: {
      sk: [
        'Slovenské vyhľadávanie: koncovky slov sa pred hľadaním v Relevanssi orežú, takže nájde aj vyskloňované tvary',
        'AJAX filter článkov podľa formátu, roly a hľadaného výrazu cez vlastný REST endpoint',
        'Mapa predajných miest na Google Maps a export do CSV len pre administrátorov, kontakty zostávajú mimo verejnej mapy',
        'Poradňa s vlastným post typom a približne 40 ACF blokov',
        'Mailchimp newsletter s honeypotom a prístupnosť podľa WCAG 2.1 AA',
      ],
      en: [
        'Slovak search: word endings are trimmed before the Relevanssi query, so inflected forms still match',
        'AJAX article filter by format, role and search term through a custom REST endpoint',
        'A Google Maps map of sales points and a CSV export for admins only, keeping contacts off the public map',
        'A Q&A section with its own post type and about 40 ACF blocks',
        'Mailchimp newsletter with a honeypot and WCAG 2.1 AA accessibility',
      ],
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
    summary: {
      sk: 'Web Elektrárne Piešťany na vlastnej WordPress téme postavenej podľa dizajnu 1:1.',
      en: 'The Elektrárňa Piešťany website on a custom WordPress theme built 1:1 from the design.',
    },
    scope: {
      sk: ['Vlastná WordPress téma podľa dizajnu 1:1', 'Formuláre, tabuľky a Instagram feed', 'Meranie cez GTM'],
      en: ['A custom WordPress theme 1:1 from the design', 'Forms, tables and an Instagram feed', 'Tracking through GTM'],
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
    summary: {
      sk: 'Web firmy na chiptuning vozidiel postavený na existujúcej téme. Prácou na ňom bol pokročilý filtračný systém, ktorý návštevníka cez tri nadväzujúce úrovne dovedie k jeho vozidlu.',
      en: 'A site for a vehicle chiptuning company built on an existing theme. The work on it was an advanced filtering system that takes visitors to their vehicle through three linked levels.',
    },
    scope: {
      sk: [
        'Pokročilý AJAX filter vozidiel s tromi nadväzujúcimi úrovňami',
        'Doprogramovaný do existujúcej Elementor témy bez zásahu do zvyšku webu',
      ],
      en: [
        'An advanced AJAX vehicle filter with three linked levels',
        'Built into an existing Elementor theme without touching the rest of the site',
      ],
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
    summary: {
      sk: 'Firemný web Vibration, ktorý beží na vlastnej platforme Sellio 2 s frontendom vo Vue 3 a Nuxt. Úpravy a programovanie frontendu podľa dizajnu.',
      en: "Vibration's company site, running on the in-house Sellio 2 platform with a Vue 3 and Nuxt frontend. Frontend changes and development from the design.",
    },
    scope: {
      sk: ['Frontend vo Vue 3 a Nuxt na vlastnom CMS Sellio 2', 'Úpravy a nové časti webu podľa dizajnu'],
      en: ['A Vue 3 and Nuxt frontend on the in-house Sellio 2 CMS', 'Changes and new sections of the site from the design'],
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
    summary: {
      sk: 'E-shop a kamenná predajňa zlatníctva na platforme Sellio 2. Frontend vo Vue 3 a Nuxt podľa Figmy 1:1, v slovenčine aj češtine.',
      en: 'The online store of a jeweller with a physical shop, on the Sellio 2 platform. A Vue 3 and Nuxt frontend 1:1 from Figma, in Slovak and Czech.',
    },
    scope: {
      sk: [
        'Frontend vo Vue 3 a Nuxt 4 podľa Figmy 1:1: 97 komponentov a 24 stránok',
        'Produktové karty, ktoré pri prejdení myšou prehrajú video a na mobile ho ukážu po potiahnutí',
        'Text gravírovania, ktorý prejde cez košík až do pokladne',
        'Naposledy prezerané šperky, wishlist, Trustindex recenzie a Instagram galéria',
        'Výdajné miesta Packety a postupné načítanie produktov s počítadlom',
        'Slovenská a česká verzia, každá na vlastnej doméne',
      ],
      en: [
        'A Vue 3 and Nuxt 4 frontend 1:1 from Figma: 97 components and 24 pages',
        'Product cards that play video on hover and reveal it with a swipe on mobile',
        'Engraving text carried through the cart into checkout',
        'Recently viewed jewellery, a wishlist, Trustindex reviews and an Instagram gallery',
        'Packeta pickup points and load more with a counter',
        'Slovak and Czech versions, each on its own domain',
      ],
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
    summary: {
      sk: 'E-shop s parfumami na pranie na platforme Sellio 2 v siedmich jazykoch, každý na vlastnej doméne. Frontend vo Vue 3 a Nuxt podľa Figmy 1:1, ktorý slúži ako výkonová referencia pre ostatné e-shopy platformy.',
      en: 'A laundry perfume store on the Sellio 2 platform in seven languages, each on its own domain. A Vue 3 and Nuxt frontend 1:1 from Figma that serves as the performance reference for the other stores on the platform.',
    },
    scope: {
      sk: [
        'Frontend vo Vue 3 a Nuxt 4 podľa Figmy 1:1: 109 komponentov a 26 stránok',
        '7 jazykov, každý na vlastnej doméne',
        'Päť dopravcov v pokladni vrátane GLS widgetu, Packety, SPS a DPD',
        'Skladanie sád produktov, zľava za vernostné body a darčekové karty s vlastnými pravidlami košíka',
        'Výkon: preload bannera, atribúty loading a decoding, routeRules pre pokladňu a podmnožiny fontov',
        'Fixná hlavička bez skoku layoutu, recenzie a integrácia Heureky',
      ],
      en: [
        'A Vue 3 and Nuxt 4 frontend 1:1 from Figma: 109 components and 26 pages',
        '7 languages, each on its own domain',
        'Five carriers at checkout including a GLS widget, Packeta, SPS and DPD',
        'Product set builder, a loyalty points discount and gift cards with their own cart rules',
        'Performance: a banner preload, loading and decoding attributes, checkout routeRules and subsetted fonts',
        'A fixed header without layout shift, reviews and a Heureka integration',
      ],
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
    summary: {
      sk: 'E-shop s tatranským profilom, terasovými doskami a hranolmi zo severského dreva na platforme Sellio 2. Téma založená od nuly, od hlavičky a widgetov CMS až po blog a stránky pre veľkoobchod.',
      en: 'A store for Tatra profile cladding, decking and beams from Nordic timber on the Sellio 2 platform. A theme started from scratch, from the header and CMS widgets to the blog and wholesale pages.',
    },
    scope: {
      sk: [
        'Najväčšia téma platformy: 191 komponentov a 27 stránok vo Vue 3 a Nuxt',
        'Hlavička, menu kategórií, fixný bočný panel, pätička, bannery a približne 10 widgetov CMS',
        'Kontrola doručenia do Poľska: PSČ overené voči CSV z CMS a regióny vyfarbené na SVG mape',
        'Prihlásenie v modálnom okne, blog so stránkami autorov a stránky pre veľkoobchod, predajňu a partnerov',
        'Tooltipy parametrov a úprava úrovní nadpisov kvôli SEO',
      ],
      en: [
        'The largest theme on the platform: 191 components and 27 pages in Vue 3 and Nuxt',
        'Header, category menu, fixed sidebar, footer, banners and about 10 CMS widgets',
        'Polish delivery check: postcodes checked against a CSV from the CMS and regions coloured on an SVG map',
        'A login modal, a blog with author pages and pages for wholesale, the store and partners',
        'Parameter tooltips and heading levels adjusted for SEO',
      ],
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
    summary: {
      sk: 'E-shop s kobercami a bytovými doplnkami na platforme Sellio 1 (PHP Yii). Frontend podľa dizajnu 1:1 v SCSS, JavaScripte a jQuery, s dlhodobým vývojom od roku 2021.',
      en: 'A store for carpets and home accessories on the Sellio 1 platform (PHP Yii). A frontend 1:1 from the design in SCSS, JavaScript and jQuery, developed continuously since 2021.',
    },
    scope: {
      sk: [
        'Frontend v Yii šablónach, SCSS a jQuery: 36 SCSS súborov a 88 šablón, build cez Grunt',
        'Jeden e-shop pre slovenskú a českú doménu s opravenými hreflang odkazmi',
        'Farebné varianty ako okrúhle tlačidlá podľa Figmy namiesto selectu a zmena obrázka podľa variantu',
        'Filtre s počtom produktov, mobilný filter, AJAX pridanie do košíka a GA datalayer',
        'Dlhodobý vývoj: viac ako 600 commitov od roku 2021',
      ],
      en: [
        'A frontend in Yii views, SCSS and jQuery: 36 SCSS partials and 88 views, built with Grunt',
        'One store for a Slovak and a Czech domain with fixed hreflang links',
        'Colour variants as round buttons from Figma instead of a select, and the image switches per variant',
        'Filters with product counts, a mobile filter, AJAX add to cart and a GA data layer',
        'Long-term development: over 600 commits since 2021',
      ],
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
    summary: {
      sk: 'E-shop s izbovými rastlinami, kvetináčmi a machovými stenami na platforme Sellio 1. Šablóna podľa dizajnu 1:1 a príprava na spustenie.',
      en: 'A store for houseplants, pots and moss walls on the Sellio 1 platform. A template 1:1 from the design and the launch preparation.',
    },
    scope: {
      sk: [
        'Šablóna e-shopu podľa dizajnu 1:1 v Yii, SCSS a jQuery, build cez Grunt',
        'Instagram feed a zoom produktových fotiek v jQuery',
        'Doprava s knižnicou Packety',
      ],
      en: [
        'A store template 1:1 from the design in Yii, SCSS and jQuery, built with Grunt',
        'An Instagram feed and product photo zoom in jQuery',
        'Shipping with the Packeta library',
      ],
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
    summary: {
      sk: 'E-shop Madness Advertising na platforme Sellio 1. Frontend podľa dizajnu 1:1 a jeho dlhodobý vývoj od roku 2020.',
      en: 'The Madness Advertising store on the Sellio 1 platform. A frontend 1:1 from the design, developed continuously since 2020.',
    },
    scope: {
      sk: [
        'Frontend v Yii šablónach, SCSS na Bootstrap 4 a jQuery s Masonry',
        'Balíčky produktov a zobrazenie ceny od',
        'Zatvárateľný oznam v hornej lište, newsletter s reCAPTCHA a FAQ',
        'Dlhodobý vývoj: viac ako 150 commitov od roku 2020',
      ],
      en: [
        'A frontend in Yii views, SCSS on Bootstrap 4 and jQuery with Masonry',
        'Product packs and a price from display',
        'A dismissible top bar notice, a newsletter with reCAPTCHA and an FAQ',
        'Long-term development: over 150 commits since 2020',
      ],
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
    summary: {
      sk: 'Web o technológiách pre kliniky a ich výsledkoch v praxi, s vlastným obsahovým modelom, v ktorom sa technológie prepájajú s indikáciami a výsledkami. Postavený na výkon a čisté SEO.',
      en: 'A site about technologies for clinics and their results in practice, with a custom content model that links technologies to indications and results. Built for speed and clean SEO.',
    },
    scope: {
      sk: [
        'Post typy technológií a výsledkov s taxonómiami indikácií a kategórií',
        '36 ACF blokov s block.json (apiVersion 3)',
        'Before/after slider s clip-path ovládateľný myšou aj klávesnicou, filtre a mapa Mapbox načítaná až pri zobrazení',
        'Critical CSS pre každú šablónu, lazy loading, odložené skripty a orezané veľkosti obrázkov',
        'Schema graf: Course, FAQPage, ItemList, LocalBusiness a Product',
        'Formuláre s Turnstile a rate limitom, SMTP heslo šifrované cez sodium a bezpečnostné hlavičky z PHP',
        'MCP abilities cez WordPress Abilities API',
      ],
      en: [
        'Post types for technologies and results with indication and category taxonomies',
        '36 ACF blocks with block.json (apiVersion 3)',
        'A clip-path before/after slider that works with pointer and keyboard, filters and a Mapbox map loaded only when visible',
        'Critical CSS per template, lazy loading, deferred scripts and pruned image sizes',
        'Schema graph: Course, FAQPage, ItemList, LocalBusiness and Product',
        'Forms with Turnstile and a rate limit, an SMTP password encrypted with sodium and security headers sent from PHP',
        'MCP abilities through the WordPress Abilities API',
      ],
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
    summary: {
      sk: 'Web predajcu vozidiel BMW v slovenčine, češtine a angličtine. Ponuka áut sa prekladá automaticky cez OpenAI a české ceny sa každý deň prepočítajú podľa kurzu ECB.',
      en: 'A BMW dealer site in Slovak, Czech and English. The car listings are translated automatically through OpenAI, and Czech prices are recalculated every day from the ECB rate.',
    },
    scope: {
      sk: [
        'Automatický AI preklad vozidiel do angličtiny a češtiny cez OpenAI: fronta, JSON schema pre výstup modelu a šifrovaný API kľúč',
        'Ceny v CZK z denného kurzu ECB s kontrolou rozsahu a záložnou menou EUR',
        'Filter áut cez REST API s rozsahom najazdených kilometrov, triedením a vyhľadávaním bez diakritiky',
        'Vlastný post typ vozidiel so stavom predané a automatické zverejnenie áut, keď dosiahnu potrebný vek',
        'Schema Car, Offer a AutoDealer, GA4 cez GTM vrátane sledovania galérie a Consent Mode v2',
        'Export vozidiel do CSV, Tailwind a Webpack',
      ],
      en: [
        'Automatic AI translation of vehicles into English and Czech through OpenAI: a queue, a JSON schema for the model output and an encrypted API key',
        'CZK prices from the daily ECB rate with a range check and EUR as the fallback',
        'Car filter over a REST API with a mileage range, sorting and accent-insensitive search',
        'A custom vehicle post type with a sold status, and cars published automatically once they reach the required age',
        'Car, Offer and AutoDealer schema, GA4 through GTM including gallery tracking and Consent Mode v2',
        'Vehicle export to CSV, Tailwind and Webpack',
      ],
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
    summary: {
      sk: 'E-shop na WooCommerce s vlastnou témou podľa dodanej grafiky, s rozšíreným vyhľadávaním produktov a flexibilnými cenami dopravy.',
      en: "A WooCommerce store with a custom theme built from the client's design, with extended product search and flexible shipping rates.",
    },
    scope: {
      sk: [
        'Vlastná WooCommerce téma podľa dodanej grafiky',
        'Rozšírené vyhľadávanie produktov a flexibilné ceny dopravy',
        'Tlačidlo na odstúpenie od zmluvy podľa pravidiel EÚ',
        'WebP obrázky, GTM a Google Analytics pre WooCommerce',
      ],
      en: [
        "Custom WooCommerce theme from the client's design",
        'Extended product search and flexible shipping rates',
        'EU withdrawal button',
        'WebP images, GTM and Google Analytics for WooCommerce',
      ],
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
    summary: {
      sk: 'Web advokátskej kancelárie, najprv ako statický HTML návrh a potom prenesený do WordPressu tak, aby vyzeral na pixel rovnako. Formuláre bežia cez vlastné REST endpointy.',
      en: 'A law firm site, first a static HTML design, then moved to WordPress so it looks the same to the pixel. The forms run on custom REST endpoints.',
    },
    scope: {
      sk: [
        'Prenos zo statického HTML do WordPressu so zhodou 1:1 a záverečným auditom zhody',
        'Kontaktný formulár a newsletter cez vlastné REST endpointy s honeypotom a limitom 5 odoslaní za hodinu',
        'Odoslania uložené vo vlastných post typoch a e-maily vo firemnom dizajne',
        'Žiara, ktorá nasleduje kurzor, a kotvy so zohľadnením sticky hlavičky',
        'Deploy jedným SSH spojením: rsync, premazanie cache a kontrola živej stránky',
        'Schema Organization, WebSite a BreadcrumbList, Vite build',
      ],
      en: [
        'Port from static HTML to WordPress with a 1:1 match and a final parity audit',
        'Contact form and newsletter on custom REST endpoints with a honeypot and a limit of 5 submissions an hour',
        'Submissions stored in custom post types and branded emails',
        'A glow that follows the cursor and anchor links that account for the sticky header',
        'Deploy in a single SSH session: rsync, a cache purge and a live page check',
        'Organization, WebSite and BreadcrumbList schema, Vite build',
      ],
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
    summary: {
      sk: 'Prezentačný web interiérového štúdia s referenciami, cenníkom a procesom spolupráce. Úvodný slider je napísaný tak, aby sa najväčší obrázok načítal hneď a nič neblikalo.',
      en: 'A showcase site for an interior design studio with references, pricing and the working process. The intro slider is written so the largest image loads first and nothing flickers.',
    },
    scope: {
      sk: [
        'Post typ referencií s kategóriami a archívom',
        '9 ACF blokov a stránka nastavení: úvod, filozofia, štýly, proces, cenník a ďalšie',
        'Úvodný slider optimalizovaný na LCP, pozastavený v skrytej karte prehliadača a s ohľadom na reduced motion',
        'GSAP a Lenis: plynulý scroll, odhaľovanie sekcií a počítadlá čísel',
        'Galéria so swipom a lightbox načítaný až pri prvom kliknutí',
        'Responzívne obrázky so srcset a preloadom úvodného obrázka, kontaktný popup s AJAX odoslaním',
      ],
      en: [
        'A references post type with categories and an archive',
        '9 ACF blocks and a settings page: intro, philosophy, styles, process, pricing and more',
        'Intro slider tuned for LCP, paused in hidden tabs and respecting reduced motion',
        'GSAP and Lenis: smooth scroll, section reveals and number counters',
        'Swipeable gallery and a lightbox that loads on the first click',
        'Responsive srcset images with a hero preload, a contact popup that submits over AJAX',
      ],
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
    summary: {
      sk: 'Web umeleckej školy, kde návštevník nájde kurzy, workshopy aj lektorov a rovno sa prihlási. Najprv statický prototyp v Tailwinde, potom vlastná WordPress téma.',
      en: 'An art school site where visitors find courses, workshops and tutors and sign up straight away. A static Tailwind prototype first, then a custom WordPress theme.',
    },
    scope: {
      sk: [
        'Post typy kurzov s kategóriami a odkazom na rezerváciu a členov tímu',
        '16 ACF blokov a 20 skupín polí: úvodný slider, workshopy, kurzy, Instagram, video a tím',
        'Promo systém s veľkým popupom a malým plávajúcim oknom, nastaviteľný v administrácii',
        'Slider s dotykovým ovládaním, parallax, karusel a Vimeo video',
        'WP-CLI skript na import kurzov a tímu',
      ],
      en: [
        'Post types for courses with categories and a booking link, and for team members',
        '16 ACF blocks and 20 field groups: intro slider, workshops, courses, Instagram, video and team',
        'Promo system with a large popup and a small floating window, set in the admin',
        'Touch slider, parallax, a carousel and a Vimeo video',
        'WP-CLI script that imports courses and the team',
      ],
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
    summary: {
      sk: 'Kampaňový web kandidátky na starostku obce Jánovce. K webu aj tlačové a sociálne materiály kampane, generované z HTML, aby s webom sedeli do detailu.',
      en: 'The campaign site of a mayoral candidate in Jánovce. Alongside the site, the print and social media materials, generated from HTML so they match the site in every detail.',
    },
    scope: {
      sk: [
        'Anonymný formulár na podnety s 9 vrstvami ochrany, bez ukladania IP adries, bez cookies a bez CAPTCHA',
        'GSAP ScrollTrigger a Lenis animácie s ohľadom na reduced motion',
        'Tlačové PDF s 3 mm spadávkou a orezovými značkami a video overlaye vyrenderované z HTML cez Playwright',
        '10 ACF blokov: podnety, financovanie, plán, kroky, FAQ a ďalšie',
        'Critical CSS, bezpečnostné hlavičky a log e-mailov',
      ],
      en: [
        'Anonymous suggestion form with 9 layers of protection, no stored IP addresses, no cookies and no CAPTCHA',
        'GSAP ScrollTrigger and Lenis animation that respects reduced motion',
        'Print PDFs with 3 mm bleed and crop marks and video overlays rendered from HTML with Playwright',
        '10 ACF blocks: suggestions, funding, plan, steps, FAQ and more',
        'Critical CSS, security headers and an email log',
      ],
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
    summary: {
      sk: 'Web freelance značky Denva v štyroch jazykoch. Blog píše a publikuje automatizovaná pipeline, ktorá sa učí z dát Search Console.',
      en: 'The site of the Denva freelance brand in four languages. The blog is written and published by an automated pipeline that learns from Search Console data.',
    },
    scope: {
      sk: [
        '4 jazyky cez WPML (slovenčina, čeština, maďarčina a angličtina) s hreflang a x-default doladeným aj v sitemapách',
        'Automatizovaná blogová pipeline na stále zapnutom Macu: hľadanie tém, tvorba obsahu, watchdog a spätná väzba zo Search Console',
        'Post typy služieb a prípadových štúdií a landing stránky pre lokality',
        'REST formuláre so súkromnými prílohami a štatistiky leadov bez osobných údajov',
        'llms.txt a pravidlá pre AI crawlery, schema Service a FAQPage',
        'GSAP, Lenis a deploy témy s atomickou výmenou',
      ],
      en: [
        '4 languages on WPML (Slovak, Czech, Hungarian and English) with hreflang and x-default tuned in the sitemaps too',
        'Automated blog pipeline on an always-on Mac: topic scouting, content, a watchdog and a Search Console feedback loop',
        'Service and case study post types and landing pages per location',
        'REST forms with private attachments and lead statistics without personal data',
        'llms.txt and an AI crawler policy, Service and FAQPage schema',
        'GSAP, Lenis and an atomic-swap theme deploy',
      ],
    },
  },
];
