// In-memory reveal state survives ClientRouter section changes, but not a reload.
const revealedSlides = new Map<string, Set<number>>();

export function getRevealedSlides(section: string) {
  return new Set(revealedSlides.get(section) || []);
}

export function saveRevealedSlides(section: string, revealed: Set<number>) {
  revealedSlides.set(section, new Set(revealed));
}

export function clearRevealedSlides() {
  revealedSlides.clear();
}
