import { describe, expect, it } from 'vitest';
import { askSchema } from '../../ask/schema';
import cases from './golden-questions.json';

describe('golden questions', () => {
  it('has about 22 uniquely named cases', () => {
    expect(cases.length).toBeGreaterThanOrEqual(20);
    expect(new Set(cases.map((c) => c.id)).size).toBe(cases.length);
  });

  it('every case fits the live request limits', () => {
    for (const c of cases) {
      const messages = [...(c.history ?? []), { role: 'user', content: c.question }];
      const parsed = askSchema.safeParse({ messages, lang: c.lang, turnstileToken: 'eval' });
      expect(parsed.success, c.id).toBe(true);
    }
  });

  it('covers the follow-up after a ~1600-char assistant turn and the new contact address', () => {
    const followUp = cases.find((c) => c.id === 'follow-up-after-long-turn');
    const assistantTurn = followUp?.history?.find((m) => m.role === 'assistant')?.content ?? '';
    expect(assistantTurn.length).toBeGreaterThanOrEqual(1500);
    expect(assistantTurn.length).toBeLessThanOrEqual(2000);
    expect(cases.find((c) => c.id === 'contact-sk')?.expect.mustInclude).toContain('hello@denisvarga.sk');
  });
});
