import * as z from 'zod/mini';
import { estimateCostUsd } from '../ask/pricing';
import { DAY_MS, HOUR_MS, lastLocalDays, localDateKey } from './time';

export const CHAT_OUTCOMES = ['ok', 'truncated', 'refused', 'error', 'capped', 'unavailable_quota', 'pending'] as const;
export type ChatOutcome = (typeof CHAT_OUTCOMES)[number];

export const PAGE_SIZE = 50;
export const CHART_DAYS = 30;
// Keeps one export inside the Worker's memory; months of traffic at the daily cap.
const EXPORT_MAX_ROWS = 20_000;
export const MAX_SEARCH = 200;
const MAX_PAGE = 10_000;

// Invalid params fall back to "no filter" instead of an error page.
export const filterSchema = z.object({
  q: z.catch(z.pipe(z.optional(z.string()), z.transform((v) => (v ?? '').trim().slice(0, MAX_SEARCH))), ''),
  lang: z.catch(z.optional(z.enum(['sk', 'en'])), undefined),
  outcome: z.catch(z.optional(z.enum(CHAT_OUTCOMES)), undefined),
  page: z.catch(z.pipe(z.coerce.number(), z.int().check(z.minimum(1), z.maximum(MAX_PAGE))), 1),
});
export type OverviewFilter = z.output<typeof filterSchema>;

// Static SQL: an empty parameter switches its condition off, so every filter stays a bound value.
const WHERE =
  "WHERE (?1 = '' OR lang = ?1) AND (?2 = '' OR outcome = ?2) AND (?3 = '' OR question LIKE ?3 ESCAPE '\\' OR answer LIKE ?3 ESCAPE '\\')";

export const COUNT_FILTERED_SQL = `SELECT COUNT(*) AS n FROM chat_log ${WHERE}`;
export const PAGE_SQL = `SELECT created_at, lang, question, answer, latency_ms, outcome FROM chat_log ${WHERE} ORDER BY created_at DESC, id DESC LIMIT ?4 OFFSET ?5`;
export const SUMMARY_SQL =
  "SELECT COUNT(*) AS total, COALESCE(SUM(lang = 'sk'), 0) AS sk, COALESCE(SUM(lang = 'en'), 0) AS en, AVG(latency_ms) AS avg_latency_ms, COALESCE(SUM(input_tokens), 0) AS input_tokens, COALESCE(SUM(output_tokens), 0) AS output_tokens FROM chat_log";
export const OUTCOMES_SQL = 'SELECT outcome, COUNT(*) AS n FROM chat_log GROUP BY outcome';
// Bratislava is always a whole number of hours off UTC, so each UTC hour falls inside one local day.
export const HOURLY_SQL = 'SELECT created_at / 3600000 AS hour, COUNT(*) AS n FROM chat_log WHERE created_at >= ?1 GROUP BY hour';

export function likePattern(search: string): string {
  return search ? `%${search.replace(/[\\%_]/g, '\\$&')}%` : '';
}

function filterArgs(filter: OverviewFilter): [string, string, string] {
  return [filter.lang ?? '', filter.outcome ?? '', likePattern(filter.q)];
}

export interface LogRow {
  readonly createdAt: number;
  readonly lang: string;
  readonly question: string;
  readonly answer: string | null;
  readonly latencyMs: number | null;
  readonly outcome: string;
}

export interface DayCount {
  readonly date: string;
  readonly count: number;
}

export interface Summary {
  readonly total: number;
  readonly last7: number;
  readonly last30: number;
  readonly sk: number;
  readonly en: number;
  readonly outcomes: readonly { readonly outcome: ChatOutcome; readonly count: number }[];
  readonly avgLatencyMs: number | null;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly costUsd: number;
  readonly daily: readonly DayCount[];
}

export interface Overview {
  readonly summary: Summary;
  readonly rows: readonly LogRow[];
  readonly matched: number;
}

type DbRow = Record<string, unknown>;

const num = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
const numOrNull = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const text = (value: unknown): string => (typeof value === 'string' ? value : '');

function toLogRow(row: DbRow): LogRow {
  return {
    createdAt: num(row.created_at),
    lang: text(row.lang),
    question: text(row.question),
    answer: typeof row.answer === 'string' ? row.answer : null,
    latencyMs: numOrNull(row.latency_ms),
    outcome: text(row.outcome),
  };
}

function dailyCounts(hours: DbRow[], now: number): DayCount[] {
  const counts = new Map(lastLocalDays(now, CHART_DAYS).map((date) => [date, 0]));
  for (const { hour, n } of hours) {
    const date = localDateKey(num(hour) * HOUR_MS);
    const current = counts.get(date);
    if (current !== undefined) counts.set(date, current + num(n));
  }
  return [...counts].map(([date, count]) => ({ date, count }));
}

/** Summary and chart cover the whole log; only the table follows the filter. One D1 round trip. */
export async function loadOverview(db: D1Database, filter: OverviewFilter, now: number): Promise<Overview> {
  const args = filterArgs(filter);
  const [summary, outcomes, hourly, counted, page] = await db.batch<DbRow>([
    db.prepare(SUMMARY_SQL),
    db.prepare(OUTCOMES_SQL),
    db.prepare(HOURLY_SQL).bind(now - (CHART_DAYS + 1) * DAY_MS),
    db.prepare(COUNT_FILTERED_SQL).bind(...args),
    db.prepare(PAGE_SQL).bind(...args, PAGE_SIZE, (filter.page - 1) * PAGE_SIZE),
  ]);
  const totals = summary?.results[0] ?? {};
  const outcomeCounts = new Map((outcomes?.results ?? []).map((row) => [row.outcome, num(row.n)]));
  const daily = dailyCounts(hourly?.results ?? [], now);
  const inputTokens = num(totals.input_tokens);
  const outputTokens = num(totals.output_tokens);
  const avg = numOrNull(totals.avg_latency_ms);
  return {
    summary: {
      total: num(totals.total),
      last7: daily.slice(-7).reduce((sum, d) => sum + d.count, 0),
      last30: daily.reduce((sum, d) => sum + d.count, 0),
      sk: num(totals.sk),
      en: num(totals.en),
      outcomes: CHAT_OUTCOMES.map((outcome) => ({ outcome, count: outcomeCounts.get(outcome) ?? 0 })),
      avgLatencyMs: avg === null ? null : Math.round(avg),
      inputTokens,
      outputTokens,
      costUsd: estimateCostUsd(inputTokens, outputTokens),
      daily,
    },
    rows: (page?.results ?? []).map(toLogRow),
    matched: num(counted?.results[0]?.n),
  };
}

/** Every row matching the filter, newest first, up to EXPORT_MAX_ROWS. */
export async function loadExport(db: D1Database, filter: OverviewFilter): Promise<LogRow[]> {
  const { results } = await db.prepare(PAGE_SQL).bind(...filterArgs(filter), EXPORT_MAX_ROWS, 0).all<DbRow>();
  return results.map(toLogRow);
}
