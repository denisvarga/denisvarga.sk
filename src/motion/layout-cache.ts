export interface DocumentRect {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

// All positions are document-relative; subtract window.scrollY for viewport coordinates.
export interface LayoutSnapshot {
  readonly sectionTops: readonly number[];
  readonly sectionHeights: readonly number[];
  readonly heroImage: DocumentRect | null;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly scrollHeight: number;
}

const EMPTY: LayoutSnapshot = Object.freeze({
  sectionTops: [],
  sectionHeights: [],
  heroImage: null,
  viewportWidth: 0,
  viewportHeight: 0,
  scrollHeight: 0,
});

let snapshot: LayoutSnapshot = EMPTY;
let retainCount = 0;
let stop: (() => void) | null = null;

export function getLayout(): LayoutSnapshot {
  return snapshot;
}

function visibleHeroImage(scrollX: number, scrollY: number): DocumentRect | null {
  // The hero image exists twice (mobile in-flow, desktop overlay); only one is displayed.
  for (const img of document.querySelectorAll('[data-heroimg]')) {
    const r = img.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      return { top: r.top + scrollY, left: r.left + scrollX, width: r.width, height: r.height };
    }
  }
  return null;
}

export function measureLayout(): void {
  const { scrollX, scrollY } = window;
  const sectionTops: number[] = [];
  const sectionHeights: number[] = [];
  for (const section of document.querySelectorAll('[data-sec]')) {
    const r = section.getBoundingClientRect();
    sectionTops.push(r.top + scrollY);
    sectionHeights.push(r.height);
  }
  snapshot = Object.freeze({
    sectionTops,
    sectionHeights,
    heroImage: visibleHeroImage(scrollX, scrollY),
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    scrollHeight: document.documentElement.scrollHeight,
  });
}

function start(): () => void {
  let alive = true;
  const onChange = () => {
    if (alive) measureLayout();
  };
  measureLayout();
  window.addEventListener('resize', onChange, { passive: true });
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onChange);
  observer?.observe(document.body);
  document.fonts?.ready.then(onChange, () => {});
  return () => {
    alive = false;
    window.removeEventListener('resize', onChange);
    observer?.disconnect();
  };
}

export function retainLayoutCache(): () => void {
  retainCount += 1;
  if (retainCount === 1) stop = start();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    retainCount -= 1;
    if (retainCount === 0) {
      stop?.();
      stop = null;
    }
  };
}
