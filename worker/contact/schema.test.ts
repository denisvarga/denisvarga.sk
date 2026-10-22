import { describe, expect, it } from 'vitest';
import { CONTACT_EMAIL_PATTERN } from '../../shared/contact-contract';
import { contactEmail, contactSchema, oneLine, parseDraftArguments } from './schema';

const EM_DASH = String.fromCodePoint(0x2014);
const args = (value: unknown) => JSON.stringify(value);

describe('oneLine', () => {
  it('turns CR, LF, tabs and line separators into single spaces and drops control characters', () => {
    expect(oneLine('A\r\nBcc: x')).toBe('A Bcc: x');
    expect(oneLine(` Jana\t${String.fromCodePoint(0x2028)}Nováková${String.fromCodePoint(7)} `)).toBe('Jana Nováková');
    expect(oneLine(`Ján${String.fromCodePoint(0x202e)}evil`)).toBe('Jánevil');
  });
});

describe('contactEmail', () => {
  it('accepts ordinary addresses and rejects anything that is not one address', () => {
    for (const ok of ['jana@firma.sk', 'o.neil+web@mail.co.uk', "o'neil@x.io", 'a@b-c.d-e.sk', `${'a'.repeat(64)}@b.sk`]) {
      expect(contactEmail.safeParse(ok).success, ok).toBe(true);
    }
    for (const bad of ['jana@firma', 'a b@c.sk', 'a@b.sk\r\nBcc: x@y.sk', 'a@b.sk, c@d.sk', '<a@b.sk>', `${'a'.repeat(250)}@b.sk`]) {
      expect(contactEmail.safeParse(bad).success, bad).toBe(false);
    }
  });

  it('rejects stray dots in the local part and malformed domain labels', () => {
    for (const bad of [
      '.jana@firma.sk',
      'jana.@firma.sk',
      'ja..na@firma.sk',
      `${'a'.repeat(65)}@b.sk`,
      'jana@-firma.sk',
      'jana@firma-.sk',
      'jana@firma..sk',
      'jana@.firma.sk',
      `jana@${'a'.repeat(64)}.sk`,
      'jana@firma.s',
      'jana@firma.sk1',
    ]) {
      expect(contactEmail.safeParse(bad).success, bad).toBe(false);
    }
  });

  it('is valid under the v flag browsers compile the pattern attribute with', () => {
    const browser = new RegExp(`^(?:${CONTACT_EMAIL_PATTERN})$`, 'v');
    expect(browser.test('jana@firma.sk')).toBe(true);
    expect(browser.test('ja..na@firma.sk')).toBe(false);
  });
});

describe('parseDraftArguments', () => {
  it('returns the cleaned draft', () => {
    expect(parseDraftArguments(args({ message: ` Chcem web ${EM_DASH} rýchlo. `, name: ' Jana ', email: ' jana@firma.sk ' }))).toEqual({
      message: 'Chcem web - rýchlo.',
      name: 'Jana',
      email: 'jana@firma.sk',
    });
  });

  it('rejects malformed JSON, a wrong shape and an empty or over-long message', () => {
    for (const raw of ['', '{', args([]), args({ message: 'x' }), args({ message: 'x', name: 1, email: null }), args({ message: ' ', name: null, email: null }), args({ message: 'x'.repeat(601), name: null, email: null })]) {
      expect(parseDraftArguments(raw), raw.slice(0, 40)).toBeNull();
    }
  });

  it('keeps a 600-character message', () => {
    expect(parseDraftArguments(args({ message: 'x'.repeat(600), name: null, email: null }))?.message).toHaveLength(600);
  });
});

const request = (extra: Record<string, unknown> = {}) => ({
  lang: 'sk',
  turnstileToken: 't',
  name: 'Jana',
  email: 'jana@firma.sk',
  message: 'Správa',
  messages: [],
  ...extra,
});

describe('contactSchema', () => {
  it('reduces the name to one line, trims the email and keeps line breaks in the message', () => {
    const parsed = contactSchema.parse(request({ name: ' A\r\nBcc: x ', email: ' jana@firma.sk ', message: 'Riadok 1\r\nRiadok 2\u0007' }));
    expect(parsed).toMatchObject({ name: 'A Bcc: x', email: 'jana@firma.sk', message: 'Riadok 1\nRiadok 2' });
  });

  it('accepts a conversation that ends with an assistant turn and drops a malformed signature only', () => {
    const parsed = contactSchema.parse(request({ messages: [{ role: 'user', content: 'Áno.' }, { role: 'assistant', content: 'Návrh', sig: 'x'.repeat(200) }] }));
    expect(parsed.messages).toEqual([{ role: 'user', content: 'Áno.' }, { role: 'assistant', content: 'Návrh', sig: undefined }]);
  });

  it('rejects a history over the total length', () => {
    const messages = Array.from({ length: 8 }, () => ({ role: 'assistant', content: 'x'.repeat(1600) }));
    expect(contactSchema.safeParse(request({ messages })).success).toBe(false);
  });
});
