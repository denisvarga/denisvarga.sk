import { act, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { entranceEnd, lastEntrance, useHeroEntranceDone, type EntranceStep } from './use-hero-entrance-done';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function Hero({ words }: { words: number }) {
  const hostRef = useRef<HTMLElement>(null);
  const subRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const steps: EntranceStep[] = [
    { kind: 'rise', delay: 100, target: () => subRef.current },
    { kind: 'split', delay: 200, words, target: () => titleRef.current },
    { kind: 'rise', delay: 800, target: () => badgeRef.current },
  ];
  useHeroEntranceDone(hostRef, steps);
  return (
    <section ref={hostRef}>
      <span ref={subRef} id="sub" data-enter="" />
      <h1 ref={titleRef} data-enter-split="">
        {Array.from({ length: words }, (_, i) => (
          <span key={i} className="word-mask">
            <span className="word" id={`w${i}`} />
          </span>
        ))}
      </h1>
      <div ref={badgeRef} id="badge" data-enter="">
        <span id="dot" data-pulse="" />
      </div>
    </section>
  );
}

function fireAnimationEnd(id: string, animationName: string): void {
  const event = new Event('animationend', { bubbles: true });
  Object.defineProperty(event, 'animationName', { value: animationName });
  act(() => {
    document.getElementById(id)?.dispatchEvent(event);
  });
}

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

const host = () => container.querySelector('section');

describe('lastEntrance', () => {
  it('picks the step that ends last, including the word stagger', () => {
    const sub = { kind: 'rise', delay: 100 } as const;
    const badge = { kind: 'rise', delay: 800 } as const;
    expect(entranceEnd(badge)).toBe(2100);
    expect(entranceEnd({ kind: 'split', delay: 200, words: 3 })).toBe(1560);
    expect(entranceEnd({ kind: 'fade', delay: 350 })).toBe(1950);
    expect(lastEntrance([sub, { kind: 'split', delay: 200, words: 3 }, badge])).toBe(badge);
    const longTitle = { kind: 'split', delay: 200, words: 14 } as const;
    expect(lastEntrance([sub, longTitle, badge])).toBe(longTitle);
  });
});

describe('useHeroEntranceDone', () => {
  it('ignores animationend from earlier children and from other animations', () => {
    act(() => root.render(<Hero words={3} />));

    fireAnimationEnd('sub', 'enter-rise');
    fireAnimationEnd('w2', 'enter-word');
    fireAnimationEnd('dot', 'pulse');
    fireAnimationEnd('badge', 'enter-fade');

    expect(host()?.hasAttribute('data-in')).toBe(false);
  });

  it('sets data-in when the last animation of the last element ends', () => {
    act(() => root.render(<Hero words={3} />));
    fireAnimationEnd('badge', 'enter-rise');
    expect(host()?.hasAttribute('data-in')).toBe(true);
  });

  it('watches the last word when a long title ends after the badge', () => {
    act(() => root.render(<Hero words={14} />));
    fireAnimationEnd('badge', 'enter-rise');
    fireAnimationEnd('w12', 'enter-word');
    expect(host()?.hasAttribute('data-in')).toBe(false);
    fireAnimationEnd('w13', 'enter-word');
    expect(host()?.hasAttribute('data-in')).toBe(true);
  });
});
