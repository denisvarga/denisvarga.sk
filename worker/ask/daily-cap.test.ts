import { describe, expect, it } from 'vitest';
import { parseDailyCap, utcMidnight } from './daily-cap';

describe('daily cap helpers', () => {
  it('computes UTC midnight regardless of local offset', () => {
    expect(utcMidnight(Date.UTC(2026, 9, 2, 23, 59, 59))).toBe(Date.UTC(2026, 9, 2));
    expect(utcMidnight(Date.UTC(2026, 9, 3, 0, 0, 0))).toBe(Date.UTC(2026, 9, 3));
  });

  it('parses a non-negative integer cap and rejects anything else', () => {
    expect(parseDailyCap('300')).toBe(300);
    expect(parseDailyCap(' 0 ')).toBe(0);
    for (const bad of [undefined, '', '  ', '-1', '1.5', 'abc', 'Infinity']) expect(parseDailyCap(bad)).toBeNull();
  });
});
