import type { Demo } from '../i18n/types';

export const demosEn: readonly Demo[] = [
  {
    title: 'claude code - ~/clients/eshop',
    lines: [
      ['cmd', 'Move the store checkout to WooCommerce Blocks. Packeta, Stripe and custom fields must keep working.'],
      ['out', 'Plan mode: analysing templates, hooks and custom checkout fields'],
      ['sub', '↳ plan: three steps, each on its own branch'],
      ['out', 'Rewriting custom fields to the Checkout Block API'],
      ['out', 'Packeta: pickup point selector as a block extension'],
      ['out', 'Stripe: verifying webhooks on staging'],
      ['out', 'Playwright E2E: order, payment, shipping - passed'],
      ['ok', 'Pull request is ready. I merge only after my own review.'],
    ],
  },
  {
    title: 'orchestrator - agent team',
    lines: [
      ['cmd', 'From the client brief and their old site, prepare material for a quote.'],
      ['out', 'Orchestrator splits the task and sets the order of steps'],
      ['sub', '↳ crawler     walks the old site and maps its structure'],
      ['sub', '↳ analyst     compares the brief with the current state'],
      ['sub', '↳ estimate    breaks down scope based on my past projects'],
      ['sub', '↳ review      looks for gaps and unclear points'],
      ['out', 'Agents hand over outputs through a shared context'],
      ['ok', 'Scope draft and client questions are ready. I set the final price.'],
    ],
  },
  {
    title: 'mcp - denva fleet',
    lines: [
      ['cmd', 'Find sites with a critical plugin update, update them on staging and check nothing broke.'],
      ['out', 'denva_fleet.list_sites({ filter: "critical_updates" })'],
      ['out', 'wordpress.create_staging(site)'],
      ['out', 'wordpress.update_plugins(staging, { only: "critical" })'],
      ['out', 'browser.visual_diff(staging, production)'],
      ['sub', '→ one site shows a visual difference, the rest are unchanged'],
      ['ok', 'Report is ready. Production goes live only after approval.'],
    ],
  },
  {
    title: 'n8n - lead automation',
    lines: [
      ['cmd', 'webhook: new enquiry from the contact form'],
      ['sub', '→ Claude: categorise the enquiry and estimate scope'],
      ['sub', '→ enrich: company, current site, tech stack'],
      ['sub', '→ write to CRM and add a calendar task'],
      ['sub', '→ draft reply in email'],
      ['ok', 'I send the reply myself. The automation just prepares the groundwork.'],
    ],
  },
];
