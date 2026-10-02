// POST /api/ask contract shared by the chat UI and the Worker. Plain types only; the Worker
// validates with zod against these limits.

export type AskLang = 'sk' | 'en';

export type AskRole = 'user' | 'assistant';

export interface AskMessage {
  readonly role: AskRole;
  readonly content: string;
  /**
   * The `sig` the Worker returned with an assistant reply, echoed back with the reply text
   * unchanged. The Worker drops assistant turns whose signature is missing or does not match.
   */
  readonly sig?: string;
}

export interface AskRequest {
  readonly messages: readonly AskMessage[];
  readonly lang: AskLang;
  readonly turnstileToken: string;
}

export type AskReplyKind = 'answer' | 'easter_egg';

export interface AskSuccess {
  readonly reply: string;
  readonly kind: AskReplyKind;
  /** HMAC over the reply and the request `lang`; valid only for that language. */
  readonly sig: string;
}

export const ASK_ERROR_CODES = [
  'invalid_input',
  'forbidden_origin',
  'rate_limited',
  'verification_failed',
  'daily_cap',
  'upstream_unavailable',
  'unavailable',
  'internal',
] as const;

export type AskErrorCode = (typeof ASK_ERROR_CODES)[number];

export interface AskError {
  readonly error: AskErrorCode;
}

export type AskResponse = AskSuccess | AskError;

export const MAX_MESSAGES = 8;
export const MAX_USER_CONTENT = 500;
export const MAX_ASSISTANT_CONTENT = 2000;
/** Sum of `content` lengths across all messages in one request. */
export const MAX_TOTAL = 12000;
