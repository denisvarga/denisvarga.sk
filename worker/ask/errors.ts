import type { Context } from 'hono';
import type { AskError, AskErrorCode } from '../../shared/ask-contract';

type ErrorStatus = 400 | 403 | 413 | 429 | 500 | 502 | 503;

const STATUS: Record<AskErrorCode, ErrorStatus> = {
  invalid_input: 400,
  forbidden_origin: 403,
  rate_limited: 429,
  verification_failed: 403,
  daily_cap: 429,
  upstream_unavailable: 502,
  unavailable: 503,
  internal: 500,
};

export function askError(c: Context, code: AskErrorCode, status: ErrorStatus = STATUS[code]): Response {
  return c.json({ error: code } satisfies AskError, status);
}

export type LogEvent =
  | 'cap_reached'
  | 'openai_quota'
  | 'openai_error'
  | 'turnstile_error'
  | 'd1_error'
  | 'config_error'
  | 'internal_error';

// Logs carry a fixed event code and an HTTP status only: never visitor text, upstream messages or identifiers.
export function logEvent(event: LogEvent, status: number): void {
  console.error({ event, status });
}
