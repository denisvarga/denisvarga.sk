import { describe, expect, it } from 'vitest';
import { MAX_ASSISTANT_CONTENT, MAX_MESSAGES, MAX_TOTAL, MAX_USER_CONTENT } from '../../shared/ask-contract';
import {
  chatReducer,
  initialChatState,
  requestMessages,
  transcriptMessages,
  type ChatAction,
  type ChatMessage,
  type ChatState,
} from './chat-reducer';

const run = (actions: readonly ChatAction[], from: ChatState = initialChatState) => actions.reduce(chatReducer, from);

const exchange = (q: string, a: string, sig?: string): ChatAction[] => [
  { type: 'ask', text: q },
  { type: 'reply', text: a, sig },
];

describe('chatReducer', () => {
  it('appends a trimmed question, clears the input and starts loading', () => {
    const state = run([
      { type: 'input', value: '  Hello  ' },
      { type: 'ask', text: '  Hello  ' },
    ]);
    expect(state.messages).toEqual([{ id: 1, role: 'user', text: 'Hello', failed: false }]);
    expect(state.input).toBe('');
    expect(state.loading).toBe(true);
  });

  it('ignores empty questions and questions while loading', () => {
    const typed = run([{ type: 'input', value: 'draft' }]);
    expect(chatReducer(typed, { type: 'ask', text: '   ' })).toBe(typed);
    const loading = run([{ type: 'ask', text: 'first' }]);
    expect(chatReducer(loading, { type: 'ask', text: 'second' })).toBe(loading);
  });

  it('types the reply and marks failures', () => {
    const replied = run(exchange('q', 'a'));
    expect(replied.loading).toBe(false);
    expect(replied.typingId).toBe(2);
    expect(replied.messages[1]).toEqual({ id: 2, role: 'assistant', text: 'a', failed: false });
    const failed = run([{ type: 'ask', text: 'q' }, { type: 'fail', text: 'error copy', retryable: true }]);
    expect(failed.messages[1]).toEqual({ id: 2, role: 'assistant', text: 'error copy', failed: true, retryable: true });
    expect(failed.typingId).toBe(2);
    const final = run([{ type: 'ask', text: 'q' }, { type: 'fail', text: 'done for today', retryable: false }]);
    expect(final.messages[1]).toEqual({ id: 2, role: 'assistant', text: 'done for today', failed: true });
  });

  it('retries a failed reply: drops it with its question, asks the question again and keeps the draft', () => {
    const failed = run([...exchange('q1', 'a1'), { type: 'ask', text: 'q2' }, { type: 'fail', text: 'error copy', retryable: true }, { type: 'input', value: 'draft' }]);
    const retried = chatReducer(failed, { type: 'retry', id: 4 });
    expect(retried.messages.map((m) => m.text)).toEqual(['q1', 'a1', 'q2']);
    expect(retried.messages.at(-1)).toEqual({ id: 5, role: 'user', text: 'q2', failed: false });
    expect(retried).toMatchObject({ loading: true, typingId: null, nextId: 6, input: 'draft' });
  });

  it('ignores a retry while loading, of a reply that offers none, and of an unknown id', () => {
    const final = run([{ type: 'ask', text: 'q' }, { type: 'fail', text: 'done', retryable: false }]);
    expect(chatReducer(final, { type: 'retry', id: 2 })).toBe(final);
    expect(chatReducer(final, { type: 'retry', id: 99 })).toBe(final);
    const failed = run([{ type: 'ask', text: 'q' }, { type: 'fail', text: 'error', retryable: true }, { type: 'ask', text: 'next' }]);
    expect(chatReducer(failed, { type: 'retry', id: 2 })).toBe(failed);
  });

  it('stores the reply signature, and none when the server sent none', () => {
    expect(run(exchange('q', 'a', 'sig-a')).messages[1]).toEqual({ id: 2, role: 'assistant', text: 'a', failed: false, sig: 'sig-a' });
    expect(run(exchange('q', 'a')).messages[1]).not.toHaveProperty('sig');
  });

  it('ignores replies that arrive without a pending question', () => {
    expect(chatReducer(initialChatState, { type: 'reply', text: 'late' })).toBe(initialChatState);
  });

  it('a new question completes the running typewriter', () => {
    const typing = run(exchange('q1', 'long answer'));
    expect(typing.typingId).not.toBeNull();
    expect(chatReducer(typing, { type: 'ask', text: 'q2' }).typingId).toBeNull();
  });
});

