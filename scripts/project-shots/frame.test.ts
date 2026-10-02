import { describe, expect, it } from 'vitest';
import { frameAroundScreen, type FrameSpec } from './frame.ts';
import type { Quad } from './screen-overlay.ts';

const SPEC: FrameSpec = { screenHeight: 0.25, screenCenterY: 0.5, aspect: 1.6 };
const SCREEN: Quad = [[900, 500], [1300, 500], [1300, 750], [900, 750]];

describe('frameAroundScreen', () => {
  it('sizes the crop from the screen height and centres the screen without a span', () => {
    const { crop, screenHeight, laptopWidth, shifted } = frameAroundScreen(SCREEN, 3000, 2000, SPEC);
    expect(crop).toEqual({ left: 300, top: 125, width: 1600, height: 1000 });
    expect(screenHeight).toBeCloseTo(0.25, 6);
    expect(laptopWidth).toBeNull();
    expect(shifted).toBe(false);
  });

  it('centres the whole laptop when its span is known', () => {
    const { crop, laptopWidth } = frameAroundScreen(SCREEN, 3000, 2000, SPEC, { left: 700, right: 1300 });
    expect(crop.left).toBe(200);
    expect(laptopWidth).toBeCloseTo(600 / 1600, 6);
  });

  it('shrinks to the image when the scene is too tight and reports the shift', () => {
    const { crop, screenHeight, shifted } = frameAroundScreen(SCREEN, 1600, 900, SPEC);
    expect(crop).toEqual({ left: 160, top: 0, width: 1440, height: 900 });
    expect(screenHeight).toBeCloseTo(250 / 900, 6);
    expect(shifted).toBe(true);
  });
});
