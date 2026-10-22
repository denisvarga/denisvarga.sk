import type { Context } from 'hono';
import type { AskError, AskErrorCode } from '../../shared/ask-contract';
import type { ContactError, ContactErrorCode } from '../../shared/contact-contract';

type ErrorStatus = 400 | 403 | 413 | 429 | 500 | 502 | 503;

const STATUS: Record<AskErrorCode | ContactErrorCode, ErrorStatus> = {
  invalid_input: 400,
  forbidden_origin: 403,
  rate_limited: 429,
  verification_failed: 403,
  daily_cap: 429,
  upstream_unavailable: 502,
  send_failed: 502,
  unavailable: 503,
  internal: 500,
};

export function askError(c: Context, code: AskErrorCode, status: ErrorStatus = STATUS[code]): Response {
  return c.json({ error: code } satisfies AskError, status);
}

export function contactError(c: Context, code: ContactErrorCode, status: ErrorStatus = STATUS[code]): Response {
  return c.json({ error: code } satisfies ContactError, status);
}

export type LogEvent =
  | 'cap_reached'
  | 'client_cap_reached'
  | 'openai_quota'
  | 'openai_error'
  | 'turnstile_error'
  | 'd1_error'
  | 'config_error'
  | 'access_jwks_error'
  | 'access_denied'
  | 'retention_error'
  | 'retention_config_error'
  | 'contact_sent'
  | 'contact_cap_reached'
  | 'mail_error'
  | 'internal_error';

const INFO_EVENTS: ReadonlySet<LogEvent> = new Set(['contact_sent']);

/**
 * Logs carry a fixed event code, an HTTP status and, for mail errors, Cloudflare's fixed `E_` code
 * only: never visitor text, upstream messages or identifiers.
 */
export function logEvent(event: LogEvent, status: number, code?: string): void {
  const entry = code === undefined ? { event, status } : { event, status, code };
  if (INFO_EVENTS.has(event)) console.log(entry);
  else console.error(entry);
}