const long = (id: number, role: ChatMessage['role']): ChatMessage => ({ id, role, text: 'x'.repeat(MAX_ASSISTANT_CONTENT), failed: false });

describe('requestMessages', () => {
  it('sends at most the last eight turns, starting at a question and ending with the new one', () => {
    const history = run(Array.from({ length: 6 }, (_, i) => exchange(`q${i}`, `a${i}`)).flat()).messages;
    const payload = requestMessages(history, ' next ');
    // The last eight would start with the answer a2, whose question q2 no longer fits.
    expect(payload).toHaveLength(MAX_MESSAGES - 1);
    expect(payload.at(-1)).toEqual({ role: 'user', content: 'next' });
    expect(payload[0]).toEqual({ role: 'user', content: 'q3' });
  });

  it('sends assistant turns back with their signature, unsigned ones without', () => {
    const history = run([...exchange('q1', 'a1', 'sig-1'), ...exchange('q2', 'a2')]).messages;
    expect(requestMessages(history, 'q3')).toStrictEqual([
      { role: 'user', content: 'q1' },
      { role: 'assistant', content: 'a1', sig: 'sig-1' },
      { role: 'user', content: 'q2' },
      { role: 'assistant', content: 'a2' },
      { role: 'user', content: 'q3' },
    ]);
  });

  it('excludes failed replies together with their questions', () => {
    const history = run([...exchange('q1', 'a1'), { type: 'ask', text: 'q2' }, { type: 'fail', text: 'error copy', retryable: true }]).messages;
    expect(requestMessages(history, 'q2').map((m) => m.content)).toEqual(['q1', 'a1', 'q2']);
  });

  it('clamps each turn to its role limit, dropping the signature of a clamped reply', () => {
    const history = run(exchange('u'.repeat(900), 'a'.repeat(3000), 'sig-long')).messages;
    const [user, assistant] = requestMessages(history, 'q');
    expect(user?.content).toHaveLength(MAX_USER_CONTENT);
    expect(assistant?.content).toHaveLength(MAX_ASSISTANT_CONTENT);
    expect(assistant).not.toHaveProperty('sig');
    const exact = run(exchange('q', 'a'.repeat(MAX_ASSISTANT_CONTENT), 'sig-max')).messages;
    expect(requestMessages(exact, 'next')[1]).toHaveProperty('sig', 'sig-max');
  });

  it('drops the oldest turns while the total exceeds the limit, never leaving a reply first', () => {
    // Alternating turns cannot exceed MAX_TOTAL within eight messages; consecutive long replies can.
    const history = [long(1, 'assistant'), long(2, 'assistant'), long(3, 'assistant'), long(4, 'user'), long(5, 'assistant'), long(6, 'assistant'), long(7, 'assistant')];
    const payload = requestMessages(history, 'q');
    const total = payload.reduce((sum, m) => sum + m.content.length, 0);
    expect(total).toBeLessThanOrEqual(MAX_TOTAL);
    // The total drops the first reply, then the two replies left before the question go as well.
    expect(payload.map((m) => m.role)).toEqual(['user', 'assistant', 'assistant', 'assistant', 'user']);
    expect(payload.at(-1)?.content).toBe('q');
  });

  it('keeps the question alone when the history holds only replies', () => {
    const history: ChatMessage[] = [{ id: 1, role: 'assistant', text: 'orphan', failed: false }];
    expect(requestMessages(history, 'q')).toEqual([{ role: 'user', content: 'q' }]);
  });
});

const proposal = { message: 'I need a shop.', name: null, email: 'jana@firma.sk' };
const drafted = () =>
  run([...exchange('q1', 'a1', 's1'), { type: 'ask', text: 'Yes' }, { type: 'reply', text: 'Draft message for Denis:\n\nI need a shop.', sig: 's2', draft: proposal }]);

