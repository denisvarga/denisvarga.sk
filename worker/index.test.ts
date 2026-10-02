import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { askBody, fakeLimiter, makeEnv, send } from './test-support/ask-harness';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());

function expectApiHeaders(res: Response) {
  expect(res.headers.get('Strict-Transport-Security')).toBeNull();
  expect(res.headers.get('X-Frame-Options')).toBe('DENY');
  expect(res.headers.get('Cache-Control')).toBe('no-store');
  expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  expect(res.headers.get('Content-Security-Policy')).toBe("default-src 'none'; frame-ancestors 'none'");
  expect(res.headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin');
  expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  expect(res.headers.get('Permissions-Policy')).toContain('camera=()');
}

describe('worker app', () => {
  it('sets API security headers on success, client errors and 404s', async () => {
    const { env } = makeEnv();
    expectApiHeaders(await send({ env, body: askBody('help') }));
    expectApiHeaders(await send({ env, body: askBody('help'), headers: { Origin: null } }));
    expectApiHeaders(await send({ env, path: '/api/nope', method: 'GET' }));
  });

  it('returns JSON 404 for unknown API paths, the removed health route and GET /api/ask', async () => {
    const { env } = makeEnv();
    for (const path of ['/api/nope', '/api/health', '/api/ask']) {
      const res = await send({ env, path, method: 'GET' });
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'not_found' });
    }
  });

  it('rejects bodies over 48 KB with 413 invalid_input', async () => {
    const { env } = makeEnv();
    const res = await send({ env, rawBody: JSON.stringify(askBody('x'.repeat(49 * 1024))) });
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: 'invalid_input' });
    expectApiHeaders(res);
  });

  it('maps unexpected exceptions to 500 internal without details', async () => {
    const limiter = fakeLimiter();
    vi.spyOn(limiter, 'limit').mockRejectedValue(new Error('binding exploded'));
    const { env } = makeEnv({ ASK_LIMITER: limiter });
    const res = await send({ env, body: askBody('help') });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'internal' });
    expectApiHeaders(res);
    expect(console.error).toHaveBeenCalledWith({ event: 'internal_error', status: 500 });
  });
});
