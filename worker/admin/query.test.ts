import { describe, expect, it } from 'vitest';
import { FakeD1 } from '../test-support/fake-d1';
import { COUNT_FILTERED_SQL, filterSchema, HOURLY_SQL, likePattern, loadExport, loadOverview, PAGE_SQL } from './query';
import { DAY_MS, HOUR_MS } from './time';

// 12:00 in Bratislava (UTC+2 in October).
const NOW = Date.UTC(2026, 9, 5, 10, 0);
const filter = (raw: Record<string, string> = {}) => filterSchema.parse(raw);

function seeded(): FakeD1 {
  const db = new FakeD1();
  db.seed({ created_at: NOW - HOUR_MS, lang: 'sk', outcome: 'ok', latency_ms: 800, input_tokens: 1000, output_tokens: 100 });
  // 00:30 local on 5 Oct, still 4 Oct in UTC.
  db.seed({ created_at: Date.UTC(2026, 9, 4, 22, 30), lang: 'en', outcome: 'truncated', latency_ms: 1200, input_tokens: 2000, output_tokens: 400 });
  db.seed({ created_at: Date.UTC(2026, 9, 4, 21, 30), lang: 'sk', outcome: 'error' });
  db.seed({ created_at: NOW - 10 * DAY_MS, lang: 'sk', outcome: 'capped' });
  db.seed({ created_at: NOW - 40 * DAY_MS, lang: 'en', outcome: 'refused', latency_ms: 400, input_tokens: 500, output_tokens: 0 });
  db.seed({ created_at: NOW - 60_000, lang: 'sk', outcome: 'pending' });
  return db;
}

describe('loadOverview summary', () => {
  it('computes totals, languages, outcomes, latency, tokens and cost on seeded rows', async () => {
    const { summary } = await loadOverview(seeded().asBinding(), filter(), NOW);
    expect(summary).toMatchObject({ total: 6, last7: 4, last30: 5, sk: 4, en: 2, avgLatencyMs: 800, inputTokens: 3500, outputTokens: 500 });
    expect(summary.costUsd).toBeCloseTo(3500 * 0.1e-6 + 500 * 0.5e-6, 12);
    expect(summary.outcomes).toEqual([
      { outcome: 'ok', count: 1 },
      { outcome: 'truncated', count: 1 },
      { outcome: 'refused', count: 1 },
      { outcome: 'error', count: 1 },
      { outcome: 'capped', count: 1 },
      { outcome: 'unavailable_quota', count: 0 },
      { outcome: 'pending', count: 1 },
    ]);
  });

  it('buckets the chart by Bratislava calendar day over the last 30 days', async () => {
    const { summary } = await loadOverview(seeded().asBinding(), filter(), NOW);
    expect(summary.daily).toHaveLength(30);
    expect(summary.daily[0]).toEqual({ date: '2026-09-06', count: 0 });
    expect(summary.daily.at(-1)).toEqual({ date: '2026-10-05', count: 3 });
    expect(summary.daily.at(-2)).toEqual({ date: '2026-10-04', count: 1 });
    expect(summary.daily.find((d) => d.date === '2026-09-25')).toEqual({ date: '2026-09-25', count: 1 });
  });

  it('reports an empty log without NaN or a fake average', async () => {
    const { summary, rows, matched } = await loadOverview(new FakeD1().asBinding(), filter(), NOW);
    expect(summary).toMatchObject({ total: 0, last7: 0, last30: 0, avgLatencyMs: null, inputTokens: 0, costUsd: 0 });
    expect(rows).toEqual([]);
    expect(matched).toBe(0);
  });
});

describe('overview filters', () => {
  it('binds every filter as a parameter, LIKE wildcards escaped, with the page offset', async () => {
    const db = seeded();
    await loadOverview(db.asBinding(), filter({ q: ' 50%_off\\ ', lang: 'sk', outcome: 'ok', page: '3' }), NOW);
    const args = (sql: string) => db.executed.find((s) => s.sql === sql)?.args;
    expect(args(COUNT_FILTERED_SQL)).toEqual(['sk', 'ok', '%50\\%\\_off\\\\%']);
    expect(args(PAGE_SQL)).toEqual(['sk', 'ok', '%50\\%\\_off\\\\%', 50, 100]);
    expect(args(HOURLY_SQL)).toEqual([NOW - 31 * DAY_MS]);
  });

  it('binds empty strings for absent filters', async () => {
    const db = seeded();
    await loadExport(db.asBinding(), filter());
    expect(db.executed).toEqual([{ sql: PAGE_SQL, args: ['', '', '', 20_000, 0] }]);
  });

  it('matches a literal % in the question or the answer, not any digits', async () => {
    const db = new FakeD1();
    db.seed({ created_at: 1, question: 'Zľava 50% platí?', outcome: 'ok' });
    db.seed({ created_at: 2, question: 'Stojí to 500 eur?', outcome: 'ok' });
    db.seed({ created_at: 3, question: 'Cena?', answer: 'Do 50% menej.', outcome: 'ok' });
    const { rows, matched } = await loadOverview(db.asBinding(), filter({ q: '50%' }), NOW);
    expect(matched).toBe(2);
    expect(rows.map((r) => r.createdAt)).toEqual([3, 1]);
  });

  it('pages 50 rows at a time, newest first', async () => {
    const db = new FakeD1();
    for (let i = 1; i <= 120; i++) db.seed({ created_at: i * 1000, lang: i % 2 ? 'sk' : 'en', outcome: 'ok' });
    const first = await loadOverview(db.asBinding(), filter(), NOW);
    const third = await loadOverview(db.asBinding(), filter({ page: '3' }), NOW);
    const english = await loadOverview(db.asBinding(), filter({ lang: 'en', page: '2' }), NOW);
    expect(first.matched).toBe(120);
    expect(first.rows).toHaveLength(50);
    expect(first.rows[0]?.createdAt).toBe(120_000);
    expect(third.rows.map((r) => r.createdAt)).toEqual(Array.from({ length: 20 }, (_, i) => (20 - i) * 1000));
    expect(english.matched).toBe(60);
    expect(english.rows).toHaveLength(10);
    expect(english.rows.every((r) => r.lang === 'en')).toBe(true);
  });
});

describe('filterSchema', () => {
  it('falls back to no filter for invalid values and trims the search', () => {
    expect(filter({ q: '  ahoj  ', lang: 'de', outcome: 'drop table', page: '-1' })).toEqual({ q: 'ahoj', page: 1 });
    expect(filter({ page: '2.5' }).page).toBe(1);
    expect(filter({ page: '99999' }).page).toBe(1);
    expect(filter({ lang: 'en', outcome: 'unavailable_quota', page: '4' })).toEqual({ q: '', lang: 'en', outcome: 'unavailable_quota', page: 4 });
    expect(filter({ q: 'x'.repeat(300) }).q).toHaveLength(200);
  });

  it('escapes the LIKE escape character itself', () => {
    expect(likePattern('')).toBe('');
    expect(likePattern('a\\b')).toBe('%a\\\\b%');
  });
});
