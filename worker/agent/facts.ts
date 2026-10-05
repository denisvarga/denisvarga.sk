import { PROJECT_INFO, type ProjectContext, type ProjectInfo } from '../../shared/projects';

export const CONTACT_EMAIL_SK = 'hello@denisvarga.sk';
export const CONTACT_EMAIL_EN = 'hello@denisvarga.dev';
export const CONTACT_PHONE = '+421 902 074 830';

const RELATIONSHIP: Readonly<Record<ProjectContext, string>> = {
  denva: 'robil ho na voľnej nohe pod značkou Denva (denva.studio)',
  grandpano: 'robil ho ako zamestnanec GrandPano',
  own: 'je to jeho vlastný projekt',
};

const names = (projects: readonly ProjectInfo[]): string => projects.map((p) => p.name).join(', ');
const lowerFirst = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1);
const where = (p: ProjectInfo): string => (p.url ? new URL(p.url).hostname : 'súkromný projekt bez verejného webu');

// Generated from the same data as the site, so the chat never drifts from the project list.
const PROJECT_FACTS: readonly string[] = [
  `Portfólio: spolu ${PROJECT_INFO.length} projektov: ${names(PROJECT_INFO)}. Na úvodnej stránke je výber (${names(PROJECT_INFO.filter((p) => p.featured))}), celý zoznam je v sekcii "Všetky projekty". Keď sa niekto pýta na všetky projekty, vymenuj všetkých ${PROJECT_INFO.length}.`,
  ...PROJECT_INFO.map(
    (p) =>
      `Projekt ${p.name} (${where(p)}, ${lowerFirst(p.kind.sk)}): ${RELATIONSHIP[p.context]}.${p.credit ? ` ${p.credit.sk}` : ''} ${p.summary.sk} Rozsah: ${p.scope.sk.join('; ')}.`,
  ),
];

export const FACTS: readonly string[] = [
  'Denis Varga, AI a full-stack developer od nápadu po produkciu: stavia webové aplikácie, AI agentov, automatizácie a interné nástroje. Programuje od roku 2017, predtým bola stáž v agentúre (2015-2016) a grafika a tlač (2016-2017). Od roku 2017 vyvíja na mieru weby, e-shopy, aplikácie aj interné nástroje.',
  'Prístup: v probléme nevidí prekážku, ale príležitosť niečo zlepšiť: najprv ho poriadne pochopí a potom navrhne vhodné riešenie, či je to webová aplikácia, AI agent alebo interný nástroj, a niekedy je najlepšie proces zjednodušiť. AI mu dáva rýchlosť, všestrannosť a väčšiu kontrolu, rozhoduje však sám podľa toho, čo má riešenie priniesť používateľom a firme a či sa ho oplatí stavať. Automatizuje tam, kde to dáva zmysel, inde proces radšej zjednoduší. Agentom nechá kód, testy a rešerše, výsledok vždy kontroluje sám. Čo ešte nevie, rýchlo sa doučí.',
  'Vývoj robí AI-first: Claude Code a Codex, AI agenti nad Claude Agent SDK, OpenAI Agents SDK a LangGraph, multi-agent orchestrácie, vlastné MCP servery a klienti, tool calling, prompt a context engineering, LLM API (OpenAI, Anthropic, Gemini), lokálne modely cez Ollama, RAG a embeddings, structured outputs, LLM evaly, MCP integrácie do WordPressu, AI generovanie obrázkov a videa.',
  'Automatizácie: mapovanie procesov, n8n, Make, Zapier, webhooky, API integrácie, cron.',
  'Weby a aplikácie: WordPress a WooCommerce na mieru (vlastné témy, bez pagebuilderov a kúpených šablón), aplikácie v Reacte, Next.js a Vue.js, backendy v PHP, Pythone a Node.js.',
  'Web má dve jazykové verzie: slovenskú na denisvarga.sk a anglickú na denisvarga.dev.',
  'Tento web (denisvarga.sk a denisvarga.dev) postavil Denis s pomocou AI agentov, ktorí pracovali pod jeho kontrolou: on určil zadanie a plán, rozdelil prácu medzi agentov a každý výsledok skontroloval, od dizajnu po produkciu za jedno poobedie. Beží na React 19, TypeScripte a Three.js, servíruje ho Cloudflare Worker s D1 a Turnstile a tento chat odpovedá cez OpenAI (GPT-6 Luna). Zdrojový kód je verejný na github.com/denisvarga/denisvarga.sk.',
  'Skúsenosti: Denva (2018-dnes, na voľnej nohe, AI engineer a fullstack developer, priamo pre klientov), Vibration s.r.o. (2017-dnes, web developer, WordPress multisite, WooCommerce, frontendy e-shopov na platforme Sellio v PHP Yii a Vue.js), GrandPano (2026-dnes, WordPress špecialista, súbežne s Vibration s.r.o.: weby na mieru pre rezidenčné developerské projekty, od základu 1:1 podľa Figmy, s napojením na Realpad), TENENET o.z. (2021-2025, remote, web developer a IT špecialista), Multimedia s.r.o. (2016-2017, grafik pre tlač a web), Comsultia s.r.o. (2015-2016, stáž, web developer).',
  'Lokalita: Bratislava, Slovensko. Najradšej pracuje remote, hybrid alebo práca na mieste je tiež možná.',
  'Jazyky: slovenčina (materinský jazyk) a angličtina na pracovnej úrovni: písanej angličtine rozumie úplne, dohovorí sa aj ústne.',
  'Vzdelanie: Stredná odborná škola polygrafická, odbor grafik digitálnych médií (2012-2016).',
  'Stack: React, Next.js, TypeScript, Vue.js, JavaScript ES6+, Three.js, GSAP, Lenis, SCSS/BEM, Vite, webpack, PHP, Python, Node.js, Hono, WordPress, WooCommerce, ACF Pro, WP REST API, WP-CLI, Yii, MySQL, PostgreSQL, SQLite; Cloudflare Workers a D1, Docker, Git, GitHub Actions, GitLab CI, Caddy, Traefik, Vitest, Playwright, PHPStan, ESLint, Stylelint, Prettier, CodeRabbit, MainWP, Restic, GlitchTip, Uptime Kuma.',
  ...PROJECT_FACTS,
  'Dostupnosť: otvorený projektom, dlhodobej spolupráci aj pozíciám v tíme. Najviac ho zaujímajú AI roly: interný vývoj s AI, automatizácia a optimalizácia firemných procesov aj procesov klientov, napríklad v startupe alebo produktovej firme.',
  `Kontakt: e-mail ${CONTACT_EMAIL_SK} (v slovenských odpovediach) alebo ${CONTACT_EMAIL_EN} (v anglických odpovediach), telefón ${CONTACT_PHONE}.`,
];
