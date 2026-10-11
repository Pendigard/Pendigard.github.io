import { clearHorizontalPositions, routeDepth } from './horizontal-navigation';

let pendingParent: string | undefined;

document.addEventListener('astro:before-preparation', (event) => {
  const fromUrl = new URL(event.from);
  const toUrl = new URL(event.to);
  const from = new URL(event.from).pathname;
  const to = new URL(event.to).pathname;
  const fromDepth = routeDepth(fromUrl);
  const toDepth = routeDepth(toUrl);
  document.documentElement.dataset.routeDirection =
    fromDepth > 0 && toDepth > 0 && fromDepth !== toDepth ? (toDepth > fromDepth ? 'right' : 'left')
    : to === '/' && from !== '/' ? 'down' : 'up';
  pendingParent = toDepth > fromDepth && fromDepth > 0 ? fromUrl.href : undefined;
  if (to === '/') clearHorizontalPositions();
});

document.addEventListener('astro:page-load', () => {
  if (!pendingParent) return;
  history.replaceState({ ...history.state, portfolioParent: pendingParent }, '');
  pendingParent = undefined;
});

document.addEventListener('astro:before-swap', (event) => {
  event.newDocument.documentElement.dataset.routeDirection =
    document.documentElement.dataset.routeDirection || 'up';
});
