let activeFinish: (() => void) | undefined;

// The capture listener never cancels the click, so links still navigate.
document.addEventListener('click', (event) => {
  const clickedLink = event.target instanceof Element
    ? event.target.closest<HTMLAnchorElement>('a[href]')
    : null;
  const destination = clickedLink?.href;
  const finish = activeFinish;
  activeFinish = undefined;
  finish?.();
  // Finishing an animation can replace the selected link. Reissue that click
  // on its live replacement so the route still opens through ClientRouter.
  if (clickedLink && !clickedLink.isConnected && destination) {
    event.preventDefault();
    const replacement = [...document.querySelectorAll<HTMLAnchorElement>('a[href]')]
      .find((link) => link.href === destination);
    if (replacement) replacement.click();
    else window.location.assign(destination);
  }
}, true);

export function setSkippableAnimation(finish: () => void) {
  activeFinish = finish;
  return () => {
    if (activeFinish === finish) activeFinish = undefined;
  };
}
