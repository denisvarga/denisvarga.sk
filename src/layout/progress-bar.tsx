import { useEffect, useRef } from 'react';
import { FRAME_PRIORITY, subscribeFrame } from '../motion/frame-loop';
import { getLayout } from '../motion/layout-cache';
import styles from './progress-bar.module.css';

export function ProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    let last = '';
    return subscribeFrame('progress', FRAME_PRIORITY.progress, () => {
      const { scrollHeight, viewportHeight } = getLayout();
      const max = scrollHeight - viewportHeight;
      const value = `scaleX(${max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0})`;
      if (value === last) return;
      last = value;
      bar.style.transform = value;
    });
  }, []);

  return (
    <div className={styles.track} aria-hidden="true">
      <div ref={barRef} className={styles.bar} />
    </div>
  );
}
