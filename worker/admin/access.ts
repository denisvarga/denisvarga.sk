import { verifyWithJwks } from 'hono/jwt';
import * as z from 'zod/mini';
import { logEvent } from '../ask/errors';

export const ACCESS_JWT_HEADER = 'Cf-Access-Jwt-Assertion';
export const JWKS_TTL_MS = 5 * 60_000;
const JWKS_TIMEOUT_MS = 3_000;

export interface AccessConfig {
  readonly teamDomain: string;
  readonly aud: string;
}

/** Null until both vars are set; the overview then answers 404 so it does not exist at all. */
export function accessConfig(env: Pick<CloudflareBindings, 'ACCESS_TEAM_DOMAIN' | 'ACCESS_AUD'>): AccessConfig | null {
  const teamDomain = env.ACCESS_TEAM_DOMAIN?.trim().replace(/\/+$/, '') ?? '';
  const aud = env.ACCESS_AUD?.trim() ?? '';
  if (!aud || !teamDomain.startsWith('https://')) return null;
  return { teamDomain, aud };
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

let cached: { readonly url: string; readonly keys: RsaKey[]; readonly expiresAt: number } | null = null;

// Failures are not cached, so the next request retries the fetch.
async function signingKeys(url: string, now: number): Promise<RsaKey[]> {
  if (cached && cached.url === url && cached.expiresAt > now) return cached.keys;
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
  cached = { url, keys, expiresAt: now + JWKS_TTL_MS };
  return keys;
}

/**
 * Defence in depth behind Cloudflare Access: RS256 signature against the team's keys, `iss`
 * equal to the team domain, `aud` containing the application tag and a valid `exp` and `nbf`.
 */
export async function verifyAccessJwt(token: string | undefined, config: AccessConfig): Promise<boolean> {
  if (!token) return false;
  let keys: RsaKey[];
  try {
    keys = await signingKeys(certsUrl(config.teamDomain), Date.now());
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
  if (typeof payload?.exp === 'number') return true;
  logEvent('access_denied', 403);
  return false;
}
