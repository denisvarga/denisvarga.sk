import * as z from 'zod/mini';
import { cleanContent, plainReply } from './clean-text';

// Runs in the Worker and in Node (scripts/eval-agent.ts): standard fetch and WebCrypto only.

export const OPENAI_URL = 'https://api.openai.com/v1/responses';
export const PROMPT_CACHE_KEY = 'cv-chat-v1';
export const MAX_OUTPUT_TOKENS = 400;
export const ATTEMPT_TIMEOUT_MS = 15_000;
/** Whole-request budget on the server; the client waits 25 s. */
export const TOTAL_BUDGET_MS = 20_000;
const MAX_RETRY_AFTER_MS = 2_000;
const MIN_RETRY_BUDGET_MS = 1_000;

export const REASONING_EFFORTS = ['none', 'low', 'medium', 'high', 'xhigh', 'max'] as const;
export type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

const QUOTA_CODES = new Set([
  'project_spend_limit_exceeded',
  'organization_spend_limit_exceeded',
  'organization_usage_limit_exceeded',
  'insufficient_quota',
  'credit_balance_exhausted',
]);

export type ModelOutcome = 'ok' | 'truncated' | 'refused' | 'error' | 'unavailable_quota';

/** Never carries upstream error text; `text` is set only for `ok` and `truncated`. */
export interface ModelResult {
  readonly outcome: ModelOutcome;
  readonly text: string | null;
  readonly responseStatus: string | null;
  readonly model: string;
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
  /** Upstream HTTP status, 0 for network errors and timeouts. */
  readonly httpStatus: number;
}

export interface OpenAIRequest {
  readonly apiKey: string;
  readonly model: string;
  readonly effort: string | undefined;
  readonly instructions: string;
  readonly messages: readonly { readonly role: 'user' | 'assistant'; readonly content: string }[];
  readonly safetyIdentifier: string;
  /** Epoch ms after which no attempt may run. */
  readonly deadline: number;
  readonly fetchImpl?: typeof fetch;
  readonly now?: () => number;
  readonly sleep?: (ms: number) => Promise<void>;
}

export function resolveEffort(value: string | undefined): ReasoningEffort {
  return REASONING_EFFORTS.find((effort) => effort === value?.trim()) ?? 'none';
}

export function buildRequestBody(req: OpenAIRequest): Record<string, unknown> {
  return {
    model: req.model,
    instructions: req.instructions,
    input: req.messages.map(({ role, content }) => ({ role, content })),
    store: false,
    max_output_tokens: MAX_OUTPUT_TOKENS,
    reasoning: { effort: resolveEffort(req.effort) },
    prompt_cache_key: PROMPT_CACHE_KEY,
    safety_identifier: req.safetyIdentifier,
  };
}

const optionalString = z.optional(z.nullable(z.string()));

const responseSchema = z.object({
  status: optionalString,
  model: optionalString,
  output: z.optional(
    z.array(
      z.object({
        type: z.string(),
        content: z.optional(z.array(z.object({ type: z.string(), text: optionalString }))),
      }),
    ),
  ),
  incomplete_details: z.optional(z.nullable(z.object({ reason: optionalString }))),
  usage: z.optional(z.nullable(z.object({ input_tokens: z.number(), output_tokens: z.number() }))),
});

const errorSchema = z.object({ error: z.object({ code: optionalString, type: optionalString }) });

/** Cuts an over-long answer back to its last complete sentence so the visitor never sees half a word. */
export function trimToLastSentence(text: string): string {
  const match = /^[\s\S]*[.!?…]["'“”»)\]]*(?=\s|$)/.exec(text.trim());
  return match ? match[0] : `${text.trim()}...`;
}

function failure(outcome: ModelOutcome, model: string, httpStatus: number): ModelResult {
  return { outcome, text: null, responseStatus: null, model, inputTokens: null, outputTokens: null, httpStatus };
}

export function parseResponse(json: unknown, requestedModel: string, httpStatus = 200): ModelResult {
  const parsed = responseSchema.safeParse(json);
  if (!parsed.success) return failure('error', requestedModel, httpStatus);
  const data = parsed.data;
  const parts = (data.output ?? []).filter((item) => item.type === 'message').flatMap((item) => item.content ?? []);
  const reason = data.incomplete_details?.reason;
  // Cleaned here so the visitor, the reply signature and the log all see the same text.
  const text = plainReply(
    cleanContent(
      parts
        .filter((part) => part.type === 'output_text')
        .map((part) => part.text ?? '')
        .join(''),
    ),
  );
  const base = {
    responseStatus: data.status ?? null,
    model: data.model ?? requestedModel,
    inputTokens: data.usage?.input_tokens ?? null,
    outputTokens: data.usage?.output_tokens ?? null,
    httpStatus,
  };

  if (parts.some((part) => part.type === 'refusal') || reason === 'content_filter') {
    return { ...base, outcome: 'refused', text: null };
  }
  if (data.status === 'completed' && text) return { ...base, outcome: 'ok', text };
  if (data.status === 'incomplete' && reason === 'max_output_tokens' && text) {
    return { ...base, outcome: 'truncated', text: trimToLastSentence(text) };
  }
  return { ...base, outcome: 'error', text: null };
}

async function isQuotaError(res: Response): Promise<boolean> {
  const parsed = errorSchema.safeParse(await res.json().catch(() => null));
  if (!parsed.success) return false;
  const { code, type } = parsed.data.error;
  return QUOTA_CODES.has(code ?? '') || QUOTA_CODES.has(type ?? '');
}

/** Delay before the single retry, or null when the response must not be retried. */
export function retryDelayMs(status: number, retryAfter: string | null): number | null {
  if (status !== 503 && status !== 429) return null;
  if (retryAfter === null) return status === 503 ? 0 : null;
  const seconds = Number(retryAfter.trim());
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  return seconds * 1000 <= MAX_RETRY_AFTER_MS ? seconds * 1000 : null;
}

type Attempt = { readonly result: ModelResult; readonly retryAfterMs: number | null };

async function attempt(req: OpenAIRequest, timeoutMs: number): Promise<Attempt> {
  const doFetch = req.fetchImpl ?? fetch;
  let res: Response;
  try {
    res = await doFetch(OPENAI_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${req.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequestBody(req)),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.ok) return { result: parseResponse(await res.json(), req.model, res.status), retryAfterMs: null };
  } catch {
    return { result: failure('error', req.model, 0), retryAfterMs: null };
  }
  if (await isQuotaError(res)) return { result: failure('unavailable_quota', req.model, res.status), retryAfterMs: null };
  return {
    result: failure('error', req.model, res.status),
    retryAfterMs: retryDelayMs(res.status, res.headers.get('Retry-After')),
  };
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** One Responses API call with at most one retry, never running past `req.deadline`. */
export async function callOpenAI(req: OpenAIRequest): Promise<ModelResult> {
  const now = req.now ?? Date.now;
  const sleep = req.sleep ?? defaultSleep;

  const firstBudget = req.deadline - now();
  if (firstBudget <= 0) return failure('error', req.model, 0);
  const first = await attempt(req, Math.min(ATTEMPT_TIMEOUT_MS, firstBudget));
  if (first.retryAfterMs === null) return first.result;
  if (req.deadline - now() - first.retryAfterMs < MIN_RETRY_BUDGET_MS) return first.result;

  await sleep(first.retryAfterMs);
  const secondBudget = req.deadline - now();
  if (secondBudget <= 0) return first.result;
  return (await attempt(req, Math.min(ATTEMPT_TIMEOUT_MS, secondBudget))).result;
}
