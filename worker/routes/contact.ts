import { Hono } from 'hono';
import type { AskLang } from '../../shared/ask-contract';
import type { ContactSuccess } from '../../shared/contact-contract';
import { clientKey } from '../ask/client-key';
import { parseDailyCap, reserveContactSlot, utcMidnight, type ContactReservation } from '../ask/daily-cap';
import { contactError, logEvent } from '../ask/errors';
import { isAllowedRequest } from '../ask/origin';
import { createReplySigner, keepSignedTurns, type ReplySigner } from '../ask/reply-sig';
import { quotaKey } from '../ask/safety-id';
import { isTurnstileConfigValid, TURNSTILE_TIMEOUT_MS, verifyTurnstile } from '../ask/turnstile';
import { SENT_REPLY } from '../contact/draft-text';
import { buildContactMail, sendContactMail } from '../contact/mail';
import { contactSchema, type ContactInput } from '../contact/schema';
import type { AskEnv } from './ask';

export const contactRoute = new Hono<{ Bindings: CloudflareBindings }>();

/**
 * Verified replies and the questions they answer, as the model would see them. keepSignedTurns
 * always keeps the last message, so an empty question goes last and is removed again.
 */
async function verifiedTranscript(signer: ReplySigner, lang: AskLang, messages: ContactInput['messages'], nowMs: number) {
  const kept = await keepSignedTurns(signer, lang, [...messages, { role: 'user' as const, content: '' }], nowMs);
  return kept.slice(0, -1).map(({ role, content }) => ({ role, content }));
}

/**
 * Emails a confirmed message to Denis. A draft is not required: this is a contact form behind its
 * own Turnstile action, rate limit and daily caps either way. Nothing is stored except the two
 * counters; the name, email and message exist only in the email.
 */
contactRoute.post('/contact', async (c) => {
  const env: AskEnv = c.env;
  if (env.CONTACT_ENABLED?.trim() !== 'true') return contactError(c, 'unavailable');
  const mailBinding = env.CONTACT_MAIL;
  if (!mailBinding) {
    logEvent('config_error', 503);
    return contactError(c, 'unavailable');
  }

  if (!isAllowedRequest(c.req.raw.headers, env.ALLOWED_ORIGINS)) return contactError(c, 'forbidden_origin');

  const parsed = contactSchema.safeParse(await c.req.json().catch(() => undefined));
  if (!parsed.success) return contactError(c, 'invalid_input');
  const input = parsed.data;

  const ip = c.req.header('CF-Connecting-IP') ?? null;
  const key = clientKey(ip);
  // Without the binding the request still goes on: both daily caps bound the volume.
  if (!env.CONTACT_LIMITER) logEvent('config_error', 503);
  else if (!(await env.CONTACT_LIMITER.limit({ key })).success) return contactError(c, 'rate_limited');

  // Checked before siteverify so a broken deploy neither burns the visitor's token nor counts a message.
  const turnstile = { secret: env.TURNSTILE_SECRET_KEY, hostname: env.TURNSTILE_HOSTNAME, action: env.TURNSTILE_CONTACT_ACTION };
  // Unlike the chat, a blank action is refused: it would let a token minted for /api/ask send mail.
  if (!isTurnstileConfigValid(turnstile) || !turnstile.action?.trim()) {
    logEvent('turnstile_error', 503);
    return contactError(c, 'unavailable');
  }
  const salt = env.SAFETY_SALT?.trim();
  const clientCap = parseDailyCap(env.CONTACT_CLIENT_DAILY_CAP);
  const cap = parseDailyCap(env.CONTACT_DAILY_CAP);
  const from = env.CONTACT_FROM?.trim();
  const to = env.CONTACT_TO?.trim();
  if (!salt || clientCap === null || cap === null || !from || !to) {
    logEvent('config_error', 503);
    return contactError(c, 'unavailable');
  }

  const verdict = await verifyTurnstile({ ...turnstile, token: input.turnstileToken, remoteIp: ip, timeoutMs: TURNSTILE_TIMEOUT_MS });
  if (!verdict.ok) {
    if (verdict.httpStatus !== null) logEvent('turnstile_error', verdict.httpStatus);
    return contactError(c, 'verification_failed');
  }

  const now = Date.now();
  let reservation: ContactReservation;
  try {
    reservation = await reserveContactSlot(env.DB, { now, clientCap, cap, quotaKey: await quotaKey(salt, utcMidnight(now), `contact:${key}`) });
  } catch {
    logEvent('d1_error', 503);
    return contactError(c, 'unavailable');
  }
  if (reservation.status === 'capped') {
    logEvent('contact_cap_reached', 429);
    return contactError(c, 'daily_cap');
  }

  const signer = await createReplySigner(salt);
  const transcript = await verifiedTranscript(signer, input.lang, input.messages, now);
  const sent = await sendContactMail(mailBinding, buildContactMail({ from, to }, { ...input, transcript }));
  if (!sent.ok) {
    logEvent('mail_error', 502, sent.code);
    return contactError(c, 'send_failed');
  }
  logEvent('contact_sent', 200);

  // Anchored to a question the Worker already answered, so the confirmation can never carry an
  // unverified question into a later request. Without one it signs an empty anchor, which no
  // history can match.
  const anchor = transcript.findLast((m) => m.role === 'user')?.content ?? '';
  const reply = SENT_REPLY[input.lang];
  const sig = await signer.sign({ lang: input.lang, anchor, reply }, Date.now());
  return c.json({ reply, sig } satisfies ContactSuccess);
});
