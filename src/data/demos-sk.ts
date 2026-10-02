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
    title: 'orchestrátor - tím agentov',
    lines: [
      ['cmd', 'Z briefu klienta a jeho starého webu priprav podklady k cenovej ponuke.'],
      ['out', 'Orchestrátor rozdelí úlohu a určí poradie krokov'],
      ['sub', '↳ crawler     prejde starý web a spíše štruktúru'],
      ['sub', '↳ analytik    porovná brief so súčasným stavom'],
      ['sub', '↳ odhad       rozpíše rozsah podľa mojich minulých projektov'],
      ['sub', '↳ kontrola    hľadá nejasnosti a chýbajúce informácie'],
      ['out', 'Agenti si odovzdávajú výstupy cez spoločný kontext'],
      ['ok', 'Návrh rozsahu a otázky pre klienta sú hotové. Finálnu cenu určujem ja.'],
    ],
  },
  {
    title: 'mcp - denva fleet',
    lines: [
      ['cmd', 'Nájdi weby s kritickým updatom pluginu, aktualizuj ich na stagingu a over, či sa nič nerozbilo.'],
      ['out', 'denva_fleet.list_sites({ filter: "critical_updates" })'],
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
