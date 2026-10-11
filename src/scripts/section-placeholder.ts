import { sectionSettings } from '../config/sections';
import { clearTypingCursor, wait, writeText } from './typewriter';
import { finishHomeReturn, prepareHomeReturn, writeHomeReturn } from './home-return';
import { setSkippableAnimation } from './skippable';
import { listenToGestures } from './gestures';

let cleanup: (() => void) | undefined;
let activeSection: HTMLElement | undefined;

function initSectionPlaceholder() {
  const section = document.querySelector<HTMLElement>('[data-section-placeholder]');
  if (section && section === activeSection) return;
  cleanup?.();
  if (!section) return;
  activeSection = section;

  const fields = [...section.querySelectorAll<HTMLElement>('[data-typewriter]')];
  const source = fields.map((field) => field.textContent || '');
  const homeLink = document.querySelector<HTMLAnchorElement>('[data-home-return]')!;
  const abort = new AbortController();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let leaving = false;
  let clearSkip = () => {};

  prepareHomeReturn();

  const finishTyping = () => {
    abort.abort();
    clearTypingCursor();
    fields.forEach((field, index) => { field.textContent = source[index]; });
    document.documentElement.classList.remove('section-typing');
    clearSkip();
    finishHomeReturn();
  };

  const returnHome = () => {
    if (leaving) return;
    leaving = true;
    finishTyping();
    homeLink.click();
  };

  const stopGestures = listenToGestures({
    actions: { down: returnHome },
    touchRoot: section,
    thresholdPx: sectionSettings.wheelThreshold,
    gestureGapMs: sectionSettings.wheelGestureGapMs,
  });

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target instanceof HTMLElement &&
      (event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(event.target.tagName))) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      returnHome();
    }
  };

  window.addEventListener('keydown', onKeyDown);

  if (reducedMotion) {
    document.documentElement.classList.remove('section-typing');
  } else {
    fields.forEach((field) => { field.textContent = ''; });
    document.documentElement.classList.remove('section-typing');
    void (async () => {
      clearSkip = setSkippableAnimation(finishTyping);
      for (let index = 0; index < fields.length; index += 1) {
        if (index > 0 && !(await wait(sectionSettings.betweenFieldsMs, abort.signal))) return;
        if (!(await writeText(fields[index], source[index], sectionSettings.characterMs, abort.signal))) return;
      }
      clearSkip();
      if (!abort.signal.aborted) await writeHomeReturn();
    })();
  }

  cleanup = () => {
    abort.abort();
    clearSkip();
    clearTypingCursor();
    finishHomeReturn();
    stopGestures();
    window.removeEventListener('keydown', onKeyDown);
    activeSection = undefined;
    cleanup = undefined;
  };
}

document.addEventListener('astro:page-load', initSectionPlaceholder);
document.addEventListener('astro:before-swap', () => cleanup?.());
initSectionPlaceholder();
