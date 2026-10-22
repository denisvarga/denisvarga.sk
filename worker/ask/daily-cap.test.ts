import { describe, expect, it } from 'vitest';
import { FakeD1 } from '../test-support/fake-d1';
import {
  CONTACT_TOTAL_KEY,
  INSERT_PENDING_SQL,
  parseDailyCap,
  reserveContactSlot,
  reserveSlot,
  UPSERT_CONTACT_TOTAL_SQL,
  UPSERT_QUOTA_SQL,
  utcMidnight,
  type ReserveInput,
} from './daily-cap';

describe('daily cap helpers', () => {
  it('computes UTC midnight regardless of local offset', () => {
    expect(utcMidnight(Date.UTC(2026, 9, 2, 23, 59, 59))).toBe(Date.UTC(2026, 9, 2));
    expect(utcMidnight(Date.UTC(2026, 9, 3, 0, 0, 0))).toBe(Date.UTC(2026, 9, 3));
  });

  it('parses a non-negative integer cap and rejects anything else', () => {
    expect(parseDailyCap('300')).toBe(300);
    expect(parseDailyCap(' 0 ')).toBe(0);
    for (const bad of [undefined, '', '  ', '-1', '1.5', 'abc', 'Infinity']) expect(parseDailyCap(bad)).toBeNull();
  });
});

describe('reserveSlot', () => {
  const now = Date.UTC(2026, 9, 21, 12);
  const input = (overrides: Partial<ReserveInput> = {}): ReserveInput => ({
    now,
    lang: 'sk',
    question: 'Kto je Denis?',
    cap: 300,
    clientCap: 2,
    quotaKey: 'k1',
    ...overrides,
  });

  it('counts the client per UTC day in the same batch as the pending row', async () => {
    const db = new FakeD1();
    expect(await reserveSlot(db.asBinding(), input())).toEqual({ status: 'reserved', id: 1 });
    expect(db.executed.map((e) => e.sql).slice(0, 2)).toEqual([INSERT_PENDING_SQL, UPSERT_QUOTA_SQL]);
    expect(db.executed[1]?.args).toEqual([Date.UTC(2026, 9, 21), 'k1']);
  });

  it('caps a client over its budget and leaves other clients alone', async () => {
    const db = new FakeD1();
    await reserveSlot(db.asBinding(), input());
    await reserveSlot(db.asBinding(), input());
    expect(await reserveSlot(db.asBinding(), input())).toEqual({ status: 'capped', scope: 'client' });
    expect(db.rows.at(-1)?.outcome).toBe('capped');
    expect(await reserveSlot(db.asBinding(), input({ quotaKey: 'k2' }))).toMatchObject({ status: 'reserved' });
  });

  it('reports the global scope when the day is full but the client is within budget', async () => {
    const db = new FakeD1();
    db.seed({ created_at: now, outcome: 'ok' });
    expect(await reserveSlot(db.asBinding(), input({ cap: 1 }))).toEqual({ status: 'capped', scope: 'global' });
  });
});

describe('reserveContactSlot', () => {
  const now = Date.UTC(2026, 10, 2, 9);
  const input = { now, clientCap: 2, cap: 3, quotaKey: 'contact-k1' };

  it('counts the client and the day in one batch, writing no chat row', async () => {
    const db = new FakeD1();
    expect(await reserveContactSlot(db.asBinding(), input)).toEqual({ status: 'reserved' });
    expect(db.executed).toEqual([
      { sql: UPSERT_QUOTA_SQL, args: [Date.UTC(2026, 10, 2), 'contact-k1'] },
      { sql: UPSERT_CONTACT_TOTAL_SQL, args: [Date.UTC(2026, 10, 2), CONTACT_TOTAL_KEY, 'contact-k1', 2] },
    ]);
    expect(db.rows).toHaveLength(0);
  });

  it('caps the client first, then the day', async () => {
    const db = new FakeD1();
    await reserveContactSlot(db.asBinding(), input);
    await reserveContactSlot(db.asBinding(), input);
    expect(await reserveContactSlot(db.asBinding(), input)).toEqual({ status: 'capped', scope: 'client' });
    expect(await reserveContactSlot(db.asBinding(), { ...input, quotaKey: 'contact-k2' })).toEqual({ status: 'reserved' });
    expect(await reserveContactSlot(db.asBinding(), { ...input, quotaKey: 'contact-k3' })).toEqual({ status: 'capped', scope: 'global' });
  });

  it('leaves the day total alone for a client over its cap', async () => {
    const db = new FakeD1();
    for (let i = 0; i < 5; i++) await reserveContactSlot(db.asBinding(), input);
    expect(db.quota.find((q) => q.key === 'contact-k1')?.n).toBe(5);
    expect(db.quota.find((q) => q.key === CONTACT_TOTAL_KEY)?.n).toBe(2);
  });

  it('throws on a D1 error so the caller fails closed', async () => {
    const db = new FakeD1();
    db.fail = true;
    await expect(reserveContactSlot(db.asBinding(), input)).rejects.toThrow();
  });
});
