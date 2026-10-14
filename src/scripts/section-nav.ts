import { writeText } from './typewriter';
import { setSkippableAnimation } from './skippable';

let written = false;
let active: { nav: HTMLElement; abort: AbortController; done: Promise<void>; clearSkip: () => void } | undefined;

export function finishSectionNav() {
  const writing = active;
  active = undefined;
  writing?.abort.abort();
  writing?.clearSkip();
  document.querySelectorAll<HTMLElement>('[data-nav-label]').forEach((label) => {
    label.textContent = label.dataset.fullText || label.textContent;
    label.classList.remove('typing-cursor');
  });
  written = true;
}

export function resetSectionNav() {
  finishSectionNav();
  written = false;
}

export function ensureSectionNav(): Promise<void> {
  const nav = document.querySelector<HTMLElement>('[data-section-nav]');
  if (!nav) return Promise.resolve();
  if (active?.nav === nav) return active.done;
  if (written || matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve();
  const labels = [...nav.querySelectorAll<HTMLElement>('[data-nav-label]')];
  labels.forEach((label) => {
    label.dataset.fullText = label.textContent || '';
    label.textContent = '';
  });
  const abort = new AbortController();
  const writing = { nav, abort, done: Promise.resolve(), clearSkip: () => {} };
  active = writing;
  writing.clearSkip = setSkippableAnimation(finishSectionNav);
  writing.done = (async () => {
    for (const label of labels) {
      if (!(await writeText(label, label.dataset.fullText || '', 17, abort.signal))) return;
    }
    if (active === writing) finishSectionNav();
  })();
  return writing.done;
}
