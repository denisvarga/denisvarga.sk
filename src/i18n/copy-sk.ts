import type { Copy } from './types';

export const copySk: Copy = {
  nav: { items: ['O mne', 'AI', 'Projekty'], contact: 'Kontakt' },
  hero: {
    sub: 'AI developer a WordPress špecialista',
    title: 'Ahoj, som *Denis.*',
    lead: 'Staviam weby na mieru a učím ich pracovať samostatne - s AI agentmi, MCP servermi a automatizáciami.',
    cta1: 'Moja práca',
    cta2: 'Spýtať sa môjho AI agenta',
    badge: 'Otvorený projektom aj pozíciám',
  },
  about: {
    label: 'O mne',
    title: 'Weby robím od roku 2015. S AI od chvíle, keď to začalo *dávať zmysel.*',
    body: 'Začínal som stážou v agentúre, potom rok pri grafike a tlači a od roku 2017 staviam weby na mieru - vlastné témy, žiadne pagebuildery. Dnes väčšinu kódu píšem v Claude Code a hľadám miesta, kde môže opakujúcu sa prácu robiť agent namiesto človeka.',
    facts: [
      { label: 'Robím', value: 'WordPress, WooCommerce, Vue.js, PHP' },
      { label: 'S AI', value: 'Claude Code, agenti, MCP, n8n' },
      { label: 'Teraz', value: 'Otvorený projektom aj pozíciám' },
    ],
  },
  exp: { label: 'Skúsenosti', title: 'Kde som *pracoval*' },
  ai: {
    label: 'AI',
    title: 'Ako pracujem *s AI*',
    lead: 'Najviac ma baví nájsť prácu, ktorú niekto každý týždeň robí ručne. Zmapujem ju, vyberiem nástroj a nechám ju bežať. Človek potom už len kontroluje výsledok.',
    tools: [
      {
        name: 'Claude Code',
        desc: 'Hlavný nástroj, v ktorom vyvíjam. PHPStan, ESLint a CodeRabbit dávajú pozor, aby kód ostal čistý.',
      },
      {
        name: 'Agenti',
        desc: 'Nad Claude Agent SDK a LangGraph staviam agentov s jednou úlohou a skladám ich do tímov.',
      },
      {
        name: 'MCP servery',
        desc: 'Vlastné servery a klienti, cez ktoré sa AI dostane k WordPressu a k dátam webov.',
      },
      {
        name: 'Automatizácie',
        desc: 'Make, n8n, Zapier, webhooky a API integrácie. Najprv proces zmapujem, potom ho nechám bežať.',
      },
    ],
  },
  ask: {
    label: 'Môj AI agent',
    title1: 'Spýtajte sa na mňa,',
    title2: 'odpovie agent.',
    placeholder: 'Na čo sa chcete opýtať?',
    send: 'Opýtať sa',
    thinking: 'Premýšľam…',
    you: 'Vy',
    agent: 'Agent',
    note: 'Agent pozná moje CV. Keď si nie je istý, povie to a dá vám na mňa kontakt.',
    error:
      'Teraz sa mi nepodarilo odpovedať. Napíšte Denisovi priamo na hello@denisvarga.sk alebo zavolajte na +421 902 074 830.',
    suggestions: [
      'S akými AI nástrojmi pracuje?',
      'Robí aj WooCommerce e-shopy?',
      'Čo je Denva Fleet?',
      'Má voľnú kapacitu?',
    ],
  },
  work: {
    label: 'Projekty',
    title: 'Weby, ktoré som *postavil*',
    body: 'Vlastné témy, žiadne pagebuildery ani kúpené šablóny. Rád ukážem aj tímové projekty, na ktorých som robil.',
  },
  stack: { label: 'Nástroje', title: 'S čím *pracujem*' },
  contact: {
    title: 'Máte projekt alebo miesto v tíme? *Napíšte mi.*',
    body: 'Rád sa pozriem na čokoľvek - od jedného webu až po dlhodobú spoluprácu.',
    cv: 'Stiahnuť CV',
    top: 'Späť hore',
  },
};
