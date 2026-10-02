import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getLenis } from './lenis-store';
import { useSmoothScroll } from './use-smooth-scroll';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const lenisMock = vi.hoisted(() => {
  type Instance = { options: unknown; raf: () => void; stop: ReturnType<typeof vi.fn>; destroy: ReturnType<typeof vi.fn> };
  const state = { instances: [] as Instance[] };
  const factory = () => ({
    default: class {
      raf = vi.fn();
      stop = vi.fn();
      destroy = vi.fn();
      constructor(public options: unknown) {
        state.instances.push(this);
      }
    },
  });
  return { state, factory };
});

vi.mock('lenis', lenisMock.factory);

let container: HTMLDivElement;
let root: Root;
let reduced = false;

function Probe() {
  useSmoothScroll(false);
  return null;
}

function mount(): void {
  act(() => root.render(createElement(Probe)));
}

beforeEach(() => {
  lenisMock.state.instances = [];
  reduced = false;
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduced && query.includes('reduce'), addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal('requestIdleCallback', (cb: IdleRequestCallback) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 0));
  vi.stubGlobal('cancelIdleCallback', (id: number) => clearTimeout(id));
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.documentElement.style.overflow = '';
  vi.doMock('lenis', lenisMock.factory);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useSmoothScroll', () => {
  it('creates Lenis with the design options, stores it and destroys it on unmount', async () => {
    mount();
    await vi.waitFor(() => expect(lenisMock.state.instances).toHaveLength(1));
    const lenis = lenisMock.state.instances[0]!;
    expect(lenis.options).toEqual({ lerp: 0.085, smoothWheel: true, autoRaf: false });
    expect(getLenis()).toBe(lenis);
    act(() => root.unmount());
    root = createRoot(container);
    expect(lenis.destroy).toHaveBeenCalledOnce();
    expect(getLenis()).toBeNull();
  });

  it('stops Lenis when a scroll lock was taken before it loaded', async () => {
    document.documentElement.style.overflow = 'hidden';
    mount();
    await vi.waitFor(() => expect(lenisMock.state.instances[0]?.stop).toHaveBeenCalledOnce());
  });

  it('never loads Lenis under prefers-reduced-motion', async () => {
    reduced = true;
    mount();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(lenisMock.state.instances).toHaveLength(0);
  });

  it('keeps native scrolling and logs one code when the import fails', async () => {
    vi.doMock('lenis', () => {
      throw new Error('chunk failed');
    });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    mount();
    await vi.waitFor(() => expect(error).toHaveBeenCalledWith('lenis_import_failed', expect.anything()));
    expect(lenisMock.state.instances).toHaveLength(0);
  });
});
