import { vi } from 'vitest';
import { OPENAI_URL } from '../ask/openai';
import { SITEVERIFY_URL } from '../ask/turnstile';
import app from '../index';
import type { AskEnv } from '../routes/ask';
import { FakeD1 } from './fake-d1';

export const ORIGIN = 'https://denisvarga.sk';
export const CLIENT_IP = '203.0.113.7';

export function fakeLimiter(limit = 5): RateLimit {
  const hits = new Map<string, number>();
  return {
    limit: async ({ key }) => {
      const n = (hits.get(key) ?? 0) + 1;
      hits.set(key, n);
      return { success: n <= limit };
    },
  };
}

export function makeEnv(overrides: Partial<AskEnv> = {}): { env: AskEnv; db: FakeD1 } {
  const db = new FakeD1();
  const env: AskEnv = {
    DB: db.asBinding(),
    ASK_LIMITER: fakeLimiter(),
    OPENAI_MODEL: 'gpt-6-luna',
    OPENAI_REASONING_EFFORT: 'none',
    DAILY_CAP: '300',
    ALLOWED_ORIGINS: ORIGIN,
    TURNSTILE_HOSTNAME: 'denisvarga.sk',
    TURNSTILE_ACTION: 'ask',
    OPENAI_API_KEY: 'sk-test',
    TURNSTILE_SECRET_KEY: '0x4AAAAAAA-real-secret',
    SAFETY_SALT: 'salt',
    ...overrides,
  };
  return { env, db };
}

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

export const turnstileOk = (): Response => json({ success: true, hostname: 'denisvarga.sk', action: 'ask' });

export const openaiCompleted = (text = 'Denis robí WordPress na mieru.'): Response =>
  json({
    status: 'completed',
    model: 'gpt-6-luna-2026-05-18',
    output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text }] }],
    usage: { input_tokens: 1200, output_tokens: 40 },
  });

interface Upstream {
  readonly siteverify?: () => Response | Promise<Response>;
  readonly openai?: () => Response | Promise<Response>;
}

export function stubFetch(upstream: Upstream) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
    const url = input instanceof Request ? input.url : String(input);
    if (url === SITEVERIFY_URL && upstream.siteverify) return upstream.siteverify();
    if (url === OPENAI_URL && upstream.openai) return upstream.openai();
    throw new Error(`unexpected fetch ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export const askBody = (content: string, extra: Record<string, unknown> = {}) => ({
  messages: [{ role: 'user', content }],
  lang: 'sk',
  turnstileToken: 'token',
  ...extra,
});

interface AskCall {
  readonly env: AskEnv;
  readonly body?: unknown;
  readonly rawBody?: string;
  /** `null` removes a default header. */
  readonly headers?: Record<string, string | null>;
  readonly path?: string;
  readonly method?: string;
}

/** Sends a request through the full app and waits for `waitUntil` work so D1 assertions see final rows. */
export async function send({ env, body, rawBody, headers = {}, path = '/api/ask', method = 'POST' }: AskCall) {
  const pending: Promise<unknown>[] = [];
  const ctx = {
    waitUntil: (p: Promise<unknown>) => void pending.push(p),
    passThroughOnException: () => undefined,
    props: {},
  } as unknown as ExecutionContext;
  const merged = new Headers({ Origin: ORIGIN, 'Content-Type': 'application/json', 'CF-Connecting-IP': CLIENT_IP });
  for (const [name, value] of Object.entries(headers)) {
    if (value === null) merged.delete(name);
    else merged.set(name, value);
  }
  const init: RequestInit = { method, headers: merged };
  if (method !== 'GET') init.body = rawBody ?? JSON.stringify(body);
  const res = await app.request(path, init, env, ctx);
  await Promise.all(pending);
  return res;
}
