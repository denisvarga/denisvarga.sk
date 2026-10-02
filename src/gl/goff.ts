export type GroupOffset = readonly [x: number, y: number, scale: number, opacity: number];

// Group placement per section shape, indexed like the [data-sec] sections.
export const GOFF: readonly GroupOffset[] = [
  [2.15, 0.35, 0.95, 0.85],
  [-2.6, 0, 0.85, 1],
  [2.75, 0, 0.8, 1],
  [2.6, 0, 0.9, 1],
  [0.8, -0.4, 1.0, 0.25],
  [2.8, -0.3, 0.7, 0.55],
  [0, 0.2, 1, 0.35],
];

export const SHAPE_COUNT = GOFF.length;

export function groupOffset(index: number): GroupOffset {
  return GOFF[Math.min(SHAPE_COUNT - 1, Math.max(0, index))]!;
}
