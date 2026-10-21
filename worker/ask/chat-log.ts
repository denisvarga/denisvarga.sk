import { cleanContent } from './clean-text';
import type { ModelResult } from './openai';
import { redactContacts } from './redact';

export const FINALIZE_SQL =
  'UPDATE chat_log SET answer = ?1, model = ?2, latency_ms = ?3, input_tokens = ?4, output_tokens = ?5, outcome = ?6, cached_tokens = ?7, cache_write_tokens = ?8, prompt_version = ?9 WHERE id = ?10';

/**
 * Completes the reserved row. If this write fails the row stays `pending` and keeps counting
 * toward the daily cap, which is the safe direction. The answer is cleaned again here because
 * `pnpm logs:recent` prints it to a terminal, and visitor contacts it repeats are redacted.
 */
export async function finalizeRow(
  db: D1Database,
  id: number,
  result: ModelResult,
  latencyMs: number,
  promptVersion: string,
): Promise<void> {
  await db
    .prepare(FINALIZE_SQL)
    .bind(
      result.text === null ? null : redactContacts(cleanContent(result.text)),
      result.model,
      latencyMs,
      result.inputTokens,
      result.outputTokens,
      result.outcome,
      result.cachedTokens,
      result.cacheWriteTokens,
      promptVersion,
      id,
    )
    .run();
}
