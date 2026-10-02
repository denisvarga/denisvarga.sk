import type { TurnstileApi } from '../types/turnstile';
import { loadTurnstile } from './turnstile-loader';

export const TOKEN_DEADLINE_MS = 15_000;
/** Tokens are valid for 300 s; anything older than this is re-executed before use. */
export const TOKEN_MAX_AGE_MS = 280_000;

export class TokenError extends Error {
  override readonly name = 'TokenError';
}

export interface TokenSource {
  /** Loads api.js, renders the widget and pre-fetches a token; failures resurface in getToken. */
  warmUp(): void;
  /** A fresh single-use token, or a TokenError at the latest after the deadline. */
  getToken(): Promise<string>;
  /** Call after a request consumed a token: reset and execute again in the background. */
  refresh(): void;
  dispose(): void;
}

export interface TokenSourceOptions {
  readonly siteKey: string;
  readonly load?: () => Promise<TurnstileApi>;
  readonly deadlineMs?: number;
  readonly now?: () => number;
}

interface Waiter {
  readonly resolve: (token: string) => void;
  readonly reject: (error: Error) => void;
  readonly timer: ReturnType<typeof setTimeout>;
}

export function createTokenSource(container: HTMLElement, options: TokenSourceOptions): TokenSource {
  const { siteKey, load = loadTurnstile, deadlineMs = TOKEN_DEADLINE_MS, now = Date.now } = options;
  let api: TurnstileApi | null = null;
  let widgetId: string | null = null;
  let widgetPromise: Promise<void> | null = null;
  let stored: { readonly value: string; readonly at: number } | null = null;
  let running = false;
  let disposed = false;
  const waiters = new Set<Waiter>();

  function settle(waiter: Waiter): void {
    clearTimeout(waiter.timer);
    waiters.delete(waiter);
  }

  function rejectAll(reason: string): void {
    for (const waiter of waiters) {
      settle(waiter);
      waiter.reject(new TokenError(reason));
    }
  }

  function onToken(value: string): void {
    running = false;
    const [waiter] = waiters;
    if (waiter) {
      settle(waiter);
      waiter.resolve(value);
    } else {
      stored = { value, at: now() };
    }
  }

  function onFailure(reason: string): void {
    running = false;
    rejectAll(reason);
  }

  function ensureWidget(): Promise<void> {
    widgetPromise ??= load()
      .then((turnstile) => {
        if (disposed) throw new TokenError('disposed');
        if (!siteKey) throw new TokenError('missing site key');
        const id = turnstile.render(container, {
          sitekey: siteKey,
          action: 'ask',
          execution: 'execute',
          appearance: 'interaction-only',
          theme: 'dark',
          'response-field': false,
          callback: onToken,
          'error-callback': (code) => {
            onFailure(`turnstile error ${code}`);
            return true;
          },
          'expired-callback': () => {
            stored = null;
          },
          'timeout-callback': () => onFailure('interactive challenge timed out'),
          'unsupported-callback': () => onFailure('browser not supported'),
          'before-interactive-callback': () => {
            container.setAttribute('data-interactive', '');
            // A visitor solving a challenge is not stuck; Turnstile's own timeout-callback bounds it.
            for (const waiter of waiters) clearTimeout(waiter.timer);
          },
        });
        if (id === undefined) throw new TokenError('render failed');
        api = turnstile;
        widgetId = id;
      })
      .catch((error: unknown) => {
        widgetPromise = null;
        throw error;
      });
    return widgetPromise;
  }

  // A solved interactive widget stays visible (after-interactive fires while it still shows);
  // only reset hides it again, so the spacing attribute is dropped here.
  function resetWidget(): void {
    if (!api || widgetId === null) return;
    api.reset(widgetId);
    container.removeAttribute('data-interactive');
  }

  function execute(fromCleanState: boolean): void {
    if (!api || widgetId === null || running || disposed) return;
    if (fromCleanState) {
      stored = null;
      resetWidget();
    }
    running = true;
    try {
      api.execute(container);
    } catch (error) {
      onFailure(error instanceof Error ? error.message : 'execute failed');
    }
  }

  function abandonRun(): void {
    running = false;
    resetWidget();
  }

  function takeStored(): string | null {
    const token = stored;
    stored = null;
    return token && now() - token.at < TOKEN_MAX_AGE_MS ? token.value : null;
  }

  return {
    warmUp() {
      ensureWidget().then(
        () => execute(false),
        () => {},
      );
    },
    getToken() {
      const ready = takeStored();
      if (ready) return Promise.resolve(ready);
      return new Promise<string>((resolve, reject) => {
        const waiter: Waiter = {
          resolve,
          reject,
          timer: setTimeout(() => {
            settle(waiter);
            abandonRun();
            reject(new TokenError('token deadline exceeded'));
          }, deadlineMs),
        };
        waiters.add(waiter);
        ensureWidget().then(
          () => execute(true),
          (error: unknown) => {
            if (!waiters.has(waiter)) return;
            settle(waiter);
            reject(error instanceof Error ? error : new TokenError(String(error)));
          },
        );
      });
    },
    refresh() {
      execute(true);
    },
    dispose() {
      disposed = true;
      rejectAll('disposed');
      if (api && widgetId !== null) api.remove(widgetId);
      api = null;
      widgetId = null;
    },
  };
}
