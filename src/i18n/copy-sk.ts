import type { Copy } from './types';

export const copySk: Copy = {
  nav: { items: ['O mne', 'AI', 'Projekty'], contact: 'Kontakt' },
  hero: {
    sub: 'AI a full-stack developer, od nápadu po produkciu',
    title: 'Ahoj, som *Denis Varga.*',
    lead: 'V probléme nevidím prekážku, ale príležitosť niečo zlepšiť. Najprv ho poriadne pochopím a potom navrhnem a postavím vhodné riešenie, či je to webová aplikácia, AI agent alebo interný nástroj.',
    cta1: 'Moja práca',
    cta2: 'Spýtať sa môjho AI agenta',
    badge: 'Otvorený projektom aj pozíciám',
  },
  about: {
    label: 'O mne',
    title: 'Vyvíjam od roku 2017. Dnes s AI v *každom kroku.*',
    body: 'Začínal som v roku 2015 stážou v agentúre, prešiel som grafikou a tlačou a od roku 2017 vyvíjam na mieru: weby, e-shopy, aplikácie aj interné nástroje. Dnes pracujem AI-first: AI mi dáva rýchlosť, všestrannosť a väčšiu kontrolu, smer určujem ja. Kód píšem s Claude Code a Codexom a pri každom projekte sa najprv pýtam, čo má priniesť používateľom a firme. Čo ešte neviem, rýchlo sa doučím. Staviam AI agentov nad Claude Agent SDK, OpenAI Agents SDK a LangGraph a vlastné MCP servery, cez ktoré AI bezpečne pracuje s WordPressom, dátami a firemnými nástrojmi. Procesy automatizujem v Make a n8n. A niekedy je najlepšie riešenie proces zjednodušiť, nie ho automatizovať.',
    facts: [
      { label: 'AI', value: 'Agenti, MCP, Claude Code, Codex' },
      { label: 'Vyvíjam', value: 'Weby, e-shopy (WordPress, WooCommerce), aplikácie, automatizácie' },
      { label: 'Lokalita', value: 'Bratislava, Slovensko alebo remote' },
    ],
  },
  exp: { label: 'Skúsenosti', title: 'Moja *cesta*' },
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
    demoNote: 'Ilustračná ukážka postupu, nie záznam reálneho behu.',
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
    privacyNote: 'Otázky a odpovede uchovávam 365 dní bez vašej IP adresy či iného identifikátora, odpovedá na ne OpenAI.',
    privacyLink: 'Viac o súkromí',
    error:
      'Teraz sa mi nepodarilo odpovedať. Napíšte Denisovi priamo na hello@denisvarga.sk alebo zavolajte na +421 902 074 830.',
    suggestions: [
      'S akými AI nástrojmi pracuje?',
      'Ako vznikol tento web?',
      'Na akých projektoch robil?',
    ],
  },
  work: {
    label: 'Projekty',
    title: 'Čo som *postavil*',
    body: 'Weby, e-shopy a aplikácie na mieru, bez page builderov a kúpených šablón. Dnes ich staviam aj spravujem s AI agentmi po boku.',
    all: 'Všetky projekty',
    hide: 'Skryť zoznam',
    contexts: { denva: 'Denva.studio', grandpano: 'Zamestnanec GrandPano', vibration: 'Zamestnanec Vibration', own: 'Vlastný projekt' },
  },
  stack: { label: 'Nástroje', title: 'S čím *pracujem*' },
  contact: {
    title: 'Zaujal som vás? *Ozvite sa mi.*',
    body: 'Hľadáte posilu do tímu alebo partnera na projekt? Napíšte mi, rád sa porozprávam.',
    cv: 'Stiahnuť CV',
    top: 'Späť hore',
  },
  consent: {
    label: 'Súhlas s cookies',
    text: 'Analytické cookies (Google Analytics) mi pomáhajú zistiť, ako sa web používa. Bez vášho súhlasu sa nenačítajú.',
    accept: 'Prijať',
    reject: 'Odmietnuť',
    granted: 'Aktuálna voľba: prijaté',
    denied: 'Aktuálna voľba: odmietnuté',
    details: 'Ktoré cookies?',
    cookies: [
      { name: 'dv-consent', desc: 'localStorage, ukladá vašu voľbu, nevyhnutné' },
      { name: '_ga', desc: 'Google Analytics, rozlišuje návštevníkov, 2 roky' },
      { name: '_ga_XMK9J72476', desc: 'Google Analytics, stav relácie, 2 roky' },
    ],
    settings: 'Nastavenia cookies',
  },
  privacy: {
    title: 'Súkromie',
    sections: [
      {
        title: 'Kto spracúva údaje',
        text: 'Prevádzkovateľom je Denis Varga. Otázky k súkromiu mi posielajte na hello@denisvarga.sk.',
      },
      {
        title: 'Čo ukladá AI chat',
        text: 'Ku každej otázke pre agenta ukladám čas, jazyk, text otázky a odpovede, použitý model, čas odozvy, počet tokenov a výsledok, napríklad či odpoveď prišla. IP adresu, údaje o prehliadači ani iný identifikátor k otázkam neukladám. Prosím, nepíšte do chatu osobné údaje.',
      },
      {
        title: 'Prečo',
        text: 'Aby agent mohol odpovedať, aby som chat chránil pred zneužitím a aby som zlepšoval odpovede. Právnym základom je môj oprávnený záujem podľa čl. 6 ods. 1 písm. f) GDPR.',
      },
      {
        title: 'Ako dlho',
        text: 'Otázky a odpovede sa automaticky mažú po 365 dňoch. V zálohách databázy (Cloudflare D1 Time Travel) sa dajú obnoviť ešte najviac 30 dní. CSV exporty, ktoré si stiahnem z môjho neverejného prehľadu otázok, uchovávam sám na rovnaký účel.',
      },
      {
        title: 'OpenAI',
        text: 'Odpovede generuje OpenAI ako môj sprostredkovateľ. Údaje z EÚ spracúva spoločnosť OpenAI Ireland Limited, ktorá ich odovzdáva aj do USA na základe štandardných zmluvných doložiek EÚ v zmluve OpenAI o spracúvaní údajov. OpenAI dostane vašu otázku a predchádzajúce otázky a odpovede z toho istého rozhovoru. Konverzáciu si podľa môjho nastavenia neukladá a na trénovanie modelov ju nepoužíva. Záznamy na odhaľovanie zneužitia uchováva najviac 30 dní, dlhšie len vtedy, keď to vyžaduje zákon alebo ochrana pred škodou.',
      },
      {
        title: 'Pseudonymné identifikátory',
        text: 'Z vašej IP adresy vypočítam pomocou tajného kľúča odtlačky, z ktorých sa adresa bez tohto kľúča spätne zistiť nedá. Jeden posielam OpenAI na odhaľovanie zneužitia. Druhý sa mení každý deň, počíta vaše otázky (najviac 20 za deň) a do troch dní sa zmaže.',
      },
      {
        title: 'Cloudflare',
        text: 'Web beží na Cloudflare a záznamy otázok sú v databáze Cloudflare D1 v jurisdikcii EÚ. Pred odoslaním otázky Cloudflare Turnstile podľa signálov prehliadača a IP adresy overí, že nie ste robot. IP adresa slúži aj na limit 5 otázok za minútu a neukladám ju.',
      },
      {
        title: 'Analytika',
        text: 'Google Analytics sa načíta iba po vašom súhlase v lište cookies. Voľbu môžete kedykoľvek zmeniť cez Nastavenia cookies v pätičke.',
      },
      {
        title: 'Vaše práva',
        text: 'Máte právo na prístup, opravu, vymazanie a obmedzenie spracúvania a právo namietať. Napíšte mi na hello@denisvarga.sk. Keďže k otázkam neukladám identifikátor, uveďte približný čas a znenie otázky. Sťažnosť môžete podať Úradu na ochranu osobných údajov SR.',
      },
    ],
  },
};
