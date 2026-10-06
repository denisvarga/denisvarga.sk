import type { LogRow } from './query';
import { formatTime } from './time';

const BOM = '﻿';
// Excel in Slovak and Czech locales splits on semicolons; a comma file opens as one column there.
const SEPARATOR = ';';
const FORMULA_START = /^[=+\-@\t\r]/;

export const CSV_HEADER = ['Čas', 'Jazyk', 'Otázka', 'Odpoveď', 'Výsledok', 'Latencia (ms)'] as const;

/** Quotes every cell and defuses spreadsheet formulas with a leading apostrophe. */
export function csvCell(value: string | number | null): string {
  if (value === null) return '""';
  const raw = String(value);
  const safe = typeof value === 'string' && FORMULA_START.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function buildCsv(rows: readonly LogRow[]): string {
  const lines = [CSV_HEADER.map(csvCell).join(SEPARATOR)];
  for (const row of rows) {
    lines.push(
      [formatTime(row.createdAt), row.lang.toUpperCase(), row.question, row.answer, row.outcome, row.latencyMs]
        .map(csvCell)
        .join(SEPARATOR),
    );
  }
  return `${BOM}${lines.join('\r\n')}\r\n`;
}
