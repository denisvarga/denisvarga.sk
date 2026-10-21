import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from './index';
import { parseRetentionDays, runRetention } from './scheduled';
import { makeEnv } from './test-support/ask-harness';
import { FakeD1 } from './test-support/fake-d1';

const DAY = 86_400_000;
const NOW = Date.UTC(2027, 9, 2, 3, 17);
const TODAY = Date.UTC(2027, 9, 2);

let logs: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  logs = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());

function seeded(): FakeD1 {
  const db = new FakeD1();
  const cutoff = NOW - 365 * DAY;
  db.seed({ created_at: cutoff - 1, outcome: 'ok', question: 'too old' });
  db.seed({ created_at: cutoff - 1, outcome: 'capped', question: 'too old capped' });
  db.seed({ created_at: cutoff, outcome: 'ok', question: 'exactly at the cutoff' });
  db.seed({ created_at: NOW - DAY, outcome: 'ok', question: 'yesterday' });
  db.quota = [
    { day: TODAY - 2 * DAY, key: 'day-before-yesterday', n: 3 },
    { day: TODAY - DAY, key: 'yesterday', n: 2 },
    { day: TODAY, key: 'today', n: 1 },
  ];
  return db;
}

async function fire(db: FakeD1) {
  const pending: Promise<unknown>[] = [];
  const ctx = { waitUntil: (p: Promise<unknown>) => void pending.push(p), passThroughOnException: () => undefined, props: {} } as unknown as ExecutionContext;
  const { env } = makeEnv({ DB: db.asBinding() });
  const controller = { scheduledTime: NOW, cron: '17 3 * * *', noRetry: () => undefined } as ScheduledController;
  await worker.scheduled(controller, env as CloudflareBindings, ctx);
  await Promise.all(pending);
}

describe('parseRetentionDays', () => {
  it('accepts whole days from 30 up and rejects anything shorter or malformed', () => {
    expect(parseRetentionDays('365')).toBe(365);
    expect(parseRetentionDays(' 30 ')).toBe(30);
    for (const bad of [undefined, '', '29', '0', '-365', '36.5', '365d', 'Infinity']) expect(parseRetentionDays(bad)).toBeNull();
  });
});

describe('runRetention', () => {
  it('deletes only log rows older than the period and counters older than yesterday', async () => {
    const db = seeded();
    await runRetention(db.asBinding(), NOW, '365');
    expect(db.rows.map((r) => r.question)).toEqual(['exactly at the cutoff', 'yesterday']);
    expect(db.quota.map((q) => q.key)).toEqual(['yesterday', 'today']);
  });

  it.each(['29', '', 'abc', undefined])('logs config_error and deletes nothing for %j', async (value) => {
    const db = seeded();
    await runRetention(db.asBinding(), NOW, value);
    expect(db.executed).toEqual([]);
    expect(db.rows).toHaveLength(4);
    expect(db.quota).toHaveLength(3);
    expect(logs).toHaveBeenCalledWith({ event: 'config_error', status: 500 });
  });
});

describe('scheduled handler', () => {
  it('runs the retention at the scheduled time with the configured period', async () => {
    const db = seeded();
    await fire(db);
    expect(db.rows).toHaveLength(2);
    expect(db.quota).toHaveLength(2);
  });

  it('logs retention_error when D1 fails', async () => {
    const db = seeded();
    db.fail = true;
    await fire(db);
    expect(logs).toHaveBeenCalledWith({ event: 'retention_error', status: 500 });
  });
});
