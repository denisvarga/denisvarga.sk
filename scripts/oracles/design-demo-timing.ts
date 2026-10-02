/*
 * Test oracle: the terminal timing of `renderDemo()` in `design/Denis Varga CV v7.dc.html`
 * (lines 880-903, constants CARET/esc at 523-524), copied statement for statement. Only the
 * output changed: instead of an HTML string it returns what that string would contain.
 * `el2` is the elapsed time since the tool started, `now` the performance.now() clock the design
 * uses for the spinner and the idle caret. Do not "improve" this file; it must stay a copy.
 */

export type OracleLine = readonly [kind: string, text: string];

export interface OracleRenderedLine {
  readonly kind: string;
  readonly text: string;
  readonly caret: boolean;
}

export interface OracleOutput {
  readonly lines: readonly OracleRenderedLine[];
  readonly spinner: string | null;
  readonly idleCaret: boolean;
  readonly tbar: string;
  readonly advance: boolean;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function designDemoTiming(lines: readonly OracleLine[], el2: number, now: number): OracleOutput {
  const CMD = 22,
    OUT = 8,
    GAP = 320,
    START = 450;
  let tt = el2 - START,
    typing = false,
    total = START;
  const rendered: OracleRenderedLine[] = [];
  let spinner: string | null = null;
  lines.forEach((l) => {
    total += l[1].length * (l[0] === 'cmd' ? CMD : OUT) + GAP;
  });
  for (const [k, s] of lines) {
    if (tt <= 0) break;
    const sp = k === 'cmd' ? CMD : OUT,
      nn = Math.min(s.length, Math.floor(tt / sp));
    tt -= s.length * sp + GAP;
    rendered.push({ kind: k, text: s.slice(0, nn), caret: nn < s.length });
    if (nn < s.length) {
      typing = true;
      break;
    }
    if (tt > 0 && tt < GAP && k !== 'ok') {
      spinner = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'[Math.floor(now / 80) % 10] ?? null;
      typing = true;
      break;
    }
  }
  const HOLD = 3400;
  const idleCaret = !typing && el2 > START && Math.floor(now / 520) % 2 === 0;
  const prog = clamp01(el2 / (total + HOLD));
  return { lines: rendered, spinner, idleCaret, tbar: prog.toFixed(4), advance: el2 > total + HOLD };
}
