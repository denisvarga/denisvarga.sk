import * as z from 'zod/mini';
import { parseEnvList } from './env-list';

export const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
export const TURNSTILE_TIMEOUT_MS = 3_000;

// Cloudflare's documented dummy secrets (always pass, always fail, token already spent).
const TEST_SECRETS = new Set([
  '1x0000000000000000000000000000000AA',
  '2x0000000000000000000000000000000AA',
  '3x0000000000000000000000000000000AA',
]);

export interface TurnstileConfig {
  readonly secret: string | undefined;
  readonly hostname: string | undefined;
  readonly action: string | undefined;
}

/**
 * Fails closed: a real secret without an expected hostname would accept tokens minted for any site.
 * `hostname` is a comma-separated allow list.
 */
export function isTurnstileConfigValid(config: TurnstileConfig): boolean {
  const secret = config.secret?.trim();
  if (!secret) return false;
  return parseEnvList(config.hostname).length > 0 || TEST_SECRETS.has(secret);
}

const siteverifySchema = z.object({
  success: z.boolean(),
  hostname: z.optional(z.string()),
  action: z.optional(z.string()),
});

export type TurnstileVerdict = { readonly ok: true } | { readonly ok: false; readonly httpStatus: number | null };

export interface TurnstileCheck extends TurnstileConfig {
  readonly token: string;
  readonly remoteIp: string | null;
  readonly timeoutMs: number;
  readonly fetchImpl?: typeof fetch;
}

/** `httpStatus` is set only for transport failures (0 = network or timeout), not for a rejected token. */
export async function verifyTurnstile(check: TurnstileCheck): Promise<TurnstileVerdict> {
  const form = new URLSearchParams({ secret: check.secret?.trim() ?? '', response: check.token });
  if (check.remoteIp) form.set('remoteip', check.remoteIp);

  let res: Response;
  let body: unknown;
  try {
    res = await (check.fetchImpl ?? fetch)(SITEVERIFY_URL, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(check.timeoutMs),
    });
    if (!res.ok) return { ok: false, httpStatus: res.status };
    body = await res.json();
  } catch {
    return { ok: false, httpStatus: 0 };
  }

  const parsed = siteverifySchema.safeParse(body);
  if (!parsed.success) return { ok: false, httpStatus: res.status };
  const { success, hostname, action } = parsed.data;
  const expectedHosts = parseEnvList(check.hostname);
  const expectedAction = check.action?.trim();
  if (!success) return { ok: false, httpStatus: null };
  if (expectedHosts.length > 0 && !expectedHosts.includes(hostname ?? '')) return { ok: false, httpStatus: null };
  if (expectedAction && action !== expectedAction) return { ok: false, httpStatus: null };
  return { ok: true };
}
