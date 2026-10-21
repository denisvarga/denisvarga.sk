import { decode, verifyWithJwks } from 'hono/jwt';
import * as z from 'zod/mini';
import { parseEnvList } from '../ask/env-list';
import { logEvent } from '../ask/errors';

export const ACCESS_JWT_HEADER = 'Cf-Access-Jwt-Assertion';
export const JWKS_TTL_MS = 5 * 60_000;
/** Cached keys at least this old are fetched again when a token names a kid they lack. */
export const JWKS_REFETCH_AFTER_MS = 30_000;
const JWKS_TIMEOUT_MS = 3_000;

export interface AccessConfig {
  readonly teamDomain: string;
  readonly aud: string;
  /** Lowercased; empty admits every identity the Access policy lets through. */
  readonly allowedEmails: readonly string[];
}

type AccessEnv = Pick<CloudflareBindings, 'ACCESS_TEAM_DOMAIN' | 'ACCESS_AUD' | 'ACCESS_ALLOWED_EMAILS'>;

/** Null until the team domain and the AUD are set; the overview then answers 404 so it does not exist at all. */
export function accessConfig(env: AccessEnv): AccessConfig | null {
  const teamDomain = env.ACCESS_TEAM_DOMAIN?.trim().replace(/\/+$/, '') ?? '';
  const aud = env.ACCESS_AUD?.trim() ?? '';
  if (!aud || !teamDomain.startsWith('https://')) return null;
  return { teamDomain, aud, allowedEmails: parseEnvList(env.ACCESS_ALLOWED_EMAILS).map((email) => email.toLowerCase()) };
}

export const certsUrl = (teamDomain: string): string => `${teamDomain}/cdn-cgi/access/certs`;

const jwksSchema = z.object({ keys: z.array(z.unknown()) });
const rsaKeySchema = z.object({
  kid: z.string(),
  kty: z.literal('RSA'),
  n: z.string(),
  e: z.string(),
  alg: z.optional(z.literal('RS256')),
});
type RsaKey = z.output<typeof rsaKeySchema>;

let cached: { readonly url: string; readonly keys: RsaKey[]; readonly fetchedAt: number } | null = null;

// Failures are not cached, so the next request retries the fetch.
async function fetchKeys(url: string, now: number): Promise<RsaKey[]> {
  const res = await fetch(url, { signal: AbortSignal.timeout(JWKS_TIMEOUT_MS) });
  if (!res.ok) throw new Error('jwks unavailable');
  const parsed = jwksSchema.safeParse(await res.json());
  if (!parsed.success) throw new Error('jwks malformed');
  // Keys of another type are skipped so a future EC key cannot break verification with the RSA ones.
  const keys = parsed.data.keys.flatMap((key) => {
    const rsa = rsaKeySchema.safeParse(key);
    return rsa.success ? [rsa.data] : [];
  });
  if (keys.length === 0) throw new Error('jwks empty');
  cached = { url, keys, fetchedAt: now };
  return keys;
}

// An unknown kid usually means Cloudflare rotated its signing key. The age floor keeps tokens with
// made-up kids from turning every request into a fetch.
async function signingKeys(url: string, kid: string | null, now: number): Promise<RsaKey[]> {
  const entry = cached;
  if (!entry || entry.url !== url || now - entry.fetchedAt >= JWKS_TTL_MS) return fetchKeys(url, now);
  const knowsKid = kid === null || entry.keys.some((key) => key.kid === kid);
  if (!knowsKid && now - entry.fetchedAt >= JWKS_REFETCH_AFTER_MS) return fetchKeys(url, now);
  return entry.keys;
}

function tokenKid(token: string): string | null {
  try {
    // The header is untrusted JSON whatever its declared type says.
    const { kid } = decode(token).header;
    return typeof kid === 'string' ? kid : null;
  } catch {
    return null;
  }
}

/**
 * Defence in depth behind Cloudflare Access: RS256 signature against the team's keys, `iss`
 * equal to the team domain, `aud` containing the application tag, a valid `exp` and `nbf`, and,
 * when an allow list is set, an `email` on it.
 */
export async function verifyAccessJwt(token: string | undefined, config: AccessConfig): Promise<boolean> {
  if (!token) return false;
  let keys: RsaKey[];
  try {
    keys = await signingKeys(certsUrl(config.teamDomain), tokenKid(token), Date.now());
  } catch {
    logEvent('access_jwks_error', 403);
    return false;
  }
  const payload = await verifyWithJwks(token, {
    keys,
    allowedAlgorithms: ['RS256'],
    verification: { iss: config.teamDomain, aud: config.aud },
  }).catch(() => null);
  // Hono checks `exp` only when present; a token without one would never expire.
  if (typeof payload?.exp === 'number' && isAllowedEmail(payload.email, config.allowedEmails)) return true;
  logEvent('access_denied', 403);
  return false;
}

function isAllowedEmail(email: unknown, allowed: readonly string[]): boolean {
  if (allowed.length === 0) return true;
  return typeof email === 'string' && allowed.includes(email.trim().toLowerCase());
}
