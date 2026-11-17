// Scheduling only: never draw randomness or reorder simulation operations.
export async function yieldToBrowser(): Promise<void> {
  const scheduler = (globalThis as any).scheduler;
  if (typeof scheduler?.yield === 'function') {
    try {
      await scheduler.yield();
      return;
    } catch {
      // A host scheduling failure must not interrupt a partially applied day.
    }
  }
  if (typeof MessageChannel !== 'undefined') {
    try {
      await new Promise<void>(resolve => {
        const channel = new MessageChannel();
        channel.port1.onmessage = () => {
          channel.port1.close();
          channel.port2.close();
          resolve();
        };
        channel.port2.postMessage(null);
      });
      return;
    } catch {
      // Older/restricted hosts can reject channel creation too.
    }
  }
  await new Promise<void>(resolve => setTimeout(resolve, 0));
}

export async function runCooperatively<T>(
  steps: Iterator<void, T, unknown>,
  pause: () => Promise<void> = yieldToBrowser,
  budgetMS = 8,
): Promise<T> {
  let start = performance.now();
  for (;;) {
    const next = steps.next();
    if (next.done) return next.value;
    if (performance.now() - start >= budgetMS) {
      await pause();
      start = performance.now();
    }
  }
}
