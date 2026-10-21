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

/** The parts of a DOM or React mouse event that decide whether a link click is plain. */
export interface LinkClick {
  readonly button: number;
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  preventDefault(): void;
}

// In-page links scroll with `go` (goTo or a wrapper of it) on a plain left click or Enter; a
// modified or middle click keeps the browser's own behaviour, such as opening the anchor in a new tab.
export function onScrollLinkClick(event: LinkClick, go: () => void): void {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  go();
}
