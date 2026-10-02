import type { AskLang } from '../../shared/ask-contract';

type EggCopy = Readonly<Record<AskLang, string>>;

const EGGS: Readonly<Record<string, EggCopy>> = {
  help: {
    sk: 'Príkazy: help, whoami, sudo hire denis. Inak sa ma pýtajte na Denisovu prácu, skúsenosti alebo projekty.',
    en: "Commands: help, whoami, sudo hire denis. Otherwise ask me about Denis's work, experience or projects.",
  },
  whoami: {
    sk: 'visitor@denisvarga.sk - zvedavý návštevník. Presne takých Denis rád stretáva.',
    en: 'visitor@denisvarga.sk - a curious visitor. Exactly the kind Denis likes to meet.',
  },
  'hire denis': {
    sk: 'Permission denied. Skúste to so sudo.',
    en: 'Permission denied. Try it with sudo.',
  },
  'sudo hire denis': {
    sk: '[sudo] heslo pre visitor: ******** Prístup povolený. Denis sa ozve hneď, ako mu napíšete na hello@denisvarga.sk alebo zavoláte na +421 902 074 830.',
    en: '[sudo] password for visitor: ******** Access granted. Denis will get back to you as soon as you email hello@denisvarga.dev or call +421 902 074 830.',
  },
};

export function normalizeCommand(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.!?]+$/, '');
}

/** Exact-match command reply, or null. Runs before Turnstile and the model: costs nothing, logs nothing. */
export function easterEgg(text: string, lang: AskLang): string | null {
  const command = normalizeCommand(text);
  return Object.hasOwn(EGGS, command) ? (EGGS[command]?.[lang] ?? null) : null;
}
