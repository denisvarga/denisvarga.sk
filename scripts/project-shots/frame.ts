import type { Quad } from './screen-overlay.ts';

export interface Rect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface FrameSpec {
  /** Screen height as a fraction of the output height (sets the apparent laptop size). */
  readonly screenHeight: number;
  /** Where the screen centre lands vertically, as a fraction of the output height. */
  readonly screenCenterY: number;
  readonly aspect: number;
}

/** Horizontal extent of the whole laptop (screen and base) in scene pixels. */
export interface Span {
  readonly left: number;
  readonly right: number;
}

export interface Framing {
  readonly crop: Rect;
  /** Achieved screen height fraction; above the spec when the scene is too tight to crop. */
  readonly screenHeight: number;
  /** Achieved vertical position of the screen centre; off-spec when the crop hit an edge. */
  readonly screenCenterY: number;
  /** Laptop span width as a fraction of the output width, when the span is known. */
  readonly laptopWidth: number | null;
  /** True when the crop hit an image edge and the subject could not be centred. */
  readonly shifted: boolean;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// Crops the scene so every laptop has the same apparent size and position, whatever the model drew.
// Size follows the screen height, which barely changes with how far the laptop is turned, while a
// turned base sticks out sideways; the measured span therefore only centres the laptop.
export function frameAroundScreen(quad: Quad, imageWidth: number, imageHeight: number, spec: FrameSpec, span?: Span): Framing {
  const [tl, tr, br, bl] = quad;
  const screenH = (Math.hypot(bl[0] - tl[0], bl[1] - tl[1]) + Math.hypot(br[0] - tr[0], br[1] - tr[1])) / 2;
  const cx = span ? (span.left + span.right) / 2 : (tl[0] + tr[0] + br[0] + bl[0]) / 4;
  const cy = (tl[1] + tr[1] + br[1] + bl[1]) / 4;
  let height = screenH / spec.screenHeight;
  let width = height * spec.aspect;
  const fit = Math.min(1, imageWidth / width, imageHeight / height);
  width *= fit;
  height *= fit;
  const wantLeft = cx - width / 2;
  const wantTop = cy - spec.screenCenterY * height;
  const left = clamp(wantLeft, 0, imageWidth - width);
  const top = clamp(wantTop, 0, imageHeight - height);
  return {
    crop: { left: Math.round(left), top: Math.round(top), width: Math.round(width), height: Math.round(height) },
    screenHeight: screenH / height,
    screenCenterY: (cy - top) / height,
    laptopWidth: span ? (span.right - span.left) / width : null,
    shifted: Math.abs(left - wantLeft) > 1 || Math.abs(top - wantTop) > 1,
  };
}
