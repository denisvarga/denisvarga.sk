const encoder = new TextEncoder();

/** Hex HMAC-SHA256 of the client key. Sent to OpenAI as `safety_identifier`; never stored or logged. */
export async function safetyIdentifier(salt: string, key: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey('raw', encoder.encode(salt), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(key));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('');
}
