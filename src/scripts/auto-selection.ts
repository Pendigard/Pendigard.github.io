interface AutoSelectionOptions {
  intervalMs: number;
  afterUserMs: number;
  enabled: boolean;
  move: () => Promise<unknown> | void;
  cancelMove?: () => void;
}

/** A single recurring hint, postponed by manual interaction and paused off screen. */
export function createAutoSelection({ intervalMs, afterUserMs, enabled, move, cancelMove }: AutoSelectionOptions) {
  let started = false;
  let stopped = false;
  let timer = 0;
  let lastUserAt = -Infinity;
  let hovered = false;
  let running = false;

  const schedule = (delayMs: number) => {
    window.clearTimeout(timer);
    if (!enabled || stopped || document.hidden || hovered) return;
    timer = window.setTimeout(() => {
      running = true;
      void Promise.resolve(move()).catch(() => {}).finally(() => { running = false; });
      schedule(intervalMs);
    }, Math.max(0, delayMs));
  };

  const start = () => {
    if (started || stopped || !enabled) return;
    started = true;
    schedule(Math.max(intervalMs, lastUserAt + afterUserMs - performance.now()));
  };

  const userActivity = () => {
    if (stopped || !enabled) return;
    lastUserAt = performance.now();
    started = true;
    schedule(afterUserMs);
  };

  const onVisibilityChange = () => {
    if (!started) return;
    if (document.hidden) window.clearTimeout(timer);
    else schedule(Math.max(intervalMs, lastUserAt + afterUserMs - performance.now()));
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  return {
    start,
    userActivity,
    pause: () => {
      hovered = true;
      window.clearTimeout(timer);
      if (running) cancelMove?.();
    },
    resume: () => {
      hovered = false;
      if (started) schedule(Math.max(intervalMs, lastUserAt + afterUserMs - performance.now()));
    },
    stop: () => {
      stopped = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    },
  };
}
