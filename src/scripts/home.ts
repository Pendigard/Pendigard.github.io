import { homeSettings, sections } from '../config/home';
import { clearTypingCursor, wait, writeText } from './typewriter';
import { setSkippableAnimation } from './skippable';
import { listenToGestures } from './gestures';
import { createAutoSelection } from './auto-selection';

type HomeWindow = Window & {
  __portfolioHomePhoto?: { index: number; url: string };
  __portfolioEarlyDirection?: number;
  __portfolioEarlyWheelAt?: number;
  __portfolioStopEarlyInput?: () => void;
};

let cleanup: (() => void) | undefined;
let activeHome: HTMLElement | undefined;

function initHome() {
  const home = document.querySelector<HTMLElement>('[data-home]');
  if (home && home === activeHome) return;
  cleanup?.();
  if (!home) return;
  activeHome = home;

  const title = home.querySelector<HTMLElement>('[data-type-title]')!;
  const prefix = home.querySelector<HTMLElement>('[data-type-prefix]')!;
  const sectionText = home.querySelector<HTMLElement>('[data-type-section]')!;
  const track = home.querySelector<HTMLElement>('[data-section-track]')!;
  const links = [...home.querySelectorAll<HTMLAnchorElement>('[data-section-shortcut]')];
  const announcement = home.querySelector<HTMLOutputElement>('[data-selection-announcement]')!;
  const background = home.querySelector<HTMLElement>('[data-home-background]')!;
  const abort = new AbortController();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const homeWindow = window as HomeWindow;
  const earlyDirection = homeWindow.__portfolioEarlyDirection;
  const earlyWheelAt = homeWindow.__portfolioEarlyWheelAt;
  homeWindow.__portfolioStopEarlyInput?.();
  delete homeWindow.__portfolioEarlyDirection;
  delete homeWindow.__portfolioEarlyWheelAt;

  let selected: number = homeSettings.defaultSection;
  let introRunning = !reducedMotion;
  let demonstrating = false;
  let selectionAnimation: Animation | undefined;
  let clearSkip = () => {};

  const selectedLink = (index: number) => {
    const link = document.createElement('a');
    link.href = sections[index].href;
    link.className = 'selected-section';
    link.textContent = sections[index].label;
    link.setAttribute('aria-label', `Open ${sections[index].label}`);
    return link;
  };

  const updateShortcuts = () => {
    links.forEach((link, index) => {
      const active = index === selected;
      link.dataset.selected = String(active);
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };

  const renderSelection = () => {
    selectionAnimation?.cancel();
    selectionAnimation = undefined;
    track.style.transform = '';
    const link = selectedLink(selected);
    track.replaceChildren(link);
    updateShortcuts();
  };

  const finishIntro = () => {
    if (!introRunning) return;
    introRunning = false;
    demonstrating = false;
    abort.abort();
    title.textContent = 'Hi, I’m Célian.';
    prefix.textContent = 'Feel free to check my ';
    sectionText.textContent = sections[selected].label;
    clearTypingCursor();
    document.documentElement.classList.remove('home-typing');
    renderSelection();
    clearSkip();
    autoSelection.start();
  };

  const moveTo = async (next: number, duration: number, announce = false, directionHint?: number) => {
    if (next === selected) return;
    selectionAnimation?.cancel();
    selectionAnimation = undefined;
    track.style.transform = '';
    track.replaceChildren(selectedLink(selected));

    const direction = directionHint ?? (next > selected ? 1 : -1);
    const from = selectedLink(selected);
    const to = selectedLink(next);
    from.setAttribute('aria-hidden', 'true');
    from.tabIndex = -1;
    from.style.pointerEvents = 'none';
    const rowHeight = track.parentElement!.getBoundingClientRect().height;
    track.replaceChildren(...(direction > 0 ? [from, to] : [to, from]));
    selected = next;
    updateShortcuts();

    if (reducedMotion || duration === 0) {
      renderSelection();
    } else {
      const start = direction > 0 ? 0 : -rowHeight;
      const end = direction > 0 ? -rowHeight : 0;
      const animation = track.animate(
        [{ transform: `translateY(${start}px)` }, { transform: `translateY(${end}px)` }],
        { duration, easing: 'cubic-bezier(.22, .7, .16, 1)', fill: 'forwards' },
      );
      selectionAnimation = animation;
      const clearMoveSkip = !introRunning ? setSkippableAnimation(renderSelection) : () => {};
      if (!introRunning) clearSkip = clearMoveSkip;
      try {
        await animation.finished;
        if (selectionAnimation === animation) renderSelection();
      } catch {
        // A new gesture takes over the unfinished movement.
      } finally {
        clearMoveSkip();
      }
    }
    if (announce) announcement.value = `${sections[selected].label} selected. Open link to visit.`;
  };

  const autoSelection = createAutoSelection({
    intervalMs: homeSettings.autoScrollIntervalMs,
    afterUserMs: homeSettings.autoScrollAfterUserMs,
    enabled: !reducedMotion,
    move: () => moveTo((selected + 1) % sections.length, homeSettings.autoScrollStepMs, false, 1),
    cancelMove: renderSelection,
  });

  const runIntro = async () => {
    title.textContent = '';
    prefix.textContent = '';
    sectionText.textContent = '';
    document.documentElement.classList.remove('home-typing');
    if (!(await writeText(title, 'Hi, I’m Célian.', homeSettings.titleCharacterMs, abort.signal))) return;
    if (!(await wait(homeSettings.betweenLinesMs, abort.signal))) return;
    if (!(await writeText(prefix, 'Feel free to check my ', homeSettings.sentenceCharacterMs, abort.signal))) return;
    if (!(await writeText(sectionText, sections[selected].label, homeSettings.sectionCharacterMs, abort.signal))) return;
    document.documentElement.classList.remove('home-typing');
    if (!(await wait(homeSettings.beforeDemonstrationMs, abort.signal))) return;

    demonstrating = true;
    for (const next of [1, 2, 3, 2, 1, homeSettings.defaultSection]) {
      if (abort.signal.aborted) return;
      await moveTo(next, homeSettings.demonstrationStepMs);
      if (!(await wait(32, abort.signal))) return;
    }
    introRunning = false;
    demonstrating = false;
    clearSkip();
    autoSelection.start();
  };

  const userMove = (direction: number) => {
    finishIntro();
    autoSelection.userActivity();
    const next = (selected + direction + sections.length) % sections.length;
    void moveTo(next, homeSettings.selectionStepMs, true, direction);
  };

  const stopGestures = listenToGestures({
    actions: { up: () => userMove(-1), down: () => userMove(1) },
    touchRoot: home,
    thresholdPx: homeSettings.wheelGestureThreshold,
    gestureGapMs: homeSettings.wheelGestureGapMs,
    cooldownMs: homeSettings.wheelCooldownMs,
    releaseGapMs: homeSettings.wheelReleaseGapMs,
    initialWheelAt: earlyWheelAt,
    accumulate: false,
  });

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target instanceof HTMLElement &&
      (event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(event.target.tagName))) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      userMove(1);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      userMove(-1);
    } else if (event.key === 'Enter' && !(event.target instanceof HTMLAnchorElement)) {
      track.querySelector<HTMLAnchorElement>('a')?.click();
    }
  };

  const onShortcutClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('[data-section-shortcut]') : null;
    if (target) finishIntro();
  };

  window.addEventListener('keydown', onKeyDown);
  home.addEventListener('click', onShortcutClick);
  const onWheel = () => autoSelection.userActivity();
  const onTouchStart = () => autoSelection.userActivity();
  home.addEventListener('wheel', onWheel, { capture: true, passive: true });
  home.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
  const selector = home.querySelector<HTMLElement>('.selector-window')!;
  const onMouseEnter = () => {
    autoSelection.pause();
    if (demonstrating) finishIntro();
  };
  const onMouseLeave = () => autoSelection.resume();
  selector.addEventListener('mouseenter', onMouseEnter);
  selector.addEventListener('mouseleave', onMouseLeave);
  updateShortcuts();

  const photo = (window as HomeWindow).__portfolioHomePhoto;
  if (photo) {
    document.documentElement.style.setProperty('--home-image', `url("${photo.url}")`);
    const image = new Image();
    image.onload = () => background.classList.add('is-loaded');
    image.src = photo.url;
    if (image.complete && image.naturalWidth > 0) background.classList.add('is-loaded');
  }

  if (reducedMotion) {
    document.documentElement.classList.remove('home-typing');
    renderSelection();
    if (earlyDirection) userMove(earlyDirection);
  } else if (earlyDirection) {
    finishIntro();
    userMove(earlyDirection);
  } else {
    clearSkip = setSkippableAnimation(finishIntro);
    void runIntro();
  }

  cleanup = () => {
    abort.abort();
    clearTypingCursor();
    selectionAnimation?.cancel();
    clearSkip();
    stopGestures();
    autoSelection.stop();
    window.removeEventListener('keydown', onKeyDown);
    home.removeEventListener('click', onShortcutClick);
    home.removeEventListener('wheel', onWheel, true);
    home.removeEventListener('touchstart', onTouchStart, true);
    selector.removeEventListener('mouseenter', onMouseEnter);
    selector.removeEventListener('mouseleave', onMouseLeave);
    activeHome = undefined;
    cleanup = undefined;
  };
}

document.addEventListener('astro:page-load', initHome);
document.addEventListener('astro:before-swap', () => cleanup?.());
initHome();
