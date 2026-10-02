import { useEffect, useRef } from 'react';
import { startParticles } from '../gl/load-particles';
import styles from './motion-layer.module.css';
import { matchesMedia, REDUCED_MOTION_QUERY, useMediaQuery } from './use-media-query';
import { useSmoothScroll } from './use-smooth-scroll';

// Smooth scroll plus the fixed particle canvas. Renders the same empty container on the server
// and the client; everything else starts in effects after first paint.
export function MotionLayer() {
  const containerRef = useRef<HTMLDivElement>(null);
  // Re-runs the effects when the preference changes; the hydration render always reports false.
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  useSmoothScroll(reducedMotion);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const reduced = reducedMotion || matchesMedia(REDUCED_MOTION_QUERY);
    return startParticles(container, reduced ? 'static' : 'animated');
  }, [reducedMotion]);

  return <div ref={containerRef} className={styles.layer} aria-hidden="true" />;
}
