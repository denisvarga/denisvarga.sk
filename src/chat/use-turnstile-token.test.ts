import { act, createElement, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrustedScriptURL, TurnstileApi, TurnstileRenderOptions } from '../types/turnstile';
import { TURNSTILE_SRC } from './turnstile-loader';
import { createTokenSource, TOKEN_DEADLINE_MS, TOKEN_MAX_AGE_MS, TokenError } from './turnstile-token-source';
import { useAgentChat, type AgentChat } from './use-agent-chat';
import { useTurnstileToken, type TokenClient } from './use-turnstile-token';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

interface FakeTurnstile {
  readonly api: TurnstileApi;
  options(): TurnstileRenderOptions;
}

function fakeTurnstile(): FakeTurnstile {
  let rendered: TurnstileRenderOptions | null = null;
  const api: TurnstileApi = {
    render: vi.fn((_container: HTMLElement | string, options: TurnstileRenderOptions) => {
      rendered = options;
      return 'widget-1';
    }),
    execute: vi.fn(),
    reset: vi.fn(),
    remove: vi.fn(),
  };
  return {
    api,
    options: () => {
      if (!rendered) throw new Error('widget not rendered');
      return rendered;
    },
  };
}

const flush = () => act(async () => {});

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.head.replaceChildren();
  delete window.turnstile;
  delete window.trustedTypes;
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('createTokenSource', () => {
  it('renders a managed, execute-on-demand, interaction-only widget for the ask action', async () => {
    const fake = fakeTurnstile();
    const source = createTokenSource(container, { siteKey: 'site', load: () => Promise.resolve(fake.api) });
    const token = source.getToken();
    await flush();
    expect(fake.options()).toMatchObject({
      sitekey: 'site',
      action: 'ask',
      execution: 'execute',
      appearance: 'interaction-only',
    });
    expect(fake.api.execute).toHaveBeenCalledWith(container);
    fake.options().callback?.('tok-1');
    await expect(token).resolves.toBe('tok-1');
  });

  it('rejects at the 15 s deadline when no token ever arrives, and resets the widget', async () => {
    vi.useFakeTimers();
    const fake = fakeTurnstile();
    const source = createTokenSource(container, { siteKey: 'site', load: () => Promise.resolve(fake.api) });
    const token = source.getToken();
    const settled = vi.fn();
    token.then(settled, settled);
    await vi.advanceTimersByTimeAsync(TOKEN_DEADLINE_MS - 1);
    expect(settled).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await expect(token).rejects.toBeInstanceOf(TokenError);
    expect(fake.api.reset).toHaveBeenCalledWith('widget-1');
  });

  it('does not execute a solved widget again when the input is refocused', async () => {
    const fake = fakeTurnstile();
    const source = createTokenSource(container, { siteKey: 'site', load: () => Promise.resolve(fake.api) });
    source.warmUp();
    await flush();
    fake.options().callback?.('warm');
    source.warmUp();
    await flush();
    expect(fake.api.execute).toHaveBeenCalledTimes(1);
    await expect(source.getToken()).resolves.toBe('warm');
    source.refresh();
    fake.options().callback?.('next');
    await expect(source.getToken()).resolves.toBe('next');
  });

  it('stops the deadline while an interactive challenge is on screen', async () => {
    vi.useFakeTimers();
    const fake = fakeTurnstile();
    const source = createTokenSource(container, { siteKey: 'site', load: () => Promise.resolve(fake.api) });
    const token = source.getToken();
    await vi.advanceTimersByTimeAsync(0);
    fake.options()['before-interactive-callback']?.();
    await vi.advanceTimersByTimeAsync(TOKEN_DEADLINE_MS * 3);
    fake.options().callback?.('solved-slowly');
    await expect(token).resolves.toBe('solved-slowly');
  });

  it('rejects immediately on a widget error and retries from a clean state', async () => {
    const fake = fakeTurnstile();
    const source = createTokenSource(container, { siteKey: 'site', load: () => Promise.resolve(fake.api) });
    const first = source.getToken();
    await flush();
    expect(fake.options()['error-callback']?.('300030')).toBe(true);
    await expect(first).rejects.toBeInstanceOf(TokenError);
    const second = source.getToken();
    await flush();
    expect(fake.api.execute).toHaveBeenCalledTimes(2);
    fake.options().callback?.('tok-2');
    await expect(second).resolves.toBe('tok-2');
  });

  it('reuses a pre-fetched token only while it is younger than 280 s', async () => {
    let now = 0;
    const fake = fakeTurnstile();
    const source = createTokenSource(container, { siteKey: 'site', load: () => Promise.resolve(fake.api), now: () => now });
    source.warmUp();
    await flush();
    fake.options().callback?.('early');
    await expect(source.getToken()).resolves.toBe('early');

    source.refresh();
    expect(fake.api.reset).toHaveBeenCalledTimes(2);
    fake.options().callback?.('stale');
    now += TOKEN_MAX_AGE_MS;
    const fresh = source.getToken();
    await flush();
    expect(fake.api.execute).toHaveBeenCalledTimes(3);
    fake.options().callback?.('fresh');
    await expect(fresh).resolves.toBe('fresh');
  });

  it('spaces the container while a challenge shows and until the widget is reset', async () => {
    const fake = fakeTurnstile();
    const source = createTokenSource(container, { siteKey: 'site', load: () => Promise.resolve(fake.api) });
    const token = source.getToken();
    await flush();
    fake.options()['before-interactive-callback']?.();
    fake.options().callback?.('solved');
    await expect(token).resolves.toBe('solved');
    expect(container.hasAttribute('data-interactive')).toBe(true);
    source.refresh();
    expect(container.hasAttribute('data-interactive')).toBe(false);
  });

  it('rejects at once when the script fails, and the next call loads again', async () => {
    const fake = fakeTurnstile();
    const load = vi
      .fn<() => Promise<TurnstileApi>>()
      .mockRejectedValueOnce(new Error('blocked'))
      .mockResolvedValue(fake.api);
    const source = createTokenSource(container, { siteKey: 'site', load });
    await expect(source.getToken()).rejects.toThrow('blocked');
    const retry = source.getToken();
    await flush();
    fake.options().callback?.('tok');
    await expect(retry).resolves.toBe('tok');
    expect(load).toHaveBeenCalledTimes(2);
  });
});

