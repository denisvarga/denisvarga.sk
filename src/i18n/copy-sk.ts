import type { Copy } from './types';

export const copySk: Copy = {
  nav: { items: ['O mne', 'AI', 'Projekty'], contact: 'Kontakt' },
  hero: {
    sub: 'AI developer, agenti a automatizácie',
    title: 'Ahoj, som *Denis.*',
    lead: 'Všetko rozumné sa dá zautomatizovať. Staviam AI agentov, automatizácie a softvér na mieru, ktorý robí rutinu za ľudí.',
    cta1: 'Moja práca',
    cta2: 'Spýtať sa môjho AI agenta',
    badge: 'Otvorený projektom aj pozíciám',
  },
  about: {
    label: 'O mne',
    title: 'Vyše desať rokov vývoja. Dnes s AI v *každom kroku.*',
    body: 'Začínal som v roku 2015 stážou v agentúre, prešiel som grafikou a tlačou a od roku 2017 vyvíjam na mieru - weby, e-shopy, aplikácie aj interné nástroje. Dnes robím AI-first: kód píšem s Claude Code a Codexom, agentov nasadzujem všade, kde sa práca opakuje, a čo ešte neviem, rýchlo sa doučím. Rozumný problém, ktorý sa nedá vyriešiť, som zatiaľ nestretol.',
    facts: [
      { label: 'AI', value: 'Agenti, MCP, Claude Code, Codex' },
      { label: 'Vyvíjam', value: 'React, Next.js, WordPress, Vue.js' },
      { label: 'Teraz', value: 'Otvorený projektom aj pozíciám' },
    ],
  },
  exp: { label: 'Skúsenosti', title: 'Moja *cesta*' },
  ai: {
    label: 'AI',
    title: 'Rutinu nechávam *agentom.*',
    lead: 'Hľadám prácu, ktorú niekto každý týždeň robí ručne. Ak dáva zmysel, zautomatizujem ju. Ak nie, navrhnem ju zjednodušiť alebo zrušiť - aj to šetrí čas. Človek potom už len kontroluje výsledok.',
    tools: [
      {
        name: 'Claude Code a Codex',
        desc: 'Hlavné prostredie, v ktorom vyvíjam. Agenti kód píšu aj testujú, ja určujem smer a strážim kvalitu.',
      },
      {
        name: 'Agenti',
        desc: 'Nad Claude Agent SDK, OpenAI Agents SDK a LangGraph staviam agentov s jednou úlohou a skladám ich do tímov, ktoré si odovzdávajú prácu.',
      },
      {
        name: 'MCP servery',
        desc: 'Vlastné servery a klienti, cez ktoré AI bezpečne pracuje s WordPressom, dátami a firemnými nástrojmi.',
      },
      {
        name: 'Automatizácie',
        desc: 'Make, n8n, Zapier, webhooky a API. Najprv proces zmapujem a zbytočné kroky vyhodím, až potom ho automatizujem.',
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
      'Ako vznikol tento web?',
      'Na akých projektoch robil?',
      'Je otvorený novej pozícii?',
    ],
  },
  work: {
    label: 'Projekty',
    title: 'Čo som *postavil*',
    body: 'Weby, e-shopy a aplikácie na mieru, bez pagebuilderov a kúpených šablón. Dnes ich staviam aj spravujem s AI agentmi po boku.',
  },
  stack: { label: 'Nástroje', title: 'S čím *pracujem*' },
  contact: {
    title: 'Zaujal som vás? *Ozvite sa mi.*',
    body: 'Chceli by ste ma vo svojom tíme alebo spolupracovať na projekte? Napíšte mi, rád sa porozprávame.',
    cv: 'Stiahnuť CV',
    top: 'Späť hore',
  },
};
