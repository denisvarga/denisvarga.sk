const encoder = new TextEncoder();

export async function hmacHex(salt: string, message: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey('raw', encoder.encode(salt), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Hex HMAC-SHA256 of the client key. Sent to OpenAI as `safety_identifier`; never stored or logged. */
export function safetyIdentifier(salt: string, key: string): Promise<string> {
  return hmacHex(salt, key);
}

/**
 * Key of the per-client daily counter in D1. The prefix keeps it apart from the safety identifier,
 * and the day makes yesterday's key unlinkable to today's.
 */
export function quotaKey(salt: string, day: number, clientKey: string): Promise<string> {
  return hmacHex(salt, `quota:v1:${day}:${clientKey}`);
}
