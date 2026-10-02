import type Lenis from 'lenis';

// Stays null until the smooth-scroll layer creates Lenis, and under prefers-reduced-motion.
let instance: Lenis | null = null;

export function getLenis(): Lenis | null {
  return instance;
}

export function setLenis(lenis: Lenis | null): void {
  instance = lenis;
}
