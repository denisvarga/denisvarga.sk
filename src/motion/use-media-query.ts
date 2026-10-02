import { useCallback, useSyncExternalStore } from 'react';

export const MOBILE_QUERY = '(max-width: 899.98px)';
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
export const COARSE_POINTER_QUERY = '(pointer: coarse)';

export function matchesMedia(query: string): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
}

const serverSnapshot = () => false;

// False during prerender and the hydration render (server snapshot), so markup never depends
// on it; use the value in effects and handlers, never to choose what to render (D-18).
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window.matchMedia !== 'function') return () => {};
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => matchesMedia(query), serverSnapshot);
}
