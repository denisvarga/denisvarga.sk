import { useEffect, type RefObject } from 'react';
import { clamp01 } from '../../lib/math';
import { FRAME_PRIORITY, subscribeFrame } from '../../motion/frame-loop';
import { getLayout } from '../../motion/layout-cache';
import { REDUCED_MOTION_QUERY, useMediaQuery } from '../../motion/use-media-query';

// Hero is [data-sec] index 0. k runs 0..1 while it scrolls out of view.
export function useHeroParallax(ref: RefObject<HTMLElement | null>): void {
  const reduced = useMediaQuery(REDUCED_MOTION_QUERY);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    let last = '';
    const off = subscribeFrame('hero-parallax', FRAME_PRIORITY.parallax, () => {
      const { sectionTops, sectionHeights, viewportHeight } = getLayout();
      const sy = window.scrollY;
      const vh = viewportHeight || window.innerHeight;
      const top = (sectionTops[0] ?? 0) - sy;
      const height = sectionHeights[0] ?? vh;
      const k = clamp01(-top / Math.max(vh * 0.8, height - vh * 0.4));
      const transform = `translate3d(0,${(k * 80).toFixed(1)}px,0)`;
      const opacity = (1 - Math.max(0, k - 0.35) * 1.3).toFixed(3);
      const key = transform + opacity;
      if (key === last) return;
      last = key;
      el.style.transform = transform;
      el.style.opacity = opacity;
    });
    return () => {
      off();
      el.style.transform = '';
      el.style.opacity = '';
    };
  }, [ref, reduced]);
}
