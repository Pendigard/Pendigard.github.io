import { clearHorizontalPositions, routeDepth } from './horizontal-navigation';
import { finishSectionNav, resetSectionNav } from './section-nav';
import { sectionIndex } from '../config/section-navigation';
import { clearSectionStates } from './section-reveals';
import { recordSectionEntry } from './section-navigation';

let pendingParent: string | undefined;

document.addEventListener('astro:before-preparation', (event) => {
  const fromUrl = new URL(event.from);
  const toUrl = new URL(event.to);
  const from = new URL(event.from).pathname;
  const to = new URL(event.to).pathname;
  const fromDepth = routeDepth(fromUrl);
  const toDepth = routeDepth(toUrl);
  const fromSection = sectionIndex(from);
  const toSection = sectionIndex(to);
  recordSectionEntry(toUrl, event.navigationType);
  document.documentElement.dataset.routeDirection =
    fromSection >= 0 && toSection >= 0 && fromSection !== toSection
      ? (toSection > fromSection ? 'right' : 'left')
    : fromDepth > 0 && toDepth > 0 && fromDepth !== toDepth ? (toDepth > fromDepth ? 'right' : 'left')
    : to === '/' && from !== '/' ? 'down' : 'up';
  pendingParent = toDepth > fromDepth && fromDepth > 0 ? fromUrl.href : undefined;
});

document.addEventListener('astro:page-load', () => {
  if (location.pathname === '/') {
    clearHorizontalPositions();
    clearSectionStates();
    resetSectionNav();
  }
  if (!pendingParent) return;
  history.replaceState({ ...history.state, portfolioParent: pendingParent }, '');
  pendingParent = undefined;
});

document.addEventListener('astro:before-swap', (event) => {
  finishSectionNav();
  event.newDocument.documentElement.dataset.routeDirection =
    document.documentElement.dataset.routeDirection || 'up';
});
