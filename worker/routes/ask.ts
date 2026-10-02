import { Hono } from 'hono';
import type { AskSuccess } from '../../shared/ask-contract';
import { easterEgg } from '../agent/easter-eggs';
import { buildInstructions } from '../agent/prompt';
import { finalizeRow } from '../ask/chat-log';
import { clientKey } from '../ask/client-key';
import { parseDailyCap, reserveSlot, type Reservation } from '../ask/daily-cap';
import { askError, logEvent } from '../ask/errors';
import { callOpenAI, TOTAL_BUDGET_MS } from '../ask/openai';
import { isAllowedRequest } from '../ask/origin';
import { safetyIdentifier } from '../ask/safety-id';
import { askSchema, lastUserMessage } from '../ask/schema';
import { isTurnstileConfigValid, TURNSTILE_TIMEOUT_MS, verifyTurnstile } from '../ask/turnstile';

/** The limiter binding may be missing (Free-plan fallback); every other binding is required. */
export type AskEnv = Omit<CloudflareBindings, 'ASK_LIMITER'> & { readonly ASK_LIMITER?: RateLimit };

export const askRoute = new Hono<{ Bindings: CloudflareBindings }>();

askRoute.post('/ask', async (c) => {
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  const env: AskEnv = c.env;

  if (!isAllowedRequest(c.req.raw.headers, env.ALLOWED_ORIGINS)) return askError(c, 'forbidden_origin');

  const parsed = askSchema.safeParse(await c.req.json().catch(() => undefined));
  if (!parsed.success) return askError(c, 'invalid_input');
  const input = parsed.data;
  const question = lastUserMessage(input);

  const ip = c.req.header('CF-Connecting-IP') ?? null;
  const key = clientKey(ip);
  if (env.ASK_LIMITER && !(await env.ASK_LIMITER.limit({ key })).success) return askError(c, 'rate_limited');

  const egg = easterEgg(question, input.lang);
  if (egg !== null) return c.json({ reply: egg, kind: 'easter_egg' } satisfies AskSuccess);

  const turnstile = { secret: env.TURNSTILE_SECRET_KEY, hostname: env.TURNSTILE_HOSTNAME, action: env.TURNSTILE_ACTION };
  if (!isTurnstileConfigValid(turnstile)) {
    logEvent('turnstile_error', 503);
    return askError(c, 'unavailable');
  }
  // Checked before siteverify so a broken deploy neither burns the visitor's token nor writes a row.
  const cap = parseDailyCap(env.DAILY_CAP);
  if (cap === null || !env.OPENAI_API_KEY?.trim() || !env.OPENAI_MODEL?.trim() || !env.SAFETY_SALT?.trim()) {
    logEvent('config_error', 503);
    return askError(c, 'unavailable');
  }

  const verdict = await verifyTurnstile({
    ...turnstile,
    token: input.turnstileToken,
    remoteIp: ip,
    timeoutMs: TURNSTILE_TIMEOUT_MS,
  });
  if (!verdict.ok) {
    if (verdict.httpStatus !== null) logEvent('turnstile_error', verdict.httpStatus);
    return askError(c, 'verification_failed');
  }

  let reservation: Reservation;
  try {
    reservation = await reserveSlot(env.DB, { now: Date.now(), lang: input.lang, question, cap });
  } catch {
    logEvent('d1_error', 503);
    return askError(c, 'unavailable');
  }
  if (reservation.status === 'capped') {
    logEvent('cap_reached', 429);
    return askError(c, 'daily_cap');
  }

  const modelStartedAt = Date.now();
  const result = await callOpenAI({
    apiKey: env.OPENAI_API_KEY.trim(),
    model: env.OPENAI_MODEL.trim(),
    effort: env.OPENAI_REASONING_EFFORT,
    instructions: buildInstructions(),
    messages: input.messages,
    safetyIdentifier: await safetyIdentifier(env.SAFETY_SALT, key),
    deadline,
  });
  c.executionCtx.waitUntil(
    finalizeRow(env.DB, reservation.id, result, Date.now() - modelStartedAt).catch(() => logEvent('d1_error', 500)),
  );

  if (result.outcome === 'unavailable_quota') logEvent('openai_quota', result.httpStatus);
  if (result.outcome === 'error') logEvent('openai_error', result.httpStatus);
  if (result.text === null) return askError(c, 'upstream_unavailable');
  return c.json({ reply: result.text, kind: 'answer' } satisfies AskSuccess);
});
