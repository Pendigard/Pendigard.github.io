// Static sections keep their reveal and position state for one visit to the site.
export interface SectionState { slide: number; revealed: number[] }

const sections = new Map<string, SectionState>();

export function getSectionState(section: string): SectionState | undefined {
  return sections.get(section);
}

export function saveSectionState(section: string, slide: number, revealed: Set<number>) {
  sections.set(section, { slide, revealed: [...revealed] });
}

export function clearSectionStates() {
  sections.clear();
}
