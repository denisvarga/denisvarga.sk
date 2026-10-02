import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildRequestBody, callOpenAI, type OpenAIRequest, parseResponse, retryDelayMs, trimToLastSentence } from './openai';

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

const message = (...content: unknown[]) => [{ type: 'reasoning', summary: [] }, { type: 'message', role: 'assistant', content }];
const completed = (text: string) =>
  json({ status: 'completed', model: 'gpt-6-luna-2026-05-18', output: message({ type: 'output_text', text }), usage: { input_tokens: 900, output_tokens: 30 } });
const apiError = (status: number, code: string, headers: Record<string, string> = {}) =>
  json({ error: { message: `upstream secret detail ${code}`, type: 'requests', code } }, status, headers);

function request(fetchImpl: typeof fetch, overrides: Partial<OpenAIRequest> = {}): OpenAIRequest {
  return {
    apiKey: 'sk-test',
    model: 'gpt-6-luna',
    effort: 'none',
    instructions: 'INSTRUCTIONS',
    messages: [{ role: 'user', content: 'Ahoj' }],
    safetyIdentifier: 'a'.repeat(64),
    deadline: Date.now() + 20_000,
    fetchImpl,
    sleep: async () => undefined,
    ...overrides,
  };
}

afterEach(() => vi.restoreAllMocks());

describe('buildRequestBody', () => {
  it('sends the hardened request shape', () => {
    const body = buildRequestBody(request(fetch, { effort: 'bogus' }));
    expect(body).toEqual({
      model: 'gpt-6-luna',
      instructions: 'INSTRUCTIONS',
      input: [{ role: 'user', content: 'Ahoj' }],
      store: false,
      max_output_tokens: 400,
      reasoning: { effort: 'none' },
      prompt_cache_key: 'cv-chat-v1',
      safety_identifier: 'a'.repeat(64),
    });
    expect(buildRequestBody(request(fetch, { effort: 'low' }))).toMatchObject({ reasoning: { effort: 'low' } });
  });
});

describe('parseResponse', () => {
  it('concatenates output_text parts of a completed response', () => {
    const r = parseResponse(
      { status: 'completed', output: message({ type: 'output_text', text: 'Ahoj. ' }, { type: 'output_text', text: 'Ako?' }), usage: { input_tokens: 5, output_tokens: 2 } },
      'gpt-6-luna',
    );
    expect(r).toMatchObject({ outcome: 'ok', text: 'Ahoj. Ako?', model: 'gpt-6-luna', inputTokens: 5, outputTokens: 2 });
  });

  it('strips control characters from the answer, keeping newlines and tabs', () => {
    const r = parseResponse(
      { status: 'completed', output: message({ type: 'output_text', text: '\u001b[2JAhoj\r\n\tsvet\u0007 ' }) },
      'm',
    );
    expect(r).toMatchObject({ outcome: 'ok', text: '[2JAhoj\n\tsvet' });
  });

  it('trims an answer cut by max_output_tokens to the last full sentence', () => {
    const r = parseResponse(
      { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, output: message({ type: 'output_text', text: 'Prvá veta. Druhá veta! Tretia ne' }) },
      'm',
    );
    expect(r).toMatchObject({ outcome: 'truncated', text: 'Prvá veta. Druhá veta!' });
  });

  it('maps refusals and content filtering to refused without text', () => {
    expect(parseResponse({ status: 'completed', output: message({ type: 'refusal', refusal: 'No.' }) }, 'm')).toMatchObject({ outcome: 'refused', text: null });
    expect(
      parseResponse({ status: 'incomplete', incomplete_details: { reason: 'content_filter' }, output: message({ type: 'output_text', text: 'Hm.' }) }, 'm'),
    ).toMatchObject({ outcome: 'refused', text: null });
  });

  it('maps empty text, failed status and malformed payloads to error', () => {
    expect(parseResponse({ status: 'completed', output: message({ type: 'output_text', text: '  ' }) }, 'm').outcome).toBe('error');
    expect(parseResponse({ status: 'failed', output: [] }, 'm').outcome).toBe('error');
    expect(parseResponse('nonsense', 'm').outcome).toBe('error');
  });
});

