import { describe, expect, it } from 'vitest';
import { MAX_ASSISTANT_CONTENT, MAX_MESSAGES, MAX_TOTAL, MAX_USER_CONTENT } from '../../shared/ask-contract';
import {
  chatReducer,
  initialChatState,
  requestMessages,
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
    const failed = run([{ type: 'ask', text: 'q' }, { type: 'fail', text: 'error copy' }]);
    expect(failed.messages[1]).toMatchObject({ text: 'error copy', failed: true });
    expect(failed.typingId).toBe(2);
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

describe('requestMessages', () => {
  it('sends at most the last eight turns, ending with the question', () => {
    const history = run(Array.from({ length: 6 }, (_, i) => exchange(`q${i}`, `a${i}`)).flat()).messages;
    const payload = requestMessages(history, ' next ');
    expect(payload).toHaveLength(MAX_MESSAGES);
    expect(payload.at(-1)).toEqual({ role: 'user', content: 'next' });
    expect(payload[0]).toEqual({ role: 'assistant', content: 'a2' });
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
    const history = run([...exchange('q1', 'a1'), { type: 'ask', text: 'q2' }, { type: 'fail', text: 'error copy' }]).messages;
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

  it('drops the oldest turns while the total exceeds the limit', () => {
    // Alternating turns cannot exceed MAX_TOTAL within eight messages; consecutive long replies can.
    const history: ChatMessage[] = Array.from({ length: 7 }, (_, i) => ({
      id: i + 1,
      role: 'assistant',
      text: 'a'.repeat(MAX_ASSISTANT_CONTENT),
      failed: false,
    }));
    const payload = requestMessages(history, 'q');
    const total = payload.reduce((sum, m) => sum + m.content.length, 0);
    expect(total).toBeLessThanOrEqual(MAX_TOTAL);
    expect(payload).toHaveLength(Math.floor((MAX_TOTAL - 1) / MAX_ASSISTANT_CONTENT) + 1);
    expect(payload.at(-1)?.content).toBe('q');
  });
});
