export const TIME_ZONE = 'Europe/Bratislava';
export const HOUR_MS = 3_600_000;
export const DAY_MS = 24 * HOUR_MS;

const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

interface LocalParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
}

// Numeric parts, so the output does not depend on the locale's own padding.
function localParts(ms: number): LocalParts {
  const parts: Record<string, number> = {};
  for (const part of formatter.formatToParts(ms)) parts[part.type] = Number(part.value);
  return { year: parts.year ?? 0, month: parts.month ?? 0, day: parts.day ?? 0, hour: parts.hour ?? 0, minute: parts.minute ?? 0 };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** `d. M. yyyy HH:mm` in Bratislava time. */
export function formatTime(ms: number): string {
  const p = localParts(ms);
  return `${p.day}. ${p.month}. ${p.year} ${pad(p.hour)}:${pad(p.minute)}`;
}

/** `yyyy-mm-dd` of the Bratislava calendar day. */
export function localDateKey(ms: number): string {
  const p = localParts(ms);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** `d. M.` for a `yyyy-mm-dd` key. */
export function dayLabel(key: string): string {
  const [, month = '', day = ''] = key.split('-');
  return `${Number(day)}. ${Number(month)}.`;
}

/** The last `count` Bratislava calendar days up to today, oldest first. */
export function lastLocalDays(now: number, count: number): string[] {
  const { year, month, day } = localParts(now);
  const today = Date.UTC(year, month - 1, day);
  return Array.from({ length: count }, (_, i) => new Date(today - (count - 1 - i) * DAY_MS).toISOString().slice(0, 10));
}
