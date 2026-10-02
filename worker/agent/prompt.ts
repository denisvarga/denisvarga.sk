import { FACTS } from './facts';
import { INTRO, RULES } from './rules';

/** Bump on any wording change so eval runs and logged answers can be tied to a prompt revision. */
export const PROMPT_VERSION = '2026-10-02.5';

const bullets = (lines: readonly string[]): string => lines.map((line) => `- ${line}`).join('\n');

export function buildInstructions(): string {
  return `${INTRO}\n\nFAKTY:\n${bullets(FACTS)}\n\nPRAVIDLÁ:\n${bullets(RULES)}`;
}
