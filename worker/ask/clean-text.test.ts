import { describe, expect, it } from 'vitest';
import { cleanContent, plainReply } from './clean-text';

describe('cleanContent', () => {
  it('keeps newlines and tabs, normalises CRLF and drops other controls', () => {
    expect(cleanContent('a\r\nb\tc\u0000\u001b\u009fd')).toBe('a\nb\tcd');
  });

  it('strips terminal escape sequences down to their printable remainder', () => {
    expect(cleanContent('\u001b[31mred\u001b[0m\u0007')).toBe('[31mred[0m');
  });

  it('is idempotent, so a cleaned reply survives a second pass unchanged', () => {
    const once = cleanContent('  Ahoj\r\n\u0000svet\t ');
    expect(cleanContent(once)).toBe(once);
  });
});

describe('plainReply', () => {
  const en = String.fromCodePoint(0x2013);
  const em = String.fromCodePoint(0x2014);

  it('turns en and em dashes, spaced or not, into a spaced hyphen', () => {
    expect(plainReply(`nevyšiel ${em} Denis`)).toBe('nevyšiel - Denis');
    expect(plainReply(`work${em}Denis`)).toBe('work - Denis');
    expect(plainReply(`2018${en}2026`)).toBe('2018 - 2026');
  });

  it('leaves plain hyphens alone', () => {
    expect(plainReply('e-shop, full-stack, 1-4 vety')).toBe('e-shop, full-stack, 1-4 vety');
  });

  it('drops bold markers but keeps the words and lone asterisks', () => {
    expect(plainReply('**Vlastné projekty:** Routie, Denva')).toBe('Vlastné projekty: Routie, Denva');
    expect(plainReply('5 * 3')).toBe('5 * 3');
  });
});

