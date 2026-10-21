import { Hono } from 'hono';
import type { AskSuccess } from '../../shared/ask-contract';
import { easterEgg } from '../agent/easter-eggs';
import { dropFlaggedTurns, guardAnswer, isManipulation, manipulationReply } from '../agent/guard';
import { buildInstructions, PROMPT_VERSION } from '../agent/prompt';
import { finalizeRow } from '../ask/chat-log';
import { clientKey } from '../ask/client-key';
import { parseDailyCap, reserveSlot, utcMidnight, type Reservation } from '../ask/daily-cap';
import { askError, logEvent } from '../ask/errors';
import { callOpenAI, TOTAL_BUDGET_MS } from '../ask/openai';
import { isAllowedRequest } from '../ask/origin';
import { createReplySigner, keepSignedTurns } from '../ask/reply-sig';
import { quotaKey, safetyIdentifier } from '../ask/safety-id';
import { askSchema, lastUserMessage } from '../ask/schema';
import { isTurnstileConfigValid, TURNSTILE_TIMEOUT_MS, verifyTurnstile } from '../ask/turnstile';
import { draftReply } from '../contact/draft-text';
import { isContactEnabled } from '../contact/mail';

/**
 * The limiter bindings may be missing (Free-plan fallback) and so may the contact mail binding
 * (the hand-off is then off); every other binding is required.
 */
export type AskEnv = Omit<CloudflareBindings, 'ASK_LIMITER' | 'CONTACT_LIMITER' | 'CONTACT_MAIL'> & {
  readonly ASK_LIMITER?: RateLimit;
  readonly CONTACT_LIMITER?: RateLimit;
  readonly CONTACT_MAIL?: SendEmail;
};

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
  // Without the binding the request still goes on: the client budget and the daily cap bound the cost.
  if (!env.ASK_LIMITER) logEvent('config_error', 503);
  else if (!(await env.ASK_LIMITER.limit({ key })).success) return askError(c, 'rate_limited');

  // Easter eggs are signed like answers, so the salt is required before any reply.
  const salt = env.SAFETY_SALT?.trim();
  if (!salt) {
    logEvent('config_error', 503);
    return askError(c, 'unavailable');
  }
  const signer = await createReplySigner(salt);

  const egg = easterEgg(question, input.lang);
  if (egg !== null) {
    const sig = await signer.sign({ lang: input.lang, anchor: question, reply: egg }, Date.now());
    return c.json({ reply: egg, kind: 'easter_egg', sig } satisfies AskSuccess);
  }
  // Left unsigned, so a later request can never carry the attempt as an answered question.
  if (isManipulation(question)) {
    return c.json({ reply: manipulationReply(input.lang), kind: 'easter_egg' } satisfies AskSuccess);
  }

  const turnstile = { secret: env.TURNSTILE_SECRET_KEY, hostname: env.TURNSTILE_HOSTNAME, action: env.TURNSTILE_ACTION };
  if (!isTurnstileConfigValid(turnstile)) {
    logEvent('turnstile_error', 503);
    return askError(c, 'unavailable');
  }
  // Checked before siteverify so a broken deploy neither burns the visitor's token nor writes a row.
  const cap = parseDailyCap(env.DAILY_CAP);
  const clientCap = parseDailyCap(env.CLIENT_DAILY_CAP);
  if (cap === null || clientCap === null || !env.OPENAI_API_KEY?.trim() || !env.OPENAI_MODEL?.trim()) {
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

  // Forged, replayed and unanswered turns are dropped silently, and so are earlier attempts with the
  // replies after them, so an honest question after an attempt still reaches the model.
  const now = Date.now();
  const messages = dropFlaggedTurns(await keepSignedTurns(signer, input.lang, input.messages, now));

  const clientQuotaKey = await quotaKey(salt, utcMidnight(now), key);
  let reservation: Reservation;
  try {
    reservation = await reserveSlot(env.DB, { now, lang: input.lang, question, cap, clientCap, quotaKey: clientQuotaKey });
  } catch {
    logEvent('d1_error', 503);
    return askError(c, 'unavailable');
  }
  if (reservation.status === 'capped') {
    logEvent(reservation.scope === 'client' ? 'client_cap_reached' : 'cap_reached', 429);
    return askError(c, 'daily_cap');
  }

  const contact = isContactEnabled(env);
  const modelStartedAt = Date.now();
  const answer = await callOpenAI({
    apiKey: env.OPENAI_API_KEY.trim(),
    model: env.OPENAI_MODEL.trim(),
    effort: env.OPENAI_REASONING_EFFORT,
    instructions: buildInstructions(input.lang, new Date(now).getUTCFullYear(), contact),
    messages,
    safetyIdentifier: await safetyIdentifier(salt, key),
    contact,
    deadline,
  });
  // A proposed message is shown and replayed like an answer, so it passes the same leak guard.
  const draft = answer.outcome === 'handoff' ? answer.draft : undefined;
  const result = guardAnswer(draft ? { ...answer, text: draftReply(input.lang, draft.message) } : answer, input.lang);
  c.executionCtx.waitUntil(
    finalizeRow(env.DB, reservation.id, result, Date.now() - modelStartedAt, PROMPT_VERSION).catch(() => logEvent('d1_error', 500)),
  );

  if (result.outcome === 'unavailable_quota') logEvent('openai_quota', result.httpStatus);
  if (result.outcome === 'error') logEvent('openai_error', result.httpStatus);
  if (result.text === null) return askError(c, 'upstream_unavailable');
  // A refused answer here is the canned reply that replaced a leak. Like the input guard's reply it
  // stays unsigned, so the question that drew the leak never returns as answered history.
  if (result.outcome === 'refused') return c.json({ reply: result.text, kind: 'answer' } satisfies AskSuccess);
  const sig = await signer.sign({ lang: input.lang, anchor: question, reply: result.text }, Date.now());
  if (result.outcome === 'handoff' && draft) {
    return c.json({ reply: result.text, kind: 'handoff_draft', sig, draft } satisfies AskSuccess);
  }
  return c.json({ reply: result.text, kind: 'answer', sig } satisfies AskSuccess);
});
