import type { Demo } from '../i18n/types';

export const demosSk: readonly Demo[] = [
  {
    title: 'claude code - ~/klienti/eshop',
    lines: [
      ['cmd', 'Prenes checkout e-shopu na WooCommerce Blocks. Packeta, Stripe a vlastné polia musia ostať funkčné.'],
      ['out', 'Plan mode: analyzujem šablóny, hooky a vlastné polia checkoutu'],
      ['sub', '↳ plán: tri kroky, každý v samostatnej vetve'],
      ['out', 'Vlastné polia prepisujem na Checkout Block API'],
      ['out', 'Packeta: výber výdajného miesta ako block extension'],
      ['out', 'Stripe: overujem webhooky na stagingu'],
      ['out', 'Playwright E2E: objednávka, platba, doprava - prešli'],
      ['ok', 'Pull request je pripravený. Merge robím až po vlastnej kontrole.'],
    ],
  },
  {
    title: 'orchestrátor - tento web',
    lines: [
      ['cmd', 'Prenes tento CV web z dizajnu do Reactu 1:1, pridaj AI chat a nasaď ho na Cloudflare.'],
      ['out', 'Orchestrátor: plán v 10 fázach, red team review, schválenie'],
      ['sub', '↳ agent A     sekcie a layout 1:1 s dizajnom'],
      ['sub', '↳ agent B     3D cesta v Three.js'],
      ['sub', '↳ agent C     API na Cloudflare Workers, Turnstile, D1'],
      ['sub', '↳ agent D     chat a testy'],
      ['out', 'Nezávislé review: 4 nálezy, všetky opravené'],
      ['ok', 'Web beží na denisvarga.sk. Od dizajnu po produkciu za jedno poobedie.'],
    ],
  },
  {
    title: 'mcp - správa webov',
    lines: [
      ['cmd', 'Nájdi weby s kritickým updatom pluginu, aktualizuj ich na stagingu a over, či sa nič nerozbilo.'],
      ['out', 'sites.list({ filter: "critical_updates" })'],
      ['out', 'wordpress.create_staging(site)'],
      ['out', 'wordpress.update_plugins(staging, { only: "critical" })'],
      ['out', 'browser.visual_diff(staging, production)'],
      ['sub', '→ na jednom webe je vizuálny rozdiel, ostatné sú bez zmien'],
      ['ok', 'Report je hotový. Na produkciu púšťam až po schválení.'],
    ],
  },
  {
    title: 'n8n - automatizácia dopytov',
    lines: [
      ['cmd', 'webhook: nový dopyt z kontaktného formulára'],
      ['sub', '→ Claude: kategorizácia dopytu a odhad rozsahu'],
      ['sub', '→ obohatenie: firma, súčasný web, technológie'],
      ['sub', '→ zápis do CRM a úloha v kalendári'],
      ['sub', '→ koncept odpovede v e-maile'],
      ['ok', 'Odpoveď odosielam ja. Automatizácia mi len pripraví podklady.'],
    ],
  },
];
