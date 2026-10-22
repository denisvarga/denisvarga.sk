import * as z from 'zod/mini';
import type { ContactDraft } from '../../shared/ask-contract';
import { parseDraftArguments } from '../contact/schema';
import { cleanContent, plainReply } from './clean-text';

// Runs in the Worker and in Node (scripts/eval-agent.ts): standard fetch and WebCrypto only.

export const OPENAI_URL = 'https://api.openai.com/v1/responses';
export const PROMPT_CACHE_KEY = 'cv-chat-v2';
/** Explicit mode caches only the marked prefix, so no request pays a write for its own turns. */
export const PROMPT_CACHE_OPTIONS = { mode: 'explicit', ttl: '30m' } as const;
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

export const CONTACT_TOOL_NAME = 'propose_contact_message';

/** A constant, so the tool definition stays part of the cached prompt prefix. */
export const CONTACT_TOOL = {
  type: 'function',
  name: CONTACT_TOOL_NAME,
  description: 'Navrhne krátku správu pre Denisa. Návštevník ju skontroluje a odošle sám, nástroj nič neodosiela.',
  strict: true,
  parameters: {
    type: 'object',
    properties: {
      message: { type: 'string', description: 'Požiadavka návštevníka v 1-3 vetách, v jazyku rozhovoru, v 1. osobe návštevníka.' },
      name: { type: ['string', 'null'], description: 'Meno, len ak ho návštevník v rozhovore sám uviedol, inak null.' },
      email: { type: ['string', 'null'], description: 'E-mail, len ak ho návštevník v rozhovore sám uviedol, inak null.' },
    },
    required: ['message', 'name', 'email'],
    additionalProperties: false,
  },
} as const;

/** `handoff`: the model proposed a contact message through CONTACT_TOOL instead of answering. */
export type ModelOutcome = 'ok' | 'truncated' | 'refused' | 'error' | 'unavailable_quota' | 'handoff';

/** Never carries upstream error text; `text` is set only for `ok` and `truncated`. */
export interface ModelResult {
  readonly outcome: ModelOutcome;
  readonly text: string | null;
  /** Set only for `handoff`. */
  readonly draft?: ContactDraft;
  readonly responseStatus: string | null;
  readonly model: string;
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
  /** Input tokens billed as cache reads; part of `inputTokens`. */
  readonly cachedTokens: number | null;
  /** Input tokens billed as cache writes; part of `inputTokens`. */
  readonly cacheWriteTokens: number | null;
  /** Upstream HTTP status, 0 for network errors and timeouts. */
  readonly httpStatus: number;
}

/**
 * `shared` is identical for every request and carries the cache breakpoint; `perRequest` follows
 * it uncached. Top-level `instructions` cannot carry a breakpoint, so both go in as developer
 * messages ahead of the turns.
 */
export interface PromptParts {
  readonly shared: string;
  readonly perRequest: string;
}

export interface OpenAIRequest {
  readonly apiKey: string;
  readonly model: string;
  readonly effort: string | undefined;
  readonly instructions: PromptParts;
  readonly messages: readonly { readonly role: 'user' | 'assistant'; readonly content: string }[];
  readonly safetyIdentifier: string;
  /** Offers CONTACT_TOOL; the Worker never answers a call with a function_call_output. */
  readonly contact?: boolean;
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
    input: [
      {
        role: 'developer',
        content: [{ type: 'input_text', text: req.instructions.shared, prompt_cache_breakpoint: { mode: 'explicit' } }],
      },
      { role: 'developer', content: [{ type: 'input_text', text: req.instructions.perRequest }] },
      ...req.messages.map(({ role, content }) => ({ role, content })),
    ],
    store: false,
    max_output_tokens: MAX_OUTPUT_TOKENS,
    reasoning: { effort: resolveEffort(req.effort) },
    prompt_cache_key: PROMPT_CACHE_KEY,
    prompt_cache_options: PROMPT_CACHE_OPTIONS,
    safety_identifier: req.safetyIdentifier,
    ...(req.contact ? { tools: [CONTACT_TOOL], tool_choice: 'auto', parallel_tool_calls: false } : {}),
  };
}

const optionalString = z.optional(z.nullable(z.string()));
const optionalCount = z.optional(z.nullable(z.number()));

const responseSchema = z.object({
  status: optionalString,
  model: optionalString,
  output: z.optional(
    z.array(
      z.object({
        type: z.string(),
        content: z.optional(z.array(z.object({ type: z.string(), text: optionalString }))),
        name: optionalString,
        arguments: optionalString,
      }),
    ),
  ),
  incomplete_details: z.optional(z.nullable(z.object({ reason: optionalString }))),
  usage: z.optional(
    z.nullable(
      z.object({
        input_tokens: z.number(),
        output_tokens: z.number(),
        // Telemetry only: an unexpected shape here must never turn an answer into an error.
        input_tokens_details: z.catch(
          z.optional(z.nullable(z.object({ cached_tokens: optionalCount, cache_write_tokens: optionalCount }))),
          undefined,
        ),
      }),
    ),
  ),
});

const errorSchema = z.object({ error: z.object({ code: optionalString, type: optionalString }) });

/** Cuts an over-long answer back to its last complete sentence so the visitor never sees half a word. */
export function trimToLastSentence(text: string): string {
  const match = /^[\s\S]*[.!?…]["'“”»)\]]*(?=\s|$)/.exec(text.trim());
  return match ? match[0] : `${text.trim()}...`;
}

function failure(outcome: ModelOutcome, model: string, httpStatus: number): ModelResult {
  return {
    outcome,
    text: null,
    responseStatus: null,
    model,
    inputTokens: null,
    outputTokens: null,
    cachedTokens: null,
    cacheWriteTokens: null,
    httpStatus,
  };
}

export function parseResponse(json: unknown, requestedModel: string, httpStatus = 200): ModelResult {
  const parsed = responseSchema.safeParse(json);
  if (!parsed.success) return failure('error', requestedModel, httpStatus);
  const data = parsed.data;
  const parts = (data.output ?? []).filter((item) => item.type === 'message').flatMap((item) => item.content ?? []);
  const reason = data.incomplete_details?.reason;
  // Cleaned here so the visitor, the reply signature and the log all see the same text. The final
  // trim matters: a reply ending in a dash turns into "... - " and the client and schema trim it.
  const text = plainReply(
    cleanContent(
      parts
        .filter((part) => part.type === 'output_text')
        .map((part) => part.text ?? '')
        .join(''),
    ),
  ).trim();
  const base = {
    responseStatus: data.status ?? null,
    model: data.model ?? requestedModel,
    inputTokens: data.usage?.input_tokens ?? null,
    outputTokens: data.usage?.output_tokens ?? null,
    cachedTokens: data.usage?.input_tokens_details?.cached_tokens ?? null,
    cacheWriteTokens: data.usage?.input_tokens_details?.cache_write_tokens ?? null,
    httpStatus,
  };

  if (parts.some((part) => part.type === 'refusal') || reason === 'content_filter') {
    return { ...base, outcome: 'refused', text: null };
  }
  // A call with an unknown name or invalid arguments falls back to the text, like no call at all.
  const call = (data.output ?? []).find((item) => item.type === 'function_call' && item.name === CONTACT_TOOL_NAME);
  const draft = data.status === 'completed' && call ? parseDraftArguments(call.arguments ?? '') : null;
  if (draft) return { ...base, outcome: 'handoff', text: null, draft };
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
