import { describe, expect, it } from 'vitest';
import { isTurnstileConfigValid, verifyTurnstile } from './turnstile';

const REAL_SECRET = '0x4AAAAAAA-real-secret';
const TEST_SECRET = '1x0000000000000000000000000000000AA';
const HOSTS = 'denisvarga.sk, denisvarga.dev';

const siteverify = (body: unknown): typeof fetch => async () =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });

const verify = (hostname: string | undefined, reply: unknown) =>
  verifyTurnstile({
    secret: REAL_SECRET,
    hostname,
    action: 'ask',
    token: 't',
    remoteIp: null,
    timeoutMs: 1000,
    fetchImpl: siteverify(reply),
  });

describe('isTurnstileConfigValid', () => {
  it('needs at least one hostname for a real secret and none for a test secret', () => {
    expect(isTurnstileConfigValid({ secret: REAL_SECRET, hostname: HOSTS, action: 'ask' })).toBe(true);
    expect(isTurnstileConfigValid({ secret: REAL_SECRET, hostname: ' , ', action: 'ask' })).toBe(false);
    expect(isTurnstileConfigValid({ secret: REAL_SECRET, hostname: undefined, action: 'ask' })).toBe(false);
    expect(isTurnstileConfigValid({ secret: TEST_SECRET, hostname: '', action: '' })).toBe(true);
    expect(isTurnstileConfigValid({ secret: '', hostname: HOSTS, action: 'ask' })).toBe(false);
  });
});

describe('verifyTurnstile hostname allow list', () => {
  it('accepts a token minted on any listed hostname', async () => {
    expect(await verify(HOSTS, { success: true, hostname: 'denisvarga.sk', action: 'ask' })).toEqual({ ok: true });
    expect(await verify(HOSTS, { success: true, hostname: 'denisvarga.dev', action: 'ask' })).toEqual({ ok: true });
  });

  it('rejects unlisted, partial and missing hostnames', async () => {
    for (const hostname of ['evil.example', 'www.denisvarga.dev', 'denisvarga', '', undefined]) {
      expect(await verify(HOSTS, { success: true, hostname, action: 'ask' }), String(hostname)).toEqual({ ok: false, httpStatus: null });
    }
  });

  it('skips the hostname check only when the list is empty', async () => {
    expect(await verify('', { success: true, hostname: 'example.com', action: 'ask' })).toEqual({ ok: true });
  });
});
