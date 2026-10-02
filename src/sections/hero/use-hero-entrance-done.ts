import { useEffect, type RefObject } from 'react';

export type EntranceKind = 'rise' | 'fade' | 'split';

export interface EntranceStep {
  readonly kind: EntranceKind;
  readonly delay: number;
  /** Word count of a split heading; the last word starts (words - 1) * 55 ms later. */
  readonly words?: number;
  /** The [data-enter] element, or the [data-enter-split] heading. */
  readonly target: () => Element | null;
}

// Mirrors the hero keyframes in src/styles/reveal.css: [data-enter] runs enter-fade 1s and
// enter-rise 1.3s (rise ends last), [data-enter='fade'] runs enter-fade 1.6s, split words run
// enter-word 1.25s with a 55 ms stagger.
const KEYFRAMES: Record<EntranceKind, { readonly name: string; readonly duration: number }> = {
  rise: { name: 'enter-rise', duration: 1300 },
  fade: { name: 'enter-fade', duration: 1600 },
  split: { name: 'enter-word', duration: 1250 },
};
const WORD_STAGGER_MS = 55;

export function entranceEnd(step: Pick<EntranceStep, 'kind' | 'delay' | 'words'>): number {
  const stagger = step.kind === 'split' ? Math.max(0, (step.words ?? 1) - 1) * WORD_STAGGER_MS : 0;
  return step.delay + KEYFRAMES[step.kind].duration + stagger;
}

export function lastEntrance<T extends Pick<EntranceStep, 'kind' | 'delay' | 'words'>>(steps: readonly T[]): T | undefined {
  let last: T | undefined;
  for (const step of steps) if (!last || entranceEnd(step) > entranceEnd(last)) last = step;
  return last;
}

function animatedElement(step: EntranceStep): Element | null {
  const el = step.target();
  if (!el || step.kind !== 'split') return el;
  const words = el.querySelectorAll('.word');
  return words[words.length - 1] ?? null;
}

function stillRunning(el: Element, name: string): boolean {
  // jsdom and very old engines lack getAnimations; then only the event can tell.
  if (typeof el.getAnimations !== 'function') return true;
  return el
    .getAnimations()
    .some((anim) => (anim as Partial<CSSAnimation>).animationName === name && anim.playState !== 'finished');
}

/**
 * Sets data-in on the host once the hero entrance has fully played, which switches the keyframes
 * off so a language switch cannot replay them. Only the animation that ends last is watched, so
 * an earlier child's animationend (bubbling or not) never marks the hero done. Runs once: the
 * entrance plays only at first paint.
 */
export function useHeroEntranceDone(hostRef: RefObject<HTMLElement | null>, steps: readonly EntranceStep[]): void {
  useEffect(() => {
    const host = hostRef.current;
    const last = lastEntrance(steps);
    const el = last ? animatedElement(last) : null;
    if (!host || host.hasAttribute('data-in')) return;
    const done = () => host.setAttribute('data-in', '');
    if (!last || !el) {
      done();
      return;
    }
    const name = KEYFRAMES[last.kind].name;
    // Hydration can land after the entrance already finished (slow network, reduced motion).
    if (!stillRunning(el, name)) {
      done();
      return;
    }
    const onEnd = (event: Event) => {
      if (event.target !== el || (event as AnimationEvent).animationName !== name) return;
      el.removeEventListener('animationend', onEnd);
      done();
    };
    el.addEventListener('animationend', onEnd);
    return () => el.removeEventListener('animationend', onEnd);
  }, [hostRef]);
}
