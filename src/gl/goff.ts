import { DESIGN_SECTIONS, SECTIONS } from '../sections/section-order';

export type GroupOffset = readonly [x: number, y: number, scale: number, opacity: number];

// Group placement per section shape, indexed like DESIGN_SECTIONS.
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

// Shape index of each rendered [data-sec] section; hidden sections leave their shape out of the morph.
export const SECTION_SHAPES: readonly number[] = SECTIONS.map((key) => DESIGN_SECTIONS.indexOf(key));

export function groupOffset(index: number): GroupOffset {
  return GOFF[Math.min(SHAPE_COUNT - 1, Math.max(0, index))]!;
}
