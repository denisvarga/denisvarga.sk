import type { AskLang } from '../../shared/ask-contract';

export const INSERT_PENDING_SQL =
  "INSERT INTO chat_log (created_at, lang, question, outcome) VALUES (?1, ?2, ?3, 'pending') RETURNING id";

// LIMIT keeps the scan bounded at cap + 1 rows however busy the day was.
export const COUNT_TODAY_SQL =
  "SELECT COUNT(*) AS n FROM (SELECT 1 FROM chat_log WHERE created_at >= ?1 AND outcome IN ('pending', 'ok', 'truncated', 'refused', 'error') LIMIT ?2)";

export const MARK_CAPPED_SQL = "UPDATE chat_log SET outcome = 'capped' WHERE id = ?1";

export function utcMidnight(nowMs: number): number {
  const d = new Date(nowMs);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Integer >= 0, or null for a malformed var (the caller fails closed). */
export function parseDailyCap(value: string | undefined): number | null {
  const cap = Number(value?.trim() ?? '');
  return value?.trim() && Number.isInteger(cap) && cap >= 0 ? cap : null;
}

export type Reservation = { readonly status: 'reserved'; readonly id: number } | { readonly status: 'capped' };

export interface ReserveInput {
  readonly now: number;
  readonly lang: AskLang;
  readonly question: string;
  readonly cap: number;
}

/**
 * Inserts a pending row, then counts today's billable rows including it. Over the cap the row
 * becomes `capped`. Throws on any D1 error so the caller can fail closed.
 */
export async function reserveSlot(db: D1Database, input: ReserveInput): Promise<Reservation> {
  const [inserted, counted] = await db.batch<{ id?: number; n?: number }>([
    db.prepare(INSERT_PENDING_SQL).bind(input.now, input.lang, input.question),
    db.prepare(COUNT_TODAY_SQL).bind(utcMidnight(input.now), input.cap + 1),
  ]);
  const id = inserted?.results[0]?.id;
  const count = counted?.results[0]?.n;
  if (typeof id !== 'number' || typeof count !== 'number') throw new Error('unexpected D1 result');
  if (count <= input.cap) return { status: 'reserved', id };

  await db.prepare(MARK_CAPPED_SQL).bind(id).run();
  return { status: 'capped' };
}
