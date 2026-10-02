import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type FrameLoop = typeof import('./frame-loop');

let loop: FrameLoop;
let queue: Map<number, FrameRequestCallback>;
let nextId: number;
let clock: number;

function flushFrame(): void {
  clock += 16;
  const callbacks = [...queue.values()];
  queue.clear();
  for (const callback of callbacks) callback(clock);
}

function setHidden(hidden: boolean): void {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => (hidden ? 'hidden' : 'visible'),
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(async () => {
  queue = new Map();
  nextId = 1;
  clock = 0;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = nextId++;
    queue.set(id, callback);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    queue.delete(id);
  });
  vi.resetModules();
  loop = await import('./frame-loop');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  setHidden(false);
});

describe('frame loop', () => {
  it('runs subscribers by priority, insertion order within a priority', () => {
    const calls: string[] = [];
    const { FRAME_PRIORITY: P } = loop;
    loop.subscribeFrame('gl', P.gl, () => calls.push('gl'));
    loop.subscribeFrame('lenis', P.lenis, () => calls.push('lenis'));
    loop.subscribeFrame('stack', P.stack, () => calls.push('stack'));
    loop.subscribeFrame('progress', P.progress, () => calls.push('progress'));
    loop.subscribeFrame('progress-2', P.progress, () => calls.push('progress-2'));

    flushFrame();

    expect(calls).toEqual(['lenis', 'progress', 'progress-2', 'gl', 'stack']);
  });

  it('requests a single animation frame no matter how many subscribers', () => {
    loop.subscribeFrame('a', 0, () => {});
    loop.subscribeFrame('b', 10, () => {});
    expect(queue.size).toBe(1);
    flushFrame();
    expect(queue.size).toBe(1);
  });

  it('stops when the last subscriber leaves and restarts on a new one', () => {
    const offA = loop.subscribeFrame('a', 0, () => {});
    const offB = loop.subscribeFrame('b', 10, () => {});
    offA();
    expect(loop.isFrameLoopRunning()).toBe(true);
    offB();
    expect(loop.isFrameLoopRunning()).toBe(false);
    expect(queue.size).toBe(0);

    const spy = vi.fn();
    loop.subscribeFrame('c', 0, spy);
    expect(loop.isFrameLoopRunning()).toBe(true);
    flushFrame();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('stops after a frame in which every subscriber unsubscribed itself', () => {
    const off = loop.subscribeFrame('once', 0, () => off());
    flushFrame();
    expect(loop.isFrameLoopRunning()).toBe(false);
    expect(queue.size).toBe(0);
  });

  it('keeps running across visibilitychange hidden and visible', () => {
    const spy = vi.fn();
    loop.subscribeFrame('tick', 0, spy);
    flushFrame();

    setHidden(true);
    expect(loop.isFrameLoopRunning()).toBe(true);
    flushFrame();

    setHidden(false);
    expect(loop.isFrameLoopRunning()).toBe(true);
    flushFrame();

    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('removes a throwing subscriber, logs it, and keeps the others running', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const before = vi.fn();
    const after = vi.fn();
    const failure = new Error('boom');
    const broken = vi.fn(() => {
      throw failure;
    });
    loop.subscribeFrame('before', 0, before);
    loop.subscribeFrame('broken', 10, broken);
    loop.subscribeFrame('after', 20, after);

    flushFrame();
    flushFrame();

    expect(broken).toHaveBeenCalledTimes(1);
    expect(before).toHaveBeenCalledTimes(2);
    expect(after).toHaveBeenCalledTimes(2);
    expect(error).toHaveBeenCalledWith('frame_subscriber_failed', 'broken', failure);
    expect(loop.isFrameLoopRunning()).toBe(true);
  });

  it('passes the frame timestamp to subscribers', () => {
    const spy = vi.fn();
    loop.subscribeFrame('t', 0, spy);
    flushFrame();
    expect(spy).toHaveBeenCalledWith(16);
  });
});
