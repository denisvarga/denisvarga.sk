import type { AskLang } from '../../shared/ask-contract';
import type { PromptParts } from '../ask/openai';
import { FACTS } from './facts';
import { INTRO, RULES } from './rules';

/** Bump on any wording change so eval runs and logged answers can be tied to a prompt revision. */
export const PROMPT_VERSION = '2026-10-21.1';

const bullets = (lines: readonly string[]): string => lines.map((line) => `- ${line}`).join('\n');

const SHARED = `${INTRO}\n\nFAKTY:\n${bullets(FACTS)}\n\nPRAVIDLÁ:\n${bullets(RULES)}`;

const SITE: Readonly<Record<AskLang, string>> = {
  sk: 'Návštevník je na slovenskej verzii webu (denisvarga.sk).',
  en: 'Návštevník je na anglickej verzii webu (denisvarga.dev).',
};

/**
 * The shared part is the same for both sites so one cache entry serves every request. The year
 * comes from the caller at request time: it must change on 1 January without a redeploy.
 */
export function buildInstructions(lang: AskLang, year: number): PromptParts {
  return { shared: SHARED, perRequest: `${SITE[lang]} Aktuálny rok je ${year}.` };
}
