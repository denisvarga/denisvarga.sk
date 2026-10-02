import { useCallback, useEffect, useReducer, useRef, type RefObject } from 'react';
import { useScrollLock } from '../../motion/use-scroll-lock';

export interface DrawerState {
  readonly open: boolean;
  /** Last shown project; the drawer keeps rendering it while it slides closed. */
  readonly last: number;
}

export type DrawerAction =
  | { readonly type: 'open'; readonly index: number }
  | { readonly type: 'close' }
  | { readonly type: 'step'; readonly delta: number };

export const INITIAL_DRAWER: DrawerState = { open: false, last: 0 };

export function wrapIndex(index: number, count: number): number {
  return ((index % count) + count) % count;
}

export function reduceDrawer(state: DrawerState, action: DrawerAction, count: number): DrawerState {
  switch (action.type) {
    case 'open':
      return { open: true, last: wrapIndex(action.index, count) };
    case 'close':
      return state.open ? { ...state, open: false } : state;
    case 'step':
      return state.open ? { open: true, last: wrapIndex(state.last + action.delta, count) } : state;
  }
}

export interface ProjectDrawer extends DrawerState {
  readonly openerRef: RefObject<HTMLElement | null>;
  readonly openAt: (index: number, opener: HTMLElement | null) => void;
  readonly close: () => void;
  readonly step: (delta: 1 | -1) => void;
}

export function useProjectDrawer(count: number): ProjectDrawer {
  const [state, dispatch] = useReducer(
    (s: DrawerState, a: DrawerAction) => reduceDrawer(s, a, count),
    INITIAL_DRAWER,
  );
  // Passed explicitly because Safari does not focus a button on click, so activeElement is unreliable.
  const openerRef = useRef<HTMLElement | null>(null);
  useScrollLock(state.open);

  const openAt = useCallback((index: number, opener: HTMLElement | null) => {
    openerRef.current = opener;
    dispatch({ type: 'open', index });
  }, []);
  const close = useCallback(() => dispatch({ type: 'close' }), []);
  const step = useCallback((delta: 1 | -1) => dispatch({ type: 'step', delta }), []);

  useEffect(() => {
    if (!state.open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'Escape') close();
      else if (event.key === 'ArrowRight') step(1);
      else if (event.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [state.open, close, step]);

  return { ...state, openerRef, openAt, close, step };
}
