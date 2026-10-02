export interface ViewportRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface GroupTarget {
  x: number;
  y: number;
  scale: number;
}

// Half the visible height at z 0 for the 42 degree camera at distance 8.2.
const HALF_H = Math.tan((21 * Math.PI) / 180) * 8.2;

// Places the sphere on the hero photo: centred horizontally, 36% down the image, sized by its width.
export function heroAnchor(rect: ViewportRect, viewportWidth: number, viewportHeight: number): GroupTarget {
  const halfW = (HALF_H * viewportWidth) / viewportHeight;
  return {
    x: ((rect.left + rect.width * 0.5) / viewportWidth * 2 - 1) * halfW,
    y: -((rect.top + rect.height * 0.36) / viewportHeight * 2 - 1) * HALF_H,
    scale: Math.max(0.45, ((rect.width / viewportHeight) * 2 * HALF_H) / 4.6),
  };
}

// e = 0 sits on the anchor, e = 1 on the section offset target.
export function blendFromAnchor(anchor: GroupTarget, target: GroupTarget, e: number): GroupTarget {
  return {
    x: anchor.x + (target.x - anchor.x) * e,
    y: anchor.y + (target.y - anchor.y) * e,
    scale: anchor.scale + (target.scale - anchor.scale) * e,
  };
}
