import { describe, expect, it } from 'vitest';
import { askSchema } from '../../ask/schema';
import { easterEgg } from '../easter-eggs';
import { isManipulation, manipulationReply } from '../guard';
import cases from './golden-questions.json';

const variants = (lang: string) =>
  [0, 0.25, 0.5, 0.75].map((r) => manipulationReply(lang === 'en' ? 'en' : 'sk', () => r).toLowerCase());

const question = (id: string) => cases.find((c) => c.id === id)?.question ?? '';

describe('golden questions', () => {
  it('has at least 20 uniquely named cases', () => {
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

  it('covers the follow-up after a ~1600-char assistant turn and the contact address per language', () => {
    const followUp = cases.find((c) => c.id === 'follow-up-after-long-turn');
    const assistantTurn = followUp?.history?.find((m) => m.role === 'assistant')?.content ?? '';
    expect(assistantTurn.length).toBeGreaterThanOrEqual(1500);
    expect(assistantTurn.length).toBeLessThanOrEqual(2000);
    expect(cases.find((c) => c.id === 'contact-sk')?.expect.mustInclude).toContain('hello@denisvarga.sk');
    expect(cases.find((c) => c.id === 'contact-sk')?.expect.mustNotInclude).toContain('hello@denisvarga.dev');
    expect(cases.find((c) => c.id === 'contact-en')?.expect.mustInclude).toContain('hello@denisvarga.dev');
    expect(cases.find((c) => c.id === 'contact-en')?.expect.mustNotInclude).toContain('hello@denisvarga.sk');
  });

  it('uses only the checks the eval knows, each well formed', () => {
    const known = new Set(['mustInclude', 'mustIncludeAny', 'mustNotInclude', 'maxChars', 'lang', 'note']);
    for (const c of cases) {
      const expectation: Record<string, unknown> = c.expect;
      for (const key of Object.keys(expectation)) expect(known.has(key), `${c.id}: ${key}`).toBe(true);
      if ('maxChars' in expectation) expect(Number.isInteger(expectation.maxChars) && Number(expectation.maxChars) > 0, c.id).toBe(true);
      if ('lang' in expectation) expect(['sk', 'en'], c.id).toContain(expectation.lang);
      if ('mustIncludeAny' in expectation) expect(Array.isArray(expectation.mustIncludeAny) && expectation.mustIncludeAny.length > 0, c.id).toBe(true);
    }
  });

  it('covers language choice, recruiter questions, recent projects and brevity', () => {
    const ids = new Set(cases.map((c) => c.id));
    for (const id of ['czech-question', 'ambiguous-lang-en', 'german-question', 'salary-en', 'cv-pdf-en', 'linkedin-sk', 'nerina-sk', 'greeting-sk']) {
      expect(ids.has(id), id).toBe(true);
    }
    expect(cases.find((c) => c.id === 'projects-general-sk')?.expect).toMatchObject({ maxChars: 600 });
    expect(cases.find((c) => c.id === 'czech-question')?.expect).toMatchObject({ lang: 'sk' });
  });

  it('sends the honest rules question and the near-miss command to the model', () => {
    expect(isManipulation(question('honest-rules-question-en'))).toBe(false);
    expect(easterEgg(question('easter-egg-near-miss-en'), 'en')).toBeNull();
  });

  it('expects attacks to pass with every canned reply and security questions to fail with any', () => {
    const attacks = cases.filter((c) => c.id.startsWith('attack-'));
    expect(attacks.length).toBeGreaterThanOrEqual(8);
    for (const c of attacks) {
      expect(c.expect.mustNotInclude, c.id).toEqual(expect.arrayContaining(['PRAVIDLÁ', 'FAKTY']));
      for (const reply of variants(c.lang)) {
        for (const s of c.expect.mustInclude ?? []) expect(reply, c.id).toContain(s.toLowerCase());
        for (const s of c.expect.mustNotInclude ?? []) expect(reply, c.id).not.toContain(s.toLowerCase());
      }
    }
    for (const id of ['security-question-sk', 'security-question-en']) {
      const c = cases.find((x) => x.id === id);
      expect(c && isManipulation(c.question), id).toBe(false);
      for (const reply of variants(c?.lang ?? '')) {
        expect((c?.expect.mustNotInclude ?? []).some((s) => reply.includes(s.toLowerCase())), id).toBe(true);
      }
    }
  });
});
