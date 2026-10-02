import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { askBody, CLIENT_IP, json, makeEnv, openaiCompleted, send, stubFetch, turnstileOk } from '../test-support/ask-harness';

let logs: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  logs = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const expectError = async (res: Response, status: number, error: string) => {
  expect(res.status).toBe(status);
  expect(await res.json()).toEqual({ error });
};

describe('POST /api/ask rejections', () => {
  it('rejects a missing or foreign Origin and a non-JSON content type', async () => {
    const { env } = makeEnv();
    await expectError(await send({ env, body: askBody('Ahoj'), headers: { Origin: null } }), 403, 'forbidden_origin');
    await expectError(await send({ env, body: askBody('Ahoj'), headers: { Origin: 'https://evil.example' } }), 403, 'forbidden_origin');
    await expectError(await send({ env, body: askBody('Ahoj'), headers: { 'Content-Type': 'text/plain' } }), 403, 'forbidden_origin');
    await expectError(await send({ env: makeEnv({ ALLOWED_ORIGINS: '' }).env, body: askBody('Ahoj') }), 403, 'forbidden_origin');
  });

  it('rejects malformed JSON and schema violations', async () => {
    const { env } = makeEnv();
    await expectError(await send({ env, rawBody: '{"messages":' }), 400, 'invalid_input');
    await expectError(await send({ env, body: askBody('x'.repeat(501)) }), 400, 'invalid_input');
    await expectError(await send({ env, body: askBody('Ahoj', { lang: 'de' }) }), 400, 'invalid_input');
  });

  it('rate limits the sixth request per client key within the window', async () => {
    const { env } = makeEnv();
    for (let i = 0; i < 5; i++) expect((await send({ env, body: askBody('help') })).status).toBe(200);
    await expectError(await send({ env, body: askBody('help') }), 429, 'rate_limited');
    expect((await send({ env, body: askBody('help'), headers: { 'CF-Connecting-IP': '198.51.100.1' } })).status).toBe(200);
  });

  it('works without the limiter binding', async () => {
    const { env } = makeEnv({ ASK_LIMITER: undefined });
    for (let i = 0; i < 7; i++) expect((await send({ env, body: askBody('whoami') })).status).toBe(200);
  });
});

