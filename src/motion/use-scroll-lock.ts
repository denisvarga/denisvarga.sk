import { useEffect } from 'react';
import { getLenis } from './lenis-store';

let locks = 0;

function apply(locked: boolean): void {
  const lenis = getLenis();
  if (locked) lenis?.stop();
  else lenis?.start();
  document.documentElement.style.overflow = locked ? 'hidden' : '';
}

// Counted, so the menu and the project drawer can each hold a lock without releasing the other's.
export function lockScroll(): () => void {
  locks += 1;
  if (locks === 1) apply(true);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks -= 1;
    if (locks === 0) apply(false);
  };
}

export function useScrollLock(active: boolean): void {
  useEffect(() => (active ? lockScroll() : undefined), [active]);
}
