// Temporarily off in production. true brings back the AI section, its menu item and the hero chat button.
export const SHOW_AI = false;

// The design's section order; the GL shapes and group offsets are indexed by it.
export const DESIGN_SECTIONS = ['hero', 'about', 'experience', 'ai', 'projects', 'stack', 'contact'] as const;

export type SectionKey = (typeof DESIGN_SECTIONS)[number];

// Rendered [data-sec] sections in document order; navigation, goTo and the GL morph index into it.
export const SECTIONS: readonly SectionKey[] = DESIGN_SECTIONS.filter((key) => SHOW_AI || key !== 'ai');

export function sectionIndex(key: SectionKey): number {
  return SECTIONS.indexOf(key);
}
