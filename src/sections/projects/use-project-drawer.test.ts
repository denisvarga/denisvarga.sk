import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { INITIAL_DRAWER, reduceDrawer, useProjectDrawer, wrapIndex, type ProjectDrawer } from './use-project-drawer';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('reduceDrawer', () => {
  const COUNT = 12;

  it('opens on the picked project', () => {
    expect(reduceDrawer(INITIAL_DRAWER, { type: 'open', index: 4 }, COUNT)).toEqual({ open: true, last: 4 });
  });

  it('wraps forward from the last project to the first', () => {
    expect(reduceDrawer({ open: true, last: 11 }, { type: 'step', delta: 1 }, COUNT)).toEqual({ open: true, last: 0 });
  });

  it('wraps backward from the first project to the last', () => {
    expect(reduceDrawer({ open: true, last: 0 }, { type: 'step', delta: -1 }, COUNT)).toEqual({ open: true, last: 11 });
  });

  it('keeps the last project when closing so the content stays while sliding out', () => {
    expect(reduceDrawer({ open: true, last: 7 }, { type: 'close' }, COUNT)).toEqual({ open: false, last: 7 });
  });

  it('ignores steps while closed', () => {
    const closed = { open: false, last: 3 };
    expect(reduceDrawer(closed, { type: 'step', delta: 1 }, COUNT)).toBe(closed);
  });

  it('wrapIndex handles values beyond one lap', () => {
    expect(wrapIndex(-13, COUNT)).toBe(11);
    expect(wrapIndex(25, COUNT)).toBe(1);
  });
});

function press(key: string): void {
  act(() => void document.dispatchEvent(new KeyboardEvent('keydown', { key })));
}

describe('useProjectDrawer', () => {
  let container: HTMLDivElement;
  let root: Root;
  let drawer: ProjectDrawer | null = null;

  function Probe() {
    drawer = useProjectDrawer(12);
    return null;
  }

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() => root.render(createElement(Probe)));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    document.documentElement.style.overflow = '';
  });

  it('steps with the arrow keys, wraps, closes on Escape and locks scroll while open', () => {
    const opener = document.createElement('button');
    act(() => drawer?.openAt(11, opener));
    expect(drawer?.openerRef.current).toBe(opener);
    expect(document.documentElement.style.overflow).toBe('hidden');

    press('ArrowRight');
    expect(drawer).toMatchObject({ open: true, last: 0 });
    press('ArrowLeft');
    press('ArrowLeft');
    expect(drawer?.last).toBe(10);

    press('Escape');
    expect(drawer).toMatchObject({ open: false, last: 10 });
    expect(document.documentElement.style.overflow).toBe('');

    press('ArrowRight');
    expect(drawer?.last).toBe(10);
  });
});
