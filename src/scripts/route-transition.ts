import { clearHorizontalPositions, routeDepth } from './horizontal-navigation';
import { finishSectionNav, resetSectionNav } from './section-nav';
import { sectionIndex } from '../config/section-navigation';

let pendingParent: string | undefined;
let sectionNavigation = false;

document.addEventListener('click', (event) => {
  sectionNavigation = event instanceof MouseEvent && event.button === 0 &&
    !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey &&
    event.target instanceof Element && !!event.target.closest('[data-section-nav-link]');
}, true);

document.addEventListener('astro:before-preparation', (event) => {
  const fromUrl = new URL(event.from);
  const toUrl = new URL(event.to);
  const from = new URL(event.from).pathname;
  const to = new URL(event.to).pathname;
  const fromDepth = routeDepth(fromUrl);
  const toDepth = routeDepth(toUrl);
  const fromSection = sectionIndex(from);
  const toSection = sectionIndex(to);
  document.documentElement.dataset.routeDirection =
    sectionNavigation && fromSection >= 0 && toSection >= 0 && fromSection !== toSection
      ? (toSection > fromSection ? 'right' : 'left')
    : fromDepth > 0 && toDepth > 0 && fromDepth !== toDepth ? (toDepth > fromDepth ? 'right' : 'left')
    : fromSection >= 0 && toSection >= 0 && fromSection !== toSection
      ? (toSection > fromSection ? 'right' : 'left')
    : to === '/' && from !== '/' ? 'down' : 'up';
  pendingParent = toDepth > fromDepth && fromDepth > 0 ? fromUrl.href : undefined;
  if (to === '/') clearHorizontalPositions();
  sectionNavigation = false;
});

document.addEventListener('astro:page-load', () => {
  if (location.pathname === '/') resetSectionNav();
  if (!pendingParent) return;
  history.replaceState({ ...history.state, portfolioParent: pendingParent }, '');
  pendingParent = undefined;
});

document.addEventListener('astro:before-swap', (event) => {
  finishSectionNav();
  event.newDocument.documentElement.dataset.routeDirection =
    document.documentElement.dataset.routeDirection || 'up';
});
