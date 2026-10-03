import type { Copy } from './types';

export const copySk: Copy = {
  nav: { items: ['O mne', 'AI', 'Projekty'], contact: 'Kontakt' },
  hero: {
    sub: 'AI developer s produktovým myslením',
    title: 'Ahoj, som *Denis.*',
    lead: 'Staviam webové aplikácie, AI agentov a interné nástroje a automatizujem firemné procesy. AI mi dáva rýchlosť, ja určujem smer: čo má vzniknúť, pre koho a prečo.',
    cta1: 'Moja práca',
    cta2: 'Spýtať sa môjho AI agenta',
    badge: 'Otvorený projektom aj pozíciám',
  },
  about: {
    label: 'O mne',
    title: 'Vyvíjam od roku 2017. Dnes s AI v *každom kroku.*',
    body: 'Začínal som v roku 2015 stážou v agentúre, prešiel som grafikou a tlačou a od roku 2017 vyvíjam na mieru: weby, e-shopy, aplikácie aj interné nástroje. Dnes pracujem AI-first. Kód píšem s Claude Code a Codexom a pri každom projekte sa najprv pýtam, čo má priniesť používateľom a firme. Čo ešte neviem, rýchlo sa doučím. A keď niečo v procese bolí, zvyčajne to vyrieši dobrý nástroj. Niekedy stačí proces zjednodušiť.',
    facts: [
      { label: 'AI', value: 'Agenti, MCP, Claude Code, Codex' },
      { label: 'Vyvíjam', value: 'Full-stack, od nápadu po produkciu' },
      { label: 'Lokalita', value: 'Bratislava alebo remote' },
    ],
  },
  exp: { label: 'Skúsenosti', title: 'Moja *cesta*', present: 'dnes' },
  ai: {
    label: 'AI',
    title: 'AI píše, ja *rozhodujem.*',
    lead: 'Agentom nechávam, čo zvládnu rýchlejšie: kód, testy, rešerše a opakujúcu sa prácu. Ja riešim, čo má produkt robiť, ako ho postaviť a či sa ho oplatí stavať. Výsledok vždy kontrolujem sám.',
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
    body: 'Weby, e-shopy a aplikácie na mieru, bez page builderov a kúpených šablón. Dnes ich staviam aj spravujem s AI agentmi po boku.',
  },
  stack: { label: 'Nástroje', title: 'S čím *pracujem*' },
  contact: {
    title: 'Zaujal som vás? *Ozvite sa mi.*',
    body: 'Hľadáte posilu do tímu alebo partnera na projekt? Napíšte mi, rád sa porozprávam.',
    cv: 'Stiahnuť CV',
    top: 'Späť hore',
  },
};
