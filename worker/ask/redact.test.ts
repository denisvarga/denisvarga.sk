import { describe, expect, it } from 'vitest';
import { redactContacts } from './redact';

const ACUTE = String.fromCodePoint(0x301);

describe('redactContacts', () => {
  it('replaces visitor email addresses', () => {
    expect(redactContacts('Napíšte mi na jana.novak+web@firma.co.uk, ďakujem.')).toBe('Napíšte mi na [email], ďakujem.');
    expect(redactContacts('Mail: A@B.SK alebo x_y@sub.example.com')).toBe('Mail: [email] alebo [email]');
  });

  it('replaces addresses with letters outside ASCII whole, composed or decomposed', () => {
    expect(redactContacts('Som jožko@firma.sk.')).toBe('Som [email].');
    expect(redactContacts(`Píšte na jan@exámple.sk alebo jan@exae${ACUTE}mple.sk`)).toBe('Píšte na [email] alebo [email]');
    expect(redactContacts('Ďurko: ďurko.šťastný@pošta.sk')).toBe('Ďurko: [email]');
  });

  it('replaces phone numbers in common Slovak and international formats', () => {
    for (const phone of ['+421 905 123 456', '0905 123 456', '0905123456', '+421905123456', '00421 905 123 456', '02/123 456 78', '+44 (0)20 7946 0958', '905-123-456']) {
      expect(redactContacts(`Volajte ${phone} večer.`), phone).toBe('Volajte [telefón] večer.');
    }
  });

  it('replaces an international number glued to the word before it', () => {
    expect(redactContacts('Tel+421905123456')).toBe('Tel[telefón]');
    expect(redactContacts('číslo:+421 905 123 456')).toBe('číslo:[telefón]');
  });

  it("keeps Denis's own contacts, which answers quote", () => {
    const text = 'Kontakt: hello@denisvarga.sk, HELLO@denisvarga.dev, +421 902 074 830, Tel+421902074830 alebo 0902 074 830.';
    expect(redactContacts(text)).toBe(text);
  });

  it('leaves years, dates, timestamps, ranges, prices and counts alone', () => {
    const text = 'Od roku 2017, 21.10.2026, 2026-10-21, 2026-10-21 14:30, 2015-2017, 1 500 €, 40 projektov, PSČ 811 01.';
    expect(redactContacts(text)).toBe(text);
  });

  it('does not treat a digit run glued to letters as a phone number', () => {
    expect(redactContacts('ID abc123456789xyz')).toBe('ID abc123456789xyz');
    expect(redactContacts('kód ž123456789')).toBe('kód ž123456789');
  });
});
