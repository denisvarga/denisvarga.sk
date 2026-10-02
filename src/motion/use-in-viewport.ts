import { useEffect, useRef, type RefObject } from 'react';

// Threshold 0 reports "fully outside the viewport" exactly, without a layout read per frame.
export function useInViewport(target: RefObject<Element | null>): RefObject<boolean> {
  const visible = useRef(true);
  useEffect(() => {
    const el = target.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1);
        if (entry) visible.current = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target]);
  return visible;
}
