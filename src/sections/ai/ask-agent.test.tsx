import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { copyEn } from '../../i18n/copy-en';
import { LangProvider } from '../../i18n/lang-context';
import { PrivacyNotice } from '../../layout/privacy-notice';
import type { TurnstileRenderOptions } from '../../types/turnstile';
import { AskAgent } from './ask-agent';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const t = copyEn.ask;
let container: HTMLDivElement;
let root: Root;
let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

function installTurnstile() {
  window.turnstile = {
    render: vi.fn((_el: HTMLElement | string, options: TurnstileRenderOptions) => {
      window.turnstileCallback = options.callback;
      return 'w1';
    }),
    execute: vi.fn(() => window.turnstileCallback?.('token-123')),
    reset: vi.fn(),
    remove: vi.fn(),
  };
}

declare global {
  interface Window {
    turnstileCallback?: (token: string) => void;
  }
}

const input = () => container.querySelector('input') as HTMLInputElement;

function type(value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  act(() => {
    setter?.call(input(), value);
    input().dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function press(init: KeyboardEventInit) {
  await act(async () => {
    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, ...init }));
  });
}

const sentBodies = () => fetchMock.mock.calls.map(([, init]) => JSON.parse(String(init?.body)));
const retryButton = () => [...container.querySelectorAll('button')].find((b) => b.textContent === t.retry);

beforeEach(() => {
  vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '1x00000000000000000000AA');
  installTurnstile();
  fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(Response.json({ reply: 'An answer.', kind: 'answer' })));
  vi.stubGlobal('fetch', fetchMock);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <LangProvider lang="en">
        <AskAgent />
      </LangProvider>,
    ),
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete window.turnstile;
  delete window.turnstileCallback;
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('AskAgent', () => {
  it('renders the card with a labelled, length-limited input and no chat yet', () => {
    const card = container.querySelector('#ask');
    expect(card?.hasAttribute('data-reveal')).toBe(true);
    expect(input().maxLength).toBe(500);
    expect(container.querySelector(`label[for="${input().id}"]`)?.textContent).toBe(t.placeholder);
    expect(container.querySelector('button[aria-label]')?.getAttribute('aria-label')).toBe(t.send);
    expect(container.querySelector('[data-lenis-prevent]')).toBeNull();
    expect(window.turnstile?.render).not.toHaveBeenCalled();
  });

  it('says what the chat stores and opens the privacy disclosure from the note', () => {
    const footer = document.createElement('div');
    document.body.append(footer);
    const footerRoot = createRoot(footer);
    act(() =>
      footerRoot.render(
        <LangProvider lang="en">
          <PrivacyNotice />
        </LangProvider>,
      ),
    );
    vi.stubGlobal('scrollTo', vi.fn());
    const link = [...container.querySelectorAll('button')].find((b) => b.textContent === t.privacyLink);
    expect(link?.parentElement?.textContent).toContain(t.privacyNote);
    act(() => link?.click());
    expect(footer.querySelector('details')?.open).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    act(() => footerRoot.unmount());
    footer.remove();
  });

  it('offers a send key on mobile keyboards and describes the input by the note', () => {
    expect(input().getAttribute('enterkeyhint')).toBe('send');
    const note = document.getElementById(input().getAttribute('aria-describedby') ?? '');
    expect(note?.textContent).toContain(t.note);
  });

  it('marks send, the chips and the log busy while a question is pending', async () => {
    let answer: ((response: Response) => void) | undefined;
    fetchMock.mockReturnValueOnce(new Promise<Response>((resolve) => (answer = resolve)));
    const busyButtons = () => [...container.querySelectorAll('button[aria-disabled="true"]')].map((b) => b.getAttribute('aria-label') ?? b.textContent);
    expect(busyButtons()).toEqual([]);
    type('Is he available?');
    await press({});
    expect(busyButtons()).toEqual([t.send, ...t.suggestions]);
    expect(container.querySelector('[data-lenis-prevent]')?.getAttribute('aria-busy')).toBe('true');
    await act(async () => answer?.(Response.json({ reply: 'An answer.', kind: 'answer' })));
    expect(busyButtons()).toEqual([]);
    expect(container.querySelector('[data-lenis-prevent]')?.getAttribute('aria-busy')).toBe('false');
  });

  it('does not submit on Enter while an IME composition is active', async () => {
    type('konnichiwa');
    await press({ isComposing: true });
    await press({ keyCode: 229 });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(input().value).toBe('konnichiwa');
  });

  it('submits on Enter, clears the input and announces the reply once', async () => {
    type('  Is he available?  ');
    await press({});
    expect(input().value).toBe('');
    expect(sentBodies()).toEqual([
      { messages: [{ role: 'user', content: 'Is he available?' }], lang: 'en', turnstileToken: 'token-123' },
    ]);
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe('An answer.');
    expect(container.querySelector('[data-lenis-prevent]')?.textContent).toContain('Is he available?');
  });

  it('asks a suggestion chip directly and shows the daily cap copy without a retry', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ error: 'daily_cap' }, { status: 429 }));
    const chip = [...container.querySelectorAll('button')].find((b) => b.textContent === t.suggestions[0]);
    await act(async () => chip?.click());
    expect(sentBodies()[0]?.messages).toEqual([{ role: 'user', content: t.suggestions[0] }]);
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe(t.errors.dailyCap);
    expect(retryButton()).toBeUndefined();
  });

  it('explains a rate limit and asks the same question once more on retry', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ error: 'rate_limited' }, { status: 429 }));
    type('Is he available?');
    await press({});
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe(t.errors.rateLimited);
    await act(async () => retryButton()?.click());
    expect(sentBodies()).toHaveLength(2);
    expect(sentBodies()[1]?.messages).toEqual([{ role: 'user', content: 'Is he available?' }]);
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe('An answer.');
    expect(container.querySelector('[data-lenis-prevent]')?.textContent).not.toContain(t.errors.rateLimited);
    expect(retryButton()).toBeUndefined();
  });

  it('uses the fallback copy with a retry for any other failure', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ error: 'verification_failed' }, { status: 403 }));
    type('Hi');
    await press({});
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe(t.errors.fallback);
    expect(retryButton()).toBeDefined();
  });

  it('a new question completes the previous typewriter instantly', async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValueOnce(Response.json({ reply: 'A long first answer that is still typing.', kind: 'answer' }));
    type('first');
    await press({});
    await act(() => vi.advanceTimersByTimeAsync(36));
    const bubble = () => container.querySelector('[data-lenis-prevent] [aria-hidden="true"]')?.textContent;
    expect(bubble()).toBe('A long');
    fetchMock.mockReturnValueOnce(new Promise(() => {}));
    type('second');
    await press({});
    expect(bubble()).toBe('A long first answer that is still typing.');
    expect(container.querySelector('[data-pulse]')?.textContent).toBe(t.thinking);
  });
});
