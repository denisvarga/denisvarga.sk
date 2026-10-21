import { parseDailyCap, utcMidnight } from './ask/daily-cap';
import { logEvent } from './ask/errors';

// Uses idx_chat_log_created_at.
export const DELETE_OLD_CHATS_SQL = 'DELETE FROM chat_log WHERE created_at < ?1';
export const DELETE_OLD_QUOTA_SQL = 'DELETE FROM client_quota WHERE day < ?1';

export const MIN_RETENTION_DAYS = 30;
const DAY_MS = 86_400_000;

/** Whole days, at least the minimum; anything else is null so a typo can never wipe the log. */
export function parseRetentionDays(value: string | undefined): number | null {
  const days = parseDailyCap(value);
  return days !== null && days >= MIN_RETENTION_DAYS ? days : null;
}

/**
 * Deletes question log rows older than the retention period and client counters older than
 * yesterday (UTC), in one batch. A malformed or too short period logs `config_error` and deletes
 * nothing. Throws on a D1 error so the caller can log it.
 */
export async function runRetention(db: D1Database, nowMs: number, retentionDays: string | undefined): Promise<void> {
  const days = parseRetentionDays(retentionDays);
  if (days === null) {
    logEvent('config_error', 500);
    return;
  }
  await db.batch([
    db.prepare(DELETE_OLD_CHATS_SQL).bind(nowMs - days * DAY_MS),
    db.prepare(DELETE_OLD_QUOTA_SQL).bind(utcMidnight(nowMs) - DAY_MS),
  ]);
}
