import type { DemoLine } from '../../i18n/types';
import { clamp01 } from '../../lib/math';

export const DEMO_TIMING = {
  cmdMs: 22,
  outMs: 8,
  gapMs: 320,
  startMs: 450,
  holdMs: 3400,
  spinnerMs: 80,
  caretMs: 520,
} as const;

export const SPINNER_FRAMES = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';

export type DemoPhase = 'typing' | 'spinner' | 'idle';

export interface DemoFrame {
  /** Last visible line, -1 when nothing is shown yet; every earlier line is complete. */
  readonly lineIndex: number;
  /** Characters shown of the line at lineIndex. */
  readonly chars: number;
  readonly phase: DemoPhase;
  readonly spinnerFrame: number;
  /** Blinking caret on its own row; only ever true in the idle phase. */
  readonly caretOn: boolean;
  /** Tool progress bar value, clamp01(elapsed / (total + hold)). */
  readonly progress: number;
  /** The demo is over and the next tool starts. */
  readonly done: boolean;
}

export const EMPTY_FRAME: DemoFrame = {
  lineIndex: -1,
  chars: 0,
  phase: 'idle',
  spinnerFrame: 0,
  caretOn: false,
  progress: 0,
  done: false,
};

const speedOf = (line: DemoLine) => (line[0] === 'cmd' ? DEMO_TIMING.cmdMs : DEMO_TIMING.outMs);

export function demoTotal(lines: readonly DemoLine[]): number {
  return lines.reduce<number>((sum, line) => sum + line[1].length * speedOf(line) + DEMO_TIMING.gapMs, DEMO_TIMING.startMs);
}

/**
 * Port of the design's renderDemo timing. `clock` drives the spinner and the idle caret blink;
 * the design reads the absolute performance.now() for those, so callers pass the frame time.
 * Design quirk kept on purpose: a line that follows a spinner starts with gap/speed characters
 * already typed, because the spinner occupies the second gap after the line.
 */
export function demoFrame(lines: readonly DemoLine[], elapsed: number, clock: number = elapsed): DemoFrame {
  const { gapMs, startMs, holdMs, spinnerMs, caretMs } = DEMO_TIMING;
  let remaining = elapsed - startMs;
  let lineIndex = -1;
  let chars = 0;
  let phase: DemoPhase = 'idle';

  for (let i = 0; i < lines.length; i++) {
    if (remaining <= 0) break;
    const line = lines[i] as DemoLine;
    const [kind, text] = line;
    const speed = speedOf(line);
    lineIndex = i;
    chars = Math.min(text.length, Math.floor(remaining / speed));
    remaining -= text.length * speed + gapMs;
    if (chars < text.length) {
      phase = 'typing';
      break;
    }
    if (remaining > 0 && remaining < gapMs && kind !== 'ok') {
      phase = 'spinner';
      break;
    }
  }

  const total = demoTotal(lines);
  return {
    lineIndex,
    chars,
    phase,
    spinnerFrame: Math.floor(clock / spinnerMs) % SPINNER_FRAMES.length,
    caretOn: phase === 'idle' && elapsed > startMs && Math.floor(clock / caretMs) % 2 === 0,
    progress: clamp01(elapsed / (total + holdMs)),
    done: elapsed > total + holdMs,
  };
}

/** Reduced motion: the whole demo at once, no caret, spinner or progress. */
export function completeFrame(lines: readonly DemoLine[]): DemoFrame {
  const last = lines.at(-1);
  return { ...EMPTY_FRAME, lineIndex: lines.length - 1, chars: last ? last[1].length : 0 };
}

/** Changes only when the rendered terminal output changes. */
export function frameKey(frame: DemoFrame): string {
  const spinner = frame.phase === 'spinner' ? frame.spinnerFrame : '';
  return `${frame.lineIndex}:${frame.chars}:${frame.phase}:${spinner}:${frame.caretOn ? 1 : 0}`;
}
