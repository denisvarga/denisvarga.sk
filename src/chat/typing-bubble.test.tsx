import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startDesignTypewriter } from '../../scripts/oracles/design-typewriter';
import { TypingBubble } from './typing-bubble';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const TEXT = 'Denis builds custom WordPress and WooCommerce sites, AI agents and automations.';

let container: HTMLDivElement;
let root: Root;

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduce && query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

const visible = () => container.querySelector('[aria-hidden="true"]')?.textContent;
const hidden = () => container.querySelector('.visually-hidden')?.textContent;

beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('TypingBubble', () => {
  it('matches the design typewriter (18 ms, +3 chars) at sampled times', () => {
    mockReducedMotion(false);
    act(() => root.render(<TypingBubble text={TEXT} animate />));
    const oracle = startDesignTypewriter(TEXT);
    let elapsed = 0;
    for (const at of [0, 1, 17, 18, 19, 36, 54, 100, 250, 450, 460, 600]) {
      act(() => vi.advanceTimersByTime(at - elapsed));
      elapsed = at;
      expect(visible(), `at ${at} ms`).toBe(oracle.visible());
    }
    expect(visible()).toBe(TEXT);
    expect(vi.getTimerCount()).toBe(0);
    oracle.stop();
  });

  it('always exposes the full text to assistive technology', () => {
    mockReducedMotion(false);
    act(() => root.render(<TypingBubble text={TEXT} animate />));
    expect(visible()).toBe('');
    expect(hidden()).toBe(TEXT);
  });

  it('completes instantly when animation is switched off mid-way', () => {
    mockReducedMotion(false);
    act(() => root.render(<TypingBubble text={TEXT} animate />));
    act(() => vi.advanceTimersByTime(36));
    expect(visible()).toBe(TEXT.slice(0, 6));
    act(() => root.render(<TypingBubble text={TEXT} animate={false} />));
    expect(visible()).toBe(TEXT);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('shows the full text at once under reduced motion', () => {
    mockReducedMotion(true);
    act(() => root.render(<TypingBubble text={TEXT} animate />));
    expect(visible()).toBe(TEXT);
    expect(vi.getTimerCount()).toBe(0);
  });
});
