import { describe, expect, it, vi } from 'vitest';
import { ASK_ERROR_CODES, type AskRequest } from '../../shared/ask-contract';
import { ASK_ENDPOINT, postAsk } from './api-client';

const request: AskRequest = { messages: [{ role: 'user', content: 'Hi' }], lang: 'en', turnstileToken: 'tok' };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const stub = (response: Response | Error) =>
  vi.fn<typeof fetch>(() => (response instanceof Error ? Promise.reject(response) : Promise.resolve(response)));

describe('postAsk', () => {
  it('posts the request as JSON and returns the trimmed reply', async () => {
    const fetchImpl = stub(json({ reply: '  Hello there \n', kind: 'answer' }));
    await expect(postAsk(request, { fetchImpl })).resolves.toEqual({ ok: true, reply: 'Hello there' });
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe(ASK_ENDPOINT);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual(request);
  });

  it.each(ASK_ERROR_CODES)('maps the %s error code', async (code) => {
    const fetchImpl = stub(json({ error: code }, code === 'rate_limited' ? 429 : 503));
    await expect(postAsk(request, { fetchImpl })).resolves.toEqual({ ok: false, error: code });
  });

  it('rejects unknown codes, empty replies and replies on error statuses', async () => {
    for (const response of [json({ error: 'teapot' }, 418), json({ reply: '   ' }), json({ reply: 'x' }, 500), json([1])]) {
      await expect(postAsk(request, { fetchImpl: stub(response) })).resolves.toEqual({ ok: false, error: 'bad_response' });
    }
  });

  it('treats a non-JSON body as a bad response', async () => {
    const fetchImpl = stub(new Response('<html>blocked</html>', { status: 403 }));
    await expect(postAsk(request, { fetchImpl })).resolves.toEqual({ ok: false, error: 'bad_response' });
  });

  it('reports network failures', async () => {
    const fetchImpl = stub(new TypeError('Failed to fetch'));
    await expect(postAsk(request, { fetchImpl })).resolves.toEqual({ ok: false, error: 'network' });
  });

  it('aborts and reports a timeout when the server does not answer in time', async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        }),
    );
    await expect(postAsk(request, { fetchImpl, timeoutMs: 20 })).resolves.toEqual({ ok: false, error: 'timeout' });
  });

  it('honours an external abort signal', async () => {
    const controller = new AbortController();
    const fetchImpl = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        }),
    );
    const pending = postAsk(request, { fetchImpl, signal: controller.signal });
    controller.abort();
    await expect(pending).resolves.toEqual({ ok: false, error: 'network' });
  });

  it('combines the signals without AbortSignal.any (Safari before 17.4)', async () => {
    const original = AbortSignal.any;
    Reflect.deleteProperty(AbortSignal, 'any');
    try {
      const controller = new AbortController();
      const fetchImpl = vi.fn<typeof fetch>(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
          }),
      );
      const pending = postAsk(request, { fetchImpl, signal: controller.signal });
      controller.abort();
      await expect(pending).resolves.toEqual({ ok: false, error: 'network' });
    } finally {
      AbortSignal.any = original;
    }
  });
});
