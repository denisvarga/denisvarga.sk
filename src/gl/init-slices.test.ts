import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runIdleSlices, whenLoaded, type InitSlice } from './init-slices';

let idleQueue: Map<number, IdleRequestCallback>;
let nextId: number;

async function flushIdle(): Promise<void> {
  const [id, callback] = [...idleQueue.entries()][0] ?? [];
  if (id === undefined || !callback) throw new Error('no idle callback pending');
  idleQueue.delete(id);
  callback({ didTimeout: false, timeRemaining: () => 50 });
  // Let the awaiting slice runner continue to its next whenIdle call.
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

beforeEach(() => {
  idleQueue = new Map();
  nextId = 1;
  vi.stubGlobal('requestIdleCallback', (callback: IdleRequestCallback) => {
    const id = nextId++;
    idleQueue.set(id, callback);
    return id;
  });
  vi.stubGlobal('cancelIdleCallback', (id: number) => idleQueue.delete(id));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function recordingSlices(count: number, log: string[]): InitSlice[] {
  return Array.from({ length: count }, (_, i) => ({ name: `s${i}`, run: () => void log.push(`s${i}`) }));
}

describe('runIdleSlices', () => {
  it('runs exactly one slice per idle callback, in order', async () => {
    const log: string[] = [];
    const done = runIdleSlices(recordingSlices(3, log), new AbortController().signal);
    expect(log).toEqual([]);
    await flushIdle();
    expect(log).toEqual(['s0']);
    await flushIdle();
    expect(log).toEqual(['s0', 's1']);
    await flushIdle();
    await expect(done).resolves.toBeUndefined();
    expect(log).toEqual(['s0', 's1', 's2']);
    expect(idleQueue.size).toBe(0);
  });

  it('records a performance measure per slice', async () => {
    const done = runIdleSlices(recordingSlices(1, []), new AbortController().signal);
    await flushIdle();
    await done;
    expect(performance.getEntriesByName('gl-init:s0', 'measure').length).toBeGreaterThan(0);
  });

  it('cancels the pending idle callback and runs nothing more after abort', async () => {
    const log: string[] = [];
    const controller = new AbortController();
    const done = runIdleSlices(recordingSlices(3, log), controller.signal);
    await flushIdle();
    controller.abort();
    await expect(done).rejects.toBeDefined();
    expect(idleQueue.size).toBe(0);
    expect(log).toEqual(['s0']);
  });

  it('stops after an async slice when aborted while it was pending', async () => {
    const log: string[] = [];
    const controller = new AbortController();
    let finish: (() => void) | undefined;
    const slices: InitSlice[] = [
      { name: 'async', run: () => new Promise<void>((resolve) => (finish = resolve)) },
      ...recordingSlices(1, log),
    ];
    const done = runIdleSlices(slices, controller.signal);
    await flushIdle();
    controller.abort();
    finish?.();
    await expect(done).rejects.toBeDefined();
    expect(log).toEqual([]);
  });

  it('propagates a slice error', async () => {
    const done = runIdleSlices([{ name: 'boom', run: () => { throw new Error('boom'); } }], new AbortController().signal);
    const assertion = expect(done).rejects.toThrow('boom');
    await flushIdle();
    await assertion;
  });
});

describe('whenLoaded', () => {
  it('resolves immediately once the document is complete', async () => {
    await expect(whenLoaded(new AbortController().signal)).resolves.toBeUndefined();
  });
});
