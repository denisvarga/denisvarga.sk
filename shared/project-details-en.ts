import type { ProjectDetailsBySlug } from './projects';

// English drawer texts per project slug. The site loads this module on demand for the drawer, so
// keep it out of every static import chain of the client entry.
// Every scope item is backed by the project's source code; keep it that way when editing.
export const PROJECT_DETAILS_EN: ProjectDetailsBySlug = {
  'second-brain': {
    summary: 'A personal system that collects notes, emails, articles, voice messages and photos, classifies them with Claude and turns them into a searchable knowledge base. It runs in two places: the control plane on a Hetzner VPS, speech to text, OCR and agents on an always-on Mac, connected over Tailscale.',
    scope: [
      'RAG on PostgreSQL 17 and pgvector: bge-m3 embeddings in an HNSW index, hybrid search (vectors, full text and trigrams) merged with reciprocal rank fusion and a bge-reranker-v2-m3 reranker',
      'Answers with cited sources and its own MCP server with tools for search, questions, note capture and tasks',
      'Telegram bot for capturing content, chatting with the assistant and approving agent steps',
      'Coding agent on the Claude Agent SDK in separate git worktrees, sandboxed without credentials, with plans approved in Telegram and pull requests opened by a GitHub App',
      'On Apple Silicon: speech to text with mlx-whisper (Slovak included) and OCR with Apple Vision',
      'Scheduled jobs on a pg-boss queue: daily digests, knowledge base page compilation, maintenance and self-healing tasks',
      'Docker Compose, Caddy and Cloudflare Access, deploys with a database backup, health check and automatic rollback, nightly backups with a weekly restore test',
    ],
  },
  narodnyfutbalovystadion: {
    summary: 'The National Football Stadium website in Slovak and English. Events are loaded every day from the Ticketportal XML feed, so the programme stays current without manual work.',
    scope: [
      'Daily import of the Ticketportal XML feed via WP-Cron or a button in the admin: it creates and updates events, categories and images and removes past events',
      'SEO for imported events: one canonical URL for duplicate titles, events without their own text kept out of the sitemap and search',
      'Slovak and English versions on WPML with a custom helper for bilingual template copy',
      '14 ACF blocks including stadium and park maps, events and a fan shop',
      'Turnstile that also checks hostname and action, a cookie bar with Consent Mode v2 and WordPress hardening',
    ],
  },
  brixx: {
    summary: 'A residential development site in Brno, built from scratch 1:1 from Figma. The flat price list syncs itself from the Realpad CRM every hour, and form enquiries go straight into Realpad as leads.',
    scope: [
      'Hourly sync of flats from Realpad into a custom post type: floors, PDF spec sheets, a sync history and a WP-CLI command with dry run',
      'Each sync purges both the LiteSpeed page cache and the Redis object cache',
      'Form leads sent to the Realpad API with structured GDPR consents and a backup copy in the admin',
      'Price list with AJAX filters, a price slider, filters mirrored in the URL and favourite flats',
      'krpano VR tours: 7 tours and 178 of 361 flats linked to an interior',
      '42 ACF blocks, an English version on WPML, GSAP and Lenis animations',
      'Own cookie consent with Consent Mode v2, RealEstateAgent schema, Turnstile and a robots.txt that welcomes AI crawlers',
    ],
  },
  pangeas: {
    summary: 'A slow fashion marketplace where every vendor has their own shop, shipping, payments and contracts. Beyond a regular store it handles vendor-customer messages, per-package delivery and Czech and EU legal requirements.',
    scope: [
      'WooCommerce with Dokan Pro and HPOS, 13 ACF blocks, Tailwind v4 and Sass',
      'Shipping per vendor: their own Packeta credentials, weight-based price tiers and a rate for each package at checkout',
      'Vendor-customer messaging stored in its own database tables',
      'Zboží.cz XML feed, Zboží conversions, Sklik retargeting and Meta Pixel tied to consent',
      'Online withdrawal form under EU Directive 2023/2673, vendor contracts and terms as PDF',
      'Playwright suite: 44 spec files and 155 tests',
    ],
  },
  routie: {
    summary: 'Own online store where customers upload a GPX route from a run, ride or hike and instantly see it on a map. The next generation, with 3D terrain relief and export for 3D printing, is in development.',
    scope: [
      'GPX upload over AJAX with a type check and private storage, the file travels with the order',
      'GPX parsed in the browser and drawn as a route on a MapLibre GL map',
      'Personalisation: headline, subtitle, description and up to 4 custom stats carried into the cart, order, admin and emails',
      'WooCommerce with Stripe, Packeta, PDF invoices and WPML',
      'In development: a Next.js 16 and React 19 platform with Postgres and Drizzle, a three.js 3D configurator with terrain relief and STL export in millimetres, print PDFs and e2e tests',
    ],
  },
  monkeystudios: {
    summary: 'A WordPress site for an architectural visualization studio, custom-built 1:1 from the supplied design. The intro plays a 3D building animation as you scroll, and the whole site runs on dozens of custom animations.',
    scope: [
      'A 106-frame hero sequence driven by scroll: on desktop a canvas with pre-decoded frames or an H.264 video at half the data, on phones a single playback',
      'Custom GSAP and ScrollTrigger effects: words assembling in 3D, a process timeline, sticky steps with photo crossfades and a footer parallax, 42 components in all',
      '4 languages on WPML (English, Slovak, Polish and Croatian) with custom sync of ACF blocks and alt texts',
      'Portfolio with a category filter, a mosaic and a custom lightbox, images with blur-up loading',
      'Service and FAQPage schema and its own llms.txt generated from the services',
      'Custom WordPress theme with a Vite build, contact and newsletter forms with Turnstile',
    ],
  },
  rkovacovsky: {
    summary: 'A one-page portfolio for a photographer and designer, built from the supplied design. It runs on advanced animation, from an intro that draws a signature to photo transitions that follow the scroll direction.',
    scope: [
      'Intro: a signature draws itself over a blue wash and the photo settles into sharp black and white',
      'A custom GSAP lightbox without a library: keyboard, swipe, focus trap and scroll lock through Lenis',
      'Portfolio in a hand-designed scattered layout that never repeats a photo, a category filter and a scrollspy',
      'Masonry wipes that follow the scroll direction, stacking card parallax, a portrait that blurs on scroll and an endless logo marquee',
      'ProfessionalService schema linked into Yoast, portfolio photos in the XML sitemap and SVG sanitising',
    ],
  },
  zanzara: {
    summary: 'A residential development site in Brno-Komárov, built 1:1 from Figma. It builds on Brixx and adds its own scroll experiences and detailed SEO for every flat.',
    scope: [
      'Full-screen video driven by scroll: each step plays the footage to the next stop and scrolling back plays it in reverse',
      'Horizontal benefits gallery that pins the section and pauses Lenis while you pan',
      'Price list and lead sync with Realpad, only the pages that show flats are purged after a sync',
      'Apartment and Offer schema for every flat linked to an ApartmentComplex, with counts from the live price list',
      'Price list filter state rendered on the server from the URL, whitelisted and canonicalised',
      '40 ACF blocks, a floor selector, a VR tour and WebP with a JPEG fallback',
    ],
  },
  cherries: {
    summary: 'A nail studio site with its own gift voucher sales, no WooCommerce. The customer pays through Stripe and receives a voucher with a unique code as a PDF by email.',
    scope: [
      'Gift vouchers through Stripe Checkout with server-side payment verification and a signed webhook',
      'Unique codes and PDF vouchers in private storage, an email to the customer and a notice to the studio',
      'Order management in the admin: statuses, PDF regeneration, resending the email and clearing unpaid orders',
      'Mini nail configurator: collections and colours from ACF, the chosen colour shows on a hand photo instantly',
      'Careers with JobPosting schema, BeautySalon schema and 13 ACF blocks',
    ],
  },
  novatrnita: {
    summary: 'A site for a new district just south of central Brno, built 1:1 from Figma. The focus is speed, animation and a newsletter that sends every subscriber to Realpad as a lead.',
    scope: [
      'Newsletter with a subscriber archive, an autoreply and a signed unsubscribe link, every subscriber pushed to Realpad as a lead',
      'The Realpad password is editable in the theme settings and stored encrypted (AES-256-GCM)',
      'Hand-written critical CSS, lazy loading, deferred scripts and its own llms.txt',
      'Animation: a CSS character wave in the intro, a headline that lights up on scroll, an animated barometer chart and a GSAP before/after slider',
      '12 native blocks and a contact form that works without JavaScript, with Turnstile and a rate limit',
      'PHPStan level 5, lint-staged and gitleaks on every commit',
    ],
  },
  ledpixel: {
    summary: 'A site for a company renting a modular LED wall and a presentation desk. Built 1:1 from the design, with an automated tool that measures every section against Figma.',
    scope: [
      'Automated check against Figma: a tool measures pages section by section and reports deltas in pixels',
      '21 ACF blocks: rental pricing, specs, setup tabs, FAQ and more',
      'Quote request and newsletter forms that work without JavaScript: nonce, honeypot, rate limit, Turnstile and an email log',
      'Critical CSS, lazy loading with a hero exemption, deferred scripts and font preloads',
      'CI with linting, a design token check, the build, gitleaks and CodeRabbit review',
      'GSAP animations and Lenis smooth scroll',
    ],
  },
  jurajmikus: {
    summary: 'The campaign site of Juraj Mikúš, a mayoral candidate in Skalica. Design and graphics first, then a custom theme that meets the new EU rules on political advertising.',
    scope: [
      'Billboard transparency notices under EU Regulation 2024/900: a custom post type, a list and a detail page for each surface',
      'Campaign data entered once in the settings, the campaign total adds itself up',
      'Programme, news, transparent account with documents and contact pages, each a fixed template with ACF',
      'Decorative illustrations of Skalica landmarks traced from campaign footage',
      'Forms with GDPR consent, Turnstile and an admin archive, focus moves to the status message after sending for accessibility',
      'Person schema, a hero image preload and self-hosted fonts',
    ],
  },
  limoprestige: {
    summary: 'A website for a premium chauffeur service that presents its services, fleet and popular destinations, on a custom WordPress theme built from the supplied design.',
    scope: [
      'A custom WordPress theme built from the supplied design',
    ],
  },
  maranibratislava: {
    summary: 'A website for a Georgian restaurant in Bratislava with its food, drinks and wine menus and table reservations, on a custom WordPress theme built from the supplied design.',
    scope: [
      'A custom WordPress theme built from the supplied design',
    ],
  },
  slovandisponea: {
    summary: 'An ordering app where parents and coaches of ŠK Slovan Bratislava youth teams order photos and player cards from BeYou. Orders, card payments, invoices and their management run on custom code in WordPress, without WooCommerce.',
    scope: [
      'Orders as a custom post type with 10 statuses and a map of allowed transitions, each change a single conditional UPDATE so only one write wins when the webhook and the return from Stripe race',
      'Stripe Checkout embedded in a modal on the site, with a hosted page as fallback, a pay-again link and a 2-hour session expiry',
      'A signature-verified webhook for 6 Stripe events including refunds that checks the session, order, amount and currency before marking a payment',
      'Dompdf PDF invoices in a gap-free yearly number series guarded by UNIQUE keys, with the VAT regime set by the supply date and the seller\'s registration dates',
      'Discount codes with an atomic usage reservation; a fully discounted order skips Stripe, and a remainder below the 0.50 EUR minimum charge is rejected',
      'Order management in wp-admin: filters, saved views, bulk status changes, an Excel-ready CSV export guarded against formula injection and a ready-for-pickup email',
      'Nonce, honeypot, Turnstile and per-IP plus site-wide rate limits, PHPStan level 5 and CI on GitHub Actions',
    ],
  },
  chatamyto: {
    summary: 'A site for four wellness chalets in Mýto pod Ďumbierom, built to bring in direct booking enquiries. A custom WordPress theme where chalet details entered once drive the pages, structured data, llms.txt and the image sitemap.',
    scope: [
      'Structured data on top of Rank Math free: LodgingBusiness with check-in and check-out times, amenities, a price range and an offer per chalet, linked through containsPlace to House and Accommodation nodes, and the contact page as a ContactPage with an FAQPage from ACF',
      'Chalet details entered once in ACF (rooms, guests, floor area, price from, gallery) drive the templates, JSON-LD, llms.txt and the image sitemap, which also picks up images from ACF blocks',
      'A contact form without a nonce so it works from cache: Turnstile that checks action and hostname and fails closed without a key, a honeypot and a guest confirmation with Reply-To set to the owner',
      'Own cookie consent with Consent Mode v2 starting from denied, Google Maps loaded only after consent behind a same-size placeholder, and consent stored as an HTTP cookie because Safari keeps JavaScript cookies for 7 days at most',
      'A LiteSpeed-safe deploy order: new hashed bundles next to the old ones, a cache purge, and only then removal of the old ones so the cache never stores a 404',
      'An idempotent WP-CLI script for Rank Math settings, meta and missing alt texts, 8 ACF blocks and Tailwind with SCSS through webpack',
    ],
  },
  nerina: {
    summary: 'The site of the Nerina twin chalet near Donovaly, two chalets for 12 guests each, in Slovak, English, Hungarian and Polish. A custom WordPress theme that replaced the earlier static site, with reservation requests through a form and a blog written and published by an automated pipeline.',
    scope: [
      'A custom WordPress theme with 24 ACF blocks in place of the earlier static site, 4 languages on WPML',
      'An automated blog: an SEO specialist agent and a copywriter agent with an independent fact gate that stops unsourced claims, published over the REST API',
      'Custom REST endpoints for the pipeline: WPML translation linking with per-post permission checks and a WP Rocket cache purge',
      'LodgingBusiness structured data with two accommodation units, a rating and reviews, and an FAQPage built from FAQ blocks',
      'Google Places reviews cached with reviewer photos saved to the media library and a WP-CLI command',
      'An own llms.txt in place of the Yoast one, rebuilt on ACF save and daily by cron',
      'A reservation form with Turnstile and a nonce, HTML emails to the owner and the guest, and comments switched off across the site, the REST API and XML-RPC',
    ],
  },
  teamonline: {
    summary: 'The official site of the band HABERA & TEAM with concerts, discography, band members, history and a photo gallery. It was redesigned from the Divi theme and page builder onto a custom-built WordPress theme, with every public URL kept.',
    scope: [
      'A custom-built WordPress theme with ACF blocks in place of the Divi theme and page builder: concerts, discography, band members, history, gallery and news',
      'Redesigned subpages: history as a vertical timeline with sticky years, album tracklists, album cards with a photo count, and a yellow accent with a texture from the tour poster',
      'Concerts sorted by date beside each country\'s tour poster, with a link to tickets on Ticketportal; a concert that has passed is dimmed and loses its buttons',
      'A repeatable migration script that converted 18 pages from Divi shortcodes to ACF blocks, with a check of the rendered result and a second run that changes nothing',
      'A photo gallery with a GLightbox lightbox and its own counter; the YouTube video loads only on click and the Facebook posts only as their section comes near',
      'A real 404 page in the site design instead of a redirect to the home page, 301s from old addresses and archives, and closed routes that exposed the admin login',
      'SEO titles, descriptions, og:image and alt texts for 567 images applied by a script, and a go-live on FTP-only hosting through a table prefix swap that rolls back by switching back',
    ],
  },
  jaroslavkostial: {
    summary: 'An independent candidate\'s campaign site built to his brief, from design to development. A one-page site of 7 blocks that shows residents concrete solutions for their area.',
    scope: [
      'Design and a one-page site of 7 ACF blocks: intro, pillars, about, solutions, localities, meetings and contact',
      'Solution cards open their steps in a native dialog, localities sit in tabs with a prompt to send a suggestion',
      'Navigation with a scrollspy and a header that hides on scroll down and returns on scroll up',
      'Organization schema, a fix for sitemap status codes and self-hosted Inter and Manrope fonts',
      'Contact form with Turnstile and an email log',
    ],
  },
  redcross: {
    summary: 'The official site of the Slovak Red Cross and its branches as one WordPress multisite network of more than 70 separate sites. A custom theme 1:1 from the design, the logic of the whole network and performance work.',
    scope: [
      'A custom theme for the whole multisite network 1:1 from the design, and the logic of shared settings that are read once and cached',
      'Network tools: a Google Maps map of branches, branch lookup by postal code and one button that purges the WP Rocket and Redis caches on every site',
      'Custom e-learning with quizzes from CSV, results, export and score-based emails',
      '12 custom ACF blocks including maps and a map of blood donation centres',
      'Donations through Darujme including recurring payments, SmartEmailing, Relevanssi and WPForms with Salesforce integrations',
      'A simplified admin for the managers of individual sites',
    ],
  },
  '123gold': {
    summary: 'A network of German jewellery store sites, each on its own domain, such as Trauring-Zentrum Mainz. The original multisite install with over 100,000 database tables moved to a new, optimised WooCommerce infrastructure where a new store is added with a simple import and products and stock sync with an external system.',
    scope: [
      'Migration of the original multisite install with over 100,000 tables to a new WooCommerce infrastructure',
      '72 sites on their own domains with shared content that each store can override',
      'Product and stock sync with an external system over an API: parallel requests with retries, sha256 change detection and idempotent writes for about 167,000 product records',
      'Nightly sync started by a protected REST endpoint with a lock against overlap',
      'New stores from a CSV with a wp shop sync command: create, update, restore or archive, dry run by default',
      'Every image size generated directly as WebP for a network of over a million images, its own schema layer and German with English on WPML',
    ],
  },
  lekar: {
    summary: 'A health portal about conditions, prevention and healthy living. All content moved from the original CMS to WordPress with a custom theme 1:1 from the design, with a focus on SEO and speed.',
    scope: [
      'Migration of all content from the original CMS to WordPress',
      '7,413 301 redirects from the old article and topic addresses to the new URLs',
      'Advanced SEO with MedicalOrganization schema',
      'Performance work and lazy-loaded images',
      'A custom theme 1:1 from the design',
    ],
  },
  sadimebuducnost: {
    summary: 'A site for a project that plants trees from donations. An interactive map shows thousands of plantings, and donations go through a custom form with the Stripe payment gateway.',
    scope: [
      'A Google Maps map with about 4,000 markers from an external planting feed and own GPS records',
      'Markers moved from 1.8 MB of inline HTML to a cached markers.json rebuilt every hour',
      'A custom donation form with Stripe PaymentIntents: validation before payment, an idempotency key and a rate limit',
      'Daily payment reconciliation instead of a webhook: it finds paid intents without an order and flags refunds and disputes',
      'Donations as WooCommerce orders (HPOS), a PDF certificate for donors and a donor export to XLSX without extra libraries',
    ],
  },
  onlineziak: {
    summary: 'An education portal with articles, a Q&A section and a map of sales points, built 1:1 from the design to meet WCAG 2.1 AA accessibility.',
    scope: [
      'Slovak search: word endings are trimmed before the Relevanssi query, so inflected forms still match',
      'AJAX article filter by format, role and search term through a custom REST endpoint',
      'A Google Maps map of sales points and a CSV export for admins only, keeping contacts off the public map',
      'A Q&A section with its own post type and about 40 ACF blocks',
      'Mailchimp newsletter with a honeypot and WCAG 2.1 AA accessibility',
    ],
  },
  elektrarnapiestany: {
    summary: 'The Elektrárňa Piešťany website on a custom WordPress theme built 1:1 from the design.',
    scope: [
      'A custom WordPress theme 1:1 from the design',
      'Forms, tables and an Instagram feed',
      'Tracking through GTM',
    ],
  },
  chiptech: {
    summary: 'A site for a vehicle chiptuning company built on an existing theme. The work on it was an advanced filtering system that takes visitors to their vehicle through three linked levels.',
    scope: [
      'An advanced AJAX vehicle filter with three linked levels',
      'Built into an existing Elementor theme without touching the rest of the site',
    ],
  },
  vibration: {
    summary: 'Vibration\'s company site, running on the in-house Sellio 2 platform with a Vue 3 and Nuxt frontend. Frontend changes and development from the design.',
    scope: [
      'A Vue 3 and Nuxt frontend on the in-house Sellio 2 CMS',
      'Changes and new sections of the site from the design',
    ],
  },
  zlatnictvohorvath: {
    summary: 'The online store of a jeweller with a physical shop, on the Sellio 2 platform. A Vue 3 and Nuxt frontend 1:1 from Figma, in Slovak and Czech.',
    scope: [
      'A Vue 3 and Nuxt 4 frontend 1:1 from Figma: 97 components and 24 pages',
      'Product cards that play video on hover and reveal it with a swipe on mobile',
      'Engraving text carried through the cart into checkout',
      'Recently viewed jewellery, a wishlist, Trustindex reviews and an Instagram gallery',
      'Packeta pickup points and load more with a counter',
      'Slovak and Czech versions, each on its own domain',
    ],
  },
  vonavydomov: {
    summary: 'A laundry perfume store on the Sellio 2 platform in seven languages, each on its own domain. A Vue 3 and Nuxt frontend 1:1 from Figma that serves as the performance reference for the other stores on the platform.',
    scope: [
      'A Vue 3 and Nuxt 4 frontend 1:1 from Figma: 109 components and 26 pages',
      '7 languages, each on its own domain',
      'Five carriers at checkout including a GLS widget, Packeta, SPS and DPD',
      'Product set builder, a loyalty points discount and gift cards with their own cart rules',
      'Performance: a banner preload, loading and decoding attributes, checkout routeRules and subsetted fonts',
      'A fixed header without layout shift, reviews and a Heureka integration',
    ],
  },
  tatranskyprofil: {
    summary: 'A store for Tatra profile cladding, decking and beams from Nordic timber on the Sellio 2 platform. A theme started from scratch, from the header and CMS widgets to the blog and wholesale pages.',
    scope: [
      'The largest theme on the platform: 191 components and 27 pages in Vue 3 and Nuxt',
      'Header, category menu, fixed sidebar, footer, banners and about 10 CMS widgets',
      'Polish delivery check: postcodes checked against a CSV from the CMS and regions coloured on an SVG map',
      'A login modal, a blog with author pages and pages for wholesale, the store and partners',
      'Parameter tooltips and heading levels adjusted for SEO',
    ],
  },
  najkoberce: {
    summary: 'A store for carpets and home accessories on the Sellio 1 platform (PHP Yii). A frontend 1:1 from the design in SCSS, JavaScript and jQuery, developed continuously since 2021.',
    scope: [
      'A frontend in Yii views, SCSS and jQuery: 36 SCSS partials and 88 views, built with Grunt',
      'One store for a Slovak and a Czech domain with fixed hreflang links',
      'Colour variants as round buttons from Figma instead of a select, and the image switches per variant',
      'Filters with product counts, a mobile filter, AJAX add to cart and a GA data layer',
      'Long-term development: over 600 commits since 2021',
    ],
  },
  tomaflora: {
    summary: 'A store for houseplants, pots and moss walls on the Sellio 1 platform. A template 1:1 from the design and the launch preparation.',
    scope: [
      'A store template 1:1 from the design in Yii, SCSS and jQuery, built with Grunt',
      'An Instagram feed and product photo zoom in jQuery',
      'Shipping with the Packeta library',
    ],
  },
  madad: {
    summary: 'The Madness Advertising store on the Sellio 1 platform. A frontend 1:1 from the design, developed continuously since 2020.',
    scope: [
      'A frontend in Yii views, SCSS on Bootstrap 4 and jQuery with Masonry',
      'Product packs and a price from display',
      'A dismissible top bar notice, a newsletter with reCAPTCHA and an FAQ',
      'Long-term development: over 150 commits since 2020',
    ],
  },
  dermateq: {
    summary: 'A site about technologies for clinics and their results in practice, with a custom content model that links technologies to indications and results. Built for speed and clean SEO.',
    scope: [
      'Post types for technologies and results with indication and category taxonomies',
      '36 ACF blocks with block.json (apiVersion 3)',
      'A clip-path before/after slider that works with pointer and keyboard, filters and a Mapbox map loaded only when visible',
      'Critical CSS per template, lazy loading, deferred scripts and pruned image sizes',
      'Schema graph: Course, FAQPage, ItemList, LocalBusiness and Product',
      'Forms with Turnstile and a rate limit, an SMTP password encrypted with sodium and security headers sent from PHP',
      'MCP abilities through the WordPress Abilities API',
    ],
  },
  autoomnium: {
    summary: 'A BMW dealer site in Slovak, Czech and English. The car listings are translated automatically through OpenAI, and Czech prices are recalculated every day from the ECB rate.',
    scope: [
      'Automatic AI translation of vehicles into English and Czech through OpenAI: a queue, a JSON schema for the model output and an encrypted API key',
      'CZK prices from the daily ECB rate with a range check and EUR as the fallback',
      'Car filter over a REST API with a mileage range, sorting and accent-insensitive search',
      'A custom vehicle post type with a sold status, and cars published automatically once they reach the required age',
      'Car, Offer and AutoDealer schema, GA4 through GTM including gallery tracking and Consent Mode v2',
      'Vehicle export to CSV, Tailwind and Webpack',
    ],
  },
  saunika: {
    summary: 'A WooCommerce store with a custom theme built from the client\'s design, with extended product search and flexible shipping rates.',
    scope: [
      'Custom WooCommerce theme from the client\'s design',
      'Extended product search and flexible shipping rates',
      'EU withdrawal button',
      'WebP images, GTM and Google Analytics for WooCommerce',
    ],
  },
  akbaltazarovic: {
    summary: 'A law firm site, first a static HTML design, then moved to WordPress so it looks the same to the pixel. The forms run on custom REST endpoints.',
    scope: [
      'Port from static HTML to WordPress with a 1:1 match and a final parity audit',
      'Contact form and newsletter on custom REST endpoints with a honeypot and a limit of 5 submissions an hour',
      'Submissions stored in custom post types and branded emails',
      'A glow that follows the cursor and anchor links that account for the sticky header',
      'Deploy in a single SSH session: rsync, a cache purge and a live page check',
      'Organization, WebSite and BreadcrumbList schema, Vite build',
    ],
  },
  adrianastudio: {
    summary: 'A showcase site for an interior design studio with references, pricing and the working process. The intro slider is written so the largest image loads first and nothing flickers.',
    scope: [
      'A references post type with categories and an archive',
      '9 ACF blocks and a settings page: intro, philosophy, styles, process, pricing and more',
      'Intro slider tuned for LCP, paused in hidden tabs and respecting reduced motion',
      'GSAP and Lenis: smooth scroll, section reveals and number counters',
      'Swipeable gallery and a lightbox that loads on the first click',
      'Responsive srcset images with a hero preload, a contact popup that submits over AJAX',
    ],
  },
  schoolofarts: {
    summary: 'An art school site where visitors find courses, workshops and tutors and sign up straight away. A static Tailwind prototype first, then a custom WordPress theme.',
    scope: [
      'Post types for courses with categories and a booking link, and for team members',
      '16 ACF blocks and 20 field groups: intro slider, workshops, courses, Instagram, video and team',
      'Promo system with a large popup and a small floating window, set in the admin',
      'Touch slider, parallax, a carousel and a Vimeo video',
      'WP-CLI script that imports courses and the team',
    ],
  },
  norahorvathova: {
    summary: 'The campaign site of a mayoral candidate in Jánovce. Alongside the site, the print and social media materials, generated from HTML so they match the site in every detail.',
    scope: [
      'Anonymous suggestion form with 9 layers of protection, no stored IP addresses, no cookies and no CAPTCHA',
      'GSAP ScrollTrigger and Lenis animation that respects reduced motion',
      'Print PDFs with 3 mm bleed and crop marks and video overlays rendered from HTML with Playwright',
      '10 ACF blocks: suggestions, funding, plan, steps, FAQ and more',
      'Critical CSS, security headers and an email log',
    ],
  },
  denva: {
    summary: 'The site of the Denva freelance brand in four languages. The blog is written and published by an automated pipeline that learns from Search Console data.',
    scope: [
      '4 languages on WPML (Slovak, Czech, Hungarian and English) with hreflang and x-default tuned in the sitemaps too',
      'Automated blog pipeline on an always-on Mac: topic scouting, content, a watchdog and a Search Console feedback loop',
      'Service and case study post types and landing pages per location',
      'REST forms with private attachments and lead statistics without personal data',
      'llms.txt and an AI crawler policy, Service and FAQPage schema',
      'GSAP, Lenis and an atomic-swap theme deploy',
    ],
  },
};