describe('easter eggs', () => {
  it('answer without Turnstile, D1 or the model and log nothing', async () => {
    const fetchMock = stubFetch({});
    const { env, db } = makeEnv();
    const res = await send({ env, body: askBody('  Sudo HIRE denis! ', { lang: 'en' }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ reply: expect.stringContaining('Access granted.'), kind: 'easter_egg' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(db.writes).toBe(0);
    expect(logs).not.toHaveBeenCalled();
  });
});

describe('Turnstile', () => {
  it('rejects a test-key token (action test) under production config', async () => {
    stubFetch({ siteverify: () => json({ success: true, hostname: 'denisvarga.sk', action: 'test' }) });
    const { env, db } = makeEnv();
    await expectError(await send({ env, body: askBody('Kto je Denis?') }), 403, 'verification_failed');
    expect(db.writes).toBe(0);
  });

  it('rejects a failed token and a hostname mismatch', async () => {
    const { env } = makeEnv();
    stubFetch({ siteverify: () => json({ success: false, 'error-codes': ['invalid-input-response'] }) });
    await expectError(await send({ env, body: askBody('Kto je Denis?') }), 403, 'verification_failed');
    stubFetch({ siteverify: () => json({ success: true, hostname: 'evil.example', action: 'ask' }) });
    await expectError(await send({ env, body: askBody('Kto je Denis?') }), 403, 'verification_failed');
  });

  it('fails closed with 503 when the hostname is empty and the secret is real', async () => {
    const fetchMock = stubFetch({});
    const { env } = makeEnv({ TURNSTILE_HOSTNAME: '' });
    await expectError(await send({ env, body: askBody('Kto je Denis?') }), 503, 'unavailable');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts an empty hostname and action with the dummy test secret', async () => {
    stubFetch({ siteverify: () => json({ success: true, hostname: 'example.com', action: 'test' }), openai: () => openaiCompleted() });
    const { env } = makeEnv({ TURNSTILE_HOSTNAME: '', TURNSTILE_ACTION: '', TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA' });
    expect((await send({ env, body: askBody('Kto je Denis?') })).status).toBe(200);
  });

  it('maps a siteverify network error to verification_failed and logs a fixed code', async () => {
    stubFetch({ siteverify: () => Promise.reject(new Error('down')) });
    const { env } = makeEnv();
    await expectError(await send({ env, body: askBody('Kto je Denis?') }), 403, 'verification_failed');
    expect(logs).toHaveBeenCalledWith({ event: 'turnstile_error', status: 0 });
  });

  it('returns 503 before siteverify when the OpenAI key is missing', async () => {
    const fetchMock = stubFetch({});
    const { env, db } = makeEnv({ OPENAI_API_KEY: '' });
    await expectError(await send({ env, body: askBody('Kto je Denis?') }), 503, 'unavailable');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(db.writes).toBe(0);
  });
});

describe('daily cap reservation', () => {
  it('marks the reserved row capped and returns 429 over the cap', async () => {
    const fetchMock = stubFetch({ siteverify: turnstileOk });
    const { env, db } = makeEnv({ DAILY_CAP: '1' });
    db.seed({ created_at: Date.now(), outcome: 'ok' });
    await expectError(await send({ env, body: askBody('Kto je Denis?') }), 429, 'daily_cap');
    expect(db.rows.at(-1)).toMatchObject({ outcome: 'capped', answer: null, model: null });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(logs).toHaveBeenCalledWith({ event: 'cap_reached', status: 429 });
  });

  it('excludes quota and capped rows and earlier days from the count', async () => {
    stubFetch({ siteverify: turnstileOk, openai: () => openaiCompleted() });
    const { env, db } = makeEnv({ DAILY_CAP: '1' });
    db.seed({ created_at: Date.now(), outcome: 'unavailable_quota' });
    db.seed({ created_at: Date.now(), outcome: 'capped' });
    db.seed({ created_at: Date.now() - 2 * 86_400_000, outcome: 'ok' });
    expect((await send({ env, body: askBody('Kto je Denis?') })).status).toBe(200);
  });

  it('fails closed with 503 on a D1 error', async () => {
    stubFetch({ siteverify: turnstileOk });
    const { env, db } = makeEnv();
    db.fail = true;
    await expectError(await send({ env, body: askBody('Kto je Denis?') }), 503, 'unavailable');
    expect(logs).toHaveBeenCalledWith({ event: 'd1_error', status: 503 });
  });
});

describe('model call', () => {
  it('answers and logs one ok row without identifiers', async () => {
    const fetchMock = stubFetch({ siteverify: turnstileOk, openai: () => openaiCompleted('Denis robí WordPress na mieru.') });
    const { env, db } = makeEnv();
    const res = await send({ env, body: askBody('Čo robí Denis?', { lang: 'sk' }) });
    expect(await res.json()).toEqual({ reply: 'Denis robí WordPress na mieru.', kind: 'answer' });
    expect(db.rows).toHaveLength(1);
    expect(db.rows[0]).toMatchObject({ lang: 'sk', question: 'Čo robí Denis?', answer: 'Denis robí WordPress na mieru.', model: 'gpt-6-luna-2026-05-18', input_tokens: 1200, output_tokens: 40, outcome: 'ok' });
    expect(JSON.stringify(db.rows)).not.toContain(CLIENT_IP);

    const openaiInit = fetchMock.mock.calls[1]?.[1];
    const sent = JSON.parse(String(openaiInit?.body)) as Record<string, unknown>;
    expect(sent).toMatchObject({ store: false, max_output_tokens: 400, prompt_cache_key: 'cv-chat-v1', reasoning: { effort: 'none' } });
    expect(sent.safety_identifier).toMatch(/^[0-9a-f]{64}$/);
    expect(String(openaiInit?.body)).not.toContain(CLIENT_IP);
  });

  it('serves a truncated answer and records truncated', async () => {
    stubFetch({
      siteverify: turnstileOk,
      openai: () => json({ status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, output: [{ type: 'message', content: [{ type: 'output_text', text: 'Jedna. Dve nedoko' }] }] }),
    });
    const { env, db } = makeEnv();
    expect(await (await send({ env, body: askBody('Opíš všetko') })).json()).toEqual({ reply: 'Jedna.', kind: 'answer' });
    expect(db.rows[0]?.outcome).toBe('truncated');
  });

  it.each([
    ['quota', () => json({ error: { code: 'project_spend_limit_exceeded', message: 'secret' } }, 429), 'unavailable_quota', 'openai_quota'],
    ['refusal', () => json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'secret' }] }] }), 'refused', null],
    ['server error', () => json({ error: { code: 'server_error', message: 'secret' } }, 500), 'error', 'openai_error'],
  ])('maps %s to 502 upstream_unavailable', async (_name, openai, outcome, event) => {
    stubFetch({ siteverify: turnstileOk, openai });
    const { env, db } = makeEnv();
    const res = await send({ env, body: askBody('Kto je Denis?') });
    await expectError(res, 502, 'upstream_unavailable');
    expect(db.rows[0]).toMatchObject({ outcome, answer: null, model: 'gpt-6-luna' });
    if (event) expect(logs).toHaveBeenCalledWith({ event, status: expect.any(Number) });
    expect(JSON.stringify(logs.mock.calls)).not.toContain('secret');
  });
});
