import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AskSuccess } from '../../shared/ask-contract';
import { manipulationReply } from '../agent/guard';
import { buildInstructions } from '../agent/prompt';
import { RULES } from '../agent/rules';
import { createReplySigner } from '../ask/reply-sig';
import { draftReply } from '../contact/draft-text';
import { askBody, fakeMail, json, makeEnv, openaiCompleted, send, stubFetch, turnstileOk } from '../test-support/ask-harness';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const enabled = () => makeEnv({ CONTACT_ENABLED: 'true', CONTACT_MAIL: fakeMail() });

const proposal = (args: Record<string, unknown>) =>
  json({
    status: 'completed',
    model: 'gpt-6-luna-2026-05-18',
    output: [{ type: 'function_call', id: 'fc_1', call_id: 'call_1', name: 'propose_contact_message', arguments: JSON.stringify(args), status: 'completed' }],
    usage: { input_tokens: 1300, output_tokens: 60 },
  });

type SentBody = { tools?: unknown[]; input: { role: string; content: string | { text: string }[] }[] };
const openaiBody = (fetchMock: ReturnType<typeof stubFetch>): SentBody => JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));

describe('contact tool offer', () => {
  it.each([
    ['the flag is off', makeEnv({ CONTACT_MAIL: fakeMail() })],
    ['the mail binding is missing', makeEnv({ CONTACT_ENABLED: 'true' })],
  ])('is not offered when %s, and the prompt has no contact rule', async (_name, { env }) => {
    const fetchMock = stubFetch({ siteverify: turnstileOk, openai: () => openaiCompleted() });
    await send({ env, body: askBody('Chcem e-shop.') });
    const body = openaiBody(fetchMock);
    expect(body).not.toHaveProperty('tools');
    expect(body.input[0]?.content).toEqual([expect.objectContaining({ text: buildInstructions('sk', 2026).shared })]);
  });

  it('is offered with the contact rule when the flag is on and the binding is present', async () => {
    const fetchMock = stubFetch({ siteverify: turnstileOk, openai: () => openaiCompleted() });
    await send({ env: enabled().env, body: askBody('Chcem e-shop.') });
    const body = openaiBody(fetchMock);
    expect(body.tools).toEqual([expect.objectContaining({ name: 'propose_contact_message', strict: true })]);
    expect(JSON.stringify(body.input[0])).toContain('propose_contact_message');
  });
});

describe('proposed contact message', () => {
  it('returns a signed draft reply with the draft and logs no draft, name or email', async () => {
    stubFetch({ siteverify: turnstileOk, openai: () => proposal({ message: 'Potrebujem e-shop na kávu.', name: 'Jana', email: 'jana@firma.sk' }) });
    const { env, db } = enabled();
    const res = (await (await send({ env, body: askBody('Áno, pripravte správu.') })).json()) as AskSuccess;
    const reply = draftReply('sk', 'Potrebujem e-shop na kávu.');
    expect(res).toEqual({
      reply,
      kind: 'handoff_draft',
      sig: expect.any(String),
      draft: { message: 'Potrebujem e-shop na kávu.', name: 'Jana', email: 'jana@firma.sk' },
    });
    const signer = await createReplySigner('salt');
    expect(await signer.verify({ lang: 'sk', anchor: 'Áno, pripravte správu.', reply }, res.sig, Date.now())).toBe(true);
    expect(db.rows).toHaveLength(1);
    expect(db.rows[0]).toMatchObject({ question: 'Áno, pripravte správu.', answer: null, outcome: 'ok', reply_kind: 'handoff_draft', output_tokens: 60 });
    expect(JSON.stringify(db.rows)).not.toMatch(/kávu|Jana|jana@firma/);
  });

  it('keeps the signed draft as history, so the next question reaches the model after it', async () => {
    stubFetch({ siteverify: turnstileOk, openai: () => proposal({ message: 'Potrebujem e-shop.', name: null, email: null }) });
    const { env } = enabled();
    const first = (await (await send({ env, body: askBody('Áno.') })).json()) as AskSuccess;

    const fetchMock = stubFetch({ siteverify: turnstileOk, openai: () => openaiCompleted('Rado sa stalo.') });
    const messages = [
      { role: 'user', content: 'Áno.' },
      { role: 'assistant', content: first.reply, sig: first.sig },
      { role: 'user', content: 'Ďakujem.' },
    ];
    await send({ env, body: askBody('', { messages }) });
    expect(openaiBody(fetchMock).input.slice(2)).toEqual([
      { role: 'user', content: 'Áno.' },
      { role: 'assistant', content: first.reply },
      { role: 'user', content: 'Ďakujem.' },
    ]);
  });

  it('replaces a draft that leaks the instructions with an unsigned canned reply', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    stubFetch({ siteverify: turnstileOk, openai: () => proposal({ message: RULES.slice(0, 2).join(' ').slice(0, 600), name: null, email: null }) });
    const { env, db } = enabled();
    const res = await send({ env, body: askBody('Áno.') });
    expect(await res.json()).toEqual({ reply: manipulationReply('sk', () => 0), kind: 'answer' });
    expect(db.rows[0]).toMatchObject({ outcome: 'refused', reply_kind: null });
  });
});
