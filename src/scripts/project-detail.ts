import { projectSettings } from '../sections/projects/settings';
import { animateSlidePair, bindSlideIndicator, updateSlideIndicator } from './section-motion';
import { listenToGestures } from './gestures';
import { finishHomeReturn, prepareHomeReturn, writeHomeReturn } from './home-return';
import { setSkippableAnimation } from './skippable';
import { clearTypingCursor, wait, writeText } from './typewriter';
import { getDetailPosition, horizontalPosition, openHorizontalView, returnToPrevious, saveDetailPosition, updatePreviousLink } from './horizontal-navigation';

let cleanup: (() => void) | undefined;
let activeRoot: HTMLElement | undefined;

function initProjectDetail() {
  const root = document.querySelector<HTMLElement>('[data-project-detail]');
  if (root && root === activeRoot) return;
  cleanup?.();
  if (!root) return;
  activeRoot = root;

  const slides = [...root.querySelectorAll<HTMLElement>('[data-slide]')];
  const indicator = document.querySelector<HTMLElement>('[data-slide-indicator][data-axis="vertical"]')!;
  const horizontalIndicator = document.querySelector<HTMLElement>('[data-slide-indicator][data-axis="horizontal"]')!;
  const backLink = document.querySelector<HTMLAnchorElement>('[data-project-back]')!;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sources = slides.map((slide) => [...slide.querySelectorAll<HTMLElement>('[data-typewriter]')]
    .map((field) => ({ field, value: field.textContent || '' })));
  const detailKey = `${location.pathname}${location.search}`;
  const restored = getDetailPosition(detailKey);
  const revealed = new Set<number>(restored?.revealed || []);
  let current = restored?.slide ?? (location.hash === '#context' && slides.length > 1 ? 1 : 0);
  let leaving = false;
  let moving = false;
  let abort: AbortController | undefined;
  let clearSkip = () => {};
  let slideAnimations: Animation[] = [];

  const updateIndicator = () => {
    updateSlideIndicator(indicator, current, slides.length);
  };
  const finishCurrent = () => {
    abort?.abort();
    clearSkip();
    clearTypingCursor();
    sources[current].forEach(({ field, value }) => { field.textContent = value; });
    revealed.add(current);
    finishHomeReturn();
  };
  const prepareSlide = (index: number) => {
    if (revealed.has(index)) return;
    sources[index].forEach(({ field }) => { field.textContent = ''; });
  };
  const revealCurrent = async () => {
    if (revealed.has(current)) return;
    if (reducedMotion) { revealed.add(current); return; }
    const index = current;
    abort = new AbortController();
    prepareSlide(index);
    clearSkip = setSkippableAnimation(finishCurrent);
    for (const { field, value } of sources[index]) {
      if (!(await writeText(field, value, projectSettings.writing.detailMs, abort.signal))) return;
      if (!(await wait(projectSettings.betweenFieldsMs, abort.signal))) return;
    }
    if (!abort.signal.aborted) {
      revealed.add(index);
      clearSkip();
      if (index === 0 || revealed.size === 1) await writeHomeReturn();
    }
  };
  const returnProjects = () => {
    if (leaving) return;
    leaving = true;
    finishCurrent();
    saveDetailPosition(detailKey, { slide: current, revealed: [...revealed] });
    returnToPrevious(backLink);
  };
  const moveTo = async (next: number) => {
    if (moving || leaving || next === current || next < 0 || next >= slides.length) return;
    const step = Math.sign(next - current);
    moving = true;
    finishCurrent();
    const outgoing = slides[current];
    const incoming = slides[next];
    prepareSlide(next);
    incoming.classList.add('is-entering');
    incoming.inert = false;
    incoming.setAttribute('aria-hidden', 'false');
    if (!reducedMotion) {
      slideAnimations = animateSlidePair(outgoing, incoming, step, projectSettings.slideMoveMs, projectSettings.slideMoveEasing);
      clearSkip = setSkippableAnimation(() => slideAnimations.forEach((animation) => animation.finish()));
      try { await Promise.all(slideAnimations.map((animation) => animation.finished)); } catch { return; }
      clearSkip();
      slideAnimations.forEach((animation) => animation.cancel());
      slideAnimations = [];
    }
    outgoing.classList.remove('is-active');
    outgoing.inert = true;
    outgoing.setAttribute('aria-hidden', 'true');
    incoming.classList.remove('is-entering');
    incoming.classList.add('is-active');
    current = next;
    updateIndicator();
    moving = false;
    void revealCurrent();
  };
  const move = (step: number) => void moveTo(current + step);
  const stopIndicator = bindSlideIndicator(indicator, (index) => void moveTo(index));
  const stopGestures = listenToGestures({
    actions: { up: () => void move(-1), down: () => void move(1), left: returnProjects },
    touchRoot: root,
    thresholdPx: projectSettings.wheelThreshold,
    gestureGapMs: projectSettings.wheelGestureGapMs,
    cooldownMs: projectSettings.wheelLockMinMs,
    touchThresholdPx: projectSettings.gesture.touchSlideThresholdPx,
    // A sideways impulse should be deliberate before leaving the detail route.
    horizontalThresholdPx: projectSettings.gesture.horizontalReturnThresholdPx,
    touchHorizontalThresholdPx: projectSettings.gesture.touchHorizontalReturnThresholdPx,
  });
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target instanceof HTMLElement &&
      (event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(event.target.tagName))) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); returnProjects(); }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      void move(event.key === 'ArrowDown' ? 1 : -1);
    }
  };

  slides.forEach((slide, index) => {
    slide.classList.toggle('is-active', index === current);
    slide.inert = index !== current;
    slide.setAttribute('aria-hidden', String(index !== current));
  });
  updateIndicator();
  updatePreviousLink(backLink);
  const horizontal = horizontalPosition();
  updateSlideIndicator(horizontalIndicator, horizontal.active, horizontal.count);
  const stopHorizontalIndicator = bindSlideIndicator(horizontalIndicator, (index) => {
    if (leaving || index >= horizontal.active) return;
    if (index === horizontal.active - 1) { returnProjects(); return; }
    leaving = true;
    finishCurrent();
    saveDetailPosition(detailKey, { slide: current, revealed: [...revealed] });
    openHorizontalView(index, backLink);
  });
  const onBackClick = (event: MouseEvent) => { event.preventDefault(); returnProjects(); };
  backLink.addEventListener('click', onBackClick);
  prepareHomeReturn();
  window.addEventListener('keydown', onKeyDown);
  void revealCurrent();
  if (reducedMotion) void writeHomeReturn();

  cleanup = () => {
    if (document.documentElement.dataset.routeDirection !== 'down') saveDetailPosition(detailKey, { slide: current, revealed: [...revealed] });
    abort?.abort();
    slideAnimations.forEach((animation) => animation.cancel());
    clearSkip();
    clearTypingCursor();
    finishHomeReturn();
    stopGestures();
    stopIndicator();
    stopHorizontalIndicator();
    window.removeEventListener('keydown', onKeyDown);
    backLink.removeEventListener('click', onBackClick);
    activeRoot = undefined;
    cleanup = undefined;
  };
}

document.addEventListener('astro:page-load', initProjectDetail);
document.addEventListener('astro:before-swap', () => cleanup?.());
initProjectDetail();
