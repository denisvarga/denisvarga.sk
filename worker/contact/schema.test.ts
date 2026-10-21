import { describe, expect, it } from 'vitest';
import { contactEmail, oneLine, parseDraftArguments } from './schema';

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
    for (const ok of ['jana@firma.sk', 'o.neil+web@mail.co.uk', "o'neil@x.io"]) expect(contactEmail.safeParse(ok).success, ok).toBe(true);
    for (const bad of ['jana@firma', 'a b@c.sk', 'a@b.sk\r\nBcc: x@y.sk', 'a@b.sk, c@d.sk', '<a@b.sk>', `${'a'.repeat(250)}@b.sk`]) {
      expect(contactEmail.safeParse(bad).success, bad).toBe(false);
    }
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
