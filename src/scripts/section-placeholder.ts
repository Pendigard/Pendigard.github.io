import { sectionSettings } from '../config/sections';
import { clearTypingCursor, wait, writeText } from './typewriter';

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
  const homeLink = section.querySelector<HTMLAnchorElement>('[data-home-link]')!;
  const abort = new AbortController();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let leaving = false;
  let wheelDistance = 0;

  const returnHome = () => {
    if (leaving) return;
    leaving = true;
    abort.abort();
    clearTypingCursor();
    fields.forEach((field, index) => { field.textContent = source[index]; });
    document.documentElement.classList.remove('section-typing');
    homeLink.click();
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? event.deltaY * innerHeight
      : event.deltaY;
    if (delta >= 0) {
      wheelDistance = 0;
      return;
    }
    wheelDistance += -delta;
    if (wheelDistance >= sectionSettings.wheelThreshold) returnHome();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target instanceof HTMLElement &&
      (event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(event.target.tagName))) return;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      returnHome();
    }
  };

  window.addEventListener('wheel', onWheel, { passive: false, capture: true });
  window.addEventListener('keydown', onKeyDown);

  if (reducedMotion) {
    document.documentElement.classList.remove('section-typing');
  } else {
    fields.forEach((field) => { field.textContent = ''; });
    document.documentElement.classList.remove('section-typing');
    void (async () => {
      for (let index = 0; index < fields.length; index += 1) {
        if (index > 0 && !(await wait(sectionSettings.betweenFieldsMs, abort.signal))) return;
        if (!(await writeText(fields[index], source[index], sectionSettings.characterMs, abort.signal))) return;
      }
    })();
  }

  cleanup = () => {
    abort.abort();
    clearTypingCursor();
    window.removeEventListener('wheel', onWheel, true);
    window.removeEventListener('keydown', onKeyDown);
    activeSection = undefined;
    cleanup = undefined;
  };
}

document.addEventListener('astro:page-load', initSectionPlaceholder);
document.addEventListener('astro:before-swap', () => cleanup?.());
initSectionPlaceholder();
