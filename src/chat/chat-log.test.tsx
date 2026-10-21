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
});

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

  it('offers a retry only on a retryable failed reply and reports its id', () => {
    const onRetry = vi.fn();
    const messages: ChatMessage[] = [
      { id: 1, role: 'user', text: 'q1', failed: false },
      { id: 2, role: 'assistant', text: 'Busy, try again in a minute.', failed: true, retryable: true },
      { id: 3, role: 'user', text: 'q2', failed: false },
      { id: 4, role: 'assistant', text: 'Done for today.', failed: true },
    ];
    act(() => root.render(<ChatLog messages={messages} loading={false} typingId={null} labels={LABELS} onRetry={onRetry} />));
    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]?.textContent).toBe('Try again');
    act(() => buttons[0]?.click());
    expect(onRetry).toHaveBeenCalledWith(2);
  });
});
