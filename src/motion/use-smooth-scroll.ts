import type Lenis from 'lenis';
import { useEffect } from 'react';
import { whenIdle } from '../gl/init-slices';
import { FRAME_PRIORITY, subscribeFrame } from './frame-loop';
import { setLenis } from './lenis-store';
import { matchesMedia, REDUCED_MOTION_QUERY } from './use-media-query';

const IDLE_FALLBACK_MS = 200;
const SCROLL_LERP = 0.13;

// Lenis, ticked by the shared frame loop. Loaded after first paint;
// when the import fails the page keeps native scrolling. `reducedMotion` only re-triggers the
// effect, the decision itself reads the live media query.
export function useSmoothScroll(reducedMotion: boolean): void {
  useEffect(() => {
    if (reducedMotion || matchesMedia(REDUCED_MOTION_QUERY)) return;
    const controller = new AbortController();
    let lenis: Lenis | null = null;
    let unsubscribe: (() => void) | null = null;

    const start = async () => {
      try {
        await whenIdle(controller.signal, IDLE_FALLBACK_MS);
      } catch {
        return;
      }
      let LenisClass: typeof Lenis;
      try {
        LenisClass = (await import('lenis')).default;
      } catch (error) {
        console.error('lenis_import_failed', error);
        return;
      }
      if (controller.signal.aborted) return;
      let instance: Lenis;
      try {
        // A lighter lerp than the design's 0.085, which felt like it held the page back.
        instance = new LenisClass({ lerp: SCROLL_LERP, smoothWheel: true, autoRaf: false });
      } catch (error) {
        console.error('lenis_init_failed', error);
        return;
      }
      // A scroll lock taken before Lenis existed could not stop it; the lock marks the root.
      if (document.documentElement.style.overflow === 'hidden') instance.stop();
      lenis = instance;
      setLenis(instance);
      unsubscribe = subscribeFrame('lenis', FRAME_PRIORITY.lenis, (time) => instance.raf(time));
    };
    void start();

    return () => {
      controller.abort();
      unsubscribe?.();
      if (lenis) {
        setLenis(null);
        lenis.destroy();
      }
    };
  }, [reducedMotion]);
}
