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
  cachedTokens: 4,
  cacheWriteTokens: 3,
  httpStatus: 200,
});

describe('chat log hygiene', () => {
  it('stores question and answer without control characters, keeping newlines and tabs', async () => {
    const db = new FakeD1();
    const reservation = await reserveSlot(db.asBinding(), { now: Date.now(), lang: 'sk', question: 'Kto\u001b[2J je\tDenis?\u0007', cap: 10, clientCap: 10, quotaKey: 'k' });
    if (reservation.status !== 'reserved') throw new Error('expected a reserved slot');
    await finalizeRow(db.asBinding(), reservation.id, result('Denis\u001b]0;pwned\u0007 robí\nweby.\u009b'), 42, 'v-test');
    expect(db.rows[0]).toMatchObject({ question: 'Kto[2J je\tDenis?', answer: 'Denis]0;pwned robí\nweby.', outcome: 'ok' });
  });

  it('keeps a missing answer as NULL', async () => {
    const db = new FakeD1();
    const reservation = await reserveSlot(db.asBinding(), { now: Date.now(), lang: 'en', question: 'Hi', cap: 10, clientCap: 10, quotaKey: 'k' });
    if (reservation.status !== 'reserved') throw new Error('expected a reserved slot');
    await finalizeRow(db.asBinding(), reservation.id, result(null), 7, 'v-test');
    expect(db.rows[0]).toMatchObject({ answer: null, outcome: 'error' });
  });

  it("redacts visitor emails and phone numbers in the question and the answer, keeping Denis's", async () => {
    const db = new FakeD1();
    const question = 'Som jana@firma.sk, tel. 0905 123 456. Kontakt na Denisa?';
    const reservation = await reserveSlot(db.asBinding(), { now: Date.now(), lang: 'sk', question, cap: 10, clientCap: 10, quotaKey: 'k' });
    if (reservation.status !== 'reserved') throw new Error('expected a reserved slot');
    await finalizeRow(db.asBinding(), reservation.id, result('Jana (jana@firma.sk), Denis je na hello@denisvarga.sk a +421 902 074 830.'), 9, 'v-test');
    expect(db.rows[0]).toMatchObject({
      question: 'Som [email], tel. [telefón]. Kontakt na Denisa?',
      answer: 'Jana ([email]), Denis je na hello@denisvarga.sk a +421 902 074 830.',
    });
  });

  it('logs a proposed contact message as ok with reply_kind handoff_draft and never stores the draft', async () => {
    const db = new FakeD1();
    const reservation = await reserveSlot(db.asBinding(), { now: Date.now(), lang: 'sk', question: 'Áno, pripravte správu.', cap: 10, clientCap: 10, quotaKey: 'k' });
    if (reservation.status !== 'reserved') throw new Error('expected a reserved slot');
    const handoff: ModelResult = {
      ...result('Návrh správy pre Denisa:\n\nChcem e-shop.'),
      outcome: 'handoff',
      draft: { message: 'Chcem e-shop.', name: 'Jana', email: 'jana@firma.sk' },
    };
    await finalizeRow(db.asBinding(), reservation.id, handoff, 9, 'v-test');
    expect(db.rows[0]).toMatchObject({ answer: null, outcome: 'ok', reply_kind: 'handoff_draft', model: 'gpt-6-luna' });
    expect(JSON.stringify(db.rows)).not.toMatch(/Chcem e-shop|Jana|jana@firma/);

    await finalizeRow(db.asBinding(), reservation.id, result('Denis robí weby.'), 9, 'v-test');
    expect(db.rows[0]).toMatchObject({ answer: 'Denis robí weby.', outcome: 'ok', reply_kind: null });
  });

  it('records the prompt revision and the cache reads and writes with the answer', async () => {
    const db = new FakeD1();
    const reservation = await reserveSlot(db.asBinding(), { now: Date.now(), lang: 'sk', question: 'Kto je Denis?', cap: 10, clientCap: 10, quotaKey: 'k' });
    if (reservation.status !== 'reserved') throw new Error('expected a reserved slot');
    await finalizeRow(db.asBinding(), reservation.id, result('Denis robí weby.'), 9, '2026-10-21.1');
    expect(db.rows[0]).toMatchObject({ prompt_version: '2026-10-21.1', input_tokens: 10, cached_tokens: 4, cache_write_tokens: 3 });
  });
});
