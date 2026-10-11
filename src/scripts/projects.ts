import { animateSlidePair, updateSlideIndicator } from './section-motion';
import { listenToGestures } from './gestures';
import { projectSettings } from '../sections/projects/settings';
import { finishHomeReturn, prepareHomeReturn, writeHomeReturn } from './home-return';
import { getProjectOrigin, saveProjectOrigin } from './projects-state';
import { setSkippableAnimation } from './skippable';
import { clearTypingCursor, wait, writeText } from './typewriter';

let cleanup: (() => void) | undefined;
let activeRoot: HTMLElement | undefined;

function initProjects() {
  const root = document.querySelector<HTMLElement>('[data-projects]');
  if (root && root === activeRoot) return;
  cleanup?.();
  if (!root) return;
  activeRoot = root;

  const frame = root.querySelector<HTMLElement>('[data-list-frame]')!;
  const heading = root.querySelector<HTMLElement>('.projects-heading')!;
  const source = root.querySelector<HTMLElement>('[data-projects-source]')!;
  const measure = root.querySelector<HTMLElement>('[data-projects-measure]')!;
  const host = root.querySelector<HTMLElement>('[data-projects-slides]')!;
  const eyebrow = root.querySelector<HTMLElement>('[data-projects-eyebrow]')!;
  const title = root.querySelector<HTMLElement>('[data-projects-title]')!;
  const selector = root.querySelector<HTMLElement>('[data-projects-selector]')!;
  const prefix = root.querySelector<HTMLElement>('[data-filter-prefix]')!;
  const suffix = root.querySelector<HTMLElement>('[data-filter-suffix]')!;
  const candidateWindow = root.querySelector<HTMLElement>('.projects-candidate-window')!;
  const track = root.querySelector<HTMLElement>('[data-candidate-track]')!;
  const nextButton = root.querySelector<HTMLButtonElement>('[data-next-candidate]')!;
  const announcement = root.querySelector<HTMLOutputElement>('[data-projects-announcement]')!;
  const indicator = document.querySelector<HTMLElement>('[data-slide-indicator]')!;
  const homeLink = document.querySelector<HTMLAnchorElement>('[data-home-return]')!;
  const articles = [...source.querySelectorAll<HTMLElement>('[data-project-id]')];
  const originalText = new Map<HTMLElement, string>();
  articles.forEach((article) => article.querySelectorAll<HTMLElement>('[data-typewriter]')
    .forEach((field) => originalText.set(field, field.textContent || '')));
  const filters = ['All', ...JSON.parse(root.dataset.filters || '[]') as string[]];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const origin = getProjectOrigin();
  let filter = origin && filters.includes(origin.filter) ? origin.filter : 'All';
  let current = 0;
  let slides: HTMLElement[] = [];
  let candidateIndex = 0;
  let selectorAnimation: Animation | undefined;
  let slideAnimations: Animation[] = [];
  let lineAnimation: Animation | undefined;
  let typingAbort: AbortController | undefined;
  let demoAbort: AbortController | undefined;
  let clearSkip = () => {};
  let moving = false;
  let leaving = false;
  let introPending = !origin && !reducedMotion;
  const revealed = new Set(origin?.revealedProjects || []);

  const candidates = () => filters.filter((item) => item !== filter);
  const candidate = () => candidates()[candidateIndex % candidates().length];
  const candidateButton = (name: string) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.candidate = '';
    button.textContent = name;
    button.setAttribute('aria-label', `Show ${name} projects`);
    return button;
  };
  const renderCandidate = () => {
    selectorAnimation?.cancel();
    selectorAnimation = undefined;
    const button = candidateButton(candidate());
    track.replaceChildren(button);
    candidateWindow.style.width = `${button.getBoundingClientRect().width}px`;
  };
  const cycleCandidate = async (step: number, announce = true) => {
    if (announce) demoAbort?.abort();
    const options = candidates();
    if (options.length < 2) return;
    const hadFocus = selector.contains(document.activeElement);
    const from = candidate();
    candidateIndex = (candidateIndex + step + options.length) % options.length;
    const to = candidate();
    const height = track.parentElement!.getBoundingClientRect().height;
    const outgoing = candidateButton(from);
    outgoing.tabIndex = -1;
    outgoing.setAttribute('aria-hidden', 'true');
    const incoming = candidateButton(to);
    track.replaceChildren(...(step > 0 ? [outgoing, incoming] : [incoming, outgoing]));
    candidateWindow.style.width = `${incoming.getBoundingClientRect().width}px`;
    selectorAnimation?.cancel();
    if (!reducedMotion) {
      const start = step > 0 ? 0 : -height;
      const end = step > 0 ? -height : 0;
      const animation = track.animate(
        [{ transform: `translateY(${start}px)` }, { transform: `translateY(${end}px)` }],
        { duration: projectSettings.selector.stepMs, easing: projectSettings.selector.easing, fill: 'forwards' },
      );
      selectorAnimation = animation;
      try { await animation.finished; } catch { return; }
      if (selectorAnimation !== animation) return;
    }
    renderCandidate();
    if (hadFocus) track.querySelector('button')?.focus({ preventScroll: true });
    if (announce) announcement.value = `${to} selected. Activate to filter projects.`;
  };
  const runDemo = async () => {
    demoAbort?.abort();
    if (reducedMotion || candidates().length < 2) return;
    const abort = new AbortController();
    demoAbort = abort;
    if (!(await wait(projectSettings.selector.demoDelayMs, abort.signal))) return;
    for (let index = 0; index < projectSettings.selector.demoSteps; index += 1) {
      if (abort.signal.aborted) return;
      await cycleCandidate(1, false);
      if (!(await wait(projectSettings.selector.demoPauseMs, abort.signal))) return;
    }
    demoAbort = undefined;
  };

  const fieldsOf = (article: HTMLElement) => [...article.querySelectorAll<HTMLElement>('[data-typewriter]')];
  const layoutFieldsOf = (article: HTMLElement) => [...article.querySelectorAll<HTMLElement>(
    'h2, .project-secondary-links, .project-description, .project-context, .project-skills, .project-technologies',
  )];
  const updateListTop = () => {
    root.classList.toggle('is-long-filter', filter.length >= 16);
    const gap = matchMedia('(max-width: 640px)').matches
      ? projectSettings.layout.headingListGapPx.mobile : projectSettings.layout.headingListGapPx.desktop;
    const top = heading.getBoundingClientRect().bottom - root.getBoundingClientRect().top + gap;
    root.style.setProperty('--projects-list-safe-top', `${top}px`);
  };
  const restoreArticle = (article: HTMLElement) => {
    fieldsOf(article).forEach((field) => { field.textContent = originalText.get(field)!; });
    article.querySelector<HTMLElement>('.project-rule')!.style.transform = '';
  };
  const prepareSlide = (index: number) => {
    slides[index]?.querySelectorAll<HTMLElement>('[data-project-id]').forEach((article) => {
      if (revealed.has(article.dataset.projectId!)) return;
      fieldsOf(article).forEach((field) => { field.textContent = ''; });
      article.querySelector<HTMLElement>('.project-rule')!.style.transform = 'scaleX(0)';
    });
  };
  const updateIndicator = () => {
    updateSlideIndicator(indicator, current, slides.length);
  };
  const buildSlides = (keepSlug?: string) => {
    articles.forEach((article) => {
      restoreArticle(article);
      article.style.minHeight = '';
      layoutFieldsOf(article).forEach((field) => { field.style.minHeight = ''; });
      source.append(article);
    });
    const matching = articles.filter((article) => filter === 'All' ||
      (JSON.parse(article.dataset.tags || '[]') as string[]).includes(filter));
    measure.append(...matching);
    const measured = new Map(matching.map((article) => [article, {
      height: article.getBoundingClientRect().height,
      fieldHeights: layoutFieldsOf(article).map((field) => field.getBoundingClientRect().height),
    }]));
    const available = Math.max(1, frame.clientHeight * projectSettings.layout.maxSlideFill);
    const groups: HTMLElement[][] = [];
    let group: HTMLElement[] = [];
    let used = 0;
    for (const article of matching) {
      const height = measured.get(article)!.height;
      if (group.length && used + height > available) { groups.push(group); group = []; used = 0; }
      group.push(article);
      used += height;
    }
    if (group.length) groups.push(group);
    matching.forEach((article) => {
      const sizes = measured.get(article)!;
      article.style.minHeight = `${sizes.height}px`;
      layoutFieldsOf(article).forEach((field, index) => {
        field.style.minHeight = `${sizes.fieldHeights[index]}px`;
      });
    });
    host.replaceChildren();
    slides = groups.map((items, index) => {
      const slide = document.createElement('section');
      slide.className = 'projects-slide';
      slide.dataset.slide = String(index);
      slide.setAttribute('aria-label', `${filter} projects, slide ${index + 1}`);
      const list = document.createElement('div');
      list.className = 'projects-slide-list';
      list.append(...items);
      slide.append(list);
      host.append(slide);
      return slide;
    });
    current = keepSlug ? Math.max(0, slides.findIndex((slide) =>
      !!slide.querySelector(`[data-project-id="${keepSlug}"]`))) : 0;
    slides.forEach((slide, index) => {
      const active = index === current;
      slide.classList.toggle('is-active', active);
      slide.inert = !active;
      slide.setAttribute('aria-hidden', String(!active));
    });
    updateIndicator();
  };
  const finishCurrent = () => {
    const interruptedIntro = introPending;
    introPending = false;
    typingAbort?.abort();
    lineAnimation?.cancel();
    lineAnimation = undefined;
    clearSkip();
    clearTypingCursor();
    title.textContent = `${filter}.`;
    eyebrow.textContent = 'Projects.';
    eyebrow.dataset.written = 'true';
    prefix.textContent = 'You can also look at ';
    suffix.textContent = ' projects.';
    if (interruptedIntro) renderCandidate();
    nextButton.hidden = false;
    document.documentElement.classList.remove('projects-typing');
    slides[current]?.querySelectorAll<HTMLElement>('[data-project-id]').forEach((article) => {
      restoreArticle(article);
      revealed.add(article.dataset.projectId!);
    });
    if (current === 0) finishHomeReturn();
  };
  const revealCurrent = async (writeHeader = false) => {
    const slide = slides[current];
    if (!slide) return;
    const abort = new AbortController();
    typingAbort = abort;
    const items = [...slide.querySelectorAll<HTMLElement>('[data-project-id]')]
      .filter((article) => !revealed.has(article.dataset.projectId!));
    if (reducedMotion) {
      document.documentElement.classList.remove('projects-typing');
      items.forEach((article) => revealed.add(article.dataset.projectId!));
      return;
    }
    prepareSlide(current);
    const writeIntro = introPending;
    if (writeHeader) {
      if (eyebrow.dataset.written !== 'true') eyebrow.textContent = '';
      title.textContent = '';
      if (writeIntro) {
        prefix.textContent = '';
        track.querySelector<HTMLElement>('[data-candidate]')!.textContent = '';
        suffix.textContent = '';
        nextButton.hidden = true;
      }
    }
    document.documentElement.classList.remove('projects-typing');
    clearSkip = setSkippableAnimation(finishCurrent);
    if (writeHeader) {
      if (eyebrow.dataset.written !== 'true') {
        if (!(await writeText(eyebrow, 'Projects.', projectSettings.writing.eyebrowMs, abort.signal))) return;
        eyebrow.dataset.written = 'true';
        if (!(await wait(projectSettings.betweenFieldsMs, abort.signal))) return;
      }
      if (!(await writeText(title, `${filter}.`, projectSettings.writing.titleMs, abort.signal))) return;
      if (writeIntro) {
        if (!(await wait(projectSettings.betweenFieldsMs, abort.signal))) return;
        if (!(await writeText(prefix, 'You can also look at ', projectSettings.writing.selectorMs, abort.signal))) return;
        if (!(await wait(projectSettings.betweenFieldsMs, abort.signal))) return;
        const candidateField = track.querySelector<HTMLElement>('[data-candidate]')!;
        if (!(await writeText(candidateField, candidate(), projectSettings.writing.selectorMs, abort.signal))) return;
        if (!(await wait(projectSettings.betweenFieldsMs, abort.signal))) return;
        if (!(await writeText(suffix, ' projects.', projectSettings.writing.selectorMs, abort.signal))) return;
        nextButton.hidden = false;
        introPending = false;
        void runDemo();
      }
    }
    for (const article of items) {
      const line = article.querySelector<HTMLElement>('.project-rule')!;
      lineAnimation = line.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
        { duration: projectSettings.lineDrawMs, easing: projectSettings.lineDrawEasing, fill: 'forwards' });
      try { await lineAnimation.finished; } catch { return; }
      if (abort.signal.aborted) return;
      line.style.transform = '';
      lineAnimation.cancel();
      lineAnimation = undefined;
      for (const field of fieldsOf(article)) {
        if (!(await writeText(field, originalText.get(field)!, projectSettings.writing.entryMs, abort.signal))) return;
        if (!(await wait(projectSettings.betweenFieldsMs, abort.signal))) return;
      }
      revealed.add(article.dataset.projectId!);
    }
    clearSkip();
    if (!abort.signal.aborted && current === 0) await writeHomeReturn();
  };

  const returnHome = () => {
    if (leaving) return;
    leaving = true;
    finishCurrent();
    homeLink.click();
  };
  const move = async (step: number) => {
    if (moving || leaving) return;
    const next = current + step;
    if (next < 0) { returnHome(); return; }
    if (next >= slides.length) return;
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

  const applyFilter = async (nextFilter: string) => {
    if (moving || nextFilter === filter) return;
    moving = true;
    demoAbort?.abort();
    finishCurrent();
    const outgoing = slides[current]?.cloneNode(true) as HTMLElement | undefined;
    filter = nextFilter;
    title.textContent = `${filter}.`;
    title.style.visibility = reducedMotion ? '' : 'hidden';
    updateListTop();
    candidateIndex = 0;
    renderCandidate();
    revealed.clear();
    buildSlides();
    prepareSlide(0);
    if (outgoing && !reducedMotion) {
      outgoing.classList.add('is-active');
      outgoing.inert = true;
      outgoing.setAttribute('aria-hidden', 'true');
      host.append(outgoing);
      const incoming = slides[0];
      const timing: KeyframeAnimationOptions = { duration: projectSettings.slideMoveMs, easing: projectSettings.slideMoveEasing, fill: 'forwards' };
      slideAnimations = [
        outgoing.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }], timing),
        incoming.animate([{ transform: 'translateY(-100%)' }, { transform: 'translateY(0)' }], timing),
      ];
      clearSkip = setSkippableAnimation(() => slideAnimations.forEach((animation) => animation.finish()));
      try { await Promise.all(slideAnimations.map((animation) => animation.finished)); } catch { return; }
      clearSkip();
      slideAnimations.forEach((animation) => animation.cancel());
      slideAnimations = [];
      outgoing.remove();
    }
    title.textContent = reducedMotion ? `${filter}.` : '';
    title.style.visibility = '';
    moving = false;
    announcement.value = `${filter} projects, slide 1 of ${slides.length}.`;
    void revealCurrent(true);
    void runDemo();
  };

  const stopGestures = listenToGestures({
    actions: { up: () => void move(-1), down: () => void move(1) },
    zones: [{
      element: selector,
      actions: { up: () => void cycleCandidate(-1), down: () => void cycleCandidate(1) },
      thresholdPx: projectSettings.selector.wheelThreshold,
      touchThresholdPx: projectSettings.selector.touchThresholdPx,
    }],
    touchRoot: root,
    thresholdPx: projectSettings.wheelThreshold,
    gestureGapMs: projectSettings.wheelGestureGapMs,
    cooldownMs: projectSettings.wheelLockMinMs,
    touchThresholdPx: projectSettings.gesture.touchSlideThresholdPx,
  });
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target instanceof HTMLElement && event.target.isContentEditable) return;
    if (selector.contains(event.target as Node) && ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.key)) {
      event.preventDefault();
      void cycleCandidate(event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1);
      return;
    }
    if (event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(event.target.tagName)) return;
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      void move(event.key === 'ArrowDown' ? 1 : -1);
    }
  };
  const onSelectorClick = (event: MouseEvent) => {
    if (event.target instanceof Element && event.target.closest('[data-next-candidate]')) { void cycleCandidate(1); return; }
    if (event.target instanceof Element && event.target.closest('[data-candidate]')) void applyFilter(candidate());
  };
  const onProjectClick = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>('a[href]');
    const article = link?.closest<HTMLElement>('[data-project-id]');
    if (!link || !article) return;
    if (new URL(link.href).pathname === `/projects/${article.dataset.projectId}/`) {
      finishCurrent();
      saveProjectOrigin({ slug: article.dataset.projectId!, filter, slide: current, revealedProjects: [...revealed] });
    }
  };
  let resizeTimer = 0;
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (moving) return;
      if (introPending) return;
      finishCurrent();
      const keepSlug = slides[current]?.querySelector<HTMLElement>('[data-project-id]')?.dataset.projectId;
      updateListTop();
      buildSlides(keepSlug);
      void revealCurrent();
    }, projectSettings.resizeDebounceMs);
  };

  title.textContent = `${filter}.`;
  updateListTop();
  root.classList.add('is-enhanced');
  buildSlides();
  if (origin) {
    current = Math.min(origin.slide, slides.length - 1);
    slides.forEach((slide, index) => {
      slide.classList.toggle('is-active', index === current);
      slide.inert = index !== current;
      slide.setAttribute('aria-hidden', String(index !== current));
    });
    updateIndicator();
    title.textContent = `${filter}.`;
    eyebrow.dataset.written = 'true';
    finishHomeReturn();
  } else {
    prepareHomeReturn();
  }
  renderCandidate();
  if (origin || reducedMotion) document.documentElement.classList.remove('projects-typing');
  selector.addEventListener('click', onSelectorClick);
  root.addEventListener('click', onProjectClick);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', onResize);
  void revealCurrent(!origin);

  cleanup = () => {
    typingAbort?.abort();
    demoAbort?.abort();
    selectorAnimation?.cancel();
    slideAnimations.forEach((animation) => animation.cancel());
    lineAnimation?.cancel();
    clearSkip();
    clearTypingCursor();
    document.documentElement.classList.remove('projects-typing');
    finishHomeReturn();
    stopGestures();
    window.clearTimeout(resizeTimer);
    selector.removeEventListener('click', onSelectorClick);
    root.removeEventListener('click', onProjectClick);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('resize', onResize);
    activeRoot = undefined;
    cleanup = undefined;
  };
}

document.addEventListener('astro:page-load', initProjects);
document.addEventListener('astro:before-swap', () => cleanup?.());
initProjects();
