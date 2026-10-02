import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { createTokenSource, TokenError, type TokenSource } from './turnstile-token-source';

export type TokenClient = Pick<TokenSource, 'warmUp' | 'getToken' | 'refresh'>;

/**
 * Turnstile token client bound to a container element. Nothing loads until the first warmUp()
 * or getToken(), so api.js stays off the page until the chat is used.
 */
export function useTurnstileToken(containerRef: RefObject<HTMLElement | null>): TokenClient {
  const sourceRef = useRef<TokenSource | null>(null);

  useEffect(
    () => () => {
      sourceRef.current?.dispose();
      sourceRef.current = null;
    },
    [],
  );

  return useMemo<TokenClient>(() => {
    const source = (): TokenSource | null => {
      if (sourceRef.current) return sourceRef.current;
      const container = containerRef.current;
      if (!container) return null;
      sourceRef.current = createTokenSource(container, { siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '' });
      return sourceRef.current;
    };
    return {
      warmUp: () => source()?.warmUp(),
      getToken: () => source()?.getToken() ?? Promise.reject(new TokenError('widget container missing')),
      refresh: () => sourceRef.current?.refresh(),
    };
  }, [containerRef]);
}
