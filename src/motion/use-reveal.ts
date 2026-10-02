import { useEffect, type RefObject } from 'react';

let observer: IntersectionObserver | null = null;

function markJs(): void {
  // Cancels the CSS failsafe in reveal.css; from here on the observer owns visibility.
  document.documentElement.setAttribute('data-js', '');
}

function getObserver(): IntersectionObserver | null {
  if (observer) return observer;
  if (typeof IntersectionObserver === 'undefined') return null;
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        entry.target.setAttribute('data-in', '');
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -5% 0px' },
  );
  observer = io;
  markJs();
  return io;
}

// One-shot: data-in is set imperatively and never rendered by React, so re-renders (language
// switch) keep it and newly mounted children of a shown element appear without animating.
export function useReveal(ref: RefObject<Element | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || el.hasAttribute('data-in')) return;
    const io = getObserver();
    if (!io) {
      markJs();
      el.setAttribute('data-in', '');
      return;
    }
    io.observe(el);
    return () => io.unobserve(el);
  }, [ref]);
}
