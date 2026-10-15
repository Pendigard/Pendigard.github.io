import { navigate } from 'astro:transitions/client';
import { sectionIndex, sectionNavigation } from '../config/section-navigation';

let restoreTarget: string | undefined;
let restorePosition = false;

// Only gestures and explicit "previous section" returns restore a slide.
// Ordinary links always enter at the first slide, while reveal state survives.
export function restoreSectionOnNextNavigation(href: string) {
  const url = new URL(href, location.href);
  restoreTarget = url.pathname + url.search;
}

export function recordSectionEntry(url: URL, navigationType: string) {
  restorePosition = navigationType === 'traverse' || restoreTarget === url.pathname + url.search;
  restoreTarget = undefined;
}

export function shouldRestoreSectionPosition() { return restorePosition; }

export function moveToAdjacentSection(step: -1 | 1) {
  const current = sectionIndex(location.pathname);
  const next = sectionNavigation[current + step];
  if (next) {
    restoreSectionOnNextNavigation(next.href);
    void navigate(next.href);
  }
}

export function returnHomeFromFirstSlide(current: number) {
  if (current === 0) void navigate('/');
}
