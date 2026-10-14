import { navigate } from 'astro:transitions/client';
import { sectionIndex, sectionNavigation } from '../config/section-navigation';

export function moveToAdjacentSection(step: -1 | 1) {
  const current = sectionIndex(location.pathname);
  const next = sectionNavigation[current + step];
  if (next) void navigate(next.href);
}

export function returnHomeFromFirstSlide(current: number) {
  if (current === 0) void navigate('/');
}
