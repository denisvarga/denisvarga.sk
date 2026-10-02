import type { ModelResult } from './openai';

export const FINALIZE_SQL =
  'UPDATE chat_log SET answer = ?1, model = ?2, latency_ms = ?3, input_tokens = ?4, output_tokens = ?5, outcome = ?6 WHERE id = ?7';

/**
 * Completes the reserved row. If this write fails the row stays `pending` and keeps counting
 * toward the daily cap, which is the safe direction.
 */
export async function finalizeRow(db: D1Database, id: number, result: ModelResult, latencyMs: number): Promise<void> {
  await db
    .prepare(FINALIZE_SQL)
    .bind(result.text, result.model, latencyMs, result.inputTokens, result.outputTokens, result.outcome, id)
    .run();
}
