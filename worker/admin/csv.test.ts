import { describe, expect, it } from 'vitest';
import { buildCsv, csvCell } from './csv';
import type { LogRow } from './query';

const row = (overrides: Partial<LogRow> = {}): LogRow => ({
  createdAt: Date.UTC(2026, 9, 5, 7, 3),
  lang: 'sk',
  question: 'Čo robí Denis?',
  answer: 'Weby na mieru.',
  latencyMs: 812,
  outcome: 'ok',
  ...overrides,
});

describe('csvCell', () => {
  it('quotes every cell and doubles inner quotes', () => {
    expect(csvCell('povedal "ahoj"')).toBe('"povedal ""ahoj"""');
    expect(csvCell('a;b\nc')).toBe('"a;b\nc"');
    expect(csvCell(42)).toBe('"42"');
    expect(csvCell(null)).toBe('""');
  });

  it('neutralises cells that a spreadsheet would run as a formula', () => {
    for (const start of ['=', '+', '-', '@', '\t', '\r']) {
      expect(csvCell(`${start}HYPERLINK("x")`)).toBe(`"'${start}HYPERLINK(""x"")"`);
    }
    expect(csvCell('a=1')).toBe('"a=1"');
  });
});

describe('buildCsv', () => {
  it('starts with a UTF-8 BOM, keeps Slovak characters and uses the table columns', () => {
    const csv = buildCsv([row(), row({ lang: 'en', question: '=cmd|"/c calc"!A1', answer: null, latencyMs: null, outcome: 'capped' })]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const lines = csv.slice(1).split('\r\n');
    expect(lines).toEqual([
      '"Čas";"Jazyk";"Otázka";"Odpoveď";"Výsledok";"Latencia (ms)"',
      '"5. 10. 2026 09:03";"SK";"Čo robí Denis?";"Weby na mieru.";"ok";"812"',
      '"5. 10. 2026 09:03";"EN";"\'=cmd|""/c calc""!A1";"";"capped";""',
      '',
    ]);
  });

  it('round-trips through UTF-8 bytes with the BOM first', () => {
    const bytes = new TextEncoder().encode(buildCsv([]));
    expect(bytes.slice(0, 3)).toEqual(new Uint8Array([0xef, 0xbb, 0xbf]));
  });
});
