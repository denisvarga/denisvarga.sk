import { describe, expect, it } from 'vitest';
import { dayLabel, formatTime, lastLocalDays, localDateKey } from './time';

describe('Bratislava time', () => {
  it('formats as d. M. yyyy HH:mm in summer and winter time', () => {
    expect(formatTime(Date.UTC(2026, 9, 5, 7, 3))).toBe('5. 10. 2026 09:03');
    expect(formatTime(Date.UTC(2026, 0, 9, 23, 30))).toBe('10. 1. 2026 00:30');
    expect(formatTime(Date.UTC(2026, 11, 31, 23, 0))).toBe('1. 1. 2027 00:00');
  });

  it('counts the local calendar day, not the UTC one', () => {
    expect(localDateKey(Date.UTC(2026, 9, 4, 22, 30))).toBe('2026-10-05');
    expect(localDateKey(Date.UTC(2026, 9, 4, 21, 59))).toBe('2026-10-04');
    expect(dayLabel('2026-03-09')).toBe('9. 3.');
  });

  it('lists the last days oldest first, across a DST change', () => {
    const days = lastLocalDays(Date.UTC(2026, 9, 26, 12), 4);
    expect(days).toEqual(['2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26']);
    expect(lastLocalDays(Date.UTC(2026, 9, 4, 22, 30), 1)).toEqual(['2026-10-05']);
  });
});
