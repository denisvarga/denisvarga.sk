// POST /api/contact contract shared by the confirm card and the Worker. Plain types only; the
// Worker validates with zod against these limits.
import type { AskLang, AskMessage } from './ask-contract';

export interface ContactRequest {
  readonly lang: AskLang;
  readonly turnstileToken: string;
  readonly name: string;
  readonly email: string;
  readonly message: string;
  /**
   * The conversation up to the draft, with signatures, as for /api/ask. Only verified turns reach
   * the email, and the confirmation is signed for the last verified question.
   */
  readonly messages: readonly AskMessage[];
}

export interface ContactSuccess {
  /** Fixed confirmation without the visitor's details, kept in the history as an assistant turn. */
  readonly reply: string;
  readonly sig: string;
}

export const CONTACT_ERROR_CODES = [
  'invalid_input',
  'forbidden_origin',
  'rate_limited',
  'verification_failed',
  'daily_cap',
  'send_failed',
  'unavailable',
  'internal',
] as const;

export type ContactErrorCode = (typeof CONTACT_ERROR_CODES)[number];

export interface ContactError {
  readonly error: ContactErrorCode;
}

export type ContactResponse = ContactSuccess | ContactError;

export const MAX_CONTACT_NAME = 100;
export const MAX_CONTACT_EMAIL = 254;
export const MAX_CONTACT_MESSAGE = 1000;
/** Length of a message the model may propose; the visitor may lengthen it up to MAX_CONTACT_MESSAGE. */
export const MAX_DRAFT_MESSAGE = 600;

/**
 * Address pattern for the card's email field (HTML `pattern`, implicitly anchored) and the Worker,
 * so the browser never accepts an address the Worker rejects. Escaped for the `v` flag browsers
 * use for `pattern`.
 */
export const CONTACT_EMAIL_PATTERN =
  "[A-Za-z0-9._%+'\\-]+@[A-Za-z0-9](?:[A-Za-z0-9\\-]*[A-Za-z0-9])?(?:\\.[A-Za-z0-9](?:[A-Za-z0-9\\-]*[A-Za-z0-9])?)*\\.[A-Za-z]{2,}";
