export function animateSlidePair(
  outgoing: HTMLElement,
  incoming: HTMLElement,
  direction: number,
  duration: number,
  easing: string,
) {
  const distance = direction > 0 ? 100 : -100;
  const timing: KeyframeAnimationOptions = { duration, easing, fill: 'forwards' };
  return [
    outgoing.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${-distance}%)` }], timing),
    incoming.animate([{ transform: `translateY(${distance}%)` }, { transform: 'translateY(0)' }], timing),
  ];
}

export function updateSlideIndicator(indicator: HTMLElement, current: number, count: number) {
  const axis = indicator.dataset.axis === 'horizontal' ? 'horizontal' : 'vertical';
  indicator.hidden = count < 2;
  indicator.style.setProperty('--indicator-bar-length', `${Math.max(.45, Math.min(2.6, 10 / Math.max(1, count)))}rem`);
  if (indicator.querySelectorAll('[data-slide-index]').length !== count) {
    indicator.replaceChildren(...Array.from({ length: count }, (_, index) => {
      const bar = document.createElement('button');
      bar.type = 'button';
      bar.className = 'slide-indicator-bar';
      bar.dataset.slideIndex = String(index);
      return bar;
    }));
  }
  indicator.querySelectorAll<HTMLElement>('[data-slide-index]').forEach((bar, index) => {
    bar.dataset.active = String(index === current);
    bar.setAttribute('aria-label', `${axis === 'vertical' ? 'Slide' : 'View'} ${index + 1} of ${count}`);
    if (index === current) bar.setAttribute('aria-current', 'step');
    else bar.removeAttribute('aria-current');
  });
}

export function bindSlideIndicator(indicator: HTMLElement, select: (index: number) => void) {
  const onClick = (event: MouseEvent) => {
    const bar = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-slide-index]') : null;
    if (!bar || !indicator.contains(bar)) return;
    select(Number(bar.dataset.slideIndex));
  };
  indicator.addEventListener('click', onClick);
  return () => indicator.removeEventListener('click', onClick);
}
