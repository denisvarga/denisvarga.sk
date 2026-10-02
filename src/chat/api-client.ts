import { ASK_ERROR_CODES, type AskErrorCode, type AskRequest } from '../../shared/ask-contract';

export const ASK_ENDPOINT = '/api/ask';
export const ASK_TIMEOUT_MS = 25_000;

export type AskFailure = AskErrorCode | 'network' | 'timeout' | 'bad_response';

export type AskOutcome =
  | { readonly ok: true; readonly reply: string; readonly sig?: string }
  | { readonly ok: false; readonly error: AskFailure };

export interface PostAskOptions {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
  readonly fetchImpl?: typeof fetch;
}

const knownCodes: ReadonlySet<string> = new Set(ASK_ERROR_CODES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readBody(body: unknown, httpOk: boolean): AskOutcome {
  if (!isRecord(body)) return { ok: false, error: 'bad_response' };
  if (httpOk && typeof body.reply === 'string') {
    const reply = body.reply.trim();
    if (!reply) return { ok: false, error: 'bad_response' };
    // An unsigned reply is still shown; sent back without a signature, the server leaves it out.
    return typeof body.sig === 'string' && body.sig ? { ok: true, reply, sig: body.sig } : { ok: true, reply };
  }
  if (typeof body.error === 'string' && knownCodes.has(body.error)) {
    return { ok: false, error: body.error as AskErrorCode };
  }
  return { ok: false, error: 'bad_response' };
}

// AbortSignal.any is missing before Safari 17.4, which the build target still covers.
function anySignal(a: AbortSignal, b: AbortSignal): AbortSignal {
  if (typeof AbortSignal.any === 'function') return AbortSignal.any([a, b]);
  const controller = new AbortController();
  const abort = () => controller.abort();
  a.addEventListener('abort', abort, { once: true });
  b.addEventListener('abort', abort, { once: true });
  return controller.signal;
}

/** Never throws: every failure (HTTP, network, timeout, unexpected body) becomes an outcome. */
export async function postAsk(request: AskRequest, options: PostAskOptions = {}): Promise<AskOutcome> {
  const { signal, timeoutMs = ASK_TIMEOUT_MS, fetchImpl = fetch } = options;
  const timeout = AbortSignal.timeout(timeoutMs);
  try {
    const combined = signal ? anySignal(signal, timeout) : timeout;
    const response = await fetchImpl(ASK_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
      cache: 'no-store',
      signal: combined,
    });
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return { ok: false, error: timeout.aborted ? 'timeout' : 'bad_response' };
    }
    return readBody(body, response.ok);
  } catch {
    return { ok: false, error: timeout.aborted ? 'timeout' : 'network' };
  }
}
