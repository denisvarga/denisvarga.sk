import { sign } from 'hono/jwt';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { JWKS_TTL_MS } from '../admin/access';
import { accessHeaders, accessToken, AUD, rsaKey, stubJwks, TEAM_DOMAIN, type TestKey } from '../test-support/access-token';
import { makeEnv, send } from '../test-support/ask-harness';

let key: TestKey;
let logs: ReturnType<typeof vi.spyOn>;
beforeAll(async () => {
  key = await rsaKey('kid-1');
});
beforeEach(() => {
  logs = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const configured = (overrides: Parameters<typeof makeEnv>[0] = {}) => makeEnv({ ACCESS_AUD: AUD, ...overrides }).env;

const get = (env: ReturnType<typeof configured>, token?: string, path = '/prehlad') =>
  send({ env, path, method: 'GET', headers: token === undefined ? {} : accessHeaders(token) });

// JWKS tests use their own team domain each, so the module cache from earlier tests cannot answer.
const team = (name: string) => `https://${name}.cloudflareaccess.com`;
const tokenFor = (domain: string) => accessToken(key, { iss: domain });

async function expectForbidden(res: Response) {
  expect(res.status).toBe(403);
  expect(await res.text()).toBe('Forbidden');
}

describe('overview without Access config', () => {
  it('answers 404 on both routes while the AUD or the team domain is empty', async () => {
    const fetchMock = stubJwks([key.publicJwk]);
    const token = await accessToken(key);
    for (const env of [makeEnv().env, configured({ ACCESS_TEAM_DOMAIN: '' }), configured({ ACCESS_AUD: '  ' })]) {
      for (const path of ['/prehlad', '/prehlad/export.csv']) {
        const res = await get(env, token, path);
        expect(res.status).toBe(404);
        expect(res.headers.get('Cache-Control')).toBe('no-store');
      }
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('treats a team domain without https as unconfigured', async () => {
    stubJwks([key.publicJwk]);
    expect((await get(configured({ ACCESS_TEAM_DOMAIN: 'http://denva.cloudflareaccess.com' }), await accessToken(key))).status).toBe(404);
  });
});

describe('overview Access JWT', () => {
  beforeEach(() => void stubJwks([key.publicJwk]));

  it('accepts a valid token on both routes', async () => {
    const token = await accessToken(key);
    expect((await get(configured(), token)).status).toBe(200);
    expect((await get(configured(), token, '/prehlad/export.csv')).status).toBe(200);
    expect(logs).not.toHaveBeenCalled();
  });

  it('accepts a trailing slash on the configured team domain', async () => {
    expect((await get(configured({ ACCESS_TEAM_DOMAIN: `${TEAM_DOMAIN}/` }), await accessToken(key))).status).toBe(200);
  });

  it('rejects a missing or malformed token', async () => {
    await expectForbidden(await get(configured()));
    await expectForbidden(await get(configured(), ''));
    await expectForbidden(await get(configured(), 'not.a.jwt'));
    await expectForbidden(await get(configured(), `Bearer ${await accessToken(key)}`));
  });

  it('rejects a wrong audience, a wrong issuer and a missing audience', async () => {
    await expectForbidden(await get(configured(), await accessToken(key, { aud: ['another-app'] })));
    await expectForbidden(await get(configured(), await accessToken(key, { aud: undefined })));
    await expectForbidden(await get(configured(), await accessToken(key, { iss: 'https://evil.cloudflareaccess.com' })));
    await expectForbidden(await get(configured(), await accessToken(key, { iss: `${TEAM_DOMAIN}/` })));
    expect(logs).toHaveBeenCalledWith({ event: 'access_denied', status: 403 });
  });

  it('rejects an expired token, a token without exp and one not valid yet', async () => {
    const now = Math.floor(Date.now() / 1000);
    await expectForbidden(await get(configured(), await accessToken(key, { iat: now - 700, nbf: now - 700, exp: now - 100 })));
    await expectForbidden(await get(configured(), await accessToken(key, { exp: undefined })));
    await expectForbidden(await get(configured(), await accessToken(key, { nbf: now + 300 })));
  });

  it('rejects a signature from another key with the same kid', async () => {
    const forger = await rsaKey('kid-1');
    await expectForbidden(await get(configured(), await accessToken(forger)));
  });

  it('rejects an unknown kid and symmetric algorithms', async () => {
    const stranger = await rsaKey('kid-unknown');
    await expectForbidden(await get(configured(), await accessToken(stranger)));
    const now = Math.floor(Date.now() / 1000);
    const hs256 = await sign({ aud: [AUD], iss: TEAM_DOMAIN, exp: now + 600 }, 'secret', 'HS256');
    await expectForbidden(await get(configured(), hs256));
  });
});

describe('overview JWKS', () => {
  it('caches the keys for a short time and fetches them again afterwards', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const domain = team('cache');
    const fetchMock = stubJwks([key.publicJwk], domain);
    const env = configured({ ACCESS_TEAM_DOMAIN: domain });
    expect((await get(env, await tokenFor(domain))).status).toBe(200);
    expect((await get(env, await tokenFor(domain))).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.setSystemTime(Date.now() + JWKS_TTL_MS + 1);
    expect((await get(env, await tokenFor(domain))).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('fails closed when the certs endpoint errors, and retries on the next request', async () => {
    const domain = team('down');
    const env = configured({ ACCESS_TEAM_DOMAIN: domain });
    stubJwks([key.publicJwk], domain, 500);
    await expectForbidden(await get(env, await tokenFor(domain)));
    expect(logs).toHaveBeenCalledWith({ event: 'access_jwks_error', status: 403 });
    stubJwks([key.publicJwk], domain);
    expect((await get(env, await tokenFor(domain))).status).toBe(200);
  });

  it('fails closed on a JWKS without usable RSA keys', async () => {
    const domain = team('empty');
    stubJwks([{ kty: 'EC', kid: 'kid-1', crv: 'P-256', x: 'x', y: 'y' }], domain);
    await expectForbidden(await get(configured({ ACCESS_TEAM_DOMAIN: domain }), await tokenFor(domain)));
  });
});
