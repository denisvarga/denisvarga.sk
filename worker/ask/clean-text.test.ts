import { describe, expect, it } from 'vitest';
import { cleanContent } from './clean-text';

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
