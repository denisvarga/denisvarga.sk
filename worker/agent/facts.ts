import { JOBS, type Job } from '../../shared/jobs';
import { PROJECTS_WITH_DETAILS as PROJECT_INFO, type ProjectWithDetails as ProjectInfo } from '../../shared/project-details';
import type { ProjectContext } from '../../shared/projects';
import { SKILLS, skillLabel } from '../../shared/skills';

export const CONTACT_EMAIL_SK = 'hello@denisvarga.sk';
export const CONTACT_EMAIL_EN = 'hello@denisvarga.dev';
export const CONTACT_PHONE = '+421 902 074 830';

const RELATIONSHIP: Readonly<Record<ProjectContext, string>> = {
  denva: 'robil ho na voľnej nohe pod značkou Denva (denva.studio)',
  grandpano: 'robil ho ako zamestnanec GrandPano',
  vibration: 'robil ho ako zamestnanec Vibration s.r.o.',
  own: 'je to jeho vlastný projekt',
};

const names = (projects: readonly ProjectInfo[]): string => projects.map((p) => p.name).join(', ');
const lowerFirst = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1);
const where = (p: ProjectInfo): string => (p.url ? new URL(p.url).hostname : 'súkromný projekt bez verejného webu');
// The employee credit repeats the relationship word for word, so only other credits are kept.
const credit = (p: ProjectInfo): string => (p.credit && !p.credit.sk.startsWith('Realizované ako zamestnanec') ? ` ${p.credit.sk}` : '');

// Generated from the same data as the site, so the chat never drifts from the project list.
const PROJECT_FACTS: readonly string[] = [
  `Portfólio: spolu ${PROJECT_INFO.length} projektov: ${names(PROJECT_INFO)}. Na úvodnej stránke je výber (${names(PROJECT_INFO.filter((p) => p.featured))}), celý zoznam je v sekcii "Všetky projekty". Keď sa niekto pýta na všetky projekty, vymenuj všetkých ${PROJECT_INFO.length}.`,
  ...PROJECT_INFO.map(
    (p) =>
      `Projekt ${p.name} (${where(p)}, ${lowerFirst(p.kind.sk)}): ${RELATIONSHIP[p.context]}.${credit(p)} ${p.summary.sk} Rozsah: ${p.scope.sk.join('; ')}.`,
  ),
];

const period = ({ start, end }: Job['period']): string => `${start}-${end ?? 'dnes'}`;
const ongoing = JOBS.filter((j) => j.period.end === null).map((j) => j.company);

// The site writes the job texts in Denis's own voice, so they are quoted as his words.
const JOB_FACTS: readonly string[] = [
  `Súbežne dnes pôsobí na ${ongoing.length} miestach: ${ongoing.join(', ')}`,
  ...JOBS.map((j) => `Skúsenosť: ${j.company} (${period(j.period)}), ${j.role.sk}. Denis o nej píše: "${j.text.sk}"`),
];

const STACK_FACT = `Stack podľa oblastí: ${SKILLS.map((group) => `${group.name.sk}: ${group.items.map((item) => skillLabel(item, 'sk')).join(', ')}`).join('; ')}.`;

export const FACTS: readonly string[] = [
  'Denis Varga, AI a full-stack developer od nápadu po produkciu: stavia webové aplikácie, AI agentov, automatizácie a interné nástroje. Programuje od roku 2017, predtým bola stáž v agentúre (2015-2016) a grafika a tlač (2016-2017). Od roku 2017 vyvíja na mieru weby, e-shopy, aplikácie aj interné nástroje.',
  'Prístup: v probléme nevidí prekážku, ale príležitosť niečo zlepšiť: najprv ho poriadne pochopí a potom navrhne vhodné riešenie, či je to webová aplikácia, AI agent alebo interný nástroj, a niekedy je najlepšie proces zjednodušiť. AI mu dáva rýchlosť, všestrannosť a väčšiu kontrolu, rozhoduje však sám podľa toho, čo má riešenie priniesť používateľom a firme a či sa ho oplatí stavať. Automatizuje tam, kde to dáva zmysel, inde proces radšej zjednoduší. Agentom nechá kód, testy a rešerše, výsledok vždy kontroluje sám. Čo ešte nevie, rýchlo sa doučí.',
  'Vývoj robí AI-first. Robí aj MCP integrácie do WordPressu. Všetky AI nástroje, modely a postupy aj nástroje na automatizáciu sú v bode Stack.',
  'Weby a aplikácie: WordPress a WooCommerce na mieru (vlastné témy, bez pagebuilderov a kúpených šablón), aplikácie v Reacte, Next.js a Vue.js, backendy v PHP, Pythone a Node.js.',
  'Web má dve jazykové verzie: slovenskú na denisvarga.sk a anglickú na denisvarga.dev.',
  'Tento web (denisvarga.sk a denisvarga.dev) postavil Denis s pomocou AI agentov, ktorí pracovali pod jeho kontrolou: on určil zadanie a plán, rozdelil prácu medzi agentov a každý výsledok skontroloval, od dizajnu po produkciu za jedno poobedie. Beží na React 19, TypeScripte a Three.js, servíruje ho Cloudflare Worker s D1 a Turnstile a tento chat odpovedá cez OpenAI (GPT-6 Luna). Zdrojový kód je verejný na github.com/denisvarga/denisvarga.sk.',
  ...JOB_FACTS,
  'Lokalita: Bratislava, Slovensko. Najradšej pracuje remote, hybrid alebo práca na mieste je tiež možná.',
  'Jazyky: slovenčina (materinský jazyk) a angličtina na pracovnej úrovni: písanej angličtine rozumie úplne, dohovorí sa aj ústne.',
  'Vzdelanie: Stredná odborná škola polygrafická (anglicky Secondary School of Printing), odbor grafik digitálnych médií (2012-2016).',
  STACK_FACT,
  ...PROJECT_FACTS,
  'Dostupnosť: otvorený projektom, dlhodobej spolupráci aj pozíciám v tíme. Najviac ho zaujímajú AI roly: interný vývoj s AI, automatizácia a optimalizácia firemných procesov aj procesov klientov, napríklad v startupe alebo produktovej firme.',
  `Kontakt: e-mail ${CONTACT_EMAIL_SK} (v slovenských odpovediach) alebo ${CONTACT_EMAIL_EN} (v anglických odpovediach), telefón ${CONTACT_PHONE}.`,
];
