import { sectionSettings } from '../config/sections';
import { listenToGestures } from './gestures';
import { animateSlidePair, updateSlideIndicator } from './section-motion';
import { clearTypingCursor, wait, writeText } from './typewriter';
import { finishHomeReturn, prepareHomeReturn, writeHomeReturn } from './home-return';
import { setSkippableAnimation } from './skippable';

let cleanup: (() => void) | undefined;
let activeRoot: HTMLElement | undefined;

function initPhotos() {
  const root = document.querySelector<HTMLElement>('[data-photos]');
  if (root && root === activeRoot) return;
  cleanup?.();
  if (!root) return;
  activeRoot = root;

  const slides = [...root.querySelectorAll<HTMLElement>('[data-photos-slide]')];
  const fields = slides.map((slide) => [...slide.querySelectorAll<HTMLElement>('[data-typewriter]')]
    .map((field) => ({ field, value: field.textContent || '' })));
  const indicator = document.querySelector<HTMLElement>('[data-slide-indicator]')!;
  const homeLink = document.querySelector<HTMLAnchorElement>('[data-home-return]')!;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealed = new Set<number>();
  let current = 0;
  let moving = false;
  let leaving = false;
  let writingAbort: AbortController | undefined;
  let slideAnimations: Animation[] = [];
  let clearSkip = () => {};
  let toneFrame = 0;

  const updateHomeLinkTone = () => {
    const rect = homeLink.getBoundingClientRect();
    const x = rect.left + rect.width * .5;
    const y = rect.top + rect.height * .5;
    const underneath = document.elementsFromPoint(x, y).filter((element) => !homeLink.contains(element));
    const image = underneath.find((element): element is HTMLImageElement => element instanceof HTMLImageElement && !!element.closest('.photos-image'));
    let onImage = false;
    if (image && image.naturalWidth && image.naturalHeight) {
      const box = image.getBoundingClientRect();
      if (getComputedStyle(image).objectFit === 'cover') {
        onImage = x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
      } else {
        const ratio = image.naturalWidth / image.naturalHeight;
        const drawnWidth = Math.min(box.width, box.height * ratio);
        const drawnHeight = Math.min(box.height, box.width / ratio);
        onImage = x >= box.left + (box.width - drawnWidth) / 2 && x <= box.right - (box.width - drawnWidth) / 2
          && y >= box.top + (box.height - drawnHeight) / 2 && y <= box.bottom - (box.height - drawnHeight) / 2;
      }
    }
    // The full-slide template has a dark matte behind any letterboxing.
    if (!onImage && (underneath.some((element) => element.closest?.('[data-template="full-bleed"]'))
      || (slides[current]?.dataset.template === 'full-bleed' && !moving))) onImage = true;
    homeLink.classList.toggle('photos-on-image', onImage);
  };
  const trackHomeLinkTone = () => {
    updateHomeLinkTone();
    if (moving || homeLink.textContent !== 'Back to the homepage.') toneFrame = requestAnimationFrame(trackHomeLinkTone);
  };

  slides.forEach((slide, index) => {
    slide.inert = index !== 0;
    slide.setAttribute('aria-hidden', String(index !== 0));
  });
  root.classList.add('is-enhanced');
  prepareHomeReturn();
  updateSlideIndicator(indicator, current, slides.length);
  updateHomeLinkTone();
  toneFrame = requestAnimationFrame(trackHomeLinkTone);
  window.addEventListener('resize', updateHomeLinkTone);

  const finishSlide = (index: number) => {
    writingAbort?.abort();
    fields[index].forEach(({ field, value }) => { field.textContent = value; });
    clearTypingCursor();
    clearSkip();
    revealed.add(index);
  };

  const revealSlide = async (index: number) => {
    if (revealed.has(index)) return;
    if (reducedMotion) { finishSlide(index); return; }
    const abort = new AbortController();
    writingAbort = abort;
    fields[index].forEach(({ field }) => { field.textContent = ''; });
    clearSkip = setSkippableAnimation(() => {
      finishSlide(index);
      if (index === 0 && !leaving) void writeHomeReturn();
    });
    for (const { field, value } of fields[index]) {
      const duration = field.matches('.photos-text h2')
        ? sectionSettings.headingCharacterMs : sectionSettings.characterMs;
      if (!(await writeText(field, value, duration, abort.signal))) return;
      if (!(await wait(sectionSettings.betweenFieldsMs, abort.signal))) return;
    }
    if (!abort.signal.aborted) finishSlide(index);
  };

  const returnHome = () => {
    if (leaving) return;
    leaving = true;
    finishSlide(current);
    finishHomeReturn();
    homeLink.click();
  };

  const move = async (step: number) => {
    if (moving || leaving) return;
    const next = current + step;
    if (next < 0) { returnHome(); return; }
    if (next >= slides.length) return;
    moving = true;
    cancelAnimationFrame(toneFrame);
    toneFrame = requestAnimationFrame(trackHomeLinkTone);
    finishSlide(current);
    const outgoing = slides[current];
    const incoming = slides[next];
    if (!reducedMotion && !revealed.has(next)) fields[next].forEach(({ field }) => { field.textContent = ''; });
    incoming.classList.add('is-entering');
    incoming.inert = false;
    incoming.setAttribute('aria-hidden', 'false');
    if (!reducedMotion) {
      slideAnimations = animateSlidePair(outgoing, incoming, step, sectionSettings.slideMoveMs, sectionSettings.slideMoveEasing);
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
    updateSlideIndicator(indicator, current, slides.length);
    moving = false;
    updateHomeLinkTone();
    void revealSlide(current);
  };

  const stopGestures = listenToGestures({
    actions: { up: () => void move(-1), down: () => void move(1) },
    touchRoot: root,
    thresholdPx: sectionSettings.wheelThreshold,
    gestureGapMs: sectionSettings.wheelGestureGapMs,
    cooldownMs: sectionSettings.wheelLockMinMs,
  });
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target instanceof HTMLElement &&
      (event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName))) return;
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      void move(event.key === 'ArrowDown' ? 1 : -1);
    }
  };
  window.addEventListener('keydown', onKeyDown);

  document.documentElement.classList.remove('photos-typing');
  void (async () => {
    await revealSlide(0);
    if (activeRoot === root && !leaving) await writeHomeReturn();
  })();

  cleanup = () => {
    writingAbort?.abort();
    slideAnimations.forEach((animation) => animation.cancel());
    cancelAnimationFrame(toneFrame);
    clearSkip();
    clearTypingCursor();
    finishHomeReturn();
    stopGestures();
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('resize', updateHomeLinkTone);
    homeLink.classList.remove('photos-on-image');
    document.documentElement.classList.remove('photos-typing');
    activeRoot = undefined;
    cleanup = undefined;
  };
}

document.addEventListener('astro:page-load', initPhotos);
document.addEventListener('astro:before-swap', () => cleanup?.());
initPhotos();
