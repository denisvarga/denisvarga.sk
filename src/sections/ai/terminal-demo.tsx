import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import type { Demo, DemoLine, DemoLineKind } from '../../i18n/types';
import { FRAME_PRIORITY, subscribeFrame } from '../../motion/frame-loop';
import { useInViewport } from '../../motion/use-in-viewport';
import { REDUCED_MOTION_QUERY, useMediaQuery } from '../../motion/use-media-query';
import { completeFrame, demoFrame, EMPTY_FRAME, frameKey, SPINNER_FRAMES, type DemoFrame } from './demo-frame';
import styles from './terminal.module.css';

interface TerminalDemoProps {
  readonly id: string;
  readonly demo: Demo;
  readonly tool: number;
  /** Changes on every tool pick and language switch; each change restarts the timing. */
  readonly runKey: string;
  readonly barRefs: RefObject<(HTMLElement | null)[]>;
  readonly onDone: () => void;
}

interface Shown {
  readonly lines: readonly DemoLine[];
  readonly frame: DemoFrame;
}

function writeBars(bars: readonly (HTMLElement | null)[], active: number, progress: number): void {
  bars.forEach((bar, i) => {
    if (bar) bar.style.transform = `scaleX(${i === active ? progress.toFixed(4) : 0})`;
  });
}

function Prefix({ kind }: { readonly kind: DemoLineKind }) {
  if (kind === 'sub') return '  ';
  const glyph = kind === 'cmd' ? '›' : kind === 'ok' ? '✓' : '●';
  return (
    <>
      <span className={kind === 'out' ? styles.dim : styles.acc}>{glyph}</span>{' '}
    </>
  );
}

export function TerminalDemo({ id, demo, tool, runKey, barRefs, onDone }: TerminalDemoProps) {
  const reduced = useMediaQuery(REDUCED_MOTION_QUERY);
  const titleId = useId();
  const bodyRef = useRef<HTMLDivElement>(null);
  const visibleRef = useInViewport(bodyRef);
  const [shown, setShown] = useState<Shown>({ lines: demo.lines, frame: EMPTY_FRAME });

  // Matches the design's off-screen rule: the demo restarts while the body is fully outside the
  // viewport, so threshold 0 (any overlap counts as visible), unlike the reveal observer.
  useEffect(() => {
    const lines = demo.lines;
    if (reduced) {
      setShown({ lines, frame: completeFrame(lines) });
      writeBars(barRefs.current, tool, 0);
      return;
    }
    setShown({ lines, frame: EMPTY_FRAME });
    let t0: number | null = null;
    let key = '';
    let bars = '';
    return subscribeFrame('terminal-demo', FRAME_PRIORITY.demo, (time) => {
      if (!visibleRef.current) {
        t0 = time;
        return;
      }
      t0 ??= time;
      const frame = demoFrame(lines, time - t0, time);
      const nextKey = frameKey(frame);
      if (nextKey !== key) {
        key = nextKey;
        setShown({ lines, frame });
      }
      const nextBars = frame.progress.toFixed(4);
      if (nextBars !== bars) {
        bars = nextBars;
        writeBars(barRefs.current, tool, frame.progress);
      }
      if (frame.done) {
        t0 = time;
        onDone();
      }
    });
  }, [runKey, reduced, demo.lines, tool, barRefs, onDone]);

  const { lines, frame } = shown.lines === demo.lines ? shown : { lines: demo.lines, frame: EMPTY_FRAME };

  return (
    <div className={styles.wrap}>
      <div id={id} className={styles.card} role="group" aria-labelledby={titleId}>
        <div className={styles.bar}>
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.dot} aria-hidden="true" />
          <span id={titleId} className={styles.title}>
            {demo.title}
          </span>
        </div>
        <div ref={bodyRef} className={styles.body} aria-hidden="true">
          {lines.slice(0, frame.lineIndex + 1).map(([kind, text], i) => {
            const current = i === frame.lineIndex;
            return (
              <div key={i} className={styles.line} data-kind={kind}>
                <Prefix kind={kind} />
                <span className={styles.text}>{current ? text.slice(0, frame.chars) : text}</span>
                {current && frame.phase === 'typing' && <span className={styles.caret} />}
              </div>
            );
          })}
          {frame.phase === 'spinner' && <div className={styles.dim}>{SPINNER_FRAMES[frame.spinnerFrame]}</div>}
          {frame.caretOn && (
            <div>
              <span className={styles.caret} />
            </div>
          )}
        </div>
        <div className="visually-hidden">
          {demo.lines.map(([, text], i) => (
            <p key={i}>{text}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
