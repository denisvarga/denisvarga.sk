import { cleanContent } from './clean-text';
import type { ModelResult } from './openai';
import { redactContacts } from './redact';

export const FINALIZE_SQL =
  'UPDATE chat_log SET answer = ?1, model = ?2, latency_ms = ?3, input_tokens = ?4, output_tokens = ?5, outcome = ?6, cached_tokens = ?7, cache_write_tokens = ?8, prompt_version = ?9, reply_kind = ?10 WHERE id = ?11';

/**
 * Completes the reserved row. If this write fails the row stays `pending` and keeps counting
 * toward the daily cap, which is the safe direction. The answer is cleaned again here because
 * `pnpm logs:recent` prints it to a terminal, and visitor contacts it repeats are redacted. A
 * proposed contact message is logged as outcome `ok` with reply_kind `handoff_draft` and no
 * answer: the draft itself is never stored.
 */
export async function finalizeRow(
  db: D1Database,
  id: number,
  result: ModelResult,
  latencyMs: number,
  promptVersion: string,
): Promise<void> {
  const handoff = result.outcome === 'handoff';
  await db
    .prepare(FINALIZE_SQL)
    .bind(
      handoff || result.text === null ? null : redactContacts(cleanContent(result.text)),
      result.model,
      latencyMs,
      result.inputTokens,
      result.outputTokens,
      handoff ? 'ok' : result.outcome,
      result.cachedTokens,
      result.cacheWriteTokens,
      promptVersion,
      handoff ? 'handoff_draft' : null,
      id,
    )
    .run();
}
