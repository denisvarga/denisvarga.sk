import { afterEach, describe, expect, it, vi } from 'vitest';
import { isScrollLocked, lockScroll, subscribeScrollLock } from './use-scroll-lock';

const releases: (() => void)[] = [];
const lock = () => {
  const release = lockScroll();
  releases.push(release);
  return release;
};

afterEach(() => {
  for (const release of releases.splice(0)) release();
});

describe('scroll lock', () => {
  it('notifies on the first lock and the last release only', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeScrollLock(listener);
    const releaseMenu = lock();
    const releaseDrawer = lock();
    expect(listener.mock.calls).toEqual([[true]]);
    expect(isScrollLocked()).toBe(true);
    expect(document.documentElement.style.overflow).toBe('hidden');

    releaseMenu();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(isScrollLocked()).toBe(true);

    releaseDrawer();
    expect(listener.mock.calls).toEqual([[true], [false]]);
    expect(isScrollLocked()).toBe(false);
    expect(document.documentElement.style.overflow).toBe('');
    unsubscribe();
  });

  it('ignores a second release of the same lock', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeScrollLock(listener);
    const releaseMenu = lock();
    lock();
    releaseMenu();
    releaseMenu();
    expect(isScrollLocked()).toBe(true);
    expect(listener.mock.calls).toEqual([[true]]);
    unsubscribe();
  });

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn();
    subscribeScrollLock(listener)();
    lock()();
    expect(listener).not.toHaveBeenCalled();
  });
});
