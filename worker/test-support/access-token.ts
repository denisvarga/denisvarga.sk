import { sign } from 'hono/jwt';
import type { JWTPayload } from 'hono/utils/jwt/types';
import { vi } from 'vitest';
import { ACCESS_JWT_HEADER, certsUrl } from '../admin/access';
import { json } from './ask-harness';

export const TEAM_DOMAIN = 'https://denva.cloudflareaccess.com';
export const AUD = '32eafc7626e974616deaf0dc3ce63d7bcbed58a2731e84d06bc3cdf1b53c4228';

export interface TestKey {
  readonly privateJwk: JsonWebKey & { kid: string; alg: 'RS256' };
  readonly publicJwk: JsonWebKey & { kid: string; alg: 'RS256' };
}

async function exportJwk(key: CryptoKey): Promise<JsonWebKey> {
  const jwk = await crypto.subtle.exportKey('jwk', key);
  if (jwk instanceof ArrayBuffer) throw new Error('expected a JWK');
  return jwk;
}

export async function rsaKey(kid: string): Promise<TestKey> {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  );
  if (!('privateKey' in pair)) throw new Error('expected a key pair');
  return {
    privateJwk: { ...(await exportJwk(pair.privateKey)), kid, alg: 'RS256' },
    publicJwk: { ...(await exportJwk(pair.publicKey)), kid, alg: 'RS256' },
  };
}

/** A token shaped like the one Cloudflare Access sends; `claims` override or, with `undefined`, drop a claim. */
export function accessToken(key: TestKey, claims: Partial<Record<keyof JWTPayload, unknown>> = {}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: [AUD], iss: TEAM_DOMAIN, sub: 'user', email: 'denis@example.com', type: 'app', iat: now, nbf: now, exp: now + 600, ...claims };
  return sign(payload, key.privateJwk);
}

export const accessHeaders = (token: string) => ({ [ACCESS_JWT_HEADER]: token });

/** Serves the team's certs endpoint; any other URL fails the test. */
export function stubJwks(keys: readonly unknown[], teamDomain = TEAM_DOMAIN, status = 200) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
    const url = input instanceof Request ? input.url : String(input);
    if (url === certsUrl(teamDomain)) return json({ keys, public_cert: { kid: 'x', cert: 'x' } }, status);
    throw new Error(`unexpected fetch ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
