import { useEffect, type RefObject } from 'react';
import { COARSE_POINTER_QUERY, matchesMedia, REDUCED_MOTION_QUERY } from './use-media-query';

const RANGE_PX = 24;
const magnets = new Set<HTMLElement>();

function onMouseMove(event: MouseEvent): void {
  for (const el of magnets) {
    const r = el.getBoundingClientRect();
    const dx = event.clientX - (r.left + r.width / 2);
    const dy = event.clientY - (r.top + r.height / 2);
    const near = Math.abs(dx) < r.width / 2 + RANGE_PX && Math.abs(dy) < r.height / 2 + RANGE_PX;
    el.style.transform = near ? `translate(${(dx * 0.2).toFixed(1)}px, ${(dy * 0.3).toFixed(1)}px)` : '';
  }
}

// The element's own CSS supplies the `transform .6s var(--ease)` transition.
export function useMagnet(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || matchesMedia(COARSE_POINTER_QUERY) || matchesMedia(REDUCED_MOTION_QUERY)) return;
    magnets.add(el);
    if (magnets.size === 1) window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => {
      magnets.delete(el);
      el.style.transform = '';
      if (magnets.size === 0) window.removeEventListener('mousemove', onMouseMove);
    };
  }, [ref]);
}
