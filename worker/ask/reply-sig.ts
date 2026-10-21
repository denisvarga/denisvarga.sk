import type { AskLang, AskRole } from '../../shared/ask-contract';
import { utcMidnight } from './daily-cap';

const encoder = new TextEncoder();
const DAY_MS = 86_400_000;

function base64url(bytes: ArrayBuffer): string {
  let binary = '';
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

const utcDay = (nowMs: number): string => new Date(utcMidnight(nowMs)).toISOString().slice(0, 10);

// Inspects every character whatever the position of the first mismatch; only the length leaks,
// and a valid signature always has the same public length.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export interface SignedReply {
  readonly lang: AskLang;
  /** The user question the reply answers. */
  readonly anchor: string;
  readonly reply: string;
}

export interface ReplySigner {
  sign(turn: SignedReply, nowMs: number): Promise<string>;
  /** Accepts a signature made today or yesterday (UTC), so harvested signatures expire. */
  verify(turn: SignedReply, sig: string | undefined, nowMs: number): Promise<boolean>;
}

/**
 * base64url(HMAC-SHA256(secret, "reply-sig:v2:" + lang + ":" + utcDay + ":" + sha256hex(anchor) +
 * ":" + reply)). The prefix keeps these MACs apart from the other HMACs over the same secret, and
 * the fixed-length anchor hash keeps the input unambiguous.
 */
export async function createReplySigner(secret: string): Promise<ReplySigner> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const sign = async ({ lang, anchor, reply }: SignedReply, nowMs: number): Promise<string> => {
    const message = `reply-sig:v2:${lang}:${utcDay(nowMs)}:${await sha256Hex(anchor)}:${reply}`;
    return base64url(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
  };
  const verify = async (turn: SignedReply, sig: string | undefined, nowMs: number): Promise<boolean> => {
    if (typeof sig !== 'string' || sig === '') return false;
    const [today, yesterday] = await Promise.all([sign(turn, nowMs), sign(turn, nowMs - DAY_MS)]);
    return timingSafeEqual(today, sig) || timingSafeEqual(yesterday, sig);
  };
  return { sign, verify };
}

interface HistoryTurn {
  readonly role: AskRole;
  readonly content: string;
  readonly sig?: string | undefined;
}

/**
 * Keeps an assistant turn only when its signature verifies for `lang` against the latest user turn
 * before it, and an earlier user turn only when at least one verified assistant turn follows it
 * before the next user turn. The last message is always kept. Invariant: every kept earlier user
 * turn is a question this Worker answered, either an exact easter-egg command or a question that
 * passed the guard, Turnstile and the cap. Several assistant turns may share one anchor.
 */
export async function keepSignedTurns<T extends HistoryTurn>(
  signer: ReplySigner,
  lang: AskLang,
  messages: readonly T[],
  nowMs: number,
): Promise<T[]> {
  let anchor: string | null = null;
  const verified = await Promise.all(
    messages.map((m) => {
      if (m.role === 'user') {
        anchor = m.content;
        return false;
      }
      return anchor !== null && signer.verify({ lang, anchor, reply: m.content }, m.sig, nowMs);
    }),
  );
  const last = messages.length - 1;
  return messages.filter((m, i) => {
    if (i === last) return true;
    if (m.role === 'assistant') return verified[i] === true;
    for (let j = i + 1; j < messages.length && messages[j]?.role === 'assistant'; j++) if (verified[j]) return true;
    return false;
  });
}
