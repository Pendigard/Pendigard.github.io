import { sectionSettings } from '../config/sections';
import { profileSettings } from '../sections/profile/settings';
import { listenToGestures } from './gestures';
import { animateSlidePair, bindSlideIndicator, updateSlideIndicator } from './section-motion';
import { clearTypingCursor, replaceText, wait, writeText } from './typewriter';
import { finishHomeReturn, prepareHomeReturn, writeHomeReturn } from './home-return';
import { setSkippableAnimation } from './skippable';
import { ensureSectionNav } from './section-nav';
import { moveToAdjacentSection, returnHomeFromFirstSlide, shouldRestoreSectionPosition } from './section-navigation';
import { getSectionState, saveSectionState } from './section-reveals';

let cleanup: (() => void) | undefined;
let activeRoot: HTMLElement | undefined;

function initProfile() {
  const root = document.querySelector<HTMLElement>('[data-profile]');
  if (root && root === activeRoot) return;
  cleanup?.();
  if (!root) return;
  activeRoot = root;

  const slides = [...root.querySelectorAll<HTMLElement>('[data-profile-slide]')];
  const fields = slides.map((slide) => [...slide.querySelectorAll<HTMLElement>('[data-typewriter]')]
    .map((field) => ({ field, value: field.textContent || '' })));
  const indicator = document.querySelector<HTMLElement>('[data-slide-indicator]')!;
  const portrait = root.querySelector<HTMLElement>('.profile-portrait')!;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hoverCapable = matchMedia('(hover: hover)');
  const saved = getSectionState('/profile/');
  const revealed = new Set(saved?.revealed || []);
  const translationAborts = new Map<HTMLButtonElement, AbortController>();
  const phraseCleanups: (() => void)[] = [];
  let current = shouldRestoreSectionPosition() ? Math.min(saved?.slide ?? 0, slides.length - 1) : 0;
  let moving = false;
  let introAbort: AbortController | undefined;
  let portraitAnimation: Animation | undefined;
  let slideAnimations: Animation[] = [];
  let clearSkip = () => {};

  const resetTranslations = () => {
    translationAborts.forEach((abort) => abort.abort());
    translationAborts.clear();
    root.querySelectorAll<HTMLButtonElement>('[data-language-phrase]').forEach((button) => {
      button.textContent = button.dataset.original || '';
      button.lang = button.dataset.languageCode || button.lang;
      button.setAttribute('aria-pressed', 'false');
      button.title = 'Show English translation';
    });
    clearTypingCursor();
  };

  root.querySelectorAll<HTMLButtonElement>('[data-language-phrase]').forEach((button) => {
    button.dataset.languageCode = button.lang;
    let hovered = false;
    let focused = false;
    let toggled = false;
    const show = (english: boolean) => {
      if (!button.dataset.ready || reducedMotion) {
        button.textContent = english ? button.dataset.translation! : button.dataset.original!;
      } else {
        // A second phrase takes over cleanly; no two replacement cursors run together.
        translationAborts.forEach((otherAbort, other) => {
          if (other === button) return;
          otherAbort.abort();
          translationAborts.delete(other);
          other.textContent = other.dataset.original || '';
          other.lang = other.dataset.languageCode || other.lang;
          other.setAttribute('aria-pressed', 'false');
          other.title = 'Show English translation';
        });
        translationAborts.get(button)?.abort();
        const abort = new AbortController();
        translationAborts.set(button, abort);
        void replaceText(button, english ? button.dataset.translation! : button.dataset.original!, profileSettings.translationCharacterMs, abort.signal)
          .then(() => { if (translationAborts.get(button) === abort) translationAborts.delete(button); });
      }
      button.lang = english ? 'en' : button.dataset.languageCode!;
      button.setAttribute('aria-pressed', String(english));
      button.title = english ? 'Show original sentence' : 'Show English translation';
    };
    const update = () => {
      if (!button.dataset.ready) return;
      show(hovered || focused || toggled);
    };
    const enter = () => { if (hoverCapable.matches) { hovered = true; update(); } };
    const leave = () => { hovered = false; update(); };
    const focus = () => { if (button.matches(':focus-visible')) { focused = true; update(); } };
    const blur = () => { focused = false; update(); };
    const click = (event: MouseEvent) => {
      if (!button.dataset.ready) return;
      if (!hoverCapable.matches || event.detail === 0) { toggled = !toggled; update(); }
    };
    button.addEventListener('pointerenter', enter);
    button.addEventListener('pointerleave', leave);
    button.addEventListener('focus', focus);
    button.addEventListener('blur', blur);
    button.addEventListener('click', click);
    phraseCleanups.push(() => {
      button.removeEventListener('pointerenter', enter);
      button.removeEventListener('pointerleave', leave);
      button.removeEventListener('focus', focus);
      button.removeEventListener('blur', blur);
      button.removeEventListener('click', click);
    });
  });

  slides.forEach((slide, index) => {
    slide.classList.toggle('is-active', index === current);
    slide.inert = index !== current;
    slide.setAttribute('aria-hidden', String(index !== current));
  });
  if (revealed.has(2)) root.querySelectorAll<HTMLButtonElement>('[data-language-phrase]')
    .forEach((button) => { button.dataset.ready = 'true'; });
  root.classList.add('is-enhanced');
  if (revealed.has(0)) finishHomeReturn(); else prepareHomeReturn();
  updateSlideIndicator(indicator, current, slides.length);

  const finishSlide = (index: number) => {
    introAbort?.abort();
    if (index === 0) {
      portraitAnimation?.cancel();
      portraitAnimation = undefined;
    }
    fields[index].forEach(({ field, value }) => { field.textContent = value; });
    if (index === 2) {
      root.querySelectorAll<HTMLButtonElement>('[data-language-phrase]').forEach((button) => { button.dataset.ready = 'true'; });
    }
    clearTypingCursor();
    clearSkip();
    revealed.add(index);
    if (index === 0) finishHomeReturn();
  };

  const revealSlide = async (index: number) => {
    if (revealed.has(index)) return;
    if (reducedMotion) { finishSlide(index); return; }
    const abort = new AbortController();
    introAbort = abort;
    if (index === 0) {
      const animation = portrait.animate(
        [{ transform: 'translateX(100vw)' }, { transform: 'translateX(0)' }],
        { duration: profileSettings.portraitEnterMs, easing: sectionSettings.slideMoveEasing, fill: 'forwards' },
      );
      portraitAnimation = animation;
      void animation.finished.then(() => {
        if (portraitAnimation === animation) {
          animation.cancel();
          portraitAnimation = undefined;
        }
      }).catch(() => {});
    }
    fields[index].forEach(({ field }) => { field.textContent = ''; });
    clearSkip = setSkippableAnimation(() => finishSlide(index));
    for (const { field, value } of fields[index]) {
      const latinEquivalent = field.lang === 'ja' && field.dataset.translation
        ? Array.from(field.dataset.translation).length / Math.max(1, Array.from(value).length)
        : 1;
      const duration = field.hasAttribute('data-profile-heading') ? profileSettings.headingCharacterMs
        : field.matches('.profile-language-phrase')
          ? profileSettings.languagePhraseCharacterMs * latinEquivalent
          : profileSettings.characterMs;
      if (!(await writeText(field, value, duration, abort.signal))) return;
      if (!(await wait(profileSettings.betweenFieldsMs, abort.signal))) return;
    }
    if (!abort.signal.aborted) finishSlide(index);
  };

  const moveTo = async (next: number) => {
    if (moving || next === current || next < 0 || next >= slides.length) return;
    const step = Math.sign(next - current);
    moving = true;
    finishSlide(current);
    resetTranslations();
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
    void revealSlide(current);
  };

  const move = (step: number) => {
    if (moving) return;
    if (current + step < 0) { returnHomeFromFirstSlide(current); return; }
    void moveTo(current + step);
  };
  const stopIndicator = bindSlideIndicator(indicator, (index) => void moveTo(index));

  const stopGestures = listenToGestures({
    actions: {
      up: () => void move(-1), down: () => void move(1),
      left: () => moveToAdjacentSection(-1), right: () => moveToAdjacentSection(1),
    },
    horizontalThresholdPx: sectionSettings.horizontalWheelThreshold,
    horizontalWheelLockMs: sectionSettings.horizontalWheelLockMs,
    touchRoot: root,
    thresholdPx: sectionSettings.wheelThreshold,
    gestureGapMs: sectionSettings.wheelGestureGapMs,
    cooldownMs: sectionSettings.wheelLockMinMs,
  });
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target instanceof HTMLElement &&
      (event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName))) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      moveToAdjacentSection(event.key === 'ArrowRight' ? 1 : -1);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      void move(event.key === 'ArrowDown' ? 1 : -1);
    }
  };
  window.addEventListener('keydown', onKeyDown);

  if (!reducedMotion && !revealed.has(current)) fields[current].forEach(({ field }) => { field.textContent = ''; });
  document.documentElement.classList.remove('profile-typing');
  void (async () => {
    await ensureSectionNav();
    if (activeRoot !== root) return;
    await revealSlide(current);
    if (activeRoot === root) await writeHomeReturn();
  })();

  cleanup = () => {
    finishSlide(current);
    if (document.documentElement.dataset.routeDirection !== 'down') saveSectionState('/profile/', current, revealed);
    introAbort?.abort();
    portraitAnimation?.cancel();
    slideAnimations.forEach((animation) => animation.cancel());
    clearSkip();
    resetTranslations();
    phraseCleanups.forEach((stop) => stop());
    finishHomeReturn();
    stopGestures();
    stopIndicator();
    window.removeEventListener('keydown', onKeyDown);
    document.documentElement.classList.remove('profile-typing');
    activeRoot = undefined;
    cleanup = undefined;
  };
}

document.addEventListener('astro:page-load', initProfile);
document.addEventListener('astro:before-swap', () => cleanup?.());
initProfile();
