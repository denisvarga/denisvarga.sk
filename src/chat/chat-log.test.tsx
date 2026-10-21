import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatLog } from './chat-log';
import type { ChatMessage } from './chat-reducer';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const IMG = '<img src=x onerror="alert(1)">';
const LINK = '[x](javascript:alert(1))';
const LABELS = { you: 'You', agent: 'Agent', thinking: 'Thinking', retry: 'Try again' };
const noRetry = () => undefined;

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
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const VIEW = 300;

const render = (messages: ChatMessage[], loading: boolean) =>
  act(() => root.render(<ChatLog messages={messages} loading={loading} typingId={null} labels={LABELS} onRetry={noRetry} />));

/** A fake layout for the log: content height, scroll position and the top of each message. */
function fakeLayout(log: HTMLElement) {
  const layout = { height: VIEW, top: 0, tops: {} as Record<string, number> };
  Object.defineProperty(log, 'clientHeight', { configurable: true, get: () => VIEW });
  Object.defineProperty(log, 'scrollHeight', { configurable: true, get: () => layout.height });
  Object.defineProperty(log, 'scrollTop', {
    configurable: true,
    get: () => layout.top,
    set: (value: number) => {
      layout.top = Math.max(0, Math.min(value, layout.height - VIEW));
    },
  });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const id = this.dataset.messageId;
    return { top: id === undefined ? 0 : (layout.tops[id] ?? 0) - layout.top } as DOMRect;
  });
  return layout;
}

describe('ChatLog', () => {
  it('renders markup and markdown links from either side as literal text', () => {
    const messages: ChatMessage[] = [
      { id: 1, role: 'user', text: `${IMG} ${LINK}`, failed: false },
      { id: 2, role: 'assistant', text: `Sure: ${IMG} and ${LINK}`, failed: false },
    ];
    act(() => root.render(<ChatLog messages={messages} loading={false} typingId={null} labels={LABELS} onRetry={noRetry} />));

    expect(container.querySelector('img, a, script, iframe')).toBeNull();
    expect(container.textContent).toContain(`${IMG} ${LINK}`);
    expect(container.textContent).toContain(`Sure: ${IMG} and ${LINK}`);
  });

  it('links only contacts and known hosts in replies, never in questions', () => {
    const messages: ChatMessage[] = [
      { id: 1, role: 'user', text: 'Is hello@denisvarga.sk right?', failed: false },
      {
        id: 2,
        role: 'assistant',
        text: 'Yes: hello@denisvarga.dev or github.com/denisvarga. Not javascript:alert(1) or https://evil.example.com.',
        failed: false,
      },
      { id: 3, role: 'assistant', text: 'Email Denis at hello@denisvarga.dev.', failed: true, retryable: true },
    ];
    act(() => root.render(<ChatLog messages={messages} loading={false} typingId={null} labels={LABELS} onRetry={noRetry} />));
    const hrefs = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['mailto:hello@denisvarga.dev', 'https://github.com/denisvarga', 'mailto:hello@denisvarga.dev']);
    expect(container.querySelector('[data-message-id="1"] a')).toBeNull();
  });

  it('reads a new reply from its top and stops following once the reader scrolls up', () => {
    let resize: (() => void) | undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resize = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    const question: ChatMessage = { id: 1, role: 'user', text: 'q', failed: false };
    const reply: ChatMessage = { id: 2, role: 'assistant', text: 'A long answer.', failed: false };
    render([question], true);
    const log = container.querySelector<HTMLElement>('[data-lenis-prevent]');
    if (!log) throw new Error('log missing');
    const layout = fakeLayout(log);
    const grow = (height: number) => {
      layout.height = height;
      act(() => resize?.());
    };
    const scrollTo = (top: number) => {
      log.scrollTop = top;
      act(() => log.dispatchEvent(new Event('scroll')));
    };

    grow(400);
    expect(log.scrollTop).toBe(100);

    layout.tops['2'] = 380;
    render([question, reply], false);
    grow(900);
    expect(log.scrollTop).toBe(380);
    scrollTo(380);
    grow(1200);
    expect(log.scrollTop).toBe(380);

    scrollTo(200);
    grow(1300);
    expect(log.scrollTop).toBe(200);

    scrollTo(1300 - VIEW - 10);
    grow(1400);
    expect(log.scrollTop).toBe(1400 - VIEW);
  });

  it('offers a retry only on the last message when it failed retryably, and reports its id', () => {
    const onRetry = vi.fn();
    const busy: ChatMessage = { id: 2, role: 'assistant', text: 'Busy, try again in a minute.', failed: true, retryable: true };
    const history: ChatMessage[] = [{ id: 1, role: 'user', text: 'q1', failed: false }, busy];
    const show = (messages: ChatMessage[]) =>
      act(() => root.render(<ChatLog messages={messages} loading={false} typingId={null} labels={LABELS} onRetry={onRetry} />));

    show(history);
    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]?.textContent).toBe('Try again');
    act(() => buttons[0]?.click());
    expect(onRetry).toHaveBeenCalledWith(2);

    show([...history, { id: 3, role: 'user', text: 'q2', failed: false }, { id: 4, role: 'assistant', text: 'Sure.', failed: false }]);
    expect(container.querySelectorAll('button')).toHaveLength(0);

    show([...history, { id: 3, role: 'user', text: 'q2', failed: false }, { id: 4, role: 'assistant', text: 'Done for today.', failed: true }]);
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});
