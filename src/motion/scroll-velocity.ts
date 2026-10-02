import { FRAME_PRIORITY, subscribeFrame } from './frame-loop';

// Smoothed scroll delta in px per frame. lastScrollY starts at 0 like the design, so a page
// restored mid-scroll starts with a short velocity spike that the 0.12 smoothing decays.
let velocity = 0;
let lastScrollY = 0;
let retainCount = 0;
let unsubscribe: (() => void) | null = null;

export function getScrollVelocity(): number {
  return velocity;
}

function step(): void {
  const scrollY = window.scrollY;
  velocity += (scrollY - lastScrollY - velocity) * 0.12;
  lastScrollY = scrollY;
}

export function retainScrollVelocity(): () => void {
  retainCount += 1;
  if (retainCount === 1) unsubscribe = subscribeFrame('scroll-velocity', FRAME_PRIORITY.velocity, step);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    retainCount -= 1;
    if (retainCount === 0) {
      unsubscribe?.();
      unsubscribe = null;
      velocity = 0;
      lastScrollY = 0;
    }
  };
}
