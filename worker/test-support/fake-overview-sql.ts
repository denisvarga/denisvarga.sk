import { COUNT_FILTERED_SQL, HOURLY_SQL, OUTCOMES_SQL, PAGE_SQL, SUMMARY_SQL } from '../admin/query';
import type { ChatRow } from './fake-d1';

const escapeRegExp = (ch: string) => ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** SQLite LIKE with ESCAPE '\': `%` any run, `_` one character, case-insensitive (SQLite folds ASCII only). */
function likeRegExp(pattern: string): RegExp {
  let source = '';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern.charAt(i);
    if (ch === '\\' && i + 1 < pattern.length) source += escapeRegExp(pattern.charAt(++i));
    else if (ch === '%') source += '[\\s\\S]*';
    else if (ch === '_') source += '[\\s\\S]';
    else source += escapeRegExp(ch);
  }
  return new RegExp(`^${source}$`, 'i');
}

function matchesFilter(row: ChatRow, [lang, outcome, like]: unknown[]): boolean {
  if (lang !== '' && row.lang !== lang) return false;
  if (outcome !== '' && row.outcome !== outcome) return false;
  if (like === '') return true;
  const re = likeRegExp(String(like));
  return re.test(row.question) || (row.answer !== null && re.test(row.answer));
}

function countBy<T>(items: readonly T[], key: (item: T) => string | number): Map<string | number, number> {
  const counts = new Map<string | number, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return counts;
}

const total = (rows: readonly ChatRow[], pick: (row: ChatRow) => number | null) =>
  rows.reduce((sum, row) => sum + (pick(row) ?? 0), 0);

/** The overview's read-only statements; `undefined` for anything else. */
export function executeOverviewSql(sql: string, args: unknown[], rows: readonly ChatRow[]): Record<string, unknown>[] | undefined {
  switch (sql) {
    case SUMMARY_SQL: {
      const timed = rows.filter((r) => r.latency_ms !== null);
      return [
        {
          total: rows.length,
          sk: rows.filter((r) => r.lang === 'sk').length,
          en: rows.filter((r) => r.lang === 'en').length,
          avg_latency_ms: timed.length ? total(timed, (r) => r.latency_ms) / timed.length : null,
          input_tokens: total(rows, (r) => r.input_tokens),
          output_tokens: total(rows, (r) => r.output_tokens),
        },
      ];
    }
    case OUTCOMES_SQL:
      return [...countBy(rows, (r) => r.outcome)].map(([outcome, n]) => ({ outcome, n }));
    case HOURLY_SQL: {
      const recent = rows.filter((r) => r.created_at >= Number(args[0]));
      return [...countBy(recent, (r) => Math.floor(r.created_at / 3_600_000))].map(([hour, n]) => ({ hour, n }));
    }
    case COUNT_FILTERED_SQL:
      return [{ n: rows.filter((r) => matchesFilter(r, args)).length }];
    case PAGE_SQL: {
      const [limit, offset] = [Number(args[3]), Number(args[4])];
      return rows
        .filter((r) => matchesFilter(r, args))
        .toSorted((a, b) => b.created_at - a.created_at || b.id - a.id)
        .slice(offset, offset + limit)
        .map(({ created_at, lang, question, answer, latency_ms, outcome }) => ({ created_at, lang, question, answer, latency_ms, outcome }));
    }
    default:
      return undefined;
  }
}
