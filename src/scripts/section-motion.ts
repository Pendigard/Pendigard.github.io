export function wheelDelta(event: WheelEvent, axis: 'x' | 'y' = 'y') {
  const value = axis === 'x' ? event.deltaX : event.deltaY;
  const pageSize = axis === 'x' ? innerWidth : innerHeight;
  return event.deltaMode === WheelEvent.DOM_DELTA_LINE ? value * 16
    : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? value * pageSize : value;
}

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
  indicator.setAttribute('aria-label', `Slide ${current + 1} of ${count}`);
  indicator.style.setProperty('--indicator-bar-height', `${Math.max(.45, Math.min(2.6, 10 / count))}rem`);
  if (indicator.querySelectorAll('[data-slide-index]').length !== count) {
    indicator.replaceChildren(...Array.from({ length: count }, (_, index) => {
      const bar = document.createElement('span');
      bar.className = 'slide-indicator-bar';
      bar.dataset.slideIndex = String(index);
      bar.setAttribute('aria-hidden', 'true');
      return bar;
    }));
  }
  indicator.querySelectorAll<HTMLElement>('[data-slide-index]').forEach((bar, index) => {
    bar.dataset.active = String(index === current);
  });
}
