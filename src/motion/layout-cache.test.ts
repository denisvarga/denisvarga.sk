import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getLayout, retainLayoutCache, settledViewportHeight } from './layout-cache';

describe('settledViewportHeight', () => {
  const phone = { width: 390, height: 800 };

  it('keeps the largest height while the URL bar shows and hides on a touch device', () => {
    expect(settledViewportHeight(phone, { width: 390, height: 744 }, true)).toBe(800);
    expect(settledViewportHeight({ width: 390, height: 744 }, phone, true)).toBe(800);
  });

  it('takes the new height on a width change or a change of 150 px or more', () => {
    expect(settledViewportHeight(phone, { width: 844, height: 340 }, true)).toBe(340);
    expect(settledViewportHeight(phone, { width: 390, height: 650 }, true)).toBe(650);
  });

  it('always takes the new height with a fine pointer', () => {
    expect(settledViewportHeight({ width: 1440, height: 900 }, { width: 1440, height: 860 }, false)).toBe(860);
  });
});

function setViewport(width: number, height: number): void {
  vi.stubGlobal('innerWidth', width);
  vi.stubGlobal('innerHeight', height);
}

function resize(width: number, height: number): void {
  setViewport(width, height);
  window.dispatchEvent(new Event('resize'));
}

describe('layout cache resize', () => {
  let release: () => void;

  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(pointer: coarse)' }));
    setViewport(390, 800);
    release = retainLayoutCache();
  });

  afterEach(() => {
    release();
    vi.unstubAllGlobals();
  });

  it('skips the remeasure for URL-bar height changes and remeasures on rotation', () => {
    expect(getLayout().viewportHeight).toBe(800);
    resize(390, 744);
    expect(getLayout().viewportHeight).toBe(800);
    resize(844, 390);
    expect(getLayout()).toMatchObject({ viewportWidth: 844, viewportHeight: 390 });
  });
});
