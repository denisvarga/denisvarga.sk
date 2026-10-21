import { useEffect } from 'react';
import { getLenis } from './lenis-store';

type LockListener = (locked: boolean) => void;

let locks = 0;
const listeners = new Set<LockListener>();

function apply(locked: boolean): void {
  const lenis = getLenis();
  if (locked) lenis?.stop();
  else lenis?.start();
  document.documentElement.style.overflow = locked ? 'hidden' : '';
  for (const listener of listeners) listener(locked);
}

export function isScrollLocked(): boolean {
  return locks > 0;
}

/** Called with true when the first lock is taken and with false when the last one is released. */
export function subscribeScrollLock(listener: LockListener): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
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
