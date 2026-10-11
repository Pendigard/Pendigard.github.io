import { projectSettings } from '../sections/projects/settings';
import { animateSlidePair, updateSlideIndicator, wheelDelta } from './section-motion';
import { finishHomeReturn, prepareHomeReturn, writeHomeReturn } from './home-return';
import { setSkippableAnimation } from './skippable';
import { clearTypingCursor, wait, writeText } from './typewriter';

let cleanup: (() => void) | undefined;
let activeRoot: HTMLElement | undefined;

function initProjectDetail() {
  const root = document.querySelector<HTMLElement>('[data-project-detail]');
  if (root && root === activeRoot) return;
  cleanup?.();
  if (!root) return;
  activeRoot = root;

  const slides = [...root.querySelectorAll<HTMLElement>('[data-slide]')];
  const indicator = document.querySelector<HTMLElement>('[data-slide-indicator]')!;
  const backLink = document.querySelector<HTMLAnchorElement>('[data-project-back]')!;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sources = slides.map((slide) => [...slide.querySelectorAll<HTMLElement>('[data-typewriter]')]
    .map((field) => ({ field, value: field.textContent || '' })));
  const revealed = new Set<number>();
  let current = location.hash === '#context' && slides.length > 1 ? 1 : 0;
  let leaving = false;
  let moving = false;
  let wheelLocked = false;
  let wheelTimer = 0;
  let wheelAmount = 0;
  let horizontalWheelAmount = 0;
  let touchStart: { x: number; y: number } | undefined;
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
    backLink.click();
  };
  const move = async (step: number) => {
    if (moving || leaving) return;
    const next = current + step;
    if (next < 0 || next >= slides.length) return;
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
  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    window.clearTimeout(wheelTimer);
    wheelTimer = window.setTimeout(() => { wheelLocked = false; wheelAmount = 0; horizontalWheelAmount = 0; }, Math.max(projectSettings.wheelLockMinMs, projectSettings.wheelGestureGapMs));
    if (wheelLocked) return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      horizontalWheelAmount = Math.min(0, horizontalWheelAmount + (
        wheelDelta(event, 'x')));
      if (horizontalWheelAmount <= -projectSettings.gesture.horizontalReturnThresholdPx) {
        wheelLocked = true;
        returnProjects();
      }
      return;
    }
    const delta = wheelDelta(event);
    wheelAmount += delta;
    if (Math.abs(wheelAmount) < projectSettings.wheelThreshold) return;
    wheelLocked = true;
    const step = Math.sign(wheelAmount);
    wheelAmount = 0;
    void move(step);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target instanceof HTMLElement &&
      (event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(event.target.tagName))) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); returnProjects(); }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      void move(event.key === 'ArrowDown' ? 1 : -1);
    }
  };
  const onTouchStart = (event: TouchEvent) => {
    const touch = event.changedTouches[0];
    if (touch) touchStart = { x: touch.clientX, y: touch.clientY };
  };
  const onTouchEnd = (event: TouchEvent) => {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    if (dx > projectSettings.gesture.touchHorizontalReturnThresholdPx && Math.abs(dx) > Math.abs(dy)) returnProjects();
    else if (Math.abs(dy) > projectSettings.gesture.touchSlideThresholdPx && Math.abs(dy) > Math.abs(dx)) void move(dy < 0 ? 1 : -1);
    touchStart = undefined;
  };

  slides.forEach((slide, index) => {
    slide.classList.toggle('is-active', index === current);
    slide.inert = index !== current;
    slide.setAttribute('aria-hidden', String(index !== current));
  });
  updateIndicator();
  prepareHomeReturn();
  root.addEventListener('touchstart', onTouchStart, { passive: true });
  root.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('wheel', onWheel, { passive: false, capture: true });
  window.addEventListener('keydown', onKeyDown);
  void revealCurrent();
  if (reducedMotion) void writeHomeReturn();

  cleanup = () => {
    abort?.abort();
    slideAnimations.forEach((animation) => animation.cancel());
    clearSkip();
    clearTypingCursor();
    finishHomeReturn();
    window.clearTimeout(wheelTimer);
    root.removeEventListener('touchstart', onTouchStart);
    root.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('wheel', onWheel, true);
    window.removeEventListener('keydown', onKeyDown);
    activeRoot = undefined;
    cleanup = undefined;
  };
}

document.addEventListener('astro:page-load', initProjectDetail);
document.addEventListener('astro:before-swap', () => cleanup?.());
initProjectDetail();
