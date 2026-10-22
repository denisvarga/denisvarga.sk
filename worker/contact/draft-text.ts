import type { AskLang } from '../../shared/ask-contract';

// Neutral wording on purpose: the model reads these back as its own turns, and must never take
// them for a message it sent itself.
const DRAFT_LEAD: Readonly<Record<AskLang, string>> = {
  sk: 'Návrh správy pre Denisa:',
  en: 'Draft message for Denis:',
};

/** Signed reply for a proposed message; the history replays it as a plain assistant turn. */
export function draftReply(lang: AskLang, message: string): string {
  return `${DRAFT_LEAD[lang]}\n\n${message}`;
}

/** Signed reply after a sent message. It carries no visitor details, since it goes back to the model. */
export const SENT_REPLY: Readonly<Record<AskLang, string>> = {
  sk: 'Správa odoslaná. Denis ju dostal e-mailom a ozve sa vám.',
  en: 'Message sent. Denis has it by email and will get back to you.',
};
