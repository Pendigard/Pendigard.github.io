import { sectionSettings } from '../config/sections';
import { backgroundSettings } from '../sections/background/settings';
import { animateSlidePair, bindSlideIndicator, updateSlideIndicator } from './section-motion';
import { listenToGestures } from './gestures';
import { finishHomeReturn, prepareHomeReturn, writeHomeReturn } from './home-return';
import { setSkippableAnimation } from './skippable';
import { clearTypingCursor, wait, writeText } from './typewriter';
import { getBackgroundPosition, saveBackgroundPosition } from './horizontal-navigation';

let cleanup: (() => void) | undefined;
let activeRoot: HTMLElement | undefined;

function initBackground() {
  const root = document.querySelector<HTMLElement>('[data-background]');
  if (root && root === activeRoot) return;
  cleanup?.();
  if (!root) return;
  activeRoot = root;

  const slides = [...root.querySelectorAll<HTMLElement>('[data-slide]')];
  const headings = new Map([...root.querySelectorAll<HTMLElement>('[data-part-heading]')]
    .map((heading) => [heading.dataset.partHeading!, heading]));
  const headingSources = slides.map((slide) => {
    const fields = slide.dataset.first === 'true'
      ? [...headings.get(slide.dataset.part!)!.querySelectorAll<HTMLElement>('[data-typewriter]')]
      : [];
    return fields.map((field) => ({ field, value: field.textContent || '' }));
  });
  const eventSources = slides.map((slide) => {
    const fields = [...slide.querySelectorAll<HTMLElement>('.timeline-event')]
      .flatMap((event) => [...event.querySelectorAll<HTMLElement>('[data-typewriter]')]);
    return fields.map((field) => ({ field, value: field.textContent || '' }));
  });
  const sources = slides.map((_, index) => [...headingSources[index], ...eventSources[index]]);
  const lines = slides.map((slide) => slide.querySelector<HTMLElement>('.timeline-path')!);
  const indicator = document.querySelector<HTMLElement>('[data-slide-indicator][data-axis="vertical"]')!;
  const homeLink = document.querySelector<HTMLAnchorElement>('[data-home-return]')!;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const restored = getBackgroundPosition();
  const hashSlide = location.hash ? slides.findIndex((slide) => !!slide.querySelector(`[id="${CSS.escape(location.hash.slice(1))}"]`)) : -1;
  const initial = hashSlide >= 0 ? hashSlide : (restored?.slide ?? 0);
  const revealed = new Set<number>(restored?.revealed || []);
  const arrivedHeadings = new Set<string>(restored?.headings || []);
  let current = Math.min(initial, slides.length - 1);
  let leaving = false;
  let moving = false;
  let introAbort: AbortController | undefined;
  let lineAnimation: Animation | undefined;
  let clearSkip = () => {};
  let slideAnimations: Animation[] = [];

  const showHeading = (part: string) => {
    headings.forEach((heading, name) => {
      const active = name === part;
      heading.classList.toggle('is-active', active);
      heading.setAttribute('aria-hidden', String(!active));
    });
  };

  const updateIndicator = () => {
    updateSlideIndicator(indicator, current, slides.length);
  };

  const finishSlide = (index: number) => {
    introAbort?.abort();
    lineAnimation?.cancel();
    lineAnimation = undefined;
    lines[index].style.transform = '';
    sources[index].forEach(({ field, value }) => { field.textContent = value; });
    clearTypingCursor();
    clearSkip();
    revealed.add(index);
    if (index === 0) finishHomeReturn();
  };

  const revealSlide = async (index: number) => {
    if (revealed.has(index)) return;
    if (reducedMotion) { revealed.add(index); return; }
    const abort = new AbortController();
    introAbort = abort;
    const fieldsToWrite = arrivedHeadings.has(slides[index].dataset.part!)
      ? eventSources[index] : sources[index];
    fieldsToWrite.forEach(({ field }) => { field.textContent = ''; });
    lines[index].style.transform = 'scaleY(0)';
    clearSkip = setSkippableAnimation(() => finishSlide(index));

    const first = slides[index].dataset.first === 'true';
    lineAnimation = lines[index].animate(
      [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }],
      { duration: backgroundSettings.lineDrawMs, easing: backgroundSettings.lineDrawEasing, fill: 'forwards' },
    );
    // The first path grows toward its arrow; continuations grow toward their base.
    lines[index].style.transformOrigin = first ? 'center bottom' : 'center top';
    try { await lineAnimation.finished; } catch { return; }
    if (abort.signal.aborted) return;
    lines[index].style.transform = '';
    lineAnimation.cancel();
    lineAnimation = undefined;

    for (const { field, value } of fieldsToWrite) {
      const characterMs = field.hasAttribute('data-heading-typewriter')
        ? sectionSettings.headingCharacterMs : sectionSettings.characterMs;
      if (!(await writeText(field, value, characterMs, abort.signal))) return;
      if (!(await wait(sectionSettings.betweenFieldsMs, abort.signal))) return;
    }
    if (!abort.signal.aborted) {
      clearSkip();
      revealed.add(index);
      arrivedHeadings.add(slides[index].dataset.part!);
    }
  };

  const returnHome = () => {
    if (leaving) return;
    leaving = true;
    finishSlide(current);
    homeLink.click();
  };

  const onProjectLink = (event: MouseEvent) => {
    if (!(event.target instanceof Element) || !event.target.closest('[data-background-project]')) return;
    finishSlide(current);
    saveBackgroundPosition({ slide: current, revealed: [...revealed], headings: [...arrivedHeadings] });
  };

  const moveTo = async (next: number) => {
    if (moving || leaving || next === current || next < 0 || next >= slides.length) return;
    const step = Math.sign(next - current);
    moving = true;
    finishSlide(current);
    const outgoing = slides[current];
    const incoming = slides[next];
    const changingPart = outgoing.dataset.part !== incoming.dataset.part;
    const outgoingHeading = headings.get(outgoing.dataset.part!)!;
    const incomingHeading = headings.get(incoming.dataset.part!)!;
    if (changingPart) {
      arrivedHeadings.add(incoming.dataset.part!);
      headingSources[next].forEach(({ field, value }) => { field.textContent = value; });
    }
    if (!reducedMotion && !revealed.has(next)) {
      eventSources[next].forEach(({ field }) => { field.textContent = ''; });
      if (!arrivedHeadings.has(incoming.dataset.part!)) {
        headingSources[next].forEach(({ field }) => { field.textContent = ''; });
      }
      lines[next].style.transform = 'scaleY(0)';
    }
    // A heading stays fixed within its timeline, then travels with the slide
    // at the boundary so the next timeline can take its place.
    if (changingPart && !reducedMotion) incomingHeading.classList.add('is-active');
    incoming.classList.add('is-entering');
    incoming.inert = false;
    incoming.setAttribute('aria-hidden', 'false');

    if (!reducedMotion) {
      const timing: KeyframeAnimationOptions = { duration: sectionSettings.slideMoveMs, easing: sectionSettings.slideMoveEasing, fill: 'forwards' };
      slideAnimations = animateSlidePair(outgoing, incoming, step, sectionSettings.slideMoveMs, sectionSettings.slideMoveEasing);
      if (changingPart) {
        const offset = root.getBoundingClientRect().height * Math.sign(step);
        slideAnimations.push(
          outgoingHeading.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${-offset}px)` }], timing),
          incomingHeading.animate([{ transform: `translateY(${offset}px)` }, { transform: 'translateY(0)' }], timing),
        );
      }
      clearSkip = setSkippableAnimation(() => {
        slideAnimations.forEach((animation) => animation.finish());
        finishSlide(next);
      });
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
    showHeading(incoming.dataset.part!);
    updateIndicator();
    moving = false;
    void revealSlide(current);
  };

  const move = (step: number) => {
    if (current + step < 0) { if (!moving) returnHome(); return; }
    void moveTo(current + step);
  };
  const stopIndicator = bindSlideIndicator(indicator, (index) => void moveTo(index));

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
      (event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(event.target.tagName))) return;
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      void move(event.key === 'ArrowDown' ? 1 : -1);
    }
  };

  window.addEventListener('keydown', onKeyDown);
  slides.forEach((slide, index) => {
    slide.classList.toggle('is-active', index === current);
    slide.inert = index !== current;
    slide.setAttribute('aria-hidden', String(index !== current));
  });
  showHeading(slides[current].dataset.part!);
  updateIndicator();
  if (restored) finishHomeReturn(); else prepareHomeReturn();
  if (!restored && !reducedMotion) {
    sources[current].forEach(({ field }) => { field.textContent = ''; });
    lines[current].style.transform = 'scaleY(0)';
  }
  void (async () => {
    await revealSlide(current);
    if (activeRoot !== root || leaving) return;
    await writeHomeReturn();
  })();

  root.addEventListener('click', onProjectLink);

  cleanup = () => {
    introAbort?.abort();
    slideAnimations.forEach((animation) => animation.cancel());
    lineAnimation?.cancel();
    clearSkip();
    clearTypingCursor();
    finishHomeReturn();
    stopGestures();
    stopIndicator();
    root.removeEventListener('click', onProjectLink);
    window.removeEventListener('keydown', onKeyDown);
    activeRoot = undefined;
    cleanup = undefined;
  };
}

document.addEventListener('astro:page-load', initBackground);
document.addEventListener('astro:before-swap', () => cleanup?.());
initBackground();
