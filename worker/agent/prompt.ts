import type { AskLang } from '../../shared/ask-contract';
import type { PromptParts } from '../ask/openai';
import { FACTS } from './facts';
import { CONTACT_RULE, INTRO, RULES } from './rules';

/**
 * Bump on any change to the prompt text, facts generated from the site data included, so eval
 * runs and logged answers can be tied to a prompt revision. prompt.test.ts pins a hash of the
 * text next to this value and fails until both are updated.
 */
export const PROMPT_VERSION = '2026-10-21.3';

const bullets = (lines: readonly string[]): string => lines.map((line) => `- ${line}`).join('\n');

const shared = (rules: readonly string[]): string => `${INTRO}\n\nFAKTY:\n${bullets(FACTS)}\n\nPRAVIDLÁ:\n${bullets(rules)}`;

// Two fixed prefixes, each cached on its own: the contact rule changes the prompt only while the
// hand-off is enabled. It goes before the last two rules, so the manipulation rules stay last.
const SHARED = shared(RULES);
const SHARED_WITH_CONTACT = shared([...RULES.slice(0, -2), CONTACT_RULE, ...RULES.slice(-2)]);

const SITE: Readonly<Record<AskLang, string>> = {
  sk: 'Návštevník je na slovenskej verzii webu (denisvarga.sk).',
  en: 'Návštevník je na anglickej verzii webu (denisvarga.dev).',
};

/**
 * The shared part is the same for both sites so one cache entry serves every request. The year
 * comes from the caller at request time: it must change on 1 January without a redeploy.
 * `contact` adds the hand-off rule and must match whether the request offers the tool.
 */
export function buildInstructions(lang: AskLang, year: number, contact = false): PromptParts {
  return { shared: contact ? SHARED_WITH_CONTACT : SHARED, perRequest: `${SITE[lang]} Aktuálny rok je ${year}.` };
}
