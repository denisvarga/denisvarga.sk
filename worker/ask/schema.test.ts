import { describe, expect, it } from 'vitest';
import { askSchema, cleanContent, lastUserMessage } from './schema';

const user = (content: string) => ({ role: 'user', content });
const assistant = (content: string) => ({ role: 'assistant', content });
const body = (messages: unknown[], extra: Record<string, unknown> = {}) => ({
  messages,
  lang: 'sk',
  turnstileToken: 't',
  ...extra,
});

describe('askSchema', () => {
  it('accepts a single user question', () => {
    expect(askSchema.safeParse(body([user('Ahoj')])).success).toBe(true);
  });

  it('applies role-specific limits: user 500, assistant 2000', () => {
    expect(askSchema.safeParse(body([user('x'.repeat(500))])).success).toBe(true);
    expect(askSchema.safeParse(body([user('x'.repeat(501))])).success).toBe(false);
    expect(askSchema.safeParse(body([user('a'), assistant('y'.repeat(2000)), user('b')])).success).toBe(true);
    expect(askSchema.safeParse(body([user('a'), assistant('y'.repeat(2001)), user('b')])).success).toBe(false);
  });

  it('accepts a follow-up after a 1600-char assistant turn', () => {
    const parsed = askSchema.safeParse(body([user('Projekty?'), assistant('p'.repeat(1600)), user('A Routie?')]));
    expect(parsed.success).toBe(true);
  });

  it('caps the total at 12,000 characters', () => {
    const long = Array.from({ length: 5 }, () => assistant('y'.repeat(2000)));
    const exact = [...long, assistant('y'.repeat(1998)), user('a'), user('b')];
    const over = [...long, assistant('y'.repeat(2000)), user('a'), user('b')];
    expect(askSchema.safeParse(body(exact)).success).toBe(true);
    expect(askSchema.safeParse(body(over)).success).toBe(false);
  });

  it('requires 1-8 messages ending with a user turn', () => {
    expect(askSchema.safeParse(body([])).success).toBe(false);
    expect(askSchema.safeParse(body(Array(9).fill(user('a')))).success).toBe(false);
    expect(askSchema.safeParse(body([user('a'), assistant('b')])).success).toBe(false);
  });

  it('rejects unknown roles, languages and bad tokens', () => {
    expect(askSchema.safeParse(body([{ role: 'system', content: 'x' }])).success).toBe(false);
    expect(askSchema.safeParse(body([null, user('a')])).success).toBe(false);
    expect(askSchema.safeParse(body([{ role: 'user', content: 5 }])).success).toBe(false);
    expect(askSchema.safeParse(body([user('a')], { lang: 'de' })).success).toBe(false);
    expect(askSchema.safeParse(body([user('a')], { turnstileToken: '' })).success).toBe(false);
    expect(askSchema.safeParse(body([user('a')], { turnstileToken: 't'.repeat(2049) })).success).toBe(false);
  });

  it('measures content after trimming and stripping control characters', () => {
    expect(askSchema.safeParse(body([user(' \u0000\u0007 ')])).success).toBe(false);
    const padded = askSchema.safeParse(body([user(`  ${'x'.repeat(500)}\u0000  `)]));
    expect(padded.success).toBe(true);
    if (padded.success) expect(lastUserMessage(padded.data)).toBe('x'.repeat(500));
  });
});

describe('cleanContent', () => {
  it('keeps newlines and tabs, normalises CRLF and drops other controls', () => {
    expect(cleanContent('a\r\nb\tc\u0000\u001b\u009fd')).toBe('a\nb\tcd');
  });
});
