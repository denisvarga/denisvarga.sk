import { getLenis } from './lenis-store';
import { matchesMedia, REDUCED_MOTION_QUERY } from './use-media-query';

export type ScrollTarget = number | string | HTMLElement;

const OFFSET = -40;
const DURATION_S = 1.6;
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

function resolve(target: ScrollTarget): HTMLElement | null {
  if (typeof target === 'number') return document.querySelectorAll<HTMLElement>('[data-sec]')[target] ?? null;
  if (typeof target === 'string') return document.querySelector<HTMLElement>(target);
  return target;
}

// number = index of a [data-sec] section in document order, string = CSS selector.
export function goTo(target: ScrollTarget): void {
  const el = resolve(target);
  if (!el) return;
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(el, { duration: DURATION_S, offset: OFFSET, easing: easeOutQuart });
    return;
  }
  window.scrollTo({
    top: el.getBoundingClientRect().top + window.scrollY + OFFSET,
    behavior: matchesMedia(REDUCED_MOTION_QUERY) ? 'instant' : 'smooth',
  });
}
