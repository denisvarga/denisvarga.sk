import { describe, expect, it } from 'vitest';
import { cleanContent } from '../ask/clean-text';
import { draftReply, SENT_REPLY } from './draft-text';

describe('contact reply texts', () => {
  it('puts a neutral per-language lead before the proposed message', () => {
    expect(draftReply('sk', 'Chcem e-shop.')).toBe('Návrh správy pre Denisa:\n\nChcem e-shop.');
    expect(draftReply('en', 'I need a shop.')).toBe('Draft message for Denis:\n\nI need a shop.');
  });

  it('survives the history schema unchanged, so its signature still verifies', () => {
    for (const text of [draftReply('sk', 'Chcem e-shop.\nĎakujem.'), SENT_REPLY.sk, SENT_REPLY.en]) {
      expect(cleanContent(text)).toBe(text);
    }
  });

  it('confirms a sent message without visitor details and never claims the model sent it', () => {
    expect(SENT_REPLY.sk.startsWith('Správa odoslaná.')).toBe(true);
    expect(SENT_REPLY.en.startsWith('Message sent.')).toBe(true);
    for (const text of [...Object.values(SENT_REPLY), draftReply('sk', 'x'), draftReply('en', 'x')]) {
      expect(text).not.toMatch(/@|odoslal som|I sent|pošlem/i);
    }
  });
});
