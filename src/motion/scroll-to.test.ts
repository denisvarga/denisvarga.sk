import { describe, expect, it, vi } from 'vitest';
import { onScrollLinkClick } from './scroll-to';

const click = (init: MouseEventInit = {}) => new MouseEvent('click', { bubbles: true, cancelable: true, ...init });

describe('onScrollLinkClick', () => {
  it('turns a plain left click into the smooth scroll instead of the jump', () => {
    const go = vi.fn();
    const event = click();
    onScrollLinkClick(event, go);
    expect(event.defaultPrevented).toBe(true);
    expect(go).toHaveBeenCalledOnce();
  });

  it.each([{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }])(
    'leaves %o to the browser',
    (init) => {
      const go = vi.fn();
      const event = click(init);
      onScrollLinkClick(event, go);
      expect(event.defaultPrevented).toBe(false);
      expect(go).not.toHaveBeenCalled();
    },
  );
});
