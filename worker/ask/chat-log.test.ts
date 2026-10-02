import { describe, expect, it } from 'vitest';
import { FakeD1 } from '../test-support/fake-d1';
import { finalizeRow } from './chat-log';
import { reserveSlot } from './daily-cap';
import type { ModelResult } from './openai';

const result = (text: string | null): ModelResult => ({
  outcome: text === null ? 'error' : 'ok',
  text,
  responseStatus: 'completed',
  model: 'gpt-6-luna',
  inputTokens: 10,
  outputTokens: 5,
  httpStatus: 200,
});

describe('chat log hygiene', () => {
  it('stores question and answer without control characters, keeping newlines and tabs', async () => {
    const db = new FakeD1();
    const reservation = await reserveSlot(db.asBinding(), { now: Date.now(), lang: 'sk', question: 'Kto\u001b[2J je\tDenis?\u0007', cap: 10 });
    if (reservation.status !== 'reserved') throw new Error('expected a reserved slot');
    await finalizeRow(db.asBinding(), reservation.id, result('Denis\u001b]0;pwned\u0007 robí\nweby.\u009b'), 42);
    expect(db.rows[0]).toMatchObject({ question: 'Kto[2J je\tDenis?', answer: 'Denis]0;pwned robí\nweby.', outcome: 'ok' });
  });

  it('keeps a missing answer as NULL', async () => {
    const db = new FakeD1();
    const reservation = await reserveSlot(db.asBinding(), { now: Date.now(), lang: 'en', question: 'Hi', cap: 10 });
    if (reservation.status !== 'reserved') throw new Error('expected a reserved slot');
    await finalizeRow(db.asBinding(), reservation.id, result(null), 7);
    expect(db.rows[0]).toMatchObject({ answer: null, outcome: 'error' });
  });
});