describe('trimToLastSentence', () => {
  it('keeps closing quotes and falls back to an ellipsis', () => {
    expect(trimToLastSentence('Povedal „áno.“ A potom')).toBe('Povedal „áno.“');
    expect(trimToLastSentence('bez konca vety')).toBe('bez konca vety...');
  });
});

describe('retryDelayMs', () => {
  it('retries only 503 or a temporary 429 within 2 s', () => {
    expect(retryDelayMs(503, null)).toBe(0);
    expect(retryDelayMs(503, '1')).toBe(1000);
    expect(retryDelayMs(429, '2')).toBe(2000);
    expect(retryDelayMs(429, '3')).toBeNull();
    expect(retryDelayMs(429, null)).toBeNull();
    expect(retryDelayMs(429, 'Wed, 21 Oct 2026 07:28:00 GMT')).toBeNull();
    expect(retryDelayMs(500, '0')).toBeNull();
  });
});

describe('callOpenAI', () => {
  it('returns the answer and posts to the Responses API with the key', async () => {
    const fetchImpl = vi.fn(async () => completed('Denis robí WordPress.'));
    const r = await callOpenAI(request(fetchImpl));
    expect(r).toMatchObject({ outcome: 'ok', text: 'Denis robí WordPress.', model: 'gpt-6-luna-2026-05-18', inputTokens: 900 });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.openai.com/v1/responses');
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer sk-test');
  });

  it('maps spend and quota errors to unavailable_quota without retrying', async () => {
    for (const code of ['project_spend_limit_exceeded', 'organization_spend_limit_exceeded', 'insufficient_quota', 'credit_balance_exhausted']) {
      const fetchImpl = vi.fn(async () => apiError(429, code, { 'Retry-After': '1' }));
      const r = await callOpenAI(request(fetchImpl));
      expect(r.outcome).toBe('unavailable_quota');
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    }
  });

  it('retries exactly once on 503 and on a short 429', async () => {
    const after503 = vi.fn().mockResolvedValueOnce(apiError(503, 'server_is_overloaded')).mockResolvedValueOnce(completed('OK.'));
    expect((await callOpenAI(request(after503))).outcome).toBe('ok');
    expect(after503).toHaveBeenCalledTimes(2);

    const twice503 = vi.fn(async () => apiError(503, 'server_is_overloaded'));
    expect(await callOpenAI(request(twice503))).toMatchObject({ outcome: 'error', httpStatus: 503 });
    expect(twice503).toHaveBeenCalledTimes(2);

    const sleep = vi.fn(async () => undefined);
    const short429 = vi.fn().mockResolvedValueOnce(apiError(429, 'rate_limit_exceeded', { 'Retry-After': '2' })).mockResolvedValueOnce(completed('OK.'));
    expect((await callOpenAI(request(short429, { sleep }))).outcome).toBe('ok');
    expect(sleep).toHaveBeenCalledWith(2000);
  });

  it('does not retry a long 429, other statuses, or when the budget is too small', async () => {
    const long429 = vi.fn(async () => apiError(429, 'rate_limit_exceeded', { 'Retry-After': '5' }));
    expect((await callOpenAI(request(long429))).outcome).toBe('error');
    expect(long429).toHaveBeenCalledTimes(1);

    const server500 = vi.fn(async () => apiError(500, 'server_error'));
    await callOpenAI(request(server500));
    expect(server500).toHaveBeenCalledTimes(1);

    const tight = vi.fn(async () => apiError(503, 'server_is_overloaded'));
    await callOpenAI(request(tight, { deadline: Date.now() + 500 }));
    expect(tight).toHaveBeenCalledTimes(1);
  });

  it('times out at the deadline and never calls past it', async () => {
    const hanging = vi.fn(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))),
    );
    expect(await callOpenAI(request(hanging, { deadline: Date.now() + 50 }))).toMatchObject({ outcome: 'error', httpStatus: 0 });

    const never = vi.fn(async () => completed('x.'));
    expect((await callOpenAI(request(never, { deadline: Date.now() - 1 }))).outcome).toBe('error');
    expect(never).not.toHaveBeenCalled();
  });

  it('never exposes upstream error text', async () => {
    const r = await callOpenAI(request(vi.fn(async () => apiError(400, 'invalid_request_error'))));
    expect(JSON.stringify(r)).not.toContain('upstream secret detail');
    expect(r).toMatchObject({ outcome: 'error', text: null, httpStatus: 400 });
  });
});