describe('contact drafts', () => {
  it('stores a proposed message as a pending draft on its reply', () => {
    expect(drafted().messages[3]).toEqual({
      id: 4,
      role: 'assistant',
      text: 'Draft message for Denis:\n\nI need a shop.',
      failed: false,
      sig: 's2',
      draft: { proposal, status: 'pending' },
    });
    expect(run(exchange('q', 'a')).messages[1]).not.toHaveProperty('draft');
  });

  it('moves through sending, failed and sent, keeping the address and the signed confirmation', () => {
    const sending = chatReducer(drafted(), { type: 'draft', id: 4, status: 'sending' });
    expect(sending.messages[3]?.draft?.status).toBe('sending');
    const failed = chatReducer(sending, { type: 'failed', id: 4, failure: 'failed' });
    expect(failed.messages[3]?.draft).toMatchObject({ status: 'failed', failure: 'failed' });
    const again = chatReducer(failed, { type: 'draft', id: 4, status: 'sending' });
    expect(again.messages[3]?.draft).not.toHaveProperty('failure');
    const sent = chatReducer(again, { type: 'sent', id: 4, email: 'jana@firma.sk', reply: 'Message sent.', sig: 's3' });
    expect(sent.messages[3]?.draft).toEqual({ proposal, status: 'sent', sentTo: 'jana@firma.sk', confirmation: { text: 'Message sent.', sig: 's3' } });
  });

  it.each(['dailyCap', 'rateLimited', 'unavailable', 'timeout'] as const)('ends the draft after a %s failure', (failure) => {
    const sending = chatReducer(drafted(), { type: 'draft', id: 4, status: 'sending' });
    const failed = chatReducer(sending, { type: 'failed', id: 4, failure });
    expect(failed.messages[3]?.draft).toMatchObject({ status: 'failed', failure });
    expect(chatReducer(failed, { type: 'draft', id: 4, status: 'sending' })).toBe(failed);
    expect(chatReducer(failed, { type: 'draft', id: 4, status: 'cancelled' })).toBe(failed);
  });

  it('ignores moves a status does not allow and unknown ids', () => {
    const pending = drafted();
    expect(chatReducer(pending, { type: 'sent', id: 4, email: 'x@y.sk', reply: 'r', sig: 's' })).toBe(pending);
    expect(chatReducer(pending, { type: 'failed', id: 4, failure: 'failed' })).toBe(pending);
    expect(chatReducer(pending, { type: 'draft', id: 2, status: 'sending' })).toBe(pending);
    expect(chatReducer(pending, { type: 'draft', id: 99, status: 'sending' })).toBe(pending);
    const cancelled = chatReducer(pending, { type: 'draft', id: 4, status: 'cancelled' });
    expect(cancelled.messages[3]?.draft?.status).toBe('cancelled');
    expect(chatReducer(cancelled, { type: 'draft', id: 4, status: 'sending' })).toBe(cancelled);
    const sending = chatReducer(pending, { type: 'draft', id: 4, status: 'sending' });
    expect(chatReducer(sending, { type: 'draft', id: 4, status: 'cancelled' })).toBe(sending);
  });

  it('sends the signed draft and, once sent, the signed confirmation back as assistant turns', () => {
    const sending = chatReducer(drafted(), { type: 'draft', id: 4, status: 'sending' });
    const sent = chatReducer(sending, { type: 'sent', id: 4, email: 'jana@firma.sk', reply: 'Message sent.', sig: 's3' });
    expect(requestMessages(sent.messages, 'Thanks')).toStrictEqual([
      { role: 'user', content: 'q1' },
      { role: 'assistant', content: 'a1', sig: 's1' },
      { role: 'user', content: 'Yes' },
      { role: 'assistant', content: 'Draft message for Denis:\n\nI need a shop.', sig: 's2' },
      { role: 'assistant', content: 'Message sent.', sig: 's3' },
      { role: 'user', content: 'Thanks' },
    ]);
    expect(JSON.stringify(requestMessages(sent.messages, 'Thanks'))).not.toContain('jana@firma.sk');
  });

  it('builds the contact transcript up to the draft, leaving out later turns', () => {
    const later = run([{ type: 'ask', text: 'Another question' }, { type: 'reply', text: 'Another answer', sig: 's4' }], drafted());
    expect(transcriptMessages(later.messages, 4)).toStrictEqual([
      { role: 'user', content: 'q1' },
      { role: 'assistant', content: 'a1', sig: 's1' },
      { role: 'user', content: 'Yes' },
      { role: 'assistant', content: 'Draft message for Denis:\n\nI need a shop.', sig: 's2' },
    ]);
    expect(transcriptMessages(later.messages, 99)).toEqual([]);
  });
});
