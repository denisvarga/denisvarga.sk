import { describe, expect, it } from 'vitest';
import { formatPeriod } from './jobs';

describe('formatPeriod', () => {
  it('ends an ongoing job in the current year', () => {
    expect(formatPeriod({ start: 2018, end: null }, 2026)).toBe('2018 - 2026');
  });

  it('shows a single year once', () => {
    expect(formatPeriod({ start: 2026, end: null }, 2026)).toBe('2026');
  });

  it('keeps a finished job as it is', () => {
    expect(formatPeriod({ start: 2021, end: 2025 }, 2030)).toBe('2021 - 2025');
  });
});
