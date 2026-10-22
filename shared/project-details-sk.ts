import type { ProjectDetailsBySlug } from './projects';

// Slovak drawer texts per project slug. The site loads this module on demand for the drawer, so
// keep it out of every static import chain of the client entry.
// Every scope item is backed by the project's source code; keep it that way when editing.
export const PROJECT_DETAILS_SK: ProjectDetailsBySlug = {
  'second-brain': {
    summary: 'Osobný systém, ktorý zbiera poznámky, e-maily, články, hlasové správy aj fotky, triedi ich cez Claude a robí z nich prehľadávateľnú znalostnú bázu. Beží na dvoch miestach: riadiaca vrstva na Hetzner VPS, prepis reči, OCR a agenti na stále zapnutom Macu, prepojené cez Tailscale.',
    scope: [
      'RAG nad PostgreSQL 17 a pgvector: embeddingy bge-m3 v HNSW indexe, hybridné vyhľadávanie (vektory, fulltext a trigramy) spojené cez reciprocal rank fusion a reranker bge-reranker-v2-m3',
      'Odpovede s citovanými zdrojmi a vlastný MCP server s nástrojmi na vyhľadávanie, otázky, zachytávanie poznámok a úlohy',
      'Telegram bot na zachytávanie obsahu, rozhovor s asistentom a schvaľovanie krokov agentov',
      'Coding agent nad Claude Agent SDK v oddelených git worktrees, v sandboxe bez prístupových údajov, s plánom na schválenie v Telegrame a pull requestom cez GitHub App',
      'Na Apple Silicon: prepis reči cez mlx-whisper (aj v slovenčine) a OCR cez Apple Vision',
      'Plánované joby vo fronte pg-boss: denné súhrny, kompilácia stránok znalostnej bázy, údržba a samoopravné úlohy',
      'Docker Compose, Caddy a Cloudflare Access, deploy so zálohou databázy, health checkom a automatickým rollbackom, nočné zálohy s týždenným testom obnovy',
    ],
  },
  narodnyfutbalovystadion: {
    summary: 'Web Národného futbalového štadióna v slovenčine a angličtine. Podujatia sa doň každý deň načítajú z XML feedu Ticketportalu, takže program je aktuálny bez ručnej práce.',
    scope: [
      'Denný import XML feedu Ticketportalu cez WP-Cron aj tlačidlom v administrácii: vytvára a aktualizuje podujatia, kategórie a obrázky a odstraňuje tie, ktoré už prebehli',
      'SEO pre importované podujatia: jedna kanonická URL pre duplicitné názvy, podujatia bez vlastného textu mimo sitemapy a vyhľadávania',
      'Slovenská a anglická verzia cez WPML s vlastným helperom na dvojjazyčné texty v šablónach',
      '14 ACF blokov vrátane máp štadióna a areálu, podujatí a fanshopu',
      'Turnstile s overením hostname aj akcie, cookie lišta s Consent Mode v2 a hardening WordPressu',
    ],
  },
  brixx: {
    summary: 'Web rezidenčného projektu v Brne postavený od základu podľa Figmy 1:1. Cenník bytov sa každú hodinu sám synchronizuje z CRM Realpad a dopyty z formulárov idú rovno do Realpadu ako leady.',
    scope: [
      'Hodinová synchronizácia bytov z Realpadu do vlastného post typu: podlažia, PDF karty bytov, história synchronizácií a WP-CLI príkaz s dry-run',
      'Po každej synchronizácii sa premaže LiteSpeed cache aj Redis object cache',
      'Leady z formulárov do Realpad API so štruktúrovanými GDPR súhlasmi a zálohou v administrácii',
      'Cenník s AJAX filtrami, cenovým sliderom, filtrami v URL a obľúbenými bytmi',
      'VR prehliadky v krpano: 7 prehliadok a 178 z 361 bytov prepojených s interiérom',
      '42 ACF blokov, anglická verzia cez WPML, GSAP a Lenis animácie',
      'Vlastná cookie lišta s Consent Mode v2, schema RealEstateAgent, Turnstile a robots.txt otvorený AI crawlerom',
    ],
  },
  pangeas: {
    summary: 'Marketplace slow fashion, kde má každý predajca vlastný obchod, dopravu, platby aj zmluvy. Okrem bežného e-shopu rieši správy medzi predajcom a zákazníkom, doručovanie po balíkoch a české aj európske zákonné povinnosti.',
    scope: [
      'WooCommerce s Dokan Pro a HPOS, 13 ACF blokov, Tailwind v4 a Sass',
      'Doprava pre každého predajcu: vlastné údaje Packety, cenové pásma podľa váhy a výpočet za každý balík v pokladni',
      'Správy medzi predajcom a zákazníkom vo vlastných databázových tabuľkách',
      'XML feed pre Zboží.cz, konverzie Zboží, Sklik retargeting a Meta Pixel naviazané na súhlas',
      'Online odstúpenie od zmluvy podľa smernice EÚ 2023/2673, zmluvy a podmienky predajcov v PDF',
      'Playwright testy: 44 spec súborov a 155 testov',
    ],
  },
  routie: {
    summary: 'Vlastný e-shop, kde si zákazník nahrá GPX trasu z behu, bicykla alebo túry a hneď vidí, ako bude vyzerať na mape. Ďalšia generácia s 3D reliéfom terénu a exportom pre 3D tlač je vo vývoji.',
    scope: [
      'Nahratie GPX cez AJAX s overením typu a súkromným úložiskom, súbor putuje ďalej s objednávkou',
      'Parsovanie GPX v prehliadači a vykreslenie trasy na mape MapLibre GL',
      'Personalizácia: nadpis, podnadpis, popis a až 4 vlastné štatistiky, ktoré prechádzajú do košíka, objednávky, administrácie aj e-mailov',
      'WooCommerce so Stripe, Packetou, PDF faktúrami a WPML',
      'Vo vývoji: Next.js 16 a React 19 platforma s Postgres a Drizzle, 3D konfigurátor v three.js s reliéfom terénu a exportom STL v milimetroch, tlačové PDF a e2e testy',
    ],
  },
  monkeystudios: {
    summary: 'WordPress web štúdia architektonických vizualizácií postavený na mieru podľa dodaného dizajnu 1:1. Úvod prehráva 3D animáciu budovy podľa scrollu a celý web žije desiatkami vlastných animácií.',
    scope: [
      'Hero sekvencia 106 snímok riadená scrollom: na desktope canvas s vopred dekódovanými snímkami alebo H.264 video s polovičnými dátami, na mobile jedno prehratie',
      'Vlastné GSAP a ScrollTrigger efekty: slová skladajúce sa v 3D, časová os procesu, sticky kroky s prelínaním fotiek a parallax pätičky, spolu 42 komponentov',
      '4 jazyky cez WPML (angličtina, slovenčina, poľština a chorvátčina) s vlastnou synchronizáciou ACF blokov a alt textov',
      'Portfólio s filtrom kategórií, mozaikou a vlastným lightboxom, obrázky s blur-up načítaním',
      'Schema Service a FAQPage a vlastný llms.txt generovaný zo služieb',
      'Vlastná WordPress téma s Vite buildom, kontaktný a newsletter formulár s Turnstile',
    ],
  },
  rkovacovsky: {
    summary: 'Jednostránkové portfólio fotografa a grafika postavené podľa dodanej grafiky. Stojí na pokročilých animáciách: od intra, v ktorom sa kreslí podpis, až po prechody fotiek podľa smeru scrollovania.',
    scope: [
      'Intro: podpis sa sám nakreslí cez modrú plochu a fotka sa zaostrí do čiernobielej',
      'Vlastný GSAP lightbox bez knižnice: klávesnica, swipe, focus trap a zámok scrollu cez Lenis',
      'Portfólio v ručne navrhnutom rozptýlenom rozložení bez opakovania fotiek, filter kategórií a scrollspy',
      'Masonry prechody podľa smeru scrollu, parallax kariet, rozmazanie portrétu pri scrolle a nekonečný pás log',
      'Schema ProfessionalService napojená na Yoast, fotky portfólia v XML sitemape a sanitizácia SVG',
    ],
  },
  zanzara: {
    summary: 'Web rezidenčného projektu v Brne-Komárove podľa Figmy 1:1. Vychádza z Brixxu, no pridáva vlastné scrollové zážitky a podrobné SEO pre každý byt.',
    scope: [
      'Celoobrazovkové video riadené scrollom: každý krok prehrá zábery k ďalšej zastávke a scroll späť ich prehrá dozadu',
      'Horizontálna galéria výhod, ktorá pri scrolle podrží sekciu na mieste a pozastaví Lenis',
      'Synchronizácia cenníka a leadov s Realpadom, po synchronizácii sa premažú len stránky s bytmi',
      'Schema Apartment a Offer pre každý byt prepojená s ApartmentComplex, počty z živého cenníka',
      'Stav filtrov cenníka renderovaný na serveri z URL, s whitelistom a kanonickou URL',
      '40 ACF blokov, výber podlažia, VR prehliadka a WebP s náhradou za JPEG',
    ],
  },
  cherries: {
    summary: 'Web nechtového štúdia s vlastným predajom darčekových poukážok bez WooCommerce. Zákazník zaplatí cez Stripe a poukážka s unikátnym kódom mu príde e-mailom ako PDF.',
    scope: [
      'Darčekové poukážky cez Stripe Checkout so serverovým overením platby a podpísaným webhookom',
      'Unikátne kódy a PDF poukážky v súkromnom úložisku, e-mail zákazníkovi aj notifikácia pre štúdio',
      'Správa objednávok v administrácii: stavy, nové vygenerovanie PDF, opätovné odoslanie e-mailu a čistenie nezaplatených objednávok',
      'Mini konfigurátor nechtov: kolekcie a farby z ACF, vybraná farba sa hneď ukáže na fotke ruky',
      'Kariéra so schemou JobPosting, schema BeautySalon a 13 ACF blokov',
    ],
  },
  novatrnita: {
    summary: 'Web novej štvrte južne od centra Brna podľa Figmy 1:1. Dôraz na rýchlosť, animácie a newsletter, ktorý každého odberateľa posiela do Realpadu ako lead.',
    scope: [
      'Newsletter s archívom odberateľov, automatickou odpoveďou a podpísaným odhlásením, každý odberateľ ide do Realpadu ako lead',
      'Heslo k Realpadu upraviteľné v nastaveniach témy a uložené šifrovane (AES-256-GCM)',
      'Ručne písané critical CSS, lazy loading, odložené skripty a vlastný llms.txt',
      'Animácie: CSS vlna znakov v úvode, nadpis, ktorý sa rozsvieti pri scrolle, animovaný graf barometra a GSAP before/after slider',
      '12 natívnych blokov, kontaktný formulár funkčný aj bez JavaScriptu s Turnstile a rate limitom',
      'PHPStan level 5, lint-staged a gitleaks pri každom commite',
    ],
  },
  ledpixel: {
    summary: 'Web firmy na prenájom modulárnej LED steny a prezentačného pultu. Postavený podľa dizajnu 1:1 a zhodu s Figmou overuje automatický nástroj, ktorý meria každú sekciu.',
    scope: [
      'Automatické overenie zhody s Figmou: nástroj meria stránky po sekciách a hlási odchýlky v pixeloch',
      '21 ACF blokov: cenníky prenájmu, technické parametre, záložky zostáv, FAQ a ďalšie',
      'Formulár na cenovú ponuku a newsletter funkčné aj bez JavaScriptu: nonce, honeypot, rate limit, Turnstile a log e-mailov',
      'Critical CSS, lazy loading s výnimkou pre hero, odložené skripty a preload fontov',
      'CI s lintom, kontrolou design tokenov, buildom, gitleaks a CodeRabbit review',
      'GSAP animácie a plynulý scroll cez Lenis',
    ],
  },
  jurajmikus: {
    summary: 'Kampaňový web Juraja Mikúša, kandidáta na primátora Skalice. Návrh dizajnu a grafiky, potom vlastná téma, ktorá spĺňa nové európske pravidlá pre politickú reklamu.',
    scope: [
      'Transparenčné oznámenia billboardov podľa nariadenia EÚ 2024/900: vlastný post typ, zoznam aj detail pre každú plochu',
      'Údaje kampane zadané raz v nastaveniach, celková suma kampane sa dopočíta sama',
      'Stránky programu, aktualít, transparentného účtu s dokumentmi a kontaktu, každá ako pevná šablóna s ACF',
      'Dekoratívne ilustrácie pamiatok Skalice obkreslené z kampaňových záberov',
      'Formuláre so súhlasom GDPR, Turnstile a archívom v administrácii, po odoslaní focus na stavovú správu kvôli prístupnosti',
      'Schema Person, preload hero obrázka a vlastné fonty',
    ],
  },
  limoprestige: {
    summary: 'Web prémiovej prepravy osôb s osobným šoférom, ktorý predstavuje služby, vozový park a obľúbené destinácie. Vlastná WordPress téma podľa dodanej grafiky.',
    scope: [
      'WordPress téma na mieru podľa dodanej grafiky',
    ],
  },
  maranibratislava: {
    summary: 'Web gruzínskej reštaurácie v Bratislave s jedálnym, nápojovým a vínnym lístkom a rezerváciou stola. Vlastná WordPress téma podľa dodanej grafiky.',
    scope: [
      'WordPress téma na mieru podľa dodanej grafiky',
    ],
  },
  slovandisponea: {
    summary: 'Objednávková aplikácia, cez ktorú si rodičia a tréneri mládeže ŠK Slovan Bratislava objednávajú od BeYou fotografie a hráčske kartičky. Objednávky, platby kartou, faktúry aj ich správa bežia na vlastnom kóde vo WordPresse, bez WooCommerce.',
    scope: [
      'Objednávky ako vlastný post typ s 10 stavmi a mapou povolených prechodov, zmena stavu jedným podmieneným UPDATE, takže pri súbehu webhooku a návratu zo Stripe vyhrá len jeden zápis',
      'Stripe Checkout vložený v modálnom okne na webe so záložnou hostovanou stránkou, odkazom na opakovanú platbu a 2-hodinovou platnosťou relácie',
      'Webhook s overeným podpisom pre 6 udalostí Stripe vrátane refundácií, ktorý pred označením platby kontroluje session, objednávku, sumu aj menu',
      'PDF faktúry cez Dompdf s ročným číselným radom bez medzier strážených UNIQUE kľúčmi a režimom DPH podľa dátumu dodania a registrácie platiteľa',
      'Zľavové kódy s atomickou rezerváciou použitia, plne zľavnená objednávka obíde Stripe a zvyšok pod minimálnou platbou 0,50 € sa odmietne',
      'Správa objednávok vo wp-admin: filtre, uložené pohľady, hromadné zmeny stavu, CSV export pre Excel s ochranou pred formula injection a e-mail o pripravenej objednávke',
      'Nonce, honeypot, Turnstile a rate limity na IP aj na celý web, PHPStan level 5 a CI v GitHub Actions',
    ],
  },
  chatamyto: {
    summary: 'Web štyroch chát s wellness v Mýte pod Ďumbierom, ktorý má priniesť priame dopyty na rezerváciu. Vlastná WordPress téma, v ktorej údaje o chatách zadané raz poháňajú stránky, štruktúrované dáta, llms.txt aj sitemapu obrázkov.',
    scope: [
      'Štruktúrované dáta nad Rank Math free: LodgingBusiness s časmi príchodu a odchodu, vybavením, cenovým rozpätím a ponukou pre každú chatu, prepojený cez containsPlace na uzly House a Accommodation, kontakt ako ContactPage s FAQPage z ACF',
      'Údaje o chatách zadané raz v ACF (izby, hostia, plocha, cena od, galéria) poháňajú šablóny, JSON-LD, llms.txt aj sitemapu obrázkov, do ktorej sa pridávajú aj obrázky z ACF blokov',
      'Kontaktný formulár bez nonce, aby fungoval aj z cache: Turnstile s kontrolou akcie a hostname, ktorý bez kľúča zlyhá bezpečne, honeypot a potvrdenie hosťovi s Reply-To na majiteľa',
      'Vlastná cookie lišta s Consent Mode v2 od stavu denied, mapy Google až po súhlase za rovnako veľkým placeholderom a súhlas uložený ako HTTP cookie, lebo Safari drží cookies z JavaScriptu najviac 7 dní',
      'Deploy pre LiteSpeed v bezpečnom poradí: nové hashované bundly vedľa starých, purge cache a až potom mazanie starých, aby cache neuložila 404',
      'Idempotentný WP-CLI skript na nastavenie Rank Math, meta údajov a chýbajúcich alt textov, 8 ACF blokov a Tailwind so SCSS cez webpack',
    ],
  },
  nerina: {
    summary: 'Web dvojchaty Nerina pri Donovaloch, dve chaty po 12 hostí, v slovenčine, angličtine, maďarčine a poľštine. Vlastná WordPress téma, ktorá nahradila pôvodný statický web, s rezerváciami cez formulár a blogom, ktorý píše a publikuje automatizovaná pipeline.',
    scope: [
      'Vlastná WordPress téma s 24 ACF blokmi namiesto pôvodného statického webu, 4 jazyky cez WPML',
      'Automatizovaný blog: agent SEO špecialista a agent copywriter s nezávislou kontrolou faktov, ktorá zastaví nepodložené tvrdenia, publikovanie cez REST API',
      'Vlastné REST endpointy pre pipeline: prepojenie prekladov vo WPML s kontrolou oprávnení na každý článok a purge cache WP Rocket',
      'Štruktúrované dáta LodgingBusiness s dvomi ubytovacími jednotkami, hodnotením a recenziami a FAQPage z FAQ blokov',
      'Recenzie z Google Places v cache s fotkami recenzentov v knižnici médií a WP-CLI príkazom',
      'Vlastný llms.txt namiesto verzie z Yoastu, obnovený pri uložení ACF a raz denne cez cron',
      'Rezervačný formulár s Turnstile a nonce, HTML e-maily majiteľovi aj hosťovi a komentáre vypnuté naprieč webom, REST API aj XML-RPC',
    ],
  },
  teamonline: {
    summary: 'Oficiálny web skupiny HABERA & TEAM s koncertmi, diskografiou, členmi kapely, históriou a fotogalériou. Web prešiel redizajnom zo šablóny Divi s page builderom na vlastnú WordPress tému na mieru a všetky verejné adresy zostali zachované.',
    scope: [
      'WordPress téma na mieru s ACF blokmi namiesto šablóny a page buildera Divi: koncerty, diskografia, členovia kapely, história, galéria a novinky',
      'Redizajn podstránok: história ako zvislá časová os so sticky rokmi, tracklisty albumov, karty albumov s počtom fotiek a žltý akcent s textúrou z plagátu turné',
      'Koncerty zoradené podľa dátumu vedľa plagátu pre každú krajinu, s odkazom na vstupenky v Ticketportali; koncert, ktorý už prebehol, sa stlmí a stratí tlačidlá',
      'Opakovateľný migračný skript, ktorý previedol 18 stránok z Divi shortcodov na ACF bloky, s kontrolou vykresleného výsledku a druhým behom bez jedinej zmeny',
      'Fotogaléria s lightboxom GLightbox a vlastným počítadlom, YouTube video sa načíta až po kliknutí a príspevky z Facebooku až pri priblížení k sekcii',
      'Skutočná 404 v dizajne webu namiesto presmerovania na úvod, 301 zo starých adries a archívov a zatvorené miesta, ktoré prezrádzali login administrátora',
      'SEO titulky, popisy, og:image a alt texty pre 567 obrázkov nasadené skriptom, spustenie na hostingu len s FTP cez výmenu prefixu tabuliek s rollbackom prepnutím späť',
    ],
  },
  jaroslavkostial: {
    summary: 'Kampaňový web nezávislého kandidáta podľa jeho požiadaviek, od návrhu po vývoj. Jednostránkový web zo 7 blokov, ktorý ľuďom ukazuje konkrétne riešenia pre ich lokalitu.',
    scope: [
      'Návrh dizajnu a jednostránkový web zo 7 ACF blokov: úvod, piliere, o mne, riešenia, lokality, stretnutia a kontakt',
      'Karty riešení otvárajú kroky v natívnom dialógu, lokality v záložkách s výzvou poslať podnet',
      'Navigácia so scrollspy a hlavička, ktorá sa pri scrolle nadol skryje a nahor vráti',
      'Schema organizácie, oprava stavových kódov sitemapy a vlastné fonty Inter a Manrope',
      'Kontaktný formulár s Turnstile a logom e-mailov',
    ],
  },
  redcross: {
    summary: 'Oficiálny web Slovenského Červeného kríža a jeho spolkov ako jedna WordPress multisite sieť s viac ako 70 samostatnými webmi. Téma na mieru podľa dizajnu 1:1, logika celej siete a optimalizácia výkonu.',
    scope: [
      'Téma na mieru pre celú multisite sieť podľa dizajnu 1:1 a návrh logiky zdieľaných nastavení, ktoré sa načítajú raz a cachujú',
      'Sieťové nástroje: mapa spolkov na Google Maps, vyhľadanie spolku podľa PSČ a jedno tlačidlo na premazanie WP Rocket a Redis cache na všetkých weboch',
      'Vlastný e-learning s kvízmi z CSV, výsledkami, exportom a e-mailmi podľa skóre',
      '12 vlastných ACF blokov vrátane máp a mapy centier darovania krvi',
      'Darovanie cez Darujme vrátane opakovaných platieb, integrácie SmartEmailing, Relevanssi a WPForms so Salesforce',
      'Zjednodušená administrácia pre správcov jednotlivých webov',
    ],
  },
  '123gold': {
    summary: 'Sieť webov nemeckých zlatníctiev, každé na vlastnej doméne, napríklad Trauring-Zentrum Mainz. Pôvodná multisite inštalácia s viac ako 100 tisíc tabuľkami v databáze prešla na novú optimalizovanú WooCommerce infraštruktúru, kde sa nový obchod pridá jednoduchým importom a produkty so skladom sa synchronizujú s externým systémom.',
    scope: [
      'Migrácia pôvodnej multisite inštalácie s viac ako 100 tisíc tabuľkami na novú WooCommerce infraštruktúru',
      '72 webov na vlastných doménach so zdieľaným obsahom, ktorý si každý obchod môže prepísať',
      'Synchronizácia produktov a skladu s externým systémom cez API: paralelné požiadavky s opakovaním, detekcia zmien cez sha256 a idempotentné zápisy pre približne 167 tisíc produktových záznamov',
      'Nočná synchronizácia spúšťaná chráneným REST endpointom so zámkom proti súbehu',
      'Nové obchody z CSV príkazom wp shop sync: vytvorenie, úprava, obnovenie alebo archivácia, predvolene s dry-run',
      'Všetky veľkosti obrázkov rovno vo WebP pre sieť s viac ako miliónom obrázkov, vlastná schema vrstva a nemčina s angličtinou cez WPML',
    ],
  },
  lekar: {
    summary: 'Zdravotný portál o ochoreniach, prevencii a zdravom životnom štýle. Celý obsah sa presťahoval z pôvodného CMS do WordPressu s vlastnou témou podľa dizajnu 1:1, s dôrazom na SEO a rýchlosť.',
    scope: [
      'Migrácia celého obsahu z pôvodného CMS do WordPressu',
      '7 413 presmerovaní 301 zo starých adries článkov a tém na nové URL',
      'Pokročilá SEO optimalizácia so schemou MedicalOrganization',
      'Optimalizácia výkonu a lazy loading obrázkov',
      'Vlastná téma podľa dizajnu 1:1',
    ],
  },
  sadimebuducnost: {
    summary: 'Web projektu, ktorý vysádza stromy z príspevkov darcov. Interaktívna mapa ukazuje tisíce výsadieb a darovať sa dá cez vlastný formulár s platobnou bránou Stripe.',
    scope: [
      'Mapa Google Maps s približne 4 000 bodmi z externého feedu výsadieb a vlastných záznamov s GPS',
      'Body presunuté z 1,8 MB inline HTML do cachovaného markers.json, ktorý sa obnovuje každú hodinu',
      'Vlastný darovací formulár so Stripe PaymentIntents: validácia pred platbou, idempotency kľúč a rate limit',
      'Denné párovanie platieb namiesto webhooku: nájde zaplatené platby bez objednávky a označí refundácie a spory',
      'Dary ako WooCommerce objednávky (HPOS), PDF certifikát pre darcu a export darcov do XLSX bez ďalších knižníc',
    ],
  },
  onlineziak: {
    summary: 'Vzdelávací portál s článkami, poradňou a mapou predajných miest, postavený podľa dizajnu 1:1 s požiadavkou na prístupnosť WCAG 2.1 AA.',
    scope: [
      'Slovenské vyhľadávanie: koncovky slov sa pred hľadaním v Relevanssi orežú, takže nájde aj vyskloňované tvary',
      'AJAX filter článkov podľa formátu, roly a hľadaného výrazu cez vlastný REST endpoint',
      'Mapa predajných miest na Google Maps a export do CSV len pre administrátorov, kontakty zostávajú mimo verejnej mapy',
      'Poradňa s vlastným post typom a približne 40 ACF blokov',
      'Mailchimp newsletter s honeypotom a prístupnosť podľa WCAG 2.1 AA',
    ],
  },
  elektrarnapiestany: {
    summary: 'Web Elektrárne Piešťany na vlastnej WordPress téme postavenej podľa dizajnu 1:1.',
    scope: [
      'Vlastná WordPress téma podľa dizajnu 1:1',
      'Formuláre, tabuľky a Instagram feed',
      'Meranie cez GTM',
    ],
  },
  chiptech: {
    summary: 'Web firmy na chiptuning vozidiel postavený na existujúcej téme. Prácou na ňom bol pokročilý filtračný systém, ktorý návštevníka cez tri nadväzujúce úrovne dovedie k jeho vozidlu.',
    scope: [
      'Pokročilý AJAX filter vozidiel s tromi nadväzujúcimi úrovňami',
      'Doprogramovaný do existujúcej Elementor témy bez zásahu do zvyšku webu',
    ],
  },
  vibration: {
    summary: 'Firemný web Vibration, ktorý beží na vlastnej platforme Sellio 2 s frontendom vo Vue 3 a Nuxt. Úpravy a programovanie frontendu podľa dizajnu.',
    scope: [
      'Frontend vo Vue 3 a Nuxt na vlastnom CMS Sellio 2',
      'Úpravy a nové časti webu podľa dizajnu',
    ],
  },
  zlatnictvohorvath: {
    summary: 'E-shop a kamenná predajňa zlatníctva na platforme Sellio 2. Frontend vo Vue 3 a Nuxt podľa Figmy 1:1, v slovenčine aj češtine.',
    scope: [
      'Frontend vo Vue 3 a Nuxt 4 podľa Figmy 1:1: 97 komponentov a 24 stránok',
      'Produktové karty, ktoré pri prejdení myšou prehrajú video a na mobile ho ukážu po potiahnutí',
      'Text gravírovania, ktorý prejde cez košík až do pokladne',
      'Naposledy prezerané šperky, wishlist, Trustindex recenzie a Instagram galéria',
      'Výdajné miesta Packety a postupné načítanie produktov s počítadlom',
      'Slovenská a česká verzia, každá na vlastnej doméne',
    ],
  },
  vonavydomov: {
    summary: 'E-shop s parfumami na pranie na platforme Sellio 2 v siedmich jazykoch, každý na vlastnej doméne. Frontend vo Vue 3 a Nuxt podľa Figmy 1:1, ktorý slúži ako výkonová referencia pre ostatné e-shopy platformy.',
    scope: [
      'Frontend vo Vue 3 a Nuxt 4 podľa Figmy 1:1: 109 komponentov a 26 stránok',
      '7 jazykov, každý na vlastnej doméne',
      'Päť dopravcov v pokladni vrátane GLS widgetu, Packety, SPS a DPD',
      'Skladanie sád produktov, zľava za vernostné body a darčekové karty s vlastnými pravidlami košíka',
      'Výkon: preload bannera, atribúty loading a decoding, routeRules pre pokladňu a podmnožiny fontov',
      'Fixná hlavička bez skoku layoutu, recenzie a integrácia Heureky',
    ],
  },
  tatranskyprofil: {
    summary: 'E-shop s tatranským profilom, terasovými doskami a hranolmi zo severského dreva na platforme Sellio 2. Téma založená od nuly, od hlavičky a widgetov CMS až po blog a stránky pre veľkoobchod.',
    scope: [
      'Najväčšia téma platformy: 191 komponentov a 27 stránok vo Vue 3 a Nuxt',
      'Hlavička, menu kategórií, fixný bočný panel, pätička, bannery a približne 10 widgetov CMS',
      'Kontrola doručenia do Poľska: PSČ overené voči CSV z CMS a regióny vyfarbené na SVG mape',
      'Prihlásenie v modálnom okne, blog so stránkami autorov a stránky pre veľkoobchod, predajňu a partnerov',
      'Tooltipy parametrov a úprava úrovní nadpisov kvôli SEO',
    ],
  },
  najkoberce: {
    summary: 'E-shop s kobercami a bytovými doplnkami na platforme Sellio 1 (PHP Yii). Frontend podľa dizajnu 1:1 v SCSS, JavaScripte a jQuery, s dlhodobým vývojom od roku 2021.',
    scope: [
      'Frontend v Yii šablónach, SCSS a jQuery: 36 SCSS súborov a 88 šablón, build cez Grunt',
      'Jeden e-shop pre slovenskú a českú doménu s opravenými hreflang odkazmi',
      'Farebné varianty ako okrúhle tlačidlá podľa Figmy namiesto selectu a zmena obrázka podľa variantu',
      'Filtre s počtom produktov, mobilný filter, AJAX pridanie do košíka a GA datalayer',
      'Dlhodobý vývoj: viac ako 600 commitov od roku 2021',
    ],
  },
  tomaflora: {
    summary: 'E-shop s izbovými rastlinami, kvetináčmi a machovými stenami na platforme Sellio 1. Šablóna podľa dizajnu 1:1 a príprava na spustenie.',
    scope: [
      'Šablóna e-shopu podľa dizajnu 1:1 v Yii, SCSS a jQuery, build cez Grunt',
      'Instagram feed a zoom produktových fotiek v jQuery',
      'Doprava s knižnicou Packety',
    ],
  },
  madad: {
    summary: 'E-shop Madness Advertising na platforme Sellio 1. Frontend podľa dizajnu 1:1 a jeho dlhodobý vývoj od roku 2020.',
    scope: [
      'Frontend v Yii šablónach, SCSS na Bootstrap 4 a jQuery s Masonry',
      'Balíčky produktov a zobrazenie ceny od',
      'Zatvárateľný oznam v hornej lište, newsletter s reCAPTCHA a FAQ',
      'Dlhodobý vývoj: viac ako 150 commitov od roku 2020',
    ],
  },
  dermateq: {
    summary: 'Web o technológiách pre kliniky a ich výsledkoch v praxi, s vlastným obsahovým modelom, v ktorom sa technológie prepájajú s indikáciami a výsledkami. Postavený na výkon a čisté SEO.',
    scope: [
      'Post typy technológií a výsledkov s taxonómiami indikácií a kategórií',
      '36 ACF blokov s block.json (apiVersion 3)',
      'Before/after slider s clip-path ovládateľný myšou aj klávesnicou, filtre a mapa Mapbox načítaná až pri zobrazení',
      'Critical CSS pre každú šablónu, lazy loading, odložené skripty a orezané veľkosti obrázkov',
      'Schema graf: Course, FAQPage, ItemList, LocalBusiness a Product',
      'Formuláre s Turnstile a rate limitom, SMTP heslo šifrované cez sodium a bezpečnostné hlavičky z PHP',
      'MCP abilities cez WordPress Abilities API',
    ],
  },
  autoomnium: {
    summary: 'Web predajcu vozidiel BMW v slovenčine, češtine a angličtine. Ponuka áut sa prekladá automaticky cez OpenAI a české ceny sa každý deň prepočítajú podľa kurzu ECB.',
    scope: [
      'Automatický AI preklad vozidiel do angličtiny a češtiny cez OpenAI: fronta, JSON schema pre výstup modelu a šifrovaný API kľúč',
      'Ceny v CZK z denného kurzu ECB s kontrolou rozsahu a záložnou menou EUR',
      'Filter áut cez REST API s rozsahom najazdených kilometrov, triedením a vyhľadávaním bez diakritiky',
      'Vlastný post typ vozidiel so stavom predané a automatické zverejnenie áut, keď dosiahnu potrebný vek',
      'Schema Car, Offer a AutoDealer, GA4 cez GTM vrátane sledovania galérie a Consent Mode v2',
      'Export vozidiel do CSV, Tailwind a Webpack',
    ],
  },
  saunika: {
    summary: 'E-shop na WooCommerce s vlastnou témou podľa dodanej grafiky, s rozšíreným vyhľadávaním produktov a flexibilnými cenami dopravy.',
    scope: [
      'Vlastná WooCommerce téma podľa dodanej grafiky',
      'Rozšírené vyhľadávanie produktov a flexibilné ceny dopravy',
      'Tlačidlo na odstúpenie od zmluvy podľa pravidiel EÚ',
      'WebP obrázky, GTM a Google Analytics pre WooCommerce',
    ],
  },
  akbaltazarovic: {
    summary: 'Web advokátskej kancelárie, najprv ako statický HTML návrh a potom prenesený do WordPressu tak, aby vyzeral na pixel rovnako. Formuláre bežia cez vlastné REST endpointy.',
    scope: [
      'Prenos zo statického HTML do WordPressu so zhodou 1:1 a záverečným auditom zhody',
      'Kontaktný formulár a newsletter cez vlastné REST endpointy s honeypotom a limitom 5 odoslaní za hodinu',
      'Odoslania uložené vo vlastných post typoch a e-maily vo firemnom dizajne',
      'Žiara, ktorá nasleduje kurzor, a kotvy so zohľadnením sticky hlavičky',
      'Deploy jedným SSH spojením: rsync, premazanie cache a kontrola živej stránky',
      'Schema Organization, WebSite a BreadcrumbList, Vite build',
    ],
  },
  adrianastudio: {
    summary: 'Prezentačný web interiérového štúdia s referenciami, cenníkom a procesom spolupráce. Úvodný slider je napísaný tak, aby sa najväčší obrázok načítal hneď a nič neblikalo.',
    scope: [
      'Post typ referencií s kategóriami a archívom',
      '9 ACF blokov a stránka nastavení: úvod, filozofia, štýly, proces, cenník a ďalšie',
      'Úvodný slider optimalizovaný na LCP, pozastavený v skrytej karte prehliadača a s ohľadom na reduced motion',
      'GSAP a Lenis: plynulý scroll, odhaľovanie sekcií a počítadlá čísel',
      'Galéria so swipom a lightbox načítaný až pri prvom kliknutí',
      'Responzívne obrázky so srcset a preloadom úvodného obrázka, kontaktný popup s AJAX odoslaním',
    ],
  },
  schoolofarts: {
    summary: 'Web umeleckej školy, kde návštevník nájde kurzy, workshopy aj lektorov a rovno sa prihlási. Najprv statický prototyp v Tailwinde, potom vlastná WordPress téma.',
    scope: [
      'Post typy kurzov s kategóriami a odkazom na rezerváciu a členov tímu',
      '16 ACF blokov a 20 skupín polí: úvodný slider, workshopy, kurzy, Instagram, video a tím',
      'Promo systém s veľkým popupom a malým plávajúcim oknom, nastaviteľný v administrácii',
      'Slider s dotykovým ovládaním, parallax, karusel a Vimeo video',
      'WP-CLI skript na import kurzov a tímu',
    ],
  },
  norahorvathova: {
    summary: 'Kampaňový web kandidátky na starostku obce Jánovce. K webu aj tlačové a sociálne materiály kampane, generované z HTML, aby s webom sedeli do detailu.',
    scope: [
      'Anonymný formulár na podnety s 9 vrstvami ochrany, bez ukladania IP adries, bez cookies a bez CAPTCHA',
      'GSAP ScrollTrigger a Lenis animácie s ohľadom na reduced motion',
      'Tlačové PDF s 3 mm spadávkou a orezovými značkami a video overlaye vyrenderované z HTML cez Playwright',
      '10 ACF blokov: podnety, financovanie, plán, kroky, FAQ a ďalšie',
      'Critical CSS, bezpečnostné hlavičky a log e-mailov',
    ],
  },
  denva: {
    summary: 'Web freelance značky Denva v štyroch jazykoch. Blog píše a publikuje automatizovaná pipeline, ktorá sa učí z dát Search Console.',
    scope: [
      '4 jazyky cez WPML (slovenčina, čeština, maďarčina a angličtina) s hreflang a x-default doladeným aj v sitemapách',
      'Automatizovaná blogová pipeline na stále zapnutom Macu: hľadanie tém, tvorba obsahu, watchdog a spätná väzba zo Search Console',
      'Post typy služieb a prípadových štúdií a landing stránky pre lokality',
      'REST formuláre so súkromnými prílohami a štatistiky leadov bez osobných údajov',
      'llms.txt a pravidlá pre AI crawlery, schema Service a FAQPage',
      'GSAP, Lenis a deploy témy s atomickou výmenou',
    ],
  },
};
