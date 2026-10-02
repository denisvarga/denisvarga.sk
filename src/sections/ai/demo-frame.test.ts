import { describe, expect, it } from 'vitest';
import { designDemoTiming, type OracleOutput } from '../../../scripts/oracles/design-demo-timing';
import { demosEn } from '../../data/demos-en';
import { demosSk } from '../../data/demos-sk';
import type { Demo, DemoLine } from '../../i18n/types';
import { completeFrame, DEMO_TIMING, demoFrame, demoTotal, frameKey, SPINNER_FRAMES, type DemoFrame } from './demo-frame';

function asOracle(lines: readonly DemoLine[], frame: DemoFrame): OracleOutput {
  const rendered = lines.slice(0, frame.lineIndex + 1).map(([kind, text], i) => {
    const shown = i === frame.lineIndex ? text.slice(0, frame.chars) : text;
    return { kind, text: shown, caret: i === frame.lineIndex && frame.phase === 'typing' };
  });
  return {
    lines: rendered,
    spinner: frame.phase === 'spinner' ? (SPINNER_FRAMES[frame.spinnerFrame] ?? null) : null,
    idleCaret: frame.caretOn,
    tbar: frame.progress.toFixed(4),
    advance: frame.done,
  };
}

// Every line start and end plus both gaps after it, each probed at -1, 0 and +1 ms.
function boundaries(lines: readonly DemoLine[]): number[] {
  const { cmdMs, outMs, gapMs, startMs, holdMs } = DEMO_TIMING;
  const points = [0, startMs, demoTotal(lines), demoTotal(lines) + holdMs];
  let t = startMs;
  for (const [kind, text] of lines) {
    const end = t + text.length * (kind === 'cmd' ? cmdMs : outMs);
    points.push(t, end, end + gapMs, end + 2 * gapMs);
    t = end + gapMs;
  }
  return points.flatMap((p) => [p - 1, p, p + 1]).filter((p) => p >= 0);
}

const demos: readonly (readonly [string, Demo])[] = [
  ...demosSk.map((d, i) => [`sk ${i}`, d] as const),
  ...demosEn.map((d, i) => [`en ${i}`, d] as const),
];

describe('demoFrame matches the design renderDemo oracle', () => {
  it.each(demos)('%s at 7 ms steps over two cycles', (_, demo) => {
    const span = 2 * (demoTotal(demo.lines) + DEMO_TIMING.holdMs);
    // Fractional frame clocks, as rAF timestamps are, with the tool started at an arbitrary time.
    for (const t0 of [0, 1234.567]) {
      for (let el = 0.25; el <= span; el += 7) {
        const now = t0 + el;
        expect(asOracle(demo.lines, demoFrame(demo.lines, el, now)), `el=${el} now=${now}`).toEqual(
          designDemoTiming(demo.lines, el, now),
        );
      }
    }
  });

  it.each(demos)('%s at every timing boundary', (_, demo) => {
    for (const el of boundaries(demo.lines)) {
      for (const now of [el, el + 40, el + 520]) {
        expect(asOracle(demo.lines, demoFrame(demo.lines, el, now)), `el=${el} now=${now}`).toEqual(
          designDemoTiming(demo.lines, el, now),
        );
      }
    }
  });
});

describe('demoFrame', () => {
  const lines = demosEn[3]?.lines ?? [];

  it('shows nothing before the start delay', () => {
    const frame = demoFrame(lines, DEMO_TIMING.startMs);
    expect(frame.lineIndex).toBe(-1);
    expect(frame.caretOn).toBe(false);
  });

  it('types the first command at 22 ms per character', () => {
    const frame = demoFrame(lines, DEMO_TIMING.startMs + 22 * 5 + 1);
    expect(frame).toMatchObject({ lineIndex: 0, chars: 5, phase: 'typing' });
  });

  it('is done only after total plus hold', () => {
    const end = demoTotal(lines) + DEMO_TIMING.holdMs;
    expect(demoFrame(lines, end).done).toBe(false);
    expect(demoFrame(lines, end + 1)).toMatchObject({ done: true, progress: 1 });
  });

  it('frameKey ignores clock changes that do not change the output', () => {
    const typing = demoFrame(lines, 600, 0);
    expect(frameKey(typing)).toBe(frameKey(demoFrame(lines, 600, 80)));
  });

  it('completeFrame shows every line in full', () => {
    expect(asOracle(lines, completeFrame(lines)).lines.map((l) => l.text)).toEqual(lines.map((l) => l[1]));
  });
});
