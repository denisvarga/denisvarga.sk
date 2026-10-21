// List prices of the configured chat model; cache writes at the 30-minute rate the chat uses.
export const USD_PER_INPUT_TOKEN = 0.1 / 1_000_000;
export const USD_PER_CACHED_INPUT_TOKEN = 0.01 / 1_000_000;
export const USD_PER_CACHE_WRITE_TOKEN = 0.125 / 1_000_000;
export const USD_PER_OUTPUT_TOKEN = 0.5 / 1_000_000;

export interface TokenUsage {
  readonly inputTokens: number;
  /** Cache reads, counted inside `inputTokens`. */
  readonly cachedTokens: number;
  /** Cache writes, counted inside `inputTokens`. */
  readonly cacheWriteTokens: number;
  readonly outputTokens: number;
}

/** Each input token is billed at exactly one rate: a cache read, a cache write or plain input. */
export function estimateCostUsd({ inputTokens, cachedTokens, cacheWriteTokens, outputTokens }: TokenUsage): number {
  const plain = Math.max(0, inputTokens - cachedTokens - cacheWriteTokens);
  return (
    plain * USD_PER_INPUT_TOKEN +
    cachedTokens * USD_PER_CACHED_INPUT_TOKEN +
    cacheWriteTokens * USD_PER_CACHE_WRITE_TOKEN +
    outputTokens * USD_PER_OUTPUT_TOKEN
  );
}
