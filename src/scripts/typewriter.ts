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

// Replaces characters in place from left to right, including strings of different lengths.
// A cancelled replacement can be restarted from the currently displayed text.
export async function replaceText(element: HTMLElement, value: string, characterMs: number, signal: AbortSignal) {
  const source = Array.from(element.textContent || '');
  const target = Array.from(value);
  if (source.join('') === value) return true;
  clearTypingCursor();
  element.classList.add('typing-cursor');
  try {
    const steps = Math.max(source.length, target.length);
    for (let index = 1; index <= steps; index += 1) {
      if (signal.aborted) return false;
      // Spread both scripts across the whole transition: a shorter CJK phrase
      // should not finish appearing halfway through a longer Latin sentence.
      const targetIndex = Math.ceil(index * target.length / steps);
      const sourceIndex = Math.ceil(index * source.length / steps);
      element.textContent = target.slice(0, targetIndex).join('') + source.slice(sourceIndex).join('');
      if (!(await wait(characterMs, signal))) return false;
    }
    element.textContent = value;
    return true;
  } finally {
    element.classList.remove('typing-cursor');
  }
}
