import { ASK_ERROR_CODES, type AskErrorCode, type AskRequest, type ContactDraft } from '../../shared/ask-contract';
import { CONTACT_ERROR_CODES, type ContactErrorCode, type ContactRequest } from '../../shared/contact-contract';

export const ASK_ENDPOINT = '/api/ask';
export const CONTACT_ENDPOINT = '/api/contact';
export const ASK_TIMEOUT_MS = 25_000;

type TransportFailure = 'network' | 'timeout' | 'bad_response';

export type AskFailure = AskErrorCode | TransportFailure;

export type AskOutcome =
  | { readonly ok: true; readonly reply: string; readonly sig?: string; readonly draft?: ContactDraft }
  | { readonly ok: false; readonly error: AskFailure };

export type ContactFailure = ContactErrorCode | TransportFailure;

export type ContactOutcome =
  | { readonly ok: true; readonly reply: string; readonly sig: string }
  | { readonly ok: false; readonly error: ContactFailure };

export interface PostAskOptions {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
  readonly fetchImpl?: typeof fetch;
}

const askCodes: ReadonlySet<string> = new Set(ASK_ERROR_CODES);
const contactCodes: ReadonlySet<string> = new Set(CONTACT_ERROR_CODES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

const isNullableString = (value: unknown): value is string | null => value === null || typeof value === 'string';

function readDraft(body: Record<string, unknown>): ContactDraft | undefined {
  const draft = body.draft;
  if (body.kind !== 'handoff_draft' || !isRecord(draft)) return undefined;
  const { message, name, email } = draft;
  if (typeof message !== 'string' || !message.trim() || !isNullableString(name) || !isNullableString(email)) return undefined;
  return { message: message.trim(), name, email };
}

function readAskBody(body: unknown, httpOk: boolean): AskOutcome {
  if (!isRecord(body)) return { ok: false, error: 'bad_response' };
  if (httpOk && typeof body.reply === 'string') {
    const reply = body.reply.trim();
    if (!reply) return { ok: false, error: 'bad_response' };
    // An unsigned reply is still shown; sent back without a signature, the server leaves it out.
    const sig = typeof body.sig === 'string' && body.sig ? body.sig : undefined;
    // A malformed draft still shows its reply text, just without the card.
    const draft = readDraft(body);
    return { ok: true, reply, ...(sig ? { sig } : {}), ...(draft ? { draft } : {}) };
  }
  if (typeof body.error === 'string' && askCodes.has(body.error)) {
    return { ok: false, error: body.error as AskErrorCode };
  }
  return { ok: false, error: 'bad_response' };
}

function readContactBody(body: unknown, httpOk: boolean): ContactOutcome {
  if (!isRecord(body)) return { ok: false, error: 'bad_response' };
  if (httpOk && typeof body.reply === 'string' && body.reply.trim() && typeof body.sig === 'string' && body.sig) {
    return { ok: true, reply: body.reply.trim(), sig: body.sig };
  }
  if (typeof body.error === 'string' && contactCodes.has(body.error)) {
    return { ok: false, error: body.error as ContactErrorCode };
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

type Posted = { readonly body: unknown; readonly httpOk: boolean } | { readonly error: TransportFailure };

async function postJson(url: string, payload: unknown, options: PostAskOptions): Promise<Posted> {
  const { signal, timeoutMs = ASK_TIMEOUT_MS, fetchImpl = fetch } = options;
  const timeout = AbortSignal.timeout(timeoutMs);
  try {
    const combined = signal ? anySignal(signal, timeout) : timeout;
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: combined,
    });
    try {
      return { body: await response.json(), httpOk: response.ok };
    } catch {
      return { error: timeout.aborted ? 'timeout' : 'bad_response' };
    }
  } catch {
    return { error: timeout.aborted ? 'timeout' : 'network' };
  }
}

/** Never throws: every failure (HTTP, network, timeout, unexpected body) becomes an outcome. */
export async function postAsk(request: AskRequest, options: PostAskOptions = {}): Promise<AskOutcome> {
  const posted = await postJson(ASK_ENDPOINT, request, options);
  return 'error' in posted ? { ok: false, error: posted.error } : readAskBody(posted.body, posted.httpOk);
}

/** Never throws, like postAsk. */
export async function postContact(request: ContactRequest, options: PostAskOptions = {}): Promise<ContactOutcome> {
  const posted = await postJson(CONTACT_ENDPOINT, request, options);
  return 'error' in posted ? { ok: false, error: posted.error } : readContactBody(posted.body, posted.httpOk);
}
