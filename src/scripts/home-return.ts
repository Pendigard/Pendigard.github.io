import { sectionSettings } from '../config/sections';
import { clearTypingCursor, writeText } from './typewriter';
import { setSkippableAnimation } from './skippable';

const label = 'Back to the homepage.';

interface ActiveWriting {
  link: HTMLAnchorElement;
  abort: AbortController;
  clearSkip: () => void;
  promise: Promise<void>;
}

let active: ActiveWriting | undefined;

function currentLink() {
  return document.body.dataset.page === 'home'
    ? null
    : document.querySelector<HTMLAnchorElement>('[data-home-return]');
}

export function prepareHomeReturn() {
  const link = currentLink();
  if (!link) return;
  if (active) {
    active.abort.abort();
    active.clearSkip();
    active = undefined;
  }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  link.textContent = '';
}

export function finishHomeReturn() {
  const writing = active;
  active = undefined;
  writing?.abort.abort();
  writing?.clearSkip();
  clearTypingCursor();
  const link = currentLink();
  if (link) link.textContent = label;
}

export function writeHomeReturn(): Promise<void> {
  const link = currentLink();
  if (!link) return Promise.resolve();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || link.textContent === label) {
    link.textContent = label;
    return Promise.resolve();
  }
  if (active?.link === link) return active.promise;

  const abort = new AbortController();
  const writing: ActiveWriting = {
    link,
    abort,
    clearSkip: setSkippableAnimation(finishHomeReturn),
    promise: Promise.resolve(),
  };
  active = writing;
  writing.promise = (async () => {
    await writeText(link, label, sectionSettings.characterMs, abort.signal);
    if (active === writing) finishHomeReturn();
  })();
  return writing.promise;
}
