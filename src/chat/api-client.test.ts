import { describe, expect, it, vi } from 'vitest';
import { ASK_ERROR_CODES, type AskRequest } from '../../shared/ask-contract';
import { CONTACT_ERROR_CODES, type ContactRequest } from '../../shared/contact-contract';
import { ASK_ENDPOINT, CONTACT_ENDPOINT, postAsk, postContact } from './api-client';

const request: AskRequest = { messages: [{ role: 'user', content: 'Hi' }], lang: 'en', turnstileToken: 'tok' };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const stub = (response: Response | Error) =>
  vi.fn<typeof fetch>(() => (response instanceof Error ? Promise.reject(response) : Promise.resolve(response)));

describe('postAsk', () => {
  it('posts the request as JSON and returns the trimmed reply with its signature', async () => {
    const fetchImpl = stub(json({ reply: '  Hello there \n', kind: 'answer', sig: 'sig-1' }));
    await expect(postAsk(request, { fetchImpl })).resolves.toEqual({ ok: true, reply: 'Hello there', sig: 'sig-1' });
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe(ASK_ENDPOINT);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual(request);
  });

  it('keeps a reply whose signature is missing or not a non-empty string, unsigned', async () => {
    for (const sig of [undefined, '', 42, null, { v: 1 }]) {
      const outcome = await postAsk(request, { fetchImpl: stub(json({ reply: 'Hi', kind: 'answer', sig })) });
      expect(outcome).toStrictEqual({ ok: true, reply: 'Hi' });
    }
  });

  it('returns the draft of a handoff reply, and the plain reply when the draft is malformed', async () => {
    const draft = { message: ' I need a shop. ', name: null, email: 'jana@firma.sk' };
    const outcome = await postAsk(request, { fetchImpl: stub(json({ reply: 'Draft message for Denis:\n\nI need a shop.', kind: 'handoff_draft', sig: 's', draft })) });
    expect(outcome).toEqual({ ok: true, reply: 'Draft message for Denis:\n\nI need a shop.', sig: 's', draft: { ...draft, message: 'I need a shop.' } });
    for (const bad of [null, { message: '' }, { message: 'x', name: 1, email: null }, { message: 'x', name: null }]) {
      const plain = await postAsk(request, { fetchImpl: stub(json({ reply: 'Text', kind: 'handoff_draft', sig: 's', draft: bad })) });
      expect(plain).toStrictEqual({ ok: true, reply: 'Text', sig: 's' });
    }
    const notDraft = await postAsk(request, { fetchImpl: stub(json({ reply: 'Text', kind: 'answer', sig: 's', draft })) });
    expect(notDraft).toStrictEqual({ ok: true, reply: 'Text', sig: 's' });
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

describe('postContact', () => {
  const contact: ContactRequest = {
    lang: 'sk',
    turnstileToken: 'tok',
    name: 'Jana',
    email: 'jana@firma.sk',
    message: 'Potrebujem e-shop.',
    messages: [{ role: 'user', content: 'Áno.' }],
  };

  it('posts the request as JSON to the contact endpoint and returns the signed confirmation', async () => {
    const fetchImpl = stub(json({ reply: ' Správa odoslaná. ', sig: 'sig-2' }));
    await expect(postContact(contact, { fetchImpl })).resolves.toEqual({ ok: true, reply: 'Správa odoslaná.', sig: 'sig-2' });
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe(CONTACT_ENDPOINT);
    expect(JSON.parse(String(init?.body))).toEqual(contact);
  });

  it.each(CONTACT_ERROR_CODES)('maps the %s error code', async (code) => {
    await expect(postContact(contact, { fetchImpl: stub(json({ error: code }, 503)) })).resolves.toEqual({ ok: false, error: code });
  });

  it('never throws and treats an unsigned or odd body as a bad response', async () => {
    for (const response of [json({ reply: 'Odoslané.' }), json({ error: 'upstream_unavailable' }, 502), json('x'), new Response('nope', { status: 403 })]) {
      await expect(postContact(contact, { fetchImpl: stub(response) })).resolves.toEqual({ ok: false, error: 'bad_response' });
    }
    await expect(postContact(contact, { fetchImpl: stub(new TypeError('offline')) })).resolves.toEqual({ ok: false, error: 'network' });
  });
});
