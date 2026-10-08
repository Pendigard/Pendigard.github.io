export function clearTypingCursor() {
  document.querySelectorAll<HTMLElement>('.typing-cursor').forEach((element) => {
    element.classList.remove('typing-cursor');
  });
}

export function wait(ms: number, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve(false);
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve(true);
    }, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      resolve(false);
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export async function writeText(element: HTMLElement, value: string, characterMs: number, signal: AbortSignal) {
  clearTypingCursor();
  element.classList.add('typing-cursor');
  try {
    for (const character of Array.from(value)) {
      if (signal.aborted) return false;
      element.textContent += character;
      if (!(await wait(characterMs, signal))) return false;
    }
    return true;
  } finally {
    element.classList.remove('typing-cursor');
  }
}
