import type { AskLang } from '../../shared/ask-contract';
import type { ModelResult } from '../ask/openai';
import { CONTACT_EMAIL_EN, CONTACT_EMAIL_SK } from './facts';
import { INTRO, RULES } from './rules';

// Only high-precision patterns: an imperative paired with its target, or a template marker nobody
// types by accident. Anything subtler is left to the prompt rule, so honest questions about
// prompts, rules or security never get a canned reply.

/** NFKD also folds fullwidth and styled letters; format characters hide zero-width splits. */
export function normalize(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\p{M}\p{Cf}]/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const toWords = (text: string): string => normalize(text).replace(/[^a-z0-9]+/g, ' ').trim();

// Matched against the word form: ASCII letters and digits separated by single spaces.
const PHRASES: readonly RegExp[] = [
  /\b(?:ignore|disregard|forget|override|bypass)(?: \w+){0,3} (?:previous|prior|above|earlier|all|your|these|those|system)(?: \w+){0,2} (?:instructions?|rules|prompts?|guidelines)\b/,
  /\b(?:ignoruj|ignorujte|zabudni|zabudnite|prepis|prepiste|obid|obidte|zrus|zruste)(?: \w+){0,3} (?:pokyn|instrukci|pravid|prompt|obmedzeni)/,
  /\b(?:show|reveal|print|repeat|output|dump|leak|display|disclose|recite|paste|copy|translate|encode|summarize|tell|give|send|share)(?: (?:me|us|all|of|the|full|entire|whole|complete|exact))* (?:your (?:\w+ )?(?:system prompt|prompt|instructions|rules|guidelines)|(?:hidden|secret|initial|original|internal) (?:prompt|instructions)|system prompt)\b/,
  /\b(?:vypis|vypiste|ukaz|ukazte|zobraz|zobrazte|prezrad|prezradte|zopakuj|zopakujte|skopiruj|skopirujte|povedz|povedzte|posli|poslite|preloz|prelozte)(?: (?:mi|nam|prosim|cely|celu|cele|presne|doslova|vsetky|obsah|znenie|svoj|tvoj|svoje|tvoje))* (?:system(?:ovy|oveho)? promptu?\b|(?:svoje|tvoje|svojich|tvojich|skryte|skrytych|interne|systemove|povodne) (?:pokyn|instrukci|pravidl|pravidiel|nastaveni))/,
  // "Developer mode" alone is a Chrome or Android setting, so it needs a switch verb or a status.
  /\b(?:enable|activate|enter|switch|turn on|prepni|zapni|aktivuj|prejdi)(?: \w+){0,2} (?:developer|admin|god|dan|jailbreak|unrestricted|vyvojarsk\w*|administratorsk\w*|neobmedzen\w*) (?:mode|mod|modu|rezim|rezimu)\b/,
  /\b(?:developer|dan|jailbreak) mode (?:enabled|activated|on)\b/,
  /\bdan mode\b/,
  /\bdo anything now\b/,
];

// Matched against the normalised text, punctuation kept.
const MARKERS: readonly RegExp[] = [
  /<\|[a-z_]+\|>/,
  /<<\/?sys>>/,
  /\[\/?(?:system|inst|sys)\]/,
  /#+ ?(?:system|instructions?) ?:/,
  /<\/?(?:system|instructions?|skill|skills|developer|tool_call|function_calls?|system-reminder)\b[^>]*>/,
  /"role" ?: ?"(?:system|developer)"/,
  /\bnew (?:system )?(?:instructions|rules|prompt) ?:/,
  /\bnove (?:pokyny|instrukcie|pravidla) ?:/,
];

/** True for an attempt to override, reveal or role-play around the instructions. */
export function isManipulation(text: string): boolean {
  const plain = normalize(text);
  const words = toWords(text);
  return MARKERS.some((re) => re.test(plain)) || PHRASES.some((re) => re.test(words));
}

const SHINGLE_WORDS = 8;
const HEADING = /\b(?:fakty|pravidla):/;
const CANARY = /\bdv guard\b/;

function shingles(text: string): string[] {
  const words = toWords(text).split(' ');
  const out: string[] = [];
  for (let i = 0; i + SHINGLE_WORDS <= words.length; i++) out.push(words.slice(i, i + SHINGLE_WORDS).join(' '));
  return out;
}

// Facts are left out on purpose: answers are supposed to repeat them.
const SHINGLE_INDEX = new Map<string, Set<number>>();
[INTRO, ...RULES].forEach((entry, i) => {
  for (const shingle of shingles(entry)) SHINGLE_INDEX.set(shingle, (SHINGLE_INDEX.get(shingle) ?? new Set()).add(i));
});

/**
 * True when a reply reproduces the instructions. Two different entries are required because an
 * honest answer may echo a single rule's example, such as the Ticketportal feed.
 */
export function leaksInstructions(reply: string): boolean {
  if (HEADING.test(normalize(reply)) || CANARY.test(toWords(reply))) return true;
  const entries = new Set<number>();
  for (const shingle of shingles(reply)) for (const i of SHINGLE_INDEX.get(shingle) ?? []) entries.add(i);
  return entries.size >= 2;
}

const REPLIES: Readonly<Record<AskLang, readonly [string, ...string[]]>> = {
  sk: [
    `Dobrý pokus, ale neprešiel. Denis má tento chat ošetrený proti manipulácii. Ak chcete takto odolného AI agenta aj u vás, rád vám ho pripraví: ${CONTACT_EMAIL_SK}`,
    `Pekný trik, ale tieto dvere Denis zamkol hneď na začiatku. Ak chcete AI agenta, ktorý ustojí aj vašich najkreatívnejších návštevníkov, napíšte mu na ${CONTACT_EMAIL_SK}`,
    `Na toto som pripravený, Denis ma skúšal aj horšími pokusmi. Ak potrebujete AI chat, ktorý sa nedá len tak oblafnúť, ozvite sa mu na ${CONTACT_EMAIL_SK}`,
    `Moje inštrukcie nie sú tajomstvo, celý kód je verejne na github.com/denisvarga/denisvarga.sk. Prepísať ich ale nedám. Rovnako odolného agenta vám Denis rád postaví aj pre váš web: ${CONTACT_EMAIL_SK}`,
  ],
  en: [
    `Nice try, but it didn't work. Denis hardened this chat against manipulation. If you want an AI agent this resilient for your own product, he'd be glad to build one: ${CONTACT_EMAIL_EN}`,
    `Clever trick, but Denis locked that door on day one. If you want an AI agent that holds up against your most creative visitors, write to him at ${CONTACT_EMAIL_EN}`,
    `I was ready for that one, Denis tested me with worse. If you need an AI chat that can't be talked into anything, get in touch at ${CONTACT_EMAIL_EN}`,
    `My instructions aren't a secret, the whole code is public at github.com/denisvarga/denisvarga.sk. Rewriting them is another matter. Denis can build an agent just as resilient for your site: ${CONTACT_EMAIL_EN}`,
  ],
};

/** One of the canned replies to a manipulation attempt; `random` returns a number in [0, 1). */
export function manipulationReply(lang: AskLang, random: () => number = Math.random): string {
  const variants = REPLIES[lang];
  return variants[Math.floor(random() * variants.length)] ?? variants[0];
}

/** Swaps a leaking answer for a canned reply; the row is then logged as `refused` with the text the visitor saw. */
export function guardAnswer(result: ModelResult, lang: AskLang, random?: () => number): ModelResult {
  if (result.text === null || !leaksInstructions(result.text)) return result;
  return { ...result, outcome: 'refused', text: manipulationReply(lang, random) };
}
