export interface InitSlice {
  readonly name: string;
  // May return a promise for native async work (shader compile); only the synchronous part
  // counts against the 50 ms long-task budget.
  run(): void | Promise<void>;
}

const IDLE_TIMEOUT_MS = 1000;
const SLICE_FALLBACK_MS = 16;

function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('Aborted', 'AbortError');
}

// Resolves inside an idle callback (setTimeout where requestIdleCallback is missing, e.g. Safari).
export function whenIdle(signal: AbortSignal, fallbackMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortReason(signal));
      return;
    }
    let cancel: (() => void) | undefined;
    const onAbort = () => {
      cancel?.();
      reject(abortReason(signal));
    };
    const done = () => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    };
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(done, { timeout: IDLE_TIMEOUT_MS });
      cancel = () => window.cancelIdleCallback(id);
    } else {
      const id = window.setTimeout(done, fallbackMs);
      cancel = () => window.clearTimeout(id);
    }
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export function whenLoaded(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortReason(signal));
      return;
    }
    if (document.readyState === 'complete') {
      resolve();
      return;
    }
    const onAbort = () => {
      window.removeEventListener('load', onLoad);
      reject(abortReason(signal));
    };
    const onLoad = () => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    };
    window.addEventListener('load', onLoad, { once: true });
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

// Runs each slice in its own idle callback, in order; rejects with the abort reason as soon as
// the signal aborts, without starting another slice. Each slice's main-thread time is recorded
// as a `gl-init:<name>` performance measure.
export async function runIdleSlices(slices: readonly InitSlice[], signal: AbortSignal): Promise<void> {
  for (const slice of slices) {
    await whenIdle(signal, SLICE_FALLBACK_MS);
    const start = performance.now();
    const pending = slice.run();
    performance.measure(`gl-init:${slice.name}`, { start, end: performance.now() });
    if (pending) await pending;
    if (signal.aborted) throw abortReason(signal);
  }
}
