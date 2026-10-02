import type { AskLang, AskRole } from '../../shared/ask-contract';

const encoder = new TextEncoder();

function base64url(bytes: ArrayBuffer): string {
  let binary = '';
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Inspects every character whatever the position of the first mismatch; only the length leaks,
// and a valid signature always has the same public length.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export interface ReplySigner {
  sign(lang: AskLang, reply: string): Promise<string>;
  verify(lang: AskLang, reply: string, sig: string | undefined): Promise<boolean>;
}

/**
 * base64url(HMAC-SHA256(secret, "reply-sig:v1:" + lang + ":" + reply)). The prefix keeps these
 * MACs apart from the safety identifier, which uses the same secret.
 */
export async function createReplySigner(secret: string): Promise<ReplySigner> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const sign = async (lang: AskLang, reply: string): Promise<string> =>
    base64url(await crypto.subtle.sign('HMAC', key, encoder.encode(`reply-sig:v1:${lang}:${reply}`)));
  return {
    sign,
    verify: async (lang, reply, sig) => typeof sig === 'string' && sig !== '' && timingSafeEqual(await sign(lang, reply), sig),
  };
}

interface HistoryTurn {
  readonly role: AskRole;
  readonly content: string;
  readonly sig?: string | undefined;
}

/** Keeps user turns and only those assistant turns this Worker signed for `lang`. */
export async function keepSignedTurns<T extends HistoryTurn>(
  signer: ReplySigner,
  lang: AskLang,
  messages: readonly T[],
): Promise<T[]> {
  const keep = await Promise.all(messages.map((m) => m.role === 'user' || signer.verify(lang, m.content, m.sig)));
  return messages.filter((_, i) => keep[i]);
}