describe('loadTurnstile', () => {
  it('creates the turnstile-loader policy once and only allows the Turnstile URL', async () => {
    const createPolicy = vi.fn((name: string, rules: { createScriptURL?: (input: string) => string }) => ({
      name,
      createScriptURL: (input: string) => rules.createScriptURL?.(input) as unknown as TrustedScriptURL,
    }));
    window.trustedTypes = { createPolicy };
    const { loadTurnstile } = await import('./turnstile-loader');

    const first = loadTurnstile();
    const script = document.head.querySelector('script');
    expect(script?.src).toBe(TURNSTILE_SRC);
    script?.dispatchEvent(new Event('error'));
    await expect(first).rejects.toThrow('failed to load');
    expect(document.head.querySelector('script')).toBeNull();

    const second = loadTurnstile();
    const retried = document.head.querySelector('script');
    expect(retried).not.toBeNull();
    const fake = fakeTurnstile();
    window.turnstile = fake.api;
    retried?.dispatchEvent(new Event('load'));
    await expect(second).resolves.toBe(fake.api);

    expect(createPolicy).toHaveBeenCalledTimes(1);
    expect(createPolicy.mock.calls[0]?.[0]).toBe('turnstile-loader');
    const rules = createPolicy.mock.calls[0]?.[1];
    expect(() => rules?.createScriptURL?.('https://evil.example/x.js')).toThrow(TypeError);
  });

  it('loads without a policy where Trusted Types are unsupported', async () => {
    const { loadTurnstile } = await import('./turnstile-loader');
    void loadTurnstile();
    expect(document.head.querySelector('script')?.src).toBe(TURNSTILE_SRC);
  });
});

describe('chat wiring', () => {
  it('does not load api.js until the chat is used', async () => {
    const client: { current: TokenClient | null } = { current: null };
    function Probe() {
      const ref = useRef<HTMLDivElement>(null);
      client.current = useTurnstileToken(ref);
      return createElement('div', { ref });
    }
    act(() => root.render(createElement(Probe)));
    expect(document.head.querySelector('script')).toBeNull();
    act(() => client.current?.warmUp());
    expect(document.head.querySelector('script')?.src).toBe(TURNSTILE_SRC);
  });

  it('clears loading and shows the error copy when the token never arrives', async () => {
    vi.useFakeTimers();
    const fake = fakeTurnstile();
    const tokens = createTokenSource(container, { siteKey: 'site', load: () => Promise.resolve(fake.api) });
    const post = vi.fn();
    const chat: { current: AgentChat | null } = { current: null };
    function Probe() {
      chat.current = useAgentChat({ lang: 'en', errorText: 'ERROR COPY', tokens, post });
      return null;
    }
    act(() => root.render(createElement(Probe)));
    await act(async () => {
      void chat.current?.ask('Hello');
    });
    expect(chat.current?.state.loading).toBe(true);
    await act(() => vi.advanceTimersByTimeAsync(TOKEN_DEADLINE_MS));
    expect(chat.current?.state.loading).toBe(false);
    expect(chat.current?.state.messages.at(-1)).toMatchObject({ role: 'assistant', text: 'ERROR COPY', failed: true });
    expect(post).not.toHaveBeenCalled();
  });
});
